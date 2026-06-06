import React from 'react'

export default function CrisisModal({ data, onClose }) {
  if (!data) return null

  // Default resources if none are passed from the API response
  const localResources = data.resources || [
    {
      name: "Ethiopian Mental Health Helpline",
      phone: "8149",
      note: "Free, confidential, available 24/7."
    },
    {
      name: "St. Amanuel Mental Specialized Hospital",
      phone: "+251 11 273 7567",
      address: "Amanuel Hospital Rd, Addis Ababa",
      maps: "https://maps.google.com/?q=St.+Amanuel+Mental+Specialized+Hospital+Addis+Ababa"
    },
    {
      name: "Emergency Services",
      phone: "991",
      note: "Call immediately if you are in active danger."
    }
  ]

  const intlResources = [
    {
      name: "Suicide & Crisis Lifeline (US/Canada)",
      phone: "988",
      note: "Call or text 988 (Free & Confidential)"
    },
    {
      name: "Crisis Text Line",
      sms: "HOME",
      smsNumber: "741741",
      note: "Text HOME to 741741 to connect with a crisis counselor"
    },
    {
      name: "International Helplines",
      url: "https://findahelpline.com/",
      note: "Find support services available in your country"
    }
  ]

  return (
    <div className="crisis-modal-overlay">
      <div className="crisis-modal-content">
        <div className="crisis-modal-header">
          <span className="crisis-icon">⚠️</span>
          <h2>Safety First • ደህንነትዎ ቀዳሚ ነው</h2>
        </div>
        
        <p className="crisis-message">
          It sounds like you're carrying a lot right now, and we want to make sure you're safe. 
          We are an app, not trained crisis responders, but there are people who want to listen and help right now.
        </p>

        <div className="crisis-resource-columns">
          {/* Localized Ethiopian Section */}
          <div className="crisis-resource-section">
            <h3>Ethiopia Support (Addis Ababa & Regions)</h3>
            <div className="resources-list">
              {localResources.map((r, i) => (
                <div key={`local-${i}`} className="resource-item">
                  <div className="resource-name">{r.name}</div>
                  {r.note && <div className="resource-note">{r.note}</div>}
                  {r.address && <div className="resource-addr">{r.address}</div>}
                  
                  <div className="resource-actions">
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="btn-crisis-call">
                        📞 Call {r.phone}
                      </a>
                    )}
                    {r.maps && (
                      <a href={r.maps} target="_blank" rel="noreferrer" className="btn-crisis-link">
                        📍 Open in Maps
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* International Section */}
          <div className="crisis-resource-section">
            <h3>US, Canada & International Support</h3>
            <div className="resources-list">
              {intlResources.map((r, i) => (
                <div key={`intl-${i}`} className="resource-item">
                  <div className="resource-name">{r.name}</div>
                  {r.note && <div className="resource-note">{r.note}</div>}
                  
                  <div className="resource-actions">
                    {r.phone && (
                      <a href={`tel:${r.phone}`} className="btn-crisis-call">
                        📞 Call/Text {r.phone}
                      </a>
                    )}
                    {r.sms && (
                      <a href={`sms:${r.smsNumber}?body=${r.sms}`} className="btn-crisis-sms">
                        💬 Text {r.sms} to {r.smsNumber}
                      </a>
                    )}
                    {r.url && (
                      <a href={r.url} target="_blank" rel="noreferrer" className="btn-crisis-link">
                        🌐 Find A Helpline
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="crisis-modal-footer">
          <p className="privacy-reminder">
            Your safety is our priority. We do not track or store this trigger on your public profile.
          </p>
          <button className="btn btn-crisis-dismiss" onClick={onClose}>
            I am safe now • Go back to app
          </button>
        </div>
      </div>
    </div>
  )
}
