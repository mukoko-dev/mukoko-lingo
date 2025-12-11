"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  diagnosticAssessment,
  getQuestionsBySkill,
  getAssessmentSkills,
  type DiagnosticQuestion,
} from "@/lib/data/diagnostic-assessment"
import type { SkillName } from "@/lib/types/skills"
import {
  Mic,
  BookOpen,
  Languages,
  Brain,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  Loader2,
} from "lucide-react"

interface DiagnosticAssessmentProps {
  onComplete: (results: AssessmentResults) => void
  language?: string
}

export interface AssessmentResults {
  answers: Record<string, string>
  scores: Record<SkillName, number>
  overallScore: number
  completedAt: string
  timeSpent: number // seconds
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

const skillDescriptions: Record<SkillName, string> = {
  pronunciation: "How well you can produce Shona sounds and tones",
  vocabulary: "Your knowledge of Shona words and expressions",
  grammar: "Understanding of sentence structure and verb forms",
  comprehension: "Ability to understand spoken and written Shona",
  conversation: "Practical communication skills in real situations",
}

export function DiagnosticAssessment({ onComplete, language = "en" }: DiagnosticAssessmentProps) {
  const [currentPhase, setCurrentPhase] = useState<"intro" | "assessment" | "submitting">("intro")
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [startTime] = useState(Date.now())

  const skills = getAssessmentSkills()
  const currentSkill = skills[currentSkillIndex]
  const skillQuestions = getQuestionsBySkill(currentSkill)
  const currentQuestion = skillQuestions[currentQuestionIndex]

  const totalQuestions = diagnosticAssessment.questions.length
  const answeredQuestions = Object.keys(answers).length
  const progress = (answeredQuestions / totalQuestions) * 100

  const handleAnswer = useCallback((questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }))
  }, [])

  const handleNext = useCallback(() => {
    if (currentQuestionIndex < skillQuestions.length - 1) {
      // Next question in current skill
      setCurrentQuestionIndex((prev) => prev + 1)
    } else if (currentSkillIndex < skills.length - 1) {
      // Move to next skill
      setCurrentSkillIndex((prev) => prev + 1)
      setCurrentQuestionIndex(0)
    } else {
      // Assessment complete - submit
      handleSubmit()
    }
  }, [currentQuestionIndex, currentSkillIndex, skillQuestions.length, skills.length])

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else if (currentSkillIndex > 0) {
      setCurrentSkillIndex((prev) => prev - 1)
      const prevSkillQuestions = getQuestionsBySkill(skills[currentSkillIndex - 1])
      setCurrentQuestionIndex(prevSkillQuestions.length - 1)
    }
  }, [currentQuestionIndex, currentSkillIndex, skills])

  const handleSubmit = useCallback(async () => {
    setCurrentPhase("submitting")

    // Calculate scores for each skill
    const scores: Record<SkillName, number> = {} as Record<SkillName, number>
    let totalScore = 0

    for (const skill of skills) {
      const questions = getQuestionsBySkill(skill)
      let skillPoints = 0
      let maxPoints = 0

      for (const q of questions) {
        maxPoints += q.points
        if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
          skillPoints += q.points
        }
      }

      scores[skill] = maxPoints > 0 ? Math.round((skillPoints / maxPoints) * 100) : 0
      totalScore += scores[skill]
    }

    const overallScore = Math.round(totalScore / skills.length)
    const timeSpent = Math.round((Date.now() - startTime) / 1000)

    const results: AssessmentResults = {
      answers,
      scores,
      overallScore,
      completedAt: new Date().toISOString(),
      timeSpent,
    }

    onComplete(results)
  }, [answers, skills, startTime, onComplete])

  const isFirstQuestion = currentSkillIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion = currentSkillIndex === skills.length - 1 && currentQuestionIndex === skillQuestions.length - 1
  const currentAnswer = answers[currentQuestion?.id]

  // Intro screen
  if (currentPhase === "intro") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2">
          <CardHeader className="text-center pb-2">
            {/* Shamwari mascot */}
            <div className="relative w-20 h-20 mx-auto mb-4">
              <Image
                src="/Shamwari_logo_Mascot.svg"
                alt="Shamwari - Your AI Language Tutor"
                width={80}
                height={80}
                className="w-full h-full object-contain drop-shadow-lg"
                priority
              />
            </div>
            <CardTitle className="text-2xl">{diagnosticAssessment.title[language] || diagnosticAssessment.title.en}</CardTitle>
            <CardDescription className="text-base mt-2">
              Hi! I&apos;m Shamwari, your friendly learning companion. Let&apos;s discover your current level together!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-3">
              {skills.map((skill) => (
                <div
                  key={skill}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-700/10 text-primary-700 dark:bg-primary-600/20 dark:text-primary-400">
                    {skillIcons[skill]}
                  </div>
                  <div>
                    <p className="font-medium">{skillDisplayNames[skill]}</p>
                    <p className="text-sm text-muted-foreground">{skillDescriptions[skill]}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">50</p>
                <p className="text-sm text-muted-foreground">Questions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">~15</p>
                <p className="text-sm text-muted-foreground">Minutes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">5</p>
                <p className="text-sm text-muted-foreground">Skills</p>
              </div>
            </div>

            <div className="bg-secondary-500/10 border border-secondary-500/20 rounded-lg p-4">
              <p className="text-sm text-secondary-700 dark:text-secondary-400">
                <strong>Shamwari&apos;s Tip:</strong> Answer honestly, friend! This helps me personalize your learning journey.
                There&apos;s no penalty for wrong answers - we&apos;re just finding your starting point together.
              </p>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#5f5873] hover:bg-[#4a4560] text-white dark:bg-[#7c73e6] dark:hover:bg-[#6b63d5]"
              onClick={() => setCurrentPhase("assessment")}
            >
              Start Assessment
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Submitting screen
  if (currentPhase === "submitting") {
    return (
      <div className="max-w-md mx-auto">
        <Card className="border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary-700 dark:text-primary-400 mb-4" />
            <p className="text-lg font-medium">Calculating your results...</p>
            <p className="text-sm text-muted-foreground mt-2">This will just take a moment</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Assessment screen
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {skillDisplayNames[currentSkill]} - Question {currentQuestionIndex + 1} of {skillQuestions.length}
          </span>
          <span className="text-muted-foreground">
            {answeredQuestions} of {totalQuestions} answered
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Skill Navigation Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {skills.map((skill, index) => {
          const isCompleted = index < currentSkillIndex || (index === currentSkillIndex && currentQuestionIndex === skillQuestions.length - 1 && answers[currentQuestion?.id])
          const isCurrent = index === currentSkillIndex
          const hasAnswers = getQuestionsBySkill(skill).some((q) => answers[q.id])

          return (
            <button
              key={skill}
              onClick={() => {
                if (index <= currentSkillIndex || hasAnswers) {
                  setCurrentSkillIndex(index)
                  setCurrentQuestionIndex(0)
                }
              }}
              disabled={index > currentSkillIndex && !hasAnswers}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                isCurrent
                  ? "bg-[#5f5873] text-white dark:bg-[#7c73e6]"
                  : isCompleted
                  ? "bg-secondary-500/20 text-secondary-700 dark:text-secondary-400"
                  : "bg-muted text-muted-foreground",
                index > currentSkillIndex && !hasAnswers && "opacity-50 cursor-not-allowed"
              )}
            >
              {skillIcons[skill]}
              {skillDisplayNames[skill]}
              {isCompleted && index < currentSkillIndex && <Check className="h-4 w-4" />}
            </button>
          )
        })}
      </div>

      {/* Question Card */}
      <Card className="border-2">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <span className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              currentQuestion?.difficulty <= 2
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : currentQuestion?.difficulty <= 4
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            )}>
              {currentQuestion?.difficulty <= 2 ? "Basic" : currentQuestion?.difficulty <= 4 ? "Intermediate" : "Advanced"}
            </span>
            <span>{currentQuestion?.points} points</span>
          </div>
          <CardTitle className="text-xl leading-relaxed">
            {currentQuestion?.question[language as keyof typeof currentQuestion.question] || currentQuestion?.question.en}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentQuestion?.type === "multiple_choice" && currentQuestion.options && (
            <RadioGroup
              value={currentAnswer || ""}
              onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
              className="space-y-3"
            >
              {currentQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <RadioGroupItem
                    value={option}
                    id={`option-${index}`}
                    className="border-2"
                  />
                  <Label
                    htmlFor={`option-${index}`}
                    className={cn(
                      "flex-1 cursor-pointer p-3 rounded-lg border-2 transition-colors",
                      currentAnswer === option
                        ? "border-primary-700 bg-primary-700/5 dark:border-primary-400 dark:bg-primary-400/10"
                        : "border-transparent hover:bg-muted/50"
                    )}
                  >
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={isFirstQuestion}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <Button
          onClick={handleNext}
          disabled={!currentAnswer}
          className={cn(
            "gap-2",
            isLastQuestion
              ? "bg-secondary-500 hover:bg-secondary-600 text-white"
              : "bg-[#5f5873] hover:bg-[#4a4560] text-white dark:bg-[#7c73e6] dark:hover:bg-[#6b63d5]"
          )}
        >
          {isLastQuestion ? (
            <>
              Complete Assessment
              <Check className="h-4 w-4" />
            </>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Skip Option */}
      <p className="text-center text-sm text-muted-foreground">
        Not sure? You can{" "}
        <button
          onClick={() => {
            handleAnswer(currentQuestion.id, "__skipped__")
            handleNext()
          }}
          className="text-primary-700 dark:text-primary-400 hover:underline"
        >
          skip this question
        </button>
        {" "}and come back later.
      </p>
    </div>
  )
}
