"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface MobileHeaderProps {
  title?: string
  className?: string
}

export function MobileHeader({ title, className }: MobileHeaderProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header
      className={cn(
        "lg:hidden sticky top-0 z-30 bg-white dark:bg-[#1a1a1a] border-b",
        "h-14 flex items-center justify-center px-4",
        className
      )}
    >
      {/* Left spacer for hamburger menu (handled by AppSidebar) */}
      <div className="w-10" />

      {/* Center - Logo or Title */}
      <div className="flex-1 flex items-center justify-center">
        {title ? (
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        ) : (
          mounted && (
            <Image
              src={resolvedTheme === "dark" ? "/Nyuchi_Lingo_dark.png" : "/Nyuchi_Lingo_light.png"}
              alt="Nyuchi Lingo"
              width={100}
              height={50}
              className="object-contain"
              priority
            />
          )
        )}
      </div>

      {/* Right spacer for symmetry */}
      <div className="w-10" />
    </header>
  )
}
