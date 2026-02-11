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
  Globe,
  MessageCircle,
  BookOpen,
  BarChart3,
  Bookmark,
  TrendingUp,
  Flame,
  Sparkles,
  Award,
  Heart,
  Users,
  Shield,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { AppHeader } from '@/components/AppHeader'

export default function FeaturesScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const isTablet = width >= 768
  const isDesktop = width >= 1024

  const CORE_FEATURES = [
    {
      icon: Globe,
      title: 'Four Languages Side-by-Side',
      description: 'View English, Shona, Ndebele, and Chinese simultaneously with phonetic pronunciations and cultural context.',
      highlights: [
        'Phonetic pronunciations for each phrase',
        'Cultural context and usage notes',
        'Audio guides (coming soon)',
      ],
      color: theme.primary,
    },
    {
      icon: MessageCircle,
      title: 'AI Conversation Practice',
      description: 'Practice with Shamwari, our AI tutor powered by Claude. Get instant feedback and corrections.',
      highlights: [
        'Adapts to your proficiency level',
        'Scenario-based practice',
        'Instant feedback and corrections',
      ],
      color: theme.secondary,
    },
    {
      icon: BookOpen,
      title: '200+ Essential Phrases',
      description: 'Real-world vocabulary organized by category for practical everyday use.',
      highlights: [
        'Greetings & Basics',
        'Travel & Directions',
        'Business & Professional',
        'Food & Dining',
        'Emergencies',
      ],
      color: theme.accent,
    },
  ]

  const LEARNING_TOOLS = [
    { icon: BarChart3, title: 'Progress Tracking', description: 'Monitor your learning journey', color: theme.primary },
    { icon: Bookmark, title: 'Bookmarks', description: 'Save phrases for later', color: theme.secondary },
    { icon: TrendingUp, title: 'Learning Analytics', description: 'Study statistics & insights', color: theme.accent },
    { icon: Flame, title: 'Study Streaks', description: 'Build learning habits', color: theme.primary },
    { icon: Sparkles, title: 'Smart Recommendations', description: 'AI-powered suggestions', color: Colors.secondary[700] },
    { icon: Award, title: 'Achievements', description: 'Earn badges & rewards', color: theme.accent },
  ]

  const BUILT_FOR_AFRICA = [
    {
      icon: Heart,
      title: 'Cultural Context',
      description: 'Learn from native speakers with authentic cultural understanding',
      color: theme.accent,
    },
    {
      icon: Users,
      title: 'Real Conversations',
      description: 'Authentic language as spoken in daily life, not textbook formality',
      color: theme.primary,
    },
    {
      icon: Shield,
      title: 'Safe & Respectful',
      description: 'A learning environment that honors African languages and cultures',
      color: theme.secondary,
    },
  ]

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
            <Text style={styles.heroTitle}>Everything you need to master Zimbabwe's languages</Text>
            <Text style={styles.heroDescription}>
              AI-powered learning tools designed specifically for African language learners.
            </Text>
          </View>

          {/* Core Features */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Features</Text>
            <View style={styles.coreFeaturesList}>
              {CORE_FEATURES.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <View key={index} style={styles.coreFeatureCard}>
                    <View style={[styles.coreFeatureIcon, { backgroundColor: feature.color + '20' }]}>
                      <Icon size={28} color={feature.color} />
                    </View>
                    <Text style={styles.coreFeatureTitle}>{feature.title}</Text>
                    <Text style={styles.coreFeatureDescription}>{feature.description}</Text>
                    <View style={styles.highlightsList}>
                      {feature.highlights.map((highlight, hIndex) => (
                        <View key={hIndex} style={styles.highlightItem}>
                          <View style={[styles.highlightDot, { backgroundColor: feature.color }]} />
                          <Text style={styles.highlightText}>{highlight}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Learning Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learning Tools</Text>
            <View style={styles.toolsGrid}>
              {LEARNING_TOOLS.map((tool, index) => {
                const Icon = tool.icon
                return (
                  <View key={index} style={styles.toolCard}>
                    <View style={[styles.toolIcon, { backgroundColor: tool.color + '20' }]}>
                      <Icon size={22} color={tool.color} />
                    </View>
                    <Text style={styles.toolTitle}>{tool.title}</Text>
                    <Text style={styles.toolDescription}>{tool.description}</Text>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Built for Africa */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Built for Africa</Text>
            <Text style={styles.sectionSubtitle}>
              Designed with cultural understanding and respect for African languages.
            </Text>
            <View style={styles.africaList}>
              {BUILT_FOR_AFRICA.map((item, index) => {
                const Icon = item.icon
                return (
                  <View key={index} style={styles.africaCard}>
                    <View style={[styles.africaIcon, { backgroundColor: item.color + '20' }]}>
                      <Icon size={24} color={item.color} />
                    </View>
                    <View style={styles.africaContent}>
                      <Text style={styles.africaTitle}>{item.title}</Text>
                      <Text style={styles.africaDescription}>{item.description}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaSection}>
            <Text style={styles.ctaTitle}>Start learning today</Text>
            <Text style={styles.ctaDescription}>
              Free to start. No credit card required.
            </Text>
            <TouchableOpacity
              style={styles.ctaButton}
              onPress={() => router.push('/auth')}
            >
              <Text style={styles.ctaButtonText}>Get Started Free</Text>
              <ArrowRight size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <Text style={styles.footer}>© 2025 Nyuchi Learning</Text>
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
      fontSize: isTablet ? 40 : 28,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
      lineHeight: isTablet ? 50 : 36,
      textAlign: isTablet ? 'center' : 'left',
      maxWidth: 700,
    },
    heroDescription: {
      fontSize: isTablet ? 18 : 16,
      color: theme.textSecondary,
      lineHeight: isTablet ? 28 : 24,
      textAlign: isTablet ? 'center' : 'left',
      maxWidth: 600,
    },
    section: {
      paddingHorizontal: isTablet ? 48 : 24,
      paddingVertical: 24,
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
    coreFeaturesList: {
      gap: 16,
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    coreFeatureCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: isTablet ? 24 : 20,
      borderWidth: 1,
      borderColor: theme.border,
      width: isTablet ? '48%' : '100%',
      maxWidth: isTablet ? 400 : undefined,
    },
    coreFeatureIcon: {
      width: isTablet ? 64 : 56,
      height: isTablet ? 64 : 56,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    coreFeatureTitle: {
      fontSize: isTablet ? 20 : 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    coreFeatureDescription: {
      fontSize: isTablet ? 16 : 15,
      color: theme.textSecondary,
      lineHeight: isTablet ? 24 : 22,
      marginBottom: 16,
    },
    highlightsList: {
      gap: 8,
    },
    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    highlightDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 10,
    },
    highlightText: {
      fontSize: 14,
      color: theme.text,
    },
    toolsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 8,
      justifyContent: isTablet ? 'center' : 'flex-start',
    },
    toolCard: {
      width: isDesktop ? '23%' : isTablet ? '31%' : '48%',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: isTablet ? 20 : 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    toolIcon: {
      width: isTablet ? 48 : 40,
      height: isTablet ? 48 : 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    toolTitle: {
      fontSize: isTablet ? 16 : 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    toolDescription: {
      fontSize: isTablet ? 14 : 12,
      color: theme.textSecondary,
      lineHeight: isTablet ? 20 : 16,
    },
    africaList: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'center',
    },
    africaCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flex: isTablet ? 1 : undefined,
      maxWidth: isTablet ? 350 : undefined,
    },
    africaIcon: {
      width: isTablet ? 56 : 48,
      height: isTablet ? 56 : 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    africaContent: {
      flex: 1,
    },
    africaTitle: {
      fontSize: isTablet ? 18 : 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    africaDescription: {
      fontSize: isTablet ? 15 : 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    ctaSection: {
      alignItems: 'center',
      paddingHorizontal: isTablet ? 48 : 24,
      paddingVertical: isTablet ? 48 : 32,
      marginHorizontal: isTablet ? 48 : 24,
      marginTop: 8,
      backgroundColor: theme.primary + '10',
      borderRadius: 20,
    },
    ctaTitle: {
      fontSize: isTablet ? 28 : 22,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 8,
    },
    ctaDescription: {
      fontSize: isTablet ? 16 : 15,
      color: theme.textSecondary,
      marginBottom: 20,
    },
    ctaButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
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
