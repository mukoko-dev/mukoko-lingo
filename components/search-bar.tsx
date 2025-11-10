"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { translations, type UILanguage } from "@/lib/translations"

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  uiLanguage: UILanguage
}

export function SearchBar({ searchQuery, onSearchChange, uiLanguage }: SearchBarProps) {
  const t = translations[uiLanguage]

  return (
    <div className="w-full max-w-2xl mx-auto" role="search">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          placeholder={t.searchPlaceholder || "Search phrases in any language..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10 h-12 text-base bg-background/60 backdrop-blur-sm border-2 focus-visible:ring-2 focus-visible:ring-primary/20"
          aria-label="Search phrases"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onSearchChange("")}
            className="absolute right-1 top-1/2 -translate-y-1/2"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      {searchQuery && (
        <p className="text-sm text-muted-foreground mt-2 text-center" role="status" aria-live="polite">
          {t.searchResults || "Search results for"} "{searchQuery}"
        </p>
      )}
    </div>
  )
}
