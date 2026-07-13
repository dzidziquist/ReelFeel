import { Link } from 'react-router-dom'

const APP_STORE = 'https://apps.apple.com/app/id6767443984'

export default function NavBar() {
  return (
    <nav className="bg-rf-0/80 border-b border-white/[0.06] sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-5 flex items-center justify-between h-14">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl">🎞️</span>
          <span className="text-white font-black text-lg">ReelFeel</span>
        </Link>

        <a
          href={APP_STORE}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-primary hover:bg-primary-l text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          Download
        </a>
      </div>
    </nav>
  )
}
