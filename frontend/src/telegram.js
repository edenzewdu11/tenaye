export function tg() {
  return window.Telegram?.WebApp
}

export function tgUser() {
  return tg()?.initDataUnsafe?.user || null
}

export function tgInitData() {
  return tg()?.initData || ''
}

export function haptic(type = 'light') {
  try { tg()?.HapticFeedback?.impactOccurred(type) } catch {}
}
