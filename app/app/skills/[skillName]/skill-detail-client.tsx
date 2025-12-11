"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { SkillName, ProficiencyLevel } from "@/lib/types/skills"
import {
  Mic,
  BookOpen,
  Languages,
  Brain,
  MessageCircle,
  TrendingUp,
  Clock,
  ArrowLeft,
  ArrowRight,
  Target,
  History,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"

interface SkillDetailData {
  skill_name: SkillName
  display_name: string
  description: string
  current_level: ProficiencyLevel
  current_score: number
  total_practice_time: number
  last_practiced_at: string | null
  level_achieved_at: string | null
}

interface AssessmentHistory {
  id: string
  score: number
  passed: boolean
  completed_at: string
}

interface RecommendedPhrase {
  id: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  category: string
  difficulty_score: number
}

const skillIcons: Record<SkillName, React.ReactNode> = {
  pronunciation: <Mic className="h-6 w-6" />,
  vocabulary: <BookOpen className="h-6 w-6" />,
  grammar: <Languages className="h-6 w-6" />,
  comprehension: <Brain className="h-6 w-6" />,
  conversation: <MessageCircle className="h-6 w-6" />,
}

const skillDisplayNames: Record<SkillName, string> = {
  pronunciation: "Pronunciation",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  comprehension: "Comprehension",
  conversation: "Conversation",
}

const skillDescriptions: Record<SkillName, string> = {
  pronunciation: "Master the sounds, tones, and rhythm of the language. Good pronunciation is key to being understood.",
  vocabulary: "Build your word bank with essential vocabulary, expressions, and cultural phrases.",
  grammar: "Learn sentence structure, verb conjugations, and grammatical patterns for clear communication.",
  comprehension: "Develop your ability to understand spoken and written language in various contexts.",
  conversation: "Practice real-world communication skills for everyday interactions and conversations.",
}

const levelDisplayNames: Record<ProficiencyLevel, string> = {
  beginner: "Beginner",
  elementary: "Elementary",
  intermediate: "Intermediate",
  advanced: "Advanced",
  fluent: "Fluent",
}

const levelColors: Record<ProficiencyLevel, { bg: string; text: string; border: string }> = {
  beginner: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
  },
  elementary: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
  },
  intermediate: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  advanced: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
  },
  fluent: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
}

const validSkillNames: SkillName[] = ["pronunciation", "vocabulary", "grammar", "comprehension", "conversation"]

interface SkillDetailClientProps {
  skillName: string
}

export function SkillDetailClient({ skillName }: SkillDetailClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SkillDetailData | null>(null)
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistory[]>([])
  const [recommendedPhrases, setRecommendedPhrases] = useState<RecommendedPhrase[]>([])
  const [error, setError] = useState<string | null>(null)

  // Validate skill name
  const isValidSkill = validSkillNames.includes(skillName as SkillName)

  useEffect(() => {
    if (isValidSkill) {
      loadSkillData()
    } else {
      setLoading(false)
      setError(`Invalid skill: "${skillName}"`)
    }
  }, [skillName])

  const loadSkillData = async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    try {
      // Get skill from database
      const { data: skill, error: skillError } = await supabase
        .from("skills")
        .select("id, name, display_name, description")
        .eq("name", skillName)
        .single()

      if (skillError || !skill) {
        setError("Skill not found in database")
        setLoading(false)
        return
      }

      // Get user's skill data
      const { data: userSkill, error: userSkillError } = await supabase
        .from("user_skills")
        .select("current_level, current_score, total_practice_time, last_practiced_at, level_achieved_at")
        .eq("user_id", user.id)
        .eq("skill_id", skill.id)
        .single()

      // User might not have taken diagnostic yet
      if (userSkillError || !userSkill) {
        setData({
          skill_name: skillName as SkillName,
          display_name: skillDisplayNames[skillName as SkillName],
          description: skillDescriptions[skillName as SkillName],
          current_level: "beginner",
          current_score: 0,
          total_practice_time: 0,
          last_practiced_at: null,
          level_achieved_at: null,
        })
      } else {
        setData({
          skill_name: skillName as SkillName,
          display_name: skillDisplayNames[skillName as SkillName],
          description: skillDescriptions[skillName as SkillName],
          current_level: userSkill.current_level as ProficiencyLevel,
          current_score: userSkill.current_score,
          total_practice_time: userSkill.total_practice_time,
          last_practiced_at: userSkill.last_practiced_at,
          level_achieved_at: userSkill.level_achieved_at,
        })
      }

      // Get assessment history for this skill
      const { data: assessments } = await supabase
        .from("user_assessments")
        .select("id, score, passed, completed_at")
        .eq("user_id", user.id)
        .eq("skill_id", skill.id)
        .order("completed_at", { ascending: false })
        .limit(5)

      setAssessmentHistory(assessments || [])

      // Get recommended phrases based on user's level
      const maxDifficulty = Math.max(1, Math.ceil((userSkill?.current_score || 0) / 20))
      const { data: phrases } = await supabase
        .from("phrases")
        .select("id, english, shona, ndebele, chinese, category, difficulty_score")
        .lte("difficulty_score", maxDifficulty + 1)
        .gte("difficulty_score", Math.max(1, maxDifficulty - 1))
        .limit(6)

      setRecommendedPhrases(phrases || [])
    } catch (err) {
      console.error("Error loading skill data:", err)
      setError("Failed to load skill data")
    }

    setLoading(false)
  }

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getNextLevelThreshold = (currentScore: number): number => {
    if (currentScore < 50) return 50
    if (currentScore < 65) return 65
    if (currentScore < 80) return 80
    if (currentScore < 90) return 90
    return 100
  }

  // Invalid skill name
  if (!isValidSkill && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <SidebarLayout>
          <main className="container mx-auto px-4 py-12 max-w-2xl">
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Skill Not Found</h1>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  The skill &quot;{skillName}&quot; doesn&apos;t exist. Valid skills are: pronunciation, vocabulary, grammar, comprehension, and conversation.
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push("/app/skills")}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Skills Dashboard
                </Button>
              </CardContent>
            </Card>
          </main>
        </SidebarLayout>
      </div>
    )
  }

  // Error state
  if (!loading && error) {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <SidebarLayout>
          <main className="container mx-auto px-4 py-12 max-w-2xl">
            <Card className="border-2 border-red-200 dark:border-red-800">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
                <p className="text-muted-foreground mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button variant="outline" onClick={loadSkillData}>
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/app/skills")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarLayout>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <SidebarLayout>
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </main>
        </SidebarLayout>
      </div>
    )
  }

  if (!data) return null

  const colors = levelColors[data.current_level]
  const nextThreshold = getNextLevelThreshold(data.current_score)
  const progressToNext = data.current_score >= 90 ? 100 : Math.round((data.current_score / nextThreshold) * 100)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Back link */}
          <Link
            href="/app/skills"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Skills Dashboard
          </Link>

          {/* Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center shrink-0",
              colors.bg, colors.text
            )}>
              {skillIcons[data.skill_name]}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-1">{data.display_name}</h1>
              <p className="text-muted-foreground">{data.description}</p>
            </div>
          </div>

          {/* Current Level Card */}
          <Card className={cn("mb-6 border-2", colors.border)}>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Current Level</p>
                  <p className={cn("text-3xl font-bold", colors.text)}>
                    {levelDisplayNames[data.current_level]}
                  </p>
                  {data.level_achieved_at && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Achieved: {new Date(data.level_achieved_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-muted-foreground mb-1">Proficiency Score</p>
                  <p className="text-3xl font-bold">{data.current_score}%</p>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progress to next level</span>
                  <span className="font-medium">
                    {data.current_score >= 90
                      ? "Max level!"
                      : `${nextThreshold - data.current_score}% more needed`}
                  </span>
                </div>
                <Progress value={progressToNext} className="h-3" />
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">Practice Time</span>
                </div>
                <p className="text-2xl font-bold">{formatTime(data.total_practice_time)}</p>
                {data.last_practiced_at && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Last practiced: {new Date(data.last_practiced_at).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-sm">Assessments Taken</span>
                </div>
                <p className="text-2xl font-bold">{assessmentHistory.length}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {assessmentHistory.filter((a) => a.passed).length} passed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Assessment History */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Recent Assessment History
              </CardTitle>
              <CardDescription>Your last {assessmentHistory.length} assessment attempts</CardDescription>
            </CardHeader>
            <CardContent>
              {assessmentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No assessments taken yet for this skill.</p>
                  <Button
                    className="mt-4 bg-[#5f5873] hover:bg-[#4a4560] text-white dark:bg-[#7c73e6] dark:hover:bg-[#6b63d5]"
                    onClick={() => router.push("/app/diagnostic")}
                  >
                    Take Diagnostic Assessment
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {assessmentHistory.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {assessment.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        )}
                        <div>
                          <p className="font-medium">{assessment.score}%</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(assessment.completed_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-medium px-2 py-1 rounded",
                          assessment.passed
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                        )}
                      >
                        {assessment.passed ? "Passed" : "Not Passed"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommended Phrases */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Recommended Phrases
              </CardTitle>
              <CardDescription>Phrases matched to your current level</CardDescription>
            </CardHeader>
            <CardContent>
              {recommendedPhrases.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No phrases available at your current level.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {recommendedPhrases.map((phrase) => (
                    <Link
                      key={phrase.id}
                      href={`/app/learn?phrase=${phrase.id}`}
                      className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <p className="font-medium mb-1">{phrase.english}</p>
                      <p className="text-sm text-muted-foreground">{phrase.shona}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{phrase.category}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-background">
                          Level {phrase.difficulty_score}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {recommendedPhrases.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-4"
                  onClick={() => router.push("/app/phrases")}
                >
                  Browse All Phrases
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1 bg-[#5f5873] hover:bg-[#4a4560] text-white dark:bg-[#7c73e6] dark:hover:bg-[#6b63d5]"
              onClick={() => router.push("/app/ai-practice")}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Practice with AI Tutor
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/app/phrases")}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Browse Phrases
            </Button>
          </div>
        </main>
      </SidebarLayout>
    </div>
  )
}
