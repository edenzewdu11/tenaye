import React, { useState } from 'react'

export default function PitchBadge({ onTriggerDemo }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating Badge */}
      <button 
        className="pitch-badge-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Hackathon Pitch Info & Demo"
      >
        💡 <span className="text">Pitch & Demo Mode</span>
      </button>

      {/* Slide-out Drawer */}
      <div className={`pitch-drawer ${isOpen ? 'open' : ''}`}>
        <div className="pitch-drawer-header">
          <h3>🏆 Hackathon Pitch Panel</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
        </div>
        
        <div className="pitch-drawer-body">
          <p className="pitch-intro">
            Judges look at mental health apps with a hyper-critical eye regarding safety. 
            Here is how <b>Tena (ጤና)</b> nails the <b>Crisis Protocol</b>:
          </p>

          <div className="pitch-point">
            <h4>🛡️ 1. Responsibility Boundary</h4>
            <p>
              Tena never attempts to act as a therapist, diagnosis engine, or friend in times of crisis. 
              The second self-harm is detected (client-side or server LLM), normal app usage is interrupted 
              and the handoff to certified crisis responders occurs immediately.
            </p>
          </div>

          <div className="pitch-point">
            <h4>⚡ 2. Zero-Friction Design</h4>
            <p>
              Helplines are hardcoded, always free, and displayed in a full-screen layout. 
              Users get tap-to-call and tap-to-text access instantly without paywalls or multi-step menus.
            </p>
          </div>

          <div className="pitch-point">
            <h4>🔒 3. Data Privacy & Anonymity</h4>
            <p>
              Self-harm triggers are extremely sensitive. To respect user privacy and security, Tena does 
              not log this incident on the database in association with their public profile, preserving anonymity.
            </p>
          </div>

          <div className="pitch-demo-zone">
            <h4>🧪 Test the Safety System</h4>
            <p>You can trigger the safety screen by typing "I want to end my life" in the chat, or click the button below to test it instantly:</p>
            <button 
              className="btn btn-simulate-crisis" 
              onClick={() => {
                onTriggerDemo()
                setIsOpen(false)
              }}
            >
              🔥 Simulate Crisis Trigger
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
