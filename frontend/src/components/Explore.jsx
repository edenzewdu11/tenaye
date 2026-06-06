import { useState } from 'react'
import { api } from '../api'

const MOOD_CHIPS = [
  { label: 'I wanna go to a park 🌳', query: 'I want to visit a nice park today and get some fresh air' },
  { label: 'Movie time 🎬', query: 'I feel like watching a movie today' },
  { label: 'I love music 🎵', query: 'I like music and want to go somewhere with live music or good vibes' },
  { label: 'Game zone 🎮', query: 'I want to go to a game zone or play arcade games' },
  { label: 'Coffee & chill ☕', query: 'I want a cozy cafe to sit and chill' },
  { label: 'Work out 💪', query: 'I want to work out or go to the gym today' },
  { label: 'Read & relax 📚', query: 'I like reading and want a quiet place to sit and read' },
  { label: 'Ethiopian culture 🏛️', query: 'I want to explore Ethiopian history, art or culture today' },
]

const CATEGORY_EMOJI = {
  'Park': '🌳',
  'Cafe': '☕',
  'Cinema': '🎬',
  'Restaurant': '🍽️',
  'Gym': '💪',
  'Library': '📚',
  'Museum': '🏛️',
  'Game Zone': '🎮',
  'Music Venue': '🎵',
  'Landmark': '📍',
  'Wellness': '🧘',
}

function getEmoji(cat) {
  return CATEGORY_EMOJI[cat] || '📍'
}

export default function Explore() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [expanded, setExpanded] = useState(null)

  async function handleSearch(q) {
    const text = (q || query).trim()
    if (!text || loading) return
    setLoading(true)
    setResult(null)
    setError(null)
    setExpanded(null)
    try {
      const data = await api.exploreQuery(text)
      setResult(data)
    } catch (e) {
      // Use mock data when API fails
      const mockPlaces = getMockPlaces(text)
      setResult({
        message: `Here are some great places for "${text}" in Addis Ababa:`,
        places: mockPlaces
      })
    } finally {
      setLoading(false)
    }
  }

  function getMockPlaces(searchQuery) {
    const allPlaces = [
      {
        name: "Entoto Park",
        category: "Park",
        area: "Entoto",
        description: "Beautiful park with hiking trails and panoramic views of Addis Ababa.",
        why: "Perfect for fresh air and nature walks."
      },
      {
        name: "Makush Art Gallery",
        category: "Museum",
        area: "Bole",
        description: "Contemporary Ethiopian art gallery featuring local artists.",
        why: "Great for cultural immersion and inspiration."
      },
      {
        name: "Tomoca Coffee",
        category: "Cafe",
        area: "Piassa",
        description: "Historic Ethiopian coffee house serving traditional coffee.",
        why: "Perfect spot to relax and enjoy authentic Ethiopian coffee culture."
      },
      {
        name: "Edna Mall Cinema",
        category: "Cinema",
        area: "Bole",
        description: "Modern cinema complex with latest movie releases.",
        why: "Great for entertainment and relaxation."
      },
      {
        name: "Unity Park",
        category: "Park",
        area: "Arat Kilo",
        description: "Large urban park with gardens, walking paths, and recreational facilities.",
        why: "Ideal for exercise and outdoor activities."
      },
      {
        name: "Yod Abyssinia Cultural Restaurant",
        category: "Restaurant",
        area: "Kazanchis",
        description: "Traditional Ethiopian restaurant with live cultural performances.",
        why: "Experience authentic Ethiopian cuisine and culture."
      }
    ]
    
    // Filter based on search query
    const lowerQuery = searchQuery.toLowerCase()
    return allPlaces.filter(place => 
      place.name.toLowerCase().includes(lowerQuery) ||
      place.category.toLowerCase().includes(lowerQuery) ||
      place.description.toLowerCase().includes(lowerQuery)
    ).slice(0, 4)
  }

  function handleChip(chip) {
    setQuery(chip.query)
    handleSearch(chip.query)
  }

  return (
    <div className="explore-page">
      {/* Hero search bar */}
      <div className="explore-hero">
        <div className="explore-hero-inner">
          <div className="explore-hero-label">What are you in the mood for today?</div>
          <div className="explore-search-row">
            <input
              className="explore-input"
              placeholder="e.g. I want to go to a park… I love music… game zone…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="explore-search-btn"
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
            >
              {loading ? <span className="explore-spinner" /> : '🔍'}
            </button>
          </div>

          {/* Quick mood chips */}
          <div className="explore-chips">
            {MOOD_CHIPS.map(chip => (
              <button
                key={chip.label}
                className="explore-chip"
                onClick={() => handleChip(chip)}
                disabled={loading}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="explore-results">
        {error && (
          <div className="explore-error">⚠️ {error}</div>
        )}

        {loading && (
          <div className="explore-loading-state">
            <div className="explore-loading-orb" />
            <p>Tena is finding the best spots for you in Addis…</p>
          </div>
        )}

        {result && !loading && (
          <>
            <div className="explore-message">
              <span className="explore-message-icon">🌟</span>
              <p>{result.message}</p>
            </div>

            <div className="explore-places-grid">
              {(result.places || []).map((place, i) => {
                const isOpen = expanded === i
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ', Addis Ababa')}`
                return (
                  <div
                    key={i}
                    className={`explore-place-card ${isOpen ? 'open' : ''}`}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="explore-card-top" onClick={() => setExpanded(isOpen ? null : i)}>
                      <div className="explore-card-emoji">{getEmoji(place.category)}</div>
                      <div className="explore-card-info">
                        <div className="explore-card-name">{place.name}</div>
                        <div className="explore-card-meta">
                          <span className="explore-card-cat">{place.category}</span>
                          {place.area && (
                            <span className="explore-card-area">📍 {place.area}</span>
                          )}
                        </div>
                      </div>
                      <div className="explore-card-chevron">{isOpen ? '▲' : '▼'}</div>
                    </div>

                    {isOpen && (
                      <div className="explore-card-details">
                        <p className="explore-card-desc">{place.description}</p>
                        {place.why && (
                          <div className="explore-card-why">
                            <span className="explore-why-label">✨ Why for you:</span> {place.why}
                          </div>
                        )}
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="explore-map-btn"
                        >
                          🗺️ Open in Google Maps
                        </a>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {!result && !loading && !error && (
          <div className="explore-empty">
            <div className="explore-empty-icon">🗺️</div>
            <h3>Discover your next outing</h3>
            <p>Tell Tena what you're in the mood for and get personalized suggestions for real places in Addis Ababa — with a map link to get there.</p>
          </div>
        )}
      </div>
    </div>
  )
}
