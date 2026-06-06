import { useMemo } from 'react'
import CharacterDisplay from './CharacterDisplay'

const MOOD_LABELS = {
  idle:       ['Here with you', 'Ready to listen', 'Right here'],
  listening:  ["I'm listening", 'Tell me more', 'I hear you'],
  thinking:   ['Let me think...', 'Hmm...', 'Thinking...'],
  speaking:   ['...', '...', '...'],
  happy:      ["That's wonderful!", "I'm so glad!", 'Amazing!'],
  empathetic: ['I understand', "I'm here for you", "You're not alone"],
}

const MOOD_AURA = {
  idle:       'rgba(212,160,23,0.22)',
  listening:  'rgba(232,99,12,0.22)',
  thinking:   'rgba(194,101,60,0.22)',
  speaking:   'rgba(212,160,23,0.26)',
  happy:      'rgba(27,122,63,0.25)',
  confused:   'rgba(160,120,60,0.22)',
  empathetic: 'rgba(27,122,63,0.22)',
  goodbye:    'rgba(100,100,140,0.22)',
}

export default function Companion({ mood = 'idle', size = 'md', companion = {}, showName = true, showStatus = true }) {
  const scale = size === 'sm' ? 0.55 : size === 'lg' ? 1.15 : 0.85
  const displayW = 200

  const statusText = useMemo(
    () => MOOD_LABELS[mood]?.[Math.floor(Math.random() * 3)] ?? MOOD_LABELS.idle[0],
    [mood]
  )

  const auraColor = MOOD_AURA[mood] ?? MOOD_AURA.idle

  return (
    <div
      className="companion-container"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom', width: displayW, position: 'relative' }}
    >
      {/* breathing aura */}
      <div style={{
        position: 'absolute',
        top: '5%', left: '50%',
        transform: 'translateX(-50%)',
        width: displayW * 0.95,
        height: displayW * 0.95,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
        transition: 'background 0.5s ease',
        pointerEvents: 'none',
        zIndex: 0,
        animation: 'auraBreath 3s ease-in-out infinite',
      }} />

      {/* character image */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <CharacterDisplay mood={mood} size={size} />
      </div>

      {(showName || showStatus) && (
        <div className="companion-reflection">
          {showName && <div className="companion-name">Tena</div>}
          {showStatus && (
            <div className="companion-status indicator">
              <span className={`dot ${mood}`} />
              {statusText}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
