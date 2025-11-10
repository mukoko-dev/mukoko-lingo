import { redirect } from "next/navigation"
import { getUser, createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/supabase/admin"
import { AdminLayout } from "@/components/admin/admin-layout"
import { PhraseManagement } from "@/components/admin/phrase-management"
import { isDevMode } from "@/lib/dev-mode"

export const metadata = {
  title: "Phrase Management",
}

// Mock data for dev mode
const DEV_PHRASES = [
  {
    id: 1,
    category: "greetings",
    english: "Hello",
    shona: "Mhoro",
    ndebele: "Sawubona",
    chinese: "你好",
    context: "General greeting",
    pronunciation_shona: "m-HO-ro",
    pronunciation_ndebele: "sa-wu-BO-na",
    pronunciation_chinese: "nǐ hǎo",
  },
  {
    id: 2,
    category: "greetings",
    english: "Good morning",
    shona: "Mangwanani",
    ndebele: "Livukile",
    chinese: "早上好",
    context: "Morning greeting",
    pronunciation_shona: "ma-ngwa-NA-ni",
    pronunciation_ndebele: "li-vu-KI-le",
    pronunciation_chinese: "zǎo shang hǎo",
  },
  {
    id: 3,
    category: "basics",
    english: "Thank you",
    shona: "Ndatenda",
    ndebele: "Ngiyabonga",
    chinese: "谢谢",
    context: "Expressing gratitude",
    pronunciation_shona: "nda-TEN-da",
    pronunciation_ndebele: "ngi-ya-BO-nga",
    pronunciation_chinese: "xiè xiè",
  },
]

export default async function AdminPhrasesPage() {
  const user = await getUser()

  if (!user) redirect("/auth")

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect("/")

  let phrases = DEV_PHRASES

  if (!isDevMode()) {
    try {
      const supabase = await createClient()
      const { data } = await supabase.from("phrases").select("*").order("category", { ascending: true })
      if (data) phrases = data
    } catch (error) {
      console.error("Error fetching phrases:", error)
      // Fall back to dev data
    }
  }

  return (
    <AdminLayout>
      <PhraseManagement phrases={phrases} />
    </AdminLayout>
  )
}
