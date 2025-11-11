"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Languages,
  MessageSquare,
  BookOpen,
  Sparkles,
  Users,
  Globe,
  Mic,
  Target,
  TrendingUp,
  Shield,
  Zap,
  Heart,
  ArrowRight
} from "lucide-react"

export function MarketingHome() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Announcement Banner */}
            <div className="inline-flex items-center gap-2 bg-[#d4634a] text-white px-4 py-2 rounded-full text-sm font-medium mb-8 hover:scale-105 transition-transform">
              <Sparkles className="h-4 w-4 text-white" />
              <span>AI-powered language learning for Zimbabwe</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-balance">
              Language learning,
              <br />
              <span className="bg-gradient-to-r from-primary-700 via-primary-600 to-primary-500 bg-clip-text text-transparent">
                built for Africa
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-balance leading-relaxed">
              Master Shona, Ndebele, English, and Chinese with AI-powered tools.
              Perfect for tourists, expats, business professionals, and locals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow group">
                <Link href="/auth/login">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 border-2">
                <Link href="/features">Explore features</Link>
              </Button>
            </div>
          </div>
        </div>

      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/50 bg-[#d4634a]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">200+</div>
              <div className="text-sm sm:text-base text-white/90 font-medium">Essential Phrases</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">4</div>
              <div className="text-sm sm:text-base text-white/90 font-medium">Languages</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">AI</div>
              <div className="text-sm sm:text-base text-white/90 font-medium">Powered Tutor</div>
            </div>
            <div className="text-center group">
              <div className="text-3xl sm:text-4xl font-bold text-white mb-2 group-hover:scale-110 transition-transform">Free</div>
              <div className="text-sm sm:text-base text-white/90 font-medium">To Start</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 sm:py-32 bg-[#faf9f5] dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold bg-gradient-to-r from-primary-700 to-primary-600 bg-clip-text text-transparent mb-3 tracking-wide uppercase">Features</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
              Everything you need to master<br />Zimbabwe's languages
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              From essential phrases to AI-powered conversations, Nyuchi Lingo provides
              comprehensive tools for language mastery.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5f5873]/40 to-[#7c73e6]/30 dark:from-[#7c73e6]/50 dark:to-[#5f5873]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Languages className="w-6 h-6 text-primary-700 dark:text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">4 Languages Side-by-Side</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Learn English, Shona, Ndebele, and Chinese simultaneously with
                  side-by-side comparisons and pronunciation guides.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#729B63]/40 to-[#8FB47F]/30 dark:from-[#8FB47F]/50 dark:to-[#729B63]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-secondary-500 dark:text-secondary-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">AI Conversation Practice</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Practice real conversations with our AI tutor that adapts to your
                  skill level and learning goals.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#F6AD55]/50 to-[#d4634a]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-accent-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">200+ Essential Phrases</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Master greetings, directions, shopping, emergencies, and more with
                  practical, real-world phrases.
                </p>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d4634a]/45 to-[#F6AD55]/35 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Mic className="w-6 h-6 text-[#d4634a]" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Pronunciation Guides</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Learn proper pronunciation with detailed phonetic guides for every
                  phrase in all four languages.
                </p>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8FB47F]/45 to-[#729B63]/35 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-secondary-500" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Track your learning journey with detailed analytics, streaks, and
                  personalized recommendations.
                </p>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5f5873]/45 to-[#7c73e6]/35 dark:from-[#7c73e6]/50 dark:to-[#5f5873]/40 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart className="w-6 h-6 text-primary-700 dark:text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Cultural Context</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Understand when and how to use phrases with cultural context and
                  real-world usage examples.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="py-20 sm:py-32 bg-[#788c5d] relative overflow-hidden">

        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">Solutions</p>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance text-white">
              Built for everyone
            </h2>
            <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              Whether you're visiting Zimbabwe or calling it home, Nyuchi Lingo helps
              you communicate with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Tourists & Travelers */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 bg-white dark:bg-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[#d4634a] flex items-center justify-center mb-4">
                  <Globe className="w-7 h-7 text-white" />
                </div>
                <p className="text-xs font-semibold bg-gradient-to-r from-accent-500 to-accent-500/80 bg-clip-text text-transparent mb-2 tracking-wide uppercase">
                  Tourists & Travelers
                </p>
                <h3 className="text-2xl font-bold mb-3">
                  Navigate Zimbabwe with confidence
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Essential phrases for Victoria Falls, Harare, and beyond. Learn greetings,
                  directions, shopping, and emergency phrases before your trip.
                </p>
                <Button asChild variant="outline" className="border-2 group">
                  <Link href="/features">
                    Explore travel features
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Business & Expats */}
            <Card className="border-2 hover:shadow-xl transition-all duration-300 bg-white dark:bg-card">
              <CardContent className="p-8">
                <div className="w-14 h-14 rounded-xl bg-[#788c5d] flex items-center justify-center mb-4">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <p className="text-xs font-semibold bg-gradient-to-r from-secondary-500 to-secondary-400 bg-clip-text text-transparent mb-2 tracking-wide uppercase">
                  Business & Expats
                </p>
                <h3 className="text-2xl font-bold mb-3">
                  Build relationships through language
                </h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Master business phrases and cultural context for professional success.
                  Perfect for expats and professionals working in Zimbabwe.
                </p>
                <Button asChild variant="outline" className="border-2 group">
                  <Link href="/features">
                    Learn business phrases
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 sm:py-32 bg-background">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-balance">
              Why Nyuchi Lingo?
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-[#d4634a] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Powered Learning</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our AI tutor adapts to your learning style and provides personalized
                feedback in real-time.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-[#788c5d] flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-World Focus</h3>
              <p className="text-muted-foreground leading-relaxed">
                Learn phrases you'll actually use, from local greetings to business
                conversations.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#5f5873]/45 to-[#7c73e6]/35 dark:from-[#7c73e6]/50 dark:to-[#5f5873]/40 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-primary-700 dark:text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Built for Africa</h3>
              <p className="text-muted-foreground leading-relaxed">
                Designed specifically for African languages and culture, by people who
                understand the context.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-black relative overflow-hidden">

        <div className="container mx-auto px-4 sm:px-6 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-balance text-white">
              Ready to start learning?
            </h2>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              Join learners from around the world mastering Zimbabwe's languages.
              Start for free today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8 shadow-lg hover:shadow-xl transition-shadow group">
                <Link href="/auth/login">
                  Start for free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 border-2 border-white text-white hover:bg-white hover:text-black">
                <Link href="/about">Learn more about us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
