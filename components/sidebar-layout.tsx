"use client"

import { useSidebar } from "@/lib/contexts/sidebar-context"
import { MobileHeader } from "@/components/mobile-header"
import { cn } from "@/lib/utils"

interface SidebarLayoutProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function SidebarLayout({ children, className, title }: SidebarLayoutProps) {
  const { isCollapsed } = useSidebar()

  return (
    <>
      <MobileHeader title={title} />
      <div className={cn(
        "pt-0 lg:pt-0",
        isCollapsed ? "lg:ml-16" : "lg:ml-64",
        "transition-all duration-300",
        className
      )}>
        {children}
      </div>
    </>
  )
}
