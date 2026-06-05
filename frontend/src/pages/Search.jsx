import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Search() {
  const [query, setQuery] = useState('')
  const [notes, setNotes] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/notes')
      .then(r => { setNotes(r.data); setFiltered(r.data) })
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!query.trim()) { setFiltered(notes); return }
    const q = query.toLowerCase()
    setFiltered(notes.filter(n =>
      n.topic?.toLowerCase().includes(q) ||
      n.subject?.toLowerCase().includes(q) ||
      n.summary?.some(s => s.toLowerCase().includes(q)) ||
      n.flashcards?.some(f => f.term?.toLowerCase().includes(q) || f.definition?.toLowerCase().includes(q)) ||
      n.quiz?.some(q2 => q2.question?.toLowerCase().includes(q))
    ))
  }, [query, notes])

  const highlight = (text, q) => {
    if (!q.trim() || !text) return text
    const parts = text.split(new RegExp(`(${q})`, 'gi'))
    return parts.map((p, i) =>
      p.toLowerCase() === q.toLowerCase()
        ? <mark key={i} className="bg-yellow-100 text-yellow-800 rounded px-0.5">{p}</mark>
        : p
    )
  }

  const timeAgo = (d) => {
    const diff = Date.now() - new Date(d)
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl page-enter">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Search Topics</h1>
        <p className="text-sm text-gray-400 mt-1">Search across all your notes, flashcards and quiz questions.</p>
      </div>

      <div className="relative mb-6">
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M15 15l-2.5-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search topics, flashcard terms, quiz questions…"
          className="w-full pl-10 pr-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 bg-white" />
        {query && (
          <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 15 15" fill="none" className="w-4 h-4"><path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      {!loading && notes.length === 0 && (
        <div className="text-center py-12">
          <div className="text-3xl mb-3">📚</div>
          <p className="text-sm font-medium text-gray-600 mb-4">No notes yet — upload notes first.</p>
          <button onClick={() => navigate('/upload')} className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-800 transition-colors">Upload notes</button>
        </div>
      )}

      {!loading && notes.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 mb-3">
            {query ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"` : `${notes.length} total topics`}
          </p>
          {filtered.length === 0 && (
            <div className="text-center py-10">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-sm text-gray-500">No topics match "<strong>{query}</strong>"</p>
            </div>
          )}
          <div className="space-y-3">
            {filtered.map(n => {
              const matchedFlashcard = query ? n.flashcards?.find(f => f.term?.toLowerCase().includes(query.toLowerCase()) || f.definition?.toLowerCase().includes(query.toLowerCase())) : null
              const matchedQuiz = query ? n.quiz?.find(q2 => q2.question?.toLowerCase().includes(query.toLowerCase())) : null
              const matchedSummary = query ? n.summary?.find(s => s.toLowerCase().includes(query.toLowerCase())) : null
              return (
                <div key={n._id} className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5"><path d="M3 4h10M3 7h7M3 10h9" stroke="#534AB7" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{highlight(n.topic, query)}</p>
                        <p className="text-xs text-gray-400">{n.subject} · {timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0 ml-2">
                      <button onClick={() => navigate(`/summary/${n._id}`)} className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">Summary</button>
                      <button onClick={() => navigate(`/quiz/${n._id}`)} className="text-xs px-2.5 py-1 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">Quiz</button>
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {matchedSummary && <div className="flex gap-2"><span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5">Summary</span><p className="text-xs text-gray-600 leading-relaxed line-clamp-2">{highlight(matchedSummary, query)}</p></div>}
                    {matchedFlashcard && <div className="flex gap-2"><span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5">Flashcard</span><p className="text-xs text-gray-600"><strong>{highlight(matchedFlashcard.term, query)}</strong> — {highlight(matchedFlashcard.definition, query)}</p></div>}
                    {matchedQuiz && <div className="flex gap-2"><span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-medium flex-shrink-0 mt-0.5">Quiz</span><p className="text-xs text-gray-600 line-clamp-1">{highlight(matchedQuiz.question, query)}</p></div>}
                    {!matchedSummary && !matchedFlashcard && !matchedQuiz && <p className="text-xs text-gray-400">{n.summary?.length || 0} points · {n.quiz?.length || 0} questions · {n.flashcards?.length || 0} cards</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
