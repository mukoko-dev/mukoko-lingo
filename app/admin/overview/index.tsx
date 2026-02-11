import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import {
  Users,
  BookOpen,
  MessageCircle,
  AlertTriangle,
  TrendingUp,
  Eye,
  Bookmark,
  Activity,
  ChevronRight,
  GraduationCap,
  Shield,
  Target,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { adminStatsApi } from '@/lib/services/api-client'

interface AdminStats {
  total_users: number
  total_admins: number
  total_phrases: number
  total_progress_records: number
  total_bookmarks: number
  total_views: number
}

interface QuickAction {
  label: string
  route: string
  icon: typeof Users
  color: string
  description: string
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'User Management',
    route: '/admin/users',
    icon: Users,
    color: Colors.primary[600],
    description: 'Manage users and roles',
  },
  {
    label: 'Phrase Management',
    route: '/admin/phrases',
    icon: BookOpen,
    color: Colors.secondary[700],
    description: 'Add, edit, delete phrases',
  },
  {
    label: 'Learning Standards',
    route: '/admin/standards',
    icon: GraduationCap,
    color: Colors.primary[700],
    description: 'Configure AI proficiency levels',
  },
  {
    label: 'Content Guardrails',
    route: '/admin/guardrails',
    icon: Shield,
    color: Colors.secondary[600],
    description: 'Manage moderation rules',
  },
  {
    label: 'Skills & Assessments',
    route: '/admin/skills',
    icon: Target,
    color: '#8b5cf6',
    description: 'Manage skills and assessments',
  },
  {
    label: 'Content Moderation',
    route: '/admin/moderation',
    icon: AlertTriangle,
    color: Colors.accent[600],
    description: 'Review flagged content',
  },
]

export default function AdminOverviewScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isTablet = width >= 768

  const fetchStats = useCallback(async () => {
    try {
      setError(null)

      const { data, error: statsError } = await adminStatsApi.getStats()

      if (statsError || !data) {
        throw new Error(statsError || 'Failed to fetch stats')
      }

      setStats({
        total_users: data.total_users,
        total_admins: data.total_admins,
        total_phrases: data.total_phrases,
        total_progress_records: data.total_progress_records,
        total_bookmarks: data.total_bookmarks,
        total_views: data.total_views,
      })
    } catch (err) {
      console.error('Error fetching admin stats:', err)
      setError('Failed to load admin statistics')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStats()
  }, [fetchStats])

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Admin Dashboard' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading dashboard...
          </Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Admin Dashboard' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.errorBanner}>
            <AlertTriangle size={20} color="#fff" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Stats Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary[600] + '20' }]}>
                <Users size={24} color={Colors.primary[600]} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats?.total_users || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Users
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.secondary[700] + '20' }]}>
                <BookOpen size={24} color={Colors.secondary[700]} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats?.total_phrases || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Total Phrases
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.accent[600] + '20' }]}>
                <Eye size={24} color={Colors.accent[600]} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats?.total_views || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Phrase Views
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.primary[700] + '20' }]}>
                <Bookmark size={24} color={Colors.primary[700]} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats?.total_bookmarks || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Bookmarks
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.secondary[600] + '20' }]}>
                <TrendingUp size={24} color={Colors.secondary[600]} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats?.total_progress_records || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Progress Records
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: theme.card }]}>
              <View style={[styles.statIcon, { backgroundColor: Colors.accent[500] + '20' }]}>
                <Activity size={24} color={Colors.accent[500]} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {stats?.total_admins || 0}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                Admin Users
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsList}>
            {QUICK_ACTIONS.map((action, index) => {
              const Icon = action.icon
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.actionCard, { backgroundColor: theme.card }]}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                    <Icon size={24} color={action.color} />
                  </View>
                  <View style={styles.actionContent}>
                    <Text style={[styles.actionLabel, { color: theme.text }]}>
                      {action.label}
                    </Text>
                    <Text style={[styles.actionDescription, { color: theme.textSecondary }]}>
                      {action.description}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={theme.textMuted} />
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Recent Activity Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={[styles.statusCard, { backgroundColor: theme.card }]}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.statusLabel, { color: theme.text }]}>
                Database Connection
              </Text>
              <Text style={[styles.statusValue, { color: '#22c55e' }]}>Active</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.statusLabel, { color: theme.text }]}>
                Authentication
              </Text>
              <Text style={[styles.statusValue, { color: '#22c55e' }]}>Operational</Text>
            </View>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.statusLabel, { color: theme.text }]}>
                AI Services
              </Text>
              <Text style={[styles.statusValue, { color: '#22c55e' }]}>Online</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
    },
    container: {
      flex: 1,
    },
    content: {
      padding: isTablet ? 24 : 16,
      paddingBottom: 40,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ef4444',
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
      gap: 8,
    },
    errorText: {
      color: '#fff',
      fontSize: 14,
      flex: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: isTablet ? 22 : 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      width: isTablet ? '31%' : '48%',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    statValue: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
      textAlign: 'center',
    },
    actionsList: {
      gap: 12,
    },
    actionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    actionContent: {
      flex: 1,
    },
    actionLabel: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    actionDescription: {
      fontSize: 14,
    },
    statusCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 12,
    },
    statusLabel: {
      flex: 1,
      fontSize: 15,
    },
    statusValue: {
      fontSize: 14,
      fontWeight: '600',
    },
  })
