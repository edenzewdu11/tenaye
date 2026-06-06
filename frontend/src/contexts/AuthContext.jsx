import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tokens, setTokens] = useState(null)
  const [isGuest, setIsGuest] = useState(false)

  useEffect(() => {
    // Check for existing tokens on mount
    const savedTokens = localStorage.getItem('tena_tokens')
    if (savedTokens) {
      const parsed = JSON.parse(savedTokens)
      setTokens(parsed)
      setIsGuest(false)
      // Verify tokens are still valid by fetching profile
      fetchProfile(parsed.access)
    } else {
      // Check if guest mode
      const guestMode = localStorage.getItem('tena_guest_mode')
      if (guestMode) {
        setIsGuest(true)
        // Create guest user
        createGuestUser()
      } else {
        setLoading(false)
      }
    }
  }, [])

  const fetchProfile = async (accessToken) => {
    // Since we're using mock authentication, skip profile fetching
    setLoading(false)
  }

  const login = async (email, password) => {
    // Accept any credentials without validation
    try {
      // Create mock user data
      const userData = {
        id: Math.floor(Math.random() * 10000),
        email: email,
        first_name: email.split('@')[0] || 'User',
        last_name: 'User',
        username: email.split('@')[0] || 'user',
        is_authenticated: true
      }
      
      // Create mock tokens
      const newTokens = {
        access: 'mock-access-token-' + Math.random().toString(36).substring(7),
        refresh: 'mock-refresh-token-' + Math.random().toString(36).substring(7)
      }
      
      setUser(userData)
      setTokens(newTokens)
      localStorage.setItem('tena_tokens', JSON.stringify(newTokens))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: 'Login failed' 
      }
    }
  }

  const register = async (email, password, firstName, lastName) => {
    // Accept any credentials without validation
    try {
      // Create mock user data
      const userData = {
        id: Math.floor(Math.random() * 10000),
        email: email,
        first_name: firstName || email.split('@')[0] || 'User',
        last_name: lastName || 'User',
        username: email.split('@')[0] || 'user',
        is_authenticated: true
      }
      
      // Create mock tokens
      const newTokens = {
        access: 'mock-access-token-' + Math.random().toString(36).substring(7),
        refresh: 'mock-refresh-token-' + Math.random().toString(36).substring(7)
      }
      
      setUser(userData)
      setTokens(newTokens)
      localStorage.setItem('tena_tokens', JSON.stringify(newTokens))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: 'Registration failed' 
      }
    }
  }

  const createGuestUser = async () => {
    // Create mock guest user data
    const userData = {
      id: Math.floor(Math.random() * 10000),
      email: 'guest@tena.app',
      first_name: 'Guest',
      last_name: 'User',
      username: 'guest',
      is_authenticated: true
    }
    setUser(userData)
    setLoading(false)
  }

  const continueAsGuest = () => {
    setIsGuest(true)
    localStorage.setItem('tena_guest_mode', 'true')
    localStorage.removeItem('tena_tokens')
    setTokens(null)
    createGuestUser()
  }

  const logout = async () => {
    try {
      if (tokens?.refresh) {
        await api.auth.logout(tokens.refresh)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setTokens(null)
      setIsGuest(false)
      localStorage.removeItem('tena_tokens')
      localStorage.removeItem('tena_guest_mode')
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    continueAsGuest,
    isGuest,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
