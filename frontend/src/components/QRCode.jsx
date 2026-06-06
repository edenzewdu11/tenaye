import React, { useState } from 'react'
import { generateBotQRCode, BOT_TELEGRAM_URL, generateWebsiteQRCode, WEBSITE_URL } from '../utils/qrcode'

export default function QRCode() {
  const [copiedBot, setCopiedBot] = useState(false)
  const [copiedWeb, setCopiedWeb] = useState(false)
  
  const botQrImageUrl = generateBotQRCode()
  const websiteQrImageUrl = generateWebsiteQRCode()
  
  const copyBotUrl = () => {
    navigator.clipboard.writeText(BOT_TELEGRAM_URL)
    setCopiedBot(true)
    setTimeout(() => setCopiedBot(false), 2000)
  }
  
  const copyWebUrl = () => {
    navigator.clipboard.writeText(WEBSITE_URL)
    setCopiedWeb(true)
    setTimeout(() => setCopiedWeb(false), 2000)
  }
  
  return (
    <div style={{ maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Connect with Tena</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        {/* Bot QR Code */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>🤖 Chat with Tena Bot</h3>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', margin: '1rem 0' }}>
            <img 
              src={botQrImageUrl} 
              alt="Scan to chat with Tena bot" 
              style={{ width: '200px', height: '200px' }}
            />
          </div>
          <p style={{ color: '#666', margin: '1rem 0', fontSize: '0.9rem' }}>
            Scan to chat with Tena on Telegram<br/>
            Get instant wellness support
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
              onClick={copyBotUrl}
              className="btn"
              style={{ background: 'var(--color-primary)', fontSize: '0.9rem' }}
            >
              {copiedBot ? '✅ Copied!' : '📋 Copy Bot Link'}
            </button>
          </div>
        </div>

        {/* Website QR Code */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h3>🌐 Tena Website</h3>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', display: 'inline-block', margin: '1rem 0' }}>
            <img 
              src={websiteQrImageUrl} 
              alt="Scan to visit Tena website" 
              style={{ width: '200px', height: '200px' }}
            />
          </div>
          <p style={{ color: '#666', margin: '1rem 0', fontSize: '0.9rem' }}>
            Scan to visit Tena website<br/>
            Full wellness app experience
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }}>
            <a 
              href={WEBSITE_URL} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn"
              style={{ textDecoration: 'none' }}
            >
              🌐 Open Website
            </a>
            <button 
              onClick={copyWebUrl}
              className="btn"
              style={{ background: 'var(--color-primary)', fontSize: '0.9rem' }}
            >
              {copiedWeb ? '✅ Copied!' : '📋 Copy Web Link'}
            </button>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '2rem', padding: '1rem', background: 'var(--warm-bg)', borderRadius: '12px' }}>
        <h4 style={{ marginBottom: '1rem' }}>💙 Choose Your Experience</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', textAlign: 'left' }}>
          <div>
            <strong>🤖 Telegram Bot:</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
              <li>Quick wellness check-ins</li>
              <li>Instant AI responses</li>
              <li>Mood tracking</li>
              <li>Mobile-first experience</li>
            </ul>
          </div>
          <div>
            <strong>🌐 Website:</strong>
            <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem', fontSize: '0.9rem' }}>
              <li>Full dashboard</li>
              <li>Voice journaling</li>
              <li>Progress tracking</li>
              <li>Desktop & mobile</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
