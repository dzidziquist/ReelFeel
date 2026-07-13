import { Link } from 'react-router-dom'
import { StarDisplay } from './StarRating'

export default function EntryCard({ entry, showUser = false, onDelete }) {
  const { media } = entry
  const isTV = media?.media_type === 'tv'

  return (
    <div className="bg-rf-1 border border-white/[0.15] rounded-2xl p-4 flex gap-3">
      {/* Poster */}
      <Link to={`/media/${media?.tmdb_id}`} className="flex-shrink-0">
        {media?.poster_url
          ? <img src={media.poster_url} alt={media.title} className="w-20 h-28 object-cover rounded-xl" />
          : <div className="w-20 h-28 bg-rf-2 rounded-xl flex items-center justify-center text-muted text-2xl">?</div>
        }
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <Link
            to={`/media/${media?.tmdb_id}`}
            className="font-bold text-white text-sm leading-snug hover:text-gold transition-colors"
          >
            {media?.title}
          </Link>
          <span className="text-muted text-xs whitespace-nowrap flex-shrink-0 mt-0.5">{entry.watched_on}</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap mb-2">
          {media?.year && <span className="text-sub text-xs">({media.year})</span>}
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded">
            {isTV ? 'TV' : 'Film'}
          </span>
          {entry.rewatch && (
            <span className="bg-gold/20 text-gold text-[10px] font-bold px-2 py-0.5 rounded">Rewatch</span>
          )}
          {showUser && entry.user && (
            <span className="text-muted text-[11px]">
              by <Link to={`/users/${entry.user.id}`} className="text-gold">{entry.user.username}</Link>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 mb-2">
          <StarDisplay rating={entry.rating} />
          <span className="text-gold font-bold text-sm">{entry.rating}/5</span>
        </div>

        {entry.emotions?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {entry.emotions.map(e => (
              <span
                key={e.id}
                className="text-xs px-2.5 py-0.5 rounded-full font-medium border"
                style={{ color: e.color, borderColor: e.color + '55', backgroundColor: e.color + '18' }}
              >
                {e.icon} {e.name}
              </span>
            ))}
          </div>
        )}

        {entry.review && (
          <p className="text-sub text-xs italic line-clamp-2">"{entry.review}"</p>
        )}
      </div>

      {/* Action buttons */}
      {onDelete && (
        <div className="flex flex-col gap-1.5 flex-shrink-0 ml-1">
          <Link
            to={`/log?edit=${entry.id}`}
            className="w-9 h-9 bg-rf-2 border border-white/15 rounded-xl flex items-center justify-center text-sub hover:text-white hover:border-white/30 transition-colors text-base"
          >
            ✏
          </Link>
          <button
            onClick={() => onDelete(entry.id)}
            className="w-9 h-9 border border-primary/40 rounded-xl flex items-center justify-center text-primary hover:bg-primary/20 transition-colors text-base"
          >
            🗑
          </button>
        </div>
      )}
    </div>
  )
}
