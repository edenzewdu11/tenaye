import { useState } from 'react'
import Companion from './Companion'

const CHARACTERS = [
  { gender: 'female', ageGroup: 'young', label: 'Young Woman', desc: 'Shuruba braids, bright spirit' },
  { gender: 'female', ageGroup: 'adult', label: 'Adult Woman', desc: 'Elegant updo, serene presence' },
  { gender: 'female', ageGroup: 'elder', label: 'Elder Woman', desc: 'Wrapped hair, gentle wisdom' },
  { gender: 'male', ageGroup: 'young', label: 'Young Man', desc: 'Curly fade, grounded energy' },
  { gender: 'male', ageGroup: 'adult', label: 'Adult Man', desc: 'Neat cut, calm strength' },
  { gender: 'male', ageGroup: 'elder', label: 'Elder Man', desc: 'Silver temples, patient heart' },
  { gender: 'gentle', ageGroup: 'young', label: 'Young Soul', desc: 'Soft features, open spirit' },
  { gender: 'gentle', ageGroup: 'adult', label: 'Adult Soul', desc: 'Elegant lines, quiet grace' },
  { gender: 'gentle', ageGroup: 'elder', label: 'Elder Soul', desc: 'Gentle eyes, deep roots' },
]

const GENDERS = [
  { key: 'feminine', icon: '🌺', label: 'Feminine' },
  { key: 'masculine', icon: '🌿', label: 'Masculine' },
  { key: 'gentle', icon: '✨', label: 'Gentle' },
]

const AGE_GROUPS = [
  { key: 'young', icon: '🌱', label: 'Young' },
  { key: 'adult', icon: '🌳', label: 'Adult' },
  { key: 'elder', icon: '🏛️', label: 'Elder' },
]

const STYLES = [
  { key: 'modern', icon: '💫', label: 'Modern' },
  { key: 'traditional', icon: '🏵️', label: 'Traditional' },
  { key: 'natural', icon: '🍃', label: 'Natural' },
]

const SKIN_TONES = [
  { key: 'warm', icon: '☀️', label: 'Warm' },
  { key: 'golden', icon: '🌅', label: 'Golden' },
  { key: 'deep', icon: '🌄', label: 'Deep' },
]

export default function Customize({ companion, onUpdate }) {
  const [gender, setGender] = useState(companion.gender || 'gentle')
  const [ageGroup, setAgeGroup] = useState(companion.ageGroup || 'adult')
  const [style, setStyle] = useState(companion.style || 'modern')
  const [skinTone, setSkinTone] = useState(companion.skinTone || 'warm')

  const genderMap = { feminine: 'female', masculine: 'male', gentle: 'gentle' }
  const mappedGender = genderMap[gender] || 'gentle'

  function apply() {
    onUpdate({ gender, ageGroup, style, skinTone })
  }

  function selectCharacter(g, a) {
    const reverseMap = { female: 'feminine', male: 'masculine', gentle: 'gentle' }
    setGender(reverseMap[g] || 'gentle')
    setAgeGroup(a)
  }

  const isSelected = (g, a) => mappedGender === g && ageGroup === a

  return (
    <div className="customize-container">
      <div className="customize-preview">
        <Companion mood="happy" size="lg" companion={{ gender: mappedGender, ageGroup, style, skinTone }} showStatus={false} />
      </div>

      <div className="customize-section">
        <h3>Choose Your Companion</h3>
        <p className="section-desc">Select the character that feels right for you</p>
        <div className="character-grid">
          {CHARACTERS.map((ch) => {
            const sel = isSelected(ch.gender, ch.ageGroup)
            return (
              <button
                key={`${ch.gender}-${ch.ageGroup}`}
                className={`character-card ${sel ? 'selected' : ''}`}
                onClick={() => selectCharacter(ch.gender, ch.ageGroup)}
              >
                <div className="character-card-avatar">
                  <Companion
                    mood="idle"
                    size="sm"
                    companion={{ gender: ch.gender, ageGroup: ch.ageGroup, style, skinTone }}
                    showName={false}
                    showStatus={false}
                  />
                </div>
                <div className="character-card-info">
                  <div className="character-card-name">{ch.label}</div>
                  <div className="character-card-desc">{ch.desc}</div>
                </div>
                {sel && <div className="character-card-check">✓</div>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="customize-controls-row">
        <div className="customize-section customize-section--tight">
          <h3>Style</h3>
          <div className="customize-options">
            {STYLES.map(s => (
              <button
                key={s.key}
                className={`customize-option ${style === s.key ? 'selected' : ''}`}
                onClick={() => setStyle(s.key)}
              >
                <span className="opt-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="customize-section customize-section--tight">
          <h3>Skin Tone</h3>
          <div className="customize-options">
            {SKIN_TONES.map(s => (
              <button
                key={s.key}
                className={`customize-option ${skinTone === s.key ? 'selected' : ''}`}
                onClick={() => setSkinTone(s.key)}
              >
                <span className="opt-icon">{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button className="btn" onClick={apply} style={{ alignSelf: 'center', padding: '14px 36px', fontSize: 16 }}>
        Apply to Tena
      </button>
    </div>
  )
}
