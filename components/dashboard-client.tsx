"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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

  const dailyGoal = profile?.daily_goal || 5
  const goalProgress = Math.min((todaySession.phrases_studied / dailyGoal) * 100, 100)
  const goalRemaining = Math.max(dailyGoal - todaySession.phrases_studied, 0)

  const totalLearned = stats.learning + stats.practiced + stats.mastered
  const masteryPercentage = totalLearned > 0 ? Math.round((stats.mastered / totalLearned) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <div className="mx-auto max-w-6xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Welcome Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Welcome back, {profile?.display_name || "Learner"}! 👋
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {goalRemaining > 0
                ? `Learn ${goalRemaining} more ${goalRemaining === 1 ? "phrase" : "phrases"} to reach your daily goal!`
                : "🎉 You've reached your daily goal! Keep going!"}
            </p>
          </div>

          {/* Daily Goal Card */}
          <Card className="mb-6 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Today's Goal
                  </CardTitle>
                  <CardDescription>
                    {todaySession.phrases_studied} / {dailyGoal} phrases learned
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">{Math.round(goalProgress)}%</div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={goalProgress} className="h-3 mb-4" />
              {streak > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold">{streak} Day Streak</span>
                  </span>
                  <span className="text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {todaySession.time_spent_minutes} min today
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => router.push("/app/browse")}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-secondary-500" />
                    Continue Learning
                  </span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <CardDescription>Browse and learn phrases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="secondary">{totalLearned} phrases started</Badge>
                  <Badge variant="outline">{stats.mastered} mastered</Badge>
                </div>
              </CardContent>
            </Card>

            <Card
              className="hover:shadow-lg transition-shadow cursor-pointer group bg-gradient-to-br from-accent/10 to-primary/10"
              onClick={() => router.push("/app/ai-practice")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent-500" />
                    AI Tutor
                  </span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </CardTitle>
                <CardDescription>Practice conversations with AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span>{conversationCount} conversations</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats Overview */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-secondary-500" />
                  Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{totalLearned}</div>
                <Progress value={masteryPercentage} variant="success" className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">{masteryPercentage}% mastery rate</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-accent-500" />
                  Saved Phrases
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{bookmarksCount}</div>
                <Button variant="ghost" size="sm" onClick={() => router.push("/app/bookmarks")} className="p-0 h-auto">
                  View saved phrases →
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" />
                  Total Practice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{stats.totalPracticed}</div>
                <p className="text-xs text-muted-foreground">Times practiced</p>
              </CardContent>
            </Card>
          </div>

          {/* Recommended for You */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-accent-500" />
                  Recommended for You
                </CardTitle>
                <CardDescription>Phrases picked just for you</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recommendations.slice(0, 3).map((phrase) => (
                    <div
                      key={phrase.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/5 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{phrase.english}</p>
                        <p className="text-xs text-muted-foreground">{phrase.shona}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {phrase.category}
                      </Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" onClick={() => router.push("/app/browse")}>
                  Browse All Phrases
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
