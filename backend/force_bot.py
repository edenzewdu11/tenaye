#!/usr/bin/env python3
"""
Force Bot - Clears conflicts and starts fresh
"""
import requests
import time
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bot configuration
BOT_TOKEN = "8984244223:AAGWPEQ8_0cjupoOemwZRUxUhjHLij7FbD8"
API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"

def clear_all_conflicts():
    """Clear all existing bot conflicts"""
    print("🧹 Clearing all bot conflicts...")
    
    try:
        # Delete webhook
        response = requests.post(f"{API_URL}/deleteWebhook")
        if response.status_code == 200:
            print("✅ Webhook cleared")
        
        # Get all pending updates to clear the queue
        response = requests.get(f"{API_URL}/getUpdates", params={'offset': -1})
        if response.status_code == 200:
            updates = response.json().get('result', [])
            print(f"📨 Cleared {len(updates)} pending updates")
        
        print("✅ All conflicts cleared!")
        return True
        
    except Exception as e:
        print(f"❌ Error clearing conflicts: {e}")
        return False

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

def handle_message(update):
    """Handle incoming message"""
    try:
        message = update.get('message', {})
        chat_id = message['chat']['id']
        text = message.get('text', '')
        user = message.get('from', {})
        user_name = user.get('first_name', 'Friend')
        is_bot = user.get('is_bot', False)
        
        # Filter out messages from other bots and spam
        if is_bot:
            logger.info(f"🤖 Ignoring message from bot: {user_name}")
            return
        
        # Filter out spam content
        spam_keywords = ['porn', '🔥', '🔞', 'AI porn', 'best AI porn', 'evadast_bot']
        text_lower = text.lower()
        if any(keyword in text_lower for keyword in spam_keywords):
            logger.info(f"🚫 Filtering spam message: {text[:50]}...")
            return
        
        logger.info(f"📩 Received: '{text}' from {user_name} (chat {chat_id})")
        
        if text == '/start':
            print(f"🚀 Sending welcome to {user_name}")
            
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
            print(f"🔍 Sending mood check-in to {user_name}")
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
        
        else:
            print(f"💬 Sending help to {user_name}")
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
    
    except Exception as e:
        logger.error(f"❌ Error handling message: {e}")

def handle_callback_query(update):
    """Handle callback queries"""
    try:
        callback_query = update.get('callback_query', {})
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
                else:
                    logger.error(f"❌ Error handling callback: {response.status_code}")
            except Exception as e:
                logger.error(f"❌ Exception handling callback: {e}")
    
    except Exception as e:
        logger.error(f"❌ Error handling callback query: {e}")

def main():
    """Main bot loop"""
    print("🚀 FORCE STARTING Tena Telegram Bot...")
    
    # Clear conflicts first
    if not clear_all_conflicts():
        print("❌ Failed to clear conflicts")
        return
    
    print("📱 Send /start to @TenawellnessBot to begin!")
    print("⏳ Bot is listening for messages...")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    offset = None
    
    while True:
        try:
            # Get updates with longer timeout
            params = {'timeout': 60}
            if offset:
                params['offset'] = offset
            
            response = requests.get(f"{API_URL}/getUpdates", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok'):
                    results = data.get('result', [])
                    
                    if results:
                        logger.info(f"📨 Processing {len(results)} update(s)")
                    
                    for update in results:
                        if 'message' in update:
                            handle_message(update)
                        elif 'callback_query' in update:
                            handle_callback_query(update)
                        
                        offset = update['update_id'] + 1
                else:
                    logger.error(f"❌ API Error: {data}")
            else:
                logger.error(f"❌ HTTP Error: {response.status_code}")
            
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("\n🛑 Bot stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Error in main loop: {e}")
            time.sleep(5)

if __name__ == '__main__':
    main()
