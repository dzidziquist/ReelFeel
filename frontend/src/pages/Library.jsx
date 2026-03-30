import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function Library() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [params, setParams] = useSearchParams()
  const type = params.get('type') || ''

  useEffect(() => {
    setLoading(true)
    api.getLibrary(type)
      .then(setItems)
      .finally(() => setLoading(false))
  }, [type])

  function FilterBtn({ value, label }) {
    const active = type === value
    return (
      <button
        onClick={() => setParams(value ? { type: value } : {})}
        className={`px-3 py-1.5 rounded-lg border text-sm transition-colors ${
          active
            ? value === 'film' ? 'bg-blue-700 border-blue-700 text-white'
              : value === 'tv' ? 'bg-purple-700 border-purple-700 text-white'
              : 'bg-teal-600 border-teal-600 text-white'
            : 'border-gray-700 text-gray-400 hover:border-gray-500'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Library</h1>
        <div className="flex gap-2">
          <FilterBtn value="" label="All" />
          <FilterBtn value="film" label="Films" />
          <FilterBtn value="tv" label="TV Shows" />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-500">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">📚</p>
          <p className="text-lg mb-2">Nothing here yet.</p>
          <Link to="/search" className="text-teal-400 hover:underline">Find something to watch</Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {items.map(item => (
            <Link key={item.id} to={`/media/${item.tmdb_id}`} className="group">
              <div className="relative rounded-lg overflow-hidden bg-gray-800 aspect-[2/3]">
                {item.poster_url
                  ? <img src={item.poster_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl text-gray-600">🎬</div>
                }
                <span className={`absolute top-1.5 left-1.5 text-xs px-1.5 py-0.5 rounded font-medium ${
                  item.media_type === 'film' ? 'bg-blue-900/80 text-blue-300' : 'bg-purple-900/80 text-purple-300'
                }`}>
                  {item.media_type === 'film' ? 'F' : 'TV'}
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1.5 truncate group-hover:text-teal-400 transition-colors">{item.title}</p>
              {item.year && <p className="text-xs text-gray-600">{item.year}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
