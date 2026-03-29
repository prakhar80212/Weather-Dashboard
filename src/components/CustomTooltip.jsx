export default function CustomTooltip({ active, payload, label, unit = '', formatter }) {
  if (!active || !payload || !payload.length) return null

  return (
    <div className="custom-tooltip" style={{ background: '#1a2236', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 14px', fontSize: 13, fontFamily: 'DM Sans' }}>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: 11 }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ color: '#c9d0dc', fontSize: 12 }}>{entry.name}:</span>
          <span style={{ color: '#f0f4ff', fontWeight: 500 }}>
            {formatter ? formatter(entry.value) : entry.value}
            {unit && ` ${unit}`}
          </span>
        </div>
      ))}
    </div>
  )
}
