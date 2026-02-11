import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Linking,
  Platform,
  ActionSheetIOS,
  Appearance,
  Image,
} from 'react-native'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  User,
  Globe,
  Moon,
  Sun,
  Bell,
  Download,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Heart,
  X,
  Check,
  BookOpen,
} from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { getCurrentUser, signOut } from '@/lib/supabase/client'
import { getStudyStreak, getStudySessions, getBookmarks, getProgress } from '@/lib/storage/database'
import { useLearningLanguage, LEARNING_LANGUAGES, LearningLanguage } from '@/lib/hooks/useLearningLanguage'

type UILanguage = 'en' | 'sn' | 'nd' | 'sw' | 'zh'
type ThemePreference = 'light' | 'dark' | 'system'

const LANGUAGES: { code: UILanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
  { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
]

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

// Storage keys
const STORAGE_KEYS = {
  UI_LANGUAGE: '@mukoko_ui_language',
  THEME_PREFERENCE: '@mukoko_theme_preference',
}

// URLs
const URLS = {
  HELP_CENTER: 'https://support.mukoko.com',
  PRIVACY_POLICY: 'https://lingo.mukoko.com/privacy',
  TERMS: 'https://lingo.mukoko.com/terms',
  WEBSITE: 'https://lingo.mukoko.com',
  ABOUT_PROJECT: 'https://mukoko.com/products/mukoko-lingo',
}

export default function ProfileScreen() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [sessionsCount, setSessions] = useState(0)
  const [bookmarksCount, setBookmarksCount] = useState(0)
  const [masteredCount, setMasteredCount] = useState(0)
  const [uiLanguage, setUILanguage] = useState<UILanguage>('en')
  const [themePreference, setThemePreference] = useState<ThemePreference>('system')
  const [notifications, setNotifications] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  const { learningLanguage, setLearningLanguage, learningLanguageOption } = useLearningLanguage()

  // Modal states
  const [languageModalVisible, setLanguageModalVisible] = useState(false)
  const [learningLanguageModalVisible, setLearningLanguageModalVisible] = useState(false)
  const [themeModalVisible, setThemeModalVisible] = useState(false)
  const [aboutModalVisible, setAboutModalVisible] = useState(false)

  useEffect(() => {
    loadData()
    loadPreferences()
  }, [])

  const loadData = async () => {
    const [currentUser, studyStreak, sessions, bookmarks, progress] = await Promise.all([
      getCurrentUser(),
      getStudyStreak(),
      getStudySessions(),
      getBookmarks(),
      getProgress(),
    ])
    setUser(currentUser)
    setStreak(studyStreak)
    setSessions(sessions.length)
    setBookmarksCount(bookmarks.length)
    setMasteredCount(Object.values(progress).filter(p => p.status === 'mastered').length)
  }

  const loadPreferences = async () => {
    try {
      const [savedLanguage, savedTheme] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.UI_LANGUAGE),
        AsyncStorage.getItem(STORAGE_KEYS.THEME_PREFERENCE),
      ])
      if (savedLanguage) setUILanguage(savedLanguage as UILanguage)
      if (savedTheme) setThemePreference(savedTheme as ThemePreference)
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const handleLanguageChange = async (language: UILanguage) => {
    setUILanguage(language)
    setLanguageModalVisible(false)
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.UI_LANGUAGE, language)
    } catch (error) {
      console.error('Error saving language preference:', error)
    }
  }

  const handleThemeChange = async (preference: ThemePreference) => {
    setThemePreference(preference)
    setThemeModalVisible(false)
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_PREFERENCE, preference)
      // Apply theme change
      if (preference === 'system') {
        Appearance.setColorScheme(null)
      } else {
        Appearance.setColorScheme(preference)
      }
    } catch (error) {
      console.error('Error saving theme preference:', error)
    }
  }

  const openLanguageSelector = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...LANGUAGES.map(l => `${l.name} (${l.nativeName})`)],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            handleLanguageChange(LANGUAGES[buttonIndex - 1].code)
          }
        }
      )
    } else {
      setLanguageModalVisible(true)
    }
  }

  const openThemeSelector = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', ...THEME_OPTIONS.map(t => t.label)],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex > 0) {
            handleThemeChange(THEME_OPTIONS[buttonIndex - 1].value)
          }
        }
      )
    } else {
      setThemeModalVisible(true)
    }
  }

  const openURL = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url)
      if (supported) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open link')
    }
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/auth' as const)
          },
        },
      ]
    )
  }

  const getThemeDisplayValue = () => {
    if (themePreference === 'system') {
      return `System (${colorScheme === 'dark' ? 'Dark' : 'Light'})`
    }
    return themePreference === 'dark' ? 'Dark' : 'Light'
  }

  const styles = createStyles(theme)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <User size={32} color={Colors.primary[600]} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.userName}>
            {user?.email?.split('@')[0] || 'Language Learner'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'Sign in to sync progress'}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{streak}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessionsCount}</Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{masteredCount}</Text>
          <Text style={styles.statLabel}>Mastered</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{bookmarksCount}</Text>
          <Text style={styles.statLabel}>Saved</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TouchableOpacity style={styles.settingItem} onPress={openLanguageSelector}>
          <View style={styles.settingIcon}>
            <Globe size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>UI Language</Text>
            <Text style={styles.settingValue}>
              {LANGUAGES.find(l => l.code === uiLanguage)?.name} ({LANGUAGES.find(l => l.code === uiLanguage)?.nativeName})
            </Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setLearningLanguageModalVisible(true)}>
          <View style={styles.settingIcon}>
            <BookOpen size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Learning Language</Text>
            <Text style={styles.settingValue}>
              {learningLanguageOption.flag} {learningLanguageOption.name} ({learningLanguageOption.nativeName})
            </Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={openThemeSelector}>
          <View style={styles.settingIcon}>
            {colorScheme === 'dark' ? (
              <Moon size={20} color={Colors.primary[600]} />
            ) : (
              <Sun size={20} color={Colors.primary[600]} />
            )}
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Theme</Text>
            <Text style={styles.settingValue}>{getThemeDisplayValue()}</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Bell size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: theme.border, true: Colors.primary[600] }}
            thumbColor="#ffffff"
          />
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Download size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Offline Mode</Text>
            <Text style={styles.settingDescription}>
              Download content for offline learning
            </Text>
          </View>
          <Switch
            value={offlineMode}
            onValueChange={setOfflineMode}
            trackColor={{ false: theme.border, true: Colors.primary[600] }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>

        <TouchableOpacity style={styles.settingItem} onPress={() => openURL(URLS.HELP_CENTER)}>
          <View style={styles.settingIcon}>
            <HelpCircle size={20} color={Colors.secondary[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Help Center</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => openURL(URLS.PRIVACY_POLICY)}>
          <View style={styles.settingIcon}>
            <Shield size={20} color={Colors.secondary[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => openURL(URLS.TERMS)}>
          <View style={styles.settingIcon}>
            <Shield size={20} color={Colors.secondary[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Terms of Service</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem} onPress={() => setAboutModalVisible(true)}>
          <View style={styles.settingIcon}>
            <Heart size={20} color={Colors.accent[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>About Mukoko Lingo</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={Colors.semanticError} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>Mukoko Lingo v1.0.0</Text>

      {/* Language Selection Modal (Android) */}
      <Modal
        visible={languageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Language</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={styles.modalOption}
                onPress={() => handleLanguageChange(lang.code)}
              >
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionText}>{lang.name}</Text>
                  <Text style={styles.modalOptionSubtext}>{lang.nativeName}</Text>
                </View>
                {uiLanguage === lang.code && (
                  <Check size={20} color={Colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Learning Language Selection Modal */}
      <Modal
        visible={learningLanguageModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLearningLanguageModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLearningLanguageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Learning Language</Text>
              <TouchableOpacity onPress={() => setLearningLanguageModalVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            {LEARNING_LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.key}
                style={styles.modalOption}
                onPress={() => {
                  setLearningLanguage(lang.key)
                  setLearningLanguageModalVisible(false)
                }}
              >
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionText}>{lang.flag} {lang.name}</Text>
                  <Text style={styles.modalOptionSubtext}>{lang.nativeName}</Text>
                </View>
                {learningLanguage === lang.key && (
                  <Check size={20} color={Colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Theme Selection Modal (Android) */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Theme</Text>
              <TouchableOpacity onPress={() => setThemeModalVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            {THEME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.modalOption}
                onPress={() => handleThemeChange(option.value)}
              >
                <View style={styles.modalOptionContent}>
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                  {option.value === 'system' && (
                    <Text style={styles.modalOptionSubtext}>Follow device settings</Text>
                  )}
                </View>
                {themePreference === option.value && (
                  <Check size={20} color={Colors.primary[600]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* About Modal */}
      <Modal
        visible={aboutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAboutModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setAboutModalVisible(false)}
        >
          <View style={[styles.modalContent, styles.aboutModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Mukoko Lingo</Text>
              <TouchableOpacity onPress={() => setAboutModalVisible(false)}>
                <X size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutLogo}>
              <Image
                source={require('@/assets/images/icon.png')}
                style={styles.aboutLogoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={styles.aboutName}>Mukoko Lingo</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>

            <Text style={styles.aboutDescription}>
              Mukoko Lingo is an AI-powered language learning platform designed to help you
              master African languages through native phrase learning and personalized AI tutoring.
            </Text>

            <Text style={styles.aboutDescription}>
              Learn Shona, Ndebele, Swahili, Chinese, and English with our friendly AI mascot,
              Shamwari, who adapts to your learning style and pace.
            </Text>

            <View style={styles.aboutLinks}>
              <TouchableOpacity
                style={styles.aboutLink}
                onPress={() => {
                  setAboutModalVisible(false)
                  openURL(URLS.WEBSITE)
                }}
              >
                <Globe size={16} color={Colors.primary[600]} />
                <Text style={styles.aboutLinkText}>Website</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.aboutLink}
                onPress={() => {
                  setAboutModalVisible(false)
                  openURL(URLS.ABOUT_PROJECT)
                }}
              >
                <Heart size={16} color={Colors.accent[500]} />
                <Text style={styles.aboutLinkText}>About Project</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.aboutCopyright}>
              © 2024 Nyuchi Africa. All rights reserved.
            </Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: Colors.primary[600] + '20',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    headerInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      backgroundColor: theme.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 24,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      backgroundColor: theme.border,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
    },
    statLabel: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 4,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textMuted,
      marginBottom: 8,
      marginLeft: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingIcon: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: theme.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    settingContent: {
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.text,
    },
    settingValue: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 2,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.textMuted,
      marginTop: 2,
    },
    settingNote: {
      fontSize: 13,
      color: theme.textMuted,
    },
    signOutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      gap: 8,
    },
    signOutText: {
      fontSize: 16,
      fontWeight: '600',
      color: Colors.semanticError,
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 32,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.text,
    },
    modalOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalOptionContent: {
      flex: 1,
    },
    modalOptionText: {
      fontSize: 16,
      color: theme.text,
    },
    modalOptionSubtext: {
      fontSize: 13,
      color: theme.textMuted,
      marginTop: 2,
    },
    // About modal specific styles
    aboutModalContent: {
      padding: 20,
      paddingTop: 0,
    },
    aboutLogo: {
      alignItems: 'center',
      marginVertical: 20,
    },
    aboutLogoImage: {
      width: 80,
      height: 80,
      borderRadius: 16,
    },
    aboutName: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.text,
      textAlign: 'center',
    },
    aboutVersion: {
      fontSize: 14,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 4,
      marginBottom: 20,
    },
    aboutDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: 16,
    },
    aboutLinks: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 24,
      marginTop: 8,
      marginBottom: 20,
    },
    aboutLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aboutLinkText: {
      fontSize: 14,
      color: Colors.primary[600],
      fontWeight: '500',
    },
    aboutCopyright: {
      fontSize: 12,
      color: theme.textMuted,
      textAlign: 'center',
    },
  })
