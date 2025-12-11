"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { SkillName, ProficiencyLevel } from "@/lib/types/skills"
import {
  Mic,
  BookOpen,
  Languages,
  Brain,
  MessageCircle,
  Trophy,
  ArrowRight,
  BarChart3,
  Sparkles,
} from "lucide-react"

interface DiagnosticResultsProps {
  results: {
    scores: Record<SkillName, number>
    overallScore: number
    overallProficiency: ProficiencyLevel
    skillLevels: Record<SkillName, ProficiencyLevel>
    timeSpent: number
  }
  onStartLearning: () => void
  onViewSkills: () => void
}

const skillIcons: Record<SkillName, React.ReactNode> = {
  pronunciation: <Mic className="h-5 w-5" />,
  vocabulary: <BookOpen className="h-5 w-5" />,
  grammar: <Languages className="h-5 w-5" />,
  comprehension: <Brain className="h-5 w-5" />,
  conversation: <MessageCircle className="h-5 w-5" />,
}

const skillDisplayNames: Record<SkillName, string> = {
  pronunciation: "Pronunciation",
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  comprehension: "Comprehension",
  conversation: "Conversation",
}

const levelDisplayNames: Record<ProficiencyLevel, string> = {
  beginner: "Beginner",
  elementary: "Elementary",
  intermediate: "Intermediate",
  advanced: "Advanced",
  fluent: "Fluent",
}

const levelColors: Record<ProficiencyLevel, { bg: string; text: string; progress: string }> = {
  beginner: {
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-400",
    progress: "bg-red-500",
  },
  elementary: {
    bg: "bg-orange-100 dark:bg-orange-900/30",
    text: "text-orange-700 dark:text-orange-400",
    progress: "bg-orange-500",
  },
  intermediate: {
    bg: "bg-yellow-100 dark:bg-yellow-900/30",
    text: "text-yellow-700 dark:text-yellow-400",
    progress: "bg-yellow-500",
  },
  advanced: {
    bg: "bg-green-100 dark:bg-green-900/30",
    text: "text-green-700 dark:text-green-400",
    progress: "bg-green-500",
  },
  fluent: {
    bg: "bg-blue-100 dark:bg-blue-900/30",
    text: "text-blue-700 dark:text-blue-400",
    progress: "bg-blue-500",
  },
}

const levelMessages: Record<ProficiencyLevel, { title: string; description: string }> = {
  beginner: {
    title: "Welcome to Your Shona Journey!",
    description: "You're at the beginning of an exciting language learning adventure. Our AI tutor will provide maximum support with simple vocabulary and plenty of explanations.",
  },
  elementary: {
    title: "Building Your Foundation!",
    description: "You have some Shona knowledge to build on. Our AI tutor will help you expand your vocabulary and practice everyday conversations.",
  },
  intermediate: {
    title: "Growing Your Skills!",
    description: "You have a solid foundation in Shona. Our AI tutor will challenge you with more complex conversations and help refine your skills.",
  },
  advanced: {
    title: "Approaching Fluency!",
    description: "Your Shona is strong! Our AI tutor will engage you in sophisticated conversations and help you master nuances and cultural expressions.",
  },
  fluent: {
    title: "Impressive Proficiency!",
    description: "You have excellent Shona skills! Our AI tutor will treat you as a peer and help you maintain and refine your native-like abilities.",
  },
}

export function DiagnosticResultsView({ results, onStartLearning, onViewSkills }: DiagnosticResultsProps) {
  const overallColors = levelColors[results.overallProficiency]
  const overallMessage = levelMessages[results.overallProficiency]

  // Format time spent
  const minutes = Math.floor(results.timeSpent / 60)
  const seconds = results.timeSpent % 60

  // Find strongest and weakest skills
  const skillScores = Object.entries(results.scores) as [SkillName, number][]
  const strongestSkill = skillScores.reduce((a, b) => (a[1] > b[1] ? a : b))[0]
  const weakestSkill = skillScores.reduce((a, b) => (a[1] < b[1] ? a : b))[0]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Overall Results Card */}
      <Card className="border-2 overflow-hidden">
        <div className={cn("px-6 py-8 text-center", overallColors.bg)}>
          <div className="flex justify-center mb-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center",
              "bg-white dark:bg-gray-900 shadow-lg"
            )}>
              <Trophy className={cn("h-10 w-10", overallColors.text)} />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{overallMessage.title}</h1>
          <p className="text-muted-foreground max-w-md mx-auto">{overallMessage.description}</p>
        </div>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Your Overall Level</p>
              <p className={cn("text-2xl font-bold", overallColors.text)}>
                {levelDisplayNames[results.overallProficiency]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Overall Score</p>
              <p className="text-2xl font-bold">{results.overallScore}%</p>
            </div>
          </div>
          <Progress
            value={results.overallScore}
            className="h-3"
          />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Completed in {minutes}m {seconds}s
          </p>
        </CardContent>
      </Card>

      {/* Skills Breakdown */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Skills Breakdown
          </CardTitle>
          <CardDescription>
            Your proficiency level in each skill area
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(Object.entries(results.scores) as [SkillName, number][]).map(([skill, score]) => {
            const level = results.skillLevels[skill]
            const colors = levelColors[level]
            const isStrongest = skill === strongestSkill
            const isWeakest = skill === weakestSkill

            return (
              <div key={skill} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      colors.bg, colors.text
                    )}>
                      {skillIcons[skill]}
                    </div>
                    <div>
                      <p className="font-medium flex items-center gap-2">
                        {skillDisplayNames[skill]}
                        {isStrongest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Strongest
                          </span>
                        )}
                        {isWeakest && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                            Focus Area
                          </span>
                        )}
                      </p>
                      <p className={cn("text-sm", colors.text)}>
                        {levelDisplayNames[level]}
                      </p>
                    </div>
                  </div>
                  <p className="font-bold">{score}%</p>
                </div>
                <Progress value={score} className="h-2" />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* AI Tutor Personalization */}
      <Card className="border-2 bg-gradient-to-br from-primary-700/5 to-secondary-500/5 dark:from-primary-600/10 dark:to-secondary-500/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-700/10 dark:bg-primary-600/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-6 w-6 text-primary-700 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Your AI Tutor is Ready!</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Based on your results, your AI tutor will now adapt to your level:
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • <strong>Vocabulary:</strong>{" "}
                  {results.overallProficiency === "beginner" || results.overallProficiency === "elementary"
                    ? "Simple, everyday words"
                    : results.overallProficiency === "intermediate"
                    ? "Varied vocabulary with some advanced terms"
                    : "Sophisticated vocabulary and idioms"}
                </li>
                <li>
                  • <strong>Grammar:</strong>{" "}
                  {results.overallProficiency === "beginner"
                    ? "Present tense only, simple structures"
                    : results.overallProficiency === "elementary"
                    ? "Basic tenses, common patterns"
                    : "Complex structures and all tenses"}
                </li>
                <li>
                  • <strong>Support:</strong>{" "}
                  {results.overallProficiency === "beginner" || results.overallProficiency === "elementary"
                    ? "Maximum explanations and guidance"
                    : results.overallProficiency === "intermediate"
                    ? "Moderate support when needed"
                    : "Light support, peer-level conversation"}
                </li>
                <li>
                  • <strong>Focus Area:</strong> Extra practice for{" "}
                  <span className="font-medium text-primary-700 dark:text-primary-400">
                    {skillDisplayNames[weakestSkill]}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          size="lg"
          className="flex-1 bg-[#5f5873] hover:bg-[#4a4560] text-white dark:bg-[#7c73e6] dark:hover:bg-[#6b63d5]"
          onClick={onStartLearning}
        >
          Start Learning
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="flex-1"
          onClick={onViewSkills}
        >
          <BarChart3 className="mr-2 h-5 w-5" />
          View Skills Dashboard
        </Button>
      </div>
    </div>
  )
}
