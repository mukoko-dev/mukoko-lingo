import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  useWindowDimensions,
} from 'react-native'
import { Stack } from 'expo-router'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  User,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  Trash2,
  Shield,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { createClient } from '@/lib/supabase/client'

interface ModerationAlert {
  id: string
  content: string
  content_type: string
  category: string
  severity: string
  confidence: number
  user_id: string
  message_id: string | null
  status: 'pending' | 'approved' | 'rejected' | 'dismissed'
  reviewed_by: string | null
  reviewed_at: string | null
  notes: string | null
  created_at: string
  user?: {
    email: string
    display_name: string | null
  }
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  approved: '#22c55e',
  rejected: '#ef4444',
  dismissed: '#6b7280',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
  dismissed: Eye,
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'dismissed'

export default function AdminModerationScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const [alerts, setAlerts] = useState<ModerationAlert[]>([])
  const [filteredAlerts, setFilteredAlerts] = useState<ModerationAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const isTablet = width >= 768

  const fetchAlerts = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('moderation_alerts')
        .select(`
          *,
          user:profiles!moderation_alerts_user_id_fkey (
            email,
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setAlerts(data || [])
    } catch (err) {
      console.error('Error fetching moderation alerts:', err)
      // Try without join if profiles join fails
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('moderation_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        setAlerts(data || [])
      } catch (err2) {
        Alert.alert('Error', 'Failed to load moderation alerts')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  useEffect(() => {
    if (filterStatus === 'all') {
      setFilteredAlerts(alerts)
    } else {
      setFilteredAlerts(alerts.filter((a) => a.status === filterStatus))
    }
  }, [filterStatus, alerts])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchAlerts()
  }, [fetchAlerts])

  const handleAction = async (alert: ModerationAlert, action: 'approved' | 'rejected' | 'dismissed') => {
    setUpdating(alert.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('moderation_alerts')
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', alert.id)

      if (error) throw error

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alert.id
            ? { ...a, status: action, reviewed_at: new Date().toISOString() }
            : a
        )
      )

      Alert.alert('Success', `Alert ${action}`)
    } catch (err) {
      console.error('Error updating alert:', err)
      Alert.alert('Error', 'Failed to update alert')
    } finally {
      setUpdating(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const styles = createStyles(theme, isDark, isTablet)

  const pendingCount = alerts.filter((a) => a.status === 'pending').length

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Content Moderation' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading alerts...
          </Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Content Moderation' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Header Stats */}
        <View style={styles.headerStats}>
          <View style={[styles.pendingBadge, { backgroundColor: pendingCount > 0 ? '#ef4444' : '#22c55e' }]}>
            <Text style={styles.pendingText}>
              {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {(['all', 'pending', 'approved', 'rejected', 'dismissed'] as FilterStatus[]).map(
            (status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor:
                      filterStatus === status ? Colors.primary[600] : theme.card,
                  },
                ]}
                onPress={() => setFilterStatus(status)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    { color: filterStatus === status ? '#fff' : theme.text },
                  ]}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                {status !== 'all' && (
                  <View
                    style={[
                      styles.filterCount,
                      {
                        backgroundColor:
                          filterStatus === status ? 'rgba(255,255,255,0.2)' : theme.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        { color: filterStatus === status ? '#fff' : theme.textMuted },
                      ]}
                    >
                      {alerts.filter((a) => a.status === status).length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          )}
        </ScrollView>

        {/* Alerts List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Shield size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                {filterStatus === 'pending'
                  ? 'No pending alerts'
                  : 'No alerts found'}
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {filterStatus === 'pending'
                  ? 'All flagged content has been reviewed'
                  : 'Try a different filter'}
              </Text>
            </View>
          ) : (
            filteredAlerts.map((alert) => {
              const StatusIcon = STATUS_ICONS[alert.status]
              const statusColor = STATUS_COLORS[alert.status]
              const severityColor = SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.medium

              return (
                <View
                  key={alert.id}
                  style={[styles.alertCard, { backgroundColor: theme.card }]}
                >
                  <TouchableOpacity
                    style={styles.alertHeader}
                    onPress={() =>
                      setExpandedId(expandedId === alert.id ? null : alert.id)
                    }
                    activeOpacity={0.7}
                  >
                    <View style={[styles.severityIndicator, { backgroundColor: severityColor }]} />
                    <View style={styles.alertInfo}>
                      <View style={styles.alertTitleRow}>
                        <Text style={[styles.alertCategory, { color: theme.text }]}>
                          {alert.category.replace('_', ' ')}
                        </Text>
                        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                          <StatusIcon size={12} color={statusColor} />
                          <Text style={[styles.statusText, { color: statusColor }]}>
                            {alert.status}
                          </Text>
                        </View>
                      </View>
                      <Text
                        style={[styles.alertContent, { color: theme.textSecondary }]}
                        numberOfLines={2}
                      >
                        {alert.content}
                      </Text>
                      <View style={styles.alertMeta}>
                        <Text style={[styles.alertTime, { color: theme.textMuted }]}>
                          {formatDate(alert.created_at)}
                        </Text>
                        <Text style={[styles.alertConfidence, { color: theme.textMuted }]}>
                          {Math.round(alert.confidence * 100)}% confidence
                        </Text>
                      </View>
                    </View>
                    {expandedId === alert.id ? (
                      <ChevronUp size={20} color={theme.textMuted} />
                    ) : (
                      <ChevronDown size={20} color={theme.textMuted} />
                    )}
                  </TouchableOpacity>

                  {expandedId === alert.id && (
                    <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                      <View style={styles.fullContent}>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                          Flagged Content
                        </Text>
                        <View style={[styles.contentBox, { backgroundColor: theme.background }]}>
                          <Text style={[styles.contentText, { color: theme.text }]}>
                            {alert.content}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.detailsGrid}>
                        <View style={styles.detailItem}>
                          <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                            Severity
                          </Text>
                          <View style={[styles.severityBadge, { backgroundColor: severityColor + '20' }]}>
                            <Text style={[styles.severityText, { color: severityColor }]}>
                              {alert.severity}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.detailItem}>
                          <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                            Content Type
                          </Text>
                          <Text style={[styles.detailValue, { color: theme.text }]}>
                            {alert.content_type}
                          </Text>
                        </View>
                      </View>

                      {alert.status === 'pending' && (
                        <View style={styles.actionsRow}>
                          {updating === alert.id ? (
                            <ActivityIndicator size="small" color={Colors.primary[600]} />
                          ) : (
                            <>
                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#22c55e' }]}
                                onPress={() => handleAction(alert, 'approved')}
                              >
                                <CheckCircle size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Approve</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                                onPress={() => handleAction(alert, 'rejected')}
                              >
                                <XCircle size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Reject</Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                                onPress={() => handleAction(alert, 'dismissed')}
                              >
                                <Eye size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Dismiss</Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      )}

                      {alert.reviewed_at && (
                        <View style={styles.reviewedInfo}>
                          <Text style={[styles.reviewedText, { color: theme.textMuted }]}>
                            Reviewed {formatDate(alert.reviewed_at)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              )
            })
          )}
        </ScrollView>
      </View>
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
    headerStats: {
      padding: 16,
      paddingBottom: 8,
    },
    pendingBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    pendingText: {
      color: '#fff',
      fontSize: 13,
      fontWeight: '600',
    },
    filterContainer: {
      maxHeight: 50,
    },
    filterContent: {
      paddingHorizontal: 16,
      gap: 8,
    },
    filterTab: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
    },
    filterTabText: {
      fontSize: 14,
      fontWeight: '500',
    },
    filterCount: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    filterCountText: {
      fontSize: 11,
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      gap: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
    alertCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    severityIndicator: {
      width: 4,
      height: '100%',
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      borderTopLeftRadius: 12,
      borderBottomLeftRadius: 12,
    },
    alertInfo: {
      flex: 1,
      marginLeft: 8,
    },
    alertTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    alertCategory: {
      fontSize: 15,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
      gap: 4,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    alertContent: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 8,
    },
    alertMeta: {
      flexDirection: 'row',
      gap: 12,
    },
    alertTime: {
      fontSize: 12,
    },
    alertConfidence: {
      fontSize: 12,
    },
    expandedContent: {
      padding: 16,
      borderTopWidth: 1,
    },
    fullContent: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    contentBox: {
      padding: 12,
      borderRadius: 8,
    },
    contentText: {
      fontSize: 14,
      lineHeight: 20,
    },
    detailsGrid: {
      flexDirection: 'row',
      gap: 16,
      marginBottom: 16,
    },
    detailItem: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 12,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    severityBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    severityText: {
      fontSize: 13,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      borderRadius: 8,
      gap: 6,
    },
    actionButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    reviewedInfo: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    reviewedText: {
      fontSize: 12,
      fontStyle: 'italic',
    },
  })
