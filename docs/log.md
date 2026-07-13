# Session Log

## June 23, 2026

### Website (reelfeel.me)
- Converted web from app replica to marketing landing site
- Built full landing page: hero, screenshots fan, stats strip, features, CTA, footer
- Applied brutalist polish: 2px borders, monospace stats, 2-col bordered feature table
- Added "No followers · No feeds · Just yours." positioning throughout
- Added "No social, ever" full-width callout in features section
- Fixed scroll indicator — moved to in-flow so always visible
- Built `/updates` changelog page with `npm run release` CLI workflow
- Generated OG image (SVG → PNG, 1200x630) for social sharing
- Added `og:site_name`, Twitter cards, SVG film strip favicon
- Set up support@reelfeel.me via iCloud Custom Domain
- Cleaned up all old Django backend files from root and unused frontend pages/components

### Mobile (build #7)
- Updated `associatedDomains` from `reelfeel.vercel.app` → `reelfeel.me` + added `webcredentials:`
- Updated all hardcoded `reelfeel.vercel.app` URLs to `reelfeel.me` across mobile codebase
- Bumped build number 6 → 7
- EAS build #7 completed successfully

### App Store submission
- Completed full privacy nutrition label (Email, Username/User ID — App Functionality only, no tracking)
- Set age rating to 13+
- Uploaded 7 screenshots from iPhone 17 Pro Max (fixed alpha channel issues)
- Filled description, keywords, support URL, privacy URL
- Build #7 ready to submit for review

### Supabase
- Wrote and pasted branded HTML email templates for 5 auth flows: Confirm signup, Reset password, Magic link, Change email, Reauthentication
- Invite user skipped — no invite feature in app
- Template design: #111111 card on #000 bg, 2px #2a2a2a border, red (#cc3333) top/bottom bars, red CTA, gold (#d4af37) tagline
- Custom SMTP via Resend: DNS records added, pending final verification and API key

### Decisions made
- Magic link / passwordless sign-in: deferred to v2.1.0
- Instagram story share card: deferred to v2.1.0
- Web stays marketing-only, no app functionality
