import { Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import MediaDetail from './pages/MediaDetail'
import Privacy from './pages/Privacy'
import Updates from './pages/Updates'

export default function App() {
  return (
    <div className="min-h-screen bg-rf-0 text-white">
      <Routes>
        <Route path="/" element={<><NavBar /><Home /></>} />
        <Route path="/media/:tmdbId" element={<><NavBar /><MediaDetail /></>} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/updates" element={<Updates />} />
        <Route path="*" element={<><NavBar /><Home /></>} />
      </Routes>
    </div>
  )
}
