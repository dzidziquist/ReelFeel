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
      <View style={[s.flex, { backgroundColor: theme.bg0, justifyContent: 'center' }]}>
        <View style={s.inner}>
          <Text style={s.logoEmoji}>📩</Text>
          <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
          <Text style={[s.subtitle, { color: theme.violetL }]}>check your inbox!</Text>

          <View style={[s.confirmBox, { backgroundColor: theme.bg2, borderColor: theme.violet }]}>
            <Text style={[s.confirmText, { color: theme.text }]}>
              We sent a reset link to{'\n'}
              <Text style={[s.confirmEmail, { color: theme.pink }]}>{email}</Text>
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[s.btn, { backgroundColor: theme.violet }]}>
              <Text style={s.btnText}>Back to sign in 🎬</Text>
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
            <Text style={s.logoEmoji}>🔑</Text>
            <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
            <Text style={[s.subtitle, { color: theme.violetL }]}>let's get you back in.</Text>
          </View>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.pink }]}>
              <Text style={[s.errorText, { color: theme.pinkL }]}>😬 {error}</Text>
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

          <TouchableOpacity
            onPress={handleReset}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.violet, opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Send reset link 📨</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={[s.footerMut, { color: theme.textMut }]}>Remember it?</Text>
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
  input:       { borderWidth: 1, borderRadius: 16, paddingHorizontal: 18, paddingVertical: 14, fontSize: 14, marginBottom: 16 },
  inputLast:   { marginBottom: 28 },
  btn:         { borderRadius: 20, paddingVertical: 15, alignItems: 'center', marginBottom: 20 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16, letterSpacing: 0.3 },
  footer:      { flexDirection: 'row', justifyContent: 'center' },
  footerMut:   { fontSize: 13 },
  footerLink:  { fontSize: 13, fontWeight: '600' },
  confirmBox:  { borderWidth: 1, borderRadius: 16, padding: 20, marginBottom: 28 },
  confirmText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  confirmEmail:{ fontWeight: '700' },
})
