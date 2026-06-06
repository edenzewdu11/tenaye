import { tgInitData } from './telegram'

const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api'
const DEV_ID = import.meta.env.VITE_DEV_TELEGRAM_ID
const DEV_NAME = import.meta.env.VITE_DEV_TELEGRAM_NAME || 'Demo User'

function getOrCreateWebUserId() {
  let id = localStorage.getItem('tena-web-user-id')
  if (!id) {
    // Generate a stable random positive integer that fits in a BigInt-safe range
    id = String(Math.floor(Math.random() * 9_000_000_000) + 1_000_000_000)
    localStorage.setItem('tena-web-user-id', id)
  }
  return id
}

function getWebUserName() {
  return localStorage.getItem('tena-web-user-name') || 'Web User'
}

function authHeaders() {
  const initData = tgInitData()
  const h = {}
  if (initData) {
    h['X-Telegram-Init-Data'] = initData
  } else if (DEV_ID) {
    h['X-Telegram-Id'] = String(DEV_ID)
    h['X-Telegram-Name'] = DEV_NAME
  } else {
    // Web app: use a stable persistent ID
    h['X-Telegram-Id'] = getOrCreateWebUserId()
    h['X-Telegram-Name'] = getWebUserName()
  }
  return h
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
  auth: {
    login: (email, password) => req('/auth/login/', { method: 'POST', json: { email, password } }),
    register: (email, password, firstName, lastName) => req('/auth/register/', { method: 'POST', json: { email, password, first_name: firstName, last_name: lastName } }),
    logout: (refreshToken) => req('/auth/logout/', { method: 'POST', json: { refresh_token: refreshToken } }),
    profile: () => req('/auth/profile/'),
  },
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
