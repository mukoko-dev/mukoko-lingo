import { useState, useRef } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  FlatList,
  Animated,
  useWindowDimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ArrowRight, ChevronRight } from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'

interface OnboardingSlide {
  id: string
  title: string
  subtitle: string
  description: string
  emoji?: string
  useMascot?: boolean
  color: string
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Welcome to Nyuchi Lingo',
    subtitle: 'Learn Shona. Connect with Africa.',
    description: 'Master African languages through native phrase learning and personalized AI tutoring.',
    emoji: '🌍',
    color: Colors.primary[600],
  },
  {
    id: '2',
    title: 'Learn Native Phrases',
    subtitle: 'Real language, real conversations',
    description: 'Practice authentic phrases in Shona, Ndebele, Swahili, Chinese, and English with cultural context.',
    emoji: '📚',
    color: Colors.secondary[800],
  },
  {
    id: '3',
    title: 'Meet Shamwari',
    subtitle: 'Your AI language tutor',
    description: 'Shamwari (meaning "friend" in Shona) adapts to your learning style and pace for personalized lessons.',
    useMascot: true,
    color: Colors.accent[600],
  },
  {
    id: '4',
    title: 'Track Your Progress',
    subtitle: 'Skills-based learning',
    description: 'Build proficiency across pronunciation, vocabulary, grammar, and conversation skills.',
    emoji: '📊',
    color: Colors.primary[700],
  },
]

const STORAGE_KEY = '@nyuchi_onboarding_complete'

export default function OnboardingScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width: SCREEN_WIDTH } = useWindowDimensions()

  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  // Responsive breakpoints
  const isTablet = SCREEN_WIDTH >= 768

  const styles = createStyles(theme, isTablet, SCREEN_WIDTH)

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    } else {
      finishTour()
    }
  }

  const handleSkip = () => {
    // Go back to welcome without marking as complete
    router.back()
  }

  const finishTour = async () => {
    // Mark onboarding as complete and go to main app
    try {
      await AsyncStorage.setItem(STORAGE_KEY, 'true')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
    router.replace('/(tabs)')
  }

  const renderSlide = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      <View style={styles.slideContent}>
        <View style={[styles.emojiContainer, { backgroundColor: item.color + '20' }]}>
          {item.useMascot ? (
            <Image
              source={require('@/assets/images/mascot-icon.png')}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          ) : (
            <Text style={styles.emoji}>{item.emoji}</Text>
          )}
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={[styles.subtitle, { color: item.color }]}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  )

  const renderPagination = () => (
    <View style={styles.pagination}>
      {ONBOARDING_SLIDES.map((_, index) => {
        const inputRange = [
          (index - 1) * SCREEN_WIDTH,
          index * SCREEN_WIDTH,
          (index + 1) * SCREEN_WIDTH,
        ]

        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        })

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        })

        return (
          <Animated.View
            key={index}
            style={[
              styles.paginationDot,
              {
                width: dotWidth,
                opacity,
                backgroundColor: theme.primary,
              },
            ]}
          />
        )
      })}
    </View>
  )

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        <View style={styles.container}>
          {/* Skip button */}
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/nyuchi-icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoTitle}>Nyuchi Lingo</Text>
          </View>

          {/* Slides */}
          <FlatList
            ref={flatListRef}
            data={ONBOARDING_SLIDES}
            renderItem={renderSlide}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              setCurrentIndex(index)
            }}
            scrollEventThrottle={16}
          />

          {/* Pagination */}
          {renderPagination()}

          {/* Next/Get Started button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={[styles.nextButton, isLastSlide && styles.getStartedButton]}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>
                {isLastSlide ? 'Get Started' : 'Next'}
              </Text>
              {isLastSlide ? (
                <ArrowRight size={20} color="#ffffff" />
              ) : (
                <ChevronRight size={20} color="#ffffff" />
              )}
            </TouchableOpacity>

            {/* Footer */}
            <Text style={styles.footer}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  )
}

const createStyles = (theme: typeof lightTheme, isTablet: boolean, SCREEN_WIDTH: number) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
      paddingTop: 20,
      paddingBottom: 40,
    },
    skipButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      zIndex: 10,
      padding: 8,
    },
    skipText: {
      fontSize: 16,
      color: theme.textMuted,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      marginBottom: 20,
      gap: 10,
    },
    logoIcon: {
      width: 32,
      height: 32,
    },
    logoTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    mascotImage: {
      width: isTablet ? 120 : 100,
      height: isTablet ? 120 : 100,
    },
    slide: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 40,
    },
    slideContent: {
      alignItems: 'center',
      maxWidth: isTablet ? 500 : SCREEN_WIDTH - 80,
    },
    emojiContainer: {
      width: isTablet ? 140 : 120,
      height: isTablet ? 140 : 120,
      borderRadius: isTablet ? 70 : 60,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 32,
    },
    emoji: {
      fontSize: isTablet ? 64 : 56,
    },
    title: {
      fontSize: isTablet ? 32 : 28,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 16,
    },
    description: {
      fontSize: isTablet ? 17 : 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: isTablet ? 26 : 24,
    },
    pagination: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginVertical: 24,
    },
    paginationDot: {
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
    },
    bottomSection: {
      paddingHorizontal: isTablet ? 80 : 40,
      alignItems: 'center',
    },
    nextButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.primary[600],
      paddingVertical: 16,
      paddingHorizontal: 32,
      borderRadius: 12,
      gap: 8,
      width: '100%',
      maxWidth: isTablet ? 400 : undefined,
    },
    getStartedButton: {
      backgroundColor: Colors.secondary[800],
    },
    nextButtonText: {
      color: '#ffffff',
      fontSize: 17,
      fontWeight: '600',
    },
    footer: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 20,
      paddingHorizontal: isTablet ? 40 : 0,
    },
  })
