import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Link, useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { C } from '../../constants/theme'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
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
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <Text style={s.title}>MovieRater</Text>
          <Text style={s.subtitle}>Track what you watch.</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Email</Text>
          <TextInput
            style={s.input}
            placeholder="you@example.com"
            placeholderTextColor={C.textMut}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={s.label}>Password</Text>
          <TextInput
            style={s.input}
            placeholder="your password"
            placeholderTextColor={C.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/forgot-password')}
            style={s.forgotWrap}
          >
            <Text style={s.forgotLink}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            style={[s.btn, { opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color={C.text} />
              : <Text style={s.btnText}>Sign in</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerMut}>No account?</Text>
            <Link href="/(auth)/register">
              <Text style={s.footerLink}> Sign up</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: C.bg0 },
  scroll:    { flexGrow: 1, justifyContent: 'center' },
  inner:     { paddingHorizontal: 24, paddingVertical: 48 },
  title:     { fontSize: 36, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 4 },
  subtitle:  { color: C.textSub, textAlign: 'center', marginBottom: 40 },
  errorBox:  { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText: { color: '#fca5a5', fontSize: 13 },
  label:     { color: C.textSub, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input:      { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 8 },
  forgotWrap: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotLink: { color: C.gold, fontSize: 13 },
  btn:        { backgroundColor: C.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText:   { color: C.text, fontWeight: '600', fontSize: 15 },
  footer:    { flexDirection: 'row', justifyContent: 'center' },
  footerMut: { color: C.textMut, fontSize: 13 },
  footerLink:{ color: C.gold, fontSize: 13, fontWeight: '500' },
})
