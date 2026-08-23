/**
 * Validation for the chat request body.
 *
 * The messages array is forwarded to the model, so its shape is a security
 * boundary rather than a convenience check. In particular a `system` role
 * coming from the client would be read by the provider as instructions —
 * exactly the thing moving the system prompt server-side is meant to prevent,
 * reintroduced through the messages array.
 */

/** Roles a caller may send. `system` is deliberately absent. */
const ALLOWED_ROLES = new Set(['user', 'assistant'])

/** Caps chosen to fit normal tutoring turns with plenty of headroom. */
export const MAX_MESSAGES = 40
export const MAX_CONTENT_CHARS = 4000

export interface SanitizedMessage {
  role: 'user' | 'assistant'
  content: string
}

export class InvalidChatInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidChatInputError'
  }
}

/**
 * Validate and normalize the caller's messages.
 *
 * Throws `InvalidChatInputError` with a caller-safe message on anything
 * malformed. Only the last `MAX_MESSAGES` turns are kept, so a long-running
 * conversation truncates from the front instead of being rejected.
 */
export function sanitizeChatMessages(raw: unknown): SanitizedMessage[] {
  if (!Array.isArray(raw)) {
    throw new InvalidChatInputError('messages array is required')
  }
  if (raw.length === 0) {
    throw new InvalidChatInputError('messages array must not be empty')
  }

  const trimmed = raw.slice(-MAX_MESSAGES)
  const sanitized: SanitizedMessage[] = []

  for (const message of trimmed) {
    if (!message || typeof message !== 'object' || Array.isArray(message)) {
      throw new InvalidChatInputError('each message must be an object')
    }

    const { role, content } = message as Record<string, unknown>

    if (typeof role !== 'string' || !ALLOWED_ROLES.has(role)) {
      // Naming the allowed roles here is intentional: it makes the failure
      // obvious to a legitimate client without revealing anything useful.
      throw new InvalidChatInputError("each message role must be 'user' or 'assistant'")
    }

    if (typeof content !== 'string') {
      throw new InvalidChatInputError('each message content must be a string')
    }

    const text = content.trim()
    if (text === '') {
      throw new InvalidChatInputError('message content must not be empty')
    }
    if (text.length > MAX_CONTENT_CHARS) {
      throw new InvalidChatInputError(`message content must be ${MAX_CONTENT_CHARS} characters or fewer`)
    }

    sanitized.push({ role: role as 'user' | 'assistant', content: text })
  }

  // The provider rejects a conversation that opens on an assistant turn, and
  // both the seeded welcome message and the MAX_MESSAGES truncation can leave
  // one at the front.
  while (sanitized.length > 0 && sanitized[0].role !== 'user') sanitized.shift()
  if (sanitized.length === 0) {
    throw new InvalidChatInputError('messages must contain at least one user message')
  }

  return sanitized
}
