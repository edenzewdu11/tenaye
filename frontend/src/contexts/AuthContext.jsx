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
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE}/auth/profile/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        // Token invalid, clear storage
        localStorage.removeItem('tena_tokens')
        setTokens(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.auth.login(email, password)
      const { user: userData, tokens: newTokens } = response
      
      setUser(userData)
      setTokens(newTokens)
      localStorage.setItem('tena_tokens', JSON.stringify(newTokens))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Login failed' 
      }
    }
  }

  const register = async (email, password, firstName, lastName) => {
    try {
      const response = await api.auth.register(email, password, firstName, lastName)
      const { user: userData, tokens: newTokens } = response
      
      setUser(userData)
      setTokens(newTokens)
      localStorage.setItem('tena_tokens', JSON.stringify(newTokens))
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        error: error.message || 'Registration failed' 
      }
    }
  }

  const createGuestUser = async () => {
    try {
      const userData = await api.me()
      setUser(userData)
      setLoading(false)
    } catch (error) {
      console.error('Error creating guest user:', error)
      setLoading(false)
    }
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
