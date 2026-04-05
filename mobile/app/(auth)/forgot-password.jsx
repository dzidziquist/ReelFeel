import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { Link } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { C } from '../../constants/theme'

export default function ForgotPassword() {
  const { resetPassword } = useAuth()
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
      <View style={s.flex}>
        <View style={s.inner}>
          <Text style={s.title}>MovieRater</Text>
          <Text style={s.subtitle}>Check your inbox.</Text>

          <View style={s.confirmBox}>
            <Text style={s.confirmText}>
              We sent a password reset link to{'\n'}
              <Text style={s.confirmEmail}>{email}</Text>
            </Text>
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={s.btn}>
              <Text style={s.btnText}>Back to sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>
          <Text style={s.title}>MovieRater</Text>
          <Text style={s.subtitle}>Reset your password.</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={s.label}>Email</Text>
          <TextInput
            style={[s.input, s.inputLast]}
            placeholder="you@example.com"
            placeholderTextColor={C.textMut}
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
            style={[s.btn, { opacity: loading ? 0.6 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color={C.text} />
              : <Text style={s.btnText}>Send reset link</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerMut}>Remember it?</Text>
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
  flex:         { flex: 1, backgroundColor: C.bg0 },
  scroll:       { flexGrow: 1, justifyContent: 'center' },
  inner:        { paddingHorizontal: 24, paddingVertical: 48 },
  title:        { fontSize: 36, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 4 },
  subtitle:     { color: C.textSub, textAlign: 'center', marginBottom: 40 },
  errorBox:     { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 16 },
  errorText:    { color: '#fca5a5', fontSize: 13 },
  label:        { color: C.textSub, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input:        { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 16 },
  inputLast:    { marginBottom: 24 },
  btn:          { backgroundColor: C.red, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  btnText:      { color: C.text, fontWeight: '600', fontSize: 15 },
  footer:       { flexDirection: 'row', justifyContent: 'center' },
  footerMut:    { color: C.textMut, fontSize: 13 },
  footerLink:   { color: C.gold, fontSize: 13, fontWeight: '500' },
  confirmBox:   { backgroundColor: C.bg2, borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 20, marginBottom: 24 },
  confirmText:  { color: C.text, fontSize: 14, textAlign: 'center', lineHeight: 22 },
  confirmEmail: { color: C.gold, fontWeight: '600' },
})
