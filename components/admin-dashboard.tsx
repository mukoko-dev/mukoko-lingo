"use client"

import { useState, useMemo, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Users,
  BookOpen,
  TrendingUp,
  Eye,
  Bookmark,
  Plus,
  Edit,
  Trash2,
  Shield,
  Activity,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  GraduationCap,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { LearningStandardsManager } from "@/components/learning-standards-manager"

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

interface Phrase {
  id: string
  category: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  created_at: string
}

interface AdminDashboardProps {
  stats: AdminStats
  userActivity: UserActivity[]
  phrases: Phrase[]
  recentViews: any[]
  moderationAlerts: any[]
  learningStandards: any[]
}

export function AdminDashboard({
  stats,
  userActivity,
  phrases,
  recentViews,
  moderationAlerts,
  learningStandards,
}: AdminDashboardProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string>("overview")
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"user" | "admin">("user")

  const [isUserActionDialogOpen, setIsUserActionDialogOpen] = useState(false)
  const [selectedAlertUser, setSelectedAlertUser] = useState<{ id: string; email: string } | null>(null)
  const [userAction, setUserAction] = useState<"ban" | "deactivate" | "delete">("ban")
  const [actionReason, setActionReason] = useState("")

  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [userSortField, setUserSortField] = useState<keyof UserActivity>("email")
  const [userSortDirection, setUserSortDirection] = useState<"asc" | "desc">("asc")

  const [phraseSearchTerm, setPhraseSearchTerm] = useState("")
  const [phraseSortField, setPhraseSortField] = useState<keyof Phrase>("category")
  const [phraseSortDirection, setPhraseSortDirection] = useState<"asc" | "desc">("asc")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash) setActiveSection(hash)

    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "")
      setActiveSection(hash || "overview")
    }

    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    {
      id: "users",
      label: "User Management",
      icon: Users,
    },
    { id: "phrases", label: "Phrase Management", icon: BookOpen },
    { id: "standards", label: "Learning Standards", icon: GraduationCap },
    {
      id: "moderation",
      label: "Moderation",
      icon: Shield,
      badge: moderationAlerts.filter((a) => a.status === "pending").length,
    },
    { id: "activity", label: "Recent Activity", icon: Activity },
  ]

  const filteredUsers = useMemo(() => {
    const filtered = userActivity.filter(
      (user) =>
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(userSearchTerm.toLowerCase()),
    )

    return filtered.sort((a, b) => {
      const aVal = a[userSortField]
      const bVal = b[userSortField]
      const modifier = userSortDirection === "asc" ? 1 : -1

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * modifier
      }
      return ((aVal as number) - (bVal as number)) * modifier
    })
  }, [userActivity, userSearchTerm, userSortField, userSortDirection])

  const filteredPhrases = useMemo(() => {
    const filtered = phrases.filter((phrase) => {
      const matchesSearch =
        phrase.english?.toLowerCase().includes(phraseSearchTerm.toLowerCase()) ||
        phrase.shona?.toLowerCase().includes(phraseSearchTerm.toLowerCase()) ||
        phrase.ndebele?.toLowerCase().includes(phraseSearchTerm.toLowerCase()) ||
        phrase.chinese?.toLowerCase().includes(phraseSearchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || phrase.category === categoryFilter

      return matchesSearch && matchesCategory
    })

    return filtered.sort((a, b) => {
      const aVal = a[phraseSortField]
      const bVal = b[phraseSortField]
      const modifier = phraseSortDirection === "asc" ? 1 : -1

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * modifier
      }
      return ((aVal as number) - (bVal as number)) * modifier
    })
  }, [phrases, phraseSearchTerm, phraseSortField, phraseSortDirection, categoryFilter])

  const toggleUserSort = (field: keyof UserActivity) => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc")
    } else {
      setUserSortField(field)
      setUserSortDirection("asc")
    }
  }

  const togglePhraseSort = (field: keyof Phrase) => {
    if (phraseSortField === field) {
      setPhraseSortDirection(phraseSortDirection === "asc" ? "desc" : "asc")
    } else {
      setPhraseSortField(field)
      setPhraseSortDirection("asc")
    }
  }

  const SortIcon = ({
    field,
    currentField,
    direction,
  }: { field: string; currentField: string; direction: "asc" | "desc" }) => {
    if (field !== currentField) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
    return direction === "asc" ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return

    try {
      const response = await fetch("/api/admin/update-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.user_id, role: newRole }),
      })

      if (!response.ok) throw new Error("Failed to update role")

      setIsRoleDialogOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating role:", error)
      alert("Failed to update user role")
    }
  }

  const handleUserAction = async () => {
    if (!selectedAlertUser) return

    try {
      const response = await fetch("/api/admin/user-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedAlertUser.id,
          action: userAction,
          reason: actionReason,
        }),
      })

      if (!response.ok) throw new Error("Failed to perform user action")

      setIsUserActionDialogOpen(false)
      setActionReason("")
      router.refresh()
      alert(`User ${userAction}ed successfully`)
    } catch (error) {
      console.error("Error performing user action:", error)
      alert(`Failed to ${userAction} user`)
    }
  }

  return (
    <div className="flex-1">
      <main className="container mx-auto px-4 py-8">
        {/* Mobile Navigation */}
        <div className="lg:hidden mb-6">
          <Select
            value={activeSection}
            onValueChange={(value) => {
              setActiveSection(value)
              window.location.hash = value
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sidebarItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    <span>{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-8">
            <div>
              <h2 className="font-serif text-3xl font-bold mb-2">Dashboard Overview</h2>
              <p className="text-muted-foreground">Quick insights and platform statistics</p>
            </div>

            {/* Statistics Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Administrators</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_admins}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Phrases</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_phrases}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_views}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Bookmarks</CardTitle>
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_bookmarks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Progress Records</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_progress_records}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Users Section */}
        {activeSection === "users" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">User Management</CardTitle>
                <CardDescription>View and manage user accounts and roles</CardDescription>
                <div className="pt-4 flex gap-4 items-center">
                  <Input
                    placeholder="Search users by email or name..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {userActivity.length} users
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserSort("email")}
                              className="hover:bg-transparent"
                            >
                              User
                              <SortIcon field="email" currentField={userSortField} direction={userSortDirection} />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserSort("role")}
                              className="hover:bg-transparent"
                            >
                              Role
                              <SortIcon field="role" currentField={userSortField} direction={userSortDirection} />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserSort("total_views")}
                              className="hover:bg-transparent"
                            >
                              Views
                              <SortIcon
                                field="total_views"
                                currentField={userSortField}
                                direction={userSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserSort("total_bookmarks")}
                              className="hover:bg-transparent"
                            >
                              Bookmarks
                              <SortIcon
                                field="total_bookmarks"
                                currentField={userSortField}
                                direction={userSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserSort("total_progress")}
                              className="hover:bg-transparent"
                            >
                              Progress
                              <SortIcon
                                field="total_progress"
                                currentField={userSortField}
                                direction={userSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleUserSort("last_active")}
                              className="hover:bg-transparent"
                            >
                              Last Active
                              <SortIcon
                                field="last_active"
                                currentField={userSortField}
                                direction={userSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((user) => (
                          <tr key={user.user_id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <div>
                                <p className="font-medium">{user.display_name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                            </td>
                            <td className="p-4 align-middle text-right">{user.total_views}</td>
                            <td className="p-4 align-middle text-right">{user.total_bookmarks}</td>
                            <td className="p-4 align-middle text-right">{user.total_progress}</td>
                            <td className="p-4 align-middle">
                              {user.last_active ? new Date(user.last_active).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "Never"}
                            </td>
                            <td className="p-4 align-middle text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user)
                                  setNewRole(user.role as "user" | "admin")
                                  setIsRoleDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Phrases Section */}
        {activeSection === "phrases" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-4 flex-1">
                  <div>
                    <CardTitle className="font-serif">Phrase Management</CardTitle>
                    <CardDescription>Add, edit, or delete phrases in the database</CardDescription>
                  </div>
                  <div className="flex gap-4 items-center flex-wrap">
                    <Input
                      placeholder="Search phrases in any language..."
                      value={phraseSearchTerm}
                      onChange={(e) => setPhraseSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="greetings">Greetings</SelectItem>
                        <SelectItem value="family">Family</SelectItem>
                        <SelectItem value="shopping">Shopping</SelectItem>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="transport">Transport</SelectItem>
                        <SelectItem value="school">School</SelectItem>
                        <SelectItem value="money">Money</SelectItem>
                        <SelectItem value="weather">Weather</SelectItem>
                        <SelectItem value="emotions">Emotions</SelectItem>
                        <SelectItem value="work">Work</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredPhrases.length} of {phrases.length} phrases
                    </div>
                  </div>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Phrase
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add New Phrase</DialogTitle>
                      <DialogDescription>Add a new phrase to the Nyuchi Lingo database</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="greetings">Greetings</SelectItem>
                            <SelectItem value="family">Family</SelectItem>
                            <SelectItem value="shopping">Shopping</SelectItem>
                            <SelectItem value="food">Food</SelectItem>
                            <SelectItem value="health">Health</SelectItem>
                            <SelectItem value="transport">Transport</SelectItem>
                            <SelectItem value="school">School</SelectItem>
                            <SelectItem value="money">Money</SelectItem>
                            <SelectItem value="weather">Weather</SelectItem>
                            <SelectItem value="emotions">Emotions</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Note: Full phrase creation form would include fields for all four languages with pronunciations
                        and contexts.
                      </p>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePhraseSort("category")}
                              className="hover:bg-transparent"
                            >
                              Category
                              <SortIcon
                                field="category"
                                currentField={phraseSortField}
                                direction={phraseSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePhraseSort("english")}
                              className="hover:bg-transparent"
                            >
                              English
                              <SortIcon
                                field="english"
                                currentField={phraseSortField}
                                direction={phraseSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePhraseSort("shona")}
                              className="hover:bg-transparent"
                            >
                              Shona
                              <SortIcon field="shona" currentField={phraseSortField} direction={phraseSortDirection} />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePhraseSort("ndebele")}
                              className="hover:bg-transparent"
                            >
                              Ndebele
                              <SortIcon
                                field="ndebele"
                                currentField={phraseSortField}
                                direction={phraseSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePhraseSort("chinese")}
                              className="hover:bg-transparent"
                            >
                              Chinese
                              <SortIcon
                                field="chinese"
                                currentField={phraseSortField}
                                direction={phraseSortDirection}
                              />
                            </Button>
                          </th>
                          <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPhrases.slice(0, 50).map((phrase) => (
                          <tr key={phrase.id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <Badge variant="outline">{phrase.category}</Badge>
                            </td>
                            <td className="p-4 align-middle font-medium">{phrase.english}</td>
                            <td className="p-4 align-middle">{phrase.shona}</td>
                            <td className="p-4 align-middle">{phrase.ndebele}</td>
                            <td className="p-4 align-middle">{phrase.chinese}</td>
                            <td className="p-4 align-middle text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Learning Standards Section */}
        {activeSection === "standards" && (
          <div className="space-y-4">
            <LearningStandardsManager standards={learningStandards} />
          </div>
        )}

        {/* Moderation Section */}
        {activeSection === "moderation" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Content Moderation
                </CardTitle>
                <CardDescription>Review flagged content and take appropriate action</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {moderationAlerts.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No flagged content to review</p>
                  ) : (
                    moderationAlerts.map((alert) => (
                      <Card key={alert.id} className="border-l-4 border-l-amber-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant={alert.status === "pending" ? "destructive" : "secondary"}>
                                  {alert.status}
                                </Badge>
                                <Badge variant="outline">{alert.content_type}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(alert.created_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                User: {alert.profiles?.email || "Unknown"}
                              </p>
                              <div className="bg-muted/50 rounded p-3 mb-2">
                                <p className="text-sm">{alert.content_text}</p>
                              </div>
                              <p className="text-sm text-amber-600 dark:text-amber-400">
                                Reason: {alert.flagged_reason}
                              </p>
                              {alert.admin_notes && (
                                <p className="text-sm text-muted-foreground mt-2">Admin notes: {alert.admin_notes}</p>
                              )}
                            </div>
                          </div>
                          {alert.status === "pending" && (
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={async () => {
                                  const notes = prompt("Add admin notes (optional):")
                                  await fetch(`/api/admin/moderation/${alert.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "approved", admin_notes: notes }),
                                  })
                                  router.refresh()
                                }}
                              >
                                Approve Content
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={async () => {
                                  const notes = prompt("Add admin notes (required):")
                                  if (!notes) return
                                  await fetch(`/api/admin/moderation/${alert.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "removed", admin_notes: notes }),
                                  })
                                  router.refresh()
                                }}
                              >
                                Remove Content
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  const notes = prompt("Add admin notes:")
                                  await fetch(`/api/admin/moderation/${alert.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ status: "reviewed", admin_notes: notes }),
                                  })
                                  router.refresh()
                                }}
                              >
                                Mark Reviewed
                              </Button>
                              <div className="w-full border-t pt-2 mt-2">
                                <p className="text-xs text-muted-foreground mb-2">User Actions:</p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950 bg-transparent"
                                    onClick={() => {
                                      setSelectedAlertUser({
                                        id: alert.user_id,
                                        email: alert.profiles?.email || "",
                                      })
                                      setUserAction("ban")
                                      setIsUserActionDialogOpen(true)
                                    }}
                                  >
                                    Ban User
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedAlertUser({
                                        id: alert.user_id,
                                        email: alert.profiles?.email || "",
                                      })
                                      setUserAction("deactivate")
                                      setIsUserActionDialogOpen(true)
                                    }}
                                  >
                                    Deactivate User
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 bg-transparent"
                                    onClick={() => {
                                      setSelectedAlertUser({
                                        id: alert.user_id,
                                        email: alert.profiles?.email || "",
                                      })
                                      setUserAction("delete")
                                      setIsUserActionDialogOpen(true)
                                    }}
                                  >
                                    Delete User
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Activity Section */}
        {activeSection === "activity" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest user interactions across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentViews.map((view, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{view.profiles?.display_name || "Unknown User"}</p>
                        <p className="text-sm text-muted-foreground">Viewed: {view.phrases?.english}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{new Date(view.viewed_at).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Role Update Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update User Role</DialogTitle>
            <DialogDescription>Change the role for {selectedUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={newRole} onValueChange={(value: "user" | "admin") => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole}>Update Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUserActionDialogOpen} onOpenChange={setIsUserActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              {userAction === "delete" ? "Delete" : userAction === "ban" ? "Ban" : "Deactivate"} User
            </DialogTitle>
            <DialogDescription>
              This action will {userAction} the user: {selectedAlertUser?.email}
              {userAction === "delete" && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Warning: This action is permanent and cannot be undone!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="action">Action</Label>
              <Select value={userAction} onValueChange={(value: any) => setUserAction(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ban">Ban User (permanent restriction)</SelectItem>
                  <SelectItem value="deactivate">Deactivate User (temporary restriction)</SelectItem>
                  <SelectItem value="delete">Delete User (permanent removal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Input
                id="reason"
                placeholder="Explain why this action is being taken..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUserActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleUserAction} disabled={!actionReason.trim()}>
              Confirm {userAction === "delete" ? "Deletion" : userAction === "ban" ? "Ban" : "Deactivation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
