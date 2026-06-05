import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sb_user')) } catch { return null }
  })

  const login = (userData, token) => {
    localStorage.setItem('sb_user', JSON.stringify(userData))
    localStorage.setItem('sb_token', token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('sb_user')
    localStorage.removeItem('sb_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
