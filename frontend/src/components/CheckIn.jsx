import { useState } from 'react'
import { api } from '../api'
import { haptic } from '../telegram'

const MOODS = [
  { key: 'good', emoji: '🟢', label: 'Good' },
  { key: 'surviving', emoji: '🟡', label: 'Surviving' },
  { key: 'burned', emoji: '🔴', label: 'Burned Out' },
]

export default function CheckIn({ onLogged }) {
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState('')

  async function pick(mood) {
    setSelected(mood)
    haptic('medium')
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      await api.addCheckin(selected, note)
      setNote('')
      onLogged?.()
      haptic('heavy')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <h2>Daily Check-in</h2>
      <div className="mood-row">
        {MOODS.map((m) => (
          <button
            key={m.key}
            className={`mood-btn ${m.key} ${selected === m.key ? 'selected' : ''}`}
            onClick={() => pick(m.key)}
          >
            <span className="emoji">{m.emoji}</span>
            {m.label}
          </button>
        ))}
      </div>
      <div className="input-row">
        <input
          placeholder="Anything specific? (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <button className="btn" onClick={save} disabled={!selected || saving}>
          {saving ? '...' : 'Log'}
        </button>
      </div>
    </div>
  )
}
