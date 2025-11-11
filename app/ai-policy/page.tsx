import Link from "next/link"
import { Shield, CheckCircle, AlertTriangle, Brain, Users, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MarketingLayout } from "@/components/marketing-layout"

export const metadata = {
  title: "AI Policy - Nyuchi Lingo",
  description:
    "Learn about how Nyuchi Lingo uses AI responsibly, including safety measures, content moderation, and user protections.",
}

export default function AIPolicyPage() {
  return (
    <MarketingLayout>
      <div className="bg-gradient-to-br from-background via-background to-muted">

      <main className="container mx-auto px-3 sm:px-6 py-6 sm:py-10 max-w-5xl">
        <div className="text-center mb-6 sm:mb-10">
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 text-balance">
            AI Usage & Safety Policy
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto text-pretty px-2">
            How we use AI responsibly to enhance your language learning experience.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 mb-6 sm:mb-10">
          <Card>
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Features</h3>
              <p className="text-sm text-muted-foreground">
                Conversation practice, smart recommendations, scenario generation, and translation assistance powered by
                advanced AI.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Safety First</h3>
              <p className="text-sm text-muted-foreground">
                All AI interactions are monitored with advanced content moderation to ensure a safe learning environment
                for everyone.
              </p>
            </CardContent>
          </Card>
        </div>

        <section className="mb-6 sm:mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">How We Use AI</h2>
          <div className="prose dark:prose-invert max-w-none text-sm sm:text-base">
            <p className="text-muted-foreground leading-relaxed mb-3">
              Nyuchi Lingo uses artificial intelligence to provide personalized language learning experiences. Our AI
              features are designed to supplement traditional learning with interactive, contextual practice
              opportunities.
            </p>

            <div className="space-y-3">
              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    AI Conversation Practice
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Chat with an AI tutor in English, Shona, Ndebele, or Chinese to practice real conversations. The AI
                    adapts to your skill level and provides culturally appropriate responses.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Smart Phrase Recommendations
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI analyzes your learning progress to suggest phrases that match your skill level and fill gaps
                    in your knowledge, creating a personalized learning path.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Conversation Scenarios
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Generate realistic African scenarios like markets, restaurants, or taxis to practice contextual
                    language use with suggested phrases and cultural insights.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    Translation Assistance
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Get detailed explanations of nuances, cultural context, common mistakes, and alternative expressions
                    when translating between languages.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mb-6 sm:mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">Content Moderation & Safety</h2>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  Automated Content Screening
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Every message, translation, and AI-generated phrase is automatically screened for inappropriate
                  content including:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-2">
                  <li>Sexual or explicit content</li>
                  <li>Hate speech or discrimination</li>
                  <li>Harassment or bullying</li>
                  <li>Violence or threats</li>
                  <li>Self-harm content</li>
                  <li>Abuse or harmful behavior</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Human Review Process
                </h3>
                <p className="text-sm text-muted-foreground">
                  Flagged content is reviewed by our moderation team. Users who repeatedly violate our policies may have
                  their AI access restricted or accounts suspended to maintain a safe community.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-primary" />
                  Privacy & Data Protection
                </h3>
                <p className="text-sm text-muted-foreground">
                  AI conversations are stored to improve your learning experience and track progress. We do not share
                  your conversations with third parties. You can request deletion of your AI interaction history at any
                  time.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-6 sm:mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">User Responsibilities</h2>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-3">When using AI features, you agree to:</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Use AI features for educational purposes only</li>
                <li>Respect other users and cultural sensitivities</li>
                <li>Not attempt to bypass content moderation systems</li>
                <li>Not use AI to generate harmful, offensive, or inappropriate content</li>
                <li>Report any concerning AI behavior to our support team</li>
                <li>Understand that AI responses are generated and may occasionally contain errors</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mb-6 sm:mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4 sm:mb-5">AI Limitations</h2>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-3">While our AI is advanced, it has limitations:</p>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>AI responses may occasionally be inaccurate or culturally insensitive</li>
                <li>The AI does not replace human teachers or native speakers</li>
                <li>Generated content should be verified for important communications</li>
                <li>The AI may not understand extremely nuanced or context-dependent situations</li>
                <li>Performance may vary depending on language and complexity</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="text-center bg-muted/50 rounded-lg p-5 sm:p-7">
          <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Questions About Our AI Policy?</h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-5 max-w-2xl mx-auto px-2">
            If you have concerns about AI safety, content moderation, or how your data is used, please contact our
            support team.
          </p>
          <div className="flex gap-3 sm:gap-4 justify-center flex-wrap">
            <Button asChild size="lg">
              <Link href="/">Start Learning</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/privacy">Privacy Policy</Link>
            </Button>
          </div>
        </section>
      </main>
      </div>
    </MarketingLayout>
  )
}
