import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'

export default function Quiz() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [notes, setNotes] = useState([])
  const [selected, setSelected] = useState(null)
  const [current, setCurrent] = useState(0)
  const [userSelected, setUserSelected] = useState(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)
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
    setSelected(n); setCurrent(0); setUserSelected(null); setScore(0); setDone(false)
  }

  const deleteTopic = async (noteId, e) => {
    e.stopPropagation()
    if (!window.confirm('Delete this topic? This cannot be undone.')) return
    try {
      await api.delete(`/notes/${noteId}`)
      const updated = notes.filter(n => n._id !== noteId)
      setNotes(updated)
      if (selected?._id === noteId) { setSelected(updated[0] || null); setCurrent(0); setUserSelected(null); setScore(0); setDone(false) }
    } catch { alert('Delete failed. Try again.') }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  if (notes.length === 0) return (
    <div className="p-6 page-enter">
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <div className="text-3xl mb-3">❓</div>
        <p className="text-sm font-medium text-gray-600 mb-1">No quizzes yet</p>
        <p className="text-xs text-gray-400 mb-5">Upload notes first to generate quiz questions.</p>
        <button onClick={() => navigate('/upload')}
          className="px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-800 transition-colors">
          Upload notes
        </button>
      </div>
    </div>
  )

  const questions = selected?.quiz || []

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
                <p className="text-xs text-gray-400">{n.quiz?.length || 0} questions</p>
              </div>
              <button onClick={e => deleteTopic(n._id, e)}
                className="opacity-0 group-hover:opacity-100 ml-1 text-red-400 hover:text-red-600 transition-all flex-shrink-0"
                title="Delete">
                <svg viewBox="0 0 15 15" fill="none" className="w-3.5 h-3.5">
                  <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz content */}
      <div className="flex-1 max-w-xl">
        {!selected || questions.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-400">No questions available for this topic.</p>
          </div>
        ) : done ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">{score >= questions.length * 0.7 ? '🎉' : '📚'}</div>
            <h2 className="font-display text-2xl font-semibold mb-1">{score}/{questions.length}</h2>
            <p className="text-gray-400 text-sm mb-1">{score >= questions.length * 0.7 ? 'Great job!' : 'Keep practising!'}</p>
            <p className="text-sm text-gray-500 mb-6">{Math.round((score / questions.length) * 100)}% score</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setCurrent(0); setUserSelected(null); setScore(0); setDone(false) }}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Retry quiz
              </button>
              <button onClick={() => navigate(`/flashcards/${selected._id}`)}
                className="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-colors">
                Review flashcards →
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-400">Question {current + 1} of {questions.length} · {selected.topic}</p>
              <span className="text-xs bg-primary-50 text-primary-800 px-2.5 py-0.5 rounded-full">Score: {score}</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full mb-5 overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full pbar-fill" style={{ width: `${(current / questions.length) * 100}%` }} />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-4">
              <p className="text-base font-medium leading-relaxed mb-5">{questions[current].question}</p>
              <div className="space-y-2.5">
                {questions[current].options.map((opt, i) => {
                  let cls = 'border-gray-200 hover:bg-gray-50 cursor-pointer'
                  if (userSelected !== null) {
                    if (i === questions[current].correct) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    else if (i === userSelected) cls = 'border-red-300 bg-red-50 text-red-700'
                    else cls = 'border-gray-100 text-gray-400'
                  }
                  return (
                    <div key={i} onClick={() => {
                      if (userSelected !== null) return
                      setUserSelected(i)
                      if (i === questions[current].correct) setScore(s => s + 1)
                    }}
                      className={`flex items-center gap-3 px-4 py-3 border rounded-xl text-sm transition-all ${cls}`}>
                      <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-medium flex-shrink-0">
                        {['A','B','C','D'][i]}
                      </span>
                      {opt}
                    </div>
                  )
                })}
              </div>
              {userSelected !== null && (
                <p className={`text-sm mt-4 font-medium ${userSelected === questions[current].correct ? 'text-emerald-600' : 'text-red-500'}`}>
                  {userSelected === questions[current].correct ? '✓ Correct!' : `✗ Correct answer: ${['A','B','C','D'][questions[current].correct]}`}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => {
                if (current + 1 >= questions.length) { setDone(true); return }
                setCurrent(c => c + 1); setUserSelected(null)
              }} disabled={userSelected === null}
                className="px-5 py-2.5 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-800 transition-colors disabled:opacity-40">
                {current + 1 >= questions.length ? 'See results' : 'Next →'}
              </button>
              <button onClick={() => { setCurrent(0); setUserSelected(null); setScore(0) }}
                className="px-4 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                Reset
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
