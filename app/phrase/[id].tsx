import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import {
  Volume2,
  Bookmark,
  MessageCircle,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { phrases, categories, Phrase } from '@/lib/data/phrases-data'
import {
  isBookmarked as checkBookmarked,
  addBookmark,
  removeBookmark,
  updateProgress,
} from '@/lib/storage/database'

type Language = 'english' | 'shona' | 'ndebele' | 'swahili' | 'chinese'

const LANGUAGES: { key: Language; name: string; flag: string }[] = [
  { key: 'english', name: 'English', flag: '🇬🇧' },
  { key: 'shona', name: 'Shona', flag: '🇿🇼' },
  { key: 'ndebele', name: 'Ndebele', flag: '🇿🇼' },
  { key: 'swahili', name: 'Swahili', flag: '🇰🇪' },
  { key: 'chinese', name: 'Chinese', flag: '🇨🇳' },
]

export default function PhraseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  const [phrase, setPhrase] = useState<Phrase | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('shona')

  useEffect(() => {
    if (id) {
      const foundPhrase = phrases.find(p => p.id === id)
      setPhrase(foundPhrase || null)
      checkBookmarked(id).then(setIsBookmarked)
    }
  }, [id])

  const toggleBookmark = async () => {
    if (!id) return
    if (isBookmarked) {
      await removeBookmark(id)
    } else {
      await addBookmark(id)
    }
    setIsBookmarked(!isBookmarked)
  }

  const markAsPracticed = async () => {
    if (!id) return
    await updateProgress(id, 'practiced')
    router.back()
  }

  const markAsMastered = async () => {
    if (!id) return
    await updateProgress(id, 'mastered')
    router.back()
  }

  const styles = createStyles(theme)

  if (!phrase) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Phrase not found</Text>
      </View>
    )
  }

  const category = categories.find(c => c.id === phrase.category)
  const contextKey = selectedLanguage === 'english' ? 'en' :
    selectedLanguage === 'shona' ? 'sn' :
    selectedLanguage === 'ndebele' ? 'nd' :
    selectedLanguage === 'swahili' ? 'sw' : 'zh'

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: category?.name || 'Phrase',
          headerRight: () => (
            <TouchableOpacity onPress={toggleBookmark}>
              <Bookmark
                size={24}
                color={isBookmarked ? Colors.accent[500] : theme.textMuted}
                fill={isBookmarked ? Colors.accent[500] : 'transparent'}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Main Phrase Card */}
        <View style={styles.mainCard}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryIcon}>{category?.icon}</Text>
            <Text style={styles.categoryName}>{category?.name}</Text>
          </View>

          <Text style={styles.englishPhrase}>{phrase.english}</Text>

          <View style={styles.divider} />

          <View style={styles.translationSection}>
            <Text style={styles.translationLabel}>
              {LANGUAGES.find(l => l.key === selectedLanguage)?.flag}{' '}
              {LANGUAGES.find(l => l.key === selectedLanguage)?.name}
            </Text>
            <Text style={styles.translationPhrase}>
              {phrase[selectedLanguage]}
            </Text>
            <TouchableOpacity style={styles.playButton}>
              <Volume2 size={20} color="#ffffff" />
              <Text style={styles.playButtonText}>Listen</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language Selector */}
        <Text style={styles.sectionTitle}>Translations</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.languageScroll}
          contentContainerStyle={styles.languageContent}
        >
          {LANGUAGES.filter(l => l.key !== 'english').map(lang => (
            <TouchableOpacity
              key={lang.key}
              style={[
                styles.languagePill,
                selectedLanguage === lang.key && styles.languagePillActive,
              ]}
              onPress={() => setSelectedLanguage(lang.key)}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text
                style={[
                  styles.languageText,
                  selectedLanguage === lang.key && styles.languageTextActive,
                ]}
              >
                {lang.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Pronunciation Guide */}
        <Text style={styles.sectionTitle}>Pronunciation</Text>
        <View style={styles.pronunciationCard}>
          <Text style={styles.pronunciationText}>
            {phrase.pronunciation[selectedLanguage]}
          </Text>
        </View>

        {/* Context */}
        <Text style={styles.sectionTitle}>Context</Text>
        <View style={styles.contextCard}>
          <Text style={styles.contextText}>
            {phrase.context[contextKey]}
          </Text>
        </View>

        {/* All Translations */}
        <Text style={styles.sectionTitle}>All Languages</Text>
        <View style={styles.allTranslationsCard}>
          {LANGUAGES.map(lang => (
            <View key={lang.key} style={styles.translationRow}>
              <Text style={styles.langFlag}>{lang.flag}</Text>
              <View style={styles.translationContent}>
                <Text style={styles.langName}>{lang.name}</Text>
                <Text style={styles.langPhrase}>{phrase[lang.key]}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.practiceButton]}
            onPress={markAsPracticed}
          >
            <Check size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Mark Practiced</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.masterButton]}
            onPress={markAsMastered}
          >
            <Volume2 size={20} color="#ffffff" />
            <Text style={styles.actionButtonText}>Mastered!</Text>
          </TouchableOpacity>
        </View>

        {/* Practice with AI */}
        <TouchableOpacity
          style={styles.aiButton}
          onPress={() => router.push('/(tabs)/ai-practice' as const)}
        >
          <MessageCircle size={20} color={Colors.primary[600]} />
          <Text style={styles.aiButtonText}>Practice with Shamwari</Text>
        </TouchableOpacity>
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
    },
    errorText: {
      color: theme.text,
      textAlign: 'center',
      marginTop: 40,
    },
    mainCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    categoryBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    categoryIcon: {
      fontSize: 16,
    },
    categoryName: {
      fontSize: 13,
      color: Colors.secondary[600],
      fontWeight: '600',
    },
    englishPhrase: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 32,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 16,
    },
    translationSection: {
      alignItems: 'center',
    },
    translationLabel: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 8,
    },
    translationPhrase: {
      fontSize: 22,
      fontWeight: '600',
      color: Colors.primary[600],
      textAlign: 'center',
      marginBottom: 16,
    },
    playButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary[600],
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 24,
      gap: 8,
    },
    playButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    languageScroll: {
      marginBottom: 20,
    },
    languageContent: {
      gap: 8,
    },
    languagePill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    languagePillActive: {
      backgroundColor: Colors.primary[600],
      borderColor: Colors.primary[600],
    },
    languageFlag: {
      fontSize: 16,
    },
    languageText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.text,
    },
    languageTextActive: {
      color: '#ffffff',
    },
    pronunciationCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    pronunciationText: {
      fontSize: 16,
      color: theme.text,
      fontStyle: 'italic',
      lineHeight: 24,
    },
    contextCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
    },
    contextText: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    allTranslationsCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
    },
    translationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    langFlag: {
      fontSize: 20,
      marginRight: 12,
    },
    translationContent: {
      flex: 1,
    },
    langName: {
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 2,
    },
    langPhrase: {
      fontSize: 15,
      color: theme.text,
    },
    actionButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: 12,
      gap: 8,
    },
    practiceButton: {
      backgroundColor: Colors.secondary[500],
    },
    masterButton: {
      backgroundColor: Colors.accent[500],
    },
    actionButtonText: {
      color: '#ffffff',
      fontSize: 15,
      fontWeight: '600',
    },
    aiButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Colors.primary[600],
      gap: 8,
      marginBottom: 32,
    },
    aiButtonText: {
      color: Colors.primary[600],
      fontSize: 15,
      fontWeight: '600',
    },
  })
