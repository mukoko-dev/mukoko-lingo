import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  Bookmark,
  TrendingUp,
  Award,
  ChevronRight,
  Flame,
  CheckCircle2,
  Circle,
  Target,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import {
  getBookmarks,
  getProgress,
  getUserSkills,
  getStudyStreak,
} from '@/lib/storage/database'
import { getTodayProgress } from '@/lib/services/daily-lesson'
import { phrases } from '@/lib/data/phrases-data'
import { useLearningLanguage, LEARNING_LANGUAGES } from '@/lib/hooks/useLearningLanguage'

type ProgressStatus = 'learning' | 'practiced' | 'mastered'

const SKILL_DEFINITIONS = [
  { id: 'pronunciation', name: 'Pronunciation' },
  { id: 'vocabulary', name: 'Vocabulary' },
  { id: 'grammar', name: 'Grammar' },
  { id: 'comprehension', name: 'Comprehension' },
  { id: 'conversation', name: 'Conversation' },
]

interface ProgressData {
  bookmarkedIds: string[]
  progress: Record<string, { status: string; lastPracticed: string }>
  skills: Record<string, { score: number; lastAssessed: string }>
  streak: number
  dailyGoal: { learned: number; goal: number; completed: boolean }
}

export default function ProgressScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()
  const { learningLanguage } = useLearningLanguage()

  const [data, setData] = useState<ProgressData>({
    bookmarkedIds: [],
    progress: {},
    skills: {},
    streak: 0,
    dailyGoal: { learned: 0, goal: 5, completed: false },
  })
  const [refreshing, setRefreshing] = useState(false)
  const [activeSection, setActiveSection] = useState<'dashboard' | 'phrases'>('dashboard')

  const loadData = useCallback(async () => {
    const [bookmarkedIds, progress, skills, streak, dailyGoal] = await Promise.all([
      getBookmarks(),
      getProgress(),
      getUserSkills(),
      getStudyStreak(),
      getTodayProgress(),
    ])
    setData({ bookmarkedIds, progress, skills, streak, dailyGoal })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  // Computed stats
  const progressEntries = Object.entries(data.progress)
  const masteredCount = progressEntries.filter(([, v]) => v.status === 'mastered').length
  const practicedCount = progressEntries.filter(([, v]) => v.status === 'practiced').length
  const learningCount = progressEntries.filter(([, v]) => v.status === 'learning').length
  const totalPhrases = phrases.length

  const skillEntries = Object.entries(data.skills)
  const overallScore = skillEntries.length > 0
    ? Math.round(skillEntries.reduce((sum, [, v]) => sum + v.score, 0) / skillEntries.length)
    : 0

  const getProficiencyLevel = (score: number) => {
    if (score >= 90) return 'Fluent'
    if (score >= 80) return 'Advanced'
    if (score >= 65) return 'Intermediate'
    if (score >= 50) return 'Elementary'
    return 'Beginner'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered': return Colors.success[500]
      case 'practiced': return theme.secondary
      case 'learning': return theme.accent
      default: return theme.textMuted
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'mastered': return CheckCircle2
      case 'practiced': return Target
      case 'learning': return Circle
      default: return Circle
    }
  }

  // Bookmarked + in-progress phrases combined
  const trackedPhrases = phrases.filter(p =>
    data.bookmarkedIds.includes(p.id) || data.progress[p.id]
  ).sort((a, b) => {
    const aBookmarked = data.bookmarkedIds.includes(a.id) ? 1 : 0
    const bBookmarked = data.bookmarkedIds.includes(b.id) ? 1 : 0
    if (aBookmarked !== bBookmarked) return bBookmarked - aBookmarked
    const statusOrder: Record<string, number> = { learning: 0, practiced: 1, mastered: 2 }
    const aStatus = statusOrder[data.progress[a.id]?.status] ?? -1
    const bStatus = statusOrder[data.progress[b.id]?.status] ?? -1
    return aStatus - bStatus
  })

  const dailyPercent = data.dailyGoal.goal > 0
    ? Math.min((data.dailyGoal.learned / data.dailyGoal.goal) * 100, 100)
    : 0

  const styles = createStyles(theme, isDark)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        {(['dashboard', 'phrases'] as const).map(section => (
          <TouchableOpacity
            key={section}
            style={[styles.sectionTab, activeSection === section && styles.sectionTabActive]}
            onPress={() => setActiveSection(section)}
          >
            <Text style={[
              styles.sectionTabText,
              activeSection === section && styles.sectionTabTextActive,
            ]}>
              {section === 'dashboard' ? 'Dashboard' : 'Phrases'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === 'dashboard' && (
        <>
          {/* Daily Goal Card */}
          <View style={styles.dailyGoalCard}>
            <View style={styles.dailyGoalHeader}>
              <Target size={18} color={data.dailyGoal.completed ? Colors.success[500] : theme.primary} />
              <Text style={styles.dailyGoalTitle}>
                {data.dailyGoal.completed ? 'Daily Goal Complete!' : "Today's Goal"}
              </Text>
            </View>
            <View style={styles.dailyGoalProgress}>
              <Text style={styles.dailyGoalCount}>
                {data.dailyGoal.learned}/{data.dailyGoal.goal}
              </Text>
              <View style={styles.dailyGoalBarBg}>
                <View style={[
                  styles.dailyGoalBarFill,
                  {
                    width: `${dailyPercent}%`,
                    backgroundColor: data.dailyGoal.completed ? Colors.success[500] : theme.primary,
                  },
                ]} />
              </View>
            </View>
          </View>

          {/* Quick Stats Row */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: theme.accent + '20' }]}>
                <Flame size={20} color={theme.accent} />
              </View>
              <Text style={styles.statValue}>{data.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.success[500] + '20' }]}>
                <Award size={20} color={Colors.success[500]} />
              </View>
              <Text style={styles.statValue}>{masteredCount}</Text>
              <Text style={styles.statLabel}>Mastered</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: theme.secondary + '20' }]}>
                <Bookmark size={20} color={theme.secondary} />
              </View>
              <Text style={styles.statValue}>{data.bookmarkedIds.length}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
          </View>

          {/* Proficiency + Skills */}
          <View style={styles.proficiencyCard}>
            <View style={styles.proficiencyHeader}>
              <TrendingUp size={20} color={theme.primary} />
              <Text style={styles.proficiencyTitle}>Overall Proficiency</Text>
            </View>
            <View style={styles.proficiencyContent}>
              <View style={styles.proficiencyRing}>
                <Text style={styles.proficiencyScore}>{overallScore}%</Text>
                <Text style={styles.proficiencyLevel}>{getProficiencyLevel(overallScore)}</Text>
              </View>
              <View style={styles.proficiencyDetails}>
                {SKILL_DEFINITIONS.map(skill => {
                  const userSkill = data.skills[skill.id]
                  const score = userSkill?.score || 0
                  return (
                    <View key={skill.id} style={styles.skillRow}>
                      <Text style={styles.skillLabel}>{skill.name}</Text>
                      <View style={styles.skillBarBg}>
                        <View style={[styles.skillBarFill, { width: `${score}%` }]} />
                      </View>
                      <Text style={styles.skillScore}>{score}%</Text>
                    </View>
                  )
                })}
                {skillEntries.length === 0 && (
                  <Text style={styles.emptyText}>
                    Practice phrases to build skills
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity
              style={styles.assessButton}
              onPress={() => router.push('/assessment/diagnostic')}
            >
              <Text style={styles.assessButtonText}>Take Assessment</Text>
              <ChevronRight size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Mastery Summary */}
          <View style={styles.masteryCard}>
            <Text style={styles.masteryTitle}>Phrase Progress</Text>
            <View style={styles.masteryBar}>
              {masteredCount > 0 && (
                <View style={[styles.masterySegment, { flex: masteredCount, backgroundColor: Colors.success[500] }]} />
              )}
              {practicedCount > 0 && (
                <View style={[styles.masterySegment, { flex: practicedCount, backgroundColor: theme.secondary }]} />
              )}
              {learningCount > 0 && (
                <View style={[styles.masterySegment, { flex: learningCount, backgroundColor: theme.accent }]} />
              )}
              {totalPhrases - (masteredCount + practicedCount + learningCount) > 0 && (
                <View style={[styles.masterySegment, { flex: totalPhrases - (masteredCount + practicedCount + learningCount), backgroundColor: theme.border }]} />
              )}
            </View>
            <View style={styles.masteryLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.success[500] }]} />
                <Text style={styles.legendText}>Mastered ({masteredCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.secondary }]} />
                <Text style={styles.legendText}>Practiced ({practicedCount})</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.accent }]} />
                <Text style={styles.legendText}>Learning ({learningCount})</Text>
              </View>
            </View>
          </View>
        </>
      )}

      {activeSection === 'phrases' && (
        <>
          {trackedPhrases.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {trackedPhrases.length} phrase{trackedPhrases.length !== 1 ? 's' : ''} tracked
              </Text>
              {trackedPhrases.map(phrase => {
                const langOption = LEARNING_LANGUAGES.find(l => l.key === learningLanguage)
                const progressStatus = data.progress[phrase.id]?.status as ProgressStatus | undefined
                const isBookmarked = data.bookmarkedIds.includes(phrase.id)
                const StatusIcon = progressStatus ? getStatusIcon(progressStatus) : null

                return (
                  <TouchableOpacity
                    key={phrase.id}
                    style={styles.phraseCard}
                    onPress={() => router.push(`/phrase/${phrase.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.phraseCardContent}>
                      <View style={styles.phraseTopRow}>
                        <Text style={styles.phraseEnglish}>{phrase.english}</Text>
                        {isBookmarked && <Bookmark size={14} color={theme.primary} />}
                      </View>
                      <View style={styles.phraseTranslationRow}>
                        <Text style={styles.phraseFlag}>{langOption?.flag}</Text>
                        <Text style={styles.phraseTranslation}>{phrase[learningLanguage]}</Text>
                      </View>
                      {progressStatus && (
                        <View style={styles.phraseStatusRow}>
                          {StatusIcon && <StatusIcon size={12} color={getStatusColor(progressStatus)} />}
                          <Text style={[styles.phraseStatusText, { color: getStatusColor(progressStatus) }]}>
                            {progressStatus.charAt(0).toUpperCase() + progressStatus.slice(1)}
                          </Text>
                        </View>
                      )}
                    </View>
                    <ChevronRight size={16} color={theme.textMuted} />
                  </TouchableOpacity>
                )
              })}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Bookmark size={48} color={theme.textMuted} />
              <Text style={styles.emptyStateTitle}>No Phrases Yet</Text>
              <Text style={styles.emptyStateText}>
                Bookmark phrases or start practicing to see them here
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.emptyStateButtonText}>Start Learning</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      padding: 16,
      paddingBottom: 32,
    },
    sectionTabs: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 4,
      marginBottom: 16,
    },
    sectionTab: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    sectionTabActive: {
      backgroundColor: theme.primary,
    },
    sectionTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textMuted,
    },
    sectionTabTextActive: {
      color: '#ffffff',
    },
    // Daily Goal
    dailyGoalCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    dailyGoalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },
    dailyGoalTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.text,
    },
    dailyGoalProgress: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    dailyGoalCount: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.primary,
      minWidth: 36,
    },
    dailyGoalBarBg: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? Colors.neutral[700] : Colors.neutral[200],
      overflow: 'hidden',
    },
    dailyGoalBarFill: {
      height: '100%',
      borderRadius: 4,
    },
    // Stats
    statsGrid: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 12,
      alignItems: 'center',
    },
    statIconBg: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: 11,
      color: theme.textMuted,
      marginTop: 2,
    },
    // Proficiency
    proficiencyCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    proficiencyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    proficiencyTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
    },
    proficiencyContent: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    proficiencyRing: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 6,
      borderColor: theme.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    proficiencyScore: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    proficiencyLevel: {
      fontSize: 10,
      color: theme.primary,
      fontWeight: '600',
    },
    proficiencyDetails: {
      flex: 1,
    },
    skillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    skillLabel: {
      fontSize: 12,
      color: theme.textSecondary,
      width: 85,
    },
    skillBarBg: {
      flex: 1,
      height: 6,
      backgroundColor: theme.border,
      borderRadius: 3,
      overflow: 'hidden',
      marginHorizontal: 8,
    },
    skillBarFill: {
      height: '100%',
      backgroundColor: theme.primary,
      borderRadius: 3,
    },
    skillScore: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
      width: 32,
      textAlign: 'right',
    },
    assessButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    assessButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    // Mastery
    masteryCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    masteryTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    masteryBar: {
      flexDirection: 'row',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 12,
    },
    masterySegment: {
      height: '100%',
    },
    masteryLegend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    // Phrases list
    resultCount: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 12,
    },
    phraseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 8,
    },
    phraseCardContent: {
      flex: 1,
    },
    phraseTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    phraseEnglish: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      flex: 1,
    },
    phraseTranslationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    phraseFlag: {
      fontSize: 14,
    },
    phraseTranslation: {
      fontSize: 14,
      color: theme.primary,
      fontStyle: 'italic',
      flex: 1,
    },
    phraseStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    phraseStatusText: {
      fontSize: 11,
      fontWeight: '600',
    },
    // Empty states
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginTop: 16,
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 8,
      maxWidth: 260,
    },
    emptyStateButton: {
      marginTop: 20,
      backgroundColor: theme.primary,
      paddingHorizontal: 24,
      paddingVertical: 10,
      borderRadius: 8,
    },
    emptyStateButtonText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 13,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
  })
