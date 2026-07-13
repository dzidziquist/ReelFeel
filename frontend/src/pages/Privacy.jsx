import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div style={{ background: '#000', minHeight: '100vh', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '60px 24px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#a3a3a3', fontSize: 13, textDecoration: 'none', marginBottom: 40 }}>
          ← Back to ReelFeel
        </Link>
        <p style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6b6b', marginBottom: 12 }}>ReelFeel</p>
        <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, color: '#d4af37' }}>Privacy Policy</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', marginBottom: 48 }}>Last updated: June 2026</p>

        <Section title="Overview">
          ReelFeel ("we", "our", or "us") is a personal film and TV tracking app. This policy explains what data we
          collect, how we use it, and your rights. We collect only what is necessary to provide the service.
        </Section>

        <Section title="Data We Collect">
          <b>Account data:</b> email address and username, collected when you create an account.<br /><br />
          <b>Usage data:</b> diary entries you create (films and TV shows watched, ratings, reviews, emotions tagged,
          watch dates). This data is yours and is only used to power your personal diary and statistics.<br /><br />
          <b>Device data:</b> we do not collect device identifiers, advertising IDs, or precise location.
        </Section>

        <Section title="How We Use Your Data">
          <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li>To provide and maintain your personal diary and watchlist</li>
            <li>To generate your personal watch statistics and recommendations</li>
            <li>To authenticate your account securely</li>
            <li>We do not sell your data to third parties</li>
            <li>We do not use your data for advertising</li>
          </ul>
        </Section>

        <Section title="Third-Party Services">
          <b>Supabase</b> — database and authentication provider. Your data is stored securely on Supabase
          infrastructure. See supabase.com/privacy.<br /><br />
          <b>TMDB (The Movie Database)</b> — used to fetch film and TV metadata (titles, posters, descriptions).
          No personal data is shared with TMDB. This product uses the TMDb API but is not endorsed or certified by TMDb.{' '}
          <a href="https://www.themoviedb.org/terms-of-use" target="_blank" rel="noopener noreferrer" style={{textDecoration:'underline'}}>TMDb Terms of Use</a>.
        </Section>

        <Section title="Data Retention">
          Your data is retained for as long as your account is active. You can delete all your data and your account
          at any time from the Me tab in the app. Deletion is immediate and permanent.
        </Section>

        <Section title="Children's Privacy">
          ReelFeel is not directed at children under 13. We do not knowingly collect personal information from
          children under 13.
        </Section>

        <Section title="Your Rights">
          You have the right to access, correct, or delete your personal data at any time. To export your data or
          request deletion outside the app, contact us at the email below.
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. We will notify users of material changes via the app.
          Continued use of the app after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="Contact">
          For privacy questions or data requests, contact us at:{' '}
          <a href="mailto:support@reelfeel.me" style={{ color: '#d4af37' }}>support@reelfeel.me</a>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 13, fontWeight: 800, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#a3a3a3', marginBottom: 12, borderBottom: '2px solid #2a2a2a', paddingBottom: 8 }}>
        {title}
      </h2>
      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#a3a3a3' }}>{children}</p>
    </div>
  )
}
