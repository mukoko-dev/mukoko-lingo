import { useEffect, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { Star, Flame, BookOpen, MessageCircle } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'

interface CelebrationCardProps {
  type: 'daily-goal' | 'quiz-complete' | 'streak'
  score?: number
  total?: number
  streak?: number
  xpEarned?: number
  onContinue?: () => void
  onPracticeWithShamwari?: () => void
  onDismiss?: () => void
}

export function CelebrationCard({
  type,
  score,
  total,
  streak,
  xpEarned,
  onContinue,
  onPracticeWithShamwari,
  onDismiss,
}: CelebrationCardProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const opacityAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [scaleAnim, opacityAnim])

  const getMessage = () => {
    switch (type) {
      case 'daily-goal':
        return {
          emoji: '🎉',
          title: 'Daily Goal Complete!',
          subtitle: "Shamwari says: \"Makorokoto! You're building a great habit!\"",
          accent: Colors.success[500],
        }
      case 'quiz-complete':
        const pct = score && total ? Math.round((score / total) * 100) : 0
        return {
          emoji: pct >= 80 ? '🌟' : pct >= 60 ? '👏' : '💪',
          title: pct >= 80 ? 'Outstanding!' : pct >= 60 ? 'Well done!' : 'Good effort!',
          subtitle: score !== undefined && total !== undefined
            ? `You got ${score} out of ${total} correct`
            : "Keep practicing to improve!",
          accent: pct >= 80 ? Colors.success[500] : theme.primary,
        }
      case 'streak':
        return {
          emoji: '🔥',
          title: `${streak} Day Streak!`,
          subtitle: "You're on fire! Keep the momentum going.",
          accent: Colors.accent[isDark ? 300 : 800],
        }
      default:
        return { emoji: '✨', title: 'Great job!', subtitle: '', accent: theme.primary }
    }
  }

  const message = getMessage()
  const styles = createStyles(theme, isDark, isTablet, message.accent)

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      {onDismiss && (
        <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.emoji}>{message.emoji}</Text>
      <Text style={styles.title}>{message.title}</Text>
      <Text style={styles.subtitle}>{message.subtitle}</Text>

      {/* XP earned badge */}
      {xpEarned !== undefined && xpEarned > 0 && (
        <View style={styles.xpBadge}>
          <Star size={16} color={Colors.accent[isDark ? 300 : 800]} />
          <Text style={styles.xpText}>+{xpEarned} XP earned</Text>
        </View>
      )}

      {/* Streak badge */}
      {streak !== undefined && streak > 0 && type !== 'streak' && (
        <View style={styles.streakBadge}>
          <Flame size={16} color={Colors.accent[isDark ? 300 : 800]} />
          <Text style={styles.streakText}>{streak} day streak</Text>
        </View>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {onPracticeWithShamwari && (
          <TouchableOpacity style={styles.primaryAction} onPress={onPracticeWithShamwari}>
            <MessageCircle size={18} color="#ffffff" />
            <Text style={styles.primaryActionText}>Practice with Shamwari</Text>
          </TouchableOpacity>
        )}

        {onContinue && (
          <TouchableOpacity
            style={onPracticeWithShamwari ? styles.secondaryAction : styles.primaryAction}
            onPress={onContinue}
          >
            <BookOpen size={18} color={onPracticeWithShamwari ? theme.primary : '#ffffff'} />
            <Text style={onPracticeWithShamwari ? styles.secondaryActionText : styles.primaryActionText}>
              Continue Learning
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean, accent: string) =>
  StyleSheet.create({
    container: {
      marginHorizontal: isTablet ? 48 : 16,
      marginBottom: 20,
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: accent + '40',
    },
    dismissButton: {
      position: 'absolute',
      top: 12,
      right: 16,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    dismissText: {
      fontSize: 18,
      color: theme.textMuted,
      lineHeight: 20,
    },
    emoji: {
      fontSize: 52,
      marginBottom: 12,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 16,
      maxWidth: 300,
    },
    xpBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? Colors.accent[300] + '20' : Colors.accent[800] + '12',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 8,
    },
    xpText: {
      fontSize: 15,
      fontWeight: '700',
      color: Colors.accent[isDark ? 300 : 800],
    },
    streakBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? Colors.accent[300] + '15' : Colors.accent[800] + '10',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      marginBottom: 20,
    },
    streakText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.accent[isDark ? 300 : 800],
    },
    actions: {
      width: '100%',
      gap: 10,
    },
    primaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    primaryActionText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    secondaryAction: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? Colors.primary[400] + '15' : Colors.primary[600] + '08',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
      borderWidth: 1,
      borderColor: isDark ? Colors.primary[400] + '30' : Colors.primary[600] + '20',
    },
    secondaryActionText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '600',
    },
  })
