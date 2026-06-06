import { useState, useEffect, useMemo } from 'react'
import { removeBackground } from '@imgly/background-removal'
import companionImg from '../assets/companions.png'

const MOOD_LABELS = {
  idle:       ['Here with you', 'Ready to listen', 'Right here'],
  listening:  ["I'm listening", 'Tell me more', 'I hear you'],
  thinking:   ['Let me think...', 'Hmm...', 'Thinking...'],
  speaking:   ['...', '...', '...'],
  happy:      ["That's wonderful!", "I'm so glad!", 'Amazing!'],
  empathetic: ['I understand', "I'm here for you", "You're not alone"],
}

const MOOD_EMOJI = {
  idle:       null,
  listening:  '👂',
  thinking:   '🤔',
  speaking:   '💬',
  happy:      '😄',
  empathetic: '🤗',
}

const MOOD_AURA = {
  idle:       'rgba(212,160,23,0.22)',
  listening:  'rgba(232,99,12,0.22)',
  thinking:   'rgba(194,101,60,0.22)',
  speaking:   'rgba(212,160,23,0.26)',
  happy:      'rgba(27,122,63,0.25)',
  empathetic: 'rgba(27,122,63,0.22)',
}

// module-level cache so we only process once per session
let cachedUrl = null
let processing = false
const listeners = []

function getBgRemovedUrl(onReady) {
  if (cachedUrl) { onReady(cachedUrl); return }
  listeners.push(onReady)
  if (processing) return
  processing = true
  removeBackground(companionImg, {
    model: 'small',
    output: { format: 'image/png', quality: 1 },
  }).then(blob => {
    cachedUrl = URL.createObjectURL(blob)
    listeners.forEach(fn => fn(cachedUrl))
    listeners.length = 0
  }).catch(() => {
    // fallback to original on error
    cachedUrl = companionImg
    listeners.forEach(fn => fn(cachedUrl))
    listeners.length = 0
  })
}

export default function Companion({ mood = 'idle', size = 'md', companion = {}, showName = true, showStatus = true }) {
  const [imgSrc, setImgSrc] = useState(null)
  const scale = size === 'sm' ? 0.55 : size === 'lg' ? 1.15 : 0.85
  const displayW = 200

  useEffect(() => {
    getBgRemovedUrl(url => setImgSrc(url))
  }, [])

  const statusText = useMemo(
    () => MOOD_LABELS[mood]?.[Math.floor(Math.random() * 3)] ?? MOOD_LABELS.idle[0],
    [mood]
  )

  const emoji = MOOD_EMOJI[mood]
  const auraColor = MOOD_AURA[mood] ?? MOOD_AURA.idle

  return (
    <div
      className="companion-container"
      style={{ transform: `scale(${scale})`, transformOrigin: 'center bottom', width: displayW, position: 'relative' }}
    >
      {/* breathing aura — only visible once bg is removed */}
      {imgSrc && (
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
      )}

      {/* image or spinner */}
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="companion"
          style={{
            width: displayW,
            display: 'block',
            position: 'relative',
            zIndex: 1,
            filter: 'drop-shadow(0 8px 24px rgba(92,58,26,0.22))',
            animation: 'companionFadeIn 0.6s ease',
          }}
        />
      ) : (
        <div style={{
          width: displayW,
          height: 280,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: 'var(--warm-muted)',
          fontSize: 13,
        }}>
          <div className="companion-loading-spinner" />
          <span>Preparing companion…</span>
        </div>
      )}

      {/* mood emoji badge */}
      {imgSrc && emoji && (
        <div style={{
          position: 'absolute',
          top: 8, right: 4,
          fontSize: size === 'sm' ? 16 : 22,
          zIndex: 2,
          animation: 'emotionPop 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}>
          {emoji}
        </div>
      )}

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
