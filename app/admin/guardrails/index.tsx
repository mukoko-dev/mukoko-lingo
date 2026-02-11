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
  Switch,
  useWindowDimensions,
} from 'react-native'
import { Stack } from 'expo-router'
import {
  Shield,
  AlertTriangle,
  AlertOctagon,
  Ban,
  Heart,
  Users,
  Skull,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { guardrailsApi } from '@/lib/services/api-client'

interface Guardrail {
  id: string
  category: string
  name: string
  description: string
  is_enabled: boolean
  is_core: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  prompt_guidance: string | null
  created_at: string
  updated_at: string
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

const CATEGORY_ICONS: Record<string, typeof Shield> = {
  sexual: Ban,
  hate: AlertOctagon,
  harassment: Users,
  violence: Skull,
  self_harm: Heart,
  abuse: AlertTriangle,
}

export default function AdminGuardrailsScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const [guardrails, setGuardrails] = useState<Guardrail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const isTablet = width >= 768

  const fetchGuardrails = useCallback(async () => {
    try {
      const { data, error } = await guardrailsApi.listGuardrails()

      if (error) throw new Error(error)
      setGuardrails(data || [])
    } catch (err) {
      console.error('Error fetching guardrails:', err)
      Alert.alert('Error', 'Failed to load guardrails')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchGuardrails()
  }, [fetchGuardrails])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchGuardrails()
  }, [fetchGuardrails])

  const handleToggle = async (guardrail: Guardrail) => {
    const action = guardrail.is_enabled ? 'disable' : 'enable'

    if (guardrail.severity === 'critical' && guardrail.is_enabled) {
      Alert.alert(
        'Warning: Critical Guardrail',
        `Disabling "${guardrail.name}" may allow harmful content through. Are you sure?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable Anyway',
            style: 'destructive',
            onPress: () => performToggle(guardrail),
          },
        ]
      )
    } else {
      performToggle(guardrail)
    }
  }

  const performToggle = async (guardrail: Guardrail) => {
    setUpdating(guardrail.id)
    try {
      const { error } = await guardrailsApi.toggleGuardrailActive(guardrail.id, !guardrail.is_enabled)

      if (error) throw new Error(error)

      setGuardrails((prev) =>
        prev.map((g) =>
          g.id === guardrail.id ? { ...g, is_enabled: !g.is_enabled } : g
        )
      )
    } catch (err) {
      console.error('Error toggling guardrail:', err)
      Alert.alert('Error', 'Failed to update guardrail')
    } finally {
      setUpdating(null)
    }
  }

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Content Guardrails' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading guardrails...
          </Text>
        </View>
      </>
    )
  }

  const enabledCount = guardrails.filter((g) => g.is_enabled).length
  const criticalCount = guardrails.filter((g) => g.severity === 'critical' && g.is_enabled).length

  return (
    <>
      <Stack.Screen options={{ title: 'Content Guardrails' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: theme.accent + '15' }]}>
          <Shield size={24} color={theme.accent} />
          <View style={styles.infoBannerContent}>
            <Text style={[styles.infoBannerTitle, { color: theme.text }]}>
              AI Content Moderation
            </Text>
            <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
              Guardrails protect users by filtering harmful content. Core guardrails can only be toggled on/off.
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statValue, { color: theme.secondary }]}>
              {enabledCount}/{guardrails.length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Active
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.statValue, { color: SEVERITY_COLORS.critical }]}>
              {criticalCount}
            </Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
              Critical
            </Text>
          </View>
        </View>

        {/* Guardrails List */}
        {guardrails.map((guardrail) => {
          const Icon = CATEGORY_ICONS[guardrail.category] || Shield
          const severityColor = SEVERITY_COLORS[guardrail.severity]

          return (
            <View
              key={guardrail.id}
              style={[
                styles.guardrailCard,
                { backgroundColor: theme.card },
                !guardrail.is_enabled && styles.disabledCard,
              ]}
            >
              <TouchableOpacity
                style={styles.guardrailHeader}
                onPress={() =>
                  setExpandedId(expandedId === guardrail.id ? null : guardrail.id)
                }
                activeOpacity={0.7}
              >
                <View style={[styles.iconContainer, { backgroundColor: severityColor + '20' }]}>
                  <Icon size={24} color={severityColor} />
                </View>
                <View style={styles.guardrailInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.guardrailName, { color: theme.text }]}>
                      {guardrail.name}
                    </Text>
                    <View
                      style={[
                        styles.severityBadge,
                        { backgroundColor: severityColor },
                      ]}
                    >
                      <Text style={styles.severityText}>
                        {guardrail.severity.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.guardrailDescription, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {guardrail.description}
                  </Text>
                </View>
                <View style={styles.controlsRow}>
                  {updating === guardrail.id ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <Switch
                      value={guardrail.is_enabled}
                      onValueChange={() => handleToggle(guardrail)}
                      trackColor={{ false: theme.border, true: theme.secondary }}
                    />
                  )}
                </View>
              </TouchableOpacity>

              {expandedId === guardrail.id && (
                <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                      Category
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {guardrail.category.replace('_', ' ')}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: theme.textMuted }]}>
                      Type
                    </Text>
                    <Text style={[styles.detailValue, { color: theme.text }]}>
                      {guardrail.is_core ? 'Core (Protected)' : 'Custom'}
                    </Text>
                  </View>
                  {guardrail.prompt_guidance && (
                    <View style={styles.guidanceSection}>
                      <Text style={[styles.guidanceTitle, { color: theme.text }]}>
                        AI Moderation Guidance
                      </Text>
                      <Text style={[styles.guidanceText, { color: theme.textSecondary }]}>
                        {guardrail.prompt_guidance}
                      </Text>
                    </View>
                  )}
                  {guardrail.is_core && (
                    <View style={[styles.coreNotice, { backgroundColor: theme.primary + '15' }]}>
                      <Info size={16} color={theme.primary} />
                      <Text style={[styles.coreNoticeText, { color: theme.primary }]}>
                        This is a core guardrail. It cannot be deleted, only toggled on/off.
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          )
        })}
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
      padding: 16,
      gap: 16,
    },
    infoBanner: {
      flexDirection: 'row',
      padding: 16,
      borderRadius: 12,
      gap: 16,
    },
    infoBannerContent: {
      flex: 1,
    },
    infoBannerTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    infoBannerText: {
      fontSize: 14,
      lineHeight: 20,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      padding: 16,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 13,
    },
    guardrailCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    disabledCard: {
      opacity: 0.6,
    },
    guardrailHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    guardrailInfo: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    guardrailName: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    severityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    severityText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    guardrailDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    controlsRow: {
      marginLeft: 12,
    },
    expandedContent: {
      padding: 16,
      borderTopWidth: 1,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 13,
    },
    detailValue: {
      fontSize: 13,
      fontWeight: '500',
      textTransform: 'capitalize',
    },
    guidanceSection: {
      marginTop: 8,
    },
    guidanceTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 6,
    },
    guidanceText: {
      fontSize: 13,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    coreNotice: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      marginTop: 12,
      gap: 8,
    },
    coreNoticeText: {
      flex: 1,
      fontSize: 12,
    },
  })
