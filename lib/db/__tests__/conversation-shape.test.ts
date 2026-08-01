/**
 * Tests for the shamwari.conversations/messages <-> API shape mapping.
 */

import {
  buildConversationDoc,
  buildMessageDoc,
  contentBlocksToText,
  textToContentBlocks,
  toApiConversation,
  toApiConversations,
  toApiMessage,
  toApiMessages,
  MODEL_VERSION,
  SURFACE_CONTEXT,
} from '../conversation-shape'
import type { ShamwariConversation, ShamwariMessage } from '../types'

function makeConversation(overrides: Partial<ShamwariConversation> = {}): ShamwariConversation {
  return {
    _id: 'conv-1',
    _schemaVersion: 'v3.1',
    ownerPersonId: 'person-1',
    ownerEntityId: 'entity-1',
    surfaceContext: SURFACE_CONTEXT,
    modelProvider: 'anthropic',
    modelVersion: MODEL_VERSION,
    messageCount: 0,
    isActive: true,
    lastMessageAt: new Date('2026-01-01T00:00:00Z'),
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:05:00Z'),
    title: 'Practice - Shona',
    shamwari: { conversationContext: { type: 'practice', languageId: 'sn', classId: null } },
    ...overrides,
  }
}

function makeMessage(overrides: Partial<ShamwariMessage> = {}): ShamwariMessage {
  return {
    _id: 'msg-1',
    _schemaVersion: 'v3.1',
    conversationId: 'conv-1',
    role: 'user',
    content: [{ type: 'text', text: 'Mhoro!' }],
    sequence: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('buildConversationDoc', () => {
  it('builds a schema-compliant document with a UUID id', () => {
    const doc = buildConversationDoc({
      ownerPersonId: 'person-1',
      ownerEntityId: 'entity-1',
      type: 'practice',
      languageId: 'sn',
      title: 'Practice - Shona',
      classId: null,
    })

    expect(doc._schemaVersion).toBe('v3.1')
    expect(doc.ownerPersonId).toBe('person-1')
    expect(doc.ownerEntityId).toBe('entity-1')
    expect(doc.surfaceContext).toBe(SURFACE_CONTEXT)
    expect(doc.modelProvider).toBe('anthropic')
    expect(doc.modelVersion).toBe(MODEL_VERSION)
    expect(doc.messageCount).toBe(0)
    expect(doc.isActive).toBe(true)
    expect(doc.title).toBe('Practice - Shona')
    expect(doc.shamwari?.conversationContext).toEqual({ type: 'practice', languageId: 'sn', classId: null })
    expect(typeof doc._id).toBe('string')
    expect(doc._id.length).toBeGreaterThan(0)
  })

  it('defaults classId to null when omitted', () => {
    const doc = buildConversationDoc({
      ownerPersonId: 'person-1',
      ownerEntityId: 'entity-1',
      type: 'practice',
      languageId: 'sn',
    })

    expect((doc.shamwari?.conversationContext as any).classId).toBeNull()
    expect(doc.title).toBeNull()
  })
})

describe('toApiConversation', () => {
  it('maps a conversation doc to the flat API shape', () => {
    const api = toApiConversation(makeConversation())

    expect(api.id).toBe('conv-1')
    expect(api.type).toBe('practice')
    expect(api.language_id).toBe('sn')
    expect(api.title).toBe('Practice - Shona')
    expect(api.class_id).toBeNull()
    expect(api.created_at).toBe('2026-01-01T00:00:00.000Z')
    expect(api.updated_at).toBe('2026-01-01T00:05:00.000Z')
  })

  it('falls back to empty strings when conversationContext is missing', () => {
    const api = toApiConversation(makeConversation({ shamwari: undefined }))

    expect(api.type).toBe('')
    expect(api.language_id).toBe('')
    expect(api.class_id).toBeNull()
  })
})

describe('toApiConversations', () => {
  it('maps a list of documents', () => {
    const docs = [makeConversation({ _id: 'a' }), makeConversation({ _id: 'b' })]
    const result = toApiConversations(docs)

    expect(result).toHaveLength(2)
    expect(result.map((c) => c.id)).toEqual(['a', 'b'])
  })
})

describe('textToContentBlocks / contentBlocksToText', () => {
  it('round-trips plain text through a single text content block', () => {
    const blocks = textToContentBlocks('Mhoro!')
    expect(blocks).toEqual([{ type: 'text', text: 'Mhoro!' }])
    expect(contentBlocksToText(blocks)).toBe('Mhoro!')
  })

  it('joins multiple text blocks and ignores non-text blocks', () => {
    const blocks = [
      { type: 'text', text: 'Hello ' },
      { type: 'tool_use', id: 'x' },
      { type: 'text', text: 'world' },
    ]
    expect(contentBlocksToText(blocks)).toBe('Hello world')
  })
})

describe('buildMessageDoc', () => {
  it('builds a schema-compliant document with content as blocks', () => {
    const doc = buildMessageDoc({ conversationId: 'conv-1', role: 'user', content: 'Mhoro!', sequence: 0 })

    expect(doc._schemaVersion).toBe('v3.1')
    expect(doc.conversationId).toBe('conv-1')
    expect(doc.role).toBe('user')
    expect(doc.content).toEqual([{ type: 'text', text: 'Mhoro!' }])
    expect(doc.sequence).toBe(0)
    expect(typeof doc._id).toBe('string')
    expect(doc._id.length).toBeGreaterThan(0)
  })
})

describe('toApiMessage', () => {
  it('flattens content blocks back to a plain string', () => {
    const api = toApiMessage(makeMessage())

    expect(api.role).toBe('user')
    expect(api.content).toBe('Mhoro!')
    expect(api.created_at).toBe('2026-01-01T00:00:00.000Z')
  })
})

describe('toApiMessages', () => {
  it('maps a list of documents in order', () => {
    const docs = [
      makeMessage({ _id: 'a', sequence: 0, content: [{ type: 'text', text: 'Hi' }] }),
      makeMessage({ _id: 'b', sequence: 1, role: 'assistant', content: [{ type: 'text', text: 'Mhoro!' }] }),
    ]
    const result = toApiMessages(docs)

    expect(result).toEqual([
      { role: 'user', content: 'Hi', created_at: '2026-01-01T00:00:00.000Z' },
      { role: 'assistant', content: 'Mhoro!', created_at: '2026-01-01T00:00:00.000Z' },
    ])
  })
})
