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
      <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
        <View style={s.inner}>
          <Text style={[s.title, { color: theme.text }]}>SceneIT</Text>
          <Text style={[s.subtitle, { color: theme.textSub }]}>Check your inbox.</Text>

          <View style={[s.confirmBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            <Text style={[s.confirmText, { color: theme.text }]}>
              We sent a confirmation link to{'\n'}
              <Text style={[s.confirmEmail, { color: theme.gold }]}>{email}</Text>
            </Text>
            <Text style={[s.confirmSub, { color: theme.textSub }]}>
              Click the link in the email to activate your account, then sign in.
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.red }]}>
              <Text style={s.btnText}>Go to sign in</Text>
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
          <Text style={[s.title, { color: theme.text }]}>SceneIT</Text>
          <Text style={[s.subtitle, { color: theme.textSub }]}>Create your account.</Text>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.red }]}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: theme.textSub }]}>
            Username <Text style={[s.optional, { color: theme.textMut }]}>(optional)</Text>
          </Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
            placeholder="choose a username"
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
            placeholder="choose a password"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            onSubmitEditing={handleRegister}
          />

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={[s.btn, { backgroundColor: theme.red, opacity: loading ? 0.6 : 1 }]}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Create account</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>Already have an account?</Text>
            <Link href="/(auth)/login">
              <Text style={[s.footerLink, { color: theme.gold }]}> Sign in</Text>
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
  inner:       { paddingHorizontal: 24, paddingVertical: 48 },
  title:       { fontSize: 36, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  subtitle:    { textAlign: 'center', marginBottom: 40 },
  errorBox:    { backgroundColor: '#3f0000', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText:   { color: '#fca5a5', fontSize: 13 },
  label:       { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  optional:    { fontWeight: '400' },
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
  inputLast:   { marginBottom: 24 },
  btn:         { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText:     { color: '#fff', fontWeight: '600', fontSize: 15 },
  footer:      { flexDirection: 'row', justifyContent: 'center' },
  footerMut:   { fontSize: 13 },
  footerLink:  { fontSize: 13, fontWeight: '500' },
  confirmBox:  { borderWidth: 1, borderRadius: 12, padding: 20, marginBottom: 24 },
  confirmText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  confirmEmail:{ fontWeight: '600' },
  confirmSub:  { fontSize: 13, textAlign: 'center', lineHeight: 20 },
})
