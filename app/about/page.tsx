import Link from "next/link"
import { Languages, Globe, Users, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarketingLayout } from "@/components/marketing-layout"

export const metadata = {
  title: "About Us - Nyuchi Lingo",
  description:
    "Learn about Nyuchi Lingo's mission to empower tourists, expats, locals, business professionals, immigrants, and students with essential language skills across Zimbabwe's languages.",
}

export default function AboutPage() {
  return (
    <MarketingLayout>
      {/* Hero Section */}
      <section className="bg-white dark:bg-background py-20 sm:py-32">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-balance">About Nyuchi Lingo</h1>
            <p className="text-lg text-muted-foreground text-pretty">
              Empowering everyone to communicate confidently across Zimbabwe's languages.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 sm:py-32 bg-[#d4634a]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">Our Foundation</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Built with Purpose
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-6xl mx-auto">
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-[#d4634a] flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To empower everyone—tourists, business professionals, students, immigrants, and locals—to communicate
                  effectively across English, Shona, Ndebele, and Chinese through accessible, practical language learning
                  tools.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-lg bg-[#788c5d] flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Who We Serve</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Tourists exploring Zimbabwe, expats living abroad, business professionals conducting commerce, students
                  learning new languages, immigrants building new lives, and locals expanding their multilingual
                  abilities.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 sm:py-32 bg-[#faf9f5] dark:bg-background">
        <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
          <h2 className="text-3xl font-bold mb-8">Our Story</h2>
          <div className="prose dark:prose-invert max-w-none">
            <Card className="bg-white dark:bg-card mb-6">
              <CardContent className="p-8">
                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                  Nyuchi Lingo is a <strong>Nyuchi Learning initiative</strong>, part of our commitment to making quality education accessible across Africa. Visit our parent site at{" "}
                  <a href="https://learning.nyuchi.com" target="_blank" rel="noopener noreferrer" className="text-[#d4634a] hover:text-[#d4634a]/80 font-medium underline underline-offset-2">
                    learning.nyuchi.com
                  </a>{" "}
                  to explore more educational resources and programs designed for African learners.
                </p>
                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                  We founded Nyuchi Lingo to address the growing need for practical language education across Zimbabwe and
                  Southern Africa. Whether you're a tourist visiting Victoria Falls, an expat living and working in Africa,
                  a businessperson negotiating deals in Harare, a student pursuing education, an immigrant settling into a
                  new home, or a local wanting to expand your linguistic horizons—we're here to help you communicate
                  confidently.
                </p>
                <p className="text-muted-foreground leading-relaxed text-lg mb-6">
                  Our platform focuses on English, Shona, Ndebele, and Chinese because of their strategic importance in
                  tourism, business, education, and cultural exchange across Africa. By presenting these languages
                  side-by-side, we make it easy for all learners to understand context, pronunciation, and appropriate usage
                  in real-world situations.
                </p>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  We believe language learning should be accessible to everyone, regardless of whether you're visiting for a
                  week, conducting business for a month, studying for a semester, or building a life here permanently.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-20 sm:py-32 bg-[#788c5d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-white/90 mb-3 tracking-wide uppercase">Our Difference</p>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              What Sets Us Apart
            </h2>
          </div>

          <div className="grid gap-6 max-w-5xl mx-auto">
            <Card className="bg-white dark:bg-card">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#d4634a] flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  Colloquial Focus
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  We teach how people actually speak, not just formal textbook language. Our phrases reflect authentic,
                  everyday communication that you'll hear and use in real conversations.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#788c5d] flex items-center justify-center shrink-0">
                    <Languages className="w-5 h-5 text-white" />
                  </div>
                  Side-by-Side Comparison
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  See all four languages at once with pronunciation guides and cultural context, making it easy to
                  understand similarities and differences across languages.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-card">
              <CardContent className="p-8">
                <h3 className="font-semibold text-xl mb-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#d4634a] flex items-center justify-center shrink-0">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  Built for Africa
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Designed specifically for African learners with an understanding of the unique linguistic and cultural
                  context of the continent. We respect and celebrate the rich diversity of African languages.
                </p>
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
              Ready to Start Learning?
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Join learners from around the world who are building language skills for travel, expat life, business,
              education, and everyday life across Zimbabwe.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/auth/login">Start Learning</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base px-8 border-2 border-white text-white hover:bg-white hover:text-black">
                <Link href="/why">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </MarketingLayout>
  )
}
