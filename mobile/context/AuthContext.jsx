import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,            setUser]            = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [recoverySession, setRecoverySession] = useState(false)
  const router     = useRouter()
  const didNavigate = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error) setUser(session?.user ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setRecoverySession(true)
        if (!didNavigate.current) {
          didNavigate.current = true
          router.replace('/(auth)/reset-password')
        }
      } else if (event === 'SIGNED_OUT') {
        // Other events (SIGNED_IN from the recovery code exchange,
        // TOKEN_REFRESHED) must not end an in-progress password reset.
        setRecoverySession(false)
        didNavigate.current = false
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function login({ email, password }) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function register({ email, password, username }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })
    if (error) throw error
    return { requiresConfirmation: !data.session }
  }

  async function resetPassword(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'reelfeel://reset-password',
    })
    if (error) throw error
  }

  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
    setRecoverySession(false)
  }

  // Called by the deep-link handler around a password-reset code exchange,
  // so AuthGuard keeps the user on the reset screen once they are signed in.
  function beginRecovery() { setRecoverySession(true) }
  function cancelRecovery() { setRecoverySession(false) }

  async function logout() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, resetPassword, updatePassword, logout, recoverySession, beginRecovery, cancelRecovery }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
