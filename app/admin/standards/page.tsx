import { redirect } from "next/navigation"
import { getUser, createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/supabase/admin"
import { AdminLayout } from "@/components/admin/admin-layout"
import { LearningStandardsManager } from "@/components/learning-standards-manager"
import { isDevMode } from "@/lib/dev-mode"

export const metadata = {
  title: "Learning Standards",
}

// Mock data for dev mode
const DEV_LEARNING_STANDARDS = [
  {
    id: 1,
    level: "beginner",
    name: "Basic Greetings",
    description: "Learn essential greetings and introductions in all four languages",
    required_phrases: 10,
    completion_threshold: 80,
    category: "greetings",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    level: "beginner",
    name: "Common Phrases",
    description: "Master everyday phrases for basic communication",
    required_phrases: 20,
    completion_threshold: 75,
    category: "basics",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    level: "intermediate",
    name: "Travel Essentials",
    description: "Navigate transportation, accommodation, and dining situations",
    required_phrases: 30,
    completion_threshold: 85,
    category: "travel",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 4,
    level: "intermediate",
    name: "Business Communication",
    description: "Professional phrases for work and business contexts",
    required_phrases: 25,
    completion_threshold: 90,
    category: "business",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 5,
    level: "advanced",
    name: "Cultural Nuances",
    description: "Understand cultural context and idiomatic expressions",
    required_phrases: 40,
    completion_threshold: 85,
    category: "culture",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default async function AdminStandardsPage() {
  const user = await getUser()

  if (!user) redirect("/auth")

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect("/")

  let learningStandards = DEV_LEARNING_STANDARDS

  if (!isDevMode()) {
    try {
      const supabase = await createClient()

      const { data } = await supabase
        .from("learning_standards")
        .select("*")
        .order("level", { ascending: true })

      if (data) learningStandards = data
    } catch (error) {
      console.error("Error fetching learning standards:", error)
      // Fall back to dev data
    }
  }

  return (
    <AdminLayout>
      <LearningStandardsManager standards={learningStandards} />
    </AdminLayout>
  )
}
