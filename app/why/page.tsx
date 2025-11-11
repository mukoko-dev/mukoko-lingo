import Link from "next/link"
import { Languages, TrendingUp, Globe, Zap, Shield, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarketingLayout } from "@/components/marketing-layout"

export const metadata = {
  title: "Why Nyuchi Lingo - Our Purpose & Vision",
  description:
    "Discover why Nyuchi Lingo is the best platform for learning English, Shona, Ndebele, and Chinese for practical, everyday communication.",
}

export default function WhyPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-white dark:bg-background py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">Why Nyuchi Lingo?</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              The bridge between cultures, powered by language learning that actually works.
            </p>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 sm:py-32 bg-[#faf9f5] dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">The Problem We Solve</h2>
          <Card className="bg-white dark:bg-card">
            <CardContent className="p-8">
              <p className="text-muted-foreground leading-relaxed mb-6 text-lg">
                In an increasingly connected Africa, the ability to communicate across languages is no longer
                optional—it's essential. Whether you're doing business with Chinese partners, traveling across Southern
                Africa, or simply trying to connect with people from different linguistic backgrounds, language barriers
                create real obstacles.
              </p>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Traditional language learning apps focus on European languages or use generic approaches that don't
                address the specific needs of African learners. They teach formal grammar but ignore the colloquial
                phrases people actually use in daily life.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20 sm:py-32 bg-[#d4634a]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">Our Approach</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Built Different, Built Better
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#d4634a] flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Practical & Real</h3>
                <p className="text-muted-foreground">
                  Learn phrases you'll actually use in conversations, not outdated textbook examples. Every phrase is
                  relevant to modern life.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#788c5d] flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Culturally Authentic</h3>
                <p className="text-muted-foreground">
                  Context matters. We explain when and how to use each phrase, ensuring you communicate appropriately in
                  different situations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#d4634a] flex items-center justify-center mb-4">
                  <Languages className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Multi-Language Comparison</h3>
                <p className="text-muted-foreground">
                  See all four languages side-by-side with pronunciation guides. This helps you understand patterns and
                  learn faster.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-[#788c5d] flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Track Your Progress</h3>
                <p className="text-muted-foreground">
                  Monitor your learning journey with detailed analytics, bookmarks, and progress tracking across all
                  your devices.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why These Languages */}
      <section className="py-20 sm:py-32 bg-white dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Why These Languages?</h2>
          <div className="space-y-4">
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">English</h3>
                <p className="text-muted-foreground">
                  The global language of business, technology, and international communication. Essential for anyone
                  looking to participate in the global economy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Shona</h3>
                <p className="text-muted-foreground">
                  Spoken by over 10 million people in Zimbabwe and surrounding regions. A key language for business and
                  cultural exchange in Southern Africa.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Ndebele</h3>
                <p className="text-muted-foreground">
                  An important language in Zimbabwe and parts of South Africa. Understanding Ndebele opens doors to rich
                  cultural traditions and communities.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg mb-2">Chinese (Mandarin)</h3>
                <p className="text-muted-foreground">
                  With China's growing economic presence in Africa, Chinese language skills are increasingly valuable
                  for business, trade, and diplomatic relations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who Benefits */}
      <section className="py-20 sm:py-32 bg-[#788c5d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">Who It's For</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Built for Everyone
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#788c5d] flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Business Professionals</h3>
                  <p className="text-muted-foreground">
                    Communicate with clients, partners, and colleagues across language barriers. Build stronger
                    relationships through language.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#d4634a] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Students & Academics</h3>
                  <p className="text-muted-foreground">
                    Expand your linguistic capabilities and cultural understanding. Perfect for research, collaboration,
                    and personal growth.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#788c5d] flex items-center justify-center shrink-0">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Travelers & Expats</h3>
                  <p className="text-muted-foreground">
                    Navigate new places with confidence. Connect with locals and immerse yourself in different cultures
                    through language.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-[#d4634a] flex items-center justify-center shrink-0">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Language Enthusiasts</h3>
                  <p className="text-muted-foreground">
                    Satisfy your curiosity and expand your mind. Learning multiple languages simultaneously is
                    intellectually rewarding.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 bg-black relative overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 text-center relative">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white">
              Start Your Journey Today
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Join our community of learners and discover how language learning can open new doors in your personal and
              professional life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/auth/login">Start Learning Free</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 border-2 border-white text-white hover:bg-white hover:text-black">
                <Link href="/about">Learn About Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
