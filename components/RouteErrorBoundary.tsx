/**
 * Route-Level Error Boundary for Expo Router
 *
 * Registry Standard #2: Error isolation per route.
 * Export this as `ErrorBoundary` from any route file to catch crashes
 * within that route and show a recovery UI instead of a blank screen.
 *
 * Usage in any route file:
 *   export { RouteErrorBoundary as ErrorBoundary } from '@/components/RouteErrorBoundary'
 */

import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'

interface ErrorBoundaryProps {
  error: Error
  retry: () => void
}

export function RouteErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error(`[mukoko][error-boundary] Route error: ${error.message}`)

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🐝</Text>
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>
        Shamwari hit a bump. Don't worry — your learning progress is safe.
      </Text>
      <Text style={styles.error}>{error.message}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={retry}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    backgroundColor: '#FAF9F5',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#141413',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#52524E',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  error: {
    fontSize: 12,
    color: '#8C8B87',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#0047AB',
    borderRadius: 12,
  },
  retryText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
})

