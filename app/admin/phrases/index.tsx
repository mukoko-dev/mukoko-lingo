import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { phrasesApi, adminPhrasesApi } from '@/lib/services/api-client'

const CATEGORIES = [
  'all', 'greetings', 'family', 'shopping', 'food', 'directions',
  'work', 'home', 'social', 'health', 'transport', 'emotions',
  'school', 'money', 'weather',
]

interface PhraseItem {
  id: string
  category: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  difficulty: string
}

export default function AdminPhrasesListScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const router = useRouter()

  const [phrases, setPhrases] = useState<PhraseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPhrases = useCallback(async () => {
    try {
      const params: Record<string, string> = {}
      if (selectedCategory !== 'all') {
        params.category = selectedCategory
      }
      const { data, error } = await phrasesApi.listPhrases(params)
      if (error) {
        Alert.alert('Error', error)
        return
      }
      setPhrases(data || [])
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to load phrases')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory])

  useEffect(() => {
    setLoading(true)
    loadPhrases()
  }, [loadPhrases])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadPhrases()
    setRefreshing(false)
  }, [loadPhrases])

  const handleDelete = (phrase: PhraseItem) => {
    Alert.alert(
      'Delete Phrase',
      `Are you sure you want to delete "${phrase.english}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(phrase.id)
            try {
              const { error } = await adminPhrasesApi.deletePhrase(phrase.id)
              if (error) {
                Alert.alert('Error', error)
              } else {
                setPhrases(prev => prev.filter(p => p.id !== phrase.id))
              }
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete phrase')
            } finally {
              setDeletingId(null)
            }
          },
        },
      ]
    )
  }

  const filteredPhrases = phrases.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.english.toLowerCase().includes(q) ||
      p.shona.toLowerCase().includes(q) ||
      p.ndebele.toLowerCase().includes(q) ||
      p.chinese.toLowerCase().includes(q)
    )
  })

  const styles = createStyles(theme, isDark)

  const renderItem = ({ item }: { item: PhraseItem }) => (
    <View style={styles.phraseCard}>
      <TouchableOpacity
        style={styles.phraseContent}
        onPress={() => router.push({ pathname: '/admin/phrases/edit', params: { id: item.id } })}
        activeOpacity={0.7}
      >
        <Text style={styles.phraseEnglish} numberOfLines={1}>{item.english}</Text>
        <Text style={styles.phraseTranslation} numberOfLines={1}>{item.shona}</Text>
        <View style={styles.phraseMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.category}</Text>
          </View>
          <Text style={styles.difficultyText}>{item.difficulty}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.phraseActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push({ pathname: '/admin/phrases/edit', params: { id: item.id } })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Pencil size={18} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
          disabled={deletingId === item.id}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color={Colors.semanticError} />
          ) : (
            <Trash2 size={18} color={Colors.semanticError} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={18} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search phrases..."
            placeholderTextColor={theme.textMuted}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === item && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryPillText,
                selectedCategory === item && styles.categoryPillTextActive,
              ]}
            >
              {item === 'all' ? 'All' : item.charAt(0).toUpperCase() + item.slice(1)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Add Phrase Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push('/admin/phrases/edit')}
        activeOpacity={0.8}
      >
        <Plus size={20} color="#ffffff" />
        <Text style={styles.addButtonText}>Add Phrase</Text>
      </TouchableOpacity>

      {/* Phrase List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Loading phrases...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredPhrases}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No phrases match your search' : 'No phrases found'}
              </Text>
            </View>
          }
          ListFooterComponent={
            filteredPhrases.length > 0 ? (
              <Text style={styles.countText}>
                {filteredPhrases.length} phrase{filteredPhrases.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
        />
      )}
    </View>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    searchSection: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      gap: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 0,
    },
    categoryScroll: {
      maxHeight: 52,
    },
    categoryContent: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      gap: 8,
    },
    categoryPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    categoryPillActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    categoryPillText: {
      fontSize: 13,
      fontWeight: '500',
      color: theme.text,
    },
    categoryPillTextActive: {
      color: '#ffffff',
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      marginHorizontal: 16,
      marginVertical: 8,
      paddingVertical: 12,
      borderRadius: 10,
      gap: 8,
    },
    addButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
    },
    loadingText: {
      fontSize: 15,
      color: theme.textMuted,
    },
    listContent: {
      padding: 16,
      paddingTop: 8,
      gap: 10,
    },
    phraseCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    phraseContent: {
      flex: 1,
      marginRight: 12,
    },
    phraseEnglish: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    phraseTranslation: {
      fontSize: 14,
      color: theme.primary,
      fontStyle: 'italic',
      marginBottom: 8,
    },
    phraseMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    categoryBadge: {
      backgroundColor: theme.secondary + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    categoryBadgeText: {
      fontSize: 11,
      fontWeight: '500',
      color: isDark ? Colors.secondary[300] : Colors.secondary[600],
    },
    difficultyText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    phraseActions: {
      justifyContent: 'center',
      gap: 12,
    },
    actionButton: {
      padding: 6,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 15,
      color: theme.textMuted,
    },
    countText: {
      textAlign: 'center',
      fontSize: 13,
      color: theme.textMuted,
      paddingVertical: 16,
    },
  })
