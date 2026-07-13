import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function ResetPassword() {
  const { updatePassword } = useAuth()
  const { theme }          = useTheme()
  const router             = useRouter()

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)

  async function handleUpdate() {
    if (!password || !confirm) { setError('Fill in both fields.'); return }
    if (password.length < 6)   { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    setError('')
    setLoading(true)
    try {
      await updatePassword(password)
      setDone(true)
    } catch (err) {
      setError(err.message || 'Could not update password.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <View style={[s.flex, { backgroundColor: theme.bg0, justifyContent: 'center' }]}>
        <View style={s.inner}>
          <Text style={s.logoEmoji}>✅</Text>
          <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
          <View style={[s.titleUnderline, { backgroundColor: theme.red }]} />
          <View style={[s.confirmBox, { backgroundColor: theme.bg1, borderColor: theme.gold }]}>
            <Text style={[s.confirmText, { color: theme.text }]}>
              Password updated successfully.
            </Text>
          </View>
          <TouchableOpacity
            style={[s.btn, { backgroundColor: theme.red }]}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={s.btnText}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={[s.flex, { backgroundColor: theme.bg0 }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.inner}>

          <View style={s.logoWrap}>
            <Text style={s.logoEmoji}>🔐</Text>
            <Text style={[s.title, { color: theme.text }]}>ReelFeel</Text>
            <View style={[s.titleUnderline, { backgroundColor: theme.red }]} />
            <Text style={[s.subtitle, { color: theme.gold }]}>choose a new password.</Text>
          </View>

          {error ? (
            <View style={[s.errorBox, { borderColor: theme.red, backgroundColor: theme.bg1 }]}>
              <Text style={[s.errorText, { color: theme.red }]}>✕  {error}</Text>
            </View>
          ) : null}

          <Text style={[s.label, { color: theme.textSub }]}>New Password</Text>
          <TextInput
            style={[s.input, { backgroundColor: theme.bg1, borderColor: theme.text, color: theme.text }]}
            placeholder="at least 6 characters"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text style={[s.label, { color: theme.textSub }]}>Confirm Password</Text>
          <TextInput
            style={[s.input, s.inputLast, { backgroundColor: theme.bg1, borderColor: theme.text, color: theme.text }]}
            placeholder="repeat your password"
            placeholderTextColor={theme.textMut}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
            onSubmitEditing={handleUpdate}
          />

          <TouchableOpacity
            onPress={handleUpdate}
            disabled={loading}
            style={[s.btn, { backgroundColor: theme.red, opacity: loading ? 0.7 : 1 }]}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.btnText}>Update password</Text>
            }
          </TouchableOpacity>

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
  logoEmoji:      { fontSize: 54, textAlign: 'center', marginBottom: 6 },
  title:          { fontSize: 42, fontWeight: '900', textAlign: 'center', letterSpacing: -1.5 },
  titleUnderline: { height: 4, width: 80, borderRadius: 2, marginTop: 6, marginBottom: 10 },
  subtitle:       { fontSize: 13, textAlign: 'center', fontStyle: 'italic', fontWeight: '500' },
  errorBox:       { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 16 },
  errorText:      { fontSize: 13, fontWeight: '700' },
  label:          { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 7 },
  input:          {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, paddingHorizontal: 16, paddingVertical: 13,
    fontSize: 15, marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2,
  },
  inputLast:      { marginBottom: 26 },
  btn:            {
    borderRadius: 6, paddingVertical: 15, alignItems: 'center', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  btnText:        { color: '#fff', fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
  confirmBox:     { borderWidth: StyleSheet.hairlineWidth, borderRadius: 6, padding: 20, marginBottom: 26 },
  confirmText:    { fontSize: 14, textAlign: 'center', lineHeight: 22 },
})
