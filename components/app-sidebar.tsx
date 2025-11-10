"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Home,
  BookOpen,
  MessageSquare,
  TrendingUp,
  Bookmark,
  BarChart3,
  Settings,
  Shield,
  Users,
  GraduationCap,
  Activity,
  LayoutDashboard,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserMenu } from "@/components/user-menu"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { useAdmin } from "@/lib/hooks/use-admin"
import { useDevAuth } from "@/lib/hooks/use-dev-auth"
import { useSidebar } from "@/lib/contexts/sidebar-context"
import { useUILanguage } from "@/lib/hooks/use-ui-language"

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function AppSidebar() {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const { isCollapsed, setIsCollapsed } = useSidebar()
  const [moderationCount, setModerationCount] = useState(0)
  const { user } = useDevAuth()
  const { isAdmin, loading } = useAdmin()
  const { uiLanguage, setUILanguage } = useUILanguage()
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchModerationCount = async () => {
      if (!isAdmin) return

      const { count } = await supabase
        .from("moderation_alerts")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending")

      setModerationCount(count || 0)
    }

    fetchModerationCount()
  }, [isAdmin, supabase])

  const userSections: NavSection[] = [
    {
      title: "Main",
      items: [
        { id: "home", label: "Home", href: "/", icon: Home },
        { id: "ai-practice", label: "AI Tutor", href: "/app/ai-practice", icon: MessageSquare },
      ],
    },
    {
      title: "Learning",
      items: [
        { id: "progress", label: "My Progress", href: "/app/progress", icon: TrendingUp },
        { id: "bookmarks", label: "My Bookmarks", href: "/app/bookmarks", icon: Bookmark },
        { id: "analytics", label: "Analytics", href: "/app/analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Account",
      items: [{ id: "profile", label: "Profile Settings", href: "/app/profile", icon: Settings }],
    },
  ]

  const adminSection: NavSection = {
    title: "Administration",
    items: [
      { id: "admin-overview", label: "Overview", href: "/admin/overview", icon: LayoutDashboard },
      { id: "admin-users", label: "Users", href: "/admin/users", icon: Users },
      { id: "admin-phrases", label: "Phrases", href: "/admin/phrases", icon: BookOpen },
      { id: "admin-standards", label: "Standards", href: "/admin/standards", icon: GraduationCap },
      {
        id: "admin-moderation",
        label: "Moderation",
        href: "/admin/moderation",
        icon: Shield,
        badge: moderationCount,
      },
      { id: "admin-activity", label: "Activity", href: "/admin/activity", icon: Activity },
    ],
  }

  const renderDesktopNav = (section: NavSection) => (
    <div key={section.title} className="mb-6">
      {!isCollapsed && (
        <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {section.title}
        </h3>
      )}
      <nav className="space-y-1">
        {section.items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg transition-colors relative",
                isCollapsed ? "justify-center h-10 w-10 mx-auto" : "px-4 py-2.5 mx-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span className="flex-1 text-sm font-medium">{item.label}</span>}
              {item.badge !== undefined && item.badge > 0 && (
                <Badge
                  variant="destructive"
                  className={cn(
                    isCollapsed ? "absolute -top-1 -right-1 h-5 w-5 p-0 text-xs" : "ml-auto",
                    "flex items-center justify-center",
                  )}
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  const renderMobileNav = (section: NavSection) => (
    <div key={section.title} className="mb-6">
      <h3 className="px-4 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        {section.title}
      </h3>
      <nav className="space-y-1">
        {section.items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors mx-2",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge}
                </Badge>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen bg-accent/30 border-r transition-all duration-300",
          "hidden lg:flex lg:flex-col",
          isCollapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center px-4 py-4 border-b bg-background/50">
            <Link href="/" className="flex items-center justify-center">
              {!isCollapsed && mounted && (
                <Image
                  src={resolvedTheme === "dark" ? "/Nyuchi_Lingo_dark.png" : "/Nyuchi_Lingo_light.png"}
                  alt="Nyuchi Lingo"
                  width={180}
                  height={90}
                  className="object-contain"
                  priority
                />
              )}
              {isCollapsed && (
                <Image
                  src="/bee-logo-mobile.png"
                  alt="Nyuchi Lingo"
                  width={32}
                  height={32}
                  className="object-contain"
                  priority
                />
              )}
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {userSections.map(renderDesktopNav)}

            {isAdmin && (
              <>
                <div className={cn("my-4 border-t", isCollapsed ? "mx-2" : "mx-4")} />
                {renderDesktopNav(adminSection)}
              </>
            )}
          </div>

          <div className="border-t bg-background/50">
            {!isCollapsed && (
              <div className="flex items-center justify-between gap-2 px-4 py-2 border-b">
                <ThemeSwitcher />
                <LanguageSwitcher currentLanguage={uiLanguage} onLanguageChange={setUILanguage} />
              </div>
            )}
            {isCollapsed && (
              <div className="flex flex-col items-center gap-2 py-2 border-b">
                <ThemeSwitcher />
                <LanguageSwitcher currentLanguage={uiLanguage} onLanguageChange={setUILanguage} />
              </div>
            )}
            <div className={cn("flex items-center gap-2", isCollapsed ? "flex-col justify-center p-2" : "justify-between p-4")}>
              <UserMenu />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-accent/30 border-r transition-transform duration-300 ease-in-out",
          "lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b bg-background/50">
            <Link href="/" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
              {mounted && (
                <Image
                  src={resolvedTheme === "dark" ? "/Nyuchi_Lingo_dark.png" : "/Nyuchi_Lingo_light.png"}
                  alt="Nyuchi Lingo"
                  width={140}
                  height={70}
                  className="object-contain"
                  priority
                />
              )}
            </Link>
            <UserMenu />
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {userSections.map(renderMobileNav)}

            {isAdmin && (
              <>
                <div className="mx-4 my-6 border-t" />
                {renderMobileNav(adminSection)}
              </>
            )}
          </div>

          <div className="border-t bg-background/50">
            <div className="flex items-center justify-center gap-4 px-4 py-3 border-b">
              <ThemeSwitcher />
              <LanguageSwitcher currentLanguage={uiLanguage} onLanguageChange={setUILanguage} />
            </div>
            <div className="p-4">
              <p className="text-xs text-muted-foreground text-center">Nyuchi Lingo © 2025</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
