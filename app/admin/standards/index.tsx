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
  Modal,
  TextInput,
  Switch,
  useWindowDimensions,
} from 'react-native'
import { Stack } from 'expo-router'
import {
  GraduationCap,
  Edit3,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  BookOpen,
  MessageCircle,
  Brain,
  Mic,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { createClient } from '@/lib/supabase/client'

interface LearningStandard {
  id: string
  level: string
  level_order: number
  title: string
  description: string
  criteria: {
    vocabulary_size: number
    sentence_complexity: string
    conversation_length: string
    pronunciation_focus: string
    comprehension_level: string
  }
  vocabulary_range: string
  conversation_types: string[]
  grammar_concepts: string[]
  ai_prompt_template: string
  example_phrases: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: Colors.secondary[600],
  novice: Colors.primary[600],
  advanced: Colors.accent[600],
  fluent: Colors.primary[700],
}

const LEVEL_ICONS: Record<string, typeof GraduationCap> = {
  beginner: BookOpen,
  novice: MessageCircle,
  advanced: Brain,
  fluent: GraduationCap,
}

export default function AdminStandardsScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const [standards, setStandards] = useState<LearningStandard[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingStandard, setEditingStandard] = useState<LearningStandard | null>(null)
  const [saving, setSaving] = useState(false)

  const isTablet = width >= 768

  const fetchStandards = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('learning_standards')
        .select('*')
        .order('level_order', { ascending: true })

      if (error) throw error
      setStandards(data || [])
    } catch (err) {
      console.error('Error fetching standards:', err)
      Alert.alert('Error', 'Failed to load learning standards')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchStandards()
  }, [fetchStandards])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStandards()
  }, [fetchStandards])

  const handleToggleActive = async (standard: LearningStandard) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('learning_standards')
        .update({ is_active: !standard.is_active })
        .eq('id', standard.id)

      if (error) throw error

      setStandards((prev) =>
        prev.map((s) =>
          s.id === standard.id ? { ...s, is_active: !s.is_active } : s
        )
      )
    } catch (err) {
      console.error('Error toggling standard:', err)
      Alert.alert('Error', 'Failed to update standard')
    }
  }

  const handleEdit = (standard: LearningStandard) => {
    setEditingStandard({ ...standard })
    setEditModalVisible(true)
  }

  const handleSave = async () => {
    if (!editingStandard) return

    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('learning_standards')
        .update({
          title: editingStandard.title,
          description: editingStandard.description,
          vocabulary_range: editingStandard.vocabulary_range,
          ai_prompt_template: editingStandard.ai_prompt_template,
          is_active: editingStandard.is_active,
        })
        .eq('id', editingStandard.id)

      if (error) throw error

      setStandards((prev) =>
        prev.map((s) => (s.id === editingStandard.id ? editingStandard : s))
      )
      setEditModalVisible(false)
      Alert.alert('Success', 'Learning standard updated')
    } catch (err) {
      console.error('Error updating standard:', err)
      Alert.alert('Error', 'Failed to update standard')
    } finally {
      setSaving(false)
    }
  }

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Learning Standards' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading standards...
          </Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Learning Standards' }} />
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: Colors.primary[600] + '15' }]}>
          <GraduationCap size={24} color={Colors.primary[600]} />
          <View style={styles.infoBannerContent}>
            <Text style={[styles.infoBannerTitle, { color: theme.text }]}>
              Learning Standards
            </Text>
            <Text style={[styles.infoBannerText, { color: theme.textSecondary }]}>
              These standards govern how the AI tutor adapts its teaching approach based on user proficiency levels.
            </Text>
          </View>
        </View>

        {/* Standards List */}
        {standards.map((standard) => {
          const Icon = LEVEL_ICONS[standard.level] || GraduationCap
          const color = LEVEL_COLORS[standard.level] || Colors.primary[600]

          return (
            <View
              key={standard.id}
              style={[
                styles.standardCard,
                { backgroundColor: theme.card },
                !standard.is_active && styles.inactiveCard,
              ]}
            >
              <TouchableOpacity
                style={styles.standardHeader}
                onPress={() =>
                  setExpandedId(expandedId === standard.id ? null : standard.id)
                }
                activeOpacity={0.7}
              >
                <View style={[styles.levelIcon, { backgroundColor: color + '20' }]}>
                  <Icon size={24} color={color} />
                </View>
                <View style={styles.standardInfo}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.standardTitle, { color: theme.text }]}>
                      {standard.title}
                    </Text>
                    <View
                      style={[
                        styles.levelBadge,
                        { backgroundColor: color },
                      ]}
                    >
                      <Text style={styles.levelText}>
                        {standard.level.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[styles.standardDescription, { color: theme.textSecondary }]}
                    numberOfLines={2}
                  >
                    {standard.description}
                  </Text>
                </View>
                {expandedId === standard.id ? (
                  <ChevronUp size={20} color={theme.textMuted} />
                ) : (
                  <ChevronDown size={20} color={theme.textMuted} />
                )}
              </TouchableOpacity>

              {expandedId === standard.id && (
                <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                  {/* Criteria */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Criteria
                    </Text>
                    <View style={styles.criteriaGrid}>
                      <View style={styles.criteriaItem}>
                        <Text style={[styles.criteriaLabel, { color: theme.textMuted }]}>
                          Vocabulary Size
                        </Text>
                        <Text style={[styles.criteriaValue, { color: theme.text }]}>
                          {standard.criteria.vocabulary_size} words
                        </Text>
                      </View>
                      <View style={styles.criteriaItem}>
                        <Text style={[styles.criteriaLabel, { color: theme.textMuted }]}>
                          Sentence Complexity
                        </Text>
                        <Text style={[styles.criteriaValue, { color: theme.text }]}>
                          {standard.criteria.sentence_complexity}
                        </Text>
                      </View>
                      <View style={styles.criteriaItem}>
                        <Text style={[styles.criteriaLabel, { color: theme.textMuted }]}>
                          Conversation Length
                        </Text>
                        <Text style={[styles.criteriaValue, { color: theme.text }]}>
                          {standard.criteria.conversation_length}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Conversation Types */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Conversation Types
                    </Text>
                    <View style={styles.tagContainer}>
                      {standard.conversation_types.map((type, idx) => (
                        <View
                          key={idx}
                          style={[styles.tag, { backgroundColor: theme.background }]}
                        >
                          <Text style={[styles.tagText, { color: theme.text }]}>
                            {type}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Grammar Concepts */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      Grammar Concepts
                    </Text>
                    <View style={styles.tagContainer}>
                      {standard.grammar_concepts.map((concept, idx) => (
                        <View
                          key={idx}
                          style={[
                            styles.tag,
                            { backgroundColor: Colors.secondary[700] + '20' },
                          ]}
                        >
                          <Text style={[styles.tagText, { color: Colors.secondary[700] }]}>
                            {concept}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* AI Prompt */}
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      AI Tutor Guidance
                    </Text>
                    <Text style={[styles.promptText, { color: theme.textSecondary }]}>
                      {standard.ai_prompt_template}
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actionsRow}>
                    <View style={styles.toggleContainer}>
                      <Text style={[styles.toggleLabel, { color: theme.text }]}>
                        Active
                      </Text>
                      <Switch
                        value={standard.is_active}
                        onValueChange={() => handleToggleActive(standard)}
                        trackColor={{ false: theme.border, true: Colors.primary[600] }}
                      />
                    </View>
                    <TouchableOpacity
                      style={[styles.editButton, { backgroundColor: Colors.primary[600] }]}
                      onPress={() => handleEdit(standard)}
                    >
                      <Edit3 size={16} color="#fff" />
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )
        })}
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Edit Standard
            </Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={Colors.primary[600]} />
              ) : (
                <Check size={24} color={Colors.primary[600]} />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {editingStandard && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Title</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingStandard.title}
                    onChangeText={(text) =>
                      setEditingStandard({ ...editingStandard, title: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Description</Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: theme.card, color: theme.text },
                    ]}
                    value={editingStandard.description}
                    onChangeText={(text) =>
                      setEditingStandard({ ...editingStandard, description: text })
                    }
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    Vocabulary Range
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingStandard.vocabulary_range}
                    onChangeText={(text) =>
                      setEditingStandard({ ...editingStandard, vocabulary_range: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>
                    AI Prompt Template
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      { backgroundColor: theme.card, color: theme.text },
                    ]}
                    value={editingStandard.ai_prompt_template}
                    onChangeText={(text) =>
                      setEditingStandard({ ...editingStandard, ai_prompt_template: text })
                    }
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={6}
                  />
                </View>

                <View style={styles.toggleRow}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Active</Text>
                  <Switch
                    value={editingStandard.is_active}
                    onValueChange={(value) =>
                      setEditingStandard({ ...editingStandard, is_active: value })
                    }
                    trackColor={{ false: theme.border, true: Colors.primary[600] }}
                  />
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
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
    standardCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    inactiveCard: {
      opacity: 0.6,
    },
    standardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    levelIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    standardInfo: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    standardTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
    },
    levelBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    levelText: {
      color: '#fff',
      fontSize: 10,
      fontWeight: '700',
    },
    standardDescription: {
      fontSize: 14,
      lineHeight: 20,
    },
    expandedContent: {
      padding: 16,
      borderTopWidth: 1,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },
    criteriaGrid: {
      gap: 8,
    },
    criteriaItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    criteriaLabel: {
      fontSize: 13,
    },
    criteriaValue: {
      fontSize: 13,
      fontWeight: '500',
    },
    tagContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    tagText: {
      fontSize: 12,
    },
    promptText: {
      fontSize: 13,
      lineHeight: 20,
      fontStyle: 'italic',
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
    },
    toggleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    toggleLabel: {
      fontSize: 14,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 8,
    },
    editButtonText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
    },
    modalContainer: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    modalContent: {
      flex: 1,
      padding: 16,
    },
    inputGroup: {
      marginBottom: 20,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    input: {
      padding: 12,
      borderRadius: 8,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
  })
