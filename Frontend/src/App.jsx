import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Projekt from './pages/Projekt'
import Projektdetail from './pages/Projektdetail'
import Benutzer from './pages/Benutzer'
import Profil from './pages/Profil'

const API = 'https://localhost:8443/api'

const SCHUTZ_AKTIV = true

function GeschuetzteRoute({ children }) {
  const [status, setStatus] = useState('pruefe')

  useEffect(() => {
    if (!SCHUTZ_AKTIV) return
    fetch(`${API}/benutzer/me`, { credentials: 'include' })
      .then((antwort) => setStatus(antwort.ok ? 'ja' : 'nein'))
      .catch(() => setStatus('nein'))
  }, [])

  if (!SCHUTZ_AKTIV) return children
  if (status === 'pruefe') return null
  if (status === 'nein') return <Navigate to="/login" replace />
  return children
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/projekt" element={<GeschuetzteRoute><Projekt /></GeschuetzteRoute>} />
      <Route path="/projekt/:id" element={<GeschuetzteRoute><Projektdetail /></GeschuetzteRoute>} />
      <Route path="/benutzer" element={<GeschuetzteRoute><Benutzer /></GeschuetzteRoute>} />
      <Route path="/profil" element={<GeschuetzteRoute><Profil /></GeschuetzteRoute>} />
    </Routes>
  )
}

export default App