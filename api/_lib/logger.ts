/**
 * Structured Logging — Mukoko Observability Standard
 *
 * All logs prefixed with [mukoko] for grep-ability.
 * Usage: const log = createLogger('phrases')
 *        log.info('Fetched 200 phrases')
 *        log.error('Query failed', error)
 */

export function createLogger(module: string) {
  const prefix = `[mukoko][${module}]`

  return {
    info: (message: string, data?: any) => {
      console.log(`${prefix} ${message}`, data !== undefined ? data : '')
    },
    warn: (message: string, data?: any) => {
      console.warn(`${prefix} ${message}`, data !== undefined ? data : '')
    },
    error: (message: string, data?: any) => {
      console.error(`${prefix} ${message}`, data !== undefined ? data : '')
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`${prefix} [DEBUG] ${message}`, data !== undefined ? data : '')
      }
    },
  }
}

/**
 * Measure execution time of an async function
 */
export async function measure<T>(label: string, fn: () => Promise<T>, module?: string): Promise<T> {
  const start = Date.now()
  const log = createLogger(module || 'perf')
  try {
    const result = await fn()
    log.info(`${label} completed in ${Date.now() - start}ms`)
    return result
  } catch (error) {
    log.error(`${label} failed after ${Date.now() - start}ms`, error)
    throw error
  }
}
