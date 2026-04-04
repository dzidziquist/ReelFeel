import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    if (!username || !password) { setError('Fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled">
        <View className="px-6 py-12">
          <Text className="text-4xl font-bold text-white text-center mb-1">MovieRater</Text>
          <Text className="text-gray-400 text-center mb-10">Track what you watch.</Text>

          {error ? (
            <View className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-300 text-sm">{error}</Text>
            </View>
          ) : null}

          <Text className="text-gray-300 text-sm font-medium mb-1.5">Username</Text>
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-4"
            placeholder="your username"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

          <Text className="text-gray-300 text-sm font-medium mb-1.5">Password</Text>
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-6"
            placeholder="your password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-orange-500 rounded-xl py-3.5 items-center mb-4"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Sign in</Text>
            }
          </TouchableOpacity>

          <View className="flex-row justify-center gap-1">
            <Text className="text-gray-500 text-sm">No account?</Text>
            <Link href="/(auth)/register">
              <Text className="text-orange-400 text-sm font-medium"> Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
