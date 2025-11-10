"use client"

import type React from "react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { Save, TrendingUp, BookOpen, Eye, Bookmark, Target, Award, Activity } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { Progress } from "@/components/ui/progress"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"

interface Profile {
  user_id: string
  email: string
  display_name: string | null
  preferred_ui_language: string
  learning_goal: string | null
  daily_goal: number
  study_streak: number
  last_study_date: string | null
  role: string
  status: string
  created_at: string
  updated_at: string
}

interface Analytics {
  totalProgress: number
  learningCount: number
  practicedCount: number
  masteredCount: number
  bookmarksCount: number
  viewsCount: number
  recentViews: Array<{ viewed_at: string }>
}

interface ProfileClientProps {
  user: User
  profile: Profile | null
  analytics: Analytics
}

export function ProfileClient({ user, profile, analytics }: ProfileClientProps) {
  const [displayName, setDisplayName] = useState(profile?.display_name || user.user_metadata?.full_name || "")
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_ui_language || "en")
  const [learningGoal, setLearningGoal] = useState(profile?.learning_goal || "")
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal?.toString() || "10")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()

      console.log("[v0] Attempting to save profile for user:", user.id)

      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single()

      console.log("[v0] Existing profile check:", { existingProfile, fetchError })

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[v0] Error fetching profile:", fetchError)
        throw fetchError
      }

      if (!existingProfile) {
        console.log("[v0] Creating new profile")
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: user.id,
          email: user.email || "",
          display_name: displayName,
          preferred_ui_language: preferredLanguage,
          learning_goal: learningGoal || null,
          daily_goal: Number.parseInt(dailyGoal) || 10,
          role: "user",
          status: "active",
          study_streak: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })

        if (insertError) {
          console.error("[v0] Error inserting profile:", insertError)
          throw insertError
        }
        console.log("[v0] Profile created successfully")
      } else {
        console.log("[v0] Updating existing profile")
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            display_name: displayName,
            preferred_ui_language: preferredLanguage,
            learning_goal: learningGoal || null,
            daily_goal: Number.parseInt(dailyGoal) || 10,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)

        if (updateError) {
          console.error("[v0] Error updating profile:", updateError)
          throw updateError
        }
        console.log("[v0] Profile updated successfully")
      }

      setMessage({ type: "success", text: "Profile updated successfully!" })
      setTimeout(() => {
        router.refresh()
      }, 500)
    } catch (error) {
      console.error("[v0] Profile update error:", error)
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to update profile",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const masteryPercentage =
    analytics.totalProgress > 0 ? Math.round((analytics.masteredCount / analytics.totalProgress) * 100) : 0

  const practicePercentage =
    analytics.totalProgress > 0 ? Math.round((analytics.practicedCount / analytics.totalProgress) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-muted-foreground">Manage your account and track your learning progress</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6 lg:col-span-2">
            <Card className="bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Your Learning Journey
                </CardTitle>
                <CardDescription>Comprehensive view of your progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-accent/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Study Streak</p>
                    </div>
                    <p className="text-2xl font-bold">{profile?.study_streak || 0}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Total Progress</p>
                    </div>
                    <p className="text-2xl font-bold">{analytics.totalProgress}</p>
                    <p className="text-xs text-muted-foreground">phrases</p>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Total Views</p>
                    </div>
                    <p className="text-2xl font-bold">{analytics.viewsCount}</p>
                    <p className="text-xs text-muted-foreground">phrases</p>
                  </div>

                  <div className="p-4 rounded-lg bg-accent/50 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Bookmark className="h-4 w-4 text-primary" />
                      <p className="text-xs text-muted-foreground">Bookmarks</p>
                    </div>
                    <p className="text-2xl font-bold">{analytics.bookmarksCount}</p>
                    <p className="text-xs text-muted-foreground">saved</p>
                  </div>
                </div>

                {/* Progress Breakdown */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-[#729b63]" />
                        <span className="text-sm font-medium">Mastered</span>
                      </div>
                      <span className="text-sm font-bold">
                        {analytics.masteredCount} ({masteryPercentage}%)
                      </span>
                    </div>
                    <Progress value={masteryPercentage} variant="success" className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-[#5f5873]" />
                        <span className="text-sm font-medium">Practiced</span>
                      </div>
                      <span className="text-sm font-bold">
                        {analytics.practicedCount} ({practicePercentage}%)
                      </span>
                    </div>
                    <Progress value={practicePercentage} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Learning</span>
                      </div>
                      <span className="text-sm font-bold">{analytics.learningCount}</span>
                    </div>
                  </div>
                </div>

                {profile?.last_study_date && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Last studied:{" "}
                      <span className="font-medium">{new Date(profile.last_study_date).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Account Information</CardTitle>
              <CardDescription>Your basic account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              {profile?.role === "admin" && (
                <div className="pt-2 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">Admin</span>
                    <span className="text-muted-foreground">Administrator privileges</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Learning Preferences</CardTitle>
              <CardDescription>Customize your learning experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="preferredLanguage">Preferred Interface Language</Label>
                <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                  <SelectTrigger id="preferredLanguage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="sn">Shona</SelectItem>
                    <SelectItem value="nd">Ndebele</SelectItem>
                    <SelectItem value="zh">Chinese (中文)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="learningGoal">Learning Goal</Label>
                <Textarea
                  id="learningGoal"
                  placeholder="What do you want to achieve? (e.g., Learn basic greetings, improve conversational skills)"
                  value={learningGoal}
                  onChange={(e) => setLearningGoal(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyGoal">Daily Practice Goal (phrases per day)</Label>
                <Input
                  id="dailyGoal"
                  type="number"
                  min="1"
                  max="100"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/20"
                : "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
            }`}
            role="alert"
          >
            {message.text}
          </div>
        )}

        <Button onClick={handleSave} disabled={isLoading} className="w-full mt-6" size="lg">
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
        </main>
      </SidebarLayout>
    </div>
  )
}
