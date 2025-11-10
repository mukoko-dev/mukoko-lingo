import type { Metadata } from "next"

// Base URL configuration
export const siteConfig = {
  name: "Nyuchi Lingo",
  url: "https://nyuchilingo.com",
  description:
    "Learn essential phrases in English, Shona, Ndebele & Chinese. Perfect for tourists, expats, locals, business travelers, immigrants, and students. Master Zimbabwe's languages with AI-powered learning.",
  keywords: [
    // Travel & Tourism
    "Zimbabwe travel phrases",
    "Southern Africa language guide",
    "tourist phrases Zimbabwe",
    "Victoria Falls language",
    // Business & Professional
    "business Shona phrases",
    "business Ndebele",
    "professional language learning",
    "Zimbabwe business language",
    "corporate language training",
    // Immigration & Relocation
    "immigrating to Zimbabwe",
    "moving to Zimbabwe language",
    "Zimbabwe immigration language",
    "relocating to Africa",
    // Expats
    "expat language learning",
    "expat Zimbabwe",
    "expatriate language guide",
    "living in Zimbabwe language",
    "expat Africa languages",
    // Students & Education
    "learn Shona for students",
    "learn Ndebele for students",
    "African language courses",
    "university language learning",
    "student language app",
    // Locals & Personal Development
    "learn Chinese in Zimbabwe",
    "learn English Zimbabwe",
    "multilingual Zimbabwe",
    "African language learning",
    "personal language development",
    // General Language Learning
    "Shona language online",
    "Ndebele language course",
    "Chinese for Africans",
    "English to Shona",
    "multilingual learning app",
    "language comparison tool",
    "phrase translator",
    // Location specific
    "Harare language",
    "Bulawayo language",
    "Zimbabwe local languages",
    "Southern African languages",
    "Bantu languages",
    // Features
    "AI language tutor",
    "phrase book app",
    "pronunciation guide",
    "language exchange",
    "conversation practice",
  ],
  author: "Nyuchi Tech",
  locale: "en_US",
  alternateLocales: ["sn_ZW", "nd_ZW", "zh_CN"],
}

// Structured data for organization
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nyuchi Tech",
  url: siteConfig.url,
  logo: `${siteConfig.url}/Nyuchi_Lingo_light.png`,
  description: siteConfig.description,
  sameAs: [
    // Add social media links when available
  ],
}

// Structured data for web application
export const webApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: siteConfig.name,
  url: siteConfig.url,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web Browser",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description: siteConfig.description,
  inLanguage: ["en", "sn", "nd", "zh"],
  featureList: [
    "200+ essential phrases in 4 languages",
    "AI-powered conversation practice",
    "Smart phrase recommendations",
    "Progress tracking",
    "Cultural context explanations",
    "Pronunciation guides",
    "Business communication phrases",
    "Everyday conversation practice",
    "Travel and tourism phrases",
  ],
}

// Default metadata factory
export function createMetadata(overrides?: Partial<Metadata>): Metadata {
  return {
    title: {
      default: `${siteConfig.name} - Learn Shona, Ndebele & Chinese | For Everyone`,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: siteConfig.keywords,
    authors: [{ name: siteConfig.author, url: siteConfig.url }],
    creator: siteConfig.author,
    publisher: siteConfig.author,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        sn: "/",
        nd: "/",
        zh: "/",
      },
    },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      alternateLocale: siteConfig.alternateLocales,
      url: siteConfig.url,
      title: `${siteConfig.name} - Master Zimbabwe's Languages`,
      description:
        "Learn Shona, Ndebele, English & Chinese with AI-powered tools. Perfect for tourists, expats, business travelers, immigrants, students, and locals building language skills.",
      siteName: siteConfig.name,
      images: [
        {
          url: "/Nyuchi_Lingo_light.png",
          width: 250,
          height: 125,
          alt: `${siteConfig.name} - Multilingual Learning Platform`,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: `${siteConfig.name} - Learn Zimbabwe's Languages`,
      description:
        "Master Shona, Ndebele & Chinese with AI tutoring. For tourists, expats, professionals, students, and anyone building language skills.",
      images: ["/Nyuchi_Lingo_light.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Add verification codes when available
      google: "",
      bing: "",
    },
    ...overrides,
  }
}

// Structured data for educational content
export function createCourseSchema(category: string, phrasesCount: number) {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${category} Travel Phrases`,
    description: `Learn essential ${category} phrases for traveling in Zimbabwe and Southern Africa`,
    provider: {
      "@type": "Organization",
      name: "Nyuchi Tech",
      url: siteConfig.url,
    },
    educationalLevel: "Beginner to Intermediate",
    inLanguage: ["en", "sn", "nd", "zh"],
    numberOfLessons: phrasesCount,
    coursePrerequisites: "None - suitable for all travelers",
  }
}
