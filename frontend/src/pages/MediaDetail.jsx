import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { fetchMedia } from '../lib/tmdb'

const APP_STORE = 'https://apps.apple.com/app/id6767443984'

export default function MediaDetail() {
  const { tmdbId } = useParams()
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || 'movie'

  const [media, setMedia] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchMedia(tmdbId, type)
      .then(setMedia)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [tmdbId, type])

  if (loading) return <div className="text-center py-20 text-muted text-xs uppercase tracking-widest">Loading…</div>
  if (error || !media) return <div className="text-center py-20 text-muted text-xs uppercase tracking-widest">Not found.</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Backdrop */}
      {media.backdrop_url && (
        <div className="relative -mx-4 -mt-8 mb-8 h-52 overflow-hidden">
          <img src={media.backdrop_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex gap-5">
        {media.poster_url && (
          <img
            src={media.poster_url} alt={media.title}
            className={`w-28 h-44 object-cover border-2 border-border flex-shrink-0 rf-card ${media.backdrop_url ? '-mt-16 relative z-10' : ''}`}
          />
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black leading-tight">{media.title}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {media.year && <span className="text-muted text-sm font-mono">{media.year}</span>}
            <span className="text-[9px] font-black tracking-widest uppercase text-muted border border-border px-1.5 py-0.5 rounded">
              {media.media_type === 'film' ? 'Film' : 'TV Show'}
            </span>
            {media.genres.slice(0, 3).map(g => (
              <span key={g} className="text-[10px] text-muted">{g}</span>
            ))}
          </div>

          {media.tmdb_rating > 0 && (
            <div className="mt-3">
              <span className="text-gold font-black text-xl font-mono">{media.tmdb_rating.toFixed(1)}</span>
              <span className="text-muted text-[10px] uppercase tracking-widest ml-1.5">TMDB / 10</span>
            </div>
          )}

          {media.overview && (
            <p className="text-sub text-sm mt-3 leading-relaxed line-clamp-3">{media.overview}</p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 rf-card-gold">
        <div className="h-0.5 bg-gold" />
        <div className="border-2 border-t-0 border-border bg-rf-1 p-6 text-center">
          <p className="text-[9px] font-black tracking-[0.3em] uppercase text-muted mb-1">Logged on</p>
          <p className="text-gold font-black text-2xl tracking-[0.25em] uppercase mb-5">ReelFeel</p>
          <a
            href={APP_STORE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-gold hover:bg-gold-l text-black font-black text-[11px] tracking-[0.25em] uppercase px-6 py-3 transition-colors"
            style={{ boxShadow: '3px 3px 0 rgba(0,0,0,0.6)' }}
          >
            Get the app
          </a>
          <p className="text-muted text-[10px] mt-4 uppercase tracking-[0.25em]">Track films and TV you watch</p>
        </div>
      </div>
    </div>
  )
}
