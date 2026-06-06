import React, { useState } from 'react'
import { generateBotQRCode, BOT_TELEGRAM_URL } from '../utils/qrcode'

export default function QRCode() {
  const [copied, setCopied] = useState(false)
  
  const qrImageUrl = generateBotQRCode()
  
  const copyUrl = () => {
    navigator.clipboard.writeText(BOT_TELEGRAM_URL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="card" style={{ textAlign: 'center', maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Scan to Chat with Tena</h2>
      <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', margin: '1rem 0' }}>
        <img 
          src={qrImageUrl} 
          alt="Scan to chat with Tena bot" 
          style={{ width: '200px', height: '200px' }}
        />
      </div>
      <p style={{ color: '#666', margin: '1rem 0' }}>
        Scan this QR code with your phone camera<br/>
        or tap the link below
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
        <a 
          href={BOT_TELEGRAM_URL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn"
          style={{ textDecoration: 'none' }}
        >
          🤖 Open in Telegram
        </a>
        <button 
          onClick={copyUrl}
          className="btn"
          style={{ background: 'var(--color-primary)', fontSize: '0.9rem' }}
        >
          {copied ? '✅ Copied!' : '📋 Copy Link'}
        </button>
      </div>
    </div>
  )
}
