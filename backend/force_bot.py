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

def get_ai_response(user_message, user_name):
    """Get AI response using Gemini API"""
    try:
        import google.generativeai as genai
        
        # Configure Gemini API
        genai.configure(api_key="AIzaSyDj1mLihdo9x2PsvEaQ46ZdXP50q1U2OY4")
        model = genai.GenerativeModel('gemini-pro')
        
        # Create wellness-focused prompt
        prompt = f"""
        You are Tena, a compassionate wellness companion. You're chatting with {user_name}.
        
        User message: "{user_message}"
        
        Respond as a caring wellness companion:
        - Be warm, empathetic, and supportive
        - Provide helpful wellness advice when relevant
        - Ask follow-up questions to encourage reflection
        - Keep responses concise but meaningful
        - Use emojis occasionally to add warmth
        - Focus on mental health, emotional well-being, and self-care
        
        Response guidelines:
        - For emotional struggles: Offer comfort and practical coping strategies
        - For stress/anxiety: Suggest breathing exercises or mindfulness
        - For sleep issues: Provide sleep hygiene tips
        - For motivation: Give gentle encouragement
        - For general questions: Provide thoughtful wellness insights
        """
        
        response = model.generate_content(prompt)
        ai_text = response.text
        
        # Format response for Telegram
        formatted_response = f"💙 *Tena's Response*\n\n{ai_text}"
        
        logger.info(f"🤖 AI response generated for {user_name}")
        return formatted_response
        
    except Exception as e:
        logger.error(f"❌ Error getting AI response: {e}")
        
        # Fallback responses based on message content
        message_lower = user_message.lower()
        
        if any(word in message_lower for word in ['tired', 'exhausted', 'fatigue']):
            return f"💙 *Tena's Response*\n\nI hear that you're feeling tired, {user_name}. 💤\n\nRest is essential for wellness. Try:\n• A 10-minute power nap\n• Gentle stretching\n• Early bedtime tonight\n• Hydrating with water\n\nYour body is asking for care - listen to it. 🌟"
        
        elif any(word in message_lower for word in ['scared', 'afraid', 'anxiety', 'worried']):
            return f"💙 *Tena's Response*\n\nIt's okay to feel scared, {user_name}. 🤗\n\nTry this grounding exercise:\n• Name 5 things you can see\n• 4 things you can touch\n• 3 things you can hear\n• 2 things you can smell\n• 1 thing you can taste\n\nYou're safe and supported. 💙"
        
        elif any(word in message_lower for word in ['sad', 'depressed', 'unhappy']):
            return f"💙 *Tena's Response*\n\nI'm sorry you're feeling sad, {user_name}. 💙\n\nRemember: feelings are temporary. Try:\n• A short walk in fresh air\n• Listening to calming music\n• Talking to someone you trust\n• Writing down your thoughts\n\nThis feeling will pass. You're stronger than you know. 🌈"
        
        elif any(word in message_lower for word in ['good', 'great', 'happy', 'well']):
            return f"💙 *Tena's Response*\n\nWonderful to hear you're feeling good, {user_name}! 🌟\n\nLet's celebrate this moment:\n• What made you feel this way?\n• How can we maintain this energy?\n• Share this positivity with others\n\nYour joy is contagious! Keep shining bright. ✨"
        
        else:
            return f"💙 *Tena's Response*\n\nThank you for sharing with me, {user_name}. 💙\n\nI'm here to support your wellness journey. Tell me more about how you're feeling, or try:\n• /check for a mood check-in\n• /start to see all options\n\nI'm listening whenever you need me. 🌟"

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
            print(f"💬 Getting AI response for: '{text}' from {user_name}")
            ai_response = get_ai_response(text, user_name)
            send_message(chat_id, ai_response)
    
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
