import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import EntryCard from '../components/EntryCard'

export default function Diary() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDiary()
      .then(setEntries)
      .finally(() => setLoading(false))
  }, [])

  async function handleDelete(id) {
    if (!confirm('Delete this entry?')) return
    await api.deleteEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  if (loading) return <Spinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Diary</h1>
        <Link to="/log" className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          + Log something
        </Link>
      </div>

      {entries.length === 0 ? (
        <Empty text="No entries yet." sub={<Link to="/search" className="text-teal-400 hover:underline">Search for something to watch</Link>} />
      ) : (
        <div className="space-y-3">
          {entries.map(e => (
            <EntryCard key={e.id} entry={e} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}

function Spinner() {
  return <div className="text-center py-20 text-gray-500">Loading…</div>
}

function Empty({ text, sub }) {
  return (
    <div className="text-center py-20 text-gray-500">
      <p className="text-5xl mb-4">🎥</p>
      <p className="text-lg mb-2">{text}</p>
      {sub}
    </div>
  )
}
