"""
Crisis detection: keyword tripwire in English + transliterated Amharic.
If matched we short-circuit the AI flow and return localized resources.
"""
import re

# Keep this list conservative but realistic. English + Amharic latinization + Amharic script.
CRISIS_PATTERNS = [
    r"\bkill(?:ing)? (?:myself|me)\b",
    r"\bend(?:ing)? (?:my )?life\b",
    r"\bsuicide\b",
    r"\bsuicidal\b",
    r"\bi want to die\b",
    r"\bi (?:can'?t|cant) go on\b",
    r"\bno reason to live\b",
    r"\bharm(?:ing)? myself\b",
    r"\bself[- ]harm\b",
    r"\bcut(?:ting)? myself\b",
    # Amharic transliteration
    r"\brasen mageded\b",         # ራሴን ማጥፋት (kill myself)
    r"\bmotku\b",                  # I want to die (colloquial)
    r"\bayegebagnem\b",            # doesn't matter / nothing matters
    # Amharic script
    r"ራሴን ማጥፋት",
    r"መሞት እፈልጋለሁ",
    r"ራሴን መግደል",
]

_COMPILED = [re.compile(p, re.IGNORECASE) for p in CRISIS_PATTERNS]


def is_crisis(text: str) -> bool:
    if not text:
        return False
    return any(p.search(text) for p in _COMPILED)


CRISIS_RESPONSE = {
    "message": (
        "I hear you, and I'm really glad you told me. What you're feeling is heavy, "
        "and you don't have to carry it alone right now. Please reach out to someone "
        "trained to help — they will listen without judgment.\n\n"
        "እባክህ/ሽ አሁን ድጋፍ ያስፈልግሃል/ሻል። ብቻህን/ሽን አይደለህም/ሽም።"
    ),
    "resources": [
        {
            "name": "Ethiopian Mental Health Helpline",
            "phone": "8149",
            "note": "Free, confidential, available now.",
        },
        {
            "name": "St. Amanuel Mental Specialized Hospital",
            "phone": "+251 11 273 7567",
            "address": "Amanuel Hospital Rd, Addis Ababa",
            "maps": "https://maps.google.com/?q=St.+Amanuel+Mental+Specialized+Hospital+Addis+Ababa",
        },
        {
            "name": "Emergency",
            "phone": "991",
            "note": "Call immediately if you are in danger.",
        },
    ],
}
