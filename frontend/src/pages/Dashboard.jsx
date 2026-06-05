import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../utils/api'

const iconColors = ['#534AB7', '#0F6E56', '#854F0B', '#1D4ED8', '#7C3AED']
const iconBgs    = ['bg-primary-50', 'bg-emerald-50', 'bg-amber-50', 'bg-blue-50', 'bg-purple-50']
const bars       = ['bg-primary-600', 'bg-emerald-500', 'bg-amber-500', 'bg-blue-500', 'bg-purple-500']

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days} days ago`
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const first = user?.name?.split(' ')[0] || 'there'
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notes')
      .then(r => setNotes(r.data))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false))
  }, [])

  const totalCards = notes.reduce((acc, n) => acc + (n.flashcards?.length || 0), 0)
  const avgQuiz = notes.length ? Math.round(notes.reduce((a, n) => a + (n.quizScore || 0), 0) / notes.length) : 0

  const stats = [
    { val: notes.length.toString(), label: 'Topics studied',  delta: 'Total uploads',      color: 'text-primary-600' },
    { val: avgQuiz ? `${avgQuiz}%` : '—',  label: 'Quiz average',    delta: 'Across all topics',  color: 'text-emerald-600' },
    { val: totalCards.toString(),   label: 'Flashcards made', delta: 'Ready to review',    color: 'text-primary-600' },
    { val: '—',                     label: 'Day streak',      delta: 'Keep studying!',     color: 'text-amber-600'   },
  ]

  return (
    <div className="p-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-xl font-semibold">Good morning, {first} 👋</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {notes.length === 0 ? 'Upload your first notes to get started.' : `You have ${notes.length} topic${notes.length > 1 ? 's' : ''} saved.`}
          </p>
        </div>
        <button onClick={() => navigate('/upload')}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors">
          + New notes
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <p className={`text-2xl font-semibold ${s.color}`}>{s.val}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
            <p className="text-xs text-gray-400 mt-2">{s.delta}</p>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!loading && notes.length === 0 && (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📚</div>
          <h2 className="font-display text-lg font-semibold mb-2">No notes yet</h2>
          <p className="text-sm text-gray-400 mb-5">Upload your first study notes and AI will generate a summary, quiz, and flashcards for you.</p>
          <button onClick={() => navigate('/upload')}
            className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors">
            ⚡ Upload first notes
          </button>
        </div>
      )}

      {/* Notes grid */}
      {notes.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {/* Recent topics */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Recent topics</p>
            <div className="space-y-2">
              {notes.slice(0, 4).map((n, i) => (
                <div key={n._id} onClick={() => navigate(`/summary/${n._id}`)}
                  className="bg-white border border-gray-100 rounded-xl p-4 cursor-pointer hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg ${iconBgs[i % iconBgs.length]} flex items-center justify-center flex-shrink-0`}>
                      <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
                        <path d="M3 4h10M3 7h7M3 10h9" stroke={iconColors[i % iconColors.length]} strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{n.topic}</p>
                      <p className="text-xs text-gray-400">{n.subject} · {timeAgo(n.createdAt)}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bars[i % bars.length]} rounded-full pbar-fill`} style={{ width: `${n.flashcards?.length ? 100 : 50}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-1 text-right">{n.summary?.length || 0} key points · {n.quiz?.length || 0} questions</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right column */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-3">Quick actions</p>
            <div className="space-y-2">
              {notes.slice(0, 3).map((n, i) => (
                <div key={n._id} className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{n.topic}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.quiz?.length || 0} questions · {n.flashcards?.length || 0} cards</p>
                  </div>
                  <button onClick={() => navigate(`/quiz/${n._id}`)}
                    className="text-xs font-medium px-3 py-1 rounded-full bg-primary-50 text-primary-800 hover:bg-primary-100 transition-colors">
                    Take quiz
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 bg-primary-50 rounded-xl p-4">
              <p className="text-sm font-medium text-primary-800 mb-1">Quick upload</p>
              <p className="text-xs text-primary-600 mb-3">Paste notes and get a quiz in seconds</p>
              <button onClick={() => navigate('/upload')}
                className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-colors">
                Upload notes →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
