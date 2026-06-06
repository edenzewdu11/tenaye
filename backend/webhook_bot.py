#!/usr/bin/env python3
"""
Webhook Bot - Uses webhook instead of long polling to avoid conflicts
"""
import requests
import threading
import time
import logging
from flask import Flask, request, jsonify

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bot configuration
BOT_TOKEN = "8984244223:AAGWPEQ8_0cjupoOemwZRUxUhjHLij7FbD8"
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"
WEBHOOK_URL = "https://tena-app.onrender.com/api/telegram-webhook/"

app = Flask(__name__)

def send_message(chat_id, text, reply_markup=None):
    """Send message to Telegram"""
    payload = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'Markdown'
    }
    
    if reply_markup:
        payload['reply_markup'] = reply_markup
    
    try:
        response = requests.post(f"{API_URL}/sendMessage", json=payload)
        if response.status_code == 200:
            logger.info(f"✅ Message sent to chat {chat_id}")
            return True
        else:
            logger.error(f"❌ Error sending message: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"❌ Exception sending message: {e}")
        return False

def handle_message(message):
    """Handle incoming message"""
    try:
        chat_id = message['chat']['id']
        text = message.get('text', '')
        user = message.get('from', {})
        user_name = user.get('first_name', 'Friend')
        is_bot = user.get('is_bot', False)
        
        # Filter out messages from other bots and spam
        if is_bot:
            logger.info(f"🤖 Ignoring message from bot: {user_name}")
            return {'status': 'ignored_bot'}
        
        # Filter out spam content
        spam_keywords = ['porn', '🔥', '🔞', 'AI porn', 'best AI porn', 'evadast_bot']
        text_lower = text.lower()
        if any(keyword in text_lower for keyword in spam_keywords):
            logger.info(f"🚫 Filtering spam message: {text[:50]}...")
            return {'status': 'filtered_spam'}
        
        logger.info(f"📩 Received: '{text}' from {user_name} (chat {chat_id})")
        
        if text == '/start':
            logger.info(f"🚀 Sending welcome to {user_name}")
            
            welcome_text = (
                "ሰላም 👋 I'm *Tena* — your wellness companion.\n\n"
                "• Tap *Open Tena* for the full app (chat, voice journal, dashboard).\n"
                "• Tap *Open in browser* to use the website version.\n"
                "• Use /check anytime for a quick mood check-in.\n"
                "• Use /week to see your last 7 days."
            )
            
            if send_message(chat_id, welcome_text):
                checkin_markup = {
                    'inline_keyboard': [
                        [
                            {'text': '🟢 Good', 'callback_data': 'ci:good'},
                            {'text': '🟡 Surviving', 'callback_data': 'ci:surviving'},
                            {'text': '🔴 Burned Out', 'callback_data': 'ci:burned'}
                        ],
                        [
                            {'text': '📊 Show my week', 'callback_data': 'show:week'}
                        ]
                    ]
                }
                send_message(chat_id, "How is your energy today?", checkin_markup)
        
        elif text == '/check':
            logger.info(f"🔍 Sending mood check-in to {user_name}")
            checkin_markup = {
                'inline_keyboard': [
                    [
                        {'text': '🟢 Good', 'callback_data': 'ci:good'},
                        {'text': '🟡 Surviving', 'callback_data': 'ci:surviving'},
                        {'text': '🔴 Burned Out', 'callback_data': 'ci:burned'}
                    ]
                ]
            }
            send_message(chat_id, "How is your energy today?", checkin_markup)
        
        elif text == '/week':
            logger.info(f"📊 Sending week info to {user_name}")
            send_message(chat_id, "Your weekly progress feature is coming soon! 📊\n\nKeep checking in daily to build your wellness streak! 🌟")
        
        else:
            logger.info(f"💬 Sending help to {user_name}")
            help_text = (
                f"Hi {user_name}! 👋\n\n"
                "I'm here to support your wellness journey.\n\n"
                "Try these commands:\n"
                "• /start - Welcome and quick check-in\n"
                "• /check - How are you feeling today?\n"
                "• /week - Your progress overview\n\n"
                "I'm always here to listen! 💙"
            )
            send_message(chat_id, help_text)
        
        return {'status': 'handled'}
    
    except Exception as e:
        logger.error(f"❌ Error handling message: {e}")
        return {'status': 'error', 'error': str(e)}

def handle_callback_query(callback_query):
    """Handle callback queries"""
    try:
        chat_id = callback_query['message']['chat']['id']
        callback_data = callback_query['data']
        user_name = callback_query.get('from', {}).get('first_name', 'Friend')
        
        logger.info(f"🎯 Callback: '{callback_data}' from {user_name}")
        
        if callback_data.startswith('ci:'):
            mood = callback_data.split(':')[1]
            mood_messages = {
                'good': f"Love that 🟢 {user_name}! Hold onto whatever's working today. You've got this! 💪",
                'surviving': f"🟡 {user_name}, surviving counts. Be gentle with yourself today. Tomorrow is a new chance. 🌱",
                'burned': f"🔴 Heard, {user_name}. Take a deep breath. I'm here for you. You're not alone. 🤗"
            }
            
            payload = {
                'chat_id': chat_id,
                'message_id': callback_query['message']['message_id'],
                'text': mood_messages.get(mood, f"Thanks for checking in, {user_name}! 💙")
            }
            
            try:
                response = requests.post(f"{API_URL}/editMessageText", json=payload)
                if response.status_code == 200:
                    logger.info(f"✅ Callback handled for mood: {mood}")
                    return {'status': 'handled'}
                else:
                    logger.error(f"❌ Error handling callback: {response.status_code}")
                    return {'status': 'error'}
            except Exception as e:
                logger.error(f"❌ Exception handling callback: {e}")
                return {'status': 'error'}
    
    except Exception as e:
        logger.error(f"❌ Error handling callback query: {e}")
        return {'status': 'error', 'error': str(e)}

@app.route('/webhook', methods=['POST'])
def webhook():
    """Handle webhook updates"""
    try:
        update = request.get_json()
        logger.info(f"📨 Webhook received update: {update}")
        
        if 'message' in update:
            result = handle_message(update['message'])
            return jsonify(result)
        elif 'callback_query' in update:
            result = handle_callback_query(update['callback_query'])
            return jsonify(result)
        
        return jsonify({'status': 'no_action'})
    
    except Exception as e:
        logger.error(f"❌ Error in webhook: {e}")
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'healthy', 'bot': 'Tena Wellness Bot'})

def setup_webhook():
    """Setup webhook for the bot"""
    try:
        # Delete existing webhook
        response = requests.post(f"{API_URL}/deleteWebhook")
        if response.status_code == 200:
            logger.info("✅ Existing webhook deleted")
        
        # Set new webhook
        payload = {'url': WEBHOOK_URL}
        response = requests.post(f"{API_URL}/setWebhook", json=payload)
        
        if response.status_code == 200:
            logger.info("✅ Webhook set successfully")
            return True
        else:
            logger.error(f"❌ Error setting webhook: {response.text}")
            return False
    
    except Exception as e:
        logger.error(f"❌ Exception setting webhook: {e}")
        return False

def main():
    """Main function"""
    print("🚀 Starting Tena Webhook Bot...")
    
    # Setup webhook
    if not setup_webhook():
        print("❌ Failed to setup webhook")
        return
    
    print("📱 Send /start to @TenawellnessBot to begin!")
    print("🌐 Webhook running on http://localhost:5000/webhook")
    print("🏥 Health check: http://localhost:5000/health")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=False)

if __name__ == '__main__':
    main()
