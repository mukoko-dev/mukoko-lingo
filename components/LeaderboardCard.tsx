/**
 * LeaderboardCard - Weekly community leaderboard.
 * Ubuntu philosophy: "Learn together, grow together."
 */

import { useState, useEffect } from 'react'
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { Trophy, Users } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'

interface LeaderboardEntry {
  rank: number
  displayName: string
  weeklyXP: number
  isCurrentUser: boolean
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[]
  currentUserRank: { rank: number; weeklyXP: number } | null
  totalParticipants: number
}

interface LeaderboardCardProps {
  data?: LeaderboardData | null
  loading?: boolean
  error?: string | null
}

const RANK_MEDALS = ['', '🥇', '🥈', '🥉']

export function LeaderboardCard({ data, loading, error }: LeaderboardCardProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const styles = createStyles(theme, isDark)

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Trophy size={18} color={Colors.accent[isDark ? 300 : 800]} />
          <Text style={styles.title}>Community Leaderboard</Text>
        </View>
        <ActivityIndicator color={theme.primary} style={{ padding: 24 }} />
      </View>
    )
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Trophy size={18} color={Colors.accent[isDark ? 300 : 800]} />
          <Text style={styles.title}>Community Leaderboard</Text>
        </View>
        <Text style={styles.emptyText}>
          {error || 'Start learning to join the leaderboard!'}
        </Text>
      </View>
    )
  }

  const top5 = data.leaderboard.slice(0, 5)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Trophy size={18} color={Colors.accent[isDark ? 300 : 800]} />
        <Text style={styles.title}>This Week's Top Learners</Text>
      </View>

      <Text style={styles.subtitle}>
        {data.totalParticipants} learners this week — learn together, grow together
      </Text>

      {/* Top Entries */}
      {top5.map((entry) => (
        <View
          key={entry.rank}
          style={[styles.row, entry.isCurrentUser && styles.rowHighlight]}
        >
          <View style={styles.rankContainer}>
            {entry.rank <= 3 ? (
              <Text style={styles.medal}>{RANK_MEDALS[entry.rank]}</Text>
            ) : (
              <Text style={styles.rankNumber}>{entry.rank}</Text>
            )}
          </View>
          <Text style={[styles.name, entry.isCurrentUser && styles.nameHighlight]} numberOfLines={1}>
            {entry.displayName}
            {entry.isCurrentUser ? ' (You)' : ''}
          </Text>
          <Text style={[styles.xp, entry.isCurrentUser && styles.xpHighlight]}>
            {entry.weeklyXP.toLocaleString()} XP
          </Text>
        </View>
      ))}

      {/* Current user rank if not in top 5 */}
      {data.currentUserRank && !top5.some(e => e.isCurrentUser) && (
        <>
          <View style={styles.separator}>
            <Text style={styles.separatorText}>•••</Text>
          </View>
          <View style={[styles.row, styles.rowHighlight]}>
            <View style={styles.rankContainer}>
              <Text style={styles.rankNumber}>{data.currentUserRank.rank}</Text>
            </View>
            <Text style={[styles.name, styles.nameHighlight]} numberOfLines={1}>
              You
            </Text>
            <Text style={[styles.xp, styles.xpHighlight]}>
              {data.currentUserRank.weeklyXP.toLocaleString()} XP
            </Text>
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Users size={14} color={theme.textMuted} />
        <Text style={styles.footerText}>
          Community learning — Ubuntu: I am because we are
        </Text>
      </View>
    </View>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 12,
      fontStyle: 'italic',
    },
    emptyText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      padding: 24,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 10,
      marginBottom: 2,
    },
    rowHighlight: {
      backgroundColor: isDark ? Colors.primary[400] + '12' : Colors.primary[600] + '08',
    },
    rankContainer: {
      width: 32,
      alignItems: 'center',
    },
    medal: {
      fontSize: 18,
    },
    rankNumber: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.textMuted,
    },
    name: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginLeft: 8,
    },
    nameHighlight: {
      fontWeight: '700',
      color: theme.primary,
    },
    xp: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    xpHighlight: {
      color: theme.primary,
    },
    separator: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    separatorText: {
      fontSize: 14,
      color: theme.textMuted,
      letterSpacing: 4,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    footerText: {
      fontSize: 11,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
  })
