import { useState } from 'react'
import Companion from './Companion'

const INTERESTS = [
  { key: 'music',    label: 'Music',    ico: '🎵', desc: 'Tizita, jazz, hip-hop…' },
  { key: 'art',      label: 'Art',      ico: '🎨', desc: 'Visual, craft, design' },
  { key: 'food',     label: 'Food',     ico: '🍲', desc: 'Injera, exploring flavors' },
  { key: 'language', label: 'Language', ico: '🗣️', desc: 'Amharic, English, more' },
  { key: 'nature',   label: 'Nature',   ico: '🌿', desc: 'Outdoors, animals, earth' },
  { key: 'sport',    label: 'Sport',    ico: '⚽', desc: 'Football, running, fitness' },
  { key: 'tech',     label: 'Tech',     ico: '💻', desc: 'Code, gadgets, AI' },
  { key: 'reading',  label: 'Reading',  ico: '📚', desc: 'Books, poetry, stories' },
  { key: 'other',    label: 'Other',    ico: '✨', desc: 'Something uniquely you' },
]

const INFO_STEPS = [
  {
    title: <>Selam! I'm <span className="highlight">Tena</span></>,
    body: 'Your AI companion, rooted in Ethiopian warmth. I\'m here to listen, support, and walk with you — like a friend who truly understands.',
    mood: 'happy',
  },
  {
    title: <>Talk to me like <span className="highlight">a friend</span></>,
    body: 'Chat about anything — stress, joy, everyday life. I speak English, Amharic, and "Afranglish." No judgment, just genuine conversation.',
    mood: 'listening',
  },
  {
    title: <>Your companion, <span className="highlight">your style</span></>,
    body: 'Choose how Tena looks and feels. Male, female, young, elder, modern, or traditional — your companion reflects what makes you comfortable.',
    mood: 'idle',
  },
]

// total dot count: info steps + interests step + final step
const TOTAL_STEPS = INFO_STEPS.length + 2

export default function Onboarding({ onComplete, companion }) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState([])

  const isInfoStep = step < INFO_STEPS.length
  const isInterestsStep = step === INFO_STEPS.length
  const isFinalStep = step === TOTAL_STEPS - 1

  function toggleInterest(key) {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  function next() {
    if (step < TOTAL_STEPS - 1) {
      setStep(s => s + 1)
    } else {
      localStorage.setItem('tena-interests', JSON.stringify(selected))
      onComplete()
    }
  }

  const current = isInfoStep ? INFO_STEPS[step] : null

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-container">
        <div className="onboarding-step" key={step}>

          {/* Companion avatar — hide on interests step to give grid space */}
          {!isInterestsStep && (
            <div className="onboarding-companion-area">
              <Companion
                mood={isFinalStep ? 'empathetic' : current.mood}
                size="md"
                showName={false}
                showStatus={false}
                companion={companion}
              />
            </div>
          )}

          {/* Info steps */}
          {isInfoStep && (
            <>
              <h1 className="onboarding-title">{current.title}</h1>
              <p className="onboarding-body">{current.body}</p>
            </>
          )}

          {/* Interests step */}
          {isInterestsStep && (
            <>
              <h1 className="onboarding-title">
                What do you <span className="highlight">love?</span>
              </h1>
              <p className="onboarding-body">
                Pick what excites you — Tena will use this to make every conversation feel more like <em>you</em>. Choose as many as you like.
              </p>
              <div className="interest-grid">
                {INTERESTS.map(item => (
                  <button
                    key={item.key}
                    className={`interest-tile ${selected.includes(item.key) ? 'selected' : ''}`}
                    onClick={() => toggleInterest(item.key)}
                    type="button"
                  >
                    <span className="interest-ico">{item.ico}</span>
                    <span className="interest-label">{item.label}</span>
                    <span className="interest-desc">{item.desc}</span>
                    {selected.includes(item.key) && (
                      <span className="interest-check">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Final step */}
          {isFinalStep && (
            <>
              <h1 className="onboarding-title">
                Ready to <span className="highlight">begin?</span>
              </h1>
              <p className="onboarding-body">
                {selected.length > 0
                  ? `Perfect — I'll keep ${selected.map(k => INTERESTS.find(i => i.key === k)?.label).join(', ')} in mind. ጤናህ ይጠበቅ።`
                  : 'Every conversation is a step toward wellbeing. ጤናህ ይጠበቅ። Let\'s start this journey together.'}
              </p>
            </>
          )}

          {/* Dots */}
          <div className="onboarding-dots">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <button
                key={i}
                className={`onboarding-dot ${i === step ? 'active' : ''}`}
                onClick={() => i < step && setStep(i)}
                aria-label={`Step ${i + 1}`}
              />
            ))}
          </div>

          <div className="onboarding-btn-area">
            <button
              className="btn"
              onClick={next}
              disabled={isInterestsStep && selected.length === 0}
            >
              {isFinalStep ? 'Start my journey' : 'Continue'}
            </button>
            {!isFinalStep && (
              <button
                className="onboarding-skip"
                onClick={() => { localStorage.setItem('tena-interests', JSON.stringify(selected)); onComplete() }}
              >
                Skip intro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
