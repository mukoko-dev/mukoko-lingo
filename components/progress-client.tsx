"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Award, Flame } from "lucide-react"
import Link from "next/link"
import { translations } from "@/lib/translations"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useUILanguage } from "@/lib/hooks/use-ui-language"

interface ProgressClientProps {
  profile: any
  stats: {
    learning: number
    practiced: number
    mastered: number
    totalPracticed: number
  }
}

export function ProgressClient({ profile, stats }: ProgressClientProps) {
  const { uiLanguage } = useUILanguage()
  const t = translations[uiLanguage]

  const totalPhrases = stats.learning + stats.practiced + stats.mastered
  const progressPercentage = totalPhrases > 0 ? Math.round((stats.mastered / totalPhrases) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t.myProgress || "My Progress"}</h1>
          <p className="text-muted-foreground">{t.trackYourJourney || "Track your language learning journey"}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.studyStreak || "Study Streak"}</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.study_streak || 0}</div>
              <p className="text-xs text-muted-foreground">{t.daysInARow || "days in a row"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.totalPracticed || "Total Practiced"}</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPracticed}</div>
              <p className="text-xs text-muted-foreground">{t.phrasesStudied || "phrases studied"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.dailyGoal || "Daily Goal"}</CardTitle>
              <Target className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile?.daily_goal || 10}</div>
              <p className="text-xs text-muted-foreground">{t.phrasesPerDay || "phrases per day"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.mastered || "Mastered"}</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.mastered}</div>
              <p className="text-xs text-muted-foreground">
                {progressPercentage}% {t.completion || "completion"}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t.learningProgress || "Learning Progress"}</CardTitle>
            <CardDescription>{t.phrasesByStatus || "Phrases organized by learning status"}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t.learning || "Learning"}</span>
                  <span className="text-sm text-muted-foreground">{stats.learning} phrases</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: totalPhrases > 0 ? `${(stats.learning / totalPhrases) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t.practiced || "Practiced"}</span>
                  <span className="text-sm text-muted-foreground">{stats.practiced} phrases</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: totalPhrases > 0 ? `${(stats.practiced / totalPhrases) * 100}%` : "0%" }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{t.mastered || "Mastered"}</span>
                  <span className="text-sm text-muted-foreground">{stats.mastered} phrases</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: totalPhrases > 0 ? `${(stats.mastered / totalPhrases) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t.learningGoal || "Learning Goal"}</CardTitle>
            <CardDescription>{profile?.learning_goal || t.noGoalSet || "No learning goal set yet"}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/app/profile">{t.updateGoal || "Update Goal"}</Link>
            </Button>
          </CardContent>
        </Card>
        </main>
      </SidebarLayout>
    </div>
  )
}
