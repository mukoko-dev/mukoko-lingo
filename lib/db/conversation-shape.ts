/**
 * Maps the real `shamwari.conversations` / `shamwari.messages` document
 * shapes to and from the API's flat conversation/message shape — the
 * contract mobile/web clients already consume (`aiApi`), unchanged since
 * the old Lingo-local `ai_conversations` collection, except that message
 * `content` is now an array of Anthropic content blocks internally
 * (flattened back to a plain string at the API boundary).
 */

import { randomUUID } from 'crypto'
import type { AnthropicContentBlock, ShamwariConversation, ShamwariMessage } from './types'

/** Surface identifier Lingo registers itself under in shared AI infrastructure. */
export const SURFACE_CONTEXT = 'mukoko-lingo'

/** Model Lingo calls directly (see `lib/ai/chat-service.ts`). */
export const MODEL_VERSION = 'claude-haiku-4-5-20251001'

export interface ApiConversation {
  id: string
  type: string
  language_id: string
  title: string | null
  class_id: string | null
  created_at: string
  updated_at: string
}

/**
 * Build a full, schema-compliant shamwari.conversations document. Lingo's
 * own `type` / `languageId` / `classId` fields have nowhere else to live in
 * the shared schema, so they're stored in `shamwari.conversationContext`.
 */
export function buildConversationDoc(params: {
  ownerPersonId: string
  ownerEntityId: string
  type: string
  languageId: string
  title?: string | null
  classId?: string | null
}): ShamwariConversation {
  const now = new Date()
  return {
    _id: randomUUID(),
    _schemaVersion: 'v3.1',
    ownerPersonId: params.ownerPersonId,
    ownerEntityId: params.ownerEntityId,
    surfaceContext: SURFACE_CONTEXT,
    modelProvider: 'anthropic',
    modelVersion: MODEL_VERSION,
    messageCount: 0,
    isActive: true,
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    title: params.title ?? null,
    shamwari: {
      conversationContext: {
        type: params.type,
        languageId: params.languageId,
        classId: params.classId ?? null,
      },
    },
  }
}

export function toApiConversation(doc: ShamwariConversation): ApiConversation {
  const ctx = (doc.shamwari?.conversationContext ?? {}) as Record<string, unknown>
  return {
    id: doc._id,
    type: typeof ctx.type === 'string' ? ctx.type : '',
    language_id: typeof ctx.languageId === 'string' ? ctx.languageId : '',
    title: doc.title ?? null,
    class_id: typeof ctx.classId === 'string' ? ctx.classId : null,
    created_at: new Date(doc.createdAt).toISOString(),
    updated_at: new Date(doc.updatedAt).toISOString(),
  }
}

export function toApiConversations(docs: ShamwariConversation[]): ApiConversation[] {
  return docs.map(toApiConversation)
}

/** Wrap plain text as a single Anthropic text content block. */
export function textToContentBlocks(text: string): AnthropicContentBlock[] {
  return [{ type: 'text', text }]
}

/** Flatten Anthropic content blocks back to plain text (text blocks only, joined). */
export function contentBlocksToText(content: AnthropicContentBlock[]): string {
  return content
    .filter((block) => block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('')
}

export interface ApiMessage {
  role: string
  content: string
  created_at: string
}

/** Build a full, schema-compliant shamwari.messages document. */
export function buildMessageDoc(params: {
  conversationId: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  sequence: number
}): ShamwariMessage {
  return {
    _id: randomUUID(),
    _schemaVersion: 'v3.1',
    conversationId: params.conversationId,
    role: params.role,
    content: textToContentBlocks(params.content),
    sequence: params.sequence,
    createdAt: new Date(),
  }
}

export function toApiMessage(doc: ShamwariMessage): ApiMessage {
  return {
    role: doc.role,
    content: contentBlocksToText(doc.content),
    created_at: new Date(doc.createdAt).toISOString(),
  }
}

export function toApiMessages(docs: ShamwariMessage[]): ApiMessage[] {
  return docs.map(toApiMessage)
}
