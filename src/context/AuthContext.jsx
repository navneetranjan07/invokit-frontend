import { createContext, useState, useContext, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Validate token on load
  useEffect(() => {
    const token = localStorage.getItem('invokit_token')
    if (!token) {
      setLoading(false)
      return
    }

    api.get('/api/auth/me')
      .then(res => setUser(res.data.data))
      .catch(() => localStorage.removeItem('invokit_token'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await api.post('/api/auth/login', { email, password }) 

    const data = res.data.data

    if (!data?.token) {
      throw new Error('Token not received')
    }

    localStorage.setItem('invokit_token', data.token)
    setUser(data)

    return data
  }, [])

  const register = useCallback(async (formData) => {
    const res = await api.post('/api/auth/register', formData) 

    const data = res.data.data

    localStorage.setItem('invokit_token', data.token)
    setUser(data)

    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('invokit_token')
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}