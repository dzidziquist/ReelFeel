import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import EntryCard from '../components/EntryCard'
import { StarDisplay } from '../components/StarRating'

export default function MediaDetail() {
  const { tmdbId } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMedia(tmdbId)
      .then(setData)
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [tmdbId])

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return
    await api.deleteEntry(id)
    setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>
  if (!data) return null

  const { media, entries, avg_rating } = data

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Backdrop */}
      {media.backdrop_url && (
        <div className="relative -mx-4 -mt-8 mb-8 h-56 overflow-hidden rounded-b-2xl">
          <img src={media.backdrop_url} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent" />
        </div>
      )}

      {/* Header */}
      <div className="flex gap-6 mb-8">
        {media.poster_url && (
          <img src={media.poster_url} alt={media.title}
            className={`w-32 h-48 object-cover rounded-xl shadow-2xl flex-shrink-0 ${media.backdrop_url ? '-mt-20 relative z-10' : ''}`} />
        )}
        <div className="flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{media.title}</h1>
            {media.year && <span className="text-gray-400 text-xl">({media.year})</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded border ${
              media.media_type === 'film' ? 'border-blue-700 text-blue-400' : 'border-purple-700 text-purple-400'
            }`}>
              {media.media_type === 'film' ? 'Film' : 'TV Show'}
            </span>
            {media.genres?.map(g => <span key={g} className="text-xs text-gray-500">{g}</span>)}
          </div>
          {media.runtime && <p className="text-gray-500 text-sm mt-1">{media.runtime} min</p>}
          {media.overview && <p className="text-gray-300 text-sm mt-3 leading-relaxed max-w-2xl line-clamp-3">{media.overview}</p>}

          <div className="flex items-center gap-6 mt-4">
            {avg_rating != null && (
              <div>
                <p className="text-3xl font-bold text-teal-400 font-mono">{avg_rating}</p>
                <p className="text-xs text-gray-500">your avg / 5</p>
              </div>
            )}
            {media.tmdb_rating && (
              <div>
                <p className="text-2xl font-bold text-yellow-400 font-mono">{media.tmdb_rating.toFixed(1)}</p>
                <p className="text-xs text-gray-500">TMDB / 10</p>
              </div>
            )}
            <Link to={`/log?tmdb_id=${media.tmdb_id}&type=${media.media_type}`}
              className="ml-auto bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Log entry
            </Link>
          </div>
        </div>
      </div>

      {/* Entries */}
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2">
        Your entries <span className="text-gray-500 font-normal text-base">({entries.length})</span>
      </h2>

      {entries.length === 0 ? (
        <p className="text-gray-500 py-6 text-center">You haven't logged this yet.</p>
      ) : (
        <div className="space-y-4">
          {entries.map(e => <EntryCard key={e.id} entry={e} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  )
}
