import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const debounce = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const q = params.get('q') || ''
    if (!q) return
    setQuery(q)
    doSearch(q)
  }, [])

  function handleInput(e) {
    const val = e.target.value
    setQuery(val)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => {
      if (val.trim()) doSearch(val.trim())
      else setResults([])
    }, 400)
  }

  async function doSearch(q) {
    setLoading(true)
    setError('')
    try {
      const data = await api.search(q)
      setResults(data.results || [])
      setParams({ q })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      <div className="flex gap-2 mb-8">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder="Search films and TV shows…"
          autoFocus
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-4 py-3 rounded-lg mb-6">
          {error} — make sure your TMDB API key is set in <code className="bg-gray-800 px-1 rounded">.env</code>
        </div>
      )}

      {loading && <p className="text-gray-500 text-center py-8">Searching…</p>}

      {!loading && query && results.length === 0 && !error && (
        <p className="text-gray-500 text-center py-8">No results for "<strong className="text-gray-300">{query}</strong>"</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {results.map(r => (
            <div key={r.tmdb_id} className="bg-gray-900 rounded-xl flex gap-3 p-3 hover:bg-gray-800/70 transition-colors">
              {r.poster_path
                ? <img src={`https://image.tmdb.org/t/p/w200${r.poster_path}`} alt={r.title} className="w-16 h-24 object-cover rounded-lg flex-shrink-0 shadow" />
                : <div className="w-16 h-24 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">🎬</div>
              }
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <p className="font-semibold text-sm leading-tight">{r.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {r.year && <span className="text-gray-500 text-xs">{r.year}</span>}
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${
                      r.media_type === 'film' ? 'border-blue-700 text-blue-400' : 'border-purple-700 text-purple-400'
                    }`}>
                      {r.media_type === 'film' ? 'Film' : 'TV Show'}
                    </span>
                  </div>
                  {r.tmdb_rating && <span className="text-yellow-400 text-xs">★ {r.tmdb_rating.toFixed(1)}</span>}
                  {r.overview && <p className="text-gray-500 text-xs mt-1 line-clamp-2">{r.overview}</p>}
                </div>
                <button
                  onClick={() => navigate(`/log?tmdb_id=${r.tmdb_id}&type=${r.media_type}`)}
                  className="mt-2 bg-teal-600 hover:bg-teal-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors text-center"
                >
                  + Log this
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
