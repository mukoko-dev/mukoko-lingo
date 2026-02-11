import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { ArrowLeft, ExternalLink, FileText, Mail } from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'

const SECTIONS = [
  {
    title: 'Acceptance of Terms',
    content: `By accessing or using Mukoko Lingo, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.`,
  },
  {
    title: 'Description of Service',
    content: `Mukoko Lingo is an AI-powered language learning platform that provides:
• Native phrase learning in multiple languages
• AI tutoring with Shamwari, our language assistant
• Progress tracking and skills assessment
• Educational content and cultural insights

The service may be updated, modified, or discontinued at any time.`,
  },
  {
    title: 'User Accounts',
    content: `When creating an account, you agree to:
• Provide accurate and complete information
• Maintain the security of your account credentials
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized access

We reserve the right to suspend or terminate accounts that violate these terms.`,
  },
  {
    title: 'Acceptable Use',
    content: `You agree NOT to:
• Use the service for any unlawful purpose
• Attempt to gain unauthorized access to the service
• Interfere with or disrupt the service
• Upload malicious content or spam
• Misuse AI features for inappropriate content generation
• Share your account with others
• Reverse engineer or copy the service`,
  },
  {
    title: 'Intellectual Property',
    content: `All content, features, and functionality of Mukoko Lingo are owned by Nyuchi Africa and are protected by international copyright, trademark, and other intellectual property laws.

You may not reproduce, distribute, or create derivative works without our express written permission.`,
  },
  {
    title: 'AI Features & Content',
    content: `Our AI tutor (Shamwari) is designed to assist with language learning. By using AI features, you understand that:
• AI responses are generated and may not always be perfect
• AI should not be used for professional translation services
• We moderate AI interactions for safety and quality
• You should not share sensitive personal information with AI`,
  },
  {
    title: 'User Content',
    content: `Any content you create or submit through the service:
• Remains your intellectual property
• Grants us a license to use it for service improvement
• Must not violate any third-party rights
• May be moderated for safety and appropriateness`,
  },
  {
    title: 'Disclaimers',
    content: `THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. We do not guarantee:
• Uninterrupted or error-free service
• Accuracy of all educational content
• Fluency achievement in any timeframe
• Compatibility with all devices`,
  },
  {
    title: 'Limitation of Liability',
    content: `To the maximum extent permitted by law, Nyuchi Africa shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.`,
  },
  {
    title: 'Changes to Terms',
    content: `We may modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms. We will notify users of significant changes via email or in-app notification.`,
  },
  {
    title: 'Governing Law',
    content: `These terms shall be governed by and construed in accordance with applicable laws. Any disputes shall be resolved through appropriate legal channels.`,
  },
]

const CONTACT_EMAIL = 'legal@mukoko.com'
const FULL_TERMS_URL = 'https://lingo.mukoko.com/terms'

export default function TermsOfServiceScreen() {
  const router = useRouter()
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme

  const styles = createStyles(theme)

  const openFullTerms = async () => {
    try {
      await Linking.openURL(FULL_TERMS_URL)
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
          headerTitle: 'Terms of Service',
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
            <FileText size={32} color={Colors.secondary[500]} />
          </View>
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <Text style={styles.headerSubtitle}>
            Please read these terms carefully before using Mukoko Lingo.
          </Text>
          <Text style={styles.lastUpdated}>Last updated: December 2024</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionNumber}>{index + 1}.</Text>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Contact Section */}
        <View style={styles.contactSection}>
          <Text style={styles.contactTitle}>Questions?</Text>
          <Text style={styles.contactText}>
            If you have any questions about these Terms of Service, please contact us:
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Mail size={20} color={Colors.primary[600]} />
            <Text style={styles.contactButtonText}>{CONTACT_EMAIL}</Text>
          </TouchableOpacity>
        </View>

        {/* Full Terms Link */}
        <TouchableOpacity style={styles.fullTermsButton} onPress={openFullTerms}>
          <Text style={styles.fullTermsText}>View Full Terms of Service</Text>
          <ExternalLink size={16} color={Colors.primary[600]} />
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
      backgroundColor: Colors.secondary[500] + '15',
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
    sectionNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.primary[600],
      marginBottom: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 12,
    },
    sectionContent: {
      fontSize: 15,
      color: theme.textSecondary,
      lineHeight: 24,
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
      color: Colors.primary[600],
      fontWeight: '500',
    },
    fullTermsButton: {
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
      borderColor: Colors.primary[600],
    },
    fullTermsText: {
      fontSize: 16,
      color: Colors.primary[600],
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
