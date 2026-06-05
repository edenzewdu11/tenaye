import { useEffect, useState } from 'react'
import Chat from './components/Chat'
import VoiceJournal from './components/VoiceJournal'
import Dashboard from './components/Dashboard'
import { api } from './api'

const NAV = [
  { key: 'home',  label: 'Home',         ico: '🏠', section: 'Wellness' },
  { key: 'chat',  label: 'Chat with Tena', ico: '💬', section: 'Wellness' },
  { key: 'voice', label: 'Voice Journal', ico: '🎙️', section: 'Wellness' },
  { key: 'stats', label: 'My Progress',   ico: '📊', section: 'Insights' },
]

const PAGES = {
  home: {
    title: 'Welcome back',
    accent: 'to Tena',
    sub: 'Your safe space for honest check-ins, real talk, and tiny wins.',
    heroTitle: 'How are you holding up today?',
    heroBody: 'Take a breath. Log a quick mood, then come back when you need to talk. ጤናህ ይጠብቅ።',
    heroIcon: '💙',
  },
  chat: {
    title: 'Chat',
    accent: 'with Tena',
    sub: 'Write in English, Amharic, or both — Tena understands you.',
    heroTitle: 'Talk to me like a friend',
    heroBody: 'I won\'t diagnose, I won\'t lecture. I\'ll just listen — and maybe suggest one tiny thing.',
    heroIcon: '💬',
  },
  voice: {
    title: 'Voice',
    accent: 'Journal',
    sub: 'Speak it out loud. I\'ll transcribe, sense your mood, and reflect it back.',
    heroTitle: 'Press, speak, release',
    heroBody: 'Holding your voice for 10 seconds is sometimes lighter than typing 10 sentences.',
    heroIcon: '🎙️',
  },
  stats: {
    title: 'My',
    accent: 'Progress',
    sub: 'Patterns over the last 7 days. No judgment — just clarity.',
    heroTitle: 'Small streaks > big resolutions',
    heroBody: 'Even logging on a hard day is a win. Yene gobez, you showed up.',
    heroIcon: '📈',
  },
}

export default function App() {
  const [tab, setTab] = useState('home')
  const [me, setMe] = useState(null)
  const [err, setErr] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    api.me().then(setMe).catch((e) => setErr(e.message))
  }, [])

  const sections = [...new Set(NAV.map((n) => n.section))]
  const page = PAGES[tab]

  return (
    <div className="layout">
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="logo">ጤ</div>
          <div>
            <h1>Tena</h1>
            <small>{me ? `Selam, ${me.first_name || 'friend'}` : 'Wellness companion'}</small>
          </div>
        </div>

        {sections.map((s) => (
          <div key={s}>
            <div className="nav-section-label">{s}</div>
            {NAV.filter((n) => n.section === s).map((n) => (
              <button
                key={n.key}
                className={`nav-item ${tab === n.key ? 'active' : ''}`}
                onClick={() => { setTab(n.key); setOpen(false) }}
              >
                <span className="ico">{n.ico}</span>
                {n.label}
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
            <button className="menu-btn" onClick={() => setOpen(true)}>☰</button>
            <h1 className="page-title">
              {page.title} <span className="accent">{page.accent}</span>
            </h1>
            <div className="page-sub">{page.sub}</div>
          </div>
        </div>

        <section className="hero">
          <div className="hero-icon">{page.heroIcon}</div>
          <h2>{page.heroTitle}</h2>
          <p>{page.heroBody}</p>
        </section>

        {err && (
          <div className="card" style={{ borderColor: '#fecaca' }}>
            <strong style={{ color: '#b91c1c' }}>Connection issue:</strong>
            <div className="muted">{err}</div>
            <div className="muted" style={{ marginTop: 6 }}>
              Make sure the Django server is running on :8000 and your <code>.env</code> is configured.
            </div>
          </div>
        )}

        {(tab === 'home' || tab === 'stats') && <Dashboard />}
        {tab === 'chat' && <Chat />}
        {tab === 'voice' && <VoiceJournal />}
      </main>
    </div>
  )
}
