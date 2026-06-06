import { useState } from 'react'
import Companion from './Companion'

const STEPS = [
  {
    title: <>Selam! I'm <span className="highlight">Tena</span></>,
    body: 'Your AI companion, rooted in Ethiopian warmth. I\'m here to listen, support, and walk with you — like a friend who truly understands.',
    mood: 'happy',
    companion: {},
  },
  {
    title: <>Talk to me like <span className="highlight">a friend</span></>,
    body: 'Chat about anything — stress, joy, everyday life. I speak English, Amharic, and "Afranglish." No judgment, just genuine conversation.',
    mood: 'listening',
    companion: {},
  },
  {
    title: <>Your companion, <span className="highlight">your style</span></>,
    body: 'Choose how Tena looks and feels. Male, female, young, elder, modern, or traditional — your companion reflects what makes you comfortable.',
    mood: 'idle',
    companion: {},
  },
  {
    title: <>Ready to <span className="highlight">begin?</span></>,
    body: 'Every conversation is a step toward wellbeing. ጤናህ ይጠበቅ። (May your health be preserved.) Let\'s start this journey together.',
    mood: 'empathetic',
    companion: {},
  },
]

export default function Onboarding({ onComplete, companion }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]

  function next() {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1)
    } else {
      onComplete()
    }
  }

  function skip() {
    onComplete()
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-step" key={step}>
          <div className="onboarding-companion-area">
            <Companion mood={current.mood} size="md" showName={false} showStatus={false} companion={companion} />
          </div>

          <h1 className="onboarding-title">{current.title}</h1>
          <p className="onboarding-body">{current.body}</p>

          <div className="onboarding-dots">
            {STEPS.map((_, i) => (
              <button
                key={i}
                className={`onboarding-dot ${i === step ? 'active' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <div className="onboarding-btn-area">
            <button className="btn" onClick={next}>
              {step < STEPS.length - 1 ? 'Continue' : 'Start my journey'}
            </button>
            {step < STEPS.length - 1 && (
              <button className="onboarding-skip" onClick={skip}>
                Skip intro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
