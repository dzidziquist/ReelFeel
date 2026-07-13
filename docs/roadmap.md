# Roadmap

## v2.1.0 — Auth & Sharing
- **Magic link sign-in**: passwordless email auth. User enters email → gets link → taps → signed in. Requires deep link handler in `_layout.jsx` to complete Supabase session.
- **Invite flow**: send a magic link to a friend to onboard them. No social graph — just a one-time invite.
- **Instagram story share card**: on diary entry, generate a styled image (poster + title + star rating + emotions + ReelFeel logo) using `react-native-view-shot`, pass to iOS share sheet.

## v2.2.0 — Discovery & Personalisation
- **Improved recommendations**: explain why a title is recommended ("Because you loved Ne Zha 2")
- **Mood-based discovery**: "Show me something that'll make me feel Joyful"
- **Genre deep-dive**: tap a genre in stats to see all entries in that genre

## v2.3.0 — Stats & Insights
- **Year in review**: annual summary card (total hours, top genres, most-felt emotion, best-rated film)
- **Viewing streaks**: celebrate milestones (10 films, 50 films, 100 films)
- **Comparison over time**: "you watch more TV in winter"

## Infrastructure (any version)
- **Sentry**: crash reporting — flying blind without it post-launch
- **Analytics**: understand drop-off points in the log flow
- **Push notifications**: post-watch log reminder, streak nudge
