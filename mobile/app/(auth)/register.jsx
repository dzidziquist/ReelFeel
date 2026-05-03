import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Register() {
  const { register } = useAuth()
  const { theme }    = useTheme()

  const [username, setUsername]   = useState('')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [error, setError]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleRegister() {
    if (!email || !password) { setError('Email and password are required.'); return }
    setError('')
    setLoading(true)
    try {
      const { requiresConfirmation } = await register({
        email,
        password,
        username: username || email.split('@')[0],
      })
      if (requiresConfirmation) setConfirmed(true)
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <View style={[s.flex, { backgroundColor: theme.bg0, justifyContent: 'center' }]}>
        <View style={s.inner}>
          <Text style={s.logoEmoji}>📬</Text>
          <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
          <Text style={[s.subtitle, { color: theme.violetL }]}>almost there!</Text>

          <View style={[s.confirmBox, { backgroundColor: theme.bg2, borderColor: theme.violet }]}>
            <Text style={[s.confirmText, { color: theme.text }]}>
              We sent a confirmation link to{'\n'}
              <Text style={[s.confirmEmail, { color: theme.pink }]}>{email}</Text>
            </Text>
            <Text style={[s.confirmSub, { color: theme.textSub }]}>
              Click the link to activate your account, then sign in. ✅
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.violet }]}>
              <Text style={s.btnText}>Go sign in 🎬</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: theme.bg0 }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>

          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🎞️</Text>
            <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
            <Text style={[s.subtitle, { color: theme.violetL }]}>join the watch party.</Text>
          </View>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.pink }]}>
              <Text style={[s.errorText, { color: theme.pinkL }]}>😬 {error}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: theme.textSub }]}>
            Username <Text style={[s.optional, { color: theme.textMut }]}>(optional)</Text>
          </Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
            placeholder="e.g. cinephile_42 🎥"
            placeholderTextColor={theme.textMut}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

          <Text style={[s.label, { color: theme.textSub }]}>Email</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
            placeholder="you@example.com"
            placeholderTextColor={theme.textMut}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={[s.label, { color: theme.textSub }]}>Password</Text>
          <TextInput
            style={[s.input, s.inputLast, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
            placeholder="make it a good one 🔐"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.violet, opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Create my account 🚀</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>Already a watcher?</Text>
            <Link href="/(auth)/login">
              <Text style={[s.footerLink, { color: theme.pink }]}> Sign in ✨</Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex:        { flex: 1 },
  scroll:      { flexGrow: 1, justifyContent: 'center' },
  inner:       { paddingHorizontal: 28, paddingVertical: 48 },
  logoWrap:    { alignItems: 'center', marginBottom: 44 },
  logoEmoji:   { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title:       { fontSize: 38, fontWeight: '800', textAlign: 'center', letterSpacing: -1, marginBottom: 4 },
  subtitle:    { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
  errorBox:    { backgroundColor: '#2d001a', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText:   { fontSize: 13 },
  label:       { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  optional:    { fontWeight: '400' },
  input:       { borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 14, marginBottom: 16 },
  inputLast:   { marginBottom: 28 },
  btn:         { borderRadius: 20, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  footer:      { flexDirection: 'row', justifyContent: 'center' },
  footerMut:   { fontSize: 13 },
  footerLink:  { fontSize: 13, fontWeight: '600' },
  confirmBox:  { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 28 },
  confirmText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  confirmEmail:{ fontWeight: '700' },
  confirmSub:  { fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
