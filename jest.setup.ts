/**
 * Jest global setup
 * Shared mocks and configuration for all test suites.
 */

// Suppress console.warn/error noise in tests (keep console.log for debugging)
const originalWarn = console.warn
const originalError = console.error

beforeAll(() => {
  console.warn = (...args: unknown[]) => {
    // Allow specific warnings through if needed
    const message = String(args[0])
    if (message.includes('EXPO_PUBLIC_ANTHROPIC_API_KEY')) return
    if (message.includes('AsyncStorage')) return
    originalWarn(...args)
  }
  console.error = (...args: unknown[]) => {
    const message = String(args[0])
    if (message.includes('Error loading')) return
    if (message.includes('Error fetching')) return
    if (message.includes('Error checking')) return
    originalError(...args)
  }
})

afterAll(() => {
  console.warn = originalWarn
  console.error = originalError
})
