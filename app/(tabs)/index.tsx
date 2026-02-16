import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { BookOpen, ChevronRight, Bookmark, Search, X, CheckCircle2, Circle, Target, Flame } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { phrases, categories, Phrase } from '@/lib/data/phrases-data'
import { getBookmarks, addBookmark, removeBookmark, getProgress, getStudyStreak } from '@/lib/storage/database'
import { useLearningLanguage, LEARNING_LANGUAGES, LearningLanguage } from '@/lib/hooks/useLearningLanguage'
import { DailyLessonCard } from '@/components/DailyLessonCard'
import { MiniQuiz } from '@/components/MiniQuiz'
import { CelebrationCard } from '@/components/CelebrationCard'

type LearnView = 'lesson' | 'browse'

export default function LearnScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()
  const { learningLanguage, setLearningLanguage, learningLanguageOption } = useLearningLanguage()

  const [activeView, setActiveView] = useState<LearnView>('lesson')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, { status: string; lastPracticed: string }>>({})
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [streak, setStreak] = useState(0)

  // Quiz/Celebration state
  const [quizPhrases, setQuizPhrases] = useState<Phrase[] | null>(null)
  const [celebration, setCelebration] = useState<{ type: 'daily-goal' | 'quiz-complete'; score?: number; total?: number } | null>(null)

  const loadData = useCallback(async () => {
    const [bookmarks, progressData, studyStreak] = await Promise.all([
      getBookmarks(),
      getProgress(),
      getStudyStreak(),
    ])
    setBookmarkedIds(bookmarks)
    setProgress(progressData)
    setStreak(studyStreak)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }, [loadData])

  const toggleBookmark = async (phraseId: string) => {
    if (bookmarkedIds.includes(phraseId)) {
      await removeBookmark(phraseId)
      setBookmarkedIds(prev => prev.filter(id => id !== phraseId))
    } else {
      await addBookmark(phraseId)
      setBookmarkedIds(prev => [...prev, phraseId])
    }
  }

  const handleStartQuiz = (lessonPhrases: Phrase[]) => {
    setQuizPhrases(lessonPhrases)
  }

  const handleQuizComplete = (score: number, total: number, justCompletedGoal: boolean) => {
    setQuizPhrases(null)
    if (justCompletedGoal) {
      setCelebration({ type: 'daily-goal' })
    } else {
      setCelebration({ type: 'quiz-complete', score, total })
    }
  }

  const handlePracticeWithShamwari = (phrasesToPractice?: Phrase[]) => {
    setCelebration(null)
    setQuizPhrases(null)
    if (phrasesToPractice && phrasesToPractice.length > 0) {
      router.push({
        pathname: '/(tabs)/ai-practice',
        params: { phraseContext: phrasesToPractice.map(p => p.english).join(', ') },
      })
    } else {
      router.push('/(tabs)/ai-practice')
    }
  }

  const handleDismissCelebration = () => {
    setCelebration(null)
    loadData()
  }

  const filteredPhrases = phrases.filter(p => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    if (!searchQuery.trim()) return matchesCategory

    const query = searchQuery.toLowerCase()
    const matchesSearch =
      p.english.toLowerCase().includes(query) ||
      p[learningLanguage].toLowerCase().includes(query) ||
      p.shona.toLowerCase().includes(query) ||
      p.ndebele.toLowerCase().includes(query) ||
      p.swahili.toLowerCase().includes(query) ||
      p.chinese.toLowerCase().includes(query)

    return matchesCategory && matchesSearch
  })

  const styles = createStyles(theme, isDark)

  // If quiz is active, show quiz
  if (quizPhrases) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.quizContainer}>
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setQuizPhrases(null)}>
            <X size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.quizHeaderTitle}>Practice Quiz</Text>
          <View style={{ width: 24 }} />
        </View>
        <MiniQuiz
          phrases={quizPhrases}
          onComplete={handleQuizComplete}
          onPracticeWithShamwari={(p) => handlePracticeWithShamwari(p)}
        />
      </ScrollView>
    )
  }

  // If celebration is active, show it
  if (celebration) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.celebrationContainer}>
        <CelebrationCard
          type={celebration.type}
          score={celebration.score}
          total={celebration.total}
          streak={streak}
          onContinue={handleDismissCelebration}
          onPracticeWithShamwari={() => handlePracticeWithShamwari()}
          onDismiss={handleDismissCelebration}
        />
      </ScrollView>
    )
  }

  return (
    <View style={styles.container}>
      {/* Streak Banner */}
      {streak > 1 && (
        <View style={styles.streakBanner}>
          <Flame size={16} color={Colors.accent[isDark ? 300 : 800]} />
          <Text style={styles.streakBannerText}>{streak} day streak! Keep it going!</Text>
        </View>
      )}

      {/* View Toggle: Lesson / Browse */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.viewToggleItem, activeView === 'lesson' && styles.viewToggleItemActive]}
          onPress={() => setActiveView('lesson')}
        >
          <Text style={[styles.viewToggleText, activeView === 'lesson' && styles.viewToggleTextActive]}>
            Today's Lesson
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewToggleItem, activeView === 'browse' && styles.viewToggleItemActive]}
          onPress={() => setActiveView('browse')}
        >
          <Text style={[styles.viewToggleText, activeView === 'browse' && styles.viewToggleTextActive]}>
            Browse All
          </Text>
        </TouchableOpacity>
      </View>

      {activeView === 'lesson' ? (
        <ScrollView
          style={styles.lessonScroll}
          contentContainerStyle={styles.lessonContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Daily Lesson Card */}
          <DailyLessonCard
            onStartQuiz={handleStartQuiz}
          />

          {/* Language Selector */}
          <View style={styles.languageSectionCard}>
            <Text style={styles.languageSectionLabel}>I'm learning:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languageContent}
            >
              {LEARNING_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.key}
                  style={[
                    styles.languagePill,
                    learningLanguage === lang.key && styles.languagePillActive,
                  ]}
                  onPress={() => setLearningLanguage(lang.key)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageText,
                      learningLanguage === lang.key && styles.languageTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      ) : (
        <>
          {/* Browse View: Search + Categories + Phrase List */}
          {/* Language Selector */}
          <View style={styles.languageSection}>
            <Text style={styles.languageSectionLabel}>I'm learning:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.languageContent}
            >
              {LEARNING_LANGUAGES.map(lang => (
                <TouchableOpacity
                  key={lang.key}
                  style={[
                    styles.languagePill,
                    learningLanguage === lang.key && styles.languagePillActive,
                  ]}
                  onPress={() => setLearningLanguage(lang.key)}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text
                    style={[
                      styles.languageText,
                      learningLanguage === lang.key && styles.languageTextActive,
                    ]}
                  >
                    {lang.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            {showSearch ? (
              <View style={styles.searchBar}>
                <Search size={18} color={theme.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={`Search phrases in ${learningLanguageOption.name}...`}
                  placeholderTextColor={theme.textMuted}
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('')
                    setShowSearch(false)
                  }}
                >
                  <X size={18} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.searchButton} onPress={() => setShowSearch(true)}>
                <Search size={18} color={theme.textMuted} />
                <Text style={styles.searchButtonText}>Search phrases...</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Category Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            <TouchableOpacity
              style={[
                styles.categoryPill,
                !selectedCategory && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryText,
                  !selectedCategory && styles.categoryTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryPill,
                  selectedCategory === cat.id && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === cat.id && styles.categoryTextActive,
                  ]}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Phrase List */}
          <FlatList
            data={filteredPhrases}
            keyExtractor={item => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <PhraseCard
                phrase={item}
                theme={theme}
                learningLanguage={learningLanguage}
                isBookmarked={bookmarkedIds.includes(item.id)}
                progressStatus={progress[item.id]?.status as 'learning' | 'practiced' | 'mastered' | undefined}
                onToggleBookmark={() => toggleBookmark(item.id)}
                onPress={() => router.push(`/phrase/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <BookOpen size={48} color={theme.textMuted} />
                <Text style={styles.emptyText}>
                  {searchQuery ? 'No phrases match your search' : 'No phrases found'}
                </Text>
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={styles.emptyAction}>Clear search</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            }
          />
        </>
      )}
    </View>
  )
}

interface PhraseCardProps {
  phrase: Phrase
  theme: typeof lightTheme
  learningLanguage: LearningLanguage
  isBookmarked: boolean
  progressStatus?: 'learning' | 'practiced' | 'mastered'
  onToggleBookmark: () => void
  onPress: () => void
}

function getStatusColor(status: string, theme: typeof lightTheme) {
  switch (status) {
    case 'mastered': return Colors.success[500]
    case 'practiced': return theme.secondary
    case 'learning': return theme.accent
    default: return Colors.neutral[400]
  }
}

function PhraseCard({
  phrase,
  theme,
  learningLanguage,
  isBookmarked,
  progressStatus,
  onToggleBookmark,
  onPress,
}: PhraseCardProps) {
  const styles = createStyles(theme, false)
  const langOption = LEARNING_LANGUAGES.find(l => l.key === learningLanguage)

  const StatusIcon = progressStatus === 'mastered' ? CheckCircle2
    : progressStatus === 'practiced' ? Target
    : progressStatus === 'learning' ? Circle
    : null

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLanguages}>
          <Text style={styles.cardEnglish}>{phrase.english}</Text>
          <View style={styles.translationRow}>
            <Text style={styles.translationFlag}>{langOption?.flag}</Text>
            <Text style={styles.cardTranslation}>{phrase[learningLanguage]}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onToggleBookmark}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark
            size={20}
            color={isBookmarked ? theme.accent : theme.textMuted}
            fill={isBookmarked ? theme.accent : 'transparent'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.cardFooterLeft}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {categories.find(c => c.id === phrase.category)?.name || phrase.category}
            </Text>
          </View>
          {progressStatus && StatusIcon && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(progressStatus, theme) + '20' }]}>
              <StatusIcon size={12} color={getStatusColor(progressStatus, theme)} />
              <Text style={[styles.statusBadgeText, { color: getStatusColor(progressStatus, theme) }]}>
                {progressStatus.charAt(0).toUpperCase() + progressStatus.slice(1)}
              </Text>
            </View>
          )}
        </View>
        <ChevronRight size={16} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    // Streak banner
    streakBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: isDark ? Colors.accent[300] + '15' : Colors.accent[800] + '10',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? Colors.accent[300] + '20' : Colors.accent[800] + '15',
    },
    streakBannerText: {
      fontSize: 13,
      fontWeight: '600',
      color: Colors.accent[isDark ? 300 : 800],
    },
    // View toggle
    viewToggle: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      margin: 16,
      marginBottom: 0,
      borderRadius: 12,
      padding: 4,
    },
    viewToggleItem: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
    },
    viewToggleItemActive: {
      backgroundColor: theme.primary,
    },
    viewToggleText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textMuted,
    },
    viewToggleTextActive: {
      color: '#ffffff',
    },
    // Lesson view
    lessonScroll: {
      flex: 1,
    },
    lessonContent: {
      paddingTop: 16,
      paddingBottom: 32,
    },
    // Language selector (card variant for lesson view)
    languageSectionCard: {
      marginHorizontal: 16,
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    // Quiz/Celebration containers
    quizContainer: {
      paddingTop: 16,
      paddingBottom: 32,
    },
    quizHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    quizHeaderTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    celebrationContainer: {
      flex: 1,
      justifyContent: 'center',
      paddingBottom: 32,
    },
    // Browse view styles (same as before)
    languageSection: {
      backgroundColor: theme.card,
      paddingTop: 12,
      paddingBottom: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    languageSectionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      marginBottom: 8,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    languageContent: {
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 4,
    },
    languagePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    languagePillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    languageFlag: {
      fontSize: 16,
    },
    languageText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    languageTextActive: {
      color: '#ffffff',
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 2,
    },
    searchButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchButtonText: {
      fontSize: 15,
      color: theme.textMuted,
    },
    categoryScroll: {
      minHeight: 60,
      maxHeight: 68,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryContent: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 8,
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
      minHeight: 40,
    },
    categoryPillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryIcon: {
      fontSize: 16,
      lineHeight: 20,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
      lineHeight: 20,
    },
    categoryTextActive: {
      color: '#ffffff',
    },
    listContent: {
      padding: 16,
      gap: 12,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    cardLanguages: {
      flex: 1,
      marginRight: 12,
    },
    cardEnglish: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 6,
    },
    translationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    translationFlag: {
      fontSize: 14,
    },
    cardTranslation: {
      fontSize: 15,
      color: theme.primary,
      fontStyle: 'italic',
      flex: 1,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardFooterLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      gap: 4,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
    },
    categoryBadge: {
      backgroundColor: theme.secondary + '20',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryBadgeText: {
      fontSize: 12,
      fontWeight: '500',
      color: Colors.secondary[600],
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.textMuted,
    },
    emptyAction: {
      marginTop: 8,
      fontSize: 14,
      color: theme.primary,
      fontWeight: '600',
    },
  })
