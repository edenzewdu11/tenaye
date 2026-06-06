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
    msg = (user_message or "").lower()
    if any(k in msg for k in ["exam", "moe", "matric", "test"]):
        return ("Exams pressure is real — yene guadegna, breathe. "
                "What's the one subject weighing on you most right now?")
    if any(k in msg for k in ["teff", "price", "money", "rent", "cost"]):
        return ("Yeah, prices in Addis are no joke right now. "
                "Tell me one small thing that felt okay today, even briefly.")
    if any(k in msg for k in ["tired", "exhausted", "burned"]):
        return ("That sounds heavy. Step away from the screen for 2 minutes — "
                "stand up, drink water, then come back and tell me what hurts most.")
    return ("Endemen neh/nesh? I'm here. Tell me a bit more about what's going on — "
            "no rush, no judgment.")
