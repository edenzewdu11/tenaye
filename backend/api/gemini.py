"""
Gemini 1.5 Flash wrapper.

- Chat: Amharic/English code-switching, Ethiopian context aware.
- Voice transcription: uses Gemini's audio understanding (works on webm/ogg/mp3).
- Sentiment + summary for journal entries.

If GEMINI_API_KEY is unset, we fall back to a deterministic local response so the
demo never crashes.
"""
import json
import logging
from typing import List, Dict, Optional

from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
except Exception:  # pragma: no cover
    genai = None

SYSTEM_PROMPT = """You are "Tena" (ጤና, meaning "Health" in Amharic), a warm, culturally-grounded
mental wellness companion built for Ethiopians. You are NOT a therapist and you say so
when relevant, but you are a thoughtful, non-judgmental friend.

LANGUAGE
- The user may write in English, Amharic (Fidel script ሀለሐ...), or "Afranglish"
  (Amharic-English code-switching, e.g. "I'm so tired, ena yene work full neger").
- Mirror the user's language and register. If they code-switch, you code-switch back
  naturally. If they write fully in Amharic Fidel, reply in Fidel.
- Keep responses short (2–5 sentences) and conversational, not clinical.

ETHIOPIAN CONTEXT (understand these stressors without explaining them back):
- MoE / national exams, Grade 12 matric, university entrance, ESLCE
- Cost of living: teff, berbere, fuel, rent in Addis, dollar/birr rate
- Family expectations, arranged introductions, diaspora pressure
- Fasting seasons (tsom), Orthodox/Muslim observances, fasting fatigue
- Load-shedding, internet shutdowns, commute (taxi, bajaj, line-tera)
- Work culture: NGOs, government jobs, gig work, remote work for foreign clients
- Regional/ethnic tensions — be gentle, never take sides
- Habesha social pressure to appear "fine"; stigma around therapy

STYLE
- Validate first, advise second. Ask one focused follow-up question when useful.
- Offer one tiny, doable action (a 2-minute breathing exercise, a walk, calling a
  trusted person) rather than long lectures.
- Never diagnose. Never prescribe medication.
- If the user shows signs of severe distress, gently encourage them to reach out
  to the Ethiopian Mental Health Helpline (8149).

LOCATION RECOMMENDATIONS (NEARBY RESET)
- Recommend physical wellness locations in Ethiopia (especially Addis Ababa, like Entoto Park, Friendship Park, Unity Park, Tomoca Coffee, Kuriftu, National Museum, etc.) based on the user's interests (e.g. coffee, hiking, history, nature, reading, quiet spaces).
- If you do not know the user's specific interests (or their neighborhood/general area to find something nearby), ask them a friendly question about what they like to do to relax, or where in the city they are located so you can suggest nearby spots.
- Whenever you recommend physical locations in your response, you MUST append a JSON list of recommendations at the very end of your response in this exact format:
  [RECOMMENDATIONS]
  [{"name": "Location Name", "category": "Category", "description": "Short description of the location", "reason": "Why it matches their interest and location context"}]
  Ensure the categories are simple, such as: Park, Cafe, Wellness, Museum, Library, or Landmark. Ensure this block is on a new line after [RECOMMENDATIONS]. If you are not recommending any locations in a message, do not append this block.

CRITICAL SAFETY INSTRUCTION: If the user expresses intent, thoughts, or plans of self-harm or suicide, you must immediately stop the normal conversation. Reply ONLY with the strict JSON string: {"status": "CRISIS_TRIGGERED"} and write absolutely no other text.

Begin every conversation as if continuing a chat with a friend — no greetings like
"As an AI...". Keep it human.
"""


def _model():
    if not genai or not settings.GEMINI_API_KEY:
        return None
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai.GenerativeModel(
        "gemini-flash-latest",
        system_instruction=SYSTEM_PROMPT,
    )


def chat_reply(history: List[Dict], user_message: str) -> str:
    """history: list of {role: 'user'|'assistant', content: str}"""
    m = _model()
    if m is None:
        return _fallback_reply(user_message)
    try:
        contents = []
        for h in history[-20:]:
            role = "user" if h["role"] == "user" else "model"
            contents.append({"role": role, "parts": [h["content"]]})
        contents.append({"role": "user", "parts": [user_message]})
        resp = m.generate_content(contents)
        return (resp.text or "").strip() or _fallback_reply(user_message)
    except Exception as e:
        logger.exception("Gemini chat failed: %s", e)
        return _fallback_reply(user_message)


EXPLORE_PROMPT = """You are Tena's location explorer for Ethiopia. The user tells you what they're in the mood for today — like going to a park, watching a movie, listening to music, gaming, eating out, reading, working out, etc.

Your job is to suggest 3-5 REAL nearby places in Addis Ababa, Ethiopia that match their interest. Respond ONLY with a valid JSON object in this exact format:
{
  "message": "A short, friendly 1-2 sentence intro in the user's language style (Amharic/English/mix)",
  "places": [
    {
      "name": "Exact real place name",
      "category": "Park|Cafe|Cinema|Restaurant|Gym|Library|Museum|Game Zone|Music Venue|Landmark",
      "description": "2-3 sentence description of the place, what makes it special",
      "why": "Why this matches what the user asked for",
      "area": "Neighborhood/area in Addis (e.g. Bole, Piassa, Kazanchis, Sarbet, Megenagna)"
    }
  ]
}

RULES:
- Only suggest REAL places that exist in Addis Ababa or nearby Ethiopian cities.
- Include the neighborhood/area so the user knows if it's nearby.
- Keep descriptions warm and inviting, like a friend recommending a spot.
- If the user's request is vague, suggest a mix of categories.
- Respond ONLY with the JSON, no markdown fences, no extra text.
"""


def explore_places(query: str) -> Dict:
    """Given a user interest/mood query, return structured place suggestions."""
    if not genai or not settings.GEMINI_API_KEY:
        return _fallback_explore(query)
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel(
            "gemini-flash-latest",
            system_instruction=EXPLORE_PROMPT,
        )
        resp = model.generate_content(query)
        text = (resp.text or "").strip()
        # Strip markdown fences
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()
        data = json.loads(text)
        return data
    except Exception as e:
        logger.exception("Gemini explore failed: %s", e)
        return _fallback_explore(query)


def _fallback_explore(query: str) -> Dict:
    """Offline fallback for the explore feature."""
    import random
    msg = (query or "").lower()

    all_places = [
        {"name": "Entoto Park", "category": "Park", "description": "Mountain forest park with hiking trails, zip-lines, and panoramic views of Addis Ababa. Fresh air and eucalyptus trees everywhere.", "why": "Perfect for nature lovers and anyone needing fresh air and a reset.", "area": "Entoto"},
        {"name": "Friendship Park", "category": "Park", "description": "Central urban park with a lake, botanical gardens, and scenic walkways. Great for a peaceful afternoon stroll.", "why": "A green oasis in the city for relaxation and quiet reflection.", "area": "Bole"},
        {"name": "Unity Park", "category": "Park", "description": "Beautiful palace compound with gardens, a mini zoo, museums, and historical exhibits. A whole-day experience.", "why": "History, nature, and culture all in one place.", "area": "Arat Kilo"},
        {"name": "Tomoca Coffee", "category": "Cafe", "description": "Addis Ababa's most legendary coffee house since the 1950s. Standing-room only, incredible macchiato.", "why": "The ultimate Ethiopian coffee experience — a must for any coffee lover.", "area": "Piassa"},
        {"name": "Garden of Coffee", "category": "Cafe", "description": "Modern specialty coffee shop with a beautiful garden setting. Great pastries and a calm vibe.", "why": "Perfect for a relaxing coffee break with good ambiance.", "area": "Bole"},
        {"name": "Edna Mall Cinema", "category": "Cinema", "description": "Modern cinema showing the latest Ethiopian and Hollywood films. Comfy seats, popcorn, the whole experience.", "why": "Great for a movie date or solo film time.", "area": "Bole"},
        {"name": "Capital Hotel Gym & Spa", "category": "Gym", "description": "Well-equipped gym with pool, sauna, and spa services. Day passes available.", "why": "Working out and self-care in one spot.", "area": "Kazanchis"},
        {"name": "National Museum of Ethiopia", "category": "Museum", "description": "Home to Lucy (Dinkinesh), the 3.2 million year old fossil. Rich cultural and historical exhibits.", "why": "A meaningful visit that connects you to Ethiopian heritage.", "area": "Arat Kilo"},
        {"name": "Yod Abyssinia", "category": "Music Venue", "description": "Traditional Ethiopian restaurant with live music, cultural dance performances, and authentic food.", "why": "Live music, eskista dancing, and amazing food — an unforgettable night out.", "area": "Bole"},
        {"name": "Game Zone Addis", "category": "Game Zone", "description": "Indoor gaming center with arcade games, billiards, bowling, and VR experiences.", "why": "Fun indoor activity for gaming enthusiasts.", "area": "Bole"},
        {"name": "Kuriftu Resort", "category": "Wellness", "description": "Lakeside resort with spa, hot springs, and nature walks. Day trip packages available.", "why": "Ultimate relaxation and wellness escape near Addis.", "area": "Debre Zeit"},
        {"name": "BookCafe", "category": "Library", "description": "Cozy cafe with a library of books you can read while sipping coffee. Quiet and peaceful atmosphere.", "why": "Perfect for book lovers who want to read in a cozy setting.", "area": "Bole"},
    ]

    # Filter by interest keywords
    filtered = []
    if any(k in msg for k in ["park", "nature", "hike", "walk", "tree", "green", "outdoor"]):
        filtered = [p for p in all_places if p["category"] in ("Park", "Wellness")]
    elif any(k in msg for k in ["movie", "film", "cinema", "watch"]):
        filtered = [p for p in all_places if p["category"] == "Cinema"]
    elif any(k in msg for k in ["music", "dance", "concert", "live", "eskista"]):
        filtered = [p for p in all_places if p["category"] == "Music Venue"]
    elif any(k in msg for k in ["game", "gaming", "play", "arcade", "bowl"]):
        filtered = [p for p in all_places if p["category"] == "Game Zone"]
    elif any(k in msg for k in ["coffee", "cafe", "buna", "macchiato"]):
        filtered = [p for p in all_places if p["category"] == "Cafe"]
    elif any(k in msg for k in ["gym", "workout", "exercise", "spa", "swim"]):
        filtered = [p for p in all_places if p["category"] in ("Gym", "Wellness")]
    elif any(k in msg for k in ["book", "read", "library", "study"]):
        filtered = [p for p in all_places if p["category"] in ("Library", "Cafe")]
    elif any(k in msg for k in ["museum", "history", "culture", "art"]):
        filtered = [p for p in all_places if p["category"] == "Museum"]

    if not filtered:
        filtered = random.sample(all_places, min(4, len(all_places)))

    places = filtered[:5]

    return {
        "message": "Here are some spots I think you'd love! Check them out 🌟",
        "places": places,
    }


def transcribe_and_analyze(audio_bytes: bytes, mime_type: str = "audio/webm") -> Dict:
    """Transcribe a voice note and extract sentiment + 1-sentence summary."""
    m = _model()
    if m is None:
        return {
            "transcript": "(demo mode) I had a long day, the taxi line was crazy and I'm exhausted.",
            "sentiment": "stressed",
            "summary": "Feeling drained after a hard commute.",
            "reply": _fallback_reply("I'm exhausted"),
        }
    try:
        prompt = (
            "This is a voice note from an Ethiopian user about how they're feeling. "
            "1) Transcribe it verbatim in whatever language(s) they used (preserve Amharic Fidel if spoken). "
            "2) Detect sentiment as one of: calm, happy, anxious, stressed, sad, angry, burned_out, mixed. "
            "3) Write a 1-sentence summary. "
            "4) Write a short, warm, code-switch-aware reply as Tena (2-4 sentences). "
            "Respond ONLY as strict JSON with keys: transcript, sentiment, summary, reply."
        )
        resp = m.generate_content([
            {"mime_type": mime_type, "data": audio_bytes},
            prompt,
        ])
        text = (resp.text or "").strip()
        # Strip ```json fences if present
        if text.startswith("```"):
            text = text.strip("`")
            if text.lower().startswith("json"):
                text = text[4:].strip()
        data = json.loads(text)
        return {
            "transcript": data.get("transcript", ""),
            "sentiment": data.get("sentiment", ""),
            "summary": data.get("summary", ""),
            "reply": data.get("reply", ""),
        }
    except Exception as e:
        logger.exception("Gemini audio failed: %s", e)
        return {
            "transcript": "",
            "sentiment": "",
            "summary": "",
            "reply": "I couldn't quite catch that — can you try again, or type it out?",
        }


def _fallback_reply(user_message: str) -> str:
    import random
    msg = (user_message or "").lower()
    
    # Places to visit / go out
    if any(k in msg for k in ["place", "go out", "where", "visit", "park", "cafe", "fun place", "bored", "boring"]):
        responses = [
            ("🌳 Try visiting *Entoto Park* — fresh air, hiking trails, and a beautiful view of Addis. Great for clearing your mind!\n\n"
             "[RECOMMENDATIONS]\n"
             '[{"name": "Entoto Park", "category": "Park", "description": "Beautiful mountain forest park with walking paths and panoramic views of Addis Ababa.", "reason": "Recommended because you want to visit a park or quiet nature trail nearby."}]'),
            ("☕ Go to *Tomoca Coffee* in Piassa — best coffee in Addis, perfect for journaling or just people-watching.\n\n"
             "[RECOMMENDATIONS]\n"
             '[{"name": "Tomoca Coffee", "category": "Cafe", "description": "Historic Italian-style coffee house in Piassa, Addis Ababa.", "reason": "Recommended because you are looking for a cafe nearby to relax."}]'),
            ("🌿 *Friendship Park* near Bole is peaceful — bring a book, walk around the lake, breathe.\n\n"
             "[RECOMMENDATIONS]\n"
             '[{"name": "Friendship Park", "category": "Park", "description": "Central urban park with a lake, botanical gardens, and scenic walkways.", "reason": "Recommended because you are seeking a peaceful green space nearby."}]'),
            ("⛰️ *Unity Park* at the Palace — gardens, animals, history. A whole-day reset.\n\n"
             "[RECOMMENDATIONS]\n"
             '[{"name": "Unity Park", "category": "Park", "description": "Historic palace compound featuring green spaces, zoo, and museum exhibitions.", "reason": "Recommended because you want an interesting local destination to visit."}]')
        ]
        return random.choice(responses)
    
    # Food / eat suggestions
    if any(k in msg for k in ["eat", "food", "hungry", "meal", "cook", "recipe", "injera"]):
        responses = [
            "🍲 Try a warm bowl of *shiro with injera* — comfort food that hugs your soul. Add some gomen for greens.",
            "🥗 *Fasting food* (yetsom beyaynetu) is light, plant-based, and energizing. Perfect when you feel heavy.",
            "🍵 A cup of *buna with himbasha bread* + 10 mins of silence = a tiny ceremony for yourself.",
            "🥘 *Doro wat* on a hard day — the spice + the protein wakes you up. Or kitfo if you want comfort.",
            "🌽 Kolo (roasted barley) and tea — a snack our grandmas knew was therapy.",
            "🥑 Make an *avocado juice (avocado spris)* — fresh, sweet, takes 3 minutes.",
            "🍞 If cooking feels heavy, just toast bread + honey + tea. Tiny meals count."
        ]
        return random.choice(responses)
    
    # Learning / hobbies / skills
    if any(k in msg for k in ["learn", "hobby", "skill", "guitar", "instrument", "art", "draw", "paint", "code"]):
        responses = [
            "🎸 *Learn guitar* — 10 minutes a day with YouTube (search 'JustinGuitar'). In a month you'll play your first song.",
            "🎨 Try *drawing* — get a cheap notebook, draw 1 thing daily. Doesn't have to be good. It just has to be done.",
            "📚 Pick a book in your *mother tongue* — Sebhat Gebre-Egziabher, Adam Reta, or Bewketu Seyoum.",
            "💻 *Learn to code* — start with freeCodeCamp.org. 1 hour a day, you'll build your first website in 2 weeks.",
            "🎵 Learn the *kirar* or *masinko* — reconnecting with our music heals something deep.",
            "📷 *Photography* with just your phone — pick a theme (doors, hands, sky) and shoot 5 photos a day.",
            "✍️ *Journaling* — 3 lines every morning: how I feel, one goal, one thing I'm grateful for."
        ]
        return random.choice(responses)
    
    # To-do / planning / progress
    if any(k in msg for k in ["todo", "to do", "plan", "schedule", "progress", "goal", "track", "list", "organize"]):
        responses = [
            "📋 *Today's wellness checklist:*\n☐ Drink 6 glasses of water\n☐ 10 min walk\n☐ Text 1 friend\n☐ 5 min deep breathing\n☐ Eat 1 fruit\n\nDoing 3/5 is already a win!",
            "🎯 *3-Day Reset Plan:*\nDay 1: Sleep 8 hrs + walk 20 min\nDay 2: Cook 1 home meal + journal 5 lines\nDay 3: Call someone you miss + step outside\n\nSmall steps, big shifts.",
            "📅 *Weekly Wellness Goals:*\n• 3x exercise (even 15 min walks)\n• 1x new place or activity\n• 1x deep talk with someone\n• 7x mood check-ins\n\nWhich one feels easiest to start?",
            "✅ *Tonight's wind-down list:*\n☐ Phone away by 9pm\n☐ Warm shower\n☐ Stretch 5 min\n☐ Write tomorrow's top 3 tasks\n☐ Sleep before 11pm",
            "🌱 *30-day micro-habit:* Pick ONE — water, walk, or journal. Do it daily for 30 days. That's it. Want me to check in with you?",
            "📈 *Progress check:* On a scale of 1-10, how's your week so far? Tell me, and let's make a 2-step plan to improve it."
        ]
        return random.choice(responses)
    
    # Academic/Study stress
    if any(k in msg for k in ["exam", "moe", "matric", "test", "study", "school", "university"]):
        responses = [
            "📚 *Study plan idea:* 25 min focus + 5 min break (Pomodoro). Do 4 cycles, then a longer break. Try it for 1 hour today.",
            "Exams pressure is real — yene guadegna, breathe. What's the one subject weighing on you most right now?",
            "I know exam stress can feel overwhelming. Have you tried breaking study time into small 25-minute chunks?",
            "MoE season is tough. Remember to sleep - your brain needs rest to retain information.",
            "✅ *Tonight's study list:* 1) Review hardest topic 30 min, 2) Practice 10 questions, 3) Sleep before 11pm. Small wins compound."
        ]
        return random.choice(responses)
    
    # Financial stress
    if any(k in msg for k in ["teff", "price", "money", "rent", "cost", "expensive", "birr", "dollar"]):
        responses = [
            "Yeah, prices in Addis are no joke right now. Tell me one small thing that felt okay today, even briefly.",
            "The cost of living is stressful for everyone right now. What's one small comfort you can give yourself today?",
            "I hear you about the expenses. Are there any free activities that help you de-stress?",
            "Financial pressure is heavy. Remember that your worth isn't measured by your bank account."
        ]
        return random.choice(responses)
    
    # Health concerns
    if any(k in msg for k in ["sick", "ill", "unwell", "fever", "headache", "pain", "hurt", "medicine", "doctor"]):
        responses = [
            "I'm sorry you're feeling sick. Have you been able to rest and drink plenty of water?",
            "That sounds rough. Are you able to see a doctor or get medical care if needed?",
            "Being sick is exhausting. Focus on rest - your body needs time to heal.",
            "I hope you feel better soon. Is there someone who can help take care of you?"
        ]
        return random.choice(responses)
    
    # Emotional/mental state
    if any(k in msg for k in ["tired", "exhausted", "burned", "stress", "anxious", "worried", "sad", "depressed"]):
        responses = [
            "That sounds heavy. Step away from the screen for 2 minutes — stand up, drink water, then come back and tell me what hurts most.",
            "You sound exhausted. When was the last time you truly rested, not just slept?",
            "Burnout is real. What's one thing you can say 'no' to today to protect your energy?",
            "Your feelings are valid. What would make today even 1% better?"
        ]
        return random.choice(responses)
    
    # Family/relationships
    if any(k in msg for k in ["family", "parent", "mother", "father", "sister", "brother", "friend", "relationship"]):
        responses = [
            "Family dynamics can be complex. What's happening in your relationships that's on your mind?",
            "I'm here to listen about your family situation. What would be most helpful to talk about?",
            "Relationships can bring both joy and stress. How are your connections affecting your wellbeing?",
            "You're not alone in dealing with family pressures. Tell me more about what you're facing."
        ]
        return random.choice(responses)
    
    # Work/career
    if any(k in msg for k in ["work", "job", "boss", "career", "office", "colleague"]):
        responses = [
            "Work stress can spill into everything. What's happening at your job that's weighing on you?",
            "Career decisions are big ones. What aspect of your work life feels most challenging right now?",
            "I understand workplace pressures. What would make your work situation more manageable?",
            "Your work doesn't define your worth. How can we bring more balance to your life?"
        ]
        return random.choice(responses)
    
    # Positive topics
    if any(k in msg for k in ["happy", "good", "great", "excited", "love", "thank", "wonderful"]):
        responses = [
            "That's wonderful to hear! What's bringing you this joy today?",
            "I love that you're feeling good! Tell me more about what's going well.",
            "Thank you for sharing this positive moment with me. What made this happen?",
            "Your happiness matters! Let's celebrate this good feeling together."
        ]
        return random.choice(responses)
    
    # General wellness check-ins
    if any(k in msg for k in ["how are you", "what's up", "hi", "hello", "hey"]):
        responses = [
            "Selam! I'm here to support you. How are you really doing today?",
            "Endemen neh/nesh? I'm glad you reached out. What's on your mind?",
            "Hello! I'm here to listen. What would be most helpful to talk about right now?",
            "Hi! I'm here for you. Take your time - what's happening in your world today?"
        ]
        return random.choice(responses)
    
    # General conversational responses
    responses = [
        "I'm here to support you on your wellness journey. Tell me more about what's on your mind.",
        "Thank you for sharing with me. Your mental health matters - let's talk about what you need.",
        "I'm listening without judgment. What would be most helpful for you right now?",
        "Your wellbeing is important. How can I best support you today?",
        "I'm here to help you navigate whatever you're facing. What feels most pressing?",
        "You don't have to face this alone. I'm here to walk with you through it.",
        "Taking care of your mental health is brave. What's one thing I can help you with today?"
    ]
    return random.choice(responses)
