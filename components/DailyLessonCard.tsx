import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native'
import { BookOpen, Play, ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { useLearningLanguage } from '@/lib/hooks/useLearningLanguage'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { FlashCard } from '@/components/FlashCard'
import { getTodaysLesson, getTodayProgress } from '@/lib/services/daily-lesson'
import { awardXP } from '@/lib/services/xp'
import { getDueCount } from '@/lib/services/srs'
import type { Phrase } from '@/lib/data/phrases-data'

interface DailyLessonCardProps {
  onStartQuiz: (phrases: Phrase[]) => void
  onPhrasePress?: (phrase: Phrase) => void
}

export function DailyLessonCard({ onStartQuiz, onPhrasePress }: DailyLessonCardProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { learningLanguage } = useLearningLanguage()
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const [lessonPhrases, setLessonPhrases] = useState<Phrase[]>([])
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set())
  const [dailyProgress, setDailyProgress] = useState({ learned: 0, goal: 5, completed: false })
  const [loading, setLoading] = useState(true)
  const [dueReviewCount, setDueReviewCount] = useState(0)

  useEffect(() => {
    loadLesson()
  }, [])

  const loadLesson = async () => {
    try {
      const [phrases, progress, dueCount] = await Promise.all([
        getTodaysLesson(),
        getTodayProgress(),
        getDueCount(),
      ])
      setLessonPhrases(phrases)
      setDailyProgress(progress)
      setDueReviewCount(dueCount)
    } catch (error) {
      console.error('Error loading daily lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleView = useCallback((phraseId: string) => {
    setViewedIds(prev => {
      const next = new Set(prev)
      if (!next.has(phraseId)) {
        next.add(phraseId)
        // Award XP for viewing a new flash card
        awardXP('phrase_learned').catch(() => {})
      }
      return next
    })
  }, [])

  const allViewed = lessonPhrases.length > 0 && viewedIds.size >= lessonPhrases.length
  const progressPercent = dailyProgress.goal > 0
    ? Math.min((dailyProgress.learned / dailyProgress.goal) * 100, 100)
    : 0

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>Preparing today's lesson...</Text>
        </View>
      </View>
    )
  }

  if (lessonPhrases.length === 0) return null

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconBg}>
            <BookOpen size={18} color={theme.primary} />
          </View>
          <View>
            <Text style={styles.title}>Today's Lesson</Text>
            <Text style={styles.subtitle}>
              {dailyProgress.learned} of {dailyProgress.goal} phrases
              {dueReviewCount > 0 ? ` · ${dueReviewCount} to review` : ''}
            </Text>
          </View>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>
      </View>

      {/* Flash Cards Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {lessonPhrases.map((phrase) => (
          <FlashCard
            key={phrase.id}
            phrase={phrase}
            language={learningLanguage}
            isViewed={viewedIds.has(phrase.id)}
            onView={() => handleView(phrase.id)}
          />
        ))}
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {allViewed ? (
          <TouchableOpacity
            style={styles.quizButton}
            onPress={() => onStartQuiz(lessonPhrases)}
          >
            <Play size={18} color="#ffffff" />
            <Text style={styles.quizButtonText}>Start Practice Quiz</Text>
            <ChevronRight size={16} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.hintText}>
            Flip all {lessonPhrases.length} cards to unlock the quiz
          </Text>
        )}
      </View>
    </View>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean) =>
  StyleSheet.create({
    container: {
      marginHorizontal: isTablet ? 48 : 16,
      marginBottom: 20,
      backgroundColor: theme.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    loadingCard: {
      padding: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      color: theme.textMuted,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flex: 1,
    },
    iconBg: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? Colors.primary[400] + '15' : Colors.primary[600] + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    subtitle: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 1,
    },
    progressBarContainer: {
      width: 80,
      paddingLeft: 12,
    },
    progressBarBg: {
      height: 6,
      borderRadius: 3,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[200],
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: Colors.success[500],
    },
    carousel: {
      marginTop: 8,
    },
    carouselContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    actionBar: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    quizButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
      width: '100%',
    },
    quizButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    hintText: {
      fontSize: 13,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
  })
