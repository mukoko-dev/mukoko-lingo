"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { OnboardingModal } from "@/components/onboarding-modal"
import { useUILanguage } from "@/lib/hooks/use-ui-language"
import {
  Sparkles,
  BookOpen,
  TrendingUp,
  Target,
  Flame,
  Clock,
  MessageSquare,
  Bookmark,
  Award,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface DashboardClientProps {
  profile: any
  stats: {
    learning: number
    practiced: number
    mastered: number
    totalPhrases: number
    totalPracticed: number
  }
  todaySession: {
    phrases_studied: number
    time_spent_minutes: number
  }
  streak: number
  conversationCount: number
  bookmarksCount: number
  recommendations: any[]
}

export function DashboardClient({
  profile,
  stats,
  todaySession,
  streak,
  conversationCount,
  bookmarksCount,
  recommendations,
}: DashboardClientProps) {
  const { uiLanguage } = useUILanguage()
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingCompleted = localStorage.getItem("onboarding_completed")
    if (!onboardingCompleted) {
      // Show onboarding modal after a short delay
      const timer = setTimeout(() => {
        setShowOnboarding(true)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [])

  const dailyGoal = profile?.daily_goal || 5
  const goalProgress = Math.min((todaySession.phrases_studied / dailyGoal) * 100, 100)
  const goalRemaining = Math.max(dailyGoal - todaySession.phrases_studied, 0)

  const totalLearned = stats.learning + stats.practiced + stats.mastered
  const masteryPercentage = totalLearned > 0 ? Math.round((stats.mastered / totalLearned) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        userName={profile?.display_name}
      />

      <AppSidebar />

      <SidebarLayout>
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
          {/* Hero Section - Portfolio Style */}
          <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 p-6 sm:p-8 border border-primary/20">
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    {profile?.display_name || "Learner"}
                  </h1>
                  <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
                    {goalRemaining > 0
                      ? `You're ${Math.round(goalProgress)}% of the way to today's goal. ${goalRemaining} more ${goalRemaining === 1 ? "phrase" : "phrases"} to go!`
                      : "🎉 Daily goal achieved! You're on fire!"}
                  </p>
                </div>
                {streak > 0 && (
                  <div className="hidden sm:flex flex-col items-center justify-center bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl p-4 border border-orange-500/30">
                    <Flame className="h-8 w-8 text-orange-500 mb-1" />
                    <div className="text-2xl font-bold text-foreground">{streak}</div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wide">Day Streak</div>
                  </div>
                )}
              </div>

              {/* Progress Ring/Bar */}
              <div className="grid sm:grid-cols-2 gap-4 mt-6">
                <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      <span className="font-semibold">Daily Goal</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{Math.round(goalProgress)}%</div>
                  </div>
                  <Progress value={goalProgress} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {todaySession.phrases_studied} / {dailyGoal} phrases learned
                  </p>
                </div>

                <div className="bg-background/50 backdrop-blur-sm rounded-xl p-4 border border-secondary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-secondary-500" />
                    <span className="font-semibold">Mastery Level</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-bold text-secondary-500">{masteryPercentage}%</div>
                    <div className="text-sm text-muted-foreground">of {totalLearned} phrases</div>
                  </div>
                  <Progress value={masteryPercentage} variant="success" className="h-2 mt-2" />
                </div>
              </div>
            </div>

            {/* Decorative gradient orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-3xl opacity-50" />
          </div>

          {/* Quick Actions - Portfolio Cards */}
          <div className="mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent-500" />
              Continue Your Journey
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-secondary/10 via-secondary/5 to-background border-2 border-secondary/20 hover:border-secondary/40" onClick={() => router.push("/app/learn")}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-3">
                      <div className="p-2 bg-secondary-500/20 rounded-lg">
                        <BookOpen className="h-6 w-6 text-secondary-500" />
                      </div>
                      <span>Continue Learning</span>
                    </span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform text-secondary-500" />
                  </CardTitle>
                  <CardDescription>Your personalized learning feed</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="font-semibold">{totalLearned} started</Badge>
                    <Badge variant="outline" className="border-secondary/30 text-secondary-600">{stats.mastered} mastered</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer group bg-gradient-to-br from-accent/10 via-accent/5 to-background border-2 border-accent/20 hover:border-accent/40" onClick={() => router.push("/app/ai-practice")}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/30 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="flex items-center gap-3">
                      <div className="p-2 bg-accent-500/20 rounded-lg">
                        <Sparkles className="h-6 w-6 text-accent-500" />
                      </div>
                      <span>AI Tutor</span>
                    </span>
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform text-accent-500" />
                  </CardTitle>
                  <CardDescription>Practice conversations with AI</CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-accent-500" />
                    <span className="font-semibold">{conversationCount}</span>
                    <span className="text-sm text-muted-foreground">conversations</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Stats Overview - Portfolio Grid */}
          <div className="mb-6">
            <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-secondary-500" />
              Your Progress
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20 hover:border-green-500/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-foreground">{totalLearned}</div>
                  <Progress value={masteryPercentage} variant="success" className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground font-medium">{masteryPercentage}% mastery rate</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 hover:border-blue-500/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg">
                      <Bookmark className="h-4 w-4" />
                    </div>
                    Saved Phrases
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-3 text-foreground">{bookmarksCount}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push("/app/bookmarks")}
                    className="p-0 h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    View collection →
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20 hover:border-amber-500/40 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <div className="p-1.5 bg-amber-500/20 rounded-lg">
                      <Award className="h-4 w-4" />
                    </div>
                    Total Practice
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2 text-foreground">{stats.totalPracticed}</div>
                  <p className="text-xs text-muted-foreground font-medium">Times practiced</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommended for You */}
          {recommendations.length > 0 && (
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-accent-500" />
                Recommended for You
              </h2>
              <Card className="bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
                <CardHeader className="pb-4">
                  <CardDescription>Phrases picked based on your learning journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recommendations.slice(0, 5).map((phrase) => (
                      <div
                        key={phrase.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-background/50 backdrop-blur-sm border border-primary/10 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => router.push("/app/learn")}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">{phrase.english}</p>
                          <p className="text-sm text-muted-foreground">{phrase.shona}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs font-medium">
                            {phrase.category}
                          </Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full mt-4 border-primary/20 hover:bg-primary/5 hover:border-primary/40"
                    onClick={() => router.push("/app/learn")}
                  >
                    Explore All Phrases
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
