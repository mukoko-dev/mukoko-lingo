"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
  Target,
  Award,
  ArrowRight,
  RefreshCw,
  Sparkles,
} from "lucide-react"

interface SkillData {
  skill_name: SkillName
  current_level: ProficiencyLevel
  current_score: number
  total_practice_time: number
  last_practiced_at: string | null
}

interface DashboardData {
  skills: SkillData[]
  overall_proficiency: ProficiencyLevel
  overall_score: number
  total_practice_time: number
  assessments_completed: number
  phrases_mastered: number
  current_streak: number
}

const skillIcons: Record<SkillName, React.ReactNode> = {
  pronunciation: <Mic className="h-5 w-5" />,
  vocabulary: <BookOpen className="h-5 w-5" />,
  grammar: <Languages className="h-5 w-5" />,
  comprehension: <Brain className="h-5 w-5" />,
  conversation: <MessageCircle className="h-5 w-5" />,
}

const skillDisplayNames: Record<SkillName, string> = {
  pronunciation: "Pronunciation",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  comprehension: "Comprehension",
  conversation: "Conversation",
}

const skillDescriptions: Record<SkillName, string> = {
  pronunciation: "Sound production, tones, and rhythm",
  vocabulary: "Word knowledge and expressions",
  grammar: "Sentence structure and verb forms",
  comprehension: "Understanding spoken and written language",
  conversation: "Real-world communication skills",
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

export function SkillsDashboardClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<DashboardData | null>(null)
  const [needsDiagnostic, setNeedsDiagnostic] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    // Check if user has skills data
    const { data: userSkills, error: skillsError } = await supabase
      .from("user_skills")
      .select(`
        current_level,
        current_score,
        total_practice_time,
        last_practiced_at,
        skills (name)
      `)
      .eq("user_id", user.id)

    if (skillsError || !userSkills || userSkills.length === 0) {
      setNeedsDiagnostic(true)
      setLoading(false)
      return
    }

    // Get additional stats
    const [
      { count: assessmentsCount },
      { count: phrasesCount },
      { data: profile },
    ] = await Promise.all([
      supabase
        .from("user_assessments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("phrase_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "mastered"),
      supabase
        .from("profiles")
        .select("current_streak")
        .eq("id", user.id)
        .single(),
    ])

    // Calculate overall score
    const skills = userSkills.map((us) => ({
      skill_name: (us.skills as any)?.name as SkillName,
      current_level: us.current_level as ProficiencyLevel,
      current_score: us.current_score,
      total_practice_time: us.total_practice_time,
      last_practiced_at: us.last_practiced_at,
    }))

    const totalScore = skills.reduce((sum, s) => sum + s.current_score, 0)
    const avgScore = Math.round(totalScore / skills.length)
    const totalPracticeTime = skills.reduce((sum, s) => sum + s.total_practice_time, 0)

    // Determine overall proficiency
    let overallProficiency: ProficiencyLevel = "beginner"
    if (avgScore >= 90) overallProficiency = "fluent"
    else if (avgScore >= 80) overallProficiency = "advanced"
    else if (avgScore >= 65) overallProficiency = "intermediate"
    else if (avgScore >= 50) overallProficiency = "elementary"

    setData({
      skills,
      overall_proficiency: overallProficiency,
      overall_score: avgScore,
      total_practice_time: totalPracticeTime,
      assessments_completed: assessmentsCount || 0,
      phrases_mastered: phrasesCount || 0,
      current_streak: profile?.current_streak || 0,
    })

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

  // Needs diagnostic assessment
  if (!loading && needsDiagnostic) {
    return (
      <div className="min-h-screen bg-background">
        <AppSidebar />
        <SidebarLayout>
          <main className="container mx-auto px-4 py-12 max-w-2xl">
            <Card className="border-2">
              <CardContent className="pt-8 pb-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary-700/10 dark:bg-primary-600/20 flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-primary-700 dark:text-primary-400" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Discover Your Level</h1>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Take a quick diagnostic assessment to establish your baseline proficiency.
                  This helps our AI tutor personalize your learning experience.
                </p>
                <Button
                  size="lg"
                  className="bg-[#5f5873] hover:bg-[#4a4560] text-white dark:bg-[#7c73e6] dark:hover:bg-[#6b63d5]"
                  onClick={() => router.push("/app/diagnostic")}
                >
                  Start Diagnostic Assessment
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          </main>
        </SidebarLayout>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Skills Dashboard</h1>
              <p className="text-muted-foreground">Track your progress across all language skills</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={loading}
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          {loading ? (
            <div className="grid gap-6 md:grid-cols-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : data ? (
            <>
              {/* Stats Overview */}
              <div className="grid gap-4 md:grid-cols-4 mb-8">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-sm">Overall Level</span>
                    </div>
                    <p className={cn("text-2xl font-bold", levelColors[data.overall_proficiency].text)}>
                      {levelDisplayNames[data.overall_proficiency]}
                    </p>
                    <p className="text-sm text-muted-foreground">{data.overall_score}% average</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">Practice Time</span>
                    </div>
                    <p className="text-2xl font-bold">{formatTime(data.total_practice_time)}</p>
                    <p className="text-sm text-muted-foreground">Total learning time</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">Phrases Mastered</span>
                    </div>
                    <p className="text-2xl font-bold">{data.phrases_mastered}</p>
                    <p className="text-sm text-muted-foreground">Phrases learned</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm">Current Streak</span>
                    </div>
                    <p className="text-2xl font-bold">{data.current_streak} days</p>
                    <p className="text-sm text-muted-foreground">Keep it up!</p>
                  </CardContent>
                </Card>
              </div>

              {/* Skills Grid */}
              <h2 className="text-lg font-semibold mb-4">Your Skills</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.skills.map((skill) => {
                  const colors = levelColors[skill.current_level]
                  const nextThreshold = getNextLevelThreshold(skill.current_score)
                  const progressToNext = skill.current_score >= 90
                    ? 100
                    : ((skill.current_score % (nextThreshold - (nextThreshold - 15))) / 15) * 100

                  return (
                    <Card
                      key={skill.skill_name}
                      className={cn("border-2 transition-all hover:shadow-md", colors.border)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center",
                              colors.bg, colors.text
                            )}>
                              {skillIcons[skill.skill_name]}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {skillDisplayNames[skill.skill_name]}
                              </CardTitle>
                              <CardDescription>
                                {skillDescriptions[skill.skill_name]}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-2">
                          <span className={cn("text-sm font-medium", colors.text)}>
                            {levelDisplayNames[skill.current_level]}
                          </span>
                          <span className="text-sm font-bold">{skill.current_score}%</span>
                        </div>
                        <Progress value={skill.current_score} className="h-2 mb-3" />

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {skill.current_score < 90
                              ? `${nextThreshold - skill.current_score}% to next level`
                              : "Max level reached!"}
                          </span>
                          {skill.last_practiced_at && (
                            <span>
                              Last: {new Date(skill.last_practiced_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
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
            </>
          ) : null}
        </main>
      </SidebarLayout>
    </div>
  )
}
