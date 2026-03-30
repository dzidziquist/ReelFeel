import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import { useAuth } from './context/AuthContext'
import Diary from './pages/Diary'
import Feed from './pages/Feed'
import Library from './pages/Library'
import Login from './pages/Login'
import LogEntry from './pages/LogEntry'
import MediaDetail from './pages/MediaDetail'
import Register from './pages/Register'
import UserProfile from './pages/UserProfile'
import Users from './pages/Users'
import Search from './pages/Search'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="text-center py-20 text-gray-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Routes>
        {/* Public */}
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

        {/* Protected */}
        <Route path="/" element={<RequireAuth><NavBar /><Diary /></RequireAuth>} />
        <Route path="/feed" element={<RequireAuth><NavBar /><Feed /></RequireAuth>} />
        <Route path="/library" element={<RequireAuth><NavBar /><Library /></RequireAuth>} />
        <Route path="/search" element={<RequireAuth><NavBar /><Search /></RequireAuth>} />
        <Route path="/log" element={<RequireAuth><NavBar /><LogEntry /></RequireAuth>} />
        <Route path="/media/:tmdbId" element={<RequireAuth><NavBar /><MediaDetail /></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><NavBar /><Users /></RequireAuth>} />
        <Route path="/users/:id" element={<RequireAuth><NavBar /><UserProfile /></RequireAuth>} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
