import { Link } from 'react-router-dom'
import RELEASES from '../data/releases'

export default function Updates() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a3a3a3', fontSize: 13, textDecoration: 'none', marginBottom: 40 }}>
          ← Back to ReelFeel
        </Link>

        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 12 }}>ReelFeel for iPhone</p>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: '#ffffff' }}>What's new</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 48 }}>Every update, what changed, and when.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {RELEASES.map((release, i) => (
            <div key={release.version} style={{ borderTop: '2px solid #1a1a1a', paddingTop: 32, paddingBottom: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <span style={{ fontFamily: 'ui-monospace, SF Mono, monospace', fontWeight: 900, fontSize: 20, color: i === 0 ? '#ffffff' : '#a3a3a3' }}>
                  v{release.version}
                </span>
                {release.label && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    color: i === 0 ? '#000' : '#a3a3a3',
                    background: i === 0 ? '#cc3333' : '#1a1a1a',
                    padding: '2px 8px',
                    borderRadius: 4,
                  }}>
                    {release.label}
                  </span>
                )}
              </div>
              <p style={{ fontSize: 12, color: '#555', marginBottom: 20, fontFamily: 'ui-monospace, SF Mono, monospace' }}>{release.date}</p>

              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {release.changes.map(change => (
                  <li key={change} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.6, color: '#a3a3a3' }}>
                    <span style={{ color: '#cc3333', flexShrink: 0, marginTop: 2 }}>+</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '2px solid #1a1a1a', paddingTop: 32, marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#555' }}>
            Questions or feedback?{' '}
            <a href="mailto:support@reelfeel.me" style={{ color: '#d4af37', textDecoration: 'none' }}>support@reelfeel.me</a>
          </p>
        </div>
      </div>
    </div>
  )
}
