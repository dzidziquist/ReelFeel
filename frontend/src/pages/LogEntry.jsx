import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import EmotionPicker from '../components/EmotionPicker'
import { StarPicker } from '../components/StarRating'

export default function LogEntry() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const tmdbId  = params.get('tmdb_id')
  const type    = params.get('type') || 'film'
  const editId  = params.get('edit')

  const today = new Date().toISOString().split('T')[0]

  const [media, setMedia] = useState(null)
  const [emotions, setEmotions] = useState([])
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [form, setForm] = useState({
    tmdb_id: tmdbId || '',
    media_type: type,
    watched_on: today,
    rating: 3,
    review: '',
    rewatch: false,
    emotion_ids: [],
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Load emotions
  useEffect(() => {
    api.getEmotions().then(setEmotions)
  }, [])

  // Load existing media from tmdb_id
  useEffect(() => {
    if (!tmdbId) return
    api.getMedia(tmdbId).then(d => setMedia(d.media)).catch(() => {})
  }, [tmdbId])

  // Load entry for editing
  useEffect(() => {
    if (!editId) return
    api.getDiary().then(entries => {
      const entry = entries.find(e => e.id === Number(editId))
      if (!entry) return
      setMedia(entry.media)
      setForm({
        tmdb_id: entry.media.tmdb_id,
        media_type: entry.media.media_type,
        watched_on: entry.watched_on,
        rating: entry.rating,
        review: entry.review,
        rewatch: entry.rewatch,
        emotion_ids: entry.emotions.map(e => e.id),
      })
    })
  }, [editId])

  async function handleSearch() {
    if (!searchQ.trim()) return
    const data = await api.search(searchQ.trim())
    setSearchResults(data.results || [])
  }

  function selectMedia(r) {
    setForm(f => ({ ...f, tmdb_id: r.tmdb_id, media_type: r.media_type }))
    setMedia({ tmdb_id: r.tmdb_id, media_type: r.media_type, title: r.title, year: r.year, poster_path: r.poster_path, poster_url: r.poster_path ? `https://image.tmdb.org/t/p/w500${r.poster_path}` : null })
    setSearchResults([])
    setSearchQ('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.tmdb_id) { setError('Select a film or TV show first.'); return }
    setError('')
    setLoading(true)
    try {
      if (editId) {
        await api.updateEntry(editId, form)
      } else {
        await api.createEntry(form)
      }
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const showForm = !!media || !!editId

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{editId ? 'Edit Entry' : 'Log a Watch'}</h1>

      {error && <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>}

      {/* Media search */}
      {!media && !editId && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">Find a film or TV show</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
              placeholder="Search TMDB…"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors"
            />
            <button type="button" onClick={handleSearch} className="bg-teal-600 hover:bg-teal-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-3 space-y-2">
              {searchResults.slice(0, 5).map(r => (
                <button key={r.tmdb_id} type="button" onClick={() => selectMedia(r)}
                  className="w-full flex items-center gap-3 bg-gray-800 rounded-lg p-2.5 hover:bg-gray-700 transition-colors text-left">
                  {r.poster_path
                    ? <img src={`https://image.tmdb.org/t/p/w92${r.poster_path}`} className="w-8 h-12 object-cover rounded" />
                    : <div className="w-8 h-12 bg-gray-600 rounded flex items-center justify-center">🎬</div>
                  }
                  <div>
                    <p className="text-sm font-medium">{r.title} {r.year && <span className="text-gray-500">({r.year})</span>}</p>
                    <span className={`text-xs ${r.media_type === 'film' ? 'text-blue-400' : 'text-purple-400'}`}>
                      {r.media_type === 'film' ? 'Film' : 'TV Show'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected media preview */}
      {media && (
        <div className="bg-gray-800 rounded-xl flex gap-4 p-4 mb-6">
          {media.poster_url
            ? <img src={media.poster_url} alt={media.title} className="w-16 h-24 object-cover rounded-lg shadow flex-shrink-0" />
            : <div className="w-16 h-24 bg-gray-700 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl">🎬</div>
          }
          <div>
            <p className="font-semibold">{media.title}</p>
            {media.year && <p className="text-gray-500 text-sm">{media.year}</p>}
            <span className={`text-xs px-1.5 py-0.5 rounded border mt-1 inline-block ${
              media.media_type === 'film' ? 'border-blue-700 text-blue-400' : 'border-purple-700 text-purple-400'
            }`}>
              {media.media_type === 'film' ? 'Film' : 'TV Show'}
            </span>
            {!editId && <button type="button" onClick={() => { setMedia(null); setForm(f => ({ ...f, tmdb_id: '', media_type: 'film' })) }} className="block text-xs text-gray-500 hover:text-red-400 mt-1 transition-colors">Change</button>}
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Watched on</label>
            <input type="date" value={form.watched_on} onChange={e => setForm(f => ({ ...f, watched_on: e.target.value }))}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm w-full focus:outline-none focus:border-teal-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Rating (0–5)</label>
            <div className="flex items-center gap-4">
              <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />
              <input type="number" value={form.rating} min="0" max="5" step="0.1"
                onChange={e => setForm(f => ({ ...f, rating: parseFloat(e.target.value) || 0 }))}
                className="w-20 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 font-mono" />
            </div>
            <p className="text-gray-500 text-xs mt-1">Click stars (double-click for half) or type any value like 3.8</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">How did it make you feel?</label>
            <EmotionPicker emotions={emotions} selected={form.emotion_ids} onChange={ids => setForm(f => ({ ...f, emotion_ids: ids }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes <span className="text-gray-500 font-normal">(optional)</span></label>
            <textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))}
              rows={3} placeholder="Any thoughts…"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-teal-500 transition-colors resize-none" />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.rewatch} onChange={e => setForm(f => ({ ...f, rewatch: e.target.checked }))}
              className="w-4 h-4 accent-teal-500" />
            <span className="text-sm text-gray-300">This was a rewatch</span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white py-2.5 rounded-lg font-medium transition-colors">
              {loading ? 'Saving…' : editId ? 'Save changes' : 'Log entry'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gray-500 transition-colors text-sm font-medium">
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
