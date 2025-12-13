import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

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
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

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

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        setState({
          isAdmin: false,
          isAuthenticated: true,
          isLoading: false,
          error: 'Failed to fetch profile',
          userId: user.id,
        })
        return
      }

      setState({
        isAdmin: profile?.role === 'admin',
        isAuthenticated: true,
        isLoading: false,
        error: null,
        userId: user.id,
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
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
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
