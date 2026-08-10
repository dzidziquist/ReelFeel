# App Store Copycat & IP Sweep — Handoff

**App:** ReelFeel · `com.reelfeel.app` · ASC app ID `6767443984` · Team `DS5DKR22ZZ`
**Version swept:** 2.0.2 (build 15)
**Scope:** `mobile/` (the submitted client), plus `frontend/` where it backs App Store Connect URLs.
**Date:** August 2026

This is an engineering compliance sweep, not legal advice. Trademark clearance
(item O-1) needs a human with search access.

---

## Verdict

Nothing in this codebase reads as a copycat app. The real exposure was never
Guideline 4.1 — it was **5.2.1 (third-party IP)**: ReelFeel ships two contractual
attribution obligations it inherits from the TMDB API, and one of them was
entirely missing while the other was silently rendering as an empty box.

Both are fixed in this pass. What remains is one interface defect that will draw
a reviewer's eye (the icon) and four owner actions that can't be done from the
repo.

| | Count |
|---|---|
| Fixed in this pass | 4 |
| Interface issues to resolve before next build | 1 |
| Owner actions (outside the repo) | 4 |
| Checked and clear | 6 |

---

## Why 4.1 is not the risk here

Guideline 4.1 targets apps that copy *another developer's* app — its name, icon,
UI, or content — well enough to confuse a user about who made it. 4.3(a) targets
near-duplicate submissions and template spam. The nearest comparables to ReelFeel
are Letterboxd, Trakt, TV Time and the long tail of movie-diary apps.

Three things put distance between ReelFeel and all of them:

1. **Emotion tagging is the product.** 35 curated emotions across 8 categories,
   attached per-entry, feeding both the Insights panel and the recommendation
   weighting. No comparable app does this. It is the feature a reviewer sees
   first in the log flow.
2. **The visual language is deliberately opposed** to the category leader.
   Brutalist — 2px hard borders, unblurred box shadows, monospace accents, gold
   and red on near-black. Letterboxd is soft serif and pastel washes. Nobody
   confuses the two on a screenshot.
3. **No social graph.** Diary entries are private; RLS in `supabase/schema.sql`
   makes them structurally private, not just hidden. The social feed is the
   defining feature of Letterboxd and Trakt, and ReelFeel deliberately omits it.

`mobile/PRODUCT.md` already names Letterboxd as an explicit *anti-reference*.
That file is a dated, in-repo paper trail that the divergence was intentional —
keep it, and cite it if a 4.1 rejection ever lands.

Residual 4.1 risk is the name and the icon motif: "reel" plus a film-strip mark
is the most crowded visual cliché in this category. That's an ordinary
distinctiveness question, not an imitation one. See O-1.

---

## Fixed in this pass

### F-1 · JustWatch attribution was missing entirely — HIGH

`mobile/components/StreamingProviders.jsx`

The "Where to Watch" block is built from TMDB's `/watch/providers` endpoint.
That data is not TMDB's — TMDB licenses it from JustWatch, and passes the
attribution obligation down to API consumers: the source must be credited
wherever the data is displayed. The screen credited nobody. The one outbound
link was labelled "More options →", which named neither party.

This is a live breach of the API terms the app depends on, and it is the kind of
thing that turns into a 5.2.1 rejection when a rights holder complains rather
than when a reviewer notices.

Fixed: the provider block now carries an explicit
`Where-to-watch data provided by JustWatch` line whenever any provider row
renders, and the header link reads `More on JustWatch →`. Both are tappable and
route to the JustWatch entry for the title.

### F-2 · The TMDB attribution mark never rendered — HIGH

`mobile/app/(tabs)/profile.jsx`

The About sheet had the required disclaimer text and a TMDB logo above it. The
logo is an SVG, loaded through React Native's `Image` — which cannot decode SVG.
Every user since that screen shipped has seen an 80×80 blank gap where the
attribution mark belongs.

TMDB's terms ask for the logo *and* the statement. Half of that was shipping.

Fixed: that one element now uses `expo-image` (already a dependency, and
SVG-capable). The disclaimer text sits below it and stands on its own if the
remote asset ever fails, so attribution degrades to text rather than to nothing.

**Follow-up worth doing:** the logo URL is a content-hashed path on
themoviedb.org. If TMDB rotates that asset the mark disappears again, silently.
Bundling TMDB's logo locally from their [attribution assets page](https://www.themoviedb.org/about/logos-attribution)
removes that failure mode. Couldn't be done from this environment — outbound
access to themoviedb.org is blocked here.

### F-3 · Adult titles were unfiltered in five feeds — MEDIUM

`mobile/lib/tmdb.js`

`include_adult: false` was set on `/search/multi` and `/discover`, and search
additionally filtered `r.adult` client-side. But `trending`, `now_playing`,
`tv/popular`, `upcoming`, `airing_today` and `recommendations` don't accept that
parameter and were passed straight through to the Home and For You feeds.

TMDB suppresses most adult content on those endpoints by default, but
`recommendations` in particular can surface it — and the feeds are the first
screen after login. An age rating that the app can't hold under a reviewer's
spot-check is a 2.3.6 problem.

Fixed: a shared `notAdult` predicate now filters all six endpoints.

### F-4 · Provider link label named no source — LOW

Folded into F-1. Covered here so the diff reads cleanly.

---

## Interface — resolve before the next build

### I-1 · The app icon has the iOS mask baked into it — MEDIUM

`mobile/assets/icon.png`, `icon-dark.png`, `icon-tinted.png`, `splash-icon.png`

All four are **1254×1254**, not the 1024×1024 Apple specifies. More importantly,
each one has a rounded-corner squircle, a drop shadow, and a margin of dead
background rastered *into* the image — white on the light variant, black on the
dark one.

iOS applies its own mask on top of that. The result on a home screen is a
rounded icon inset inside a second rounded icon, with a shadow that fights the
system's own. It reads as amateur at exactly the moment a reviewer is forming an
impression, and it is the single most-scrutinized artifact in a 4.1 assessment —
the icon is what "copycat" gets judged on first.

What's needed: re-export each variant **full-bleed at 1024×1024** — artwork
extends to all four edges, no rounded corners, no shadow, no transparency on the
light and dark variants. Let iOS do the masking. The `reel/feel` wordmark and
film-strip element should scale up to fill the frame; the squircle's corners are
currently wasting roughly 12% of the canvas.

I've left the brand art alone rather than crop it programmatically — that's a
design call, and the corners of the wordmark would land close to the mask edge.
Worth 20 minutes in the source file.

Note also that `icon-tinted.png` carries an alpha channel while the other two
don't. For the iOS 18 tinted variant Apple wants a grayscale image; verify it
renders as intended on device before shipping.

---

## Owner actions — can't be done from the repo

### O-1 · Trademark clearance on "ReelFeel" — do before any marketing spend

Search USPTO TESS and the App Store itself for "ReelFeel", "Reel Feel", and
close variants in the entertainment/utilities classes. This is the one finding
in this document with real downside — a 5.2.1 takedown after launch is far more
expensive than a name change before it. Couldn't be checked from this
environment.

### O-2 · Confirm TMDB non-commercial use still applies

TMDB's free API tier covers non-commercial use. ReelFeel is free with no IAP, no
subscription and no ads, so it qualifies today — `eas.json` and the app contain
no purchase surface, confirmed by sweep.

**This changes the moment monetization is added.** Any paid tier, subscription
or ad unit requires a TMDB commercial license *first*. The roadmap's v2.1–v2.3
items are all free features, so there's no near-term trigger — but flag it in
whatever conversation first raises revenue.

### O-3 · Support URL must resolve to something

App Store Connect requires a support URL. `frontend/src/App.jsx` routes `/`,
`/media/:tmdbId`, `/privacy` and `/updates` — there is no `/support`. The Home
page footer does expose `support@reelfeel.me`, so pointing the ASC Support URL at
`https://reelfeel.me` satisfies the requirement as-is. Confirm that's what the
listing currently points at; a dedicated `/support` page would be better but
isn't blocking.

### O-4 · Screenshots — keep them in demo mode

`mobile/constants/demo.js` ships with `DEMO_MODE = false`, which is correct for
release builds. Keep it that way and only flip it locally when capturing.

This is the right call and worth stating explicitly in the handoff, because it
looks like a shortcut and isn't: demo mode replaces every poster with an abstract
photo and every title with a fictional one (`Drifting Parallel`, `The Amber
Coast`, …). Screenshots therefore contain **zero studio artwork**. App Store
screenshots are marketing material and get none of the shelter that in-app TMDB
display gets — using real posters there is a genuine copyright exposure that
ReelFeel simply doesn't take. Don't "improve" the screenshots by using real films.

Verify before submitting that `DEMO_MODE` is `false` in the archived build.

---

## Checked and clear

| Area | Guideline | Finding |
|---|---|---|
| Sign in with Apple | 4.8 | **N/A.** Email/password only (`AuthContext.jsx:37`, `signInWithPassword`). No third-party social login, so the equivalence requirement is not triggered. Note: adding Google or Facebook sign-in later *does* trigger it. |
| Account deletion | 5.1.1(v) | **Present.** Profile → Danger Zone → Delete Account, distinct from Delete All My Data. Both wired to real deletion in `lib/queries.js`. |
| User-generated content | 1.2 | **N/A.** Reviews and ratings are private to the author and enforced by RLS. No feed, no comments, no reporting surface needed. |
| Buy Tickets → Fandango | 3.1.1 | **Clear.** Cinema tickets are a physical service consumed outside the app, explicitly outside the IAP requirement. The button is unbranded and links to a plain Fandango search — no affiliate parameters, no revenue share. |
| Streaming provider logos | 5.2.1 | **Acceptable.** Netflix, Disney+ and the rest appear as small logos identifying where a title can be watched, linking to the provider's own site. That's nominative use — naming a service to refer to it. No provider mark is used in ReelFeel's own branding, icon or listing. |
| Poster, backdrop and cast imagery | 5.2.1 | **Covered by TMDB's terms** for non-commercial API use, subject to O-2. All imagery is served from `image.tmdb.org` at request time and never re-hosted or cached to ReelFeel infrastructure. |

---

## Pre-submission checklist

Run through this against the archived build, not the working tree.

- [ ] `DEMO_MODE === false` in `mobile/constants/demo.js`
- [ ] Icon re-exported full-bleed 1024×1024, no baked mask or shadow (I-1)
- [ ] About sheet renders the TMDB mark on a real device, not the simulator
- [ ] "Where to Watch" shows the JustWatch attribution line on a title with providers
- [ ] Trending / For You spot-checked for adult titles after F-3
- [ ] ASC Support URL resolves and exposes a contact route (O-3)
- [ ] ASC Privacy Policy URL points at `https://reelfeel.me/privacy`
- [ ] Age rating questionnaire answers match what the feeds can actually surface
- [ ] Privacy nutrition label matches what Supabase actually stores
- [ ] `buildNumber` incremented past 15
- [ ] Screenshots contain no real film artwork

---

## App Review notes — paste into App Store Connect

> ReelFeel is a private film and TV diary. Users log what they've watched, rate
> it 0–5, attach emotion tags, and write personal notes. Entries are private to
> the account — there is no social feed, no sharing surface, and no
> user-to-user content.
>
> Film and TV metadata comes from The Movie Database (TMDB) API. TMDB
> attribution and the required disclaimer appear in Profile → About ReelFeel.
> Where-to-watch data originates from JustWatch via TMDB and is credited in the
> "Where to Watch" section of every title page.
>
> The app is free. There are no in-app purchases, subscriptions or ads. The "Buy
> Tickets" button opens Fandango in the browser for films currently in theatres;
> ReelFeel takes no commission and collects no payment.
>
> Account deletion is available in-app at Profile → Delete Account.
>
> Test account: [credentials]

---

## If a 4.1 rejection ever lands

Unlikely, but the response is prepared rather than improvised. Reply with:

1. **The differentiator, first.** Emotion tagging — 35 emotions, 8 categories,
   attached per entry and feeding Insights and recommendations. Point at the log
   screen in the screenshots.
2. **The design divergence.** Cite `PRODUCT.md`, which names Letterboxd as an
   anti-reference and predates submission. Attach a side-by-side.
3. **The structural difference.** No social graph, by design and by schema —
   RLS makes entries private at the database level.
4. **Ask what specifically triggered it.** 4.1 rejections are often icon-driven.
   If the film-strip motif is the trigger, that's a one-asset fix, not a product
   fix — and I-1 wants that asset redone anyway.
