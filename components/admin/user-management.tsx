"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Edit,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Download,
  UserPlus,
  Mail,
  Ban,
  Trash2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  X,
  CheckSquare,
  Square,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UserActivity {
  user_id: string
  email: string
  display_name: string
  role: string
  total_views: number
  total_bookmarks: number
  total_progress: number
  last_active: string
  created_at?: string
  status?: string
}

interface UserManagementProps {
  userActivity: UserActivity[]
}

export function UserManagement({ userActivity }: UserManagementProps) {
  const router = useRouter()
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false)
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false)
  const [newRole, setNewRole] = useState<"user" | "admin">("user")
  const [bulkAction, setBulkAction] = useState<"export" | "email" | "deactivate" | "delete">("export")

  // Filters and search
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [activityFilter, setActivityFilter] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  // Sorting
  const [userSortField, setUserSortField] = useState<keyof UserActivity>("last_active")
  const [userSortDirection, setUserSortDirection] = useState<"asc" | "desc">("desc")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Advanced filtering and search
  const filteredUsers = useMemo(() => {
    let filtered = userActivity.filter((user) => {
      // Search filter
      const matchesSearch =
        !userSearchTerm ||
        user.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.display_name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
        user.user_id?.toLowerCase().includes(userSearchTerm.toLowerCase())

      // Role filter
      const matchesRole = roleFilter === "all" || user.role === roleFilter

      // Status filter (for future use)
      const matchesStatus = statusFilter === "all" || user.status === statusFilter

      // Activity filter
      let matchesActivity = true
      if (activityFilter !== "all") {
        const daysSinceActive = user.last_active
          ? (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60 * 60 * 24)
          : 999

        switch (activityFilter) {
          case "active_today":
            matchesActivity = daysSinceActive < 1
            break
          case "active_week":
            matchesActivity = daysSinceActive <= 7
            break
          case "active_month":
            matchesActivity = daysSinceActive <= 30
            break
          case "inactive":
            matchesActivity = daysSinceActive > 30
            break
        }
      }

      return matchesSearch && matchesRole && matchesStatus && matchesActivity
    })

    // Sorting
    return filtered.sort((a, b) => {
      const aVal = a[userSortField]
      const bVal = b[userSortField]
      const modifier = userSortDirection === "asc" ? 1 : -1

      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * modifier
      }
      return ((aVal as number) - (bVal as number)) * modifier
    })
  }, [userActivity, userSearchTerm, roleFilter, statusFilter, activityFilter, userSortField, userSortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const startIndex = (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, filteredUsers.length)

  const toggleUserSort = (field: keyof UserActivity) => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === "asc" ? "desc" : "asc")
    } else {
      setUserSortField(field)
      setUserSortDirection("asc")
    }
  }

  const toggleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u) => u.user_id)))
    }
  }

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    setSelectedUsers(newSelected)
  }

  const clearFilters = () => {
    setUserSearchTerm("")
    setRoleFilter("all")
    setStatusFilter("all")
    setActivityFilter("all")
  }

  const hasActiveFilters =
    userSearchTerm || roleFilter !== "all" || statusFilter !== "all" || activityFilter !== "all"

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

  const handleBulkAction = async () => {
    if (selectedUsers.size === 0) {
      alert("No users selected")
      return
    }

    const userIds = Array.from(selectedUsers)

    switch (bulkAction) {
      case "export":
        // Export selected users to CSV
        const selectedUsersData = userActivity.filter((u) => userIds.includes(u.user_id))
        const csv = [
          ["Email", "Display Name", "Role", "Total Views", "Total Bookmarks", "Total Progress", "Last Active"].join(","),
          ...selectedUsersData.map((u) =>
            [
              u.email,
              u.display_name,
              u.role,
              u.total_views,
              u.total_bookmarks,
              u.total_progress,
              new Date(u.last_active).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
            ].join(","),
          ),
        ].join("\n")
        const blob = new Blob([csv], { type: "text/csv" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`
        a.click()
        setIsBulkActionDialogOpen(false)
        setSelectedUsers(new Set())
        break

      case "email":
        alert(`Email functionality would send to ${selectedUsers.size} users`)
        setIsBulkActionDialogOpen(false)
        break

      case "deactivate":
      case "delete":
        if (
          !confirm(
            `Are you sure you want to ${bulkAction} ${selectedUsers.size} user(s)? This action cannot be undone.`,
          )
        ) {
          return
        }
        try {
          const response = await fetch("/api/admin/bulk-user-action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds, action: bulkAction }),
          })

          if (!response.ok) throw new Error(`Failed to ${bulkAction} users`)

          setIsBulkActionDialogOpen(false)
          setSelectedUsers(new Set())
          router.refresh()
          alert(`Successfully ${bulkAction}d ${selectedUsers.size} user(s)`)
        } catch (error) {
          console.error(`Error ${bulkAction}ing users:`, error)
          alert(`Failed to ${bulkAction} users`)
        }
        break
    }
  }

  const exportAllUsers = () => {
    const csv = [
      ["Email", "Display Name", "Role", "Total Views", "Total Bookmarks", "Total Progress", "Last Active"].join(","),
      ...filteredUsers.map((u) =>
        [
          u.email,
          u.display_name,
          u.role,
          u.total_views,
          u.total_bookmarks,
          u.total_progress,
          new Date(u.last_active).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        ].join(","),
      ),
    ].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `all-users-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header with Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold">User Management</h2>
            <p className="text-muted-foreground">
              {filteredUsers.length.toLocaleString()} {filteredUsers.length === 1 ? "user" : "users"}
              {hasActiveFilters && ` (filtered from ${userActivity.length.toLocaleString()})`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportAllUsers}>
              <Download className="mr-2 h-4 w-4" />
              Export All
            </Button>
            <Button size="sm">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite User
            </Button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedUsers.size > 0 && (
          <Card className="border-primary/50 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedUsers(new Set())}>
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction("export")
                      setIsBulkActionDialogOpen(true)
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Export Selected
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBulkAction("email")
                      setIsBulkActionDialogOpen(true)
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Email Selected
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setBulkAction("deactivate")
                          setIsBulkActionDialogOpen(true)
                        }}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        Deactivate Users
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setBulkAction("delete")
                          setIsBulkActionDialogOpen(true)
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-serif">All Users</CardTitle>
            <CardDescription>Manage user accounts, roles, and permissions</CardDescription>

            {/* Search and Filter Bar */}
            <div className="pt-4 space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by email, name, or ID..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="max-w-sm"
                />
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && <Badge className="ml-2" variant="secondary">Active</Badge>}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-2">
                    <Label htmlFor="role-filter">Role</Label>
                    <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value); setCurrentPage(1); }}>
                      <SelectTrigger id="role-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status-filter">Status</Label>
                    <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}>
                      <SelectTrigger id="status-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="banned">Banned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activity-filter">Activity</Label>
                    <Select value={activityFilter} onValueChange={(value) => { setActivityFilter(value); setCurrentPage(1); }}>
                      <SelectTrigger id="activity-filter">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Activity</SelectItem>
                        <SelectItem value="active_today">Active Today</SelectItem>
                        <SelectItem value="active_week">Active This Week</SelectItem>
                        <SelectItem value="active_month">Active This Month</SelectItem>
                        <SelectItem value="inactive">Inactive (&gt;30 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {/* Data Table */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-12 px-4 text-left align-middle font-medium">
                        <Checkbox
                          checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </th>
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
                          <SortIcon field="total_views" currentField={userSortField} direction={userSortDirection} />
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
                          <SortIcon field="total_progress" currentField={userSortField} direction={userSortDirection} />
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
                          <SortIcon field="last_active" currentField={userSortField} direction={userSortDirection} />
                        </Button>
                      </th>
                      <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="h-24 text-center text-muted-foreground">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      paginatedUsers.map((user) => {
                        const daysSinceActive = user.last_active
                          ? (Date.now() - new Date(user.last_active).getTime()) / (1000 * 60 * 60 * 24)
                          : 999
                        const isRecentlyActive = daysSinceActive <= 7

                        return (
                          <tr key={user.user_id} className="border-b transition-colors hover:bg-muted/50">
                            <td className="p-4 align-middle">
                              <Checkbox
                                checked={selectedUsers.has(user.user_id)}
                                onCheckedChange={() => toggleSelectUser(user.user_id)}
                              />
                            </td>
                            <td className="p-4 align-middle">
                              <div>
                                <p className="font-medium">{user.display_name || "Unknown"}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </td>
                            <td className="p-4 align-middle">
                              <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                            </td>
                            <td className="p-4 align-middle text-right">{user.total_views.toLocaleString()}</td>
                            <td className="p-4 align-middle text-right">{user.total_progress.toLocaleString()}</td>
                            <td className="p-4 align-middle">
                              <div className="flex items-center gap-2">
                                {isRecentlyActive && (
                                  <div className="h-2 w-2 rounded-full bg-green-500" title="Active this week" />
                                )}
                                <span className={isRecentlyActive ? "font-medium" : "text-muted-foreground"}>
                                  {user.last_active ? new Date(user.last_active).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }) : "Never"}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 align-middle text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setSelectedUser(user)
                                      setNewRole(user.role as "user" | "admin")
                                      setIsRoleDialogOpen(true)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Role
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => alert(`View details for ${user.email}`)}>
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => alert(`Send email to ${user.email}`)}>
                                    <Mail className="mr-2 h-4 w-4" />
                                    Send Email
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => alert(`Deactivate ${user.email}`)}>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      if (confirm(`Delete user ${user.email}?`)) {
                                        alert(`Would delete ${user.email}`)
                                      }
                                    }}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex.toLocaleString()} to {endIndex.toLocaleString()} of{" "}
                    {filteredUsers.length.toLocaleString()} users
                  </p>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(Number(value))
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 per page</SelectItem>
                      <SelectItem value="50">50 per page</SelectItem>
                      <SelectItem value="100">100 per page</SelectItem>
                      <SelectItem value="200">200 per page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Role Dialog */}
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

      {/* Bulk Action Dialog */}
      <Dialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Action</DialogTitle>
            <DialogDescription>
              Perform action on {selectedUsers.size} selected user{selectedUsers.size !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-action">Action</Label>
              <Select
                value={bulkAction}
                onValueChange={(value: "export" | "email" | "deactivate" | "delete") => setBulkAction(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="export">Export to CSV</SelectItem>
                  <SelectItem value="email">Send Email</SelectItem>
                  <SelectItem value="deactivate">Deactivate Users</SelectItem>
                  <SelectItem value="delete">Delete Users</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {bulkAction === "delete" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm text-destructive font-medium">
                  Warning: This action is permanent and cannot be undone!
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAction} variant={bulkAction === "delete" ? "destructive" : "default"}>
              Confirm Action
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
