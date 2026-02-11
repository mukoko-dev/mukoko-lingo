import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { ArrowLeft, ExternalLink, Shield, Mail } from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme } from '@/constants/Colors'

const SECTIONS = [
  {
    title: 'Information We Collect',
    content: [
      'Account information (email, name) when you create an account',
      'Learning progress and activity data',
      'Device information for app functionality',
      'Usage analytics to improve the app experience',
    ],
  },
  {
    title: 'How We Use Your Information',
    content: [
      'To provide personalized language learning experiences',
      'To track your learning progress across devices',
      'To improve our AI tutoring capabilities',
      'To send you relevant learning reminders (if enabled)',
      'To analyze and improve app performance',
    ],
  },
  {
    title: 'Data Storage & Security',
    content: [
      'Your data is stored securely using industry-standard encryption',
      'We use MongoDB and Stytch for secure authentication and data storage',
      'AI conversations are processed securely and not shared with third parties',
      'We implement appropriate security measures to protect your information',
    ],
  },
  {
    title: 'Your Rights',
    content: [
      'Access your personal data at any time',
      'Request correction of inaccurate data',
      'Delete your account and associated data',
      'Export your learning progress data',
      'Opt out of analytics and marketing communications',
    ],
  },
  {
    title: 'Third-Party Services',
    content: [
      'We use analytics services to understand app usage',
      'AI features are powered by secure cloud services',
      'We do not sell your personal information to third parties',
      'Third-party services comply with applicable privacy regulations',
    ],
  },
  {
    title: 'Children\'s Privacy',
    content: [
      'Our service is not directed to children under 13',
      'We do not knowingly collect data from children under 13',
      'Parents should supervise their children\'s use of the app',
    ],
  },
]

const CONTACT_EMAIL = 'privacy@mukoko.com'
const FULL_POLICY_URL = 'https://lingo.mukoko.com/privacy'

export default function PrivacyPolicyScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  const styles = createStyles(theme)

  const openFullPolicy = async () => {
    try {
      await Linking.openURL(FULL_POLICY_URL)
    } catch (error) {
      console.error('Error opening URL:', error)
    }
  }

  const openEmail = async () => {
    try {
      await Linking.openURL(`mailto:${CONTACT_EMAIL}`)
    } catch (error) {
      console.error('Error opening email:', error)
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Privacy Policy',
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Shield size={32} color={theme.primary} />
          </View>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <Text style={styles.headerSubtitle}>
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: December 2024</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.content.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{item}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions or Concerns?</Text>
          <Text style={styles.contactText}>
            If you have any questions about this Privacy Policy, please contact us:
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Mail size={20} color={theme.primary} />
            <Text style={styles.contactButtonText}>{CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        {/* Full Policy Link */}
        <TouchableOpacity style={styles.fullPolicyButton} onPress={openFullPolicy}>
          <Text style={styles.fullPolicyText}>View Full Privacy Policy</Text>
          <ExternalLink size={16} color={theme.primary} />
        </TouchableOpacity>

        {/* Footer */}
        <Text style={styles.footer}>
          © 2024 Nyuchi Learning. All rights reserved.
        </Text>
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
      paddingBottom: 40,
    },
    header: {
      alignItems: 'center',
      paddingVertical: 32,
      paddingHorizontal: 24,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerIcon: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: theme.primary + '15',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 12,
    },
    headerSubtitle: {
      fontSize: 15,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 12,
    },
    lastUpdated: {
      fontSize: 13,
      color: theme.textMuted,
    },
    section: {
      paddingHorizontal: 24,
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    bullet: {
      fontSize: 15,
      color: theme.primary,
      marginRight: 8,
      marginTop: 2,
    },
    bulletText: {
      flex: 1,
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 22,
    },
    contactSection: {
      padding: 24,
      backgroundColor: theme.card,
      marginHorizontal: 24,
      marginTop: 24,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    contactTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    contactText: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 16,
      lineHeight: 20,
    },
    contactButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    contactButtonText: {
      fontSize: 15,
      color: theme.primary,
      fontWeight: '500',
    },
    fullPolicyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 16,
      marginHorizontal: 24,
      marginTop: 24,
      backgroundColor: theme.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.primary,
    },
    fullPolicyText: {
      fontSize: 16,
      color: theme.primary,
      fontWeight: '600',
    },
    footer: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 24,
      paddingHorizontal: 24,
    },
  })
