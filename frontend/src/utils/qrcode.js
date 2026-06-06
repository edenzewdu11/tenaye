// QR Code generator for Tena bot
export function generateBotQRCode() {
  const botUsername = 'TenawellnessBot'
  const telegramUrl = `https://t.me/${botUsername}`
  
  // Using a simple QR code API (you can replace with any QR service)
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(telegramUrl)}`
}

export const BOT_TELEGRAM_URL = 'https://t.me/TenawellnessBot'
