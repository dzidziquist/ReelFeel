import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import EntryCard from '../components/EntryCard'

export default function Feed() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getFeed()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Friends' Activity</h1>
        <Link to="/users" className="text-sm text-teal-400 hover:underline">Find friends →</Link>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">👥</p>
          <p className="text-lg mb-2">Nothing to show yet.</p>
          <Link to="/users" className="text-teal-400 hover:underline">Follow some friends to see their activity</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <EntryCard key={e.id} entry={e} showUser />
          ))}
        </div>
      )}
    </div>
  )
}
