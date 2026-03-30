import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors ${isActive ? 'text-teal-400' : 'text-gray-400 hover:text-gray-100'}`

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">
        <Link to="/" className="text-teal-400 font-bold text-xl tracking-tight">🎬 MovieRater</Link>

        {user && (
          <div className="flex items-center gap-5">
            <NavLink to="/" end className={linkClass}>Diary</NavLink>
            <NavLink to="/feed" className={linkClass}>Friends</NavLink>
            <NavLink to="/library" className={linkClass}>Library</NavLink>
            <NavLink to="/search" className={linkClass}>Search</NavLink>
            <NavLink to="/log" className="bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors">
              + Log
            </NavLink>
            <div className="flex items-center gap-3 ml-2 border-l border-gray-700 pl-4">
              <span className="text-xs text-gray-500">{user.username}</span>
              <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
