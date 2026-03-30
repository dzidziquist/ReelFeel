import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import EntryCard from '../components/EntryCard'

export default function UserProfile() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getProfile(id)
      .then(setData)
      .finally(() => setLoading(false))
  }, [id])

  async function toggleFollow() {
    if (!data) return
    try {
      if (data.user.is_following) {
        await api.unfollow(data.user.id)
      } else {
        await api.follow(data.user.id)
      }
      setData(prev => ({ ...prev, user: { ...prev.user, is_following: !prev.user.is_following } }))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>
  if (!data) return null

  const { user, entries } = data

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Profile header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-bold text-gray-300">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.username}</h1>
            <p className="text-gray-500 text-sm">Joined {new Date(user.date_joined).toLocaleDateString()}</p>
          </div>
        </div>
        <button
          onClick={toggleFollow}
          className={`text-sm px-5 py-2 rounded-lg border font-medium transition-colors ${
            user.is_following
              ? 'border-gray-600 text-gray-400 hover:border-red-600 hover:text-red-400'
              : 'border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white'
          }`}
        >
          {user.is_following ? 'Following' : 'Follow'}
        </button>
      </div>

      {/* Recent entries */}
      <h2 className="text-lg font-semibold mb-4 border-b border-gray-800 pb-2">
        Recent watches <span className="text-gray-500 font-normal">({entries.length})</span>
      </h2>

      {entries.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No entries yet.</p>
      ) : (
        <div className="space-y-3">
          {entries.map(e => <EntryCard key={e.id} entry={e} />)}
        </div>
      )}
    </div>
  )
}
