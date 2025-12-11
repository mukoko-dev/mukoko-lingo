import { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
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
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { createClient } from '@/lib/supabase/client'

const PUBLIC_NAV_LINKS = [
  { label: 'Features', route: '/features', icon: Sparkles },
  { label: 'Why Nyuchi', route: '/why', icon: HelpCircle },
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

  const isTablet = width >= 768

  // Check if user is admin
  useEffect(() => {
    if (isAuthenticated) {
      checkAdminStatus()
    }
  }, [isAuthenticated])

  const checkAdminStatus = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        setIsAdmin(profile?.role === 'admin')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
    }
  }

  const styles = createStyles(theme, isDark, isTablet)

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

  return (
    <>
      {/* Navigation Header */}
      <View style={styles.navbar}>
        <TouchableOpacity style={styles.logoContainer} onPress={handleLogoPress}>
          <Image
            source={require('@/assets/images/nyuchi-icon.png')}
            style={styles.navIcon}
            resizeMode="contain"
          />
          <Text style={styles.navTitle}>Nyuchi Lingo</Text>
        </TouchableOpacity>

        {/* Desktop nav links */}
        {isTablet && (
          <View style={styles.desktopNavLinks}>
            {navLinks.map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.desktopNavLink}
                onPress={() => router.push(link.route as any)}
              >
                <Text style={styles.desktopNavLinkText}>{link.label}</Text>
              </TouchableOpacity>
            ))}
            {/* Marketing links for authenticated users */}
            {isAuthenticated && (
              <>
                <View style={styles.navDivider} />
                {PUBLIC_NAV_LINKS.map((link, index) => (
                  <TouchableOpacity
                    key={`public-${index}`}
                    style={styles.desktopNavLink}
                    onPress={() => router.push(link.route as any)}
                  >
                    <Text style={styles.desktopNavLinkTextSecondary}>{link.label}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}
          </View>
        )}

        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIconButton} onPress={toggleTheme}>
            {getThemeIcon()}
          </TouchableOpacity>

          {!isAuthenticated && (
            <TouchableOpacity style={styles.navIconButton} onPress={handleSignIn}>
              <LogIn size={20} color={theme.text} />
            </TouchableOpacity>
          )}

          {isAuthenticated && isTablet && isAdmin && (
            <TouchableOpacity style={styles.adminButton} onPress={handleAdmin}>
              <Shield size={18} color={Colors.accent[600]} />
              <Text style={styles.adminButtonText}>Admin</Text>
            </TouchableOpacity>
          )}

          {isAuthenticated && isTablet && (
            <TouchableOpacity style={styles.navIconButton} onPress={handleProfile}>
              <User size={20} color={theme.text} />
            </TouchableOpacity>
          )}

          {!isTablet && (
            <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(true)}>
              <Menu size={24} color={theme.text} />
            </TouchableOpacity>
          )}

          {isTablet && !isAuthenticated && (
            <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
              <Text style={styles.getStartedButtonText}>Get Started</Text>
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
              <Image
                source={require('@/assets/images/nyuchi-icon.png')}
                style={styles.menuIcon}
                resizeMode="contain"
              />
              <Text style={styles.menuTitle}>Nyuchi Lingo</Text>
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
                  <Icon size={22} color={Colors.primary[600]} />
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
                    <Shield size={22} color={Colors.accent[600]} />
                    <Text style={[styles.menuItemText, { color: Colors.accent[600] }]}>Admin Dashboard</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <LogOut size={22} color={Colors.primary[600]} />
                  <Text style={[styles.menuItemText, { color: Colors.primary[600] }]}>Log out</Text>
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

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean) =>
  StyleSheet.create({
    navbar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: isTablet ? 32 : 16,
      paddingVertical: 12,
      backgroundColor: theme.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    logoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navIcon: {
      width: 32,
      height: 32,
    },
    navTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
    },
    desktopNavLinks: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 24,
    },
    desktopNavLink: {
      paddingVertical: 8,
    },
    desktopNavLinkText: {
      fontSize: 15,
      fontWeight: '500',
      color: theme.text,
    },
    desktopNavLinkTextSecondary: {
      fontSize: 14,
      fontWeight: '400',
      color: theme.textSecondary,
    },
    navDivider: {
      width: 1,
      height: 20,
      backgroundColor: theme.border,
      marginHorizontal: 8,
    },
    navRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    navIconButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    adminButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.accent[600] + '15',
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
      marginRight: 4,
    },
    adminButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: Colors.accent[600],
    },
    getStartedButton: {
      backgroundColor: Colors.primary[600],
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginLeft: 8,
    },
    getStartedButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#ffffff',
    },
    menuButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // Mobile Menu Modal
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
    menuIcon: {
      width: 36,
      height: 36,
    },
    menuTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
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
      backgroundColor: Colors.primary[600],
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
