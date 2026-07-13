import { Link } from 'react-router-dom'

const APP_STORE = 'https://apps.apple.com/app/id6767443984'

const FEATURES = [
  {
    icon: '📖',
    title: 'Your watch diary',
    desc: 'Log every film and TV show you watch. Add ratings, notes, and the emotions it stirred.',
  },
  {
    icon: '⭐',
    title: 'Rate & reflect',
    desc: 'Star ratings meet emotional tags. Track how films actually made you feel, not just how good they were.',
  },
  {
    icon: '🔍',
    title: 'Discover & search',
    desc: 'Browse what\'s trending, search millions of titles, and build your watchlist.',
  },
  {
    icon: '📊',
    title: 'Watch stats',
    desc: 'See your total hours watched, favourite genres, rating averages, and viewing streaks.',
  },
  {
    icon: '🗓️',
    title: 'Activity calendar',
    desc: 'Visualise your viewing history day by day. Spot patterns in when and what you watch.',
  },
  {
    icon: '📤',
    title: 'Share entries',
    desc: 'Share any diary entry as a link. Let people see exactly what you thought of a film.',
  },
]

const SCREENSHOTS = [
  { src: '/screenshots/discover.png', label: 'Discover',  caption: 'Browse trending films & TV',  rotate: '-rotate-2' },
  { src: '/screenshots/diary.png',    label: 'My Diary',  caption: 'Every watch session logged',   rotate: 'rotate-0 scale-105' },
  { src: '/screenshots/detail.png',   label: 'Film Page', caption: 'Deep dive into any title',     rotate: 'rotate-2' },
  { src: '/screenshots/profile.png',  label: 'Your Stats',caption: 'See your viewing patterns',    rotate: '-rotate-1' },
]

const STATS = [
  { value: '30+',  label: 'Emotions to tag' },
  { value: '5★',   label: 'Star rating system' },
  { value: '∞',    label: 'Films & TV to log' },
  { value: 'Free', label: 'No subscription' },
]

export default function Home() {
  return (
    <main>
      {/* Hero */}
      <section className="min-h-screen flex flex-col items-center text-center px-5 pt-8 relative">
        {/* Centered content */}
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-5xl mb-3">🎞️</div>

          <h1 className="text-5xl sm:text-7xl font-black text-white leading-none tracking-tight mb-3">
            ReelFeel
          </h1>
          <div className="w-16 h-[3px] bg-primary mx-auto mb-3" />
          <p className="text-gold italic text-lg sm:text-xl mb-3">your feelings, your films.</p>

          <p className="text-4xl sm:text-5xl font-black text-white leading-tight mb-3">
            Log it. Rate it.<br />Feel it.
          </p>

          <p className="text-sub text-base max-w-sm leading-relaxed mb-2">
            The diary app for people who take their watch history seriously.
          </p>

          <p className="font-mono text-xs text-muted tracking-wide mb-6">
            No followers · No feeds · Just yours.
          </p>

          <a
            href={APP_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-primary hover:bg-primary-l active:scale-[0.97] text-white px-7 py-4 rounded-xl font-bold text-base transition-all"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Download on the App Store
          </a>

          <p className="text-muted text-xs mt-4">Free · iPhone · Available now</p>
        </div>

        {/* Scroll cue — pinned to bottom of hero */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-bounce">
          <span className="text-white/80 text-[11px] uppercase tracking-widest font-mono">Scroll</span>
          <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Gradient fade into next section */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-rf-0 pointer-events-none" />
      </section>

      {/* Screenshots */}
      <section className="py-20 overflow-hidden">
        <div className="text-center mb-14 px-5">
          <h2 className="text-3xl font-black text-white mb-3">See it in action</h2>
          <p className="text-sub text-base max-w-sm mx-auto">Every screen built around your watch history.</p>
        </div>

        <div className="flex gap-6 items-end px-5 overflow-x-auto sm:overflow-visible sm:justify-center pb-4 sm:pb-0 snap-x snap-mandatory sm:snap-none">
          {SCREENSHOTS.map(({ src, label, caption, rotate }) => (
            <div key={src} className={`flex-shrink-0 snap-center flex flex-col items-center gap-3 transform ${rotate} transition-all hover:scale-105 hover:rotate-0 duration-300`}>
              <div className="w-44 sm:w-48 rounded-[2rem] overflow-hidden border-2 border-white/20 shadow-[0_24px_64px_rgba(0,0,0,0.8)]">
                <img src={src} alt={label} className="w-full h-auto block" />
              </div>
              <div className="text-center">
                <p className="text-white text-xs font-bold">{label}</p>
                <p className="text-muted text-[11px] mt-0.5">{caption}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-3xl mx-auto px-5 py-10">
        <div className="bg-rf-1 border-2 border-white/15 rounded-lg grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/15">
          {STATS.map(({ value, label }) => (
            <div key={label} className="px-6 py-6 text-center">
              <p className="text-gold font-black font-mono text-3xl leading-none mb-1">{value}</p>
              <p className="text-sub text-xs">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-5 py-20">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-white mb-3">Built for film people</h2>
          <p className="text-sub text-base max-w-sm">Every feature designed around the way you actually watch.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 border-t-2 border-l-2 border-white/15">
          {/* Privacy callout — full width */}
          <div className="col-span-1 sm:col-span-2 bg-rf-2 border-b-2 border-r-2 border-white/15 p-7 flex items-center justify-between gap-8">
            <div>
              <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2">No social, ever</h3>
              <p className="text-sub text-sm leading-relaxed max-w-md">No followers, no feeds, no public ratings. Your diary is private by default. Log honestly without performing for an audience.</p>
              <p className="font-mono text-xs text-muted mt-3 tracking-wide">No followers · No feeds · Just yours.</p>
            </div>
            <span className="text-4xl flex-shrink-0 opacity-80">🔒</span>
          </div>

          {FEATURES.map(f => (
            <div key={f.title} className="bg-rf-1 border-b-2 border-r-2 border-white/15 p-7 hover:bg-rf-2 transition-colors">
              <div className="text-2xl mb-4">{f.icon}</div>
              <h3 className="font-black text-white text-sm uppercase tracking-widest mb-2">{f.title}</h3>
              <p className="text-sub text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="border-t-2 border-white/[0.1] py-20 text-center px-5">
        <div className="w-12 h-[2px] bg-primary mx-auto mb-6" />
        <h2 className="text-3xl font-black text-white mb-3">Start your diary today</h2>
        <p className="text-sub text-base mb-8">Free on iPhone. No subscription. No nonsense.</p>
        <a
          href={APP_STORE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-primary hover:bg-primary-l active:scale-[0.97] text-white font-bold px-8 py-4 rounded-xl text-base transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
          </svg>
          Get ReelFeel free
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-white/[0.1] py-10 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center sm:items-start gap-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎞️</span>
                <span className="text-white font-black text-lg">ReelFeel</span>
              </div>
              <p className="text-muted text-xs italic">your feelings, your films.</p>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted">
              <Link to="/updates" className="hover:text-white transition-colors">What's new</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <a href="mailto:support@reelfeel.me" className="hover:text-white transition-colors">support@reelfeel.me</a>
            </div>
          </div>
          <p className="text-muted text-xs text-center sm:text-left mt-6">© {new Date().getFullYear()} ReelFeel. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
