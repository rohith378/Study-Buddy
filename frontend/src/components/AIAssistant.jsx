import { useState, useRef, useEffect } from 'react'
import api from '../utils/api'

const SUGGESTIONS = [
  'Explain my latest topic',
  'Give me a quick quiz question',
  'What should I study today?',
  'Summarize my notes in simple terms',
]

export default function AIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your Study Buddy AI 👋 Ask me anything about your notes or any topic you're studying." }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [notesContext, setNotesContext] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  // Load notes context once
  useEffect(() => {
    api.get('/notes').then(r => {
      const ctx = r.data.slice(0, 5).map(n =>
        `Topic: ${n.topic} (${n.subject})\nSummary: ${n.summary?.slice(0,3).join('. ')}`
      ).join('\n\n')
      setNotesContext(ctx)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text) => {
    const q = text || input.trim()
    if (!q || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setLoading(true)

    try {
      const { data } = await api.post('/assistant/ask', {
        question: q,
        context: notesContext,
        history: messages.slice(-6).map(m => ({ role: m.role, content: m.text }))
      })
      setMessages(prev => [...prev, { role: 'assistant', text: data.answer }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <>
      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 right-4 md:right-6 z-50 w-[calc(100vw-32px)] md:w-[380px] max-h-[560px] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary-600 flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-base">🤖</div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">Study Buddy AI</p>
              <p className="text-xs text-white/70">Ask me anything about your studies</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <svg viewBox="0 0 15 15" fill="none" className="w-4 h-4">
                <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 mr-2">🤖</div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-gray-50 text-gray-700 rounded-bl-sm border border-gray-100'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 mr-2">🤖</div>
                <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions — show only at start */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex gap-2 flex-wrap flex-shrink-0">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full hover:bg-primary-100 transition-colors border border-primary-100">
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 border-t border-gray-100 flex gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-white disabled:opacity-50"
            />
            <button onClick={() => send()} disabled={!input.trim() || loading}
              className="w-9 h-9 bg-primary-600 hover:bg-primary-800 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0">
              <svg viewBox="0 0 15 15" fill="none" className="w-4 h-4">
                <path d="M2 7.5h11M8.5 3L13 7.5 8.5 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-4 right-4 md:right-6 z-50 w-14 h-14 bg-primary-600 hover:bg-primary-800 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        title="AI Assistant"
      >
        {open
          ? <svg viewBox="0 0 15 15" fill="none" className="w-5 h-5"><path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          : <span className="text-2xl">🤖</span>
        }
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </>
  )
}
