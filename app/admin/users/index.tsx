import { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
  useWindowDimensions,
} from 'react-native'
import { Stack } from 'expo-router'
import {
  Search,
  Users,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
  Mail,
  Calendar,
  MoreVertical,
} from 'lucide-react-native'

import { useTheme } from '@/lib/hooks/useTheme'
import { lightTheme, darkTheme, Colors } from '@/constants/Colors'
import { profilesApi } from '@/lib/services/api-client'

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  role: 'user' | 'admin'
  created_at: string
  updated_at: string
}

export default function AdminUsersScreen() {
  const { isDark } = useTheme()
  const theme = isDark ? darkTheme : lightTheme
  const { width } = useWindowDimensions()

  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)

  const isTablet = width >= 768

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await profilesApi.listProfiles()

      if (error) throw new Error(error)
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      Alert.alert('Error', 'Failed to load users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredUsers(
        users.filter(
          (user) =>
            user.email.toLowerCase().includes(query) ||
            (user.display_name && user.display_name.toLowerCase().includes(query))
        )
      )
    }
  }, [searchQuery, users])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchUsers()
  }, [fetchUsers])

  const handleToggleRole = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    const action = newRole === 'admin' ? 'promote' : 'demote'

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      `Are you sure you want to ${action} ${user.email} to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newRole === 'admin' ? 'default' : 'destructive',
          onPress: async () => {
            setUpdatingRole(user.id)
            try {
              const { error } = await profilesApi.updateRole(user.id, newRole)

              if (error) throw new Error(error)

              setUsers((prev) =>
                prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u))
              )
              Alert.alert('Success', `User ${action}d to ${newRole}`)
            } catch (err) {
              console.error('Error updating role:', err)
              Alert.alert('Error', 'Failed to update user role')
            } finally {
              setUpdatingRole(null)
            }
          },
        },
      ]
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const styles = createStyles(theme, isDark, isTablet)

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: 'User Management' }} />
        <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
          <ActivityIndicator size="large" color={Colors.primary[600]} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
            Loading users...
          </Text>
        </View>
      </>
    )
  }

  return (
    <>
      <Stack.Screen options={{ title: 'User Management' }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: theme.card }]}>
            <Search size={20} color={theme.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search by email or name..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: theme.textSecondary }]}>
              {filteredUsers.length} users found
            </Text>
            <Text style={[styles.statsText, { color: Colors.primary[600] }]}>
              {users.filter((u) => u.role === 'admin').length} admins
            </Text>
          </View>
        </View>

        {/* Users List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color={theme.textMuted} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No users found
              </Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                {searchQuery ? 'Try a different search term' : 'No users registered yet'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <View
                key={user.id}
                style={[styles.userCard, { backgroundColor: theme.card }]}
              >
                <TouchableOpacity
                  style={styles.userHeader}
                  onPress={() =>
                    setExpandedUserId(expandedUserId === user.id ? null : user.id)
                  }
                  activeOpacity={0.7}
                >
                  <View style={styles.userInfo}>
                    <View
                      style={[
                        styles.avatar,
                        {
                          backgroundColor:
                            user.role === 'admin'
                              ? Colors.primary[600] + '20'
                              : Colors.secondary[700] + '20',
                        },
                      ]}
                    >
                      {user.role === 'admin' ? (
                        <Shield size={20} color={Colors.primary[600]} />
                      ) : (
                        <User size={20} color={Colors.secondary[700]} />
                      )}
                    </View>
                    <View style={styles.userDetails}>
                      <Text style={[styles.userName, { color: theme.text }]}>
                        {user.display_name || 'No name'}
                      </Text>
                      <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
                        {user.email}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.userMeta}>
                    <View
                      style={[
                        styles.roleBadge,
                        {
                          backgroundColor:
                            user.role === 'admin'
                              ? Colors.primary[600]
                              : Colors.secondary[700],
                        },
                      ]}
                    >
                      <Text style={styles.roleText}>{user.role}</Text>
                    </View>
                    {expandedUserId === user.id ? (
                      <ChevronUp size={20} color={theme.textMuted} />
                    ) : (
                      <ChevronDown size={20} color={theme.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>

                {expandedUserId === user.id && (
                  <View style={[styles.expandedContent, { borderTopColor: theme.border }]}>
                    <View style={styles.detailRow}>
                      <Mail size={16} color={theme.textMuted} />
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                        {user.email}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Calendar size={16} color={theme.textMuted} />
                      <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                        Joined {formatDate(user.created_at)}
                      </Text>
                    </View>
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.actionButton,
                          {
                            backgroundColor:
                              user.role === 'admin'
                                ? '#ef4444' + '20'
                                : Colors.primary[600] + '20',
                          },
                        ]}
                        onPress={() => handleToggleRole(user)}
                        disabled={updatingRole === user.id}
                      >
                        {updatingRole === user.id ? (
                          <ActivityIndicator
                            size="small"
                            color={
                              user.role === 'admin' ? '#ef4444' : Colors.primary[600]
                            }
                          />
                        ) : (
                          <>
                            <Shield
                              size={16}
                              color={
                                user.role === 'admin' ? '#ef4444' : Colors.primary[600]
                              }
                            />
                            <Text
                              style={[
                                styles.actionButtonText,
                                {
                                  color:
                                    user.role === 'admin'
                                      ? '#ef4444'
                                      : Colors.primary[600],
                                },
                              ]}
                            >
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </>
  )
}

const createStyles = (theme: typeof lightTheme, isDark: boolean, isTablet: boolean) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
    },
    container: {
      flex: 1,
    },
    searchContainer: {
      padding: 16,
      gap: 12,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statsText: {
      fontSize: 14,
    },
    scrollView: {
      flex: 1,
    },
    content: {
      padding: 16,
      paddingTop: 0,
      gap: 12,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 48,
      gap: 12,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    emptyText: {
      fontSize: 14,
      textAlign: 'center',
    },
    userCard: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
      overflow: 'hidden',
    },
    userHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
    },
    userInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userDetails: {
      flex: 1,
    },
    userName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    userEmail: {
      fontSize: 14,
    },
    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    roleBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    roleText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
      textTransform: 'capitalize',
    },
    expandedContent: {
      padding: 16,
      paddingTop: 12,
      borderTopWidth: 1,
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailText: {
      fontSize: 14,
    },
    actionsRow: {
      flexDirection: 'row',
      marginTop: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 8,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
  })
