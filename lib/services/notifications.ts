/**
 * Push Notification Service for Mukoko Lingo
 *
 * Handles push notification registration, local scheduling for daily
 * reminders and streak-at-risk alerts, and syncing tokens to the server.
 */

import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { profilesApi } from './api-client'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEYS = {
  NOTIFICATIONS_ENABLED: '@mukoko_notifications_enabled',
  PUSH_TOKEN: '@mukoko_push_token',
  DAILY_REMINDER_HOUR: '@mukoko_daily_reminder_hour',
} as const

/** Identifiers used when scheduling repeating local notifications */
const NOTIFICATION_IDS = {
  DAILY_REMINDER: 'mukoko-daily-reminder',
  STREAK_REMINDER: 'mukoko-streak-reminder',
} as const

const DEFAULT_DAILY_REMINDER_HOUR = 9 // 9 AM
const STREAK_REMINDER_HOUR = 20 // 8 PM

// ---------------------------------------------------------------------------
// Configure default notification behaviour (foreground handling)
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

// ---------------------------------------------------------------------------
// Token Registration
// ---------------------------------------------------------------------------

/**
 * Request notification permissions and obtain the Expo push token.
 * On physical devices this returns a valid token; on simulators / web it
 * returns `null` gracefully.
 *
 * The token is persisted locally and, if the user is authenticated,
 * synced to the server via POST /api/notifications/register.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[notifications] Push notifications require a physical device')
    return null
  }

  // Web does not support Expo push tokens in the same way
  if (Platform.OS === 'web') {
    console.log('[notifications] Push tokens are not supported on web')
    return null
  }

  try {
    // Check / request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync()
    let finalStatus = existingStatus

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync()
      finalStatus = status
    }

    if (finalStatus !== 'granted') {
      console.log('[notifications] Permission not granted')
      return null
    }

    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0047AB', // Cobalt primary
      })
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync()
    const token = tokenData.data

    // Persist locally
    await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token)

    // Sync to server (fire-and-forget; failure is non-critical)
    syncTokenToServer(token).catch((err) =>
      console.warn('[notifications] Token sync failed:', err)
    )

    return token
  } catch (error) {
    console.error('[notifications] Registration error:', error)
    return null
  }
}

/**
 * Send the push token to our backend so the server can address push
 * notifications to this device in the future.
 */
async function syncTokenToServer(token: string): Promise<void> {
  try {
    const platform = Platform.OS as string
    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_BASE_URL || ''}/api/notifications/register`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ push_token: token, platform }),
      }
    )
    // We intentionally ignore 401 — the user might not be signed in yet.
    if (response.ok) {
      console.log('[notifications] Token synced to server')
    }
  } catch {
    // Network issues are non-critical here
  }
}

// ---------------------------------------------------------------------------
// Local Notification Scheduling
// ---------------------------------------------------------------------------

/**
 * Schedule a daily reminder notification that repeats every day at the
 * given hour (0-23). Cancels any existing daily reminder first.
 */
export async function scheduleDailyReminder(hour?: number): Promise<void> {
  const reminderHour = hour ?? DEFAULT_DAILY_REMINDER_HOUR

  // Cancel previous daily reminder if scheduled
  await cancelNotificationById(NOTIFICATION_IDS.DAILY_REMINDER)

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.DAILY_REMINDER,
    content: {
      title: 'Time for your daily lesson!',
      body: 'Your daily Shona lesson with Shamwari is waiting. Keep the streak going!',
      sound: true,
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: reminderHour,
      minute: 0,
    },
  })

  await AsyncStorage.setItem(
    STORAGE_KEYS.DAILY_REMINDER_HOUR,
    String(reminderHour)
  )
}

/**
 * Schedule an evening "streak at risk" notification. This fires daily at
 * 8 PM with a message reflecting the current streak length.
 *
 * @param streakDays – Current streak count to include in the message.
 */
export async function scheduleStreakReminder(streakDays: number): Promise<void> {
  await cancelNotificationById(NOTIFICATION_IDS.STREAK_REMINDER)

  const streakText =
    streakDays > 0
      ? `Your ${streakDays}-day streak is at risk! Learn today to keep it alive.`
      : 'Start a streak today! Complete a lesson to begin.'

  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_IDS.STREAK_REMINDER,
    content: {
      title: 'Streak at risk!',
      body: streakText,
      sound: true,
      data: { type: 'streak_reminder', streakDays },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: STREAK_REMINDER_HOUR,
      minute: 0,
    },
  })
}

// ---------------------------------------------------------------------------
// Cancellation helpers
// ---------------------------------------------------------------------------

/** Cancel a single scheduled notification by its identifier. */
async function cancelNotificationById(identifier: string): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(identifier)
  } catch {
    // Notification may not exist — that is fine.
  }
}

/** Cancel all scheduled reminders (daily + streak). */
export async function cancelAllReminders(): Promise<void> {
  await cancelNotificationById(NOTIFICATION_IDS.DAILY_REMINDER)
  await cancelNotificationById(NOTIFICATION_IDS.STREAK_REMINDER)
}

// ---------------------------------------------------------------------------
// Preference helpers (AsyncStorage-backed)
// ---------------------------------------------------------------------------

/**
 * Whether the user has opted in to notifications.
 * Defaults to `false` until explicitly enabled.
 */
export async function isNotificationsEnabled(): Promise<boolean> {
  const value = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED)
  return value === 'true'
}

/**
 * Persist the user's notification preference and activate / deactivate
 * notifications accordingly.
 *
 * When enabling, this registers for push and schedules default reminders.
 * When disabling, it cancels all scheduled reminders.
 *
 * @param enabled – whether notifications should be active
 * @param streakDays – current streak, used to personalise the streak
 *                     reminder message (defaults to 0)
 */
export async function setNotificationsEnabled(
  enabled: boolean,
  streakDays: number = 0
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEYS.NOTIFICATIONS_ENABLED,
    enabled ? 'true' : 'false'
  )

  if (enabled) {
    await registerForPushNotifications()
    await scheduleDailyReminder()
    await scheduleStreakReminder(streakDays)
  } else {
    await cancelAllReminders()
  }
}

/**
 * Get the locally stored push token (may be null if not yet registered).
 */
export async function getStoredPushToken(): Promise<string | null> {
  return AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN)
}
