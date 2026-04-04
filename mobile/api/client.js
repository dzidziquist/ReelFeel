import { API_BASE_URL } from '../constants/api'
import * as SecureStore from 'expo-secure-store'

async function getToken() {
  return SecureStore.getItemAsync('token')
}

async function request(path, options = {}) {
  const token = await getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Token ${token}`

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const msg = data?.error || data?.detail || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

export const api = {
  // Auth
  register: (body) => request('/auth/register/', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body) => request('/auth/login/',    { method: 'POST', body: JSON.stringify(body) }),
  logout:   ()     => request('/auth/logout/',   { method: 'POST' }),
  me:       ()     => request('/auth/me/'),

  // Diary
  getDiary:    ()          => request('/diary/'),
  createEntry: (body)      => request('/diary/entries/', { method: 'POST', body: JSON.stringify(body) }),
  updateEntry: (id, body)  => request(`/diary/entries/${id}/`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteEntry: (id)        => request(`/diary/entries/${id}/`, { method: 'DELETE' }),

  // Feed
  getFeed: () => request('/feed/'),

  // Emotions
  getEmotions: () => request('/emotions/'),

  // Media
  getLibrary: (type) => request(`/library/${type ? `?type=${type}` : ''}`),
  getMedia:   (tmdbId) => request(`/media/${tmdbId}/`),
  search:     (q) => request(`/search/?q=${encodeURIComponent(q)}`),

  // Users
  getUsers:   ()   => request('/users/'),
  getProfile: (id) => request(`/users/${id}/`),
  follow:     (id) => request(`/users/${id}/follow/`, { method: 'POST' }),
  unfollow:   (id) => request(`/users/${id}/follow/`, { method: 'DELETE' }),
}
