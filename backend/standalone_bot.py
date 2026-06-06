#!/usr/bin/env python3
"""
Simple Standalone Telegram Bot
No Django required - Just run: python standalone_bot.py
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

def get_updates(offset=None):
    """Get updates from Telegram"""
    params = {'timeout': 30}
    if offset:
        params['offset'] = offset
    
    try:
        response = requests.get(f"{API_URL}/getUpdates", params=params)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"Error getting updates: {response.status_code} - {response.text}")
            return None
    except Exception as e:
        logger.error(f"Exception getting updates: {e}")
        return None

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
        user_name = message.get('from', {}).get('first_name', 'Friend')
        
        logger.info(f"📩 Received message: '{text}' from {user_name} (chat {chat_id})")
        
        if text == '/start':
            logger.info(f"🚀 Sending welcome message to {user_name}")
            
            # Send welcome message
            welcome_text = (
                "ሰላም 👋 I'm *Tena* — your wellness companion.\n\n"
                "• Tap *Open Tena* for the full app (chat, voice journal, dashboard).\n"
                "• Tap *Open in browser* to use the website version.\n"
                "• Use /check anytime for a quick mood check-in.\n"
                "• Use /week to see your last 7 days."
            )
            
            if send_message(chat_id, welcome_text):
                # Send check-in prompt
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
            # Handle other messages
            logger.info(f"💬 Sending help message to {user_name}")
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
    """Handle callback queries (button clicks)"""
    try:
        callback_query = update.get('callback_query', {})
        chat_id = callback_query['message']['chat']['id']
        callback_data = callback_query['data']
        user_name = callback_query.get('from', {}).get('first_name', 'Friend')
        
        logger.info(f"🎯 Callback: '{callback_data}' from {user_name} (chat {chat_id})")
        
        if callback_data.startswith('ci:'):
            mood = callback_data.split(':')[1]
            mood_messages = {
                'good': f"Love that 🟢 {user_name}! Hold onto whatever's working today. You've got this! 💪",
                'surviving': f"🟡 {user_name}, surviving counts. Be gentle with yourself today. Tomorrow is a new chance. 🌱",
                'burned': f"🔴 Heard, {user_name}. Take a deep breath. Open Tena and let's talk for a minute. I'm here for you. 🤗"
            }
            
            # Edit the message with response
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
                    logger.error(f"❌ Error handling callback: {response.status_code} - {response.text}")
            except Exception as e:
                logger.error(f"❌ Exception handling callback: {e}")
        
        elif callback_data == 'show:week':
            payload = {
                'chat_id': chat_id,
                'message_id': callback_query['message']['message_id'],
                'text': "📊 Your weekly progress is coming soon!\n\nKeep checking in daily to build your wellness streak! 🌟\n\nEvery check-in matters - you're doing great! 💙"
            }
            
            try:
                response = requests.post(f"{API_URL}/editMessageText", json=payload)
                if response.status_code == 200:
                    logger.info("✅ Week callback handled")
                else:
                    logger.error(f"❌ Error handling week callback: {response.status_code} - {response.text}")
            except Exception as e:
                logger.error(f"❌ Exception handling week callback: {e}")
    
    except Exception as e:
        logger.error(f"❌ Error handling callback query: {e}")

def main():
    """Main bot loop"""
    print("🚀 Starting Tena Telegram Bot...")
    print("📱 Send /start to @TenawellnessBot to begin!")
    print("⏳ Bot is listening for messages...")
    print("🛑 Press Ctrl+C to stop")
    print("=" * 50)
    
    offset = None
    
    while True:
        try:
            updates = get_updates(offset)
            
            if updates and updates.get('ok'):
                results = updates.get('result', [])
                
                if results:
                    logger.info(f"📨 Processing {len(results)} update(s)")
                
                for update in results:
                    # Process the update
                    if 'message' in update:
                        handle_message(update)
                    elif 'callback_query' in update:
                        handle_callback_query(update)
                    
                    # Update offset to mark this update as processed
                    offset = update['update_id'] + 1
            
            # Small delay to prevent overwhelming the API
            time.sleep(1)
            
        except KeyboardInterrupt:
            print("\n🛑 Bot stopped by user")
            break
        except Exception as e:
            logger.error(f"❌ Error in main loop: {e}")
            time.sleep(5)  # Wait before retrying

if __name__ == '__main__':
    main()
