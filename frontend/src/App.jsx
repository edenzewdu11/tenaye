import { useEffect, useState, useCallback } from 'react'
import Chat from './components/Chat'
import VoiceJournal from './components/VoiceJournal'
import Dashboard from './components/Dashboard'
import CheckIn from './components/CheckIn'
import Companion from './components/Companion'
import Onboarding from './components/Onboarding'
import Customize from './components/Customize'
import QRCode from './components/QRCode'
import Explore from './components/Explore'
import { api } from './api'
import CrisisModal from './components/CrisisModal'
import PitchBadge from './components/PitchBadge'

const NAV = [
  { key: 'home', label: 'Home', ico: '🏡', section: 'Wellness' },
  { key: 'chat', label: 'Chat', ico: '💬', section: 'Wellness' },
  { key: 'voice', label: 'Voice Journal', ico: '🎙️', section: 'Wellness' },
  { key: 'explore', label: 'Explore Places', ico: '🗺️', section: 'Wellness' },
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
    sub: 'Invite friends to chat with Tena on Telegram.',
    heroTitle: 'Share the wellness',
    heroBody: 'Scan this QR code or share the link to help others discover Tena.',
    heroIcon: '📱',
  },
  customize: {
    title: 'My',
    accent: 'Companion',
    sub: 'Make Tena feel like home.',
    heroTitle: 'Your companion, your way',
    heroBody: 'Choose how Tena looks and feels. Every detail matters.',
    heroIcon: '✨',
  },
  stats: {
    title: 'My',
    accent: 'Progress',
    sub: 'Patterns over the last 7 days. No judgment — just clarity.',
    heroTitle: 'Small streaks > big resolutions',
    heroBody: 'Even showing up on a hard day is a win. Yene gobez, you showed up.',
    heroIcon: '📈',
  },
  explore: {
    title: 'Explore',
    accent: 'Places',
    sub: 'Tell Tena what you feel like doing — and discover where to go.',
    heroTitle: 'Your city, your vibe',
    heroBody: 'Parks, cafes, cinemas, game zones — Tena knows Addis. Just say what you\'re in the mood for.',
    heroIcon: '🗺️',
  },
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [me, setMe] = useState(null)
  const [err, setErr] = useState(null)
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const isMobile = () => window.innerWidth <= 820

  const [onboarding, setOnboarding] = useState(() => !localStorage.getItem('tena-onboarded'))
  const [theme, setTheme] = useState(() => localStorage.getItem('tena-theme') || 'warm')
  const [chatMood, setChatMood] = useState('idle')
  const [dashRefreshKey, setDashRefreshKey] = useState(0)
  const [companion, setCompanion] = useState(() => {
    try {
      const saved = localStorage.getItem('tena-companion')
      return saved ? JSON.parse(saved) : { gender: 'gentle', ageGroup: 'adult', style: 'modern', skinTone: 'warm' }
    } catch {
      return { gender: 'gentle', ageGroup: 'adult', style: 'modern', skinTone: 'warm' }
    }
  })

  const [activeCrisis, setActiveCrisis] = useState(null)
  const [recommendations, setRecommendations] = useState([])

  const fetchRecommendations = useCallback(() => {
    api.getRecommendations()
      .then(setRecommendations)
      .catch((e) => console.error("Failed to fetch recommendations:", e))
  }, [])

  useEffect(() => {
    api.me().then(setMe).catch((e) => setErr(e.message))
    fetchRecommendations()
  }, [fetchRecommendations])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme === 'night' ? 'night' : '')
    localStorage.setItem('tena-theme', theme)
  }, [theme])

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('tena-onboarded', 'true')
    setOnboarding(false)
  }, [])

  const handleCompanionUpdate = useCallback((updates) => {
    const updated = { ...companion, ...updates }
    setCompanion(updated)
    localStorage.setItem('tena-companion', JSON.stringify(updated))
  }, [companion])

  const handleCheckinLogged = useCallback(() => {
    setDashRefreshKey(k => k + 1)
  }, [])

  const sections = [...new Set(NAV.map((n) => n.section))]
  const page = PAGES[tab]

  if (onboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} companion={companion} />
  }

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="menu-btn" onClick={() => setOpen(true)}>☰</button>
              <h1 className="page-title">
                {page.title} <span className="accent">{page.accent}</span>
              </h1>
            </div>
            <div className="page-sub" style={{ marginLeft: 54 }}>{page.sub}</div>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => t === 'warm' ? 'night' : 'warm')}
            title="Toggle theme"
          >
            {theme === 'warm' ? '🌙' : '☀️'}
          </button>
        </div>

        {tab !== 'home' && (
          <section className="hero">
            <div className="hero-icon">{page.heroIcon}</div>
            <h2>{page.heroTitle}</h2>
            <p>{page.heroBody}</p>
          </section>
        )}

        {err && (
          <div className="toast-error">
            <span>⚠️ {err} — Check the server is running on :8000 and your .env is configured.</span>
            <button className="toast-close" onClick={() => setErr(null)}>×</button>
          </div>
        )}

        {tab === 'home' && (
          <div className="home-layout">
            <div className="home-greeting">
              <div className="home-greeting-text">
                <span className="home-eyebrow">{(() => {
                  const h = new Date().getHours()
                  if (h < 12) return 'Selam — Good morning'
                  if (h < 18) return 'Selam — Good afternoon'
                  return 'Selam — Good evening'
                })()}</span>
                <h2>{me?.first_name ? `${me.first_name},` : 'Friend,'} <span className="accent">how is your heart today?</span></h2>
                <p>Take a breath. I'm right here — log a mood, talk it out, or just sit with me a moment.</p>
                <div className="home-cta-row">
                  <button className="btn-primary" onClick={() => setTab('chat')}>💬 Start a chat</button>
                  <button className="btn-ghost" onClick={() => setTab('voice')}>🎙️ Voice journal</button>
                </div>
              </div>
              <div className="home-greeting-art">
                <Companion mood={chatMood} size="lg" companion={companion} showStatus={true} />
              </div>
            </div>

            <div className="home-quick-grid">
              <button className="quick-tile q-gold" onClick={() => setTab('chat')}>
                <div className="quick-ico">💬</div>
                <div className="quick-title">Talk to Tena</div>
                <div className="quick-sub">Vent, reflect, code-switch</div>
              </button>
              <button className="quick-tile q-terra" onClick={() => setTab('voice')}>
                <div className="quick-ico">🎙️</div>
                <div className="quick-title">Voice Journal</div>
                <div className="quick-sub">Speak it, release it</div>
              </button>
              <button className="quick-tile q-green" onClick={() => setTab('stats')}>
                <div className="quick-ico">📈</div>
                <div className="quick-title">My Progress</div>
                <div className="quick-sub">Last 7 days at a glance</div>
              </button>
              <button className="quick-tile q-coffee" onClick={() => setTab('explore')}>
                <div className="quick-ico">🗺️</div>
                <div className="quick-title">Explore Places</div>
                <div className="quick-sub">Find your next outing</div>
              </button>
            </div>

            <div className="home-bottom-section">
              <div className="home-checkin-tip-row">
                <div className="home-checkin-col">
                  <CheckIn onLogged={handleCheckinLogged} />
                </div>
                <aside className="home-tip">
                  <div className="home-tip-badge">Today's tip</div>
                  <h3>The 5-4-3-2-1 reset</h3>
                  <p>Feeling overwhelmed? Name <b>5</b> things you see, <b>4</b> you can touch, <b>3</b> you hear, <b>2</b> you smell, and <b>1</b> you taste. It tells your nervous system: <i>you are safe</i>.</p>
                  <div className="home-tip-foot">— Tena · ጤና</div>
                </aside>
              </div>
              <div className="home-dashboard-wide">
                <Dashboard refreshKey={dashRefreshKey} />
              </div>
            </div>
          </div>
        )}
        {tab === 'chat' && <Chat companion={companion} onMoodChange={setChatMood} onCrisis={setActiveCrisis} onRecommendationsUpdated={fetchRecommendations} />}
        {tab === 'voice' && <VoiceJournal onCrisis={setActiveCrisis} onRecommendationsUpdated={fetchRecommendations} />}
        {tab === 'explore' && <Explore />}
        {tab === 'qr' && <QRCode />}
        {tab === 'customize' && <Customize companion={companion} onUpdate={handleCompanionUpdate} />}
        {tab === 'stats' && <Dashboard refreshKey={dashRefreshKey} />}

      </main>

      <CrisisModal data={activeCrisis} onClose={() => setActiveCrisis(null)} />
      <PitchBadge onTriggerDemo={() => setActiveCrisis({})} />
    </div>
  )
}

