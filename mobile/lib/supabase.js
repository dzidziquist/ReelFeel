import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'

// Chunked storage adapter: SecureStore has a 2 KB/key limit
const adapter = {
  async getItem(key) {
    const n = parseInt(await SecureStore.getItemAsync(key + '_n') ?? '0')
    if (!n) return null
    let value = ''
    for (let i = 0; i < n; i++) value += (await SecureStore.getItemAsync(`${key}_${i}`)) ?? ''
    return value
  },
  async setItem(key, value) {
    const size = 1800
    const n = Math.ceil(value.length / size)
    await SecureStore.setItemAsync(key + '_n', String(n))
    for (let i = 0; i < n; i++)
      await SecureStore.setItemAsync(`${key}_${i}`, value.slice(i * size, (i + 1) * size))
  },
  async removeItem(key) {
    const n = parseInt(await SecureStore.getItemAsync(key + '_n') ?? '0')
    await SecureStore.deleteItemAsync(key + '_n')
    for (let i = 0; i < n; i++) await SecureStore.deleteItemAsync(`${key}_${i}`)
  },
}

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: adapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
