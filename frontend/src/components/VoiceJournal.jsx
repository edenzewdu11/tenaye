import { useEffect, useRef, useState } from 'react'
import { api } from '../api'
import CrisisCard from './CrisisCard'
import { haptic } from '../telegram'

export default function VoiceJournal() {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)
  const [crisis, setCrisis] = useState(null)
  const [entries, setEntries] = useState([])
  const [elapsed, setElapsed] = useState(0)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])
  const startedRef = useRef(0)
  const timerRef = useRef(null)

  useEffect(() => {
    api.journals().then(setEntries).catch(() => {})
  }, [])

  async function start() {
    if (recording) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mime = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : (MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : '')
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
      mediaRef.current = rec
      chunksRef.current = []
      rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data)
      rec.onstop = onStop
      rec.start()
      startedRef.current = Date.now()
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startedRef.current) / 1000)), 250)
      setRecording(true)
      haptic('medium')
    } catch (e) {
      alert('Microphone permission required: ' + e.message)
    }
  }

  function stop() {
    if (!recording) return
    mediaRef.current?.stop()
    clearInterval(timerRef.current)
    setRecording(false)
    haptic('heavy')
  }

  async function onStop() {
    setProcessing(true)
    try {
      const blob = new Blob(chunksRef.current, { type: mediaRef.current?.mimeType || 'audio/webm' })
      const res = await api.uploadVoice(blob, blob.type)
      setResult(res)
      if (res.crisis) setCrisis({ resources: res.resources, message: res.reply })
      const list = await api.journals()
      setEntries(list)
    } catch (e) {
      alert('Upload failed: ' + e.message)
    } finally {
      setProcessing(false)
      mediaRef.current?.stream?.getTracks().forEach((t) => t.stop())
    }
  }

  return (
    <>
      {crisis && <CrisisCard resources={crisis.resources} message={crisis.message} />}
      <div className="card">
        <h2>Voice Journal</h2>
        <div className="voice-stage">
          <button
            className={`voice-orb ${recording ? 'recording' : ''}`}
            onPointerDown={start}
            onPointerUp={stop}
            onPointerCancel={stop}
            onPointerLeave={() => recording && stop()}
            disabled={processing}
            aria-label="Hold to record"
          >
            {processing ? '⏳' : recording ? '⏺' : '🎙️'}
          </button>
          <div className="voice-status">
            {processing
              ? 'Analyzing your voice…'
              : recording
                ? <>Listening · <span className="timer">{elapsed}s</span> · release to send</>
                : 'Press and hold to speak'}
          </div>
        </div>

        <div className="tip">
          <div className="ico">💡</div>
          <div className="body">
            <b>Tip:</b> speak naturally — Amharic, English, or "Afranglish".
            Tena keeps your voice private and only stores the transcript and your mood label.
          </div>
        </div>

        {result && !result.crisis && (
          <div className="journal" style={{ marginTop: 12 }}>
            <div>
              <strong>You said</strong>
              {result.entry?.sentiment && <span className="sentiment">{result.entry.sentiment}</span>}
            </div>
            <div style={{ marginTop: 6 }}>{result.entry?.transcript || '(no transcript)'}</div>
            {result.reply && (
              <div className="msg assistant" style={{ marginTop: 10 }}>{result.reply}</div>
            )}
          </div>
        )}
      </div>

      {entries.length > 0 && (
        <div className="card">
          <h2>Recent Entries</h2>
          {entries.slice(0, 5).map((e) => (
            <div className="journal" key={e.id}>
              <div className="muted">
                {new Date(e.created_at).toLocaleString()}
                {e.sentiment && <span className="sentiment">{e.sentiment}</span>}
              </div>
              <div style={{ marginTop: 4 }}>{e.summary || e.transcript}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
