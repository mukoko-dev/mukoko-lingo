"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Play, Loader2 } from "lucide-react"

interface Scenario {
  title: string
  setting: string
  yourRole: string
  theirRole: string
  context: string
  objectives: string[]
  starterMessage: string
  suggestedPhrases: string[]
}

interface ScenarioGeneratorProps {
  language: string
  onStartScenario: (scenario: Scenario) => void
}

const scenarioTypes = [
  { id: "market", label: "At the Market", icon: "🛒" },
  { id: "restaurant", label: "Restaurant", icon: "🍽️" },
  { id: "taxi", label: "Taking a Taxi", icon: "🚕" },
  { id: "hospital", label: "Hospital Visit", icon: "🏥" },
  { id: "school", label: "School Meeting", icon: "🏫" },
  { id: "office", label: "At Work", icon: "💼" },
  { id: "shop", label: "Shopping", icon: "👕" },
  { id: "home", label: "At Home", icon: "🏠" },
]

export function ScenarioGenerator({ language, onStartScenario }: ScenarioGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [error, setError] = useState("")

  const generateScenario = async (scenarioType: string) => {
    setLoading(true)
    setError("")
    setScenario(null) // Clear any existing scenario first
    try {
      const response = await fetch("/api/ai/generate-scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, scenarioType }),
      })

      if (!response.ok) throw new Error("Failed to generate scenario")

      const data = await response.json()
      setScenario(data.scenario)
    } catch (err) {
      console.error("[v0] Scenario generation error:", err)
      setError("Failed to generate scenario")
    } finally {
      setLoading(false)
    }
  }

  if (scenario) {
    return (
      <Card className="p-4 space-y-4">
        <div>
          <h3 className="font-serif text-xl font-bold mb-1">{scenario.title}</h3>
          <p className="text-sm text-muted-foreground">{scenario.setting}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <p className="text-sm font-medium mb-1">Your Role:</p>
            <Badge variant="secondary">{scenario.yourRole}</Badge>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">AI Plays:</p>
            <Badge variant="outline">{scenario.theirRole}</Badge>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Context:</p>
          <p className="text-sm text-muted-foreground">{scenario.context}</p>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Objectives:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {scenario.objectives.map((obj, i) => (
              <li key={i}>{obj}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Suggested Phrases:</p>
          <div className="flex flex-wrap gap-2">
            {scenario.suggestedPhrases.map((phrase, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {phrase}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={() => onStartScenario(scenario)} className="flex-1">
            <Play className="mr-2 h-4 w-4" />
            Start Scenario
          </Button>
          <Button onClick={() => setScenario(null)} variant="outline">
            Choose Different
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4">
      <h3 className="font-serif font-semibold mb-3 flex items-center gap-2">
        <BookOpen className="h-5 w-5" />
        Choose a Scenario
      </h3>

      {error && <p className="text-sm text-destructive mb-3">{error}</p>}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {scenarioTypes.map((type) => (
          <Button
            key={type.id}
            onClick={() => generateScenario(type.id)}
            disabled={loading}
            variant="outline"
            className="h-auto flex flex-col items-center justify-center gap-2 py-4 px-3 min-h-[5rem]"
          >
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <>
                <span className="text-3xl mb-1">{type.icon}</span>
                <span className="text-xs font-medium text-center leading-tight whitespace-normal">{type.label}</span>
              </>
            )}
          </Button>
        ))}
      </div>
    </Card>
  )
}
