import { tgInitData } from './telegram'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
const DEV_ID = import.meta.env.VITE_DEV_TELEGRAM_ID
const DEV_NAME = import.meta.env.VITE_DEV_TELEGRAM_NAME || 'Demo User'

export function getStoredToken() {
  return localStorage.getItem('tena-token')
}

export function setStoredToken(token) {
  if (token) localStorage.setItem('tena-token', token)
  else localStorage.removeItem('tena-token')
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('tena-user') || 'null') } catch { return null }
}

export function setStoredUser(user) {
  if (user) localStorage.setItem('tena-user', JSON.stringify(user))
  else localStorage.removeItem('tena-user')
}

export function isGuest() {
  return !getStoredToken() && !tgInitData()
}

function authHeaders() {
  const initData = tgInitData()
  if (initData) return { 'X-Telegram-Init-Data': initData }

  const token = getStoredToken()
  if (token) return { Authorization: `Bearer ${token}` }

  if (DEV_ID) {
    return {
      'X-Telegram-Id': String(DEV_ID),
      'X-Telegram-Name': DEV_NAME,
    }
  }
  return {}
}

async function req(path, { method = 'GET', json, body, headers = {} } = {}) {
  const h = { ...authHeaders(), ...headers }
  if (json !== undefined) {
    h['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  }
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`${res.status}: ${text || res.statusText}`)
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (email, password, name) =>
    req('/auth/register/', { method: 'POST', json: { email, password, name } }),
  login: (email, password) =>
    req('/auth/login/', { method: 'POST', json: { email, password } }),

  me: () => req('/me/'),
  chatHistory: () => req('/chat/'),
  sendChat: (content) => req('/chat/', { method: 'POST', json: { content } }),
  checkins: () => req('/checkins/'),
  addCheckin: (mood, note = '') => req('/checkins/', { method: 'POST', json: { mood, note } }),
  dashboard: () => req('/dashboard/'),
  journals: () => req('/journals/'),
  uploadVoice: async (blob, mime = 'audio/webm') => {
    const fd = new FormData()
    fd.append('audio', blob, `voice.${mime.split('/')[1] || 'webm'}`)
    const res = await fetch(`${BASE}/voice/`, {
      method: 'POST',
      headers: authHeaders(),
      body: fd,
    })
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`)
    return res.json()
  },
}
