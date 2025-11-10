"use client"

import React, { createContext, useContext, useState, useEffect } from "react"

interface SidebarContextType {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Load saved preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved !== null) {
      setIsCollapsed(saved === "true")
    }
  }, [])

  // Save preference to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed))
  }, [isCollapsed])

  return <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    // Return default values if provider is not mounted yet
    return {
      isCollapsed: false,
      setIsCollapsed: () => {},
    }
  }
  return context
}
