import React from 'react'
import { renderHook, act } from '@testing-library/react-native'

// Mock dependencies before importing the hook
jest.mock('@/lib/auth/stytch-client', () => ({
  getCurrentUser: jest.fn(),
  onAuthStateChange: jest.fn(() => ({
    data: { subscription: { unsubscribe: jest.fn() } },
  })),
}))

jest.mock('@/lib/services/api-client', () => ({
  profilesApi: {
    getMyProfile: jest.fn(),
  },
}))

import { getCurrentUser, onAuthStateChange } from '@/lib/auth/stytch-client'
import { profilesApi } from '@/lib/services/api-client'
import { useAdmin } from '../useAdmin'

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>
const mockedGetMyProfile = profilesApi.getMyProfile as jest.MockedFunction<typeof profilesApi.getMyProfile>

describe('useAdmin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockedGetCurrentUser.mockReturnValue(new Promise(() => {})) // never resolves

    const { result } = renderHook(() => useAdmin())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('detects admin user', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      user: { user_id: 'user-1', email: 'admin@test.com', created_at: '', status: 'active' },
      error: null,
    })
    mockedGetMyProfile.mockResolvedValue({
      data: { id: '1', role: 'admin', email: 'admin@test.com' },
      error: null,
    })

    const { result } = renderHook(() => useAdmin())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.userId).toBe('user-1')
    expect(result.current.error).toBeNull()
  })

  it('detects non-admin user', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      user: { user_id: 'user-2', email: 'user@test.com', created_at: '', status: 'active' },
      error: null,
    })
    mockedGetMyProfile.mockResolvedValue({
      data: { id: '2', role: 'user', email: 'user@test.com' },
      error: null,
    })

    const { result } = renderHook(() => useAdmin())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.userId).toBe('user-2')
  })

  it('handles unauthenticated user', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      user: null,
      error: null,
    })

    const { result } = renderHook(() => useAdmin())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.userId).toBeNull()
  })

  it('handles auth error', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      user: null,
      error: new Error('Auth failed'),
    })

    const { result } = renderHook(() => useAdmin())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.error).toBe('Auth failed')
  })

  it('handles profile fetch error', async () => {
    mockedGetCurrentUser.mockResolvedValue({
      user: { user_id: 'user-1', email: 'test@test.com', created_at: '', status: 'active' },
      error: null,
    })
    mockedGetMyProfile.mockResolvedValue({
      data: null,
      error: 'Failed to fetch profile',
    })

    const { result } = renderHook(() => useAdmin())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.error).toBe('Failed to fetch profile')
  })

  it('subscribes to auth state changes', () => {
    mockedGetCurrentUser.mockReturnValue(new Promise(() => {}))

    renderHook(() => useAdmin())

    expect(onAuthStateChange).toHaveBeenCalled()
  })

  it('exposes refresh function', async () => {
    mockedGetCurrentUser.mockResolvedValue({ user: null, error: null })

    const { result } = renderHook(() => useAdmin())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(typeof result.current.refresh).toBe('function')

    // Refresh should re-check admin status
    mockedGetCurrentUser.mockResolvedValue({
      user: { user_id: 'user-1', email: 'admin@test.com', created_at: '', status: 'active' },
      error: null,
    })
    mockedGetMyProfile.mockResolvedValue({
      data: { id: '1', role: 'admin', email: 'admin@test.com' },
      error: null,
    })

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.isAdmin).toBe(true)
  })
})
