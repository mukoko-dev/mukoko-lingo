import Link from "next/link"
import { Languages, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingLayout } from "@/components/marketing-layout"

export const metadata = {
  title: "Privacy Policy - Nyuchi Lingo",
  description: "Learn how Nyuchi Lingo collects, uses, and protects your personal information.",
}

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <div className="bg-gradient-to-br from-background via-background to-muted">

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: November 8, 2025</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Welcome to Nyuchi Lingo. We are committed to protecting your personal information and your right to
              privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
              you use our language learning platform.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Please read this Privacy Policy carefully. By using Nyuchi Lingo, you agree to the collection and use of
              information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">2.1 Personal Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">When you create an account, we collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Email address</li>
                  <li>Display name (optional)</li>
                  <li>Password (encrypted)</li>
                  <li>Profile preferences (UI language, learning goals, daily targets)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">2.2 Learning Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">
                  As you use the platform, we automatically collect:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Phrases you view, bookmark, and practice</li>
                  <li>Your progress status on phrases (learning, practiced, mastered)</li>
                  <li>Study sessions and practice frequency</li>
                  <li>Category preferences and search queries</li>
                  <li>Learning analytics and statistics</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">2.3 Technical Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-2">We automatically collect:</p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and general location data</li>
                  <li>Usage patterns and interaction with the Service</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Provide, operate, and maintain the Nyuchi Lingo platform</li>
              <li>Personalize your learning experience and track your progress</li>
              <li>Improve, enhance, and develop new features for the Service</li>
              <li>Communicate with you about updates, security alerts, and support messages</li>
              <li>Analyze usage patterns to optimize the platform's performance</li>
              <li>Protect against fraudulent, unauthorized, or illegal activity</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. Information Sharing and Disclosure</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">4.1 We Do Not Sell Your Data</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell, trade, or rent your personal information to third parties for marketing purposes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">4.2 Service Providers</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may share your information with trusted service providers who assist us in operating the platform,
                  such as:
                </p>
                <ul className="list-disc pl-6 space-y-1 text-muted-foreground mt-2">
                  <li>Supabase (database and authentication services)</li>
                  <li>Vercel (hosting and deployment)</li>
                  <li>Analytics providers (aggregated, anonymized data only)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">4.3 Legal Requirements</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may disclose your information if required by law, court order, or governmental request, or to
                  protect our rights, property, or safety.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement industry-standard security measures to protect your personal information, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Encryption of data in transit and at rest</li>
              <li>Secure authentication via Supabase</li>
              <li>Row Level Security (RLS) policies on all database tables</li>
              <li>Regular security audits and updates</li>
              <li>Limited access to personal data by authorized personnel only</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure. While we strive
              to protect your information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Your Rights and Choices</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">6.1 Access and Update</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You can access and update your profile information at any time through your account settings.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">6.2 Data Deletion</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You can request deletion of your account and associated data by contacting us. Please note that some
                  information may be retained for legal or operational purposes.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">6.3 Communication Preferences</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You can opt out of promotional communications, but we may still send you service-related messages.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">6.4 Data Portability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to request a copy of your personal data in a structured, machine-readable format.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We use cookies and similar tracking technologies to enhance your experience. Cookies are small data files
              stored on your device that help us:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Remember your preferences and settings</li>
              <li>Authenticate your account and maintain your session</li>
              <li>Analyze how you use the platform</li>
              <li>Improve the Service and develop new features</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-4">
              You can control cookies through your browser settings, but disabling certain cookies may limit your
              ability to use some features of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nyuchi Lingo is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13. If you believe we have collected information from a child under 13,
              please contact us immediately so we can delete it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. International Data Transfers</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your information may be transferred to and maintained on servers located outside of your country of
              residence. By using Nyuchi Lingo, you consent to the transfer of your information to countries that may
              have different data protection laws than your country.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting
              the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this
              Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices,
              please contact us at:
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground">
                <strong>Nyuchi Learning</strong>
                <br />
                Email: privacy@nyuchilearning.com
                <br />
                Support: support@nyuchilearning.com
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild variant="outline">
              <Link href="/terms">Terms of Service</Link>
            </Button>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      </div>
    </MarketingLayout>
  )
}
