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
          <View style={[s.titleUnderline, { backgroundColor: theme.red }]} />

          <View style={[s.confirmBox, { backgroundColor: theme.bg1, borderColor: theme.gold }]}>
            <Text style={[s.confirmText, { color: theme.text }]}>
              We sent a confirmation link to{'\n'}
              <Text style={[s.confirmEmail, { color: theme.gold }]}>{email}</Text>
            </Text>
            <Text style={[s.confirmSub, { color: theme.textSub }]}>
              Click the link to activate your account, then sign in.
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.red }]}>
              <Text style={s.btnText}>Go sign in</Text>
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
            <View style={[s.titleUnderline, { backgroundColor: theme.red }]} />
            <Text style={[s.subtitle, { color: theme.gold }]}>create your account.</Text>
          </View>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.red, backgroundColor: theme.bg1 }]}>
              <Text style={[s.errorText, { color: theme.red }]}>✕  {error}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: theme.textSub }]}>
            Username <Text style={[s.optional, { color: theme.textMut }]}>(optional)</Text>
          </Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bg1, borderColor: theme.text, color: theme.text }]}
            placeholder="choose a username"
            placeholderTextColor={theme.textMut}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />

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
            style={[s.input, s.inputLast, { backgroundColor: theme.bg1, borderColor: theme.text, color: theme.text }]}
            placeholder="choose a password"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity
            onPress={handleRegister}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.red, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Create account</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text style={[s.footerLink, { color: theme.gold }]}>  Sign in</Text>
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
  logoWrap:       { alignItems: 'center', marginBottom: 40 },
  logoEmoji:      { fontSize: 54, textAlign: 'center', marginBottom: 6 },
  title:          { fontSize: 42, fontWeight: '900', textAlign: 'center', letterSpacing: -1.5 },
  titleUnderline: { height: 4, width: 80, borderRadius: 2, marginTop: 6, marginBottom: 10 },
  subtitle:       { fontSize: 13, textAlign: 'center', fontStyle: 'italic', fontWeight: '500' },
  errorBox:       { borderWidth: 2, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 },
  errorText:      { fontSize: 13, fontWeight: '700' },
  label:          { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7 },
  optional:       { fontWeight: '400', textTransform: 'none', letterSpacing: 0 },
  input:          {
    borderWidth: 2,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 0.8,
    shadowRadius: 0,
    elevation: 3,
  },
  inputLast:      { marginBottom: 26 },
  btn:            {
    borderRadius: 6,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2.5,
    borderColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  btnText:        { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  footer:         { flexDirection: 'row', justifyContent: 'center' },
  footerMut:      { fontSize: 13 },
  footerLink:     { fontSize: 13, fontWeight: '700' },
  confirmBox:     { borderWidth: 2, borderRadius: 6, padding: 20, marginBottom: 26 },
  confirmText:    { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  confirmEmail:   { fontWeight: '800' },
  confirmSub:     { fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
