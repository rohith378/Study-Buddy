import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Flashcards() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [mastered, setMastered] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notes')
      .then(r => {
        setNotes(r.data)
        if (id) {
          const found = r.data.find(n => n._id === id)
          setSelected(found || r.data[0] || null)
        } else {
          setSelected(r.data[0] || null)
        }
      })
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [id])

  const selectTopic = (n) => {
    setSelected(n)
    setCurrent(0)
    setFlipped(false)
    setMastered(new Set())
  }

  const deleteTopic = async (noteId, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this topic? This cannot be undone.')) return
    try {
      await api.delete(`/notes/${noteId}`)
      const updated = notes.filter(n => n._id !== noteId)
      setNotes(updated)
      if (selected?._id === noteId) setSelected(updated[0] || null)
    } catch { alert('Delete failed. Try again.') }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  if (notes.length === 0) return (
    <div className="p-6 page-enter">
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <div className="text-3xl mb-3">🃏</div>
        <p className="text-sm font-medium text-gray-600 mb-1">No flashcards yet</p>
        <p className="text-xs text-gray-400 mb-5">Upload notes first to generate flashcards.</p>
        <button onClick={() => navigate('/upload')}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors">
          Upload notes
        </button>
      </div>
    </div>
  )

  const cards = selected?.flashcards || []
  const card = cards[current]

  const prev = () => { setCurrent(c => (c - 1 + cards.length) % cards.length); setFlipped(false) }
  const next = () => { setCurrent(c => (c + 1) % cards.length); setFlipped(false) }
  const markMastered = () => {
    setMastered(m => { const n = new Set(m); n.add(current); return n })
    next()
  }

  return (
    <div className="p-6 page-enter flex gap-5">
      {/* Topic sidebar */}
      <div className="w-48 flex-shrink-0">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Your topics</p>
        <div className="space-y-1">
          {notes.map(n => (
            <div key={n._id} onClick={() => selectTopic(n)}
              className={`group px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors flex items-center justify-between
                ${selected?._id === n._id ? 'bg-primary-50 text-primary-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
              <div className="min-w-0">
                <p className="truncate">{n.topic}</p>
                <p className="text-xs text-gray-400">{n.flashcards?.length || 0} cards</p>
              </div>
              <button onClick={e => deleteTopic(n._id, e)}
                className="opacity-0 group-hover:opacity-100 ml-1 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                title="Delete topic">
                <svg viewBox="0 0 15 15" fill="none" className="w-3.5 h-3.5">
                  <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Flashcard content */}
      <div className="flex-1 max-w-xl">
        {!selected || cards.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400">No flashcards available for this topic.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="font-display text-lg font-semibold">{selected.topic}</h1>
                <p className="text-sm text-gray-400 mt-0.5">Card {current + 1} of {cards.length}</p>
              </div>
              <div className="flex gap-2">
                <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium">Mastered: {mastered.size}</span>
                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium">Learning: {cards.length - mastered.size}</span>
              </div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mb-6">
              {cards.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  i === current ? 'bg-primary-600' : mastered.has(i) ? 'bg-emerald-400' : 'bg-gray-200'
                }`} />
              ))}
            </div>

            {/* Flashcard — inline styles for reliable flip */}
            <div
              onClick={() => setFlipped(f => !f)}
              style={{ perspective: '1000px', height: '200px', cursor: 'pointer', marginBottom: '20px' }}
            >
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s cubic-bezier(0.4,0,0.2,1)',
                transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              }}>
                {/* Front */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  background: 'white', borderRadius: '16px',
                  border: '1px solid #f0f0f0',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '32px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: '#1a1a2e' }}>{card.term}</p>
                  <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>Tap to reveal definition</p>
                </div>
                {/* Back */}
                <div style={{
                  position: 'absolute', inset: 0,
                  backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: '#EEEDFE', borderRadius: '16px',
                  border: '1px solid #CECBF6',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  padding: '32px', textAlign: 'center',
                }}>
                  <p style={{ fontSize: '14px', color: '#3C3489', lineHeight: '1.6' }}>{card.definition}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 justify-center">
              <button onClick={prev} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">← Prev</button>
              <button onClick={() => { next() }} className="px-4 py-2 text-sm text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">Still learning</button>
              <button onClick={markMastered} className="px-4 py-2 text-sm text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-50 transition-colors">Got it ✓</button>
              <button onClick={next} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">Next →</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
