/**
 * Offline Mode Service for Mukoko Lingo
 *
 * Since the app already persists learning data locally (AsyncStorage on web,
 * SQLite on native), "offline mode" primarily means:
 *
 * 1. Disable outbound API sync calls so the app doesn't error out
 * 2. Surface an "offline" flag so the UI can show a banner
 * 3. Queue sync operations for when connectivity returns
 *
 * Phrase data comes from `lib/data/phrases-data.ts` which is bundled
 * statically — no network required.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { phrases as staticPhrases } from '@/lib/data/phrases-data'
import {
  savePhrases,
  getBookmarks,
  getProgress,
  getUserSkills,
  getStudySessions,
} from '@/lib/storage/database'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  OFFLINE_MODE: '@mukoko_offline_mode',
  OFFLINE_CACHED_AT: '@mukoko_offline_cached_at',
  SYNC_QUEUE: '@mukoko_sync_queue',
} as const

// ---------------------------------------------------------------------------
// Offline mode toggle (AsyncStorage-backed)
// ---------------------------------------------------------------------------

/**
 * Whether the user has opted in to offline mode.
 */
export async function isOfflineMode(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_MODE)
  return value === 'true'
}

/**
 * Enable or disable offline mode.
 *
 * When enabling:
 * - Caches static phrases and current user data into AsyncStorage.
 *
 * When disabling:
 * - Flushes the pending sync queue (best-effort).
 */
export async function setOfflineMode(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.OFFLINE_MODE,
    enabled ? 'true' : 'false'
  )

  if (enabled) {
    await cachePhrasesForOffline()
    await cacheUserDataForOffline()
  } else {
    // When going back online, attempt to flush any queued operations
    await flushSyncQueue()
  }
}

// ---------------------------------------------------------------------------
// Caching helpers
// ---------------------------------------------------------------------------

/**
 * Persist the full static phrase list into local storage so it is
 * available even if the JS bundle cache is purged.
 */
export async function cachePhrasesForOffline(): Promise<void> {
  try {
    await savePhrases(staticPhrases)
    await AsyncStorage.setItem(
      STORAGE_KEYS.OFFLINE_CACHED_AT,
      new Date().toISOString()
    )
    console.log(`[offline] Cached ${staticPhrases.length} phrases for offline use`)
  } catch (error) {
    console.error('[offline] Failed to cache phrases:', error)
  }
}

/**
 * Snapshot the current user learning state into AsyncStorage.
 *
 * Most of this data is already persisted there by the storage layer, so
 * this function primarily ensures it is fresh and creates a single
 * snapshot record for diagnostics.
 */
export async function cacheUserDataForOffline(): Promise<void> {
  try {
    const [bookmarks, progress, skills, sessions] = await Promise.all([
      getBookmarks(),
      getProgress(),
      getUserSkills(),
      getStudySessions(),
    ])

    // Write a compact snapshot — the individual keys are already stored
    // by the storage module, so this is mainly for "last cached" tracking.
    const snapshot = {
      bookmarkCount: bookmarks.length,
      progressCount: Object.keys(progress).length,
      skillCount: Object.keys(skills).length,
      sessionCount: sessions.length,
      cachedAt: new Date().toISOString(),
    }

    await AsyncStorage.setItem(
      '@mukoko_offline_snapshot',
      JSON.stringify(snapshot)
    )

    console.log('[offline] User data snapshot created:', snapshot)
  } catch (error) {
    console.error('[offline] Failed to cache user data:', error)
  }
}

/**
 * Return the timestamp of the last successful offline cache, or null if
 * the cache has never been populated.
 */
export async function getLastCachedAt(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_CACHED_AT)
}

// ---------------------------------------------------------------------------
// Sync queue
// ---------------------------------------------------------------------------

interface SyncQueueItem {
  id: string
  method: 'POST' | 'PUT' | 'DELETE'
  path: string
  body?: Record<string, any>
  createdAt: string
}

/**
 * Enqueue an API operation that should be retried when the device is back
 * online. The queue is persisted in AsyncStorage.
 */
export async function enqueueSyncOperation(
  method: 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, any>
): Promise<void> {
  try {
    const queue = await getSyncQueue()
    const item: SyncQueueItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      method,
      path,
      body,
      createdAt: new Date().toISOString(),
    }
    queue.push(item)
    await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue))
  } catch (error) {
    console.error('[offline] Failed to enqueue sync operation:', error)
  }
}

/**
 * Retrieve the current sync queue.
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.SYNC_QUEUE)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

/**
 * Attempt to flush all queued sync operations. Items that succeed are
 * removed; items that fail remain for the next attempt.
 *
 * This is intentionally best-effort — a transient server error will leave
 * the item in the queue for the next flush cycle.
 */
export async function flushSyncQueue(): Promise<void> {
  const queue = await getSyncQueue()
  if (queue.length === 0) return

  const remaining: SyncQueueItem[] = []
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || ''

  for (const item of queue) {
    try {
      const response = await fetch(`${apiBaseUrl}/api${item.path}`, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined,
      })

      if (!response.ok && response.status >= 500) {
        // Server error — keep in queue for retry
        remaining.push(item)
      }
      // 2xx or 4xx (client error) — remove from queue
    } catch {
      // Network error — keep in queue
      remaining.push(item)
    }
  }

  await AsyncStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(remaining))

  const flushed = queue.length - remaining.length
  if (flushed > 0) {
    console.log(`[offline] Flushed ${flushed}/${queue.length} queued operations`)
  }
}
