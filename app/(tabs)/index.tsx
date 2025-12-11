import { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  RefreshControl,
  FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { BookOpen, ChevronRight, Bookmark } from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { phrases, categories, Phrase } from '@/lib/data/phrases-data'
import { getBookmarks, isBookmarked, addBookmark, removeBookmark } from '@/lib/storage/database'

export default function LearnScreen() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const router = useRouter()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([])
  const [refreshing, setRefreshing] = useState(false)

  const loadBookmarks = useCallback(async () => {
    const bookmarks = await getBookmarks()
    setBookmarkedIds(bookmarks)
  }, [])

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadBookmarks()
    setRefreshing(false)
  }, [loadBookmarks])

  const toggleBookmark = async (phraseId: string) => {
    if (bookmarkedIds.includes(phraseId)) {
      await removeBookmark(phraseId)
      setBookmarkedIds(prev => prev.filter(id => id !== phraseId))
    } else {
      await addBookmark(phraseId)
      setBookmarkedIds(prev => [...prev, phraseId])
    }
  }

  const filteredPhrases = selectedCategory
    ? phrases.filter(p => p.category === selectedCategory)
    : phrases

  const styles = createStyles(theme)

  return (
    <View style={styles.container}>
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
            isBookmarked={bookmarkedIds.includes(item.id)}
            onToggleBookmark={() => toggleBookmark(item.id)}
            onPress={() => router.push(`/phrase/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <BookOpen size={48} color={theme.textMuted} />
            <Text style={styles.emptyText}>No phrases found</Text>
          </View>
        }
      />
    </View>
  )
}

interface PhraseCardProps {
  phrase: Phrase
  theme: typeof lightTheme
  isBookmarked: boolean
  onToggleBookmark: () => void
  onPress: () => void
}

function PhraseCard({
  phrase,
  theme,
  isBookmarked,
  onToggleBookmark,
  onPress,
}: PhraseCardProps) {
  const styles = createStyles(theme)

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLanguages}>
          <Text style={styles.cardEnglish}>{phrase.english}</Text>
          <Text style={styles.cardShona}>{phrase.shona}</Text>
        </View>
        <TouchableOpacity
          onPress={onToggleBookmark}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Bookmark
            size={20}
            color={isBookmarked ? Colors.accent[500] : theme.textMuted}
            fill={isBookmarked ? Colors.accent[500] : 'transparent'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {categories.find(c => c.id === phrase.category)?.name || phrase.category}
          </Text>
        </View>
        <ChevronRight size={16} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  )
}

const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    categoryScroll: {
      maxHeight: 56,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    categoryContent: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      flexDirection: 'row',
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    categoryPillActive: {
      backgroundColor: Colors.primary[700],
      borderColor: Colors.primary[700],
    },
    categoryIcon: {
      fontSize: 14,
    },
    categoryText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
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
      marginBottom: 4,
    },
    cardShona: {
      fontSize: 15,
      color: Colors.primary[600],
      fontStyle: 'italic',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryBadge: {
      backgroundColor: Colors.secondary[500] + '20',
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
  })
