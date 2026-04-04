import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleRegister() {
    if (!username || !password) { setError('Username and password are required.'); return }
    setError('')
    setLoading(true)
    try {
      await register(username, password, email)
    } catch (err) {
      setError(err.message || 'Registration failed.')
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
          <Text className="text-gray-400 text-center mb-10">Create your account.</Text>

          {error ? (
            <View className="bg-red-900/50 border border-red-700 rounded-xl px-4 py-3 mb-4">
              <Text className="text-red-300 text-sm">{error}</Text>
            </View>
          ) : null}

          <Text className="text-gray-300 text-sm font-medium mb-1.5">Username</Text>
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-4"
            placeholder="choose a username"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

          <Text className="text-gray-300 text-sm font-medium mb-1.5">Email <Text className="text-gray-500 font-normal">(optional)</Text></Text>
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#6b7280"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="text-gray-300 text-sm font-medium mb-1.5">Password</Text>
          <TextInput
            className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm mb-6"
            placeholder="choose a password"
            placeholderTextColor="#6b7280"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            className="bg-orange-500 rounded-xl py-3.5 items-center mb-4"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text className="text-white font-semibold text-base">Create account</Text>
            }
          </TouchableOpacity>

          <View className="flex-row justify-center gap-1">
            <Text className="text-gray-500 text-sm">Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text className="text-orange-400 text-sm font-medium"> Sign in</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
