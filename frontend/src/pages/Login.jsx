import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

export default function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value })

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post(isRegister ? '/auth/register' : '/auth/login', form)
      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-5 h-5">
              <rect x="2" y="2" width="12" height="12" rx="3" fill="#534AB7"/>
              <path d="M5 6h6M5 9h4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="font-display text-xl font-semibold">Study Buddy</span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h1 className="font-display text-lg font-semibold mb-1">
            {isRegister ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-sm text-gray-400 mb-5">
            {isRegister ? 'Start studying smarter today' : 'Sign in to your account'}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-3">
            {isRegister && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Full name</label>
                <input name="name" value={form.name} onChange={handle} placeholder="Ravi Shankar" required
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400" />
              </div>
            )}
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input type="email" name="email" value={form.email} onChange={handle} placeholder="you@college.edu" required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Password</label>
              <input type="password" name="password" value={form.password} onChange={handle} placeholder="••••••••" required
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60 mt-1">
              {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-4">
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="text-primary-600 hover:underline font-medium">
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
