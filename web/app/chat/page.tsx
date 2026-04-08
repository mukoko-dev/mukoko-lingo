'use client'

import { useState } from 'react'
import { aiApi } from '@/lib/api-client'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    const apiMessages = updated.map(m => ({ role: m.role, content: m.content }))
    const { data, error } = await aiApi.chat(apiMessages)

    if (data?.message) {
      setMessages([...updated, { id: (Date.now() + 1).toString(), role: 'assistant', content: data.message }])
    } else {
      setMessages([...updated, { id: (Date.now() + 1).toString(), role: 'assistant', content: error || 'Something went wrong.' }])
    }
    setLoading(false)
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div>
        <h1 className="text-2xl font-bold">Shamwari AI Tutor</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Your friendly language learning companion</p>
      </div>

      {/* Messages */}
      <div className="mt-4 flex-1 space-y-4 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-[var(--muted-foreground)]">
            Start a conversation with Shamwari!
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-xl px-4 py-2.5 text-sm ${
              msg.role === 'user'
                ? 'bg-cobalt-600 text-white'
                : 'bg-[var(--muted)] text-[var(--foreground)]'
            }`}>
              {msg.role === 'assistant' && <span className="mb-1 block text-xs font-semibold text-cobalt-400">Shamwari</span>}
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl bg-[var(--muted)] px-4 py-2.5 text-sm text-[var(--muted-foreground)]">
              Shamwari is thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Ask Shamwari anything about languages..."
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="rounded-xl bg-cobalt-600 px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  )
}
