import AsyncStorage from '@react-native-async-storage/async-storage'
import { Phrase } from '../data/phrases-data'

// Web uses AsyncStorage for all storage operations

export async function initDatabase() {
  console.log('Using AsyncStorage for web platform')
  return
}

// Phrase operations
export async function savePhrases(phrases: Phrase[]) {
  await AsyncStorage.setItem('phrases', JSON.stringify(phrases))
}

export async function getPhrases(): Promise<Phrase[]> {
  const data = await AsyncStorage.getItem('phrases')
  return data ? JSON.parse(data) : []
}

export async function getPhrasesByCategory(category: string): Promise<Phrase[]> {
  const phrases = await getPhrases()
  return phrases.filter(p => p.category === category)
}

// Bookmark operations
export async function addBookmark(phraseId: string) {
  const bookmarks = await getBookmarks()
  if (!bookmarks.includes(phraseId)) {
    bookmarks.push(phraseId)
    await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks))
  }
}

export async function removeBookmark(phraseId: string) {
  const bookmarks = await getBookmarks()
  const filtered = bookmarks.filter(id => id !== phraseId)
  await AsyncStorage.setItem('bookmarks', JSON.stringify(filtered))
}

export async function getBookmarks(): Promise<string[]> {
  const data = await AsyncStorage.getItem('bookmarks')
  return data ? JSON.parse(data) : []
}

export async function isBookmarked(phraseId: string): Promise<boolean> {
  const bookmarks = await getBookmarks()
  return bookmarks.includes(phraseId)
}

// Progress operations
export async function updateProgress(
  phraseId: string,
  status: 'learning' | 'practiced' | 'mastered'
) {
  const progress = await getProgress()
  progress[phraseId] = { status, lastPracticed: new Date().toISOString() }
  await AsyncStorage.setItem('progress', JSON.stringify(progress))
}

export async function getProgress(): Promise<Record<string, { status: string; lastPracticed: string }>> {
  const data = await AsyncStorage.getItem('progress')
  return data ? JSON.parse(data) : {}
}

// User skills operations
export async function updateUserSkill(skillName: string, score: number) {
  const skills = await getUserSkills()
  skills[skillName] = { score, lastAssessed: new Date().toISOString() }
  await AsyncStorage.setItem('userSkills', JSON.stringify(skills))
}

export async function getUserSkills(): Promise<Record<string, { score: number; lastAssessed: string }>> {
  const data = await AsyncStorage.getItem('userSkills')
  return data ? JSON.parse(data) : {}
}

// Study session operations
export async function recordStudySession(phrasesPracticed: number, durationMinutes: number) {
  const today = new Date().toISOString().split('T')[0]
  const sessions = await getStudySessions()
  sessions.push({ date: today, phrasesPracticed, durationMinutes })
  await AsyncStorage.setItem('studySessions', JSON.stringify(sessions))
}

export async function getStudySessions(): Promise<Array<{ date: string; phrasesPracticed: number; durationMinutes: number }>> {
  const data = await AsyncStorage.getItem('studySessions')
  return data ? JSON.parse(data) : []
}

// Calculate study streak
export async function getStudyStreak(): Promise<number> {
  const sessions = await getStudySessions()
  if (sessions.length === 0) return 0

  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(checkDate.getDate() - i)
    const dateStr = checkDate.toISOString().split('T')[0]

    const hasSession = sessions.some(s => s.date === dateStr)

    if (hasSession) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}
