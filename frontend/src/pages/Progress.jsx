import { useState, useEffect } from 'react'
import api from '../utils/api'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const barColors = ['bg-primary-600', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500']
const textColors = ['text-primary-600', 'text-emerald-600', 'text-amber-600', 'text-blue-600', 'text-purple-600']

function MiniBar({ values, max }) {
  const m = max || Math.max(...values, 1)
  return (
    <div className="flex items-end gap-1 h-14">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col justify-end">
          <div
            className={`rounded-t-sm ${v > 0 ? 'bg-primary-600' : 'bg-gray-100'}`}
            style={{ height: `${v > 0 ? Math.max((v / m) * 56, 4) : 4}px` }}
          />
        </div>
      ))}
    </div>
  )
}

function getWeekBuckets(notes) {
  const now = new Date()
  // Get start of current week (Monday)
  const dayOfWeek = (now.getDay() + 6) % 7 // 0=Mon
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek)
  monday.setHours(0, 0, 0, 0)

  const buckets = Array(7).fill(0)
  notes.forEach(n => {
    const d = new Date(n.createdAt)
    const diff = Math.floor((d - monday) / (1000 * 60 * 60 * 24))
    if (diff >= 0 && diff < 7) buckets[diff]++
  })
  return buckets
}

function getFlashcardBuckets(notes) {
  const now = new Date()
  const dayOfWeek = (now.getDay() + 6) % 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - dayOfWeek)
  monday.setHours(0, 0, 0, 0)

  const buckets = Array(7).fill(0)
  notes.forEach(n => {
    const d = new Date(n.createdAt)
    const diff = Math.floor((d - monday) / (1000 * 60 * 60 * 24))
    if (diff >= 0 && diff < 7) buckets[diff] += (n.flashcards?.length || 0)
  })
  return buckets
}

export default function Progress() {
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notes')
      .then(r => setNotes(r.data))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [])

  const totalCards = notes.reduce((a, n) => a + (n.flashcards?.length || 0), 0)
  const totalQuestions = notes.reduce((a, n) => a + (n.quiz?.length || 0), 0)
  const weekBuckets = getWeekBuckets(notes)
  const flashBuckets = getFlashcardBuckets(notes)

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  return (
    <div className="p-6 page-enter">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Progress</h1>
        <p className="text-sm text-gray-400 mt-1">Your real learning overview based on uploaded notes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { val: notes.length,     label: 'Topics uploaded',   color: 'text-primary-600' },
          { val: totalQuestions,   label: 'Quiz questions',     color: 'text-emerald-600' },
          { val: totalCards,       label: 'Flashcards made',    color: 'text-primary-600' },
          { val: notes.length > 0 ? `${Math.min(notes.length * 10, 100)}%` : '0%', label: 'Completion', color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {notes.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-sm font-medium text-gray-600 mb-1">No data yet</p>
          <p className="text-xs text-gray-400">Upload some notes to see your progress here.</p>
        </div>
      )}

      {notes.length > 0 && (
        <>
          {/* Charts */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-3">Topics uploaded this week</p>
              <MiniBar values={weekBuckets} />
              <div className="flex justify-between mt-1">
                {days.map(d => <span key={d} className="text-[10px] text-gray-400">{d}</span>)}
              </div>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-xs text-gray-400 mb-3">Flashcards created this week</p>
              <MiniBar values={flashBuckets} />
              <div className="flex justify-between mt-1">
                {days.map(d => <span key={d} className="text-[10px] text-gray-400">{d}</span>)}
              </div>
            </div>
          </div>

          {/* Topic breakdown */}
          <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Topic breakdown</p>
          <div className="space-y-2">
            {notes.map((n, i) => (
              <div key={n._id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{n.topic}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {n.subject} · {n.summary?.length || 0} key points · {n.quiz?.length || 0} questions · {n.flashcards?.length || 0} cards
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${textColors[i % textColors.length]}`}>
                    {n.flashcards?.length || 0} cards
                  </p>
                  <div className="w-20 h-1 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full ${barColors[i % barColors.length]} rounded-full pbar-fill`}
                      style={{ width: `${Math.min(((n.summary?.length || 0) / 5) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
