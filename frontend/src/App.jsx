import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Chat from './components/Chat'
import VoiceJournal from './components/VoiceJournal'
import Dashboard from './components/Dashboard'
import CheckIn from './components/CheckIn'
import Home from './components/Home'
import Companion from './components/Companion'
import Onboarding from './components/Onboarding'
import Customize from './components/Customize'
import QRCode from './components/QRCode'
import Login from './pages/Login'
import Register from './pages/Register'
import Welcome from './pages/Welcome'
import { api } from './api'
import CrisisModal from './components/CrisisModal'
import PitchBadge from './components/PitchBadge'

const NAV = [
  { key: 'home', label: 'Home', ico: '🏡', section: 'Wellness' },
  { key: 'chat', label: 'Chat', ico: '💬', section: 'Wellness' },
  { key: 'voice', label: 'Voice Journal', ico: '🎙️', section: 'Wellness' },
  { key: 'qr', label: 'Share Bot', ico: '📱', section: 'Share' },
  { key: 'customize', label: 'My Companion', ico: '🎨', section: 'Companion' },
  { key: 'stats', label: 'Progress', ico: '📊', section: 'Insights' },
]

const PAGES = {
  home: {
    title: 'Welcome back',
    accent: 'to Tena',
    sub: 'Your companion is here. How are you feeling today?',
    heroTitle: 'Selam! I\'ve been waiting for you',
    heroBody: 'Take a breath. Share what\'s on your mind, log a mood, or just say hi. ጤናህ ይጠበቅ።',
    heroIcon: '🌅',
  },
  chat: {
    title: 'Chat',
    accent: 'with Tena',
    sub: 'English, Amharic, or both — Tena understands.',
    heroTitle: 'I\'m all ears',
    heroBody: 'No judgment, no lectures. Just a friend who listens and cares.',
    heroIcon: '💬',
  },
  voice: {
    title: 'Voice',
    accent: 'Journal',
    sub: 'Speak your heart out. I\'ll listen and reflect.',
    heroTitle: 'Press, speak, release',
    heroBody: 'Sometimes 10 seconds of speaking is lighter than 10 sentences of typing.',
    heroIcon: '🎙️',
  },
  qr: {
    title: 'Share',
    accent: 'Tena Bot',
    sub: 'Share the wellness companion with friends and family.',
    heroTitle: 'Spread wellness',
    heroBody: 'Help others discover their path to mental well-being.',
    heroIcon: '📱',
  },
  customize: {
    title: 'My',
    accent: 'Companion',
    sub: 'Personalize your wellness companion.',
    heroTitle: 'Make it yours',
    heroBody: 'Choose the look, feel, and personality that resonates with you.',
    heroIcon: '🎨',
  },
  stats: {
    title: 'Your',
    accent: 'Progress',
    sub: 'Track your wellness journey over time.',
    heroTitle: 'See how far you\'ve come',
    heroBody: 'Every check-in, every conversation, every step forward matters.',
    heroIcon: '📊',
  },
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">ጤ</div>
            <h1>Loading...</h1>
          </div>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

function MainApp() {
  const [tab, setTab] = useState('home')
  const [me, setMe] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [open, setOpen] = useState(false)
  const [crisis, setCrisis] = useState(null)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const isMobile = () => window.innerWidth < 820

  useEffect(() => {
    if (user) {
      setMe(user)
    }
  }, [user])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 820) setOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchMe = useCallback(async () => {
    try {
      const data = await api.me()
      setMe(data)
    } catch (e) {
      console.error('Failed to fetch user:', e)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchMe()
    }
  }, [user, fetchMe])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const sections = [...new Set(NAV.map(n => n.section))]

  return (
    <div className="layout">
      <div className="ethio-textile-bg" />
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''} ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo">ጤ</div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <h1>Tena</h1>
              <small>{me ? `Selam, ${me.first_name || 'friend'}` : 'Wellness companion'}</small>
            </div>
          )}
          <button
            className="sidebar-collapse-btn"
            onClick={() => !isMobile() && setCollapsed(c => !c)}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d={collapsed ? 'M5 2l5 5-5 5' : 'M9 2L4 7l5 5'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {sections.map((s) => (
          <div key={s}>
            <div className="nav-section-label">{collapsed ? '' : s}</div>
            {NAV.filter((n) => n.section === s).map((n) => (
              <button
                key={n.key}
                className={`nav-item ${tab === n.key ? 'active' : ''}`}
                onClick={() => { setTab(n.key); setOpen(false) }}
                title={collapsed ? n.label : ''}
              >
                <span className="ico">{n.ico}</span>
                {!collapsed && <span className="nav-label">{n.label}</span>}
              </button>
            ))}
          </div>
        ))}

        <div className="sidebar-footer">
          <div className="quote">"You don't have to be okay to be worthy of care."</div>
          <div className="author">— Tena · ጤና</div>
        </div>
      </aside>

      <main className="main">
        <div className="page-header">
          <div>
            <h2>{PAGES[tab]?.title}</h2>
            <h3>{PAGES[tab]?.accent}</h3>
            <p>{PAGES[tab]?.sub}</p>
          </div>
          <div className="page-actions">
            {isMobile() && (
              <button className="menu-btn" onClick={() => setOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <button className="logout-btn" onClick={handleLogout} title="Sign out">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        <div className="page-content">
          {tab === 'home' && (
            <div className="home-page">
              <div className="home-greeting">
                <div className="home-greeting-text">
                  <h2>{PAGES[tab].heroTitle}</h2>
                  <p>{PAGES[tab].heroBody}</p>
                </div>
                <div className="home-greeting-art">
                  <div className="character-avatar">
                    <img src="/images/normalimage.png" alt="Tena Companion" className="character-img" />
                  </div>
                </div>
              </div>
              
              <div className="home-quick">
                <h3>Quick Actions</h3>
                <div className="home-quick-grid">
                  <button className="quick-tile" onClick={() => setTab('chat')}>
                    <div className="tile-icon">💬</div>
                    <h4>Chat with Tena</h4>
                    <p>Talk about what's on your mind</p>
                  </button>
                  <button className="quick-tile" onClick={() => setTab('voice')}>
                    <div className="tile-icon">🎙️</div>
                    <h4>Voice Journal</h4>
                    <p>Speak your thoughts freely</p>
                  </button>
                  <button className="quick-tile" onClick={() => setTab('stats')}>
                    <div className="tile-icon">📊</div>
                    <h4>Progress</h4>
                    <p>See your wellness journey</p>
                  </button>
                  <button className="quick-tile" onClick={() => setTab('customize')}>
                    <div className="tile-icon">🎨</div>
                    <h4>Customize</h4>
                    <p>Personalize your companion</p>
                  </button>
                </div>
              </div>

              <div className="home-checkin-tip-row">
                <CheckIn me={me} setMe={setMe} onCrisis={setCrisis} />
                <div className="home-tip">
                  <div className="tip-icon">💡</div>
                  <div className="tip-content">
                    <h3>Today's Tip</h3>
                    <p>Take 3 deep breaths before responding to stressful situations. It gives you a moment to think and react more calmly.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'chat' && <Chat me={me} />}
          {tab === 'voice' && <VoiceJournal me={me} />}
          {tab === 'qr' && <QRCode />}
          {tab === 'customize' && <Customize me={me} setMe={setMe} />}
          {tab === 'stats' && <Dashboard me={me} />}
        </div>
      </main>

      {crisis && <CrisisModal crisis={crisis} onClose={() => setCrisis(null)} />}
      <PitchBadge />
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/app/*" element={<MainApp />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
