"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Shield, BookOpen, Eye, Bookmark, TrendingUp, UserPlus, Activity, AlertTriangle, CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface AdminStats {
  total_users: number
  total_admins: number
  total_phrases: number
  total_progress_records: number
  total_bookmarks: number
  total_views: number
}

interface UserActivity {
  user_id: string
  email: string
  display_name: string
  role: string
  total_views: number
  total_bookmarks: number
  total_progress: number
  last_active: string
}

interface AdminDashboardOverviewProps {
  stats: AdminStats
  recentActivity: UserActivity[]
}

export function AdminDashboardOverview({ stats, recentActivity }: AdminDashboardOverviewProps) {
  const avgProgressPerUser = stats.total_users > 0 ? Math.round(stats.total_progress_records / stats.total_users) : 0
  const avgBookmarksPerUser = stats.total_users > 0 ? Math.round(stats.total_bookmarks / stats.total_users) : 0
  const avgViewsPerUser = stats.total_users > 0 ? Math.round(stats.total_views / stats.total_users) : 0

  // Calculate engagement metrics
  const activeUsers = recentActivity.filter(u => {
    const lastActive = new Date(u.last_active)
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceActive <= 7
  }).length

  const engagementRate = stats.total_users > 0 ? Math.round((activeUsers / stats.total_users) * 100) : 0

  return (
    <div className="space-y-8">
      {/* Quick Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_users.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400 font-medium">{activeUsers} active</span> this week
            </p>
            <Button asChild variant="ghost" size="sm" className="mt-2 h-8 w-full">
              <Link href="/admin/users">
                View All <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Library</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_phrases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Phrases across 4 languages</p>
            <Button asChild variant="ghost" size="sm" className="mt-2 h-8 w-full">
              <Link href="/admin/phrases">
                Manage Phrases <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{engagementRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Weekly active user rate</p>
            <Button asChild variant="ghost" size="sm" className="mt-2 h-8 w-full">
              <Link href="/admin/activity">
                View Activity <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_views.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">~{avgViewsPerUser} per user</p>
            <div className="mt-2 h-8" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Learning Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Total Progress Records</span>
                  <span className="font-semibold">{stats.total_progress_records.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">~{avgProgressPerUser} per user</div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Total Bookmarks</span>
                  <span className="font-semibold">{stats.total_bookmarks.toLocaleString()}</span>
                </div>
                <div className="text-xs text-muted-foreground">~{avgBookmarksPerUser} per user</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Administration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Administrators</span>
                <Badge variant="secondary">{stats.total_admins}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Regular Users</span>
                <Badge variant="outline">{stats.total_users - stats.total_admins}</Badge>
              </div>
              <Button asChild variant="outline" size="sm" className="w-full mt-2">
                <Link href="/admin/users">
                  Manage Roles
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/admin/phrases">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add New Phrase
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/admin/standards">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Learning Standards
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="w-full justify-start">
                <Link href="/admin/moderation">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Content Moderation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent User Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>Most active users in the past 7 days</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/activity">View All</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.slice(0, 5).map((user) => {
              const lastActive = new Date(user.last_active)
              const daysSinceActive = Math.floor((Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
              const isActive = daysSinceActive === 0
              const isRecent = daysSinceActive <= 3

              return (
                <div key={user.user_id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{user.display_name || user.email}</span>
                        {user.role === "admin" && (
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{user.total_views}</div>
                      <div className="text-xs text-muted-foreground">Views</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{user.total_progress}</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                    <div className="text-center min-w-[80px]">
                      {isActive ? (
                        <Badge variant="default" className="bg-green-500">
                          <Activity className="mr-1 h-3 w-3" />
                          Today
                        </Badge>
                      ) : isRecent ? (
                        <Badge variant="secondary">
                          {daysSinceActive}d ago
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">{daysSinceActive}d ago</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Health & Insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Phrase Coverage</span>
                <span className="text-sm font-medium">
                  {stats.total_phrases >= 200 ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Excellent
                    </span>
                  ) : stats.total_phrases >= 100 ? (
                    <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <Minus className="h-4 w-4" /> Good
                    </span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" /> Needs Attention
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">User Engagement</span>
                <span className="text-sm font-medium">
                  {engagementRate >= 50 ? (
                    <span className="text-green-600 dark:text-green-400">High</span>
                  ) : engagementRate >= 25 ? (
                    <span className="text-yellow-600 dark:text-yellow-400">Moderate</span>
                  ) : (
                    <span className="text-orange-600 dark:text-orange-400">Low</span>
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium mb-1">Most Popular Feature</div>
                <div className="text-muted-foreground">
                  {stats.total_views > stats.total_bookmarks && stats.total_views > stats.total_progress_records
                    ? "Phrase Browsing"
                    : stats.total_progress_records > stats.total_bookmarks
                      ? "Learning Progress Tracking"
                      : "Bookmarking"}
                </div>
              </div>
              <div>
                <div className="font-medium mb-1">Growth Opportunity</div>
                <div className="text-muted-foreground">
                  {avgProgressPerUser < 10
                    ? "Encourage users to track learning progress"
                    : avgBookmarksPerUser < 5
                      ? "Promote bookmark feature for easy review"
                      : "Maintain current engagement levels"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
