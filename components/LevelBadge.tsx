/**
 * LevelBadge - Shows user level, title, and progress to next level.
 * Used on insights dashboard and profile screen.
 */

import { View, Text, StyleSheet } from 'react-native'
import { Zap } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import type { LevelInfo } from '@/lib/services/xp'

interface LevelBadgeProps {
  levelInfo: LevelInfo
  todayXP?: number
  dailyGoal?: number
  compact?: boolean
}

export function LevelBadge({ levelInfo, todayXP, dailyGoal, compact }: LevelBadgeProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const styles = createStyles(theme, isDark, compact)

  const dailyPercent = todayXP !== undefined && dailyGoal
    ? Math.min(Math.round((todayXP / dailyGoal) * 100), 100)
    : null

  return (
    <View style={styles.container}>
      {/* Level Circle */}
      <View style={styles.levelCircle}>
        <Zap size={compact ? 16 : 20} color={Colors.accent[isDark ? 300 : 800]} />
        <Text style={styles.levelNumber}>{levelInfo.level}</Text>
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{levelInfo.title}</Text>
          <Text style={styles.xpText}>
            {levelInfo.currentXP.toLocaleString()} XP
          </Text>
        </View>

        {/* Level progress bar */}
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${levelInfo.progressPercent}%` }]}
          />
        </View>
        <Text style={styles.progressText}>
          {levelInfo.xpForNextLevel - levelInfo.currentXP} XP to Level {levelInfo.level + 1}
        </Text>

        {/* Daily goal progress */}
        {dailyPercent !== null && !compact && (
          <View style={styles.dailyRow}>
            <Text style={styles.dailyLabel}>Today</Text>
            <View style={styles.dailyBar}>
              <View
                style={[
                  styles.dailyFill,
                  {
                    width: `${dailyPercent}%`,
                    backgroundColor: dailyPercent >= 100 ? Colors.success[500] : theme.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.dailyText}>
              {todayXP}/{dailyGoal}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, compact?: boolean) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: compact ? 14 : 18,
      padding: compact ? 12 : 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: compact ? 10 : 14,
    },
    levelCircle: {
      width: compact ? 44 : 56,
      height: compact ? 44 : 56,
      borderRadius: compact ? 22 : 28,
      backgroundColor: isDark ? Colors.accent[300] + '15' : Colors.accent[800] + '10',
      borderWidth: 2,
      borderColor: Colors.accent[isDark ? 300 : 800],
      alignItems: 'center',
      justifyContent: 'center',
    },
    levelNumber: {
      fontSize: compact ? 12 : 14,
      fontWeight: '800',
      color: Colors.accent[isDark ? 300 : 800],
      marginTop: -2,
    },
    info: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    title: {
      fontSize: compact ? 14 : 16,
      fontWeight: '700',
      color: theme.text,
    },
    xpText: {
      fontSize: compact ? 12 : 13,
      fontWeight: '600',
      color: Colors.accent[isDark ? 300 : 800],
    },
    progressBar: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[200],
      overflow: 'hidden',
      marginBottom: 4,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: Colors.accent[isDark ? 300 : 600],
    },
    progressText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    dailyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 8,
    },
    dailyLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
      width: 36,
    },
    dailyBar: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[200],
      overflow: 'hidden',
    },
    dailyFill: {
      height: '100%',
      borderRadius: 2,
    },
    dailyText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
      width: 44,
      textAlign: 'right',
    },
  })
