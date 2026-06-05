export default function CrisisCard({ resources, message }) {
  if (!resources || resources.length === 0) return null
  return (
    <div className="card crisis-card">
      <h2>You're not alone</h2>
      {message && <p style={{ marginTop: 0 }}>{message}</p>}
      {resources.map((r, i) => (
        <div className="resource" key={i}>
          <div className="name">{r.name}</div>
          {r.phone && (
            <div>📞 <a href={`tel:${r.phone}`}>{r.phone}</a></div>
          )}
          {r.address && <div className="muted">{r.address}</div>}
          {r.maps && (
            <div><a href={r.maps} target="_blank" rel="noreferrer">Open in Maps</a></div>
          )}
          {r.note && <div className="muted">{r.note}</div>}
        </div>
      ))}
    </div>
  )
}
