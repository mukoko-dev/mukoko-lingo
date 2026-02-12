import { useState, useRef, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
} from 'react-native'
import { RotateCcw, Volume2, Check } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import type { Phrase } from '@/lib/data/phrases-data'
import type { LearningLanguage } from '@/lib/hooks/useLearningLanguage'

interface FlashCardProps {
  phrase: Phrase
  language: LearningLanguage
  isViewed: boolean
  onView: () => void
}

export function FlashCard({ phrase, language, isViewed, onView }: FlashCardProps) {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()
  const [flipped, setFlipped] = useState(false)
  const flipAnim = useRef(new Animated.Value(0)).current

  const isTablet = width >= 768
  const cardWidth = isTablet ? 260 : 220

  useEffect(() => {
    if (flipped && !isViewed) {
      onView()
    }
  }, [flipped, isViewed, onView])

  const handleFlip = () => {
    const toValue = flipped ? 0 : 1
    Animated.spring(flipAnim, {
      toValue,
      friction: 8,
      tension: 60,
      useNativeDriver: true,
    }).start()
    setFlipped(!flipped)
  }

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  })

  const translation = phrase[language]
  const pronunciation = phrase.pronunciation[language]

  const styles = createStyles(theme, isDark, cardWidth)

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handleFlip} style={styles.container}>
      {/* Front - English */}
      <Animated.View
        style={[
          styles.card,
          styles.cardFront,
          { transform: [{ rotateY: frontInterpolate }] },
          isViewed && styles.cardViewed,
        ]}
      >
        <Text style={styles.label}>English</Text>
        <Text style={styles.phraseText}>{phrase.english}</Text>
        <View style={styles.tapHint}>
          <RotateCcw size={14} color={theme.textMuted} />
          <Text style={styles.tapHintText}>Tap to flip</Text>
        </View>
        {isViewed && (
          <View style={styles.viewedBadge}>
            <Check size={12} color="#ffffff" />
          </View>
        )}
      </Animated.View>

      {/* Back - Target Language */}
      <Animated.View
        style={[
          styles.card,
          styles.cardBack,
          { transform: [{ rotateY: backInterpolate }] },
        ]}
      >
        <Text style={styles.label}>{language.charAt(0).toUpperCase() + language.slice(1)}</Text>
        <Text style={styles.phraseText}>{translation}</Text>
        {pronunciation && (
          <View style={styles.pronunciationRow}>
            <Volume2 size={14} color={theme.primary} />
            <Text style={styles.pronunciationText}>{pronunciation}</Text>
          </View>
        )}
        <View style={styles.tapHint}>
          <RotateCcw size={14} color={theme.textMuted} />
          <Text style={styles.tapHintText}>Tap to flip back</Text>
        </View>
      </Animated.View>
    </TouchableOpacity>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, cardWidth: number) =>
  StyleSheet.create({
    container: {
      width: cardWidth,
      height: cardWidth * 1.2,
      marginRight: 12,
    },
    card: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      borderRadius: 16,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backfaceVisibility: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardFront: {
      backgroundColor: theme.card,
    },
    cardBack: {
      backgroundColor: isDark ? Colors.primary[800] + '40' : Colors.primary[50],
      borderColor: isDark ? Colors.primary[400] + '30' : Colors.primary[200],
    },
    cardViewed: {
      borderColor: isDark ? Colors.success[400] + '50' : Colors.success[500] + '40',
    },
    label: {
      position: 'absolute',
      top: 12,
      left: 16,
      fontSize: 11,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    phraseText: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      lineHeight: 26,
    },
    pronunciationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: isDark ? Colors.primary[400] + '10' : Colors.primary[600] + '08',
      borderRadius: 8,
    },
    pronunciationText: {
      fontSize: 13,
      color: theme.primary,
      fontStyle: 'italic',
    },
    tapHint: {
      position: 'absolute',
      bottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tapHintText: {
      fontSize: 11,
      color: theme.textMuted,
    },
    viewedBadge: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: Colors.success[500],
      alignItems: 'center',
      justifyContent: 'center',
    },
  })
