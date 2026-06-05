import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import CrisisCard from './CrisisCard'
import { haptic } from '../telegram'

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [crisis, setCrisis] = useState(null)
  const boxRef = useRef(null)

  useEffect(() => {
    api.chatHistory().then(setMessages).catch(() => {})
  }, [])

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function send() {
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setInput('')
    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', content: text }
    setMessages((m) => [...m, optimistic])
    try {
      const res = await api.sendChat(text)
      setMessages((m) => [...m, { id: `r-${Date.now()}`, role: 'assistant', content: res.reply, crisis_flag: !!res.crisis }])
      if (res.crisis) {
        setCrisis({ resources: res.resources, message: res.reply })
        haptic('heavy')
      }
    } catch (e) {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', content: `Error: ${e.message}` }])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {crisis && <CrisisCard resources={crisis.resources} message={crisis.message} />}
      <div className="card">
        <h2>Chat with Tena</h2>
        <div className="chat" ref={boxRef}>
          {messages.length === 0 && (
            <>
              <div className="muted">Say hi — in English, Amharic, or both. Endemen neh? 👋</div>
              <div className="chips">
                <span className="chip" onClick={() => setInput("I'm stressed about my exams")}>📚 Exam stress</span>
                <span className="chip" onClick={() => setInput("Things are too expensive lately")}>💸 Cost of living</span>
                <span className="chip" onClick={() => setInput("I feel exhausted and burned out")}>🥱 Burnout</span>
                <span className="chip" onClick={() => setInput("Family expectations are heavy")}>👨‍👩‍👧 Family</span>
              </div>
            </>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role} ${m.crisis_flag ? 'crisis' : ''}`}>
              {m.content}
            </div>
          ))}
        </div>
        <div className="input-row">
          <input
            placeholder="Type how you're feeling..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="btn" onClick={send} disabled={sending}>
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </>
  )
}
