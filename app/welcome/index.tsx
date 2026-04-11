import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  ArrowRight,
  BookOpen,
  MessageCircle,
  Globe,
  Mic,
  BarChart3,
  Heart,
  Briefcase,
  Plane,
  Users,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { useUILanguage } from '@/lib/hooks/useUILanguage'
import { lightTheme, darkTheme } from '@/constants/Colors'
import { AppHeader } from '@/components/AppHeader'

const ONBOARDING_KEY = '@mukoko_onboarding_complete'

export default function WelcomeScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const { t } = useUILanguage()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const isTablet = width >= 768
  const isDesktop = width >= 1024

  const STATS = [
    { value: '100+', label: t.essentialPhrases || 'Essential Phrases' },
    { value: '4', label: t.languages || 'Languages' },
    { value: 'AI', label: t.poweredTutor || 'Powered Tutor' },
    { value: 'Free', label: t.freeToStart || 'To Start' },
  ]

  const FEATURES = [
    {
      icon: Globe,
      title: t.feat4Languages || '4 Languages Side-by-Side',
      description: t.feat4LanguagesDesc || 'Learn Shona, Ndebele, English, and Chinese with comparisons',
      color: theme.primary,
    },
    {
      icon: MessageCircle,
      title: t.featAIConversation || 'AI Conversation Practice',
      description: t.featAIConversationDesc || 'Adaptive tutoring matching your skill level',
      color: theme.secondary,
    },
    {
      icon: BookOpen,
      title: t.featPhrases || '100+ Essential Phrases',
      description: t.featPhrasesDesc || 'Real-world vocabulary across multiple contexts',
      color: theme.accent,
    },
    {
      icon: Mic,
      title: t.featPronunciation || 'Pronunciation Guides',
      description: t.featPronunciationDesc || 'Phonetic instruction for all four languages',
      color: theme.primary,
    },
    {
      icon: BarChart3,
      title: t.featProgress || 'Progress Tracking',
      description: t.featProgressDesc || 'Analytics, streaks, and personalized suggestions',
      color: theme.secondary,
    },
    {
      icon: Heart,
      title: t.featCulture || 'Cultural Context',
      description: t.featCultureDesc || 'Usage examples and situational appropriateness',
      color: theme.accent,
    },
  ]

  const USE_CASES = [
    {
      icon: Plane,
      title: t.useCaseTourists || 'Tourists & Travelers',
      description: t.useCaseTouristsDesc || 'Navigation, greetings, shopping, emergencies',
      color: theme.accent,
    },
    {
      icon: Briefcase,
      title: t.useCaseBusiness || 'Business & Expats',
      description: t.useCaseBusinessDesc || 'Professional communication and cultural integration',
      color: theme.primary,
    },
    {
      icon: Users,
      title: t.useCaseLocals || 'Locals',
      description: t.useCaseLocalsDesc || 'General language mastery and skill building',
      color: theme.secondary,
    },
  ]

  const styles = createStyles(theme, isDark, isTablet, isDesktop)

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true')
    } catch (error) {
      console.error('Error saving onboarding status:', error)
    }
  }

  const handleGetStarted = async () => {
    await markOnboardingComplete()
    router.push('/auth')
  }

  const handleExploreFeatures = () => {
    router.push('/onboarding')
  }

  const handleSignIn = () => {
    router.push('/auth')
  }

  const handleContinueAsGuest = async () => {
    await markOnboardingComplete()
    router.replace('/(tabs)')
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Shared Header Component */}
        <AppHeader isAuthenticated={false} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentWrapper}>
            {/* Hero Section */}
            <View style={styles.hero}>
              <Text style={styles.heroTitle}>{t.welcomeTitle || 'Language learning,\nbuilt for Africa'}</Text>
              <Text style={styles.heroDescription}>
                {t.welcomeDescription || 'Master Shona, Ndebele, English, and Chinese with AI-powered tools. Perfect for tourists, expats, business professionals, and locals.'}
              </Text>
            </View>

            {/* Stats Bar */}
            <View style={styles.statsBar}>
              {STATS.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>

            {/* Primary CTAs */}
            <View style={styles.ctaSection}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleGetStarted}>
                <Text style={styles.primaryButtonText}>{t.startForFree || 'Start for free'}</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.secondaryButton} onPress={handleExploreFeatures}>
                <Text style={styles.secondaryButtonText}>{t.exploreFeatures || 'Explore features'}</Text>
              </TouchableOpacity>
            </View>

            {/* Features Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.features || 'Features'}</Text>
              <View style={styles.featuresGrid}>
                {FEATURES.map((feature, index) => {
                  const Icon = feature.icon
                  return (
                    <View key={index} style={styles.featureCard}>
                      <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                        <Icon size={22} color={feature.color} />
                      </View>
                      <Text style={styles.featureTitle}>{feature.title}</Text>
                      <Text style={styles.featureDescription}>{feature.description}</Text>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Use Cases Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.perfectFor || 'Perfect for'}</Text>
              <View style={styles.useCasesContainer}>
                {USE_CASES.map((useCase, index) => {
                  const Icon = useCase.icon
                  return (
                    <View key={index} style={styles.useCaseCard}>
                      <View style={[styles.useCaseIcon, { backgroundColor: useCase.color + '20' }]}>
                        <Icon size={28} color={useCase.color} />
                      </View>
                      <View style={styles.useCaseContent}>
                        <Text style={styles.useCaseTitle}>{useCase.title}</Text>
                        <Text style={styles.useCaseDescription}>{useCase.description}</Text>
                      </View>
                    </View>
                  )
                })}
              </View>
            </View>

            {/* Secondary Actions */}
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
                <Text style={styles.signInButtonText}>{t.alreadyHaveAccount || 'Already have an account? Sign in'}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.guestButton} onPress={handleContinueAsGuest}>
                <Text style={styles.guestButtonText}>{t.continueAsGuest || 'Continue as Guest'}</Text>
              </TouchableOpacity>
            </View>

            {/* Ubuntu Quote */}
            <View style={styles.quoteSection}>
              <Text style={styles.quoteText}>"I am because we are"</Text>
              <Text style={styles.quoteAuthor}>— Ubuntu</Text>
            </View>

            {/* Footer Links */}
            <View style={styles.footer}>
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={() => router.push('/about')}>
                  <Text style={styles.footerLink}>{t.about || 'About'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/legal/privacy')}>
                  <Text style={styles.footerLink}>{t.privacy || 'Privacy'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/legal/terms')}>
                  <Text style={styles.footerLink}>{t.terms || 'Terms'}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.copyright}>© 2025 Nyuchi Learning</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean, isDesktop: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      paddingBottom: 40,
    },
    contentWrapper: {
      maxWidth: isDesktop ? 1200 : isTablet ? 900 : '100%',
      alignSelf: 'center',
      width: '100%',
    },
    hero: {
      alignItems: 'center',
      paddingHorizontal: isTablet ? 48 : 24,
      paddingTop: isTablet ? 48 : 32,
      paddingBottom: isTablet ? 48 : 32,
    },
    heroTitle: {
      fontSize: isTablet ? 48 : 32,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 16,
      lineHeight: isTablet ? 58 : 40,
    },
    heroDescription: {
      fontSize: isTablet ? 18 : 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: isTablet ? 28 : 24,
      paddingHorizontal: 8,
      maxWidth: 600,
    },
    statsBar: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      backgroundColor: theme.card,
      marginHorizontal: isTablet ? 48 : 24,
      borderRadius: 16,
      paddingVertical: isTablet ? 28 : 20,
      paddingHorizontal: isTablet ? 16 : 8,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: theme.border,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: isTablet ? 28 : 24,
      fontWeight: '700',
      color: theme.primary,
    },
    statLabel: {
      fontSize: isTablet ? 14 : 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    ctaSection: {
      paddingHorizontal: isTablet ? 48 : 24,
      gap: 12,
      marginBottom: 40,
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'center',
      alignItems: 'center',
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 16,
      paddingHorizontal: isTablet ? 32 : 24,
      borderRadius: 12,
      gap: 8,
      width: isTablet ? 'auto' : '100%',
      minWidth: isTablet ? 200 : undefined,
    },
    primaryButtonText: {
      color: '#ffffff',
      fontSize: 17,
      fontWeight: '600',
    },
    secondaryButton: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      paddingVertical: 16,
      paddingHorizontal: isTablet ? 32 : 24,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
      width: isTablet ? 'auto' : '100%',
      minWidth: isTablet ? 200 : undefined,
    },
    secondaryButtonText: {
      color: theme.primary,
      fontSize: 17,
      fontWeight: '600',
    },
    section: {
      paddingHorizontal: isTablet ? 48 : 24,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: isTablet ? 28 : 22,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
      textAlign: isTablet ? 'center' : 'left',
    },
    featuresGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: isTablet ? 'center' : 'flex-start',
    },
    featureCard: {
      width: isDesktop ? '30%' : isTablet ? '31%' : '48%',
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: isTablet ? 20 : 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    featureIcon: {
      width: isTablet ? 52 : 44,
      height: isTablet ? 52 : 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    featureTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    featureDescription: {
      fontSize: isTablet ? 14 : 12,
      color: theme.textSecondary,
      lineHeight: isTablet ? 20 : 18,
    },
    useCasesContainer: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'center',
    },
    useCaseCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flex: isTablet ? 1 : undefined,
      maxWidth: isTablet ? 320 : undefined,
    },
    useCaseIcon: {
      width: isTablet ? 64 : 56,
      height: isTablet ? 64 : 56,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    useCaseContent: {
      flex: 1,
    },
    useCaseTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    useCaseDescription: {
      fontSize: isTablet ? 15 : 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    secondaryActions: {
      paddingHorizontal: isTablet ? 48 : 24,
      gap: 8,
      marginBottom: 32,
      alignItems: 'center',
    },
    signInButton: {
      alignItems: 'center',
      paddingVertical: 12,
    },
    signInButtonText: {
      color: theme.primary,
      fontSize: 15,
      fontWeight: '500',
    },
    guestButton: {
      alignItems: 'center',
      paddingVertical: 8,
    },
    guestButtonText: {
      color: theme.textMuted,
      fontSize: 14,
      textDecorationLine: 'underline',
    },
    quoteSection: {
      alignItems: 'center',
      paddingVertical: 24,
      marginHorizontal: isTablet ? 48 : 24,
      marginBottom: 24,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    quoteText: {
      fontSize: isTablet ? 22 : 18,
      fontStyle: 'italic',
      color: theme.text,
      marginBottom: 4,
    },
    quoteAuthor: {
      fontSize: 14,
      color: theme.textMuted,
    },
    footer: {
      alignItems: 'center',
      paddingHorizontal: 24,
    },
    footerLinks: {
      flexDirection: 'row',
      gap: 24,
      marginBottom: 12,
    },
    footerLink: {
      fontSize: 14,
      color: theme.primary,
    },
    copyright: {
      fontSize: 12,
      color: theme.textMuted,
    },
  })
