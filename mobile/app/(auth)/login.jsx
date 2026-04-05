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

  const t = makeStyles(theme)

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: theme.bg0 }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <Text style={[s.title, { color: theme.text }]}>MovieRater</Text>
          <Text style={[s.subtitle, { color: theme.textSub }]}>Track what you watch.</Text>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.red }]}>
              <Text style={s.errorText}>{error}</Text>
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

          <TouchableOpacity onPress={handleLogin} disabled={loading} style={[s.btn, { backgroundColor: theme.red, opacity: loading ? 0.6 : 1 }]}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>No account?</Text>
            <Link href="/(auth)/register">
              <Text style={[s.footerLink, { color: theme.gold }]}> Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function makeStyles(theme) { return theme } // keep for compatibility

const s = StyleSheet.create({
  flex:       { flex: 1 },
  scroll:     { flexGrow: 1, justifyContent: 'center' },
  inner:      { paddingHorizontal: 24, paddingVertical: 48 },
  title:      { fontSize: 36, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle:   { textAlign: 'center', marginBottom: 40 },
  errorBox:   { backgroundColor: '#3f0000', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText:  { color: '#fca5a5', fontSize: 13 },
  label:      { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input:      { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 8 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotLink: { fontSize: 13 },
  btn:        { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText:    { color: '#fff', fontWeight: '600', fontSize: 15 },
  footer:     { flexDirection: 'row', justifyContent: 'center' },
  footerMut:  { fontSize: 13 },
  footerLink: { fontSize: 13, fontWeight: '500' },
})
