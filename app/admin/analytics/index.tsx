import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native'
import { Stack } from 'expo-router'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Target,
  Clock,
  BarChart3,
  Brain,
  MessageCircle,
  BookOpen,
  Activity,
  AlertTriangle,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { analyticsApi } from '@/lib/services/api-client'

// =============================================================================
// Types
// =============================================================================

interface OverviewData {
  runtime: string
  growth: {
    total_users: number
    active_users_7d: number
    new_users_this_week: number
    new_users_last_week: number
    growth_rate_pct: number
  }
  content: {
    total_phrases: number
    total_bookmarks: number
    total_views: number
    pending_moderation: number
  }
  daily_activity: Array<{
    date: string
    sessions: number
    phrases_studied: number
    total_minutes: number
    unique_users: number
  }>
  user_funnel: {
    total: number
    started_learning: number
    bookmarked_phrases: number
    took_assessment: number
    mastered_any: number
  }
}

interface VelocityData {
  mastery_distribution: Array<{
    status: string
    count: number
    user_count: number
  }>
  time_to_mastery: {
    avg_days_to_master: number
    avg_practices_to_master: number
    total_mastered: number
  }
  daily_velocity: Array<{
    date: string
    phrases_practiced: number
    phrases_mastered: number
    unique_learners: number
  }>
  top_phrases: Array<{
    english: string
    mastery_rate: number
    total: number
  }>
}

interface SkillData {
  overall: {
    avg_proficiency: number
    unique_users_with_skills: number
  }
  skills: Array<{
    skill_name: string
    avg_score: number
    total_learners: number
    level_distribution: Record<string, number>
  }>
  assessment_performance: Array<{
    skill_name: string
    total_attempts: number
    pass_rate: number
    avg_score: number
  }>
}

interface EngagementData {
  retention_cohorts: Array<{
    week: string
    cohort_size: number
    retention_1d_pct: number
    retention_7d_pct: number
    retention_30d_pct: number
  }>
  session_distribution: Array<{
    range: string
    count: number
    avg_phrases: number
  }>
  popular_categories: Array<{
    category: string
    views: number
    unique_viewers: number
  }>
  ai_usage: {
    total_conversations: number
    conversations_30d: number
    by_type: Array<{ type: string; count: number }>
    by_language: Array<{ language: string; count: number }>
  }
}

// =============================================================================
// Component
// =============================================================================

export default function AnalyticsScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()
  const isTablet = width >= 768

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [velocity, setVelocity] = useState<VelocityData | null>(null)
  const [skills, setSkills] = useState<SkillData | null>(null)
  const [engagement, setEngagement] = useState<EngagementData | null>(null)

  const fetchAll = useCallback(async () => {
    try {
      setError(null)

      // Fetch all analytics endpoints in parallel
      const [overviewRes, velocityRes, skillsRes, engagementRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getLearningVelocity(),
        analyticsApi.getSkillDistribution(),
        analyticsApi.getEngagement(),
      ])

      if (overviewRes.data) setOverview(overviewRes.data)
      if (velocityRes.data) setVelocity(velocityRes.data)
      if (skillsRes.data) setSkills(skillsRes.data)
      if (engagementRes.data) setEngagement(engagementRes.data)

      if (overviewRes.error && velocityRes.error && skillsRes.error && engagementRes.error) {
        setError('Failed to load analytics. Check API connection.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAll()
  }, [fetchAll])

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Analytics (Python)' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={Colors.accent[600]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading analytics...
          </Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Analytics (Python)' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Python Runtime Badge */}
        <View style={styles.runtimeBadge}>
          <Zap size={14} color="#f59e0b" />
          <Text style={styles.runtimeText}>
            Powered by Python + pymongo aggregation pipelines
          </Text>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* ============================================================= */}
        {/* SECTION 1: Growth Overview */}
        {/* ============================================================= */}
        {overview && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Growth Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard
                theme={theme}
                styles={styles}
                icon={Users}
                iconColor={Colors.primary[600]}
                label="Total Users"
                value={overview.growth.total_users}
              />
              <StatCard
                theme={theme}
                styles={styles}
                icon={Activity}
                iconColor={Colors.accent[600]}
                label="Active (7d)"
                value={overview.growth.active_users_7d}
              />
              <StatCard
                theme={theme}
                styles={styles}
                icon={
                  overview.growth.growth_rate_pct >= 0 ? TrendingUp : TrendingDown
                }
                iconColor={
                  overview.growth.growth_rate_pct >= 0 ? '#22c55e' : '#ef4444'
                }
                label="Growth Rate"
                value={`${overview.growth.growth_rate_pct > 0 ? '+' : ''}${overview.growth.growth_rate_pct}%`}
              />
              <StatCard
                theme={theme}
                styles={styles}
                icon={BookOpen}
                iconColor={Colors.secondary[700]}
                label="Phrases"
                value={overview.content.total_phrases}
              />
            </View>
          </View>
        )}

        {/* ============================================================= */}
        {/* SECTION 2: User Funnel */}
        {/* ============================================================= */}
        {overview?.user_funnel && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Funnel</Text>
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <FunnelBar
                theme={theme}
                label="Signed Up"
                value={overview.user_funnel.total}
                max={overview.user_funnel.total}
                color={Colors.primary[600]}
              />
              <FunnelBar
                theme={theme}
                label="Started Learning"
                value={overview.user_funnel.started_learning}
                max={overview.user_funnel.total}
                color={Colors.accent[600]}
              />
              <FunnelBar
                theme={theme}
                label="Bookmarked Phrases"
                value={overview.user_funnel.bookmarked_phrases}
                max={overview.user_funnel.total}
                color={Colors.secondary[500]}
              />
              <FunnelBar
                theme={theme}
                label="Took Assessment"
                value={overview.user_funnel.took_assessment}
                max={overview.user_funnel.total}
                color="#f59e0b"
              />
              <FunnelBar
                theme={theme}
                label="Mastered Phrases"
                value={overview.user_funnel.mastered_any}
                max={overview.user_funnel.total}
                color="#22c55e"
              />
            </View>
          </View>
        )}

        {/* ============================================================= */}
        {/* SECTION 3: Learning Velocity */}
        {/* ============================================================= */}
        {velocity && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Velocity</Text>

            {/* Mastery KPIs */}
            <View style={styles.statsGrid}>
              <StatCard
                theme={theme}
                styles={styles}
                icon={Target}
                iconColor="#22c55e"
                label="Total Mastered"
                value={velocity.time_to_mastery.total_mastered}
              />
              <StatCard
                theme={theme}
                styles={styles}
                icon={Clock}
                iconColor={Colors.accent[600]}
                label="Avg Days to Master"
                value={velocity.time_to_mastery.avg_days_to_master}
              />
              <StatCard
                theme={theme}
                styles={styles}
                icon={Zap}
                iconColor="#f59e0b"
                label="Avg Practices"
                value={velocity.time_to_mastery.avg_practices_to_master}
              />
            </View>

            {/* Mastery Distribution */}
            <View style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                Phrase Status Distribution
              </Text>
              {velocity.mastery_distribution.map((item, i) => (
                <View key={i} style={styles.distributionRow}>
                  <View style={styles.distributionLabel}>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            item.status === 'mastered'
                              ? '#22c55e'
                              : item.status === 'practiced'
                              ? '#f59e0b'
                              : Colors.primary[600],
                        },
                      ]}
                    />
                    <Text style={[styles.distributionText, { color: theme.text }]}>
                      {item.status || 'unknown'}
                    </Text>
                  </View>
                  <Text style={[styles.distributionValue, { color: theme.textSecondary }]}>
                    {item.count} ({item.user_count} users)
                  </Text>
                </View>
              ))}
            </View>

            {/* Top Phrases */}
            {velocity.top_phrases.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Top Phrases by Mastery Rate
                </Text>
                {velocity.top_phrases.slice(0, 5).map((phrase, i) => (
                  <View key={i} style={styles.phraseRow}>
                    <Text
                      style={[styles.phraseText, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {phrase.english}
                    </Text>
                    <View style={styles.phraseStats}>
                      <Text style={[styles.phraseRate, { color: '#22c55e' }]}>
                        {phrase.mastery_rate}%
                      </Text>
                      <Text style={[styles.phraseAttempts, { color: theme.textSecondary }]}>
                        ({phrase.total} attempts)
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ============================================================= */}
        {/* SECTION 4: Skill Distribution */}
        {/* ============================================================= */}
        {skills && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skill Distribution</Text>

            <View style={styles.statsGrid}>
              <StatCard
                theme={theme}
                styles={styles}
                icon={BarChart3}
                iconColor={Colors.accent[600]}
                label="Avg Proficiency"
                value={skills.overall.avg_proficiency}
              />
              <StatCard
                theme={theme}
                styles={styles}
                icon={Users}
                iconColor={Colors.secondary[700]}
                label="With Skills"
                value={skills.overall.unique_users_with_skills}
              />
            </View>

            {/* Per-Skill Breakdown */}
            {skills.skills.map((skill, i) => (
              <View
                key={i}
                style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}
              >
                <View style={styles.skillHeader}>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>
                    {skill.skill_name || 'Unknown Skill'}
                  </Text>
                  <Text style={[styles.skillScore, { color: Colors.accent[600] }]}>
                    {skill.avg_score}/100
                  </Text>
                </View>

                {/* Score Bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(skill.avg_score, 100)}%`,
                        backgroundColor: Colors.accent[600],
                      },
                    ]}
                  />
                </View>

                <Text style={[styles.skillMeta, { color: theme.textSecondary }]}>
                  {skill.total_learners} learners
                  {skill.level_distribution &&
                    Object.entries(skill.level_distribution)
                      .map(([level, count]) => `${level}: ${count}`)
                      .join(' | ')}
                </Text>
              </View>
            ))}

            {/* Assessment Pass Rates */}
            {skills.assessment_performance.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Assessment Pass Rates
                </Text>
                {skills.assessment_performance.map((ap, i) => (
                  <View key={i} style={styles.assessmentRow}>
                    <Text style={[styles.assessmentSkill, { color: theme.text }]}>
                      {ap.skill_name || 'Unknown'}
                    </Text>
                    <View style={styles.assessmentStats}>
                      <Text
                        style={[
                          styles.assessmentRate,
                          { color: ap.pass_rate >= 70 ? '#22c55e' : '#ef4444' },
                        ]}
                      >
                        {ap.pass_rate}% pass
                      </Text>
                      <Text style={[styles.assessmentAttempts, { color: theme.textSecondary }]}>
                        {ap.total_attempts} attempts
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ============================================================= */}
        {/* SECTION 5: Engagement */}
        {/* ============================================================= */}
        {engagement && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Engagement</Text>

            {/* AI Usage */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
              <View style={styles.aiHeader}>
                <Brain size={20} color={Colors.accent[600]} />
                <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 0 }]}>
                  Shamwari AI Usage
                </Text>
              </View>
              <View style={styles.aiStats}>
                <View style={styles.aiStatItem}>
                  <Text style={[styles.aiStatValue, { color: theme.text }]}>
                    {engagement.ai_usage.total_conversations}
                  </Text>
                  <Text style={[styles.aiStatLabel, { color: theme.textSecondary }]}>
                    Total Chats
                  </Text>
                </View>
                <View style={styles.aiStatItem}>
                  <Text style={[styles.aiStatValue, { color: theme.text }]}>
                    {engagement.ai_usage.conversations_30d}
                  </Text>
                  <Text style={[styles.aiStatLabel, { color: theme.textSecondary }]}>
                    Last 30 Days
                  </Text>
                </View>
              </View>
              {engagement.ai_usage.by_language.length > 0 && (
                <View style={styles.aiLanguages}>
                  {engagement.ai_usage.by_language.map((lang, i) => (
                    <View key={i} style={styles.langBadge}>
                      <MessageCircle size={12} color={Colors.accent[600]} />
                      <Text style={[styles.langText, { color: theme.text }]}>
                        {lang.language}: {lang.count}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Popular Categories */}
            {engagement.popular_categories.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Popular Categories (30d)
                </Text>
                {engagement.popular_categories.slice(0, 5).map((cat, i) => (
                  <View key={i} style={styles.categoryRow}>
                    <Text style={[styles.categoryName, { color: theme.text }]}>
                      {cat.category}
                    </Text>
                    <Text style={[styles.categoryViews, { color: theme.textSecondary }]}>
                      {cat.views} views ({cat.unique_viewers} viewers)
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Session Duration */}
            {engagement.session_distribution.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Session Duration Distribution
                </Text>
                {engagement.session_distribution.map((session, i) => (
                  <View key={i} style={styles.sessionRow}>
                    <Text style={[styles.sessionRange, { color: theme.text }]}>
                      {session.range}
                    </Text>
                    <Text style={[styles.sessionCount, { color: theme.textSecondary }]}>
                      {session.count} sessions ({session.avg_phrases} avg phrases)
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Retention Cohorts */}
            {engagement.retention_cohorts.length > 0 && (
              <View style={[styles.card, { backgroundColor: theme.card, marginTop: 12 }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Weekly Retention Cohorts
                </Text>
                {engagement.retention_cohorts.map((cohort, i) => (
                  <View key={i} style={styles.cohortRow}>
                    <Text style={[styles.cohortWeek, { color: theme.text }]}>
                      {cohort.week} ({cohort.cohort_size})
                    </Text>
                    <View style={styles.cohortBadges}>
                      <RetentionBadge label="1d" value={cohort.retention_1d_pct} />
                      <RetentionBadge label="7d" value={cohort.retention_7d_pct} />
                      <RetentionBadge label="30d" value={cohort.retention_30d_pct} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </>
  )
}

// =============================================================================
// Sub-components
// =============================================================================

function StatCard({
  theme,
  styles,
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  theme: any
  styles: any
  icon: any
  iconColor: string
  label: string
  value: string | number
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.card }]}>
      <View style={[styles.statIcon, { backgroundColor: iconColor + '20' }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{label}</Text>
    </View>
  )
}

function FunnelBar({
  theme,
  label,
  value,
  max,
  color,
}: {
  theme: any
  label: string
  value: number
  max: number
  color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 13, color: theme.text }}>{label}</Text>
        <Text style={{ fontSize: 13, color: theme.textSecondary }}>
          {value} ({pct.toFixed(0)}%)
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: theme.border,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: '100%',
            width: `${pct}%`,
            backgroundColor: color,
            borderRadius: 4,
          }}
        />
      </View>
    </View>
  )
}

function RetentionBadge({ label, value }: { label: string; value: number }) {
  const color = value >= 50 ? '#22c55e' : value >= 25 ? '#f59e0b' : '#ef4444'
  return (
    <View
      style={{
        backgroundColor: color + '20',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
      }}
    >
      <Text style={{ fontSize: 11, color, fontWeight: '600' }}>
        {label}: {value}%
      </Text>
    </View>
  )
}

// =============================================================================
// Styles
// =============================================================================

const createStyles = (theme: any, isDark: boolean, isTablet: boolean) =>
  StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16 },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: { fontSize: 16 },

    runtimeBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: isDark ? '#f59e0b20' : '#fef3c720',
      marginBottom: 16,
    },
    runtimeText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#f59e0b',
    },

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      padding: 12,
      borderRadius: 10,
      marginBottom: 16,
      gap: 8,
    },
    errorText: { color: '#fff', fontSize: 14, flex: 1 },

    section: { marginBottom: 24 },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    statCard: {
      flex: 1,
      minWidth: isTablet ? 160 : 140,
      padding: 14,
      borderRadius: 12,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    statIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 22,
      fontWeight: '700',
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      fontWeight: '500',
      textAlign: 'center',
    },

    card: {
      padding: 16,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.3 : 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      marginBottom: 12,
    },

    distributionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    distributionLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    distributionText: { fontSize: 14, textTransform: 'capitalize' },
    distributionValue: { fontSize: 13 },

    phraseRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    phraseText: { fontSize: 13, flex: 1, marginRight: 12 },
    phraseStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    phraseRate: { fontSize: 14, fontWeight: '700' },
    phraseAttempts: { fontSize: 11 },

    skillHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    skillScore: { fontSize: 18, fontWeight: '700' },
    skillMeta: { fontSize: 11, marginTop: 6 },

    progressBarBg: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      borderRadius: 4,
    },

    assessmentRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    assessmentSkill: { fontSize: 14, textTransform: 'capitalize' },
    assessmentStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    assessmentRate: { fontSize: 14, fontWeight: '600' },
    assessmentAttempts: { fontSize: 11 },

    aiHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    aiStats: {
      flexDirection: 'row',
      gap: 24,
      marginBottom: 12,
    },
    aiStatItem: { alignItems: 'center' },
    aiStatValue: { fontSize: 24, fontWeight: '700' },
    aiStatLabel: { fontSize: 11 },
    aiLanguages: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    langBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: Colors.accent[600] + '15',
    },
    langText: { fontSize: 12, fontWeight: '500' },

    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    categoryName: { fontSize: 14, textTransform: 'capitalize', fontWeight: '500' },
    categoryViews: { fontSize: 12 },

    sessionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    sessionRange: { fontSize: 13, fontWeight: '500' },
    sessionCount: { fontSize: 12 },

    cohortRow: {
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.border,
    },
    cohortWeek: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    cohortBadges: { flexDirection: 'row', gap: 6 },
  })
