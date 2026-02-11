import { useState, useEffect, useCallback } from 'react'
import { getCurrentUser, onAuthStateChange } from '@/lib/auth/stytch-client'
import { profilesApi } from '@/lib/services/api-client'

interface AdminState {
  isAdmin: boolean
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  userId: string | null
}

/**
 * Hook to check if the current user is an admin.
 * Handles authentication state and admin role verification.
 * Uses Stytch auth + MongoDB/API for profile data.
 */
export function useAdmin(): AdminState & { refresh: () => Promise<void> } {
  const [state, setState] = useState<AdminState>({
    isAdmin: false,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    userId: null,
  })

  const checkAdminStatus = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const { user, error: userError } = await getCurrentUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setState({
          isAdmin: false,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          userId: null,
        })
        return
      }

      // Fetch profile from API (MongoDB-backed)
      const { data: profile, error: profileError } = await profilesApi.getMyProfile()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setState({
          isAdmin: false,
          isAuthenticated: true,
          isLoading: false,
          error: 'Failed to fetch profile',
          userId: user.user_id,
        })
        return
      }

      setState({
        isAdmin: profile?.role === 'admin',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        userId: user.user_id,
      })
    } catch (error: any) {
      console.error('Error checking admin status:', error)
      setState({
        isAdmin: false,
        isAuthenticated: false,
        isLoading: false,
        error: error.message || 'Failed to check admin status',
        userId: null,
      })
    }
  }, [])

  useEffect(() => {
    checkAdminStatus()

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange(() => {
      checkAdminStatus()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [checkAdminStatus])

  return {
    ...state,
    refresh: checkAdminStatus,
  }
}
