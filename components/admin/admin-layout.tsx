"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6 max-w-6xl">
          {children}
        </div>
      </SidebarLayout>
    </div>
  )
}
