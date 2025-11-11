import { MarketingLayout } from "@/components/marketing-layout"
import { MarketingHome } from "@/components/marketing-home"
import { createCourseSchema } from "@/lib/seo-config"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nyuchi Lingo - AI-Powered Language Learning for Zimbabwe",
  description:
    "Master Shona, Ndebele, English, and Chinese with AI-powered tools. Perfect for tourists, expats, business professionals, and locals. 200+ essential phrases with pronunciation guides.",
  keywords: [
    "Zimbabwe language learning",
    "Shona learning app",
    "Ndebele learning app",
    "Zimbabwe travel phrases",
    "AI language tutor",
    "African languages",
    "Victoria Falls travel guide",
    "learn Shona online",
    "business phrases Zimbabwe",
    "multilingual learning",
  ],
  openGraph: {
    title: "Nyuchi Lingo - Language Learning Built for Africa",
    description:
      "Master Zimbabwe's languages with AI-powered learning. 200+ phrases in Shona, Ndebele, English & Chinese. Perfect for tourists, business, and expats.",
  },
}

export default async function Page() {
  const courseSchema = createCourseSchema("Travel & Tourism", 200)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      <MarketingLayout>
        <MarketingHome />
      </MarketingLayout>
    </>
  )
}
