import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import type { SkillName, ProficiencyLevel } from "@/lib/types/skills"
import { calculateProficiencyLevel } from "@/lib/data/diagnostic-assessment"

interface DiagnosticResults {
  answers: Record<string, string>
  scores: Record<SkillName, number>
  overallScore: number
  completedAt: string
  timeSpent: number
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const results: DiagnosticResults = await req.json()

    // Validate the results
    if (!results.scores || !results.answers) {
      return NextResponse.json(
        { error: "Invalid assessment results" },
        { status: 400 }
      )
    }

    // Get all skills from database
    const { data: skills, error: skillsError } = await supabase
      .from("skills")
      .select("id, name")
      .eq("is_active", true)

    if (skillsError || !skills) {
      console.error("[submit-diagnostic] Error fetching skills:", skillsError)
      return NextResponse.json(
        { error: "Failed to fetch skills" },
        { status: 500 }
      )
    }

    // Create skill name to ID mapping
    const skillMap = skills.reduce((acc, skill) => {
      acc[skill.name as SkillName] = skill.id
      return acc
    }, {} as Record<SkillName, string>)

    // Get or create diagnostic assessment record
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id")
      .eq("type", "diagnostic")
      .single()

    let assessmentId: string

    if (assessmentError || !assessment) {
      // Create diagnostic assessment if it doesn't exist
      // Diagnostic assessments test all skills - we use the first skill as reference
      // but create separate user_assessments for each skill
      const firstSkillId = Object.values(skillMap)[0]

      if (!firstSkillId) {
        console.error("[submit-diagnostic] No skills found in database")
        return NextResponse.json(
          { error: "No skills configured in database" },
          { status: 500 }
        )
      }

      const { data: newAssessment, error: createError } = await supabase
        .from("assessments")
        .insert({
          skill_id: firstSkillId, // Required FK - diagnostic covers all skills
          type: "diagnostic",
          target_level: "beginner", // Diagnostic determines actual level
          title: { en: "Diagnostic Assessment", shona: "Bvunzo Yekutanga", ndebele: "Ukuhlola Kokuqala", zh: "诊断评估" },
          description: { en: "Initial proficiency assessment to determine your skill levels" },
          questions: [], // Questions stored in code (lib/data/diagnostic-assessment.ts)
          passing_score: 0, // Diagnostic always passes - it's for measurement not pass/fail
          is_active: true,
        })
        .select("id")
        .single()

      if (createError || !newAssessment) {
        console.error("[submit-diagnostic] Error creating assessment:", createError)
        return NextResponse.json(
          { error: "Failed to create assessment record" },
          { status: 500 }
        )
      }

      assessmentId = newAssessment.id
    } else {
      assessmentId = assessment.id
    }

    // Store user assessment results for each skill
    const userAssessments = []
    const userSkillsUpdates = []

    for (const [skillName, score] of Object.entries(results.scores)) {
      const skillId = skillMap[skillName as SkillName]
      if (!skillId) continue

      const proficiencyLevel = calculateProficiencyLevel(score)

      // Create user_assessment record
      userAssessments.push({
        user_id: user.id,
        assessment_id: assessmentId,
        skill_id: skillId,
        answers: Object.entries(results.answers)
          .filter(([key]) => key.startsWith(skillName.slice(0, 4)))
          .map(([questionId, answer]) => ({
            question_id: questionId,
            answer,
            correct: answer !== "__skipped__", // Simplified - real scoring in frontend
          })),
        score,
        passed: true, // Diagnostic always passes
        time_taken: Math.round(results.timeSpent / 5), // Approximate per-skill time
        feedback: {
          overall: getSkillFeedback(skillName as SkillName, proficiencyLevel),
          next_steps: getNextSteps(skillName as SkillName, proficiencyLevel),
        },
        started_at: new Date(Date.now() - results.timeSpent * 1000).toISOString(),
        completed_at: results.completedAt,
      })

      // Prepare user_skills upsert
      userSkillsUpdates.push({
        user_id: user.id,
        skill_id: skillId,
        current_level: proficiencyLevel,
        current_score: score,
        total_practice_time: results.timeSpent,
        last_practiced_at: results.completedAt,
        level_achieved_at: results.completedAt,
      })
    }

    // Insert user assessments
    const { error: insertAssessmentsError } = await supabase
      .from("user_assessments")
      .insert(userAssessments)

    if (insertAssessmentsError) {
      console.error("[submit-diagnostic] Error inserting assessments:", insertAssessmentsError)
      // Continue anyway - user_skills is more important
    }

    // Upsert user_skills (this is the critical update for AI)
    for (const skillUpdate of userSkillsUpdates) {
      const { error: upsertError } = await supabase
        .from("user_skills")
        .upsert(skillUpdate, {
          onConflict: "user_id,skill_id",
        })

      if (upsertError) {
        console.error("[submit-diagnostic] Error upserting user_skill:", upsertError)
      }
    }

    // Update user profile with completed diagnostic flag
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        last_study_date: results.completedAt,
      })
      .eq("id", user.id)

    if (profileError) {
      console.error("[submit-diagnostic] Error updating profile:", profileError)
    }

    // Calculate overall proficiency
    const overallProficiency = calculateProficiencyLevel(results.overallScore)

    return NextResponse.json({
      success: true,
      results: {
        scores: results.scores,
        overallScore: results.overallScore,
        overallProficiency,
        skillLevels: Object.entries(results.scores).reduce((acc, [skill, score]) => {
          acc[skill as SkillName] = calculateProficiencyLevel(score)
          return acc
        }, {} as Record<SkillName, ProficiencyLevel>),
        timeSpent: results.timeSpent,
      },
    })
  } catch (error) {
    console.error("[submit-diagnostic] Error:", error)
    return NextResponse.json(
      { error: "Failed to submit assessment" },
      { status: 500 }
    )
  }
}

// Helper to generate skill-specific feedback (language-agnostic)
function getSkillFeedback(skill: SkillName, level: ProficiencyLevel): string {
  const feedback: Record<SkillName, Record<ProficiencyLevel, string>> = {
    pronunciation: {
      beginner: "You're just starting with the sounds. Focus on basic vowel sounds and common greetings.",
      elementary: "You recognize some sounds. Practice with audio to improve your ear.",
      intermediate: "Good pronunciation awareness! Work on unique sounds and tonal patterns.",
      advanced: "Strong pronunciation skills! Fine-tune your tones for native-like speech.",
      fluent: "Excellent pronunciation! You understand the nuances of the language's phonology.",
    },
    vocabulary: {
      beginner: "Let's build your basic vocabulary. Start with greetings and common words.",
      elementary: "You know some everyday words. Expand with family, food, and number terms.",
      intermediate: "Good vocabulary base! Add more verbs and descriptive words.",
      advanced: "Strong vocabulary! Explore idioms and cultural expressions.",
      fluent: "Impressive vocabulary! You understand idiomatic and proverbial language.",
    },
    grammar: {
      beginner: "The grammar may be different from what you know. Let's start with basic sentence structure.",
      elementary: "You understand basic patterns. Focus on verb forms and sentence construction.",
      intermediate: "Good grasp of grammar! Work on tense markers and more complex structures.",
      advanced: "Strong grammar skills! Refine complex constructions and agreement patterns.",
      fluent: "Excellent grammar! You understand the full complexity of the language structure.",
    },
    comprehension: {
      beginner: "Understanding takes practice. Start with simple greetings and responses.",
      elementary: "You can follow basic conversations. Practice with short dialogues.",
      intermediate: "Good comprehension! Challenge yourself with longer texts and conversations.",
      advanced: "Strong comprehension! Try native media and complex discussions.",
      fluent: "Excellent comprehension! You understand nuanced and rapid speech.",
    },
    conversation: {
      beginner: "Let's build your confidence in basic exchanges. Practice greetings and introductions.",
      elementary: "You can handle simple conversations. Expand to everyday situations.",
      intermediate: "Good conversational skills! Practice more complex social interactions.",
      advanced: "Strong conversation skills! Work on cultural nuances and formal registers.",
      fluent: "Excellent conversation skills! You communicate naturally and appropriately.",
    },
  }

  return feedback[skill][level]
}

// Helper to generate next steps (language-agnostic)
function getNextSteps(skill: SkillName, level: ProficiencyLevel): string[] {
  const steps: Record<ProficiencyLevel, string[]> = {
    beginner: [
      "Practice basic phrases daily",
      "Listen to audio content in your target language",
      "Learn 5 new words each day",
    ],
    elementary: [
      "Have short conversations",
      "Read simple texts in your target language",
      "Focus on common verb forms",
    ],
    intermediate: [
      "Watch videos with subtitles",
      "Practice with AI tutor regularly",
      "Learn cultural expressions",
    ],
    advanced: [
      "Engage in complex discussions",
      "Read literature in your target language",
      "Practice formal and informal registers",
    ],
    fluent: [
      "Maintain skills through regular practice",
      "Help others learn the language",
      "Explore regional dialects and variations",
    ],
  }

  return steps[level]
}
