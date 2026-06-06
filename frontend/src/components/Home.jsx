import { useState, useEffect } from 'react'
import { api } from '../api'
import { haptic } from '../telegram'

const MOODS = [
  { key: 'good', emoji: '🟢', label: 'Good' },
  { key: 'surviving', emoji: '🟡', label: 'Surviving' },
  { key: 'burned', emoji: '🔴', label: 'Burned Out' },
]

export default function Home({ me, setMe, onCrisis }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')
  const [dashboardData, setDashboardData] = useState(null)
  const [todayCheckin, setTodayCheckin] = useState(null)

  useEffect(() => {
    fetchDashboard()
    fetchTodayCheckin()
  }, [])

  const fetchDashboard = async () => {
    try {
      const data = await api.dashboard()
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to fetch dashboard:', error)
    }
  }

  const fetchTodayCheckin = async () => {
    try {
      const checkins = await api.checkins()
      const today = new Date().toDateString()
      const todayCheckin = checkins.find(c => 
        new Date(c.created_at).toDateString() === today
      )
      setTodayCheckin(todayCheckin)
    } catch (error) {
      console.error('Failed to fetch today checkin:', error)
    }
  }

  async function pick(mood) {
    setSelected(mood)
    haptic('medium')
  }

  async function saveCheckin() {
    if (!selected) return
    setSaving(true)
    try {
      await api.addCheckin(selected, note)
      setNote('')
      setSelected(null)
      fetchTodayCheckin()
      fetchDashboard()
      haptic('heavy')
    } finally {
      setSaving(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <div className="home-container">
      {/* Greeting Hero */}
      <div className="home-greeting">
        <div className="greeting-content">
          <h1>{getGreeting()}, {me?.first_name || 'friend'}! 🌅</h1>
          <p>I've been waiting for you. How are you feeling today?</p>
        </div>
        <div className="greeting-illustration">
          <div className="sun-icon">☀️</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-quick">
        <h2>Quick Actions</h2>
        <div className="home-quick-grid">
          <div className="quick-tile">
            <div className="tile-icon">💬</div>
            <h3>Chat with Tena</h3>
            <p>Talk about what's on your mind</p>
          </div>
          <div className="quick-tile">
            <div className="tile-icon">🎙️</div>
            <h3>Voice Journal</h3>
            <p>Speak your thoughts freely</p>
          </div>
          <div className="quick-tile">
            <div className="tile-icon">📊</div>
            <h3>Progress</h3>
            <p>See your wellness journey</p>
          </div>
          <div className="quick-tile">
            <div className="tile-icon">🎨</div>
            <h3>Customize</h3>
            <p>Personalize your companion</p>
          </div>
        </div>
      </div>

      {/* Today's Check-in */}
      {!todayCheckin && (
        <div className="home-checkin">
          <h2>Daily Check-in</h2>
          <p>How are you feeling today?</p>
          <div className="mood-pills">
            {MOODS.map((m) => (
              <button
                key={m.key}
                className={`mood-pill ${m.key} ${selected === m.key ? 'selected' : ''}`}
                onClick={() => pick(m.key)}
              >
                <span className="pill-emoji">{m.emoji}</span>
                {m.label}
              </button>
            ))}
          </div>
          {selected && (
            <div className="checkin-note">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)..."
                rows={3}
              />
              <button
                onClick={saveCheckin}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Check-in'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Dashboard */}
      {dashboardData && (
        <div className="home-dashboard">
          <h2>Your Week at a Glance</h2>
          <div className="dashboard-summary">
            <div className="summary-card">
              <div className="summary-icon">📈</div>
              <div className="summary-content">
                <h3>Average Mood</h3>
                <p>{dashboardData.average ? `${dashboardData.average.toFixed(1)}/10` : 'No data'}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🔥</div>
              <div className="summary-content">
                <h3>Streak</h3>
                <p>{dashboardData.streak_days} days</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">✅</div>
              <div className="summary-content">
                <h3>Total Check-ins</h3>
                <p>{dashboardData.total_checkins}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Tip */}
      <div className="home-tip">
        <div className="tip-icon">💡</div>
        <div className="tip-content">
          <h3>Today's Tip</h3>
          <p>Take 3 deep breaths before responding to stressful situations. It gives you a moment to think and react more calmly.</p>
        </div>
      </div>
    </div>
  )
}
