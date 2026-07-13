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
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address.'); return }
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
            <View style={[s.titleUnderline, { backgroundColor: theme.red }]} />
            <Text style={[s.subtitle, { color: theme.gold }]}>your feelings, your films.</Text>
          </View>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.red, backgroundColor: theme.bg1 }]}>
              <Text style={[s.errorText, { color: theme.red }]}>✕  {error}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: theme.textSub }]}>Email</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bg1, borderColor: theme.text, color: theme.text }]}
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
            style={[s.input, { backgroundColor: theme.bg1, borderColor: theme.text, color: theme.text }]}
            placeholder="your password"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')} style={s.forgotWrap}>
            <Text style={[s.forgotLink, { color: theme.gold }]}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.red, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>No account?</Text>
            <Link href="/(auth)/register">
              <Text style={[s.footerLink, { color: theme.gold }]}>  Sign up</Text>
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex:           { flex: 1 },
  scroll:         { flexGrow: 1, justifyContent: 'center' },
  inner:          { paddingHorizontal: 26, paddingVertical: 48 },
  logoWrap:       { alignItems: 'center', marginBottom: 44 },
  logoEmoji:      { fontSize: 54, marginBottom: 6 },
  title:          { fontSize: 42, fontWeight: '900', textAlign: 'center', letterSpacing: -1.5 },
  titleUnderline: { height: 4, width: 80, borderRadius: 2, marginTop: 6, marginBottom: 10 },
  subtitle:       { fontSize: 13, textAlign: 'center', fontStyle: 'italic', fontWeight: '500' },
  errorBox:       { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 },
  errorText:      { fontSize: 13, fontWeight: '700' },
  label:          { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7 },
  input:          {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  forgotWrap:     { alignSelf: 'flex-end', marginBottom: 22 },
  forgotLink:     { fontSize: 13, fontWeight: '600' },
  btn:            {
    borderRadius: 6,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  btnText:        { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  footer:         { flexDirection: 'row', justifyContent: 'center' },
  footerMut:      { fontSize: 13 },
  footerLink:     { fontSize: 13, fontWeight: '700' },
})
