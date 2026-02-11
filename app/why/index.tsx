import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Globe,
  Heart,
  Layers,
  BarChart3,
  Briefcase,
  GraduationCap,
  Plane,
  Sparkles,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { AppHeader } from '@/components/AppHeader'

const PROBLEMS = [
  {
    title: 'Communication Barriers',
    description: 'In an increasingly connected Africa, the ability to communicate across languages is no longer optional—it\'s essential.',
  },
  {
    title: 'Existing Apps Fall Short',
    description: 'Traditional language platforms focus on European languages and teach formal grammar rather than colloquial phrases people actually use in daily life.',
  },
]

const SOLUTIONS = [
  {
    icon: CheckCircle,
    title: 'Practical & Real',
    description: 'Learn phrases relevant to modern conversations, not outdated textbook examples.',
    color: Colors.success[500],
  },
  {
    icon: Heart,
    title: 'Culturally Authentic',
    description: 'Context-aware instruction explaining when and how to use each phrase appropriately.',
    color: Colors.accent[600],
  },
  {
    icon: Layers,
    title: 'Multi-Language Comparison',
    description: 'Side-by-side viewing with pronunciation guides for pattern recognition.',
    color: Colors.primary[600],
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    description: 'Analytics, bookmarks, and cross-device synchronization to track your journey.',
    color: Colors.secondary[800],
  },
]

const LANGUAGES = [
  {
    name: 'English',
    description: 'Global business and technology language',
    color: Colors.primary[600],
  },
  {
    name: 'Shona',
    description: 'Spoken by 10+ million in Zimbabwe and surrounding regions',
    color: Colors.secondary[800],
  },
  {
    name: 'Ndebele',
    description: 'Important for Zimbabwe and South Africa cultural access',
    color: Colors.accent[600],
  },
  {
    name: 'Chinese',
    description: 'Growing economic presence in Africa',
    color: Colors.primary[700],
  },
]

const AUDIENCES = [
  { icon: Briefcase, title: 'Business Professionals', color: Colors.primary[600] },
  { icon: GraduationCap, title: 'Students & Academics', color: Colors.secondary[800] },
  { icon: Plane, title: 'Travelers & Expats', color: Colors.accent[600] },
  { icon: Sparkles, title: 'Language Enthusiasts', color: Colors.primary[700] },
]

export default function WhyScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const isTablet = width >= 768
  const isDesktop = width >= 1024

  const styles = createStyles(theme, isDark, isTablet, isDesktop)

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

        {/* Shared Header Component */}
        <AppHeader isAuthenticated={false} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Why Mukoko Lingo?</Text>
            <Text style={styles.heroTagline}>
              The bridge between cultures, powered by language learning that actually works.
            </Text>
          </View>

          {/* Problem Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>The Challenge</Text>
            <View style={styles.problemsList}>
              {PROBLEMS.map((problem, index) => (
                <View key={index} style={styles.problemCard}>
                  <View style={styles.problemIcon}>
                    <AlertCircle size={24} color={Colors.accent[600]} />
                  </View>
                  <View style={styles.problemContent}>
                    <Text style={styles.problemTitle}>{problem.title}</Text>
                    <Text style={styles.problemDescription}>{problem.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Solution Section */}
          <View style={[styles.section, styles.solutionSection]}>
            <Text style={styles.sectionTitle}>Built Different, Built Better</Text>
            <Text style={styles.sectionSubtitle}>
              We designed Mukoko Lingo to solve real communication challenges.
            </Text>
            <View style={styles.solutionsGrid}>
              {SOLUTIONS.map((solution, index) => {
                const Icon = solution.icon
                return (
                  <View key={index} style={styles.solutionCard}>
                    <View style={[styles.solutionIcon, { backgroundColor: solution.color + '20' }]}>
                      <Icon size={22} color={solution.color} />
                    </View>
                    <Text style={styles.solutionTitle}>{solution.title}</Text>
                    <Text style={styles.solutionDescription}>{solution.description}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Languages Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Why These Languages?</Text>
            <Text style={styles.sectionSubtitle}>
              Strategically chosen for their importance in tourism, business, education, and cultural exchange.
            </Text>
            <View style={styles.languagesList}>
              {LANGUAGES.map((lang, index) => (
                <View key={index} style={styles.languageCard}>
                  <View style={[styles.languageBadge, { backgroundColor: lang.color }]}>
                    <Text style={styles.languageBadgeText}>{lang.name}</Text>
                  </View>
                  <Text style={styles.languageDescription}>{lang.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Audience Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who It's For</Text>
            <View style={styles.audienceGrid}>
              {AUDIENCES.map((audience, index) => {
                const Icon = audience.icon
                return (
                  <View key={index} style={styles.audienceCard}>
                    <View style={[styles.audienceIcon, { backgroundColor: audience.color + '20' }]}>
                      <Icon size={24} color={audience.color} />
                    </View>
                    <Text style={styles.audienceTitle}>{audience.title}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Ready to bridge cultures?</Text>
            <Text style={styles.ctaDescription}>
              Join thousands learning African languages the right way.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/auth')}
            >
              <Text style={styles.ctaButtonText}>Start Learning Free</Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2025 Nyuchi Africa</Text>
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
    container: {
      flex: 1,
      backgroundColor: theme.background,
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
      paddingHorizontal: isTablet ? 48 : 24,
      paddingVertical: isTablet ? 48 : 32,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      alignItems: isTablet ? 'center' : 'flex-start',
    },
    heroTitle: {
      fontSize: isTablet ? 48 : 32,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
      textAlign: isTablet ? 'center' : 'left',
    },
    heroTagline: {
      fontSize: isTablet ? 20 : 18,
      color: Colors.primary[600],
      fontWeight: '500',
      lineHeight: isTablet ? 30 : 26,
      textAlign: isTablet ? 'center' : 'left',
      maxWidth: 600,
    },
    section: {
      paddingHorizontal: isTablet ? 48 : 24,
      paddingVertical: 24,
    },
    solutionSection: {
      backgroundColor: theme.card,
    },
    sectionTitle: {
      fontSize: isTablet ? 28 : 22,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
      textAlign: isTablet ? 'center' : 'left',
    },
    sectionSubtitle: {
      fontSize: isTablet ? 16 : 15,
      color: theme.textSecondary,
      marginBottom: 16,
      lineHeight: 22,
      textAlign: isTablet ? 'center' : 'left',
      maxWidth: 600,
      alignSelf: isTablet ? 'center' : 'flex-start',
    },
    problemsList: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'center',
    },
    problemCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flex: isTablet ? 1 : undefined,
      maxWidth: isTablet ? 450 : undefined,
    },
    problemIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: Colors.accent[600] + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    problemContent: {
      flex: 1,
    },
    problemTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    problemDescription: {
      fontSize: isTablet ? 15 : 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    solutionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: isTablet ? 'center' : 'flex-start',
    },
    solutionCard: {
      width: isDesktop ? '23%' : isTablet ? '48%' : '48%',
      backgroundColor: theme.background,
      borderRadius: 12,
      padding: isTablet ? 20 : 16,
    },
    solutionIcon: {
      width: isTablet ? 52 : 44,
      height: isTablet ? 52 : 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    solutionTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    solutionDescription: {
      fontSize: isTablet ? 14 : 12,
      color: theme.textSecondary,
      lineHeight: 18,
    },
    languagesList: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    languageCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      width: isTablet ? '48%' : '100%',
      maxWidth: isTablet ? 400 : undefined,
    },
    languageBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 16,
    },
    languageBadgeText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '600',
    },
    languageDescription: {
      flex: 1,
      fontSize: isTablet ? 15 : 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    audienceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
      justifyContent: isTablet ? 'center' : 'flex-start',
    },
    audienceCard: {
      width: isDesktop ? '23%' : isTablet ? '23%' : '48%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: isTablet ? 20 : 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
    },
    audienceIcon: {
      width: isTablet ? 60 : 52,
      height: isTablet ? 60 : 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    audienceTitle: {
      fontSize: isTablet ? 15 : 14,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
    },
    ctaSection: {
      alignItems: 'center',
      paddingHorizontal: isTablet ? 48 : 24,
      paddingVertical: isTablet ? 48 : 32,
      marginHorizontal: isTablet ? 48 : 24,
      marginTop: 8,
      backgroundColor: Colors.secondary[800] + '15',
      borderRadius: 20,
    },
    ctaTitle: {
      fontSize: isTablet ? 28 : 22,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    ctaDescription: {
      fontSize: isTablet ? 16 : 15,
      color: theme.textSecondary,
      marginBottom: 20,
      textAlign: 'center',
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Colors.secondary[800],
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 12,
      gap: 8,
    },
    ctaButtonText: {
      color: '#ffffff',
      fontSize: 16,
      fontWeight: '600',
    },
    footer: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 24,
    },
  })
