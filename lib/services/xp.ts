/**
 * XP & Gamification System
 *
 * Tracks experience points, levels, and daily goals.
 * XP is earned through learning activities and drives the engagement loop.
 *
 * XP Sources:
 *   - Daily lesson phrase:   10 XP each
 *   - Quiz correct answer:   15 XP
 *   - Quiz perfect score:    25 XP bonus
 *   - SRS review:            10-26 XP (based on quality)
 *   - AI chat message:       5 XP
 *   - Assessment completed:  50 XP
 *   - Assessment passed:     100 XP bonus
 *   - Daily goal completed:  30 XP bonus
 *   - Streak milestone:      50 XP (every 7 days)
 *
 * Level Formula: level = floor(sqrt(totalXP / 100)) + 1
 *   Level 1: 0 XP      Level 5: 1,600 XP
 *   Level 2: 100 XP    Level 10: 8,100 XP
 *   Level 3: 400 XP    Level 15: 19,600 XP
 *   Level 4: 900 XP    Level 20: 36,100 XP
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const XP_STORAGE_KEY = '@mukoko_xp_data'
const XP_LOG_KEY = '@mukoko_xp_log'

// ============================================================================
// Types
// ============================================================================

export interface XPData {
  totalXP: number
  todayXP: number
  todayDate: string
  dailyGoal: number
  weeklyXP: number
  weekStartDate: string
}

export type XPSource =
  | 'phrase_learned'
  | 'quiz_correct'
  | 'quiz_perfect'
  | 'srs_review'
  | 'ai_chat'
  | 'assessment_completed'
  | 'assessment_passed'
  | 'daily_goal_bonus'
  | 'streak_milestone'

export interface XPEvent {
  source: XPSource
  amount: number
  timestamp: string
}

export interface LevelInfo {
  level: number
  currentXP: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  progressPercent: number
  title: string
}

// ============================================================================
// XP Award Amounts
// ============================================================================

export const XP_AMOUNTS: Record<XPSource, number> = {
  phrase_learned: 10,
  quiz_correct: 15,
  quiz_perfect: 25,
  srs_review: 10,
  ai_chat: 5,
  assessment_completed: 50,
  assessment_passed: 100,
  daily_goal_bonus: 30,
  streak_milestone: 50,
}

const DEFAULT_DAILY_GOAL = 50

// ============================================================================
// Level System
// ============================================================================

const LEVEL_TITLES = [
  'Seedling',       // 1
  'Sprout',         // 2
  'Sapling',        // 3
  'Young Tree',     // 4
  'Growing Tree',   // 5
  'Strong Tree',    // 6
  'Flowering Tree', // 7
  'Fruit Bearer',   // 8
  'Elder Tree',     // 9
  'Baobab',         // 10
  'Forest Guide',   // 11-15
  'Language Keeper', // 16-20
  'Community Elder', // 21-25
  'Master Speaker',  // 26+
]

export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100)) + 1
}

export function xpRequiredForLevel(level: number): number {
  return (level - 1) * (level - 1) * 100
}

export function getLevelInfo(totalXP: number): LevelInfo {
  const level = calculateLevel(totalXP)
  const xpForCurrent = xpRequiredForLevel(level)
  const xpForNext = xpRequiredForLevel(level + 1)
  const progressInLevel = totalXP - xpForCurrent
  const levelRange = xpForNext - xpForCurrent

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1)

  return {
    level,
    currentXP: totalXP,
    xpForCurrentLevel: xpForCurrent,
    xpForNextLevel: xpForNext,
    progressPercent: Math.min(Math.round((progressInLevel / levelRange) * 100), 100),
    title: LEVEL_TITLES[titleIndex],
  }
}

// ============================================================================
// Core XP Operations
// ============================================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

function getWeekStartString(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.setDate(diff))
  return monday.toISOString().split('T')[0]
}

/**
 * Get current XP data from storage.
 */
export async function getXPData(): Promise<XPData> {
  const data = await AsyncStorage.getItem(XP_STORAGE_KEY)
  if (!data) {
    return {
      totalXP: 0,
      todayXP: 0,
      todayDate: getTodayString(),
      dailyGoal: DEFAULT_DAILY_GOAL,
      weeklyXP: 0,
      weekStartDate: getWeekStartString(),
    }
  }

  const parsed: XPData = JSON.parse(data)
  const today = getTodayString()
  const weekStart = getWeekStartString()

  // Reset daily XP if it's a new day
  if (parsed.todayDate !== today) {
    parsed.todayXP = 0
    parsed.todayDate = today
  }

  // Reset weekly XP if it's a new week
  if (parsed.weekStartDate !== weekStart) {
    parsed.weeklyXP = 0
    parsed.weekStartDate = weekStart
  }

  return parsed
}

/**
 * Award XP and return the updated data + whether daily goal was just completed.
 */
export async function awardXP(
  source: XPSource,
  customAmount?: number
): Promise<{ xpData: XPData; levelInfo: LevelInfo; dailyGoalJustCompleted: boolean; leveledUp: boolean }> {
  const amount = customAmount ?? XP_AMOUNTS[source]
  const current = await getXPData()
  const previousLevel = calculateLevel(current.totalXP)
  const wasDailyGoalMet = current.todayXP >= current.dailyGoal

  const updated: XPData = {
    ...current,
    totalXP: current.totalXP + amount,
    todayXP: current.todayXP + amount,
    weeklyXP: current.weeklyXP + amount,
  }

  await AsyncStorage.setItem(XP_STORAGE_KEY, JSON.stringify(updated))

  // Log the event
  await logXPEvent({ source, amount, timestamp: new Date().toISOString() })

  const newLevel = calculateLevel(updated.totalXP)
  const dailyGoalJustCompleted = !wasDailyGoalMet && updated.todayXP >= updated.dailyGoal

  // Auto-award daily goal bonus
  if (dailyGoalJustCompleted) {
    updated.totalXP += XP_AMOUNTS.daily_goal_bonus
    updated.todayXP += XP_AMOUNTS.daily_goal_bonus
    updated.weeklyXP += XP_AMOUNTS.daily_goal_bonus
    await AsyncStorage.setItem(XP_STORAGE_KEY, JSON.stringify(updated))
    await logXPEvent({ source: 'daily_goal_bonus', amount: XP_AMOUNTS.daily_goal_bonus, timestamp: new Date().toISOString() })
  }

  return {
    xpData: updated,
    levelInfo: getLevelInfo(updated.totalXP),
    dailyGoalJustCompleted,
    leveledUp: newLevel > previousLevel,
  }
}

/**
 * Set the daily XP goal.
 */
export async function setDailyGoal(goal: number): Promise<void> {
  const data = await getXPData()
  data.dailyGoal = goal
  await AsyncStorage.setItem(XP_STORAGE_KEY, JSON.stringify(data))
}

// ============================================================================
// XP Event Log (Recent History)
// ============================================================================

async function logXPEvent(event: XPEvent): Promise<void> {
  const data = await AsyncStorage.getItem(XP_LOG_KEY)
  const log: XPEvent[] = data ? JSON.parse(data) : []
  log.push(event)
  // Keep only last 100 events
  const trimmed = log.slice(-100)
  await AsyncStorage.setItem(XP_LOG_KEY, JSON.stringify(trimmed))
}

/**
 * Get recent XP events (last 50).
 */
export async function getRecentXPEvents(): Promise<XPEvent[]> {
  const data = await AsyncStorage.getItem(XP_LOG_KEY)
  const log: XPEvent[] = data ? JSON.parse(data) : []
  return log.slice(-50).reverse()
}

/**
 * Get a human-readable label for an XP source.
 */
export function getXPSourceLabel(source: XPSource): string {
  const labels: Record<XPSource, string> = {
    phrase_learned: 'Phrase Learned',
    quiz_correct: 'Quiz Answer',
    quiz_perfect: 'Perfect Quiz',
    srs_review: 'Review',
    ai_chat: 'Shamwari Chat',
    assessment_completed: 'Assessment',
    assessment_passed: 'Assessment Passed',
    daily_goal_bonus: 'Daily Goal',
    streak_milestone: 'Streak Bonus',
  }
  return labels[source]
}
