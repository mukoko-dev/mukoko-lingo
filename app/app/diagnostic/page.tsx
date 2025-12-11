import { Metadata } from "next"
import { DiagnosticClient } from "./diagnostic-client"

export const metadata: Metadata = {
  title: "Diagnostic Assessment | Nyuchi Lingo",
  description: "Discover your Shona language proficiency level",
}

export default function DiagnosticPage() {
  return <DiagnosticClient />
}
