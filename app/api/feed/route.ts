import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getUser } from "@/lib/supabase/server"

/**
 * Smart Feed API - Personalized Phrase Recommendations
 *
 * This endpoint generates a personalized feed of phrases based on:
 * 1. User's learning progress and goals
 * 2. Bookmark patterns
 * 3. AI chat history topics
 * 4. Community engagement (likes, trending)
 * 5. Category completion progress
 * 6. Time of day and study patterns
 */

interface RecommendationScore {
  phrase_id: string
  score: number
  reasons: string[]
}

export async function GET(request: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")
    const filter = searchParams.get("filter") || "personalized" // personalized, trending, popular, new

    // Fetch all required data in parallel
    const [
      { data: allPhrases },
      { data: userProgress },
      { data: bookmarks },
      { data: conversations },
      { data: profile },
      { data: engagement },
      { data: userLikes },
    ] = await Promise.all([
      supabase.from("phrases").select("*"),
      supabase.from("phrase_progress").select("*").eq("user_id", user.id),
      supabase.from("bookmarks").select("phrase_id").eq("user_id", user.id),
      supabase
        .from("ai_conversations")
        .select("title, context")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("phrase_engagement").select("*"),
      supabase.from("phrase_likes").select("phrase_id").eq("user_id", user.id),
    ])

    if (!allPhrases) {
      return NextResponse.json({ error: "Failed to fetch phrases" }, { status: 500 })
    }

    // Build user context
    const userContext = {
      progressMap: new Map(userProgress?.map((p) => [p.phrase_id, p]) || []),
      bookmarkSet: new Set(bookmarks?.map((b) => b.phrase_id) || []),
      likedSet: new Set(userLikes?.map((l) => l.phrase_id) || []),
      engagementMap: new Map(engagement?.map((e) => [e.phrase_id, e]) || []),
      conversations: conversations || [],
      dailyGoal: profile?.daily_goal || 5,
      targetLanguage: profile?.target_language || "shona",
      level: getUserLevel(userProgress || []),
    }

    // Calculate scores for each phrase based on filter
    let scoredPhrases: RecommendationScore[]

    switch (filter) {
      case "trending":
        scoredPhrases = calculateTrendingScores(allPhrases, userContext)
        break
      case "popular":
        scoredPhrases = calculatePopularScores(allPhrases, userContext)
        break
      case "new":
        scoredPhrases = calculateNewLearnerScores(allPhrases, userContext)
        break
      case "personalized":
      default:
        scoredPhrases = calculatePersonalizedScores(allPhrases, userContext)
        break
    }

    // Sort by score and apply pagination
    const sortedPhrases = scoredPhrases
      .sort((a, b) => b.score - a.score)
      .slice(offset, offset + limit)

    // Fetch full phrase data for top scores
    const phraseIds = sortedPhrases.map((sp) => sp.phrase_id)
    const { data: recommendedPhrases } = await supabase
      .from("phrases")
      .select("*")
      .in("id", phraseIds)

    // Merge phrases with scores and reasons
    const results = recommendedPhrases?.map((phrase) => {
      const scored = sortedPhrases.find((sp) => sp.phrase_id === phrase.id)
      return {
        ...phrase,
        recommendation_score: scored?.score || 0,
        recommendation_reasons: scored?.reasons || [],
        engagement: userContext.engagementMap.get(phrase.id) || null,
        user_progress: userContext.progressMap.get(phrase.id) || null,
        is_bookmarked: userContext.bookmarkSet.has(phrase.id),
        is_liked: userContext.likedSet.has(phrase.id),
      }
    })

    // Track recommendations for analytics
    if (results && results.length > 0) {
      const recommendations = results.map((phrase) => ({
        user_id: user.id,
        phrase_id: phrase.id,
        recommendation_reason: phrase.recommendation_reasons[0] || filter,
        recommendation_score: phrase.recommendation_score,
      }))

      // Insert in background (don't await)
      supabase.from("phrase_recommendations").insert(recommendations).then()
    }

    return NextResponse.json({
      phrases: results || [],
      filter,
      total: scoredPhrases.length,
      offset,
      limit,
      has_more: offset + limit < scoredPhrases.length,
    })
  } catch (error) {
    console.error("Feed API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ============================================================================
// SCORING ALGORITHMS
// ============================================================================

function calculatePersonalizedScores(phrases: any[], context: any): RecommendationScore[] {
  return phrases.map((phrase) => {
    let score = 50 // Base score
    const reasons: string[] = []

    const progress = context.progressMap.get(phrase.id)
    const engagement = context.engagementMap.get(phrase.id)
    const isBookmarked = context.bookmarkSet.has(phrase.id)
    const isLiked = context.likedSet.has(phrase.id)

    // 1. Prioritize phrases user is actively learning (not mastered)
    if (progress) {
      if (progress.status === "learning") {
        score += 30
        reasons.push("currently_learning")
      } else if (progress.status === "practiced") {
        score += 20
        reasons.push("needs_practice")
      } else if (progress.status === "mastered") {
        score -= 40 // De-prioritize mastered
        reasons.push("already_mastered")
      }
    } else {
      score += 15 // New phrases are good
      reasons.push("new_phrase")
    }

    // 2. Bookmarked phrases get priority
    if (isBookmarked) {
      score += 25
      reasons.push("bookmarked")
    }

    // 3. Liked phrases (user showed interest)
    if (isLiked) {
      score += 15
      reasons.push("liked")
    }

    // 4. Community engagement signals quality
    if (engagement) {
      if (engagement.like_count > 10) {
        score += 10
        reasons.push("popular")
      }
      if (engagement.mastery_count > 5) {
        score += 8
        reasons.push("learnable")
      }
    }

    // 5. Category diversity - don't show too many from same category
    if (phrase.category === "greetings" || phrase.category === "basics") {
      score += 5
      reasons.push("essential_category")
    }

    // 6. Match AI conversation topics
    const conversationTopics = context.conversations
      .map((c: any) => c.title?.toLowerCase() || "")
      .join(" ")

    if (conversationTopics.includes(phrase.category)) {
      score += 12
      reasons.push("matches_ai_practice")
    }

    // 7. Level appropriateness
    if (context.level === "beginner" && (phrase.category === "greetings" || phrase.category === "basics")) {
      score += 10
      reasons.push("level_appropriate")
    }

    return {
      phrase_id: phrase.id,
      score: Math.max(0, Math.min(100, score)),
      reasons,
    }
  })
}

function calculateTrendingScores(phrases: any[], context: any): RecommendationScore[] {
  return phrases.map((phrase) => {
    let score = 0
    const reasons: string[] = ["trending"]

    const engagement = context.engagementMap.get(phrase.id)

    if (engagement) {
      // Weight recent engagement heavily
      const daysSinceEngagement = engagement.last_engaged_at
        ? Math.floor((Date.now() - new Date(engagement.last_engaged_at).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      if (daysSinceEngagement < 7) {
        score += 50 - daysSinceEngagement * 5
        reasons.push("recent_activity")
      }

      // Like velocity
      score += Math.min(engagement.like_count * 2, 30)

      // Practice velocity
      score += Math.min(engagement.practice_count, 20)
    }

    // Don't show if user already mastered
    const progress = context.progressMap.get(phrase.id)
    if (progress?.status === "mastered") {
      score -= 50
    }

    return {
      phrase_id: phrase.id,
      score: Math.max(0, Math.min(100, score)),
      reasons,
    }
  })
}

function calculatePopularScores(phrases: any[], context: any): RecommendationScore[] {
  return phrases.map((phrase) => {
    let score = 0
    const reasons: string[] = ["popular"]

    const engagement = context.engagementMap.get(phrase.id)

    if (engagement) {
      // Pure popularity
      score += Math.min(engagement.like_count * 3, 40)
      score += Math.min(engagement.bookmark_count * 2, 30)
      score += Math.min(engagement.mastery_count * 1.5, 20)
      reasons.push(`${engagement.like_count}_likes`)
    }

    // Slight bonus if user hasn't seen it
    if (!context.progressMap.has(phrase.id)) {
      score += 10
      reasons.push("discover")
    }

    return {
      phrase_id: phrase.id,
      score: Math.max(0, Math.min(100, score)),
      reasons,
    }
  })
}

function calculateNewLearnerScores(phrases: any[], context: any): RecommendationScore[] {
  return phrases.map((phrase) => {
    let score = 50
    const reasons: string[] = ["new_learner"]

    // Prioritize essential categories
    if (phrase.category === "greetings") {
      score += 30
      reasons.push("essential_greetings")
    } else if (phrase.category === "basics" || phrase.category === "common-phrases") {
      score += 20
      reasons.push("essential_basics")
    }

    // Already learned? Lower priority
    const progress = context.progressMap.get(phrase.id)
    if (progress) {
      if (progress.status === "mastered") {
        score -= 40
      } else if (progress.status === "practiced") {
        score -= 20
      }
    } else {
      reasons.push("not_started")
    }

    // Community validation
    const engagement = context.engagementMap.get(phrase.id)
    if (engagement?.mastery_count > 10) {
      score += 15
      reasons.push("proven_learnable")
    }

    return {
      phrase_id: phrase.id,
      score: Math.max(0, Math.min(100, score)),
      reasons,
    }
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getUserLevel(progress: any[]): "beginner" | "intermediate" | "advanced" {
  const masteredCount = progress.filter((p) => p.status === "mastered").length

  if (masteredCount < 20) return "beginner"
  if (masteredCount < 50) return "intermediate"
  return "advanced"
}
