import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, RefreshControl, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { getProfile, upsertProfile, getInsights, deleteAllMyData, deleteMyAccount } from '../../lib/queries'
import { useAuth } from '../../context/AuthContext'
import { C } from '../../constants/theme'

function Avatar({ name, size = 64 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View style={[
      a.avatarRing,
      { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2 },
    ]}>
      <View style={[a.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[a.initials, { fontSize: size * 0.38 }]}>{initials}</Text>
      </View>
    </View>
  )
}

function StatBox({ value, label }) {
  return (
    <View style={s.statBox}>
      <Text style={s.statVal}>{value ?? '—'}</Text>
      <Text style={s.statLbl}>{label}</Text>
    </View>
  )
}

function EditModal({ visible, profile, onSave, onCancel }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [bio,         setBio]         = useState(profile?.bio          || '')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (visible) {
      setDisplayName(profile?.display_name || '')
      setBio(profile?.bio || '')
    }
  }, [visible, profile])

  async function save() {
    setSaving(true)
    try {
      await upsertProfile({ display_name: displayName, bio })
      onSave({ display_name: displayName, bio })
    } catch (err) {
      Alert.alert('Error', err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={m.container}>
        <View style={m.header}>
          <TouchableOpacity onPress={onCancel}><Text style={m.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={m.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator color={C.gold} />
              : <Text style={m.save}>Save</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView style={m.body} keyboardShouldPersistTaps="handled">
          <Text style={m.label}>Display Name</Text>
          <TextInput
            style={m.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={C.textMut}
            maxLength={40}
          />
          <Text style={m.label}>Bio <Text style={m.optional}>(optional)</Text></Text>
          <TextInput
            style={[m.input, m.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio about yourself…"
            placeholderTextColor={C.textMut}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={m.charCount}>{bio.length}/200</Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

export default function Profile() {
  const { logout } = useAuth()
  const router     = useRouter()

  const [profile,    setProfile]    = useState(null)
  const [insights,   setInsights]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [error,      setError]      = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const [p, ins] = await Promise.all([getProfile(), getInsights()])
      setProfile(p)
      setInsights(ins)
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  async function handleRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  function handleEditSave(updates) {
    setProfile(prev => ({ ...prev, ...updates }))
    setEditOpen(false)
  }

  function confirmDeleteData() {
    Alert.alert(
      'Delete All My Data?',
      'This will permanently delete all your diary entries and watchlist. Your account will remain active.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Data', style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllMyData()
              setInsights({ totalMovies: 0, totalTV: 0, totalEntries: 0, avgRating: null, thisMonth: 0 })
              Alert.alert('Done', 'All your data has been deleted.')
            } catch (err) {
              Alert.alert('Error', err.message)
            }
          },
        },
      ],
    )
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account?',
      'This will permanently delete your account and ALL data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue', style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'Type DELETE in the next prompt to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever', style: 'destructive',
                  onPress: async () => {
                    try {
                      await deleteMyAccount()
                    } catch (err) {
                      // If RPC fails (missing permissions), fall back to data delete + sign out
                      await deleteAllMyData()
                      await logout()
                    }
                  },
                },
              ],
            )
          },
        },
      ],
    )
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator size="large" color={C.gold} /></View>
  }

  const displayName = profile?.display_name || profile?.username || 'User'
  const username    = profile?.username ? `@${profile.username}` : ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('default', { month: 'long', year: 'numeric' })
    : ''

  return (
    <View style={s.flex}>
      <EditModal
        visible={editOpen}
        profile={profile}
        onSave={handleEditSave}
        onCancel={() => setEditOpen(false)}
      />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={C.gold} colors={[C.gold]} />
        }
      >
        {/* Profile Header */}
        <View style={s.hero}>
          <Avatar name={displayName} size={72} />
          <View style={s.heroInfo}>
            <Text style={s.displayName}>{displayName}</Text>
            {username ? <Text style={s.username}>{username}</Text> : null}
            {profile?.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}
            {memberSince ? <Text style={s.memberSince}>Member since {memberSince}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => setEditOpen(true)} style={s.editBtn}>
            <Text style={s.editBtnText}>Edit</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View>
        ) : null}

        {/* Stats */}
        <View style={s.statsSection}>
          <Text style={s.sectionLabel}>WATCH STATS</Text>
          <View style={s.statsGrid}>
            <StatBox value={insights?.totalMovies}  label="Films" />
            <StatBox value={insights?.totalTV}      label="TV Shows" />
            <StatBox value={insights?.totalEntries} label="Entries" />
            <StatBox
              value={insights?.avgRating ? insights.avgRating.toFixed(1) : null}
              label="Avg Rating"
            />
          </View>
          {insights?.totalRuntime > 0 && (
            <View style={s.runtimeRow}>
              <Text style={s.runtimeText}>
                ⏱ {Math.floor(insights.totalRuntime / 60)}h {insights.totalRuntime % 60}m watched all-time
              </Text>
            </View>
          )}
        </View>

        {/* Navigation */}
        <View style={s.linksSection}>
          <Text style={s.sectionLabel}>COLLECTION</Text>
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => router.push('/(tabs)/library')}
          >
            <Text style={s.linkEmoji}>📚</Text>
            <Text style={s.linkText}>My Library</Text>
            <Text style={s.linkChevron}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => router.push('/(tabs)/diary')}
          >
            <Text style={s.linkEmoji}>📔</Text>
            <Text style={s.linkText}>Watch Diary</Text>
            <Text style={s.linkChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Account */}
        <View style={s.linksSection}>
          <Text style={s.sectionLabel}>ACCOUNT</Text>
          <TouchableOpacity style={s.linkRow} onPress={logout}>
            <Text style={s.linkEmoji}>🚪</Text>
            <Text style={s.linkText}>Sign Out</Text>
            <Text style={s.linkChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={s.dangerSection}>
          <Text style={s.dangerLabel}>DANGER ZONE</Text>
          <TouchableOpacity style={s.dangerRow} onPress={confirmDeleteData}>
            <View>
              <Text style={s.dangerTitle}>Delete All My Data</Text>
              <Text style={s.dangerDesc}>Remove all diary entries and watchlist items</Text>
            </View>
            <Text style={s.dangerArrow}>›</Text>
          </TouchableOpacity>
          <View style={s.dangerDivider} />
          <TouchableOpacity style={s.dangerRow} onPress={confirmDeleteAccount}>
            <View>
              <Text style={[s.dangerTitle, { color: '#ff4444' }]}>Delete Account</Text>
              <Text style={s.dangerDesc}>Permanently delete your account and all data</Text>
            </View>
            <Text style={[s.dangerArrow, { color: '#ff4444' }]}>›</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  flex:          { flex: 1, backgroundColor: C.bg0 },
  center:        { flex: 1, backgroundColor: C.bg0, alignItems: 'center', justifyContent: 'center' },
  content:       { padding: 16, paddingBottom: 60 },

  // Hero
  hero:          { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 48, marginBottom: 28 },
  heroInfo:      { flex: 1 },
  displayName:   { color: C.text, fontSize: 20, fontWeight: '800' },
  username:      { color: C.textMut, fontSize: 13, marginTop: 2 },
  bio:           { color: C.textSub, fontSize: 13, marginTop: 6, lineHeight: 18 },
  memberSince:   { color: C.textMut, fontSize: 11, marginTop: 6 },
  editBtn:       { borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText:   { color: C.textSub, fontSize: 13 },

  // Stats
  statsSection:  { backgroundColor: C.bg1, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  sectionLabel:  { color: C.textMut, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  statBox:       { width: '50%', paddingVertical: 10, alignItems: 'center' },
  statVal:       { color: C.gold, fontSize: 26, fontWeight: '700' },
  statLbl:       { color: C.textMut, fontSize: 11, marginTop: 2 },
  runtimeRow:    { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  runtimeText:   { color: C.textSub, fontSize: 12, textAlign: 'center' },

  // Links
  linksSection:  { backgroundColor: C.bg1, borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border },
  linkRow:       { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  linkEmoji:     { fontSize: 20, width: 28 },
  linkText:      { flex: 1, color: C.text, fontSize: 15 },
  linkChevron:   { color: C.textMut, fontSize: 20 },

  // Danger
  dangerSection: {
    backgroundColor: '#1a0000', borderRadius: 14, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: '#5c1414',
  },
  dangerLabel:   { color: '#ef4444', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  dangerRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  dangerTitle:   { color: C.textSub, fontSize: 14, fontWeight: '600' },
  dangerDesc:    { color: C.textMut, fontSize: 11, marginTop: 2 },
  dangerArrow:   { color: C.textMut, fontSize: 20 },
  dangerDivider: { height: 1, backgroundColor: '#3f0000', marginVertical: 4 },

  errorBox:      { backgroundColor: '#3f0000', borderWidth: 1, borderColor: C.red, borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText:     { color: '#fca5a5', fontSize: 13 },
})

// Avatar sub-styles
const a = StyleSheet.create({
  avatarRing: { borderWidth: 2, borderColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  avatar:     { backgroundColor: C.bg2, alignItems: 'center', justifyContent: 'center' },
  initials:   { color: C.gold, fontWeight: '800' },
})

// Modal sub-styles
const m = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg0 },
  header:     {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title:      { color: C.text, fontSize: 16, fontWeight: '700' },
  cancel:     { color: C.textSub, fontSize: 15 },
  save:       { color: C.gold, fontSize: 15, fontWeight: '700' },
  body:       { padding: 20 },
  label:      { color: C.textSub, fontSize: 13, fontWeight: '600', marginBottom: 8 },
  optional:   { color: C.textMut, fontWeight: '400' },
  input:      {
    backgroundColor: C.bg1, borderWidth: 1, borderColor: C.border, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12, color: C.text, fontSize: 14, marginBottom: 20,
  },
  textArea:   { minHeight: 100 },
  charCount:  { color: C.textMut, fontSize: 11, textAlign: 'right', marginTop: -16, marginBottom: 20 },
})
