import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { C } from '../../constants/theme'

export default function Register() {
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleRegister() {
    if (!email || !password) { setError('Email and password are required.'); return }
    setError('')
    setLoading(true)
    try {
      await register({ email, password, username: username || email.split('@')[0] })
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <Text style={s.title}>MovieRater</Text>
          <Text style={s.subtitle}>Create your account.</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Username <Text style={s.optional}>(optional)</Text></Text>
          <TextInput
            style={s.input}
            placeholder="choose a username"
            placeholderTextColor={C.textMut}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

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
            style={[s.input, s.inputLast]}
            placeholder="choose a password"
            placeholderTextColor={C.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={[s.btn, { opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color={C.text} />
              : <Text style={s.btnText}>Create account</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerMut}>Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text style={s.footerLink}> Sign in</Text>
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
  optional:  { color: C.textMut, fontWeight: '400' },
  input:     { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 16 },
  inputLast: { marginBottom: 24 },
  btn:       { backgroundColor: C.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText:   { color: C.text, fontWeight: '600', fontSize: 15 },
  footer:    { flexDirection: 'row', justifyContent: 'center' },
  footerMut: { color: C.textMut, fontSize: 13 },
  footerLink:{ color: C.gold, fontSize: 13, fontWeight: '500' },
})
