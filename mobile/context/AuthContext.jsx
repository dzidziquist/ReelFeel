import { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync('token').then(token => {
      if (token) {
        api.me()
          .then(setUser)
          .catch(() => SecureStore.deleteItemAsync('token'))
          .finally(() => setLoading(false))
      } else {
        setLoading(false)
      }
    })
  }, [])

  async function login(username, password) {
    const data = await api.login({ username, password })
    await SecureStore.setItemAsync('token', data.token)
    setUser(data.user)
  }

  async function register(username, password, email) {
    const data = await api.register({ username, password, email })
    await SecureStore.setItemAsync('token', data.token)
    setUser(data.user)
  }

  async function logout() {
    await api.logout().catch(() => {})
    await SecureStore.deleteItemAsync('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
