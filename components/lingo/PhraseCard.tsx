/**
 * L2 Domain — PhraseCard
 *
 * Displays a phrase with translations. Composes L1 primitives only.
 * Used by L3 orchestrators (PhraseGrid, DailyLesson).
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Bookmark, BookmarkCheck, ChevronRight } from 'lucide-react-native'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'

interface PhraseCardProps {
  id: string
  category: string
  english: string
  translation: string
  translationLanguage: string
  pronunciation?: string
  bookmarked?: boolean
  onPress?: () => void
  onBookmark?: () => void
}

export function PhraseCard({
  category,
  english,
  translation,
  translationLanguage,
  pronunciation,
  bookmarked = false,
  onPress,
  onBookmark,
}: PhraseCardProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
    >
      <View style={styles.header}>
        <Text style={[styles.category, { color: theme.textMuted }]}>
          {category.toUpperCase()}
        </Text>
        {onBookmark && (
          <TouchableOpacity onPress={onBookmark} hitSlop={8}>
            {bookmarked ? (
              <BookmarkCheck size={18} color={theme.accent} />
            ) : (
              <Bookmark size={18} color={theme.textMuted} />
            )}
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.english, { color: theme.text }]}>{english}</Text>

      <View style={styles.translationRow}>
        <Text style={[styles.langLabel, { color: theme.textSecondary }]}>
          {translationLanguage}
        </Text>
        <Text style={[styles.translationText, { color: theme.primary }]}>
          {translation}
        </Text>
      </View>

      {pronunciation && (
        <Text style={[styles.pronunciation, { color: theme.textMuted }]}>
          /{pronunciation}/
        </Text>
      )}

      <ChevronRight size={16} color={theme.textMuted} style={styles.chevron} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  category: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  english: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  translationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langLabel: {
    fontSize: 12,
    width: 60,
  },
  translationText: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  pronunciation: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  chevron: {
    position: 'absolute',
    right: 14,
    top: '50%',
  },
})
