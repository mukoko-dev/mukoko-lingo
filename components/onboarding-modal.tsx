"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sparkles, BookOpen, TrendingUp, MessageSquare, Target } from "lucide-react"

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  userName?: string
}

const steps = [
  {
    title: "Welcome to Nyuchi Lingo! 👋",
    description: "Let's take a quick tour of your language learning journey.",
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Learn Shona, Ndebele, English & Chinese with AI-powered tools. Perfect for anyone ages 13 and up!
        </p>
        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-sm font-medium">✨ What makes us special:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• 200+ essential phrases across 4 languages</li>
            <li>• AI conversation practice</li>
            <li>• Track your progress with streaks & goals</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    title: "Your Learning Path 📚",
    description: "Here's how to start learning effectively",
    icon: BookOpen,
    content: (
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary-500/20 text-secondary-500 font-bold">
            1
          </div>
          <div>
            <p className="font-medium">Browse Phrases</p>
            <p className="text-sm text-muted-foreground">Start with "Greetings" and mark your progress</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-500/20 text-accent-500 font-bold">
            2
          </div>
          <div>
            <p className="font-medium">Practice with AI</p>
            <p className="text-sm text-muted-foreground">Have real conversations in your target language</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold">
            3
          </div>
          <div>
            <p className="font-medium">Track Progress</p>
            <p className="text-sm text-muted-foreground">Watch your streaks grow and skills improve</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: "Try Our AI Tutor ✨",
    description: "Your personal language teacher is ready!",
    icon: MessageSquare,
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-br from-accent/10 to-primary/10 p-4 rounded-lg border border-primary/20">
          <p className="font-medium mb-2">AI Tutor Features:</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">💬</span>
              <span><strong>Free Practice:</strong> Chat about anything in your target language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">🎭</span>
              <span><strong>Scenarios:</strong> Role-play real situations like markets or restaurants</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">🌍</span>
              <span><strong>Translation Help:</strong> Get detailed explanations & cultural context</span>
            </li>
          </ul>
        </div>
        <p className="text-xs text-center text-muted-foreground">Find AI Tutor in the sidebar under "Learn"</p>
      </div>
    ),
  },
  {
    title: "Set Your Daily Goal 🎯",
    description: "Stay motivated with daily goals and streaks",
    icon: Target,
    content: (
      <div className="space-y-4">
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Today's Goal</span>
            <span className="text-2xl">🔥</span>
          </div>
          <Progress value={0} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">Learn 5 phrases daily to build your streak!</p>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Tips for Success:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Practice a little every day (consistency beats cramming!)</li>
            <li>• Save phrases you want to review later</li>
            <li>• Try AI conversations after learning new phrases</li>
          </ul>
        </div>
      </div>
    ),
  },
]

export function OnboardingModal({ isOpen, onClose, userName }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Save to localStorage that onboarding is complete
      localStorage.setItem("onboarding_completed", "true")
      onClose()
    }
  }

  const handleSkip = () => {
    localStorage.setItem("onboarding_completed", "true")
    onClose()
  }

  const progress = ((currentStep + 1) / steps.length) * 100
  const CurrentIcon = steps[currentStep].icon

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
              <CurrentIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-2xl">
                {steps[currentStep].title}
              </DialogTitle>
              <DialogDescription>
                {steps[currentStep].description}
              </DialogDescription>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <div className="py-6">
          {steps[currentStep].content}
        </div>

        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip} size="sm">
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep < steps.length - 1 ? "Next" : "Get Started!"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
