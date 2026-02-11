import * as SQLite from 'expo-sqlite'
import { Phrase } from '../data/phrases-data'

// Native uses SQLite for storage

let db: SQLite.SQLiteDatabase | null = null

export async function initDatabase() {
  db = await SQLite.openDatabaseAsync('mukoko-lingo.db')

  // Create tables
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS phrases (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      english TEXT NOT NULL,
      shona TEXT NOT NULL,
      ndebele TEXT NOT NULL,
      swahili TEXT NOT NULL,
      chinese TEXT NOT NULL,
      pronunciation TEXT NOT NULL,
      context TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase_id TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (phrase_id) REFERENCES phrases(id)
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phrase_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'learning',
      times_practiced INTEGER DEFAULT 0,
      last_practiced TEXT,
      FOREIGN KEY (phrase_id) REFERENCES phrases(id)
    );

    CREATE TABLE IF NOT EXISTS user_skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      skill_name TEXT NOT NULL UNIQUE,
      proficiency_score INTEGER DEFAULT 0,
      last_assessed TEXT
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      phrases_practiced INTEGER DEFAULT 0,
      duration_minutes INTEGER DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_phrases_category ON phrases(category);
    CREATE INDEX IF NOT EXISTS idx_progress_status ON progress(status);
  `)

  console.log('SQLite database initialized')
}

// Phrase operations
export async function savePhrases(phrases: Phrase[]) {
  if (!db) await initDatabase()

  for (const phrase of phrases) {
    await db!.runAsync(
      `INSERT OR REPLACE INTO phrases (id, category, english, shona, ndebele, swahili, chinese, pronunciation, context)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        phrase.id,
        phrase.category,
        phrase.english,
        phrase.shona,
        phrase.ndebele,
        phrase.swahili,
        phrase.chinese,
        JSON.stringify(phrase.pronunciation),
        JSON.stringify(phrase.context),
      ]
    )
  }
}

export async function getPhrases(): Promise<Phrase[]> {
  if (!db) await initDatabase()

  const rows = await db!.getAllAsync<any>('SELECT * FROM phrases')
  return rows.map(row => ({
    ...row,
    pronunciation: JSON.parse(row.pronunciation),
    context: JSON.parse(row.context),
  }))
}

export async function getPhrasesByCategory(category: string): Promise<Phrase[]> {
  if (!db) await initDatabase()

  const rows = await db!.getAllAsync<any>(
    'SELECT * FROM phrases WHERE category = ?',
    [category]
  )
  return rows.map(row => ({
    ...row,
    pronunciation: JSON.parse(row.pronunciation),
    context: JSON.parse(row.context),
  }))
}

// Bookmark operations
export async function addBookmark(phraseId: string) {
  if (!db) await initDatabase()
  await db!.runAsync(
    'INSERT OR IGNORE INTO bookmarks (phrase_id) VALUES (?)',
    [phraseId]
  )
}

export async function removeBookmark(phraseId: string) {
  if (!db) await initDatabase()
  await db!.runAsync('DELETE FROM bookmarks WHERE phrase_id = ?', [phraseId])
}

export async function getBookmarks(): Promise<string[]> {
  if (!db) await initDatabase()
  const rows = await db!.getAllAsync<{ phrase_id: string }>(
    'SELECT phrase_id FROM bookmarks'
  )
  return rows.map(r => r.phrase_id)
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
  if (!db) await initDatabase()
  await db!.runAsync(
    `INSERT INTO progress (phrase_id, status, times_practiced, last_practiced)
     VALUES (?, ?, 1, datetime('now'))
     ON CONFLICT(phrase_id) DO UPDATE SET
       status = excluded.status,
       times_practiced = times_practiced + 1,
       last_practiced = datetime('now')`,
    [phraseId, status]
  )
}

export async function getProgress(): Promise<Record<string, { status: string; lastPracticed: string }>> {
  if (!db) await initDatabase()
  const rows = await db!.getAllAsync<any>('SELECT * FROM progress')
  const progress: Record<string, { status: string; lastPracticed: string }> = {}
  for (const row of rows) {
    progress[row.phrase_id] = {
      status: row.status,
      lastPracticed: row.last_practiced,
    }
  }
  return progress
}

// User skills operations
export async function updateUserSkill(skillName: string, score: number) {
  if (!db) await initDatabase()
  await db!.runAsync(
    `INSERT INTO user_skills (skill_name, proficiency_score, last_assessed)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(skill_name) DO UPDATE SET
       proficiency_score = excluded.proficiency_score,
       last_assessed = datetime('now')`,
    [skillName, score]
  )
}

export async function getUserSkills(): Promise<Record<string, { score: number; lastAssessed: string }>> {
  if (!db) await initDatabase()
  const rows = await db!.getAllAsync<any>('SELECT * FROM user_skills')
  const skills: Record<string, { score: number; lastAssessed: string }> = {}
  for (const row of rows) {
    skills[row.skill_name] = {
      score: row.proficiency_score,
      lastAssessed: row.last_assessed,
    }
  }
  return skills
}

// Study session operations
export async function recordStudySession(phrasesPracticed: number, durationMinutes: number) {
  const today = new Date().toISOString().split('T')[0]

  if (!db) await initDatabase()
  await db!.runAsync(
    'INSERT INTO study_sessions (date, phrases_practiced, duration_minutes) VALUES (?, ?, ?)',
    [today, phrasesPracticed, durationMinutes]
  )
}

export async function getStudySessions(): Promise<Array<{ date: string; phrasesPracticed: number; durationMinutes: number }>> {
  if (!db) await initDatabase()
  const rows = await db!.getAllAsync<any>(
    'SELECT * FROM study_sessions ORDER BY date DESC LIMIT 30'
  )
  return rows.map(r => ({
    date: r.date,
    phrasesPracticed: r.phrases_practiced,
    durationMinutes: r.duration_minutes,
  }))
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
