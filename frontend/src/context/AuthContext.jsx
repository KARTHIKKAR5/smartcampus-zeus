import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tlml_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { token, user: u } = res.data
    localStorage.setItem('tlml_token', token)
    localStorage.setItem('tlml_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data)
    const { token, user: u } = res.data
    localStorage.setItem('tlml_token', token)
    localStorage.setItem('tlml_user', JSON.stringify(u))
    setUser(u)
    return u
  }

  const logout = () => {
    localStorage.removeItem('tlml_token')
    localStorage.removeItem('tlml_user')
    setUser(null)
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/orders/wallet/balance')
      const stored = JSON.parse(localStorage.getItem('tlml_user') || '{}')
      const updated = { ...stored, wallet_balance: res.data.balance }
      localStorage.setItem('tlml_user', JSON.stringify(updated))
      setUser(updated)
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
