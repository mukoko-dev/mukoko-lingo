"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { BookOpen, Edit, CheckCircle2, AlertCircle, Plus, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface LearningStandard {
  id: string
  level: "beginner" | "novice" | "advanced" | "fluent"
  level_order: number
  title: string
  description: string
  criteria: {
    vocabulary_size: number
    sentence_complexity: string
    conversation_length: string
    pronunciation_focus: string
    comprehension_level: string
  }
  vocabulary_range: string
  conversation_types: string[]
  grammar_concepts: string[]
  ai_prompt_template: string
  example_phrases: string[]
  is_active: boolean
}

interface LearningStandardsManagerProps {
  standards: LearningStandard[]
}

export function LearningStandardsManager({ standards }: LearningStandardsManagerProps) {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedStandard, setSelectedStandard] = useState<LearningStandard | null>(null)
  const [formData, setFormData] = useState<Partial<LearningStandard>>({})

  const levelColors = {
    beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    novice: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    fluent: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  }

  const openEditDialog = (standard: LearningStandard) => {
    setSelectedStandard(standard)
    setFormData({
      title: standard.title,
      description: standard.description,
      vocabulary_range: standard.vocabulary_range,
      ai_prompt_template: standard.ai_prompt_template,
      conversation_types: standard.conversation_types,
      grammar_concepts: standard.grammar_concepts,
      example_phrases: standard.example_phrases,
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (standard: LearningStandard) => {
    if (!confirm(`Are you sure you want to delete the "${standard.title}" standard?`)) return

    try {
      const response = await fetch(`/api/admin/learning-standards/${standard.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete standard")

      router.refresh()
      alert("Learning standard deleted successfully")
    } catch (error) {
      console.error("Error deleting standard:", error)
      alert("Failed to delete learning standard")
    }
  }

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/admin/learning-standards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error("Failed to create standard")

      setIsCreateDialogOpen(false)
      setFormData({})
      router.refresh()
      alert("Learning standard created successfully")
    } catch (error) {
      console.error("Error creating standard:", error)
      alert("Failed to create learning standard")
    }
  }

  const handleSave = async () => {
    if (!selectedStandard) return

    try {
      const response = await fetch("/api/admin/learning-standards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedStandard.id,
          ...formData,
        }),
      })

      if (!response.ok) throw new Error("Failed to update standard")

      setIsEditDialogOpen(false)
      router.refresh()
      alert("Learning standard updated successfully")
    } catch (error) {
      console.error("Error updating standard:", error)
      alert("Failed to update learning standard")
    }
  }

  const toggleActive = async (standard: LearningStandard) => {
    try {
      const response = await fetch("/api/admin/learning-standards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: standard.id,
          is_active: !standard.is_active,
        }),
      })

      if (!response.ok) throw new Error("Failed to toggle standard")

      router.refresh()
    } catch (error) {
      console.error("Error toggling standard:", error)
      alert("Failed to toggle learning standard")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Learning Standards Management
          </h2>
          <p className="text-muted-foreground mt-1">
            Define proficiency levels that govern AI learning capabilities and recommendations
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Standard
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {standards
          .sort((a, b) => a.level_order - b.level_order)
          .map((standard) => (
            <Card key={standard.id} className={`border-l-4 ${!standard.is_active ? "opacity-60" : ""}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={levelColors[standard.level]}>{standard.level.toUpperCase()}</Badge>
                      {standard.is_active ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardTitle className="font-serif">{standard.title}</CardTitle>
                    <CardDescription>{standard.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(standard)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(standard)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-muted-foreground">Vocabulary</p>
                    <p>{standard.vocabulary_range}</p>
                  </div>
                  <div>
                    <p className="font-medium text-muted-foreground">Level Order</p>
                    <p>{standard.level_order}</p>
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-2">Conversation Types</p>
                  <div className="flex flex-wrap gap-1">
                    {standard.conversation_types?.map((type, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">None defined</span>}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-2">Grammar Concepts</p>
                  <div className="flex flex-wrap gap-1">
                    {standard.grammar_concepts?.slice(0, 3).map((concept, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {concept}
                      </Badge>
                    )) || <span className="text-sm text-muted-foreground">None defined</span>}
                    {standard.grammar_concepts && standard.grammar_concepts.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{standard.grammar_concepts.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-medium text-sm text-muted-foreground mb-2">Example Phrases</p>
                  <ul className="text-sm space-y-1">
                    {standard.example_phrases?.slice(0, 2).map((phrase, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        • {phrase}
                      </li>
                    )) || <li className="text-muted-foreground">None defined</li>}
                  </ul>
                </div>

                <div className="pt-4 border-t">
                  <Button
                    variant={standard.is_active ? "outline" : "default"}
                    size="sm"
                    className="w-full"
                    onClick={() => toggleActive(standard)}
                  >
                    {standard.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Learning Standard</DialogTitle>
            <DialogDescription>Update the {selectedStandard?.level} level standard configuration</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="vocabulary_range">Vocabulary Range</Label>
              <Input
                id="vocabulary_range"
                value={formData.vocabulary_range || ""}
                onChange={(e) => setFormData({ ...formData, vocabulary_range: e.target.value })}
                placeholder="e.g., 50-150 words"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai_prompt_template">AI Prompt Template</Label>
              <Textarea
                id="ai_prompt_template"
                value={formData.ai_prompt_template || ""}
                onChange={(e) => setFormData({ ...formData, ai_prompt_template: e.target.value })}
                rows={4}
                placeholder="Instructions for AI when teaching at this level..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="conversation_types">Conversation Types (comma separated)</Label>
              <Input
                id="conversation_types"
                value={formData.conversation_types?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conversation_types: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="grammar_concepts">Grammar Concepts (comma separated)</Label>
              <Input
                id="grammar_concepts"
                value={formData.grammar_concepts?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    grammar_concepts: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="example_phrases">Example Phrases (comma separated)</Label>
              <Textarea
                id="example_phrases"
                value={formData.example_phrases?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    example_phrases: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Learning Standard</DialogTitle>
            <DialogDescription>Add a new proficiency level standard</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new-level">Level</Label>
              <Input
                id="new-level"
                value={formData.level || ""}
                onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                placeholder="beginner, novice, advanced, fluent"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-level-order">Level Order</Label>
              <Input
                id="new-level-order"
                type="number"
                value={formData.level_order || ""}
                onChange={(e) => setFormData({ ...formData, level_order: Number.parseInt(e.target.value) })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-title">Title</Label>
              <Input
                id="new-title"
                value={formData.title || ""}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-description">Description</Label>
              <Textarea
                id="new-description"
                value={formData.description || ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-vocabulary-range">Vocabulary Range</Label>
              <Input
                id="new-vocabulary-range"
                value={formData.vocabulary_range || ""}
                onChange={(e) => setFormData({ ...formData, vocabulary_range: e.target.value })}
                placeholder="e.g., 0-50 phrases"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-ai-prompt">AI Prompt Template</Label>
              <Textarea
                id="new-ai-prompt"
                value={formData.ai_prompt_template || ""}
                onChange={(e) => setFormData({ ...formData, ai_prompt_template: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-conversation-types">Conversation Types (comma separated)</Label>
              <Input
                id="new-conversation-types"
                value={formData.conversation_types?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conversation_types: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-grammar-concepts">Grammar Concepts (comma separated)</Label>
              <Input
                id="new-grammar-concepts"
                value={formData.grammar_concepts?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    grammar_concepts: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-example-phrases">Example Phrases (comma separated)</Label>
              <Textarea
                id="new-example-phrases"
                value={formData.example_phrases?.join(", ") || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    example_phrases: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Standard</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
