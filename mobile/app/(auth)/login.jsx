import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function Login() {
  const { login }  = useAuth()
  const router     = useRouter()
  const { theme }  = useTheme()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleLogin() {
    if (!email || !password) { setError('Fill in all fields.'); return }
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
    } catch (err) {
      setError(err.message || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: theme.bg0 }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>

          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🎞️</Text>
            <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
            <Text style={[s.subtitle, { color: theme.violetL }]}>your feelings, your films.</Text>
          </View>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.pink }]}>
              <Text style={[s.errorText, { color: theme.pinkL }]}>😬 {error}</Text>
            </View>
          ) : null}

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
            style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
            placeholder="shhh... 🤫"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotWrap}>
            <Text style={[s.forgotLink, { color: theme.violetL }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.violet, opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Let's go! 🍿</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>New here?</Text>
            <Link href="/(auth)/register">
              <Text style={[s.footerLink, { color: theme.pink }]}> Join the club ✨</Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex:       { flex: 1 },
  scroll:     { flexGrow: 1, justifyContent: 'center' },
  inner:      { paddingHorizontal: 28, paddingVertical: 48 },
  logoWrap:   { alignItems: 'center', marginBottom: 44 },
  logoEmoji:  { fontSize: 52, marginBottom: 8 },
  title:      { fontSize: 38, fontWeight: '800', textAlign: 'center', letterSpacing: -1, marginBottom: 4 },
  subtitle:   { fontSize: 14, textAlign: 'center', fontStyle: 'italic' },
  errorBox:   { backgroundColor: '#2d001a', borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText:  { fontSize: 13 },
  label:      { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input:      { borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 14, marginBottom: 12 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 24 },
  forgotLink: { fontSize: 13, fontWeight: '500' },
  btn:        { borderRadius: 20, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
  btnText:    { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  footer:     { flexDirection: 'row', justifyContent: 'center' },
  footerMut:  { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '600' },
})
