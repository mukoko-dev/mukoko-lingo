import { MarketingLayout } from "@/components/marketing-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Languages,
  MessageSquare,
  BookOpen,
  Mic,
  Target,
  Heart,
  TrendingUp,
  BookmarkPlus,
  BarChart3,
  Sparkles,
  Globe,
  Users,
  Clock,
  CheckCircle2,
  Zap,
  Shield,
  MessageCircle,
  Award,
  Brain,
  Map
} from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Features - Nyuchi Lingo",
  description:
    "Discover all the features that make Nyuchi Lingo the best platform for learning Shona, Ndebele, English, and Chinese. AI-powered tutoring, 200+ phrases, progress tracking, and more.",
}

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-white dark:bg-background py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-sm font-semibold text-primary mb-4 tracking-wide uppercase">Features</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-balance">
              Everything you need to master Zimbabwe's languages
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              From essential phrases to AI-powered conversations, Nyuchi Lingo provides
              comprehensive tools designed specifically for African language learning.
            </p>
            <Button asChild size="lg" className="text-base px-8">
              <Link href="/auth/login">Start for free</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 sm:py-32 border-t bg-[#faf9f5] dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary mb-3 tracking-wide uppercase">Core Features</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Built from the ground up for African languages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature is designed to help you communicate confidently in
              Shona, Ndebele, English, and Chinese.
            </p>
          </div>

          <div className="grid gap-12 max-w-5xl mx-auto">
            {/* Feature: Side-by-Side Languages */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Languages className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">4 Languages Side-by-Side</h3>
                <p className="text-muted-foreground mb-4">
                  See English, Shona, Ndebele, and Chinese together with pronunciation
                  guides for each language. Understand similarities and differences at a glance.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Phonetic pronunciation for every phrase
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Cultural context and usage notes
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Audio pronunciation guides (coming soon)
                    </span>
                  </li>
                </ul>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">English</p>
                      <p className="font-semibold">Good morning</p>
                      <p className="text-sm text-muted-foreground italic">gud mawr-ning</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Shona</p>
                      <p className="font-semibold">Mangwanani</p>
                      <p className="text-sm text-muted-foreground italic">mahn-gwah-nah-nee</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Ndebele</p>
                      <p className="font-semibold">Livukile</p>
                      <p className="text-sm text-muted-foreground italic">lee-voo-kee-leh</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Chinese</p>
                      <p className="font-semibold">早上好</p>
                      <p className="text-sm text-muted-foreground italic">zǎo shàng hǎo</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature: AI Tutor */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <Card className="bg-muted/50 md:order-1">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold">You:</span> I'm visiting Victoria Falls
                        next week. Can you help me practice greetings?
                      </p>
                    </div>
                    <div className="bg-secondary-500/10 p-3 rounded-lg">
                      <p className="text-sm">
                        <span className="font-semibold">AI Tutor:</span> Of course! Let's start
                        with basic greetings in Shona. Say "Mangwanani" (mahn-gwah-nah-nee)
                        for "Good morning"...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="md:order-0">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI Conversation Practice</h3>
                <p className="text-muted-foreground mb-4">
                  Practice real conversations with our AI tutor powered by Claude. Get instant
                  feedback, corrections, and personalized learning paths.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Adapts to your proficiency level
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Scenario-based practice (travel, business, casual)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">
                      Real-time corrections and feedback
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature: 200+ Phrases */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-3">200+ Essential Phrases</h3>
                <p className="text-muted-foreground mb-4">
                  Master the most important phrases organized by category. From greetings
                  to emergencies, we've got you covered.
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Greetings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Shopping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Directions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Emergencies</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Food & Dining</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Business</span>
                  </div>
                </div>
              </div>
              <Card className="bg-muted/50">
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-1">Greetings & Basics</p>
                        <p className="text-xs text-muted-foreground">Hello, goodbye, thank you, please</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Map className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-1">Travel & Directions</p>
                        <p className="text-xs text-muted-foreground">Where is...? How much...? Taxi, hotel</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm mb-1">Business & Professional</p>
                        <p className="text-xs text-muted-foreground">Meeting phrases, introductions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Features */}
      <section className="py-20 sm:py-32 bg-[#d4634a]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">Learning Tools</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Powerful tools to accelerate your learning
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Progress Tracking */}
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track phrases you're learning, have practiced, and mastered. See your
                  progress over time.
                </p>
              </CardContent>
            </Card>

            {/* Bookmarks */}
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BookmarkPlus className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Bookmarks</h3>
                <p className="text-sm text-muted-foreground">
                  Save your favorite phrases for quick access and focused practice sessions.
                </p>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Learning Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  View detailed stats on your study sessions, streaks, and most practiced
                  categories.
                </p>
              </CardContent>
            </Card>

            {/* Study Streaks */}
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Study Streaks</h3>
                <p className="text-sm text-muted-foreground">
                  Build consistent learning habits with daily streaks and milestone rewards.
                </p>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered phrase recommendations based on your learning history and
                  goals.
                </p>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Achievements</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock badges and achievements as you progress through your language
                  learning journey.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Built for Africa */}
      <section className="py-20 sm:py-32 bg-white dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Built for Africa</h2>
            <p className="text-lg text-muted-foreground">
              Nyuchi Lingo is designed specifically for African languages and culture,
              with features that matter to African learners.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Cultural Context</h3>
              <p className="text-sm text-muted-foreground">
                Every phrase includes cultural context and usage notes from native speakers.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Real Conversations</h3>
              <p className="text-sm text-muted-foreground">
                Learn how people actually speak, not just formal textbook language.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Safe & Respectful</h3>
              <p className="text-sm text-muted-foreground">
                AI moderation ensures respectful learning with cultural sensitivity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Start learning today
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              All features are free to get started. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/auth/login">Start for free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 border-2 border-white text-white hover:bg-white hover:text-black">
                <Link href="/about">Learn more</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
