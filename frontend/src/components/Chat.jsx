import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { containsCrisisKeywords } from '../utils/crisisDetector'

import CrisisCard from './CrisisCard'
import Companion from './Companion'
import { haptic } from '../telegram'

export default function Chat({ companion, onMoodChange, onCrisis }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [crisis, setCrisis] = useState(null)

  const boxRef = useRef(null)

  useEffect(() => {
    api.chatHistory().then(setMessages).catch(() => {})
  }, [])

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  useEffect(() => {
    if (messages.length === 0) {
      onMoodChange?.('idle')
      return
    }
    const last = messages[messages.length - 1]
    if (last.role === 'assistant') {
      if (last.crisis_flag) onMoodChange?.('empathetic')
      else onMoodChange?.('happy')
    } else {
      onMoodChange?.('listening')
    }
  }, [messages, onMoodChange])

  async function send() {
    const text = input.trim()
    if (!text || sending) return

    if (containsCrisisKeywords(text)) {
      setInput('')
      onCrisis({})
      return
    }

    setSending(true)
    setInput('')
    onMoodChange?.('listening')
    const optimistic = { id: `tmp-${Date.now()}`, role: 'user', content: text }
    setMessages((m) => [...m, optimistic])
    setTyping(true)
    try {
      const res = await api.sendChat(text)
      setTyping(false)
      setMessages((m) => [...m, { id: `r-${Date.now()}`, role: 'assistant', content: res.reply, crisis_flag: !!res.crisis }])
      if (res.crisis) {
        onCrisis({ resources: res.resources, message: res.reply })
        haptic('heavy')
        onMoodChange?.('empathetic')
      } else {
        onMoodChange?.('happy')
      }
    } catch (e) {
      setTyping(false)
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: 'assistant', content: `Error: ${e.message}` }])
      onMoodChange?.('empathetic')
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {crisis && <CrisisCard resources={crisis.resources} message={crisis.message} />}
      <div className="companion-chat-area">
        <div className="companion-col">
          <Companion mood={typing ? 'thinking' : (sending ? 'listening' : 'idle')} companion={companion} showStatus={true} />
        </div>
        <div className="chat-col">
          <div className="card">
            <h2>Chat with Tena</h2>
            <div className="chat" ref={boxRef}>
              {messages.length === 0 && (
                <>
                  <div className="muted" style={{ marginBottom: 8 }}>
                    Say hi — in English, Amharic, or both. Endemen neh? 👋
                  </div>
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
              {typing && (
                <div className="typing-indicator">
                  <span /><span /><span />
                </div>
              )}
            </div>
            <div className="input-row">
              <input
                placeholder="Type how you're feeling..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                onFocus={() => onMoodChange?.('listening')}
              />
              <button className="btn" onClick={send} disabled={sending}>
                {sending ? '...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
