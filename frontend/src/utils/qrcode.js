// QR Code generator for Tena bot
export function generateBotQRCode() {
  const botUsername = 'Tenayewellnessbot'
  const telegramUrl = `https://t.me/${botUsername}`
  
  // Using a simple QR code API (you can replace with any QR service)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(telegramUrl)}`
}

export const BOT_TELEGRAM_URL = 'https://t.me/Tenayewellnessbot'

// QR Code generator for Tena website
export function generateWebsiteQRCode() {
  const websiteUrl = 'https://tena-app.netlify.app'
  
  // Using a simple QR code API (you can replace with any QR service)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(websiteUrl)}`
}

export const WEBSITE_URL = 'https://tena-app.netlify.app'
