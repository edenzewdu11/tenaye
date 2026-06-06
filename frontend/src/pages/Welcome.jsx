import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

export default function Welcome() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
    }
  }, [user, navigate])

  const handleGetStarted = () => {
    navigate('/dashboard')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return null
  }

  return (
    <div className="welcome-container">
      <div className="welcome-content">
        <div className="welcome-header">
          <div className="logo-large">ጤ</div>
          <h1>Welcome, {user.first_name || 'Friend'}!</h1>
          <p className="welcome-subtitle">
            Your wellness journey begins now. Tena is here to support you every step of the way.
          </p>
        </div>

        <div className="welcome-features">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>AI Companion</h3>
            <p>Chat with our wellness companion anytime, anywhere</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🎙️</div>
            <h3>Voice Journal</h3>
            <p>Record your thoughts and get AI-powered insights</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Mood Tracking</h3>
            <p>Monitor your emotional patterns and progress</p>
          </div>
        </div>

        <div className="welcome-actions">
          <button 
            onClick={handleGetStarted}
            className="welcome-button primary"
          >
            Get Started
          </button>
          
          <button 
            onClick={handleLogout}
            className="welcome-button secondary"
          >
            Sign Out
          </button>
        </div>

        <div className="welcome-quote">
          <p>"You don't have to be okay to be worthy of care."</p>
          <span>— Tena · ጤና</span>
        </div>
      </div>
    </div>
  )
}
