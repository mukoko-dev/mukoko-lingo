"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <SidebarLayout>
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          {children}
        </main>
      </SidebarLayout>
    </div>
  )
}
