"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { DiagnosticAssessment, AssessmentResults } from "@/components/diagnostic-assessment"
import { DiagnosticResultsView } from "@/components/diagnostic-results"
import { useUILanguage } from "@/lib/hooks/use-ui-language"
import type { SkillName, ProficiencyLevel } from "@/lib/types/skills"

interface ProcessedResults {
  scores: Record<SkillName, number>
  overallScore: number
  overallProficiency: ProficiencyLevel
  skillLevels: Record<SkillName, ProficiencyLevel>
  timeSpent: number
}

export function DiagnosticClient() {
  const router = useRouter()
  const { uiLanguage } = useUILanguage()
  const [phase, setPhase] = useState<"assessment" | "results">("assessment")
  const [results, setResults] = useState<ProcessedResults | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleComplete = async (assessmentResults: AssessmentResults) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/assessments/submit-diagnostic", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentResults),
      })

      if (!response.ok) {
        throw new Error("Failed to submit assessment")
      }

      const data = await response.json()
      setResults(data.results)
      setPhase("results")
    } catch (err) {
      console.error("Error submitting assessment:", err)
      setError("Failed to submit assessment. Please try again.")
      setIsSubmitting(false)
    }
  }

  const handleStartLearning = () => {
    router.push("/app/home")
  }

  const handleViewSkills = () => {
    router.push("/app/skills")
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
              {error}
            </div>
          )}

          {phase === "assessment" && (
            <DiagnosticAssessment
              onComplete={handleComplete}
              language={uiLanguage}
            />
          )}

          {phase === "results" && results && (
            <DiagnosticResultsView
              results={results}
              onStartLearning={handleStartLearning}
              onViewSkills={handleViewSkills}
            />
          )}
        </main>
      </SidebarLayout>
    </div>
  )
}
