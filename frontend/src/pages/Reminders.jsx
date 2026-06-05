import { useState, useEffect } from 'react'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

export default function Reminders() {
  const { user } = useAuth()
  const [form, setForm] = useState({ email: '', frequency: 'daily', enabled: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [msg, setMsg] = useState({ type: '', text: '' })

  useEffect(() => {
    api.get('/reminders/settings')
      .then(r => setForm({ email: r.data.email || user?.email || '', frequency: r.data.frequency || 'daily', enabled: r.data.enabled || false }))
      .catch(() => setForm(f => ({ ...f, email: user?.email || '' })))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true); setMsg({})
    try {
      await api.post('/reminders/settings', form)
      setMsg({ type: 'success', text: 'Settings saved successfully!' })
    } catch { setMsg({ type: 'error', text: 'Failed to save settings.' }) }
    finally { setSaving(false) }
  }

  const sendTest = async () => {
    setTesting(true); setMsg({})
    try {
      const { data } = await api.post('/reminders/send-test')
      setMsg({ type: 'success', text: data.message })
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to send email.' })
    }
    finally { setTesting(false) }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  return (
    <div className="p-4 md:p-6 max-w-xl page-enter">
      <div className="mb-6">
        <h1 className="font-display text-xl font-semibold">Email Reminders</h1>
        <p className="text-sm text-gray-400 mt-1">Get daily or weekly study reminders sent to your email.</p>
      </div>

      {/* Enable toggle */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enable reminders</p>
            <p className="text-xs text-gray-400 mt-0.5">Receive study reminders via email</p>
          </div>
          <button onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.enabled ? 'bg-primary-600' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.enabled ? 'translate-x-5' : ''}`} />
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 space-y-4">
        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Reminder email address</label>
          <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="your@email.com"
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400" />
        </div>

        <div>
          <label className="text-xs text-gray-500 mb-1.5 block">Frequency</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'daily',   label: 'Daily',   sub: 'Every day' },
              { val: 'weekly',  label: 'Weekly',  sub: 'Once a week' },
              { val: 'custom',  label: 'Custom',  sub: 'Set your own' },
            ].map(opt => (
              <button key={opt.val} onClick={() => setForm(f => ({ ...f, frequency: opt.val }))}
                className={`p-3 rounded-xl border text-left transition-all ${
                  form.frequency === opt.val
                    ? 'border-primary-400 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'}`}>
                <p className={`text-sm font-medium ${form.frequency === opt.val ? 'text-primary-800' : 'text-gray-700'}`}>{opt.label}</p>
                <p className={`text-xs mt-0.5 ${form.frequency === opt.val ? 'text-primary-500' : 'text-gray-400'}`}>{opt.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* What's included */}
      <div className="bg-primary-50 border border-primary-100 rounded-2xl p-5 mb-5">
        <p className="text-sm font-medium text-primary-800 mb-3">📧 What's included in the email</p>
        <div className="space-y-2">
          {['List of your recent topics to review', 'Quiz question count per topic', 'Flashcard count per topic', 'Direct link to open the app', 'Daily study tip'].map(item => (
            <div key={item} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary-200 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 10 10" fill="none" className="w-2.5 h-2.5">
                  <path d="M2 5l2 2 4-4" stroke="#534AB7" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-xs text-primary-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`rounded-xl px-4 py-3 mb-4 text-sm ${msg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          {msg.text}
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button onClick={save} disabled={saving}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
          {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</> : 'Save settings'}
        </button>
        <button onClick={sendTest} disabled={testing || !form.email}
          className="px-5 py-2.5 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2">
          {testing ? <><span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />Sending…</> : '📧 Send test email'}
        </button>
      </div>

      {/* Setup instructions */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <p className="text-sm font-medium text-amber-800 mb-2">⚙️ Setup required in backend</p>
        <p className="text-xs text-amber-700 mb-2">Add these to your <code className="bg-amber-100 px-1 rounded">backend/.env</code> file:</p>
        <pre className="text-xs bg-amber-100 rounded-lg p-3 text-amber-800 overflow-auto">{`EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_app_password`}</pre>
        <p className="text-xs text-amber-600 mt-2">
          Get Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords
        </p>
      </div>
    </div>
  )
}
