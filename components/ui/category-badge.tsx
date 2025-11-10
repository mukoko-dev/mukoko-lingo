import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/**
 * CategoryBadge - Specialized badge component for content categorization
 *
 * Source: NYUCHI_LINGO_SECONDARY_COLORS.md v3.0
 * All color combinations are WCAG 2.1 AA compliant (6.2:1 minimum)
 *
 * Usage:
 * <CategoryBadge category="grammar">Grammar</CategoryBadge>
 * <CategoryBadge category="vocabulary" icon="📖">Vocabulary</CategoryBadge>
 */

export type CategoryType =
  | 'grammar'       // Sage Green - Grammar & Structure
  | 'vocabulary'    // Teal - Vocabulary & Words
  | 'speaking'      // Coral - Speaking & Pronunciation
  | 'listening'     // Sky Blue - Listening & Comprehension
  | 'reading'       // Lavender - Reading & Writing
  | 'writing'       // Lavender - Reading & Writing (alias)
  | 'culture'       // Terracotta - Culture & Heritage
  | 'community'     // Rose - Community & Social
  | 'premium'       // Indigo - Premium Features

export type DifficultyType =
  | 'beginner'      // Army Green (secondary)
  | 'intermediate'  // Amber
  | 'advanced'      // Marigold

export type RegionType =
  | 'east-africa'   // Sky Blue
  | 'west-africa'   // Marigold
  | 'southern-africa' // Sage Green
  | 'north-africa'  // Amber
  | 'central-africa' // Teal

interface CategoryBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  category?: CategoryType
  difficulty?: DifficultyType
  region?: RegionType
  icon?: React.ReactNode
  children: React.ReactNode
}

// Category color mappings (100-level bg, 800-level text, 300-level border)
const categoryColors: Record<CategoryType, string> = {
  grammar: 'bg-sage-100 text-sage-800 border-sage-300',
  vocabulary: 'bg-teal-100 text-teal-800 border-teal-300',
  speaking: 'bg-coral-100 text-coral-800 border-coral-300',
  listening: 'bg-sky-100 text-sky-800 border-sky-300',
  reading: 'bg-lavender-100 text-lavender-800 border-lavender-300',
  writing: 'bg-lavender-100 text-lavender-800 border-lavender-300',
  culture: 'bg-terracotta-100 text-terracotta-800 border-terracotta-300',
  community: 'bg-rose-100 text-rose-800 border-rose-300',
  premium: 'bg-indigo-100 text-indigo-800 border-indigo-300',
}

// Difficulty color mappings
const difficultyColors: Record<DifficultyType, string> = {
  beginner: 'bg-secondary-100 text-secondary-800 border-secondary-300',
  intermediate: 'bg-amber-100 text-amber-800 border-amber-300',
  advanced: 'bg-marigold-100 text-marigold-800 border-marigold-300',
}

// Region color mappings
const regionColors: Record<RegionType, string> = {
  'east-africa': 'bg-sky-100 text-sky-800 border-sky-300',
  'west-africa': 'bg-marigold-100 text-marigold-800 border-marigold-300',
  'southern-africa': 'bg-sage-100 text-sage-800 border-sage-300',
  'north-africa': 'bg-amber-100 text-amber-800 border-amber-300',
  'central-africa': 'bg-teal-100 text-teal-800 border-teal-300',
}

// Dark mode variants (for future implementation)
const categoryColorsDark: Record<CategoryType, string> = {
  grammar: 'dark:bg-sage-900 dark:text-sage-100 dark:border-sage-700',
  vocabulary: 'dark:bg-teal-900 dark:text-teal-100 dark:border-teal-700',
  speaking: 'dark:bg-coral-900 dark:text-coral-100 dark:border-coral-700',
  listening: 'dark:bg-sky-900 dark:text-sky-100 dark:border-sky-700',
  reading: 'dark:bg-lavender-900 dark:text-lavender-100 dark:border-lavender-700',
  writing: 'dark:bg-lavender-900 dark:text-lavender-100 dark:border-lavender-700',
  culture: 'dark:bg-terracotta-900 dark:text-terracotta-100 dark:border-terracotta-700',
  community: 'dark:bg-rose-900 dark:text-rose-100 dark:border-rose-700',
  premium: 'dark:bg-indigo-900 dark:text-indigo-100 dark:border-indigo-700',
}

const difficultyColorsDark: Record<DifficultyType, string> = {
  beginner: 'dark:bg-secondary-900 dark:text-secondary-100 dark:border-secondary-700',
  intermediate: 'dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700',
  advanced: 'dark:bg-marigold-900 dark:text-marigold-100 dark:border-marigold-700',
}

const regionColorsDark: Record<RegionType, string> = {
  'east-africa': 'dark:bg-sky-900 dark:text-sky-100 dark:border-sky-700',
  'west-africa': 'dark:bg-marigold-900 dark:text-marigold-100 dark:border-marigold-700',
  'southern-africa': 'dark:bg-sage-900 dark:text-sage-100 dark:border-sage-700',
  'north-africa': 'dark:bg-amber-900 dark:text-amber-100 dark:border-amber-700',
  'central-africa': 'dark:bg-teal-900 dark:text-teal-100 dark:border-teal-700',
}

export function CategoryBadge({
  category,
  difficulty,
  region,
  icon,
  children,
  className,
  ...props
}: CategoryBadgeProps) {
  // Determine which color scheme to use
  let colorClass = ''
  let darkColorClass = ''

  if (category) {
    colorClass = categoryColors[category]
    darkColorClass = categoryColorsDark[category]
  } else if (difficulty) {
    colorClass = difficultyColors[difficulty]
    darkColorClass = difficultyColorsDark[difficulty]
  } else if (region) {
    colorClass = regionColors[region]
    darkColorClass = regionColorsDark[region]
  }

  return (
    <Badge
      className={cn(
        colorClass,
        darkColorClass,
        'border',
        className
      )}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </Badge>
  )
}

// Convenience exports for common badge types
export function GrammarBadge({ children, ...props }: Omit<CategoryBadgeProps, 'category'>) {
  return <CategoryBadge category="grammar" icon="📚" {...props}>{children}</CategoryBadge>
}

export function VocabularyBadge({ children, ...props }: Omit<CategoryBadgeProps, 'category'>) {
  return <CategoryBadge category="vocabulary" icon="📖" {...props}>{children}</CategoryBadge>
}

export function SpeakingBadge({ children, ...props }: Omit<CategoryBadgeProps, 'category'>) {
  return <CategoryBadge category="speaking" icon="🎤" {...props}>{children}</CategoryBadge>
}

export function ListeningBadge({ children, ...props }: Omit<CategoryBadgeProps, 'category'>) {
  return <CategoryBadge category="listening" icon="👂" {...props}>{children}</CategoryBadge>
}

export function ReadingBadge({ children, ...props }: Omit<CategoryBadgeProps, 'category'>) {
  return <CategoryBadge category="reading" icon="📄" {...props}>{children}</CategoryBadge>
}

export function CultureBadge({ children, ...props }: Omit<CategoryBadgeProps, 'category'>) {
  return <CategoryBadge category="culture" icon="🏛️" {...props}>{children}</CategoryBadge>
}

export function BeginnerBadge({ children, ...props }: Omit<CategoryBadgeProps, 'difficulty'>) {
  return <CategoryBadge difficulty="beginner" {...props}>{children}</CategoryBadge>
}

export function IntermediateBadge({ children, ...props }: Omit<CategoryBadgeProps, 'difficulty'>) {
  return <CategoryBadge difficulty="intermediate" {...props}>{children}</CategoryBadge>
}

export function AdvancedBadge({ children, ...props }: Omit<CategoryBadgeProps, 'difficulty'>) {
  return <CategoryBadge difficulty="advanced" {...props}>{children}</CategoryBadge>
}
