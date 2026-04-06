import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
  const { theme }         = useTheme()

  const [email, setEmail]     = useState('')
  const [error, setError]     = useState('')
  const [sent, setSent]       = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    if (!email) { setError('Enter your email address.'); return }
    setError('')
    setLoading(true)
    try {
      await resetPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.message || 'Could not send reset email.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
        <View style={s.inner}>
          <Text style={[s.title, { color: theme.text }]}>SceneIT</Text>
          <Text style={[s.subtitle, { color: theme.textSub }]}>Check your inbox.</Text>

          <View style={[s.confirmBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            <Text style={[s.confirmText, { color: theme.text }]}>
              We sent a password reset link to{'\n'}
              <Text style={[s.confirmEmail, { color: theme.gold }]}>{email}</Text>
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.red }]}>
              <Text style={s.btnText}>Back to sign in</Text>
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
          <Text style={[s.subtitle, { color: theme.textSub }]}>Reset your password.</Text>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.red }]}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: theme.textSub }]}>Email</Text>
          <TextInput
            style={[s.input, s.inputLast, { backgroundColor: theme.bg2, borderColor: theme.border, color: theme.text }]}
            placeholder="you@example.com"
            placeholderTextColor={theme.textMut}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={handleReset}
          />

          <TouchableOpacity onPress={handleReset} disabled={loading} style={[s.btn, { backgroundColor: theme.red, opacity: loading ? 0.6 : 1 }]}>
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Send reset link</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>Remember it?</Text>
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
  input:       { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, marginBottom: 16 },
  inputLast:   { marginBottom: 24 },
  btn:         { borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText:     { color: '#fff', fontWeight: '600', fontSize: 15 },
  footer:      { flexDirection: 'row', justifyContent: 'center' },
  footerMut:   { fontSize: 13 },
  footerLink:  { fontSize: 13, fontWeight: '500' },
  confirmBox:  { borderWidth: 1, borderRadius: 12, padding: 20, marginBottom: 24 },
  confirmText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  confirmEmail:{ fontWeight: '600' },
})
