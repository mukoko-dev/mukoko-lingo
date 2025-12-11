// Type declarations for platform-specific database modules
// Metro will resolve to .web.ts or .native.ts based on platform
import { Phrase } from '../data/phrases-data'

export function initDatabase(): Promise<void>
export function savePhrases(phrases: Phrase[]): Promise<void>
export function getPhrases(): Promise<Phrase[]>
export function getPhrasesByCategory(category: string): Promise<Phrase[]>
export function addBookmark(phraseId: string): Promise<void>
export function removeBookmark(phraseId: string): Promise<void>
export function getBookmarks(): Promise<string[]>
export function isBookmarked(phraseId: string): Promise<boolean>
export function updateProgress(
  phraseId: string,
  status: 'learning' | 'practiced' | 'mastered'
): Promise<void>
export function getProgress(): Promise<Record<string, { status: string; lastPracticed: string }>>
export function updateUserSkill(skillName: string, score: number): Promise<void>
export function getUserSkills(): Promise<Record<string, { score: number; lastAssessed: string }>>
export function recordStudySession(phrasesPracticed: number, durationMinutes: number): Promise<void>
export function getStudySessions(): Promise<Array<{ date: string; phrasesPracticed: number; durationMinutes: number }>>
export function getStudyStreak(): Promise<number>
