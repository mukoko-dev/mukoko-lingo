import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  User,
  Globe,
  Moon,
  Bell,
  Download,
  HelpCircle,
  LogOut,
  ChevronRight,
  Shield,
  Heart,
} from 'lucide-react-native'

import { useColorScheme } from '@/components/useColorScheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { getCurrentUser, signOut } from '@/lib/supabase/client'
import { getStudyStreak, getStudySessions } from '@/lib/storage/database'

type UILanguage = 'en' | 'sn' | 'nd' | 'sw' | 'zh'

const LANGUAGES: { code: UILanguage; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'sn', name: 'Shona', nativeName: 'chiShona' },
  { code: 'nd', name: 'Ndebele', nativeName: 'isiNdebele' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
]

export default function ProfileScreen() {
  const colorScheme = useColorScheme()
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme
  const router = useRouter()

  const [user, setUser] = useState<any>(null)
  const [streak, setStreak] = useState(0)
  const [sessionsCount, setSessions] = useState(0)
  const [uiLanguage, setUILanguage] = useState<UILanguage>('en')
  const [notifications, setNotifications] = useState(true)
  const [offlineMode, setOfflineMode] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [currentUser, studyStreak, sessions] = await Promise.all([
      getCurrentUser(),
      getStudyStreak(),
      getStudySessions(),
    ])
    setUser(currentUser)
    setStreak(studyStreak)
    setSessions(sessions.length)
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
            router.replace('/auth')
          },
        },
      ]
    )
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
          <Text style={styles.statValue}>5</Text>
          <Text style={styles.statLabel}>Languages</Text>
        </View>
      </View>

      {/* Settings Sections */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Globe size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>UI Language</Text>
            <Text style={styles.settingValue}>
              {LANGUAGES.find(l => l.code === uiLanguage)?.name}
            </Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <View style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Moon size={20} color={Colors.primary[600]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingValue}>
              {colorScheme === 'dark' ? 'On' : 'Off'}
            </Text>
          </View>
          <Text style={styles.settingNote}>System</Text>
        </View>

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

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <HelpCircle size={20} color={Colors.secondary[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Help Center</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Shield size={20} color={Colors.secondary[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingIcon}>
            <Heart size={20} color={Colors.accent[500]} />
          </View>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>About Nyuchi Lingo</Text>
          </View>
          <ChevronRight size={20} color={theme.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      {/* Version */}
      <Text style={styles.version}>Nyuchi Lingo v1.0.0</Text>
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
      color: Colors.error,
    },
    version: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.textMuted,
      marginBottom: 32,
    },
  })
