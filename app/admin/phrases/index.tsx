import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  useWindowDimensions,
} from 'react-native'
import { Stack } from 'expo-router'
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  BookOpen,
  X,
  ChevronDown,
  ChevronUp,
  Filter,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { phrasesApi } from '@/lib/services/api-client'

interface Phrase {
  id: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  pronunciation_shona: string | null
  pronunciation_ndebele: string | null
  pronunciation_chinese: string | null
  category: string
  context: string | null
  difficulty: string | null
  created_at: string
}

export default function AdminPhrasesScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [filteredPhrases, setFilteredPhrases] = useState<Phrase[]>([])
  const [categories, setCategories] = useState<string[]>(['All'])
  const [difficulties, setDifficulties] = useState<string[]>(['All'])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All')
  const [expandedPhraseId, setExpandedPhraseId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingPhrase, setEditingPhrase] = useState<Phrase | null>(null)
  const [saving, setSaving] = useState(false)

  const isTablet = width >= 768

  const fetchPhrases = useCallback(async () => {
    try {
      const { data, error } = await phrasesApi.listPhrases()

      if (error) throw new Error(error)
      setPhrases(data || [])
      setFilteredPhrases(data || [])

      // Extract unique categories from data
      const uniqueCategories: string[] = ['All', ...new Set((data || []).map((p: Phrase) => p.category).filter((c): c is string => Boolean(c)).sort())]
      setCategories(uniqueCategories)

      // Extract unique difficulties from data
      const uniqueDifficulties: string[] = ['All', ...new Set((data || []).map((p: Phrase) => p.difficulty).filter((d): d is string => Boolean(d)).sort())]
      setDifficulties(uniqueDifficulties)
    } catch (err) {
      console.error('Error fetching phrases:', err)
      Alert.alert('Error', 'Failed to load phrases')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchPhrases()
  }, [fetchPhrases])

  useEffect(() => {
    let filtered = phrases

    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (phrase) =>
          phrase.english.toLowerCase().includes(query) ||
          phrase.shona.toLowerCase().includes(query) ||
          phrase.ndebele.toLowerCase().includes(query) ||
          phrase.chinese.includes(query)
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((phrase) => phrase.category === selectedCategory)
    }

    if (selectedDifficulty !== 'All') {
      filtered = filtered.filter((phrase) => phrase.difficulty === selectedDifficulty)
    }

    setFilteredPhrases(filtered)
  }, [searchQuery, selectedCategory, selectedDifficulty, phrases])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchPhrases()
  }, [fetchPhrases])

  const handleDelete = async (phrase: Phrase) => {
    Alert.alert(
      'Delete Phrase',
      `Are you sure you want to delete "${phrase.english}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await phrasesApi.deletePhrase(phrase.id)

              if (error) throw new Error(error)

              setPhrases((prev) => prev.filter((p) => p.id !== phrase.id))
              Alert.alert('Success', 'Phrase deleted')
            } catch (err) {
              console.error('Error deleting phrase:', err)
              Alert.alert('Error', 'Failed to delete phrase')
            }
          },
        },
      ]
    )
  }

  const handleEdit = (phrase: Phrase) => {
    setEditingPhrase({ ...phrase })
    setEditModalVisible(true)
  }

  const handleSave = async () => {
    if (!editingPhrase) return

    setSaving(true)
    try {
      const { error } = await phrasesApi.updatePhrase(editingPhrase.id, {
        english: editingPhrase.english,
        shona: editingPhrase.shona,
        ndebele: editingPhrase.ndebele,
        chinese: editingPhrase.chinese,
        pronunciation_shona: editingPhrase.pronunciation_shona,
        pronunciation_ndebele: editingPhrase.pronunciation_ndebele,
        pronunciation_chinese: editingPhrase.pronunciation_chinese,
        category: editingPhrase.category,
        context: editingPhrase.context,
        difficulty: editingPhrase.difficulty,
      })

      if (error) throw new Error(error)

      setPhrases((prev) =>
        prev.map((p) => (p.id === editingPhrase.id ? editingPhrase : p))
      )
      setEditModalVisible(false)
      Alert.alert('Success', 'Phrase updated')
    } catch (err) {
      console.error('Error updating phrase:', err)
      Alert.alert('Error', 'Failed to update phrase')
    } finally {
      setSaving(false)
    }
  }

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Phrase Management' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading phrases...
          </Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Phrase Management' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Search and Filter Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
            <Search size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search phrases..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: theme.card }]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
                Category:
              </Text>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedCategory === cat ? theme.primary : theme.card,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedCategory === cat ? '#fff' : theme.text },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterScroll}
            >
              <Text style={[styles.filterLabel, { color: theme.textSecondary }]}>
                Difficulty:
              </Text>
              {difficulties.map((diff) => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.filterChip,
                    {
                      backgroundColor:
                        selectedDifficulty === diff ? theme.secondary : theme.card,
                    },
                  ]}
                  onPress={() => setSelectedDifficulty(diff)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      { color: selectedDifficulty === diff ? '#fff' : theme.text },
                    ]}
                  >
                    {diff === 'All' ? diff : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={[styles.statsText, { color: theme.textSecondary }]}>
            {filteredPhrases.length} of {phrases.length} phrases
          </Text>
        </View>

        {/* Phrases List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredPhrases.length === 0 ? (
            <View style={styles.emptyState}>
              <BookOpen size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No phrases found
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery || selectedCategory !== 'All'
                  ? 'Try adjusting your filters'
                  : 'No phrases in the database'}
              </Text>
            </View>
          ) : (
            filteredPhrases.map((phrase) => (
              <View
                key={phrase.id}
                style={[styles.phraseCard, { backgroundColor: theme.card }]}
              >
                <TouchableOpacity
                  style={styles.phraseHeader}
                  onPress={() =>
                    setExpandedPhraseId(expandedPhraseId === phrase.id ? null : phrase.id)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.phraseInfo}>
                    <Text style={[styles.phraseEnglish, { color: theme.text }]}>
                      {phrase.english}
                    </Text>
                    <View style={styles.phraseMeta}>
                      <View
                        style={[
                          styles.categoryBadge,
                          { backgroundColor: theme.primary + '20' },
                        ]}
                      >
                        <Text
                          style={[styles.categoryText, { color: theme.primary }]}
                        >
                          {phrase.category}
                        </Text>
                      </View>
                      {phrase.difficulty && (
                        <View
                          style={[
                            styles.difficultyBadge,
                            { backgroundColor: theme.secondary + '20' },
                          ]}
                        >
                          <Text
                            style={[styles.difficultyText, { color: theme.secondary }]}
                          >
                            {phrase.difficulty}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {expandedPhraseId === phrase.id ? (
                    <ChevronUp size={20} color={theme.textMuted} />
                  ) : (
                    <ChevronDown size={20} color={theme.textMuted} />
                  )}
                </TouchableOpacity>

                {expandedPhraseId === phrase.id && (
                  <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                    <View style={styles.translationRow}>
                      <Text style={[styles.translationLabel, { color: theme.textMuted }]}>
                        Shona:
                      </Text>
                      <Text style={[styles.translationText, { color: theme.text }]}>
                        {phrase.shona}
                      </Text>
                    </View>
                    <View style={styles.translationRow}>
                      <Text style={[styles.translationLabel, { color: theme.textMuted }]}>
                        Ndebele:
                      </Text>
                      <Text style={[styles.translationText, { color: theme.text }]}>
                        {phrase.ndebele}
                      </Text>
                    </View>
                    <View style={styles.translationRow}>
                      <Text style={[styles.translationLabel, { color: theme.textMuted }]}>
                        Chinese:
                      </Text>
                      <Text style={[styles.translationText, { color: theme.text }]}>
                        {phrase.chinese}
                      </Text>
                    </View>
                    {phrase.context && (
                      <View style={styles.translationRow}>
                        <Text style={[styles.translationLabel, { color: theme.textMuted }]}>
                          Context:
                        </Text>
                        <Text style={[styles.translationText, { color: theme.textSecondary }]}>
                          {phrase.context}
                        </Text>
                      </View>
                    )}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: theme.primary + '20' }]}
                        onPress={() => handleEdit(phrase)}
                      >
                        <Edit3 size={16} color={theme.primary} />
                        <Text style={[styles.actionButtonText, { color: theme.primary }]}>
                          Edit
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#ef4444' + '20' }]}
                        onPress={() => handleDelete(phrase)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                        <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>

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
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Phrase</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <Text style={[styles.saveButton, { color: theme.primary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {editingPhrase && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>English</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingPhrase.english}
                    onChangeText={(text) =>
                      setEditingPhrase({ ...editingPhrase, english: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Shona</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingPhrase.shona}
                    onChangeText={(text) =>
                      setEditingPhrase({ ...editingPhrase, shona: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Ndebele</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingPhrase.ndebele}
                    onChangeText={(text) =>
                      setEditingPhrase({ ...editingPhrase, ndebele: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Chinese</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingPhrase.chinese}
                    onChangeText={(text) =>
                      setEditingPhrase({ ...editingPhrase, chinese: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Category</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingPhrase.category}
                    onChangeText={(text) =>
                      setEditingPhrase({ ...editingPhrase, category: text })
                    }
                    placeholderTextColor={theme.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Context</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.card, color: theme.text }]}
                    value={editingPhrase.context || ''}
                    onChangeText={(text) =>
                      setEditingPhrase({ ...editingPhrase, context: text })
                    }
                    placeholder="Usage context"
                    placeholderTextColor={theme.textMuted}
                    multiline
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: theme.text }]}>Difficulty</Text>
                  <View style={styles.difficultyOptions}>
                    {difficulties.filter(d => d !== 'All').map((diff) => (
                      <TouchableOpacity
                        key={diff}
                        style={[
                          styles.difficultyOption,
                          {
                            backgroundColor:
                              editingPhrase.difficulty === diff
                                ? theme.primary
                                : theme.card,
                          },
                        ]}
                        onPress={() =>
                          setEditingPhrase({ ...editingPhrase, difficulty: diff })
                        }
                      >
                        <Text
                          style={{
                            color: editingPhrase.difficulty === diff ? '#fff' : theme.text,
                          }}
                        >
                          {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
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
    searchContainer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    filterButton: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    filtersContainer: {
      paddingHorizontal: 16,
      gap: 12,
      marginBottom: 8,
    },
    filterScroll: {
      flexDirection: 'row',
    },
    filterLabel: {
      fontSize: 14,
      marginRight: 12,
      alignSelf: 'center',
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
    },
    filterChipText: {
      fontSize: 13,
    },
    statsRow: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    statsText: {
      fontSize: 14,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingTop: 0,
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
    phraseCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    phraseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    phraseInfo: {
      flex: 1,
    },
    phraseEnglish: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    phraseMeta: {
      flexDirection: 'row',
      gap: 8,
    },
    categoryBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '500',
    },
    difficultyBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    difficultyText: {
      fontSize: 12,
      fontWeight: '500',
    },
    expandedContent: {
      padding: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      gap: 8,
    },
    translationRow: {
      flexDirection: 'row',
    },
    translationLabel: {
      width: 70,
      fontSize: 14,
    },
    translationText: {
      flex: 1,
      fontSize: 14,
    },
    actionsRow: {
      flexDirection: 'row',
      marginTop: 12,
      gap: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
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
    saveButton: {
      fontSize: 16,
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
    difficultyOptions: {
      flexDirection: 'row',
      gap: 12,
    },
    difficultyOption: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
  })
