"use client"

import { useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Shield, Plus, AlertTriangle, CheckCircle, Clock, Trash2, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface CoreGuardrail {
  id: string
  category: string
  name: string
  description: string
  is_enabled: boolean
  is_core: boolean
  severity: string
  prompt_guidance: string | null
  created_at: string
  updated_at: string
}

interface CustomGuardrail {
  id: string
  name: string
  description: string
  is_enabled: boolean
  keywords: string[]
  pattern: string | null
  severity: string
  prompt_guidance: string
  created_by: string
  created_at: string
  updated_at: string
}

interface AuditLogEntry {
  id: string
  guardrail_id: string | null
  guardrail_category: string | null
  action: string
  changed_by: string
  changes: any
  reason: string | null
  created_at: string
  changed_by_user: { id: string; email: string } | null
}

interface GuardrailsClientProps {
  coreGuardrails: CoreGuardrail[]
  customGuardrails: CustomGuardrail[]
  auditLog: AuditLogEntry[]
}

export function GuardrailsClient({
  coreGuardrails: initialCore,
  customGuardrails: initialCustom,
  auditLog: initialAudit,
}: GuardrailsClientProps) {
  const router = useRouter()
  const supabase = createClient()

  const [coreGuardrails, setCoreGuardrails] = useState(initialCore)
  const [customGuardrails, setCustomGuardrails] = useState(initialCustom)
  const [auditLog, setAuditLog] = useState(initialAudit)
  const [isAddingCustom, setIsAddingCustom] = useState(false)
  const [editingCustom, setEditingCustom] = useState<CustomGuardrail | null>(null)

  // New custom guardrail form
  const [newCustom, setNewCustom] = useState({
    name: "",
    description: "",
    keywords: "",
    pattern: "",
    severity: "medium",
    prompt_guidance: "",
  })

  const toggleCoreGuardrail = async (id: string, currentState: boolean) => {
    const newState = !currentState

    // Optimistic update
    setCoreGuardrails((prev) => prev.map((g) => (g.id === id ? { ...g, is_enabled: newState } : g)))

    const { error } = await supabase.from("guardrails").update({ is_enabled: newState }).eq("id", id)

    if (error) {
      console.error("Failed to toggle guardrail:", error)
      // Revert on error
      setCoreGuardrails((prev) => prev.map((g) => (g.id === id ? { ...g, is_enabled: currentState } : g)))
    } else {
      router.refresh()
    }
  }

  const toggleCustomGuardrail = async (id: string, currentState: boolean) => {
    const newState = !currentState

    // Optimistic update
    setCustomGuardrails((prev) => prev.map((g) => (g.id === id ? { ...g, is_enabled: newState } : g)))

    const { error } = await supabase.from("custom_guardrails").update({ is_enabled: newState }).eq("id", id)

    if (error) {
      console.error("Failed to toggle custom guardrail:", error)
      // Revert on error
      setCustomGuardrails((prev) => prev.map((g) => (g.id === id ? { ...g, is_enabled: currentState } : g)))
    } else {
      router.refresh()
    }
  }

  const createCustomGuardrail = async () => {
    if (!newCustom.name || !newCustom.description || !newCustom.prompt_guidance) {
      alert("Please fill in all required fields")
      return
    }

    const { error } = await supabase.from("custom_guardrails").insert({
      name: newCustom.name,
      description: newCustom.description,
      keywords: newCustom.keywords ? newCustom.keywords.split(",").map((k) => k.trim()) : [],
      pattern: newCustom.pattern || null,
      severity: newCustom.severity,
      prompt_guidance: newCustom.prompt_guidance,
    })

    if (error) {
      console.error("Failed to create custom guardrail:", error)
      alert("Failed to create guardrail")
    } else {
      setIsAddingCustom(false)
      setNewCustom({
        name: "",
        description: "",
        keywords: "",
        pattern: "",
        severity: "medium",
        prompt_guidance: "",
      })
      router.refresh()
    }
  }

  const updateCustomGuardrail = async () => {
    if (!editingCustom) return

    const { error } = await supabase
      .from("custom_guardrails")
      .update({
        name: editingCustom.name,
        description: editingCustom.description,
        keywords: editingCustom.keywords,
        pattern: editingCustom.pattern,
        severity: editingCustom.severity,
        prompt_guidance: editingCustom.prompt_guidance,
      })
      .eq("id", editingCustom.id)

    if (error) {
      console.error("Failed to update custom guardrail:", error)
      alert("Failed to update guardrail")
    } else {
      setEditingCustom(null)
      router.refresh()
    }
  }

  const deleteCustomGuardrail = async (id: string) => {
    if (!confirm("Are you sure you want to delete this guardrail?")) return

    const { error } = await supabase.from("custom_guardrails").delete().eq("id", id)

    if (error) {
      console.error("Failed to delete custom guardrail:", error)
      alert("Failed to delete guardrail")
    } else {
      router.refresh()
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "destructive"
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
      default:
        return "default"
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-serif text-3xl font-bold flex items-center gap-2">
                  <Shield className="h-8 w-8 text-primary" />
                  Guardrails Management
                </h1>
                <p className="text-muted-foreground mt-2">
                  Configure content moderation rules to protect the community
                </p>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Core Guardrails</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {coreGuardrails.filter((g) => g.is_enabled).length}/{coreGuardrails.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Custom Rules</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {customGuardrails.filter((g) => g.is_enabled).length}/{customGuardrails.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Active</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{auditLog.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Last 50 actions</p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="core" className="space-y-4">
              <TabsList>
                <TabsTrigger value="core">Core Guardrails</TabsTrigger>
                <TabsTrigger value="custom">Custom Rules</TabsTrigger>
                <TabsTrigger value="audit">Audit Log</TabsTrigger>
              </TabsList>

              {/* Core Guardrails Tab */}
              <TabsContent value="core" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Core Content Moderation</CardTitle>
                    <CardDescription>
                      These are essential moderation rules that protect the community. They can only be enabled or
                      disabled, not edited or deleted.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {coreGuardrails.map((guardrail) => (
                      <Card key={guardrail.id} className="border-l-4 border-l-primary/50">
                        <CardContent className="pt-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{guardrail.name}</h3>
                                <Badge variant={getSeverityColor(guardrail.severity)}>{guardrail.severity}</Badge>
                                {guardrail.is_enabled ? (
                                  <Badge variant="success">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Disabled
                                  </Badge>
                                )}
                              </div>

                              <p className="text-sm text-muted-foreground">{guardrail.description}</p>

                              {guardrail.prompt_guidance && (
                                <div className="mt-2 p-3 bg-muted rounded-lg">
                                  <p className="text-xs font-medium mb-1">AI Moderator Guidance:</p>
                                  <p className="text-xs text-muted-foreground">{guardrail.prompt_guidance}</p>
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground mt-2">
                                Category: <code className="bg-muted px-1 py-0.5 rounded">{guardrail.category}</code>
                              </p>
                            </div>

                            <div className="ml-4">
                              <Switch
                                checked={guardrail.is_enabled}
                                onCheckedChange={() => toggleCoreGuardrail(guardrail.id, guardrail.is_enabled)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Custom Guardrails Tab */}
              <TabsContent value="custom" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Custom Moderation Rules</CardTitle>
                        <CardDescription>
                          Create community-specific rules with keywords and patterns
                        </CardDescription>
                      </div>
                      <Dialog open={isAddingCustom} onOpenChange={setIsAddingCustom}>
                        <DialogTrigger asChild>
                          <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Rule
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Create Custom Guardrail</DialogTitle>
                            <DialogDescription>
                              Define a custom moderation rule with specific keywords or patterns
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="name">Rule Name *</Label>
                              <Input
                                id="name"
                                placeholder="e.g., Profanity Filter"
                                value={newCustom.name}
                                onChange={(e) => setNewCustom({ ...newCustom, name: e.target.value })}
                              />
                            </div>

                            <div>
                              <Label htmlFor="description">Description *</Label>
                              <Textarea
                                id="description"
                                placeholder="Describe what this rule protects against"
                                value={newCustom.description}
                                onChange={(e) => setNewCustom({ ...newCustom, description: e.target.value })}
                                rows={2}
                              />
                            </div>

                            <div>
                              <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                              <Input
                                id="keywords"
                                placeholder="e.g., spam, scam, phishing"
                                value={newCustom.keywords}
                                onChange={(e) => setNewCustom({ ...newCustom, keywords: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Content containing these words will be flagged (case-insensitive)
                              </p>
                            </div>

                            <div>
                              <Label htmlFor="pattern">Regex Pattern (optional)</Label>
                              <Input
                                id="pattern"
                                placeholder="e.g., \d{16} for credit card numbers"
                                value={newCustom.pattern}
                                onChange={(e) => setNewCustom({ ...newCustom, pattern: e.target.value })}
                              />
                              <p className="text-xs text-muted-foreground mt-1">Advanced: Regular expression pattern</p>
                            </div>

                            <div>
                              <Label htmlFor="severity">Severity</Label>
                              <Select value={newCustom.severity} onValueChange={(v) => setNewCustom({ ...newCustom, severity: v })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="prompt_guidance">AI Moderator Guidance *</Label>
                              <Textarea
                                id="prompt_guidance"
                                placeholder="Instructions for the AI moderator on how to handle this content"
                                value={newCustom.prompt_guidance}
                                onChange={(e) => setNewCustom({ ...newCustom, prompt_guidance: e.target.value })}
                                rows={3}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Explain to the AI how to identify and handle violations of this rule
                              </p>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddingCustom(false)}>
                              Cancel
                            </Button>
                            <Button onClick={createCustomGuardrail}>Create Rule</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {customGuardrails.length === 0 ? (
                      <div className="text-center py-12">
                        <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No custom rules yet</p>
                        <Button className="mt-4" onClick={() => setIsAddingCustom(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Your First Rule
                        </Button>
                      </div>
                    ) : (
                      customGuardrails.map((guardrail) => (
                        <Card key={guardrail.id} className="border-l-4 border-l-secondary/50">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-semibold text-lg">{guardrail.name}</h3>
                                  <Badge variant={getSeverityColor(guardrail.severity)}>{guardrail.severity}</Badge>
                                  {guardrail.is_enabled ? (
                                    <Badge variant="success">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline">Disabled</Badge>
                                  )}
                                </div>

                                <p className="text-sm text-muted-foreground">{guardrail.description}</p>

                                {guardrail.keywords && guardrail.keywords.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {guardrail.keywords.map((keyword, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {keyword}
                                      </Badge>
                                    ))}
                                  </div>
                                )}

                                {guardrail.pattern && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Pattern: <code className="bg-muted px-1 py-0.5 rounded">{guardrail.pattern}</code>
                                  </p>
                                )}

                                <div className="mt-2 p-3 bg-muted rounded-lg">
                                  <p className="text-xs font-medium mb-1">AI Moderator Guidance:</p>
                                  <p className="text-xs text-muted-foreground">{guardrail.prompt_guidance}</p>
                                </div>
                              </div>

                              <div className="ml-4 flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setEditingCustom(guardrail)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteCustomGuardrail(guardrail.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Switch
                                  checked={guardrail.is_enabled}
                                  onCheckedChange={() => toggleCustomGuardrail(guardrail.id, guardrail.is_enabled)}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Audit Log Tab */}
              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Trail</CardTitle>
                    <CardDescription>Track all changes to guardrails configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {auditLog.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
                      ) : (
                        auditLog.map((entry) => (
                          <div key={entry.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                            <Clock className="h-4 w-4 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {entry.action === "enabled" && "Enabled guardrail"}
                                {entry.action === "disabled" && "Disabled guardrail"}
                                {entry.action === "created" && "Created custom rule"}
                                {entry.action === "updated" && "Updated rule"}
                                {entry.action === "deleted" && "Deleted rule"}
                                {entry.guardrail_category && `: ${entry.guardrail_category}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                by {entry.changed_by_user?.email || "Unknown"} •{" "}
                                {new Date(entry.created_at).toLocaleString()}
                              </p>
                              {entry.reason && (
                                <p className="text-xs text-muted-foreground mt-1">Reason: {entry.reason}</p>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Edit Custom Guardrail Dialog */}
            {editingCustom && (
              <Dialog open={!!editingCustom} onOpenChange={() => setEditingCustom(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit Custom Guardrail</DialogTitle>
                    <DialogDescription>Update the rule configuration</DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Rule Name</Label>
                      <Input
                        id="edit-name"
                        value={editingCustom.name}
                        onChange={(e) => setEditingCustom({ ...editingCustom, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-description">Description</Label>
                      <Textarea
                        id="edit-description"
                        value={editingCustom.description}
                        onChange={(e) => setEditingCustom({ ...editingCustom, description: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="edit-keywords"
                        value={editingCustom.keywords.join(", ")}
                        onChange={(e) =>
                          setEditingCustom({
                            ...editingCustom,
                            keywords: e.target.value.split(",").map((k) => k.trim()),
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-pattern">Regex Pattern</Label>
                      <Input
                        id="edit-pattern"
                        value={editingCustom.pattern || ""}
                        onChange={(e) => setEditingCustom({ ...editingCustom, pattern: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-severity">Severity</Label>
                      <Select
                        value={editingCustom.severity}
                        onValueChange={(v) => setEditingCustom({ ...editingCustom, severity: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="edit-prompt_guidance">AI Moderator Guidance</Label>
                      <Textarea
                        id="edit-prompt_guidance"
                        value={editingCustom.prompt_guidance}
                        onChange={(e) => setEditingCustom({ ...editingCustom, prompt_guidance: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingCustom(null)}>
                      Cancel
                    </Button>
                    <Button onClick={updateCustomGuardrail}>Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
      </div>
    </AdminLayout>
  )
}
