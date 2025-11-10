"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, TrendingUp, Calendar } from "lucide-react"
import { translations } from "@/lib/translations"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useUILanguage } from "@/lib/hooks/use-ui-language"

interface AnalyticsClientProps {
  analytics: {
    topPhrases: any[]
    studySessions: any[]
    categoryStats: Record<string, { learning: number; practiced: number; mastered: number }>
  }
}

export function AnalyticsClient({ analytics }: AnalyticsClientProps) {
  const { uiLanguage } = useUILanguage()
  const t = translations[uiLanguage]

  const totalStudyDays = analytics.studySessions.length
  const totalPhrasesStudied = analytics.studySessions.reduce((sum, s) => sum + s.phrases_studied, 0)
  const avgPhrasesPerDay = totalStudyDays > 0 ? Math.round(totalPhrasesStudied / totalStudyDays) : 0

  const categories = Object.keys(analytics.categoryStats)

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t.learningAnalytics || "Learning Analytics"}</h1>
            <p className="text-muted-foreground">
              {t.insightsIntoYourLearning || "Insights into your learning journey"}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.totalStudyDays || "Total Study Days"}</CardTitle>
              <Calendar className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudyDays}</div>
              <p className="text-xs text-muted-foreground">{t.last30Days || "in the last 30 days"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.totalPhrases || "Total Phrases"}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPhrasesStudied}</div>
              <p className="text-xs text-muted-foreground">{t.phrasesStudied || "phrases studied"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{t.avgPerDay || "Average Per Day"}</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgPhrasesPerDay}</div>
              <p className="text-xs text-muted-foreground">{t.phrasesPerDay || "phrases per day"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>{t.categoryProgress || "Category Progress"}</CardTitle>
              <CardDescription>{t.yourProgressByCategory || "Your progress by category"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noDataYet || "No data yet. Start learning!"}</p>
                ) : (
                  categories.map((category) => {
                    const stats = analytics.categoryStats[category]
                    const total = stats.learning + stats.practiced + stats.mastered
                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium capitalize">{category}</span>
                          <span className="text-sm text-muted-foreground">{total} total</span>
                        </div>
                        <div className="flex gap-1 h-2">
                          <div
                            className="bg-blue-500 rounded-l"
                            style={{ width: `${(stats.learning / total) * 100}%` }}
                            title={`${stats.learning} learning`}
                          />
                          <div
                            className="bg-orange-500"
                            style={{ width: `${(stats.practiced / total) * 100}%` }}
                            title={`${stats.practiced} practiced`}
                          />
                          <div
                            className="bg-green-500 rounded-r"
                            style={{ width: `${(stats.mastered / total) * 100}%` }}
                            title={`${stats.mastered} mastered`}
                          />
                        </div>
                        <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            {stats.learning} learning
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            {stats.practiced} practiced
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            {stats.mastered} mastered
                          </span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.mostViewedPhrases || "Most Viewed Phrases"}</CardTitle>
              <CardDescription>{t.phrasesYouViewMost || "Phrases you view the most"}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.topPhrases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t.noDataYet || "No data yet. Start learning!"}</p>
                ) : (
                  analytics.topPhrases.slice(0, 5).map((phrase: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{phrase.english}</p>
                        <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="truncate">{phrase.shona}</span>
                          <span>•</span>
                          <span className="truncate">{phrase.ndebele}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t.studyActivity || "Study Activity"}</CardTitle>
            <CardDescription>
              {t.yourStudyActivityLast30Days || "Your study activity over the last 30 days"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.studySessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t.noStudySessionsYet || "No study sessions yet. Start learning today!"}
              </p>
            ) : (
              <div className="flex items-end gap-1 h-32">
                {analytics.studySessions.map((session: any, index: number) => {
                  const maxPhrases = Math.max(...analytics.studySessions.map((s: any) => s.phrases_studied))
                  const height = maxPhrases > 0 ? (session.phrases_studied / maxPhrases) * 100 : 0
                  return (
                    <div
                      key={index}
                      className="flex-1 bg-primary/20 hover:bg-primary/40 rounded-t transition-colors"
                      style={{ height: `${height}%`, minHeight: session.phrases_studied > 0 ? "4px" : "0" }}
                      title={`${new Date(session.session_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}: ${session.phrases_studied} phrases`}
                    />
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </main>
      </SidebarLayout>
    </div>
  )
}
