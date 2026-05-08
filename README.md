# ReelFeel

A personal movie and TV diary. Log what you watch, rate it, tag how it made you feel, and discover what to watch next — all in one place.

---

## Features

- **Diary** — Log watched films and TV episodes with a date, star rating (0–5), written review, and rewatch flag
- **Emotion tags** — 35 curated emotions across 8 categories (Happy, Sad, Neutral, Surprised, Interested, Afraid, Disgusted, Angry)
- **Library** — Browse everything you've logged, filterable by type, sortable by date or rating
- **Watchlist** — Save titles to watch later; auto-removed when you log them
- **Search** — Full-text TMDB search across movies and TV shows
- **Media detail** — Poster, backdrop, cast, genres, runtime, TMDB rating, streaming providers, and a "Buy Tickets" link for films currently in theatres
- **For You** — Personalised recommendation feed weighted by your highest-rated titles
- **Insights** — Stats snapshot: total films, TV shows, average rating, and watch time
- **Themes** — Dark, light, and system-default

---

## Project layout

```
SceneIT/
├── mobile/          # Expo React Native app  ← main client
├── frontend/        # React + Vite web app
├── apps/            # Django REST API
│   ├── accounts/    # Auth, profiles, follow system
│   ├── diary/       # Diary entry CRUD
│   ├── media/       # TMDB cache + media management
│   └── emotions/    # Emotion definitions
├── config/          # Django settings
├── supabase/        # schema.sql — Supabase tables, RLS policies, triggers
└── requirements.txt
```

---

## Mobile app

### Tech stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.81 + Expo 54 (Router v6) |
| Auth & database | Supabase (PostgreSQL + Row Level Security) |
| Movie data | TMDB API |
| Styling | React Native StyleSheet (sketch/paint aesthetic) |

### Folder structure

```
mobile/
├── app/
│   ├── (auth)/      # Login, register, forgot-password
│   ├── (tabs)/      # Home, diary, search, library, watchlist, profile
│   ├── log.jsx      # Create / edit diary entry
│   └── media/[tmdbId].jsx   # Film & TV detail page
├── components/      # PosterCard, EntryCard, EmotionPicker, StarRating,
│                    # StreamingProviders, ActionSheet, FilterSortBar,
│                    # CalendarHeatmap, TVEpisodeBrowser, SwipeableRow
├── context/         # AuthContext, ThemeContext
└── lib/
    ├── supabase.js  # Supabase client (SecureStore token adapter)
    ├── tmdb.js      # TMDB API wrapper
    └── queries.js   # All Supabase queries
```

### Prerequisites

- Node.js ≥ 18
- [Expo Go](https://expo.dev/go) on your iOS or Android device
- A free [Supabase](https://supabase.com) project
- A free [TMDB API key](https://developer.themoviedb.org)

### Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_TMDB_API_KEY=your-tmdb-key
```

Run the Supabase schema:

```bash
# In the Supabase dashboard → SQL editor, paste and run:
supabase/schema.sql
```

### Run

```bash
cd mobile
npx expo start
```

Scan the QR code with Expo Go (iOS camera app or Expo Go on Android). Press `i` for iOS Simulator or `a` for Android Emulator.

---

## Web frontend

React 19 + Vite 8 + Tailwind CSS 4. Connects to the Django API.

```bash
cd frontend
npm install
npm run dev
```

---

## Backend API

Django 4.2 + Django REST Framework. Uses SQLite locally; set `DATABASE_URL` for PostgreSQL in production.

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

**Environment variables:**

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DATABASE_URL` | PostgreSQL URL (defaults to SQLite) |
| `TMDB_API_KEY` | TMDB API key |
| `DEBUG` | `True` for local dev |

---

## Database (Supabase)

| Table | Purpose |
|---|---|
| `media` | TMDB metadata cache (title, genres, runtime, poster/backdrop paths, ratings) |
| `diary_entries` | User watch logs (rating, date, review, rewatch, season/episode) |
| `diary_entry_emotions` | Many-to-many: entries ↔ emotions |
| `emotions` | 35 pre-seeded emotions with icon, colour, category |
| `profiles` | Display name, bio, avatar |
| `watchlist` | Saved titles per user |

All tables are protected by Row Level Security — users can only read and write their own data.

---

## Deployment

The Django backend deploys to **Vercel** via `Procfile` + `vercel.json`. The mobile app builds with **EAS Build** (`eas.json`).
