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
  Clock,
  Award,
  ChevronRight,
  Flame,
  BookOpen,
  CheckCircle2,
  Circle,
  Target,
  BarChart3,
} from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import {
  getBookmarks,
  getProgress,
  getUserSkills,
  getStudyStreak,
  getStudySessions,
} from '@/lib/storage/database'
import { phrases, categories } from '@/lib/data/phrases-data'
import { useLearningLanguage, LEARNING_LANGUAGES } from '@/lib/hooks/useLearningLanguage'

type ProgressStatus = 'learning' | 'practiced' | 'mastered'

interface InsightsData {
  bookmarkedIds: string[]
  progress: Record<string, { status: string; lastPracticed: string }>
  skills: Record<string, { score: number; lastAssessed: string }>
  streak: number
  sessions: Array<{ date: string; phrasesPracticed: number; durationMinutes: number }>
}

export default function InsightsScreen() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const router = useRouter()
  const { learningLanguage, learningLanguageOption } = useLearningLanguage()

  const [data, setData] = useState<InsightsData>({
    bookmarkedIds: [],
    progress: {},
    skills: {},
    streak: 0,
    sessions: [],
  })
  const [refreshing, setRefreshing] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'bookmarks' | 'progress'>('overview')

  const loadData = useCallback(async () => {
    const [bookmarkedIds, progress, skills, streak, sessions] = await Promise.all([
      getBookmarks(),
      getProgress(),
      getUserSkills(),
      getStudyStreak(),
      getStudySessions(),
    ])
    setData({ bookmarkedIds, progress, skills, streak, sessions })
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
  const totalTracked = progressEntries.length

  const totalMinutes = data.sessions.reduce((sum, s) => sum + s.durationMinutes, 0)
  const totalHours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

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

  // Get bookmarked phrases
  const bookmarkedPhrases = phrases.filter(p => data.bookmarkedIds.includes(p.id))

  // Get recent activity (last 7 days sessions)
  const recentSessions = data.sessions
    .slice(-7)
    .reverse()

  // Category breakdown
  const categoryBreakdown = categories.map(cat => {
    const catPhrases = phrases.filter(p => p.category === cat.id)
    const catProgress = catPhrases.filter(p => data.progress[p.id])
    const catMastered = catPhrases.filter(p => data.progress[p.id]?.status === 'mastered')
    return {
      ...cat,
      total: catPhrases.length,
      practiced: catProgress.length,
      mastered: catMastered.length,
      percentage: catPhrases.length > 0
        ? Math.round((catProgress.length / catPhrases.length) * 100)
        : 0,
    }
  }).sort((a, b) => b.percentage - a.percentage)

  const styles = createStyles(theme)

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Section Tabs */}
      <View style={styles.sectionTabs}>
        {(['overview', 'bookmarks', 'progress'] as const).map(section => (
          <TouchableOpacity
            key={section}
            style={[styles.sectionTab, activeSection === section && styles.sectionTabActive]}
            onPress={() => setActiveSection(section)}
          >
            <Text style={[
              styles.sectionTabText,
              activeSection === section && styles.sectionTabTextActive,
            ]}>
              {section === 'overview' ? 'Overview' : section === 'bookmarks' ? 'Bookmarks' : 'Progress'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeSection === 'overview' && (
        <>
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
              <Text style={styles.statLabel}>Bookmarks</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: theme.primary + '20' }]}>
                <Clock size={20} color={theme.primary} />
              </View>
              <Text style={styles.statValue}>
                {totalHours > 0 ? `${totalHours}h` : `${totalMinutes}m`}
              </Text>
              <Text style={styles.statLabel}>Study Time</Text>
            </View>
          </View>

          {/* Proficiency Card */}
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
                {skillEntries.length > 0 ? skillEntries.map(([name, skill]) => (
                  <View key={name} style={styles.skillRow}>
                    <Text style={styles.skillLabel}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Text>
                    <View style={styles.skillBarBg}>
                      <View
                        style={[styles.skillBarFill, { width: `${skill.score}%` }]}
                      />
                    </View>
                    <Text style={styles.skillScore}>{skill.score}%</Text>
                  </View>
                )) : (
                  <Text style={styles.emptyText}>
                    Take an assessment to see your skill levels
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

          {/* Phrase Mastery Breakdown */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <BarChart3 size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>Phrase Mastery</Text>
            </View>

            {/* Progress Summary Bar */}
            <View style={styles.masteryBar}>
              {masteredCount > 0 && (
                <View style={[
                  styles.masterySegment,
                  { flex: masteredCount, backgroundColor: Colors.success[500] },
                ]} />
              )}
              {practicedCount > 0 && (
                <View style={[
                  styles.masterySegment,
                  { flex: practicedCount, backgroundColor: theme.secondary },
                ]} />
              )}
              {learningCount > 0 && (
                <View style={[
                  styles.masterySegment,
                  { flex: learningCount, backgroundColor: theme.accent },
                ]} />
              )}
              {totalPhrases - totalTracked > 0 && (
                <View style={[
                  styles.masterySegment,
                  { flex: totalPhrases - totalTracked, backgroundColor: theme.border },
                ]} />
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
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: theme.border }]} />
                <Text style={styles.legendText}>New ({totalPhrases - totalTracked})</Text>
              </View>
            </View>
          </View>

          {/* Category Breakdown */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color={theme.primary} />
              <Text style={styles.sectionTitle}>By Category</Text>
            </View>
            {categoryBreakdown.map(cat => (
              <View key={cat.id} style={styles.categoryRow}>
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.name}</Text>
                  <View style={styles.categoryBarBg}>
                    <View
                      style={[styles.categoryBarFill, { width: `${cat.percentage}%` }]}
                    />
                  </View>
                </View>
                <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          {recentSessions.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Clock size={20} color={theme.primary} />
                <Text style={styles.sectionTitle}>Recent Activity</Text>
              </View>
              {recentSessions.map((session, idx) => {
                const sessionDate = new Date(session.date)
                const isToday = session.date === new Date().toISOString().split('T')[0]
                return (
                  <View key={idx} style={styles.activityRow}>
                    <View style={styles.activityDot} />
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityDate}>
                        {isToday ? 'Today' : sessionDate.toLocaleDateString('en-US', {
                          weekday: 'short', month: 'short', day: 'numeric',
                        })}
                      </Text>
                      <Text style={styles.activityDetail}>
                        {session.phrasesPracticed} phrases &middot; {session.durationMinutes} min
                      </Text>
                    </View>
                  </View>
                )
              })}
            </View>
          )}
        </>
      )}

      {activeSection === 'bookmarks' && (
        <>
          {bookmarkedPhrases.length > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {bookmarkedPhrases.length} bookmarked phrase{bookmarkedPhrases.length !== 1 ? 's' : ''}
              </Text>
              {bookmarkedPhrases.map(phrase => {
                const langOption = LEARNING_LANGUAGES.find(l => l.key === learningLanguage)
                const progressStatus = data.progress[phrase.id]?.status as ProgressStatus | undefined
                const StatusIcon = progressStatus ? getStatusIcon(progressStatus) : null

                return (
                  <TouchableOpacity
                    key={phrase.id}
                    style={styles.phraseCard}
                    onPress={() => router.push(`/phrase/${phrase.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.phraseCardContent}>
                      <Text style={styles.phraseEnglish}>{phrase.english}</Text>
                      <View style={styles.phraseTranslationRow}>
                        <Text style={styles.phraseFlag}>{langOption?.flag}</Text>
                        <Text style={styles.phraseTranslation}>
                          {phrase[learningLanguage]}
                        </Text>
                      </View>
                      {progressStatus && (
                        <View style={styles.phraseStatusRow}>
                          {StatusIcon && (
                            <StatusIcon size={12} color={getStatusColor(progressStatus)} />
                          )}
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
              <Text style={styles.emptyStateTitle}>No Bookmarks Yet</Text>
              <Text style={styles.emptyStateText}>
                Bookmark phrases while learning to review them here
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.emptyStateButtonText}>Browse Phrases</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {activeSection === 'progress' && (
        <>
          {totalTracked > 0 ? (
            <>
              <Text style={styles.resultCount}>
                {totalTracked} of {totalPhrases} phrases tracked
              </Text>

              {/* Mastered phrases */}
              {masteredCount > 0 && (
                <View style={styles.progressGroup}>
                  <View style={styles.progressGroupHeader}>
                    <CheckCircle2 size={16} color={Colors.success[500]} />
                    <Text style={[styles.progressGroupTitle, { color: Colors.success[500] }]}>
                      Mastered ({masteredCount})
                    </Text>
                  </View>
                  {progressEntries
                    .filter(([, v]) => v.status === 'mastered')
                    .map(([id]) => {
                      const phrase = phrases.find(p => p.id === id)
                      if (!phrase) return null
                      return (
                        <TouchableOpacity
                          key={id}
                          style={styles.progressPhraseRow}
                          onPress={() => router.push(`/phrase/${id}`)}
                        >
                          <Text style={styles.progressPhraseText} numberOfLines={1}>
                            {phrase.english}
                          </Text>
                          <ChevronRight size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                      )
                    })}
                </View>
              )}

              {/* Practiced phrases */}
              {practicedCount > 0 && (
                <View style={styles.progressGroup}>
                  <View style={styles.progressGroupHeader}>
                    <Target size={16} color={theme.secondary} />
                    <Text style={[styles.progressGroupTitle, { color: theme.secondary }]}>
                      Practiced ({practicedCount})
                    </Text>
                  </View>
                  {progressEntries
                    .filter(([, v]) => v.status === 'practiced')
                    .map(([id]) => {
                      const phrase = phrases.find(p => p.id === id)
                      if (!phrase) return null
                      return (
                        <TouchableOpacity
                          key={id}
                          style={styles.progressPhraseRow}
                          onPress={() => router.push(`/phrase/${id}`)}
                        >
                          <Text style={styles.progressPhraseText} numberOfLines={1}>
                            {phrase.english}
                          </Text>
                          <ChevronRight size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                      )
                    })}
                </View>
              )}

              {/* Learning phrases */}
              {learningCount > 0 && (
                <View style={styles.progressGroup}>
                  <View style={styles.progressGroupHeader}>
                    <Circle size={16} color={theme.accent} />
                    <Text style={[styles.progressGroupTitle, { color: theme.accent }]}>
                      Learning ({learningCount})
                    </Text>
                  </View>
                  {progressEntries
                    .filter(([, v]) => v.status === 'learning')
                    .map(([id]) => {
                      const phrase = phrases.find(p => p.id === id)
                      if (!phrase) return null
                      return (
                        <TouchableOpacity
                          key={id}
                          style={styles.progressPhraseRow}
                          onPress={() => router.push(`/phrase/${id}`)}
                        >
                          <Text style={styles.progressPhraseText} numberOfLines={1}>
                            {phrase.english}
                          </Text>
                          <ChevronRight size={14} color={theme.textMuted} />
                        </TouchableOpacity>
                      )
                    })}
                </View>
              )}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Target size={48} color={theme.textMuted} />
              <Text style={styles.emptyStateTitle}>No Progress Yet</Text>
              <Text style={styles.emptyStateText}>
                Start practicing phrases to track your progress here
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

const createStyles = (theme: typeof lightTheme) =>
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
    sectionCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
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
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryIcon: {
      fontSize: 18,
      marginRight: 10,
    },
    categoryInfo: {
      flex: 1,
    },
    categoryName: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      marginBottom: 4,
    },
    categoryBarBg: {
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      overflow: 'hidden',
    },
    categoryBarFill: {
      height: '100%',
      backgroundColor: Colors.success[500],
      borderRadius: 2,
    },
    categoryPercent: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginLeft: 8,
      width: 35,
      textAlign: 'right',
    },
    activityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    activityDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.primary,
      marginRight: 12,
    },
    activityInfo: {
      flex: 1,
    },
    activityDate: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    activityDetail: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    // Bookmarks & Progress
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
    phraseEnglish: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
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
    // Progress groups
    progressGroup: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
    },
    progressGroupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    progressGroupTitle: {
      fontSize: 14,
      fontWeight: '700',
    },
    progressPhraseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    progressPhraseText: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
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
