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
      {/* Greeting Hero with Character */}
      <div className="home-greeting">
        <div className="greeting-content">
          <h1>{getGreeting()}, {me?.first_name || 'friend'}! 🌅</h1>
          <p>I've been waiting for you. How are you feeling today?</p>
        </div>
        <div className="greeting-character">
          <img 
            src="/images/normalimage.png" 
            alt="Tena Companion" 
            className="character-image normal"
          />
          <div className="character-status">
            <div className="status-dot"></div>
            <span>Ready to listen</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="home-quick">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <div className="section-accent"></div>
        </div>
        <div className="home-quick-grid">
          <div className="quick-tile chat-tile">
            <div className="tile-icon-wrapper">
              <div className="tile-icon">💬</div>
              <div className="tile-bg"></div>
            </div>
            <div className="tile-content">
              <h3>Chat with Tena</h3>
              <p>Talk about what's on your mind</p>
            </div>
            <div className="tile-arrow">→</div>
          </div>
          <div className="quick-tile voice-tile">
            <div className="tile-icon-wrapper">
              <div className="tile-icon">🎙️</div>
              <div className="tile-bg"></div>
            </div>
            <div className="tile-content">
              <h3>Voice Journal</h3>
              <p>Speak your thoughts freely</p>
            </div>
            <div className="tile-arrow">→</div>
          </div>
          <div className="quick-tile progress-tile">
            <div className="tile-icon-wrapper">
              <div className="tile-icon">📊</div>
              <div className="tile-bg"></div>
            </div>
            <div className="tile-content">
              <h3>Progress</h3>
              <p>See your wellness journey</p>
            </div>
            <div className="tile-arrow">→</div>
          </div>
          <div className="quick-tile customize-tile">
            <div className="tile-icon-wrapper">
              <div className="tile-icon">🎨</div>
              <div className="tile-bg"></div>
            </div>
            <div className="tile-content">
              <h3>Customize</h3>
              <p>Personalize your companion</p>
            </div>
            <div className="tile-arrow">→</div>
          </div>
        </div>
      </div>

      {/* Today's Check-in */}
      {!todayCheckin && (
        <div className="home-checkin">
          <div className="checkin-header">
            <div className="checkin-character">
              <img 
                src="/images/listening.png" 
                alt="Tena Listening" 
                className="character-image listening"
              />
              <div className="listening-indicator">
                <div className="sound-wave"></div>
                <div className="sound-wave"></div>
                <div className="sound-wave"></div>
              </div>
            </div>
            <div className="checkin-content">
              <h2>Daily Check-in</h2>
              <p>I'm here to listen. How are you feeling today?</p>
            </div>
          </div>
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
                placeholder="Share more about how you're feeling (optional)..."
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
          <div className="section-header">
            <h2>Your Week at a Glance</h2>
            <div className="section-accent"></div>
          </div>
          <div className="dashboard-summary">
            <div className="summary-card mood-card">
              <div className="summary-icon-wrapper">
                <div className="summary-icon">📈</div>
                <div className="icon-bg"></div>
              </div>
              <div className="summary-content">
                <h3>Average Mood</h3>
                <p>{dashboardData.average ? `${dashboardData.average.toFixed(1)}/10` : 'No data'}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${(dashboardData.average || 0) * 10}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="summary-card streak-card">
              <div className="summary-icon-wrapper">
                <div className="summary-icon">🔥</div>
                <div className="icon-bg"></div>
              </div>
              <div className="summary-content">
                <h3>Streak</h3>
                <p>{dashboardData.streak_days} days</p>
                <div className="streak-dots">
                  {[...Array(Math.min(dashboardData.streak_days, 7))].map((_, i) => (
                    <div key={i} className="streak-dot filled"></div>
                  ))}
                  {[...Array(Math.max(7 - dashboardData.streak_days, 0))].map((_, i) => (
                    <div key={i} className="streak-dot"></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="summary-card checkins-card">
              <div className="summary-icon-wrapper">
                <div className="summary-icon">✅</div>
                <div className="icon-bg"></div>
              </div>
              <div className="summary-content">
                <h3>Total Check-ins</h3>
                <p>{dashboardData.total_checkins}</p>
                <div className="checkin-milestone">
                  {dashboardData.total_checkins >= 30 ? '🏆 Master' : 
                   dashboardData.total_checkins >= 14 ? '⭐ Pro' : 
                   dashboardData.total_checkins >= 7 ? '💪 Rising' : '🌱 Beginner'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Today's Tip */}
      <div className="home-tip">
        <div className="tip-character">
          <img 
            src="/images/thinking.png" 
            alt="Tena Thinking" 
            className="character-image thinking"
          />
          <div className="thinking-bubbles">
            <div className="bubble bubble-1"></div>
            <div className="bubble bubble-2"></div>
            <div className="bubble bubble-3"></div>
          </div>
        </div>
        <div className="tip-content">
          <div className="tip-header">
            <h3>Today's Wisdom</h3>
            <div className="tip-badge">💡</div>
          </div>
          <p>Take 3 deep breaths before responding to stressful situations. It gives you a moment to think and react more calmly. Your mind will thank you.</p>
          <div className="tip-actions">
            <button className="tip-action-btn">
              <span>💭</span>
              Reflect
            </button>
            <button className="tip-action-btn">
              <span>📝</span>
              Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
