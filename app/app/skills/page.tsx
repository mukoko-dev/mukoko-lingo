import { Metadata } from "next"
import { SkillsDashboardClient } from "./skills-dashboard-client"

export const metadata: Metadata = {
  title: "Skills Dashboard | Nyuchi Lingo",
  description: "Track your language learning progress across all skills",
}

export default function SkillsPage() {
  return <SkillsDashboardClient />
}
