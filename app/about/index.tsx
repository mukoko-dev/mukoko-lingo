import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Image,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import {
  ArrowRight,
  Globe,
  Heart,
  Users,
  Target,
  MessageCircle,
  Shield,
  Plane,
  Briefcase,
  GraduationCap,
  Home,
  ExternalLink,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { AppHeader } from '@/components/AppHeader'

const AUDIENCES = [
  { icon: Plane, title: 'Tourists', description: 'Exploring Zimbabwe', color: Colors.accent[600] },
  { icon: Briefcase, title: 'Expats', description: 'Living & working in Africa', color: Colors.primary[600] },
  { icon: Briefcase, title: 'Business Professionals', description: 'Conducting commerce', color: Colors.secondary[800] },
  { icon: GraduationCap, title: 'Students', description: 'Pursuing education', color: Colors.primary[700] },
  { icon: Home, title: 'Immigrants', description: 'Settling into new homes', color: Colors.accent[500] },
  { icon: Users, title: 'Locals', description: 'Expanding multilingual abilities', color: Colors.secondary[700] },
]

const DIFFERENTIATORS = [
  {
    icon: MessageCircle,
    title: 'Colloquial Focus',
    description: 'Teaching authentic everyday communication rather than formal textbook language.',
    color: Colors.primary[600],
  },
  {
    icon: Globe,
    title: 'Side-by-Side Comparison',
    description: 'Presenting all four languages simultaneously with pronunciation guides and cultural context.',
    color: Colors.secondary[800],
  },
  {
    icon: Heart,
    title: 'Built for Africa',
    description: 'Designed specifically for African learners with cultural and linguistic understanding.',
    color: Colors.accent[600],
  },
]

const URLS = {
  WEBSITE: 'https://lingo.nyuchi.com',
  NYUCHI_LEARNING: 'https://learning.nyuchi.com',
}

export default function AboutScreen() {
  const router = useRouter()
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const isTablet = width >= 768
  const isDesktop = width >= 1024

  const styles = createStyles(theme, isDark, isTablet, isDesktop)

  const openURL = async (url: string) => {
    try {
      await Linking.openURL(url)
    } catch (error) {
      console.error('Error opening URL:', error)
    }
  }

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
            <View style={styles.heroLogoContainer}>
              <Image
                source={require('@/assets/images/nyuchi-icon.png')}
                style={styles.heroIcon}
                resizeMode="contain"
              />
              <Text style={styles.heroTitle}>Nyuchi Lingo</Text>
            </View>
            <Text style={styles.heroTagline}>A Nyuchi Learning Initiative</Text>
          </View>

          {/* Mission Section */}
          <View style={styles.section}>
            <View style={styles.missionCard}>
              <View style={styles.missionIcon}>
                <Target size={28} color={Colors.primary[600]} />
              </View>
              <Text style={styles.missionTitle}>Our Mission</Text>
              <Text style={styles.missionText}>
                To empower everyone—tourists, business professionals, students, immigrants, and locals—to communicate effectively across English, Shona, Ndebele, and Chinese.
              </Text>
            </View>
          </View>

          {/* Who We Serve Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who We Serve</Text>
            <View style={styles.audienceGrid}>
              {AUDIENCES.map((audience, index) => {
                const Icon = audience.icon
                return (
                  <View key={index} style={styles.audienceCard}>
                    <View style={[styles.audienceIcon, { backgroundColor: audience.color + '20' }]}>
                      <Icon size={22} color={audience.color} />
                    </View>
                    <View style={styles.audienceContent}>
                      <Text style={styles.audienceTitle}>{audience.title}</Text>
                      <Text style={styles.audienceDescription}>{audience.description}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Story Section */}
          <View style={[styles.section, styles.storySection]}>
            <Text style={styles.sectionTitle}>Our Story</Text>
            <Text style={styles.storyText}>
              Nyuchi Lingo was founded to address practical language education needs across Zimbabwe and Southern Africa. Whether you're navigating Victoria Falls as a tourist or negotiating business deals in Harare, we provide the language skills you need.
            </Text>
            <Text style={styles.storyText}>
              Language learning should be accessible to everyone, regardless of whether you're visiting for a week, conducting business for a month, studying for a semester, or building a life here permanently.
            </Text>
          </View>

          {/* Differentiators Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What Makes Us Different</Text>
            <View style={styles.differentiatorsList}>
              {DIFFERENTIATORS.map((item, index) => {
                const Icon = item.icon
                return (
                  <View key={index} style={styles.differentiatorCard}>
                    <View style={[styles.differentiatorIcon, { backgroundColor: item.color + '20' }]}>
                      <Icon size={24} color={item.color} />
                    </View>
                    <View style={styles.differentiatorContent}>
                      <Text style={styles.differentiatorTitle}>{item.title}</Text>
                      <Text style={styles.differentiatorDescription}>{item.description}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Links Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Learn More</Text>
            <View style={styles.linksList}>
              <TouchableOpacity style={styles.linkCard} onPress={() => openURL(URLS.WEBSITE)}>
                <View style={styles.linkIcon}>
                  <Globe size={22} color={Colors.primary[600]} />
                </View>
                <Text style={styles.linkText}>Visit Website</Text>
                <ExternalLink size={18} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkCard} onPress={() => openURL(URLS.NYUCHI_LEARNING)}>
                <View style={styles.linkIcon}>
                  <Heart size={22} color={Colors.accent[600]} />
                </View>
                <Text style={styles.linkText}>Nyuchi Learning</Text>
                <ExternalLink size={18} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/features')}>
                <View style={styles.linkIcon}>
                  <Target size={22} color={Colors.secondary[800]} />
                </View>
                <Text style={styles.linkText}>Explore Features</Text>
                <ArrowRight size={18} color={theme.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkCard} onPress={() => router.push('/why')}>
                <View style={styles.linkIcon}>
                  <MessageCircle size={22} color={Colors.primary[700]} />
                </View>
                <Text style={styles.linkText}>Why Nyuchi Lingo</Text>
                <ArrowRight size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.copyright}>© 2025 Nyuchi Learning</Text>
            <Text style={styles.tagline}>Language learning, built for Africa.</Text>
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
      alignItems: 'center',
      paddingVertical: isTablet ? 48 : 32,
      paddingHorizontal: isTablet ? 48 : 24,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    heroLogoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    heroIcon: {
      width: isTablet ? 56 : 48,
      height: isTablet ? 56 : 48,
    },
    heroTitle: {
      fontSize: isTablet ? 36 : 28,
      fontWeight: '700',
      color: theme.text,
    },
    heroTagline: {
      fontSize: isTablet ? 18 : 16,
      color: Colors.primary[600],
      fontWeight: '500',
    },
    section: {
      paddingHorizontal: isTablet ? 48 : 24,
      paddingVertical: 24,
    },
    storySection: {
      backgroundColor: theme.card,
    },
    sectionTitle: {
      fontSize: isTablet ? 28 : 22,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 16,
      textAlign: isTablet ? 'center' : 'left',
    },
    missionCard: {
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: isTablet ? 32 : 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.border,
      maxWidth: isTablet ? 700 : undefined,
      alignSelf: isTablet ? 'center' : 'stretch',
    },
    missionIcon: {
      width: isTablet ? 72 : 60,
      height: isTablet ? 72 : 60,
      borderRadius: 16,
      backgroundColor: Colors.primary[600] + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    missionTitle: {
      fontSize: isTablet ? 24 : 20,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    missionText: {
      fontSize: isTablet ? 17 : 16,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: isTablet ? 26 : 24,
    },
    audienceGrid: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    audienceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
      width: isTablet ? '48%' : '100%',
      maxWidth: isTablet ? 380 : undefined,
    },
    audienceIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    audienceContent: {
      flex: 1,
    },
    audienceTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.text,
    },
    audienceDescription: {
      fontSize: 13,
      color: theme.textSecondary,
    },
    storyText: {
      fontSize: isTablet ? 16 : 15,
      color: theme.textSecondary,
      lineHeight: isTablet ? 26 : 24,
      marginBottom: 16,
      textAlign: isTablet ? 'center' : 'left',
      maxWidth: 700,
      alignSelf: isTablet ? 'center' : 'flex-start',
    },
    differentiatorsList: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      justifyContent: 'center',
    },
    differentiatorCard: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      flex: isTablet ? 1 : undefined,
      maxWidth: isTablet ? 350 : undefined,
    },
    differentiatorIcon: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    differentiatorContent: {
      flex: 1,
    },
    differentiatorTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    differentiatorDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    linksList: {
      gap: 12,
      flexDirection: isTablet ? 'row' : 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    linkCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      width: isTablet ? '48%' : '100%',
      maxWidth: isTablet ? 350 : undefined,
    },
    linkIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    linkText: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      fontWeight: '500',
    },
    footer: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 24,
    },
    version: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 4,
    },
    copyright: {
      fontSize: 13,
      color: theme.textMuted,
      marginBottom: 8,
    },
    tagline: {
      fontSize: 14,
      color: theme.textSecondary,
      fontStyle: 'italic',
    },
  })
