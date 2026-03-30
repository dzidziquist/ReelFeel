import { Link } from 'react-router-dom'
import { StarDisplay } from './StarRating'

export default function EntryCard({ entry, showUser = false, onDelete }) {
  const { media } = entry

  return (
    <div className="bg-gray-900 rounded-xl flex gap-4 p-4 hover:bg-gray-800/60 transition-colors group">
      {/* Poster */}
      <Link to={`/media/${media.tmdb_id}`} className="flex-shrink-0">
        {media.poster_url
          ? <img src={media.poster_url} alt={media.title} className="w-14 h-20 object-cover rounded-lg shadow" />
          : <div className="w-14 h-20 bg-gray-700 rounded-lg flex items-center justify-center text-2xl">🎬</div>
        }
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/media/${media.tmdb_id}`} className="font-semibold hover:text-teal-400 transition-colors">
              {media.title}
            </Link>
            {media.year && <span className="text-gray-500 text-sm ml-1">({media.year})</span>}
            <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border ${
              media.media_type === 'film' ? 'border-blue-700 text-blue-400' : 'border-purple-700 text-purple-400'
            }`}>
              {media.media_type === 'film' ? 'Film' : 'TV'}
            </span>
            {entry.rewatch && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded border border-amber-700 text-amber-400">rewatch</span>
            )}
            {showUser && (
              <span className="ml-2 text-xs text-gray-500">by <Link to={`/users/${entry.user.id}`} className="text-teal-400 hover:underline">{entry.user.username}</Link></span>
            )}
          </div>
          <span className="text-gray-500 text-xs whitespace-nowrap flex-shrink-0">{entry.watched_on}</span>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <StarDisplay rating={entry.rating} />
          <span className="text-teal-400 font-mono text-sm">{entry.rating}/5</span>
        </div>

        {entry.emotions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.emotions.map(e => (
              <span key={e.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ backgroundColor: e.color + '22', color: e.color, border: `1px solid ${e.color}55` }}>
                {e.icon} {e.name}
              </span>
            ))}
          </div>
        )}

        {entry.review && (
          <p className="text-gray-400 text-sm mt-2 italic line-clamp-2">"{entry.review}"</p>
        )}
      </div>

      {/* Actions (own entries only) */}
      {onDelete && (
        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex-shrink-0">
          <Link to={`/log?edit=${entry.id}`} className="text-gray-400 hover:text-teal-400 transition-colors">edit</Link>
          <button onClick={() => onDelete(entry.id)} className="text-gray-400 hover:text-red-400 transition-colors text-left">
            delete
          </button>
        </div>
      )}
    </div>
  )
}
