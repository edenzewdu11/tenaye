/**
 * Client-side crisis keyword detection.
 * Matches common crisis phrases in English, transliterated Amharic (Afranglish), and Amharic Fidel script.
 */

const CRISIS_PATTERNS = [
  /\bkill(?:ing)? (?:myself|me)\b/i,
  /\bend(?:ing)? (?:my )?life\b/i,
  /\bsuicide\b/i,
  /\bsuicidal\b/i,
  /\bi want to die\b/i,
  /\bi (?:can'?t|cant) go on\b/i,
  /\bno reason to live\b/i,
  /\bharm(?:ing)? myself\b/i,
  /\bself[- ]harm\b/i,
  /\bcut(?:ting)? myself\b/i,
  // Amharic transliteration
  /\brasen mageded\b/i,          // ራሴን ማጥፋት
  /\bmotku\b/i,                  // I want to die
  /\bayegebagnem\b/i,            // nothing matters
  // Amharic script
  /ራሴን ማጥፋት/,
  /መሞት እፈልጋለሁ/,
  /ራሴን መግደል/
]

/**
 * Checks if a given text contains suicidal or self-harm keywords.
 * @param {string} text 
 * @returns {boolean}
 */
export function containsCrisisKeywords(text) {
  if (!text) return false
  const trimmed = text.trim()
  return CRISIS_PATTERNS.some((pattern) => pattern.test(trimmed))
}
