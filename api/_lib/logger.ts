/**
 * Structured Logging — Mukoko Observability Standard
 *
 * All logs prefixed with [mukoko] for grep-ability.
 * Usage: const log = createLogger('phrases')
 *        log.info('Fetched 200 phrases')
 *        log.error('Query failed', error)
 *
 * The caller's message is passed as an **argument**, never as the format
 * string. Routes build their messages with template literals over request data
 * (`log.error('Cannot resolve skill "' + name + '"')`), and Node reads
 * `console.error`'s first argument as a `util.format` template — so a `%s`
 * inside a user-supplied value would swallow the next argument and rewrite the
 * line. Control characters are replaced for the same reason one level down: a
 * newline in a value would otherwise forge an entire extra log entry.
 */

/** C0 controls plus DEL — anything that can break a line or move a cursor. */
function safe(message: string): string {
  if (typeof message !== 'string') return String(message)
  let out = ''
  for (const ch of message) {
    const code = ch.codePointAt(0) ?? 0
    out += code < 0x20 || code === 0x7f ? ' ' : ch
  }
  return out
}

export function createLogger(module: string) {
  const prefix = `[mukoko][${module}]`

  return {
    info: (message: string, data?: any) => {
      console.log('%s %s', prefix, safe(message), data !== undefined ? data : '')
    },
    warn: (message: string, data?: any) => {
      console.warn('%s %s', prefix, safe(message), data !== undefined ? data : '')
    },
    error: (message: string, data?: any) => {
      console.error('%s %s', prefix, safe(message), data !== undefined ? data : '')
    },
    debug: (message: string, data?: any) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('%s [DEBUG] %s', prefix, safe(message), data !== undefined ? data : '')
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
