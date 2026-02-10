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
} from 'react-native'
import { Stack } from 'expo-router'
import {
  Volume2,
  BookText,
  Languages,
  Ear,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { createClient } from '@/lib/supabase/client'

const SKILL_ICONS: Record<string, typeof Volume2> = {
  pronunciation: Volume2,
  vocabulary: BookText,
  grammar: Languages,
  comprehension: Ear,
  conversation: MessageSquare,
}

const SKILL_COLORS: Record<string, string> = {
  pronunciation: Colors.primary[600],
  vocabulary: Colors.secondary[500],
  grammar: Colors.accent[500],
  comprehension: '#3b82f6',
  conversation: '#8b5cf6',
}

interface SkillRow {
  id: string
  name: string
  description: string
  is_active: boolean
  sort_order: number
  created_at: string
}

interface SkillLevelRow {
  id: string
  skill_id: string
  level: string
  min_score: number
  sort_order: number
}

interface AssessmentRow {
  id: string
  skill_id: string
  type: string
  target_level: string
  passing_score: number
  is_active: boolean
  created_at: string
}

export default function AdminSkillsScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  const [skills, setSkills] = useState<SkillRow[]>([])
  const [skillLevels, setSkillLevels] = useState<SkillLevelRow[]>([])
  const [assessments, setAssessments] = useState<AssessmentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedSkill, setExpandedSkill] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const supabase = createClient()

      const [skillsRes, levelsRes, assessmentsRes] = await Promise.all([
        supabase.from('skills').select('*').order('sort_order'),
        supabase.from('skill_levels').select('*').order('sort_order'),
        supabase.from('assessments').select('*').order('created_at', { ascending: false }),
      ])

      if (skillsRes.data) setSkills(skillsRes.data)
      if (levelsRes.data) setSkillLevels(levelsRes.data)
      if (assessmentsRes.data) setAssessments(assessmentsRes.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching skills data:', err)
      setError('Failed to load skills data. Tables may not exist yet.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleSkillActive = async (skillId: string, currentState: boolean) => {
    try {
      const supabase = createClient()
      await supabase
        .from('skills')
        .update({ is_active: !currentState })
        .eq('id', skillId)

      setSkills(prev =>
        prev.map(s => (s.id === skillId ? { ...s, is_active: !currentState } : s))
      )
    } catch (err) {
      Alert.alert('Error', 'Failed to update skill status')
    }
  }

  const styles = createStyles(theme)

  return (
    <>
      <Stack.Screen options={{ headerTitle: 'Skills & Assessments' }} />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} />
        }
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.primary[600]} />
            <Text style={styles.loadingText}>Loading skills...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.hintText}>
              The skills tables need to be created in Supabase. Run the migration scripts to set up the database schema.
            </Text>
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{skills.length}</Text>
                <Text style={styles.statLabel}>Skills</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{skillLevels.length}</Text>
                <Text style={styles.statLabel}>Levels</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{assessments.length}</Text>
                <Text style={styles.statLabel}>Assessments</Text>
              </View>
            </View>

            {/* Skills List */}
            <Text style={styles.sectionTitle}>Core Skills</Text>
            {skills.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No skills configured yet.</Text>
                <Text style={styles.hintText}>
                  Skills are defined in the database. Seed the skills table with the 5 core skills: pronunciation, vocabulary, grammar, comprehension, conversation.
                </Text>
              </View>
            ) : (
              skills.map(skill => {
                const Icon = SKILL_ICONS[skill.name] || BookText
                const color = SKILL_COLORS[skill.name] || Colors.primary[600]
                const isExpanded = expandedSkill === skill.id
                const levels = skillLevels.filter(l => l.skill_id === skill.id)
                const skillAssessments = assessments.filter(a => a.skill_id === skill.id)

                return (
                  <View key={skill.id} style={styles.skillCard}>
                    <TouchableOpacity
                      style={styles.skillHeader}
                      onPress={() => setExpandedSkill(isExpanded ? null : skill.id)}
                    >
                      <View style={[styles.skillIcon, { backgroundColor: color + '20' }]}>
                        <Icon size={22} color={color} />
                      </View>
                      <View style={styles.skillInfo}>
                        <Text style={styles.skillName}>{skill.name}</Text>
                        <Text style={styles.skillDescription}>{skill.description || 'No description'}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => toggleSkillActive(skill.id, skill.is_active)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {skill.is_active ? (
                          <ToggleRight size={28} color={Colors.secondary[500]} />
                        ) : (
                          <ToggleLeft size={28} color={theme.textMuted} />
                        )}
                      </TouchableOpacity>
                      {isExpanded ? (
                        <ChevronUp size={18} color={theme.textMuted} />
                      ) : (
                        <ChevronDown size={18} color={theme.textMuted} />
                      )}
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.skillDetails}>
                        {/* Levels */}
                        <Text style={styles.detailLabel}>Proficiency Levels ({levels.length})</Text>
                        {levels.length > 0 ? (
                          levels.map(level => (
                            <View key={level.id} style={styles.detailRow}>
                              <Text style={styles.detailText}>
                                {level.level} (min score: {level.min_score})
                              </Text>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noDataText}>No levels defined</Text>
                        )}

                        {/* Assessments */}
                        <Text style={[styles.detailLabel, { marginTop: 12 }]}>
                          Assessments ({skillAssessments.length})
                        </Text>
                        {skillAssessments.length > 0 ? (
                          skillAssessments.map(a => (
                            <View key={a.id} style={styles.detailRow}>
                              <Text style={styles.detailText}>
                                {a.type} - {a.target_level} (pass: {a.passing_score}%)
                              </Text>
                              <View
                                style={[
                                  styles.statusBadge,
                                  a.is_active ? styles.activeBadge : styles.inactiveBadge,
                                ]}
                              >
                                <Text style={styles.statusBadgeText}>
                                  {a.is_active ? 'Active' : 'Inactive'}
                                </Text>
                              </View>
                            </View>
                          ))
                        ) : (
                          <Text style={styles.noDataText}>No assessments created</Text>
                        )}
                      </View>
                    )}
                  </View>
                )
              })
            )}

            {/* Assessments Overview */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>All Assessments</Text>
            {assessments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No assessments configured yet.</Text>
              </View>
            ) : (
              assessments.map(a => (
                <View key={a.id} style={styles.assessmentCard}>
                  <View style={styles.assessmentHeader}>
                    <View style={[styles.typeBadge, {
                      backgroundColor:
                        a.type === 'diagnostic' ? '#3b82f620' :
                        a.type === 'formative' ? Colors.accent[500] + '20' :
                        Colors.secondary[500] + '20',
                    }]}>
                      <Text style={[styles.typeBadgeText, {
                        color:
                          a.type === 'diagnostic' ? '#3b82f6' :
                          a.type === 'formative' ? Colors.accent[500] :
                          Colors.secondary[500],
                      }]}>
                        {a.type}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        a.is_active ? styles.activeBadge : styles.inactiveBadge,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>
                        {a.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.assessmentDetail}>
                    Target: {a.target_level} | Pass: {a.passing_score}%
                  </Text>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </>
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
      paddingBottom: 40,
    },
    centerContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 15,
      color: theme.textMuted,
    },
    errorText: {
      fontSize: 16,
      color: '#ef4444',
      textAlign: 'center',
      marginBottom: 8,
    },
    hintText: {
      fontSize: 13,
      color: theme.textMuted,
      textAlign: 'center',
      paddingHorizontal: 20,
      lineHeight: 18,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    statCard: {
      flex: 1,
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    emptyCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: 15,
      color: theme.textMuted,
      marginBottom: 8,
    },
    skillCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      marginBottom: 12,
      overflow: 'hidden',
    },
    skillHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    skillIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    skillInfo: {
      flex: 1,
    },
    skillName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      textTransform: 'capitalize',
    },
    skillDescription: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 2,
    },
    skillDetails: {
      borderTopWidth: 1,
      borderTopColor: theme.border,
      padding: 16,
    },
    detailLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.textSecondary,
      marginBottom: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    detailText: {
      fontSize: 14,
      color: theme.text,
      textTransform: 'capitalize',
    },
    noDataText: {
      fontSize: 13,
      color: theme.textMuted,
      fontStyle: 'italic',
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    activeBadge: {
      backgroundColor: Colors.secondary[500] + '20',
    },
    inactiveBadge: {
      backgroundColor: theme.border,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    assessmentCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
    },
    assessmentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 8,
    },
    typeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    typeBadgeText: {
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    assessmentDetail: {
      fontSize: 14,
      color: theme.textSecondary,
      textTransform: 'capitalize',
    },
  })
