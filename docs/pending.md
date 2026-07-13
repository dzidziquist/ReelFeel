# Pending Tasks

_Last updated: June 23, 2026_

## Immediate (pre-launch)
- Submit build #7 to App Store Review in App Store Connect ← last blocking item
- Finish Resend SMTP setup: DNS records added → verify domain in Resend → copy API key → fill Supabase SMTP settings:
  - Host: `smtp.resend.com` · Port: `465` · Username: `resend`
  - Password: Resend API key · Sender: `support@reelfeel.me` · Name: `ReelFeel`

## Done
- All 5 Supabase email templates pasted: Confirm signup, Reset password, Magic link, Change email, Reauthentication (Invite user skipped — no invite feature)
- support@reelfeel.me set up via iCloud Custom Domain
- Build #7 built and ready, App Store listing complete (screenshots, description, keywords, privacy label)
- All URLs updated from `reelfeel.vercel.app` → `reelfeel.me` across mobile and web

## Waiting on Apple
- App Store Review — 24-48h after submission

## Post-launch (v2.1.0)
- Magic link / passwordless sign-in + invite flow
- Instagram story share card (react-native-view-shot → styled card → iOS share sheet)
- Error monitoring (Sentry)
- Analytics
- Push notifications (post-watch reminder, streak nudge)

## Infrastructure
- Custom SMTP via Resend — in progress. Emails currently send from Supabase's built-in mailer.
