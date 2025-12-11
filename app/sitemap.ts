import type { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://learning.nyuchi.com"
  const currentDate = new Date()

  // Static routes
  const routes = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/why`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/ai-policy`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/auth/login`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/auth/sign-up`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    },
  ]

  // Category pages (tourism, greetings, etc.)
  const categories = [
    "tourism",
    "greetings",
    "family",
    "shopping",
    "food",
    "health",
    "transport",
    "school",
    "money",
    "weather",
    "emotions",
    "work",
  ]

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}?category=${category}`,
    lastModified: currentDate,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }))

  return [...routes, ...categoryRoutes]
}
