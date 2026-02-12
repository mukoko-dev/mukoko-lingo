import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native'
import { useRouter } from 'expo-router'
import {
  ArrowRight,
  Moon,
  Sun,
  Menu,
  X,
  Info,
  HelpCircle,
  Sparkles,
  LogIn,
  UserPlus,
  Monitor,
  User,
  Settings,
  LogOut,
  Home,
  BookOpen,
  MessageCircle,
  Target,
  Shield,
  Search,
  Bell,
} from 'lucide-react-native'

import { MukokoIcon } from '@/components/MukokoIcon'
import { useTheme } from '@/lib/hooks/useTheme'
import { Colors, lightTheme, darkTheme } from '@/constants/Colors'
import { getCurrentUser } from '@/lib/auth/stytch-client'
import { profilesApi } from '@/lib/services/api-client'

const PUBLIC_NAV_LINKS = [
  { label: 'Features', route: '/features', icon: Sparkles },
  { label: 'Why Mukoko', route: '/why', icon: HelpCircle },
  { label: 'About', route: '/about', icon: Info },
]

const AUTH_NAV_LINKS = [
  { label: 'Learn', route: '/(tabs)', icon: BookOpen },
  { label: 'Shamwari', route: '/(tabs)/ai-practice', icon: MessageCircle },
  { label: 'Skills', route: '/(tabs)/skills', icon: Target },
]

interface AppHeaderProps {
  isAuthenticated?: boolean
  onLogout?: () => void
}

export function AppHeader({ isAuthenticated = false, onLogout }: AppHeaderProps) {
  const router = useRouter()
  const { isDark, toggleTheme, themeMode } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const [menuOpen, setMenuOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const { width } = useWindowDimensions()

  // Landscape tablet and above for center nav
  const isLandscapeTablet = width >= 1024
  // Basic tablet for some layout adjustments
  const isTablet = width >= 768

  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated) {
      checkAdminStatus()
    }
  }, [isAuthenticated])

  const checkAdminStatus = async () => {
    try {
      const { user } = await getCurrentUser()
      if (user) {
        const { data: profile } = await profilesApi.getMyProfile()
        setIsAdmin(profile?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const navLinks = isAuthenticated ? AUTH_NAV_LINKS : PUBLIC_NAV_LINKS

  const getThemeIcon = () => {
    if (themeMode === 'light') return <Sun size={20} color={theme.text} />
    if (themeMode === 'dark') return <Moon size={20} color={theme.text} />
    return <Monitor size={20} color={theme.text} />
  }

  const getThemeModeText = () => {
    if (themeMode === 'light') return 'Light Mode'
    if (themeMode === 'dark') return 'Dark Mode'
    return 'System Theme'
  }

  const handleNavLink = (route: string) => {
    setMenuOpen(false)
    router.push(route as any)
  }

  const handleSignIn = () => {
    setMenuOpen(false)
    router.push('/auth')
  }

  const handleGetStarted = () => {
    setMenuOpen(false)
    router.push('/auth')
  }

  const handleLogoPress = () => {
    if (isAuthenticated) {
      router.push('/(tabs)')
    } else {
      router.push('/welcome')
    }
  }

  const handleProfile = () => {
    setMenuOpen(false)
    router.push('/(tabs)/profile')
  }

  const handleAdmin = () => {
    setMenuOpen(false)
    router.push('/admin/overview')
  }

  const handleLogout = () => {
    setMenuOpen(false)
    if (onLogout) {
      onLogout()
    }
    router.replace('/welcome')
  }

  // Icon pill colors
  const pillBg = isDark ? Colors.secondary[800] + 'CC' : Colors.secondary[800]
  const pillIconColor = '#FFFFFF'

  const styles = createStyles(theme, isDark, isTablet, isLandscapeTablet)

  return (
    <>
      {/* Navigation Header */}
      <View style={styles.navbar}>
        {/* LEFT: Icon + Wordmark */}
        <TouchableOpacity style={styles.logoContainer} onPress={handleLogoPress}>
          <View style={styles.iconWrapper}>
            <MukokoIcon size={26} color={theme.primary} />
          </View>
          <View>
            <Text style={styles.wordmark}>mukoko</Text>
            <Text style={styles.wordmarkSub}>lingo</Text>
          </View>
        </TouchableOpacity>

        {/* CENTER: Nav links (landscape tablet+) */}
        {isLandscapeTablet && (
          <View style={styles.centerNav}>
            {navLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.centerNavLink}
                onPress={() => router.push(link.route as any)}
              >
                <Text style={styles.centerNavLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* RIGHT: Icon pill group */}
        <View style={styles.rightGroup}>
          {/* Admin badge - outside pill, tablet+ only */}
          {isAuthenticated && isTablet && isAdmin && (
            <TouchableOpacity style={styles.adminButton} onPress={handleAdmin}>
              <Shield size={16} color={theme.accent} />
              <Text style={styles.adminButtonText}>Admin</Text>
            </TouchableOpacity>
          )}

          {/* Icon pill */}
          <View style={[styles.iconPill, { backgroundColor: pillBg }]}>
            <TouchableOpacity style={styles.pillIcon} onPress={toggleTheme}>
              {themeMode === 'light' && <Sun size={18} color={pillIconColor} />}
              {themeMode === 'dark' && <Moon size={18} color={pillIconColor} />}
              {themeMode === 'system' && <Monitor size={18} color={pillIconColor} />}
            </TouchableOpacity>

            <View style={styles.pillDivider} />

            {isAuthenticated ? (
              <>
                <TouchableOpacity
                  style={styles.pillIcon}
                  onPress={() => router.push('/(tabs)/insights' as any)}
                >
                  <Bell size={18} color={pillIconColor} />
                </TouchableOpacity>

                <View style={styles.pillDivider} />

                <TouchableOpacity style={styles.pillIcon} onPress={handleProfile}>
                  <User size={18} color={pillIconColor} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.pillIcon} onPress={handleSignIn}>
                  <LogIn size={18} color={pillIconColor} />
                </TouchableOpacity>

                <View style={styles.pillDivider} />

                <TouchableOpacity style={styles.pillIcon} onPress={handleGetStarted}>
                  <UserPlus size={18} color={pillIconColor} />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Hamburger menu (below landscape tablet) */}
          {!isLandscapeTablet && (
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(true)}>
              <Menu size={22} color={theme.text} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mobile Menu Modal */}
      <Modal
        visible={menuOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setMenuOpen(false)}
      >
        <SafeAreaView style={styles.menuModal}>
          <View style={styles.menuHeader}>
            <View style={styles.logoContainer}>
              <View style={styles.iconWrapper}>
                <MukokoIcon size={26} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.wordmark}>mukoko</Text>
                <Text style={styles.wordmarkSub}>lingo</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuOpen(false)}>
              <X size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.menuContent}>
            {/* Main navigation links */}
            {navLinks.map((link, index) => {
              const Icon = link.icon
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={() => handleNavLink(link.route)}
                >
                  <Icon size={22} color={theme.primary} />
                  <Text style={styles.menuItemText}>{link.label}</Text>
                </TouchableOpacity>
              )
            })}

            {/* Marketing links for authenticated users */}
            {isAuthenticated && (
              <>
                <View style={styles.menuDivider} />
                <Text style={styles.menuSectionTitle}>Explore</Text>
                {PUBLIC_NAV_LINKS.map((link, index) => {
                  const Icon = link.icon
                  return (
                    <TouchableOpacity
                      key={`public-${index}`}
                      style={styles.menuItem}
                      onPress={() => handleNavLink(link.route)}
                    >
                      <Icon size={22} color={theme.textSecondary} />
                      <Text style={styles.menuItemTextSecondary}>{link.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </>
            )}

            <View style={styles.menuDivider} />

            {!isAuthenticated ? (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleSignIn}>
                  <LogIn size={22} color={theme.text} />
                  <Text style={styles.menuItemText}>Log in</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleGetStarted}>
                  <UserPlus size={22} color={theme.text} />
                  <Text style={styles.menuItemText}>Sign up</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
                  <User size={22} color={theme.text} />
                  <Text style={styles.menuItemText}>Profile</Text>
                </TouchableOpacity>

                {isAdmin && (
                  <TouchableOpacity style={styles.menuItem} onPress={handleAdmin}>
                    <Shield size={22} color={theme.accent} />
                    <Text style={[styles.menuItemText, { color: theme.accent }]}>Admin Dashboard</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <LogOut size={22} color={theme.primary} />
                  <Text style={[styles.menuItemText, { color: theme.primary }]}>Log out</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
              {getThemeIcon()}
              <Text style={styles.menuItemText}>{getThemeModeText()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuFooter}>
            {!isAuthenticated ? (
              <TouchableOpacity style={styles.menuCta} onPress={handleGetStarted}>
                <Text style={styles.menuCtaText}>Get Started Free</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.menuCta} onPress={() => handleNavLink('/(tabs)')}>
                <Text style={styles.menuCtaText}>Back to Learning</Text>
                <ArrowRight size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  )
}

const createStyles = (
  theme: typeof lightTheme,
  isDark: boolean,
  isTablet: boolean,
  isLandscapeTablet: boolean,
) =>
  StyleSheet.create({
    // ── Navbar ────────────────────────────────
    navbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 32 : 16,
      paddingVertical: 10,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },

    // ── LEFT: Logo + Wordmark ────────────────
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    iconWrapper: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? Colors.primary[400] + '15' : Colors.primary[600] + '10',
      alignItems: 'center',
      justifyContent: 'center',
    },
    wordmark: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.text,
      lineHeight: 18,
      letterSpacing: 0.5,
    },
    wordmarkSub: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.primary,
      lineHeight: 13,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },

    // ── CENTER: Nav links ────────────────────
    centerNav: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      position: 'absolute',
      left: '50%',
      transform: [{ translateX: -120 }],
    },
    centerNavLink: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    centerNavLinkText: {
      fontSize: 14,
      fontWeight: '500',
      color: theme.textSecondary,
    },

    // ── RIGHT: Icon pill + extras ────────────
    rightGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    adminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? Colors.accent[300] + '15' : Colors.accent[800] + '10',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 5,
    },
    adminButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.accent,
    },
    iconPill: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 24,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    pillIcon: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pillDivider: {
      width: 1,
      height: 16,
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    menuButton: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? Colors.neutral[800] : Colors.neutral[100],
    },

    // ── Mobile Menu Modal ────────────────────
    menuModal: {
      flex: 1,
      backgroundColor: theme.background,
    },
    menuHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuContent: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    menuSectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
      marginTop: 4,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      gap: 16,
    },
    menuItemText: {
      fontSize: 18,
      fontWeight: '500',
      color: theme.text,
    },
    menuItemTextSecondary: {
      fontSize: 16,
      fontWeight: '400',
      color: theme.textSecondary,
    },
    menuDivider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 12,
    },
    menuFooter: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    menuCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.primary,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
    },
    menuCtaText: {
      fontSize: 17,
      fontWeight: '600',
      color: '#ffffff',
    },
  })
