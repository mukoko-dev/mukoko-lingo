"use client"

import { useSidebar } from "@/lib/contexts/sidebar-context"
import { cn } from "@/lib/utils"

interface SidebarLayoutProps {
  children: React.ReactNode
  className?: string
}

export function SidebarLayout({ children, className }: SidebarLayoutProps) {
  const { isCollapsed } = useSidebar()

  return (
    <div className={cn(isCollapsed ? "lg:ml-16 transition-all duration-300" : "lg:ml-64 transition-all duration-300", className)}>
      {children}
    </div>
  )
}
