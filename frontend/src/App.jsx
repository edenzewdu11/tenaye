import { useEffect, useState, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Chat from './components/Chat'
import VoiceJournal from './components/VoiceJournal'
import Dashboard from './components/Dashboard'
import CheckIn from './components/CheckIn'
import Companion from './components/Companion'
import Onboarding from './components/Onboarding'
import QRCode from './components/QRCode'
import Explore from './components/Explore'
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
  { key: 'explore', label: 'Explore Places', ico: '🗺️', section: 'Wellness' },
  { key: 'qr', label: 'Share Bot', ico: '📱', section: 'Share' },
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
  explore: {
    title: 'Explore',
    accent: 'Places',
    sub: 'Tell Tena what you feel like doing — and discover where to go.',
    heroTitle: 'Your city, your vibe',
    heroBody: 'Find the perfect spot for your mood. From parks to cafes, Tena knows Addis.',
    heroIcon: '🗺️',
  },
  qr: {
    title: 'Share',
    accent: 'Tena Bot',
    sub: 'Invite friends to chat with Tena on Telegram.',
    heroTitle: 'Share the wellness',
    heroBody: 'Help others discover their path to mental well-being.',
    heroIcon: '📱',
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
  const [theme, setTheme] = useState(() => localStorage.getItem('tena-theme') || 'warm')
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

  useEffect(() => {
    document.body.setAttribute('data-theme', theme === 'night' ? 'night' : '')
    localStorage.setItem('tena-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'warm' ? 'night' : 'warm')
  }

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
          <div className="sidebar-actions">
            <button
              className="theme-toggle sidebar-theme-toggle"
              onClick={toggleTheme}
              title={theme === 'warm' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <span className="theme-icon">{theme === 'warm' ? '🌙' : '☀️'}</span>
            </button>
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
              {/* Enhanced Hero Section */}
              <div className="home-hero">
                <div className="hero-background">
                  <div className="hero-pattern"></div>
                  <div className="hero-gradient"></div>
                </div>
                <div className="home-greeting enhanced">
                  <div className="greeting-content">
                    <div className="greeting-badge">
                      <span className="badge-icon">✨</span>
                      <span className="badge-text">Welcome Back</span>
                    </div>
                    <h1>{PAGES[tab].heroTitle}</h1>
                    <p>{PAGES[tab].heroBody}</p>
                  </div>
                  <div className="greeting-visual">
                    <div className="character-orb">
                      <img src="/images/normalimage.png" alt="Tena Companion" className="character-img" />
                      <div className="orb-ring"></div>
                      <div className="orb-particles">
                        <span className="particle">✨</span>
                        <span className="particle">💫</span>
                        <span className="particle">⭐</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Enhanced Wisdom Section */}
              <div className="home-wisdom enhanced">
                <div className="wisdom-header">
                  <div className="wisdom-badge">
                    <span className="wisdom-icon">💡</span>
                    <span className="wisdom-badge-text">Daily Wisdom</span>
                  </div>
                  <h3>Today's Insight</h3>
                  <div className="wisdom-accent"></div>
                </div>
                <div className="wisdom-content">
                  <div className="wisdom-visual">
                    <div className="wisdom-orb">
                      <div className="wisdom-character">
                        <img src="/images/thinking.png" alt="Tena Thinking" className="wisdom-character-img" />
                      </div>
                      <div className="wisdom-particles">
                        <span className="wisdom-particle">✨</span>
                        <span className="wisdom-particle">💭</span>
                        <span className="wisdom-particle">🌟</span>
                      </div>
                    </div>
                  </div>
                  <div className="wisdom-text">
                    <p>Take 3 deep breaths before responding to stressful situations. It gives you a moment to think and react more calmly. Your mind will thank you for the pause.</p>
                    <div className="wisdom-author">
                      <span className="author-icon">—</span>
                      <span className="author-name">Tena Wisdom</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Quick Actions */}
              <div className="home-quick enhanced">
                <div className="section-header">
                  <h3>Quick Actions</h3>
                  <div className="header-accent"></div>
                </div>
                <div className="home-quick-grid enhanced">
                  <button className="quick-tile enhanced chat-tile" onClick={() => setTab('chat')}>
                    <div className="tile-background"></div>
                    <div className="tile-content">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon">💬</div>
                        <div className="tile-glow"></div>
                      </div>
                      <h4>Chat with Tena</h4>
                      <p>Talk about what's on your mind</p>
                      <div className="tile-arrow">→</div>
                    </div>
                  </button>
                  <button className="quick-tile enhanced voice-tile" onClick={() => setTab('voice')}>
                    <div className="tile-background"></div>
                    <div className="tile-content">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon">🎙️</div>
                        <div className="tile-glow"></div>
                      </div>
                      <h4>Voice Journal</h4>
                      <p>Speak your thoughts freely</p>
                      <div className="tile-arrow">→</div>
                    </div>
                  </button>
                  <button className="quick-tile enhanced stats-tile" onClick={() => setTab('stats')}>
                    <div className="tile-background"></div>
                    <div className="tile-content">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon">📊</div>
                        <div className="tile-glow"></div>
                      </div>
                      <h4>Progress</h4>
                      <p>See your wellness journey</p>
                      <div className="tile-arrow">→</div>
                    </div>
                  </button>
                  <button className="quick-tile enhanced customize-tile" onClick={() => setTab('customize')}>
                    <div className="tile-background"></div>
                    <div className="tile-content">
                      <div className="tile-icon-wrapper">
                        <div className="tile-icon">🎨</div>
                        <div className="tile-glow"></div>
                      </div>
                      <h4>Customize</h4>
                      <p>Personalize your companion</p>
                      <div className="tile-arrow">→</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Enhanced Daily Check-in */}
              <div className="home-checkin enhanced">
                <div className="checkin-header enhanced">
                  <div className="checkin-badge">
                    <span className="checkin-badge-icon">🌟</span>
                    <span className="checkin-badge-text">Daily Check-in</span>
                  </div>
                  <h3>How are you feeling today?</h3>
                  <div className="checkin-accent"></div>
                </div>
                <div className="checkin-content">
                  <div className="checkin-visual">
                    <div className="checkin-orb">
                      <div className="checkin-character">
                        <div className="checkin-character-placeholder">👂</div>
                      </div>
                      <div className="listening-waves">
                        <div className="wave wave-1"></div>
                        <div className="wave wave-2"></div>
                        <div className="wave wave-3"></div>
                      </div>
                    </div>
                  </div>
                  <div className="checkin-form">
                    <CheckIn me={me} setMe={setMe} onCrisis={setCrisis} />
                  </div>
                </div>
              </div>
            </div>
          )}
          {tab === 'chat' && <Chat me={me} />}
          {tab === 'voice' && <VoiceJournal me={me} />}
          {tab === 'explore' && <Explore />}
          {tab === 'qr' && <QRCode />}
          {tab === 'stats' && <Dashboard me={me} />}
        </div>
      </main>

      {crisis && <CrisisModal crisis={crisis} onClose={() => setCrisis(null)} />}
      <PitchBadge />
    </div>
  )
}

function OnboardingPage() {
  const navigate = useNavigate()
  const [companion, setCompanion] = useState(() => {
    try {
      const saved = localStorage.getItem('tena-companion')
      return saved ? JSON.parse(saved) : { gender: 'gentle', ageGroup: 'adult', style: 'modern', skinTone: 'warm' }
    } catch {
      return { gender: 'gentle', ageGroup: 'adult', style: 'modern', skinTone: 'warm' }
    }
  })

  const handleOnboardingComplete = () => {
    localStorage.setItem('tena-onboarded', 'true')
    navigate('/login')
  }

  return <Onboarding onComplete={handleOnboardingComplete} companion={companion} />
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<OnboardingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/app/*" element={<MainApp />} />
        </Routes>
      </AuthProvider>
    </Router>
  )
}
