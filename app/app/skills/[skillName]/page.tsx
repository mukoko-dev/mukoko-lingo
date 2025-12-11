import { SkillDetailClient } from "./skill-detail-client"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ skillName: string }>
}

export default async function SkillDetailPage({ params }: PageProps) {
  const { skillName } = await params
  return <SkillDetailClient skillName={skillName} />
}
