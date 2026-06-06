#!/usr/bin/env python3
"""
Simple Telegram Bot using long polling
Run this directly: python simple_bot.py
"""
import os
import sys
import django
import requests
import time
import logging

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Bot configuration
BOT_TOKEN = "8219870105:AAHGiy0tMyrAD16iK_Va3jKwekznzAV43bw"
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
            logger.info(f"Message sent to {chat_id}")
            return True
        else:
            logger.error(f"Error sending message: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        logger.error(f"Exception sending message: {e}")
        return False

def handle_message(update):
    """Handle incoming message"""
    try:
        message = update.get('message', {})
        chat_id = message['chat']['id']
        text = message.get('text', '')
        
        logger.info(f"Received message: {text} from chat {chat_id}")
        
        if text == '/start':
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
            send_message(chat_id, "Your weekly progress feature is coming soon! 📊")
        
        else:
            # Handle other messages
            send_message(chat_id, "I'm here to help! Use /start to begin, /check for a mood check-in, or /week for your progress.")
    
    except Exception as e:
        logger.error(f"Error handling message: {e}")

def handle_callback_query(update):
    """Handle callback queries (button clicks)"""
    try:
        callback_query = update.get('callback_query', {})
        chat_id = callback_query['message']['chat']['id']
        callback_data = callback_query['data']
        
        logger.info(f"Callback: {callback_data} from chat {chat_id}")
        
        if callback_data.startswith('ci:'):
            mood = callback_data.split(':')[1]
            mood_messages = {
                'good': "Love that 🟢. Hold onto whatever's working today.",
                'surviving': "🟡 Surviving counts. Be gentle with yourself today.",
                'burned': "🔴 Heard. Open Tena and let's talk for a minute."
            }
            
            # Edit the message with response
            payload = {
                'chat_id': chat_id,
                'message_id': callback_query['message']['message_id'],
                'text': mood_messages.get(mood, "Thanks for checking in!")
            }
            
            try:
                response = requests.post(f"{API_URL}/editMessageText", json=payload)
                if response.status_code == 200:
                    logger.info(f"Callback handled for {mood}")
                else:
                    logger.error(f"Error handling callback: {response.status_code} - {response.text}")
            except Exception as e:
                logger.error(f"Exception handling callback: {e}")
    
    except Exception as e:
        logger.error(f"Error handling callback query: {e}")

def main():
    """Main bot loop"""
    logger.info("Starting Tena Telegram Bot...")
    logger.info("Bot is now running! Send /start to @TenawellnessBot")
    
    offset = None
    
    while True:
        try:
            updates = get_updates(offset)
            
            if updates and updates.get('ok'):
                results = updates.get('result', [])
                
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
            logger.info("Bot stopped by user")
            break
        except Exception as e:
            logger.error(f"Error in main loop: {e}")
            time.sleep(5)  # Wait before retrying

if __name__ == '__main__':
    main()
