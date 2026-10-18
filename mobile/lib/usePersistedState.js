import { useCallback, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

// useState that survives app restarts (string values only).
export function usePersistedState(key, initial) {
  const [value, setValueState] = useState(initial)

  useEffect(() => {
    SecureStore.getItemAsync(key)
      .then(saved => { if (saved !== null) setValueState(saved) })
      .catch(() => {})
  }, [key])

  const setValue = useCallback((next) => {
    setValueState(prev => {
      const resolved = typeof next === 'function' ? next(prev) : next
      SecureStore.setItemAsync(key, resolved).catch(() => {})
      return resolved
    })
  }, [key])

  return [value, setValue]
}
