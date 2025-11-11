import Link from "next/link"
import { Languages, Scale } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarketingLayout } from "@/components/marketing-layout"

export const metadata = {
  title: "Terms of Service - Nyuchi Lingo",
  description: "Terms and conditions for using the Nyuchi Lingo language learning platform.",
}

export default function TermsPage() {
  return (
    <MarketingLayout>
      <div className="bg-gradient-to-br from-background via-background to-muted">

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: November 8, 2025</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              By accessing and using Nyuchi Lingo ("the Service"), you accept and agree to be bound by the terms and
              provisions of this agreement. If you do not agree to these Terms of Service, please do not use the
              Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Nyuchi Lingo provides an online platform for learning and comparing colloquial phrases in English, Shona,
              Ndebele, and Chinese. The Service includes but is not limited to phrase comparisons, pronunciation guides,
              progress tracking, and learning analytics.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">3.1 Account Creation</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To access certain features of the Service, you must create an account. You agree to provide accurate,
                  current, and complete information during registration and to update such information to keep it
                  accurate, current, and complete.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">3.2 Account Security</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for maintaining the confidentiality of your account credentials and for all
                  activities that occur under your account. You agree to immediately notify us of any unauthorized use
                  of your account.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">3.3 Account Termination</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We reserve the right to suspend or terminate your account if we believe you have violated these Terms
                  of Service or engaged in fraudulent or illegal activities.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">4. User Conduct</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations</li>
              <li>Attempt to gain unauthorized access to the Service or its related systems</li>
              <li>Interfere with or disrupt the Service or servers or networks connected to the Service</li>
              <li>
                Impersonate any person or entity or falsely state or misrepresent your affiliation with any person or
                entity
              </li>
              <li>
                Upload, post, or transmit any content that is harmful, threatening, abusive, harassing, defamatory,
                vulgar, obscene, or otherwise objectionable
              </li>
              <li>Scrape, copy, or redistribute content from the Service without express written permission</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">5.1 Our Content</h3>
                <p className="text-muted-foreground leading-relaxed">
                  All content on Nyuchi Lingo, including but not limited to text, graphics, logos, phrases,
                  translations, and software, is the property of Nyuchi Learning or its content suppliers and is
                  protected by intellectual property laws.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">5.2 Limited License</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We grant you a limited, non-exclusive, non-transferable license to access and use the Service for your
                  personal, non-commercial use. This license does not include the right to copy, modify, distribute, or
                  create derivative works from the Service or its content.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">6. Privacy</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Your use of the Service is also governed by our Privacy Policy. Please review our{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>{" "}
              to understand our practices regarding the collection and use of your personal information.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">7. Disclaimers</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">7.1 Educational Purpose</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Nyuchi Lingo is provided for educational purposes only. While we strive for accuracy, we do not
                  guarantee that all translations, pronunciations, or cultural contexts are completely accurate or
                  suitable for all situations.
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">7.2 No Warranty</h3>
                <p className="text-muted-foreground leading-relaxed">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
                  IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES OR
                  OTHER HARMFUL COMPONENTS.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              TO THE FULLEST EXTENT PERMITTED BY LAW, NYUCHI LEARNING SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY
              OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF
              THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">9. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We reserve the right to modify these Terms of Service at any time. We will notify users of any material
              changes by posting the new Terms of Service on this page and updating the "Last updated" date. Your
              continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">10. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              These Terms of Service shall be governed by and construed in accordance with the laws of Zimbabwe, without
              regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">11. Contact Information</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              If you have any questions about these Terms of Service, please contact us at:
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-muted-foreground">
                <strong>Nyuchi Learning</strong>
                <br />
                Email: support@nyuchilearning.com
              </p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild variant="outline">
              <Link href="/privacy">Privacy Policy</Link>
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
