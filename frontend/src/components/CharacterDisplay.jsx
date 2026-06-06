import { useState, useEffect } from 'react'

const MOOD_IMAGE_MAP = {
  idle: '/images/normalimage.png',
  listening: '/images/listening.png',
  thinking: '/images/thinking.png',
  speaking: '/images/talking.png',
  happy: '/images/normalimage.png',
  confused: '/images/normalimage.png',
  empathetic: '/images/normalimage.png',
  goodbye: '/images/normalimage.png',
}

export default function CharacterDisplay({ mood = 'idle', size = 'md' }) {
  const [imgA, setImgA] = useState(() => MOOD_IMAGE_MAP.idle)
  const [imgB, setImgB] = useState(() => MOOD_IMAGE_MAP.idle)
  const [showB, setShowB] = useState(false)

  const target = MOOD_IMAGE_MAP[mood] || MOOD_IMAGE_MAP.idle
  const currentSource = showB ? imgB : imgA

  useEffect(() => {
    if (target === currentSource) return

    const img = new Image()
    img.onload = () => {
      if (showB) {
        setImgA(target)
        setShowB(false)
      } else {
        setImgB(target)
        setShowB(true)
      }
    }
    img.src = target
  }, [mood, target, currentSource, showB])

  const w = size === 'sm' ? 110 : size === 'lg' ? 240 : 180

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: w * 1.35,
        flexShrink: 0,
      }}
    >
      <img
        src={imgA}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: showB ? 0 : 1,
          transition: 'opacity 0.45s ease',
          pointerEvents: 'none',
        }}
      />
      <img
        src={imgB}
        alt=""
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: showB ? 1 : 0,
          transition: 'opacity 0.45s ease',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
