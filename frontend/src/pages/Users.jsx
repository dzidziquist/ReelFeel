import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getUsers()
      .then(setUsers)
      .finally(() => setLoading(false))
  }, [])

  async function toggleFollow(user) {
    try {
      if (user.is_following) {
        await api.unfollow(user.id)
      } else {
        await api.follow(user.id)
      }
      setUsers(prev => prev.map(u =>
        u.id === user.id ? { ...u, is_following: !u.is_following } : u
      ))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">People</h1>

      {users.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-5xl mb-4">👤</p>
          <p>No other users yet. Share the app with friends!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map(u => (
            <div key={u.id} className="bg-gray-900 rounded-xl flex items-center justify-between p-4">
              <Link to={`/users/${u.id}`} className="flex items-center gap-3 hover:text-teal-400 transition-colors">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg font-bold text-gray-300">
                  {u.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{u.username}</p>
                  <p className="text-xs text-gray-500">Joined {new Date(u.date_joined).toLocaleDateString()}</p>
                </div>
              </Link>
              <button
                onClick={() => toggleFollow(u)}
                className={`text-sm px-4 py-1.5 rounded-lg border font-medium transition-colors ${
                  u.is_following
                    ? 'border-gray-600 text-gray-400 hover:border-red-600 hover:text-red-400'
                    : 'border-teal-600 text-teal-400 hover:bg-teal-600 hover:text-white'
                }`}
              >
                {u.is_following ? 'Following' : 'Follow'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
