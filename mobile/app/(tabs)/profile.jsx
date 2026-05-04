import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, RefreshControl, StyleSheet,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getProfile, upsertProfile, getInsights, deleteAllMyData, deleteMyAccount } from '../../lib/queries'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

function Avatar({ name, size = 64, theme }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View style={[
      a.avatarRing,
      { width: size + 8, height: size + 8, borderRadius: (size + 8) / 2, borderColor: theme?.gold ?? '#d4af37' },
    ]}>
      <View style={[a.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme?.bg2 ?? '#1a1a1a' }]}>
        <Text style={[a.initials, { fontSize: size * 0.38, color: theme?.gold ?? '#d4af37' }]}>{initials}</Text>
      </View>
    </View>
  )
}

function StatBox({ value, label, theme }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statVal, { color: theme?.gold ?? '#d4af37' }]}>{value ?? '—'}</Text>
      <Text style={[s.statLbl, { color: theme?.textMut ?? '#6b6b6b' }]}>{label}</Text>
    </View>
  )
}

function EditModal({ visible, profile, onSave, onCancel, theme = {} }) {
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

  const mi = {
    container: { flex: 1, backgroundColor: theme.bg0 ?? '#000' },
    header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: theme.border ?? '#2a2a2a' },
    title:     { color: theme.text ?? '#fff', fontSize: 16, fontWeight: '700' },
    cancel:    { color: theme.textSub ?? '#a3a3a3', fontSize: 15 },
    save:      { color: theme.gold ?? '#d4af37', fontSize: 15, fontWeight: '700' },
    body:      { padding: 20 },
    label:     { color: theme.textSub ?? '#a3a3a3', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    optional:  { color: theme.textMut ?? '#6b6b6b', fontWeight: '400' },
    input:     { backgroundColor: theme.bg1 ?? '#111', borderWidth: 1, borderColor: theme.border ?? '#2a2a2a', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: theme.text ?? '#fff', fontSize: 14, marginBottom: 20 },
    charCount: { color: theme.textMut ?? '#6b6b6b', fontSize: 11, textAlign: 'right', marginTop: -16, marginBottom: 20 },
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={mi.container}>
        <View style={mi.header}>
          <TouchableOpacity onPress={onCancel}><Text style={mi.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={mi.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator color={theme.gold ?? '#d4af37'} />
              : <Text style={mi.save}>Save</Text>
            }
          </TouchableOpacity>
        </View>
        <ScrollView style={mi.body} keyboardShouldPersistTaps="handled">
          <Text style={mi.label}>Display Name</Text>
          <TextInput
            style={mi.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Your name"
            placeholderTextColor={theme.textMut ?? '#6b6b6b'}
            maxLength={40}
          />
          <Text style={mi.label}>Bio <Text style={mi.optional}>(optional)</Text></Text>
          <TextInput
            style={[mi.input, { minHeight: 100 }]}
            value={bio}
            onChangeText={setBio}
            placeholder="A short bio about yourself…"
            placeholderTextColor={theme.textMut ?? '#6b6b6b'}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={mi.charCount}>{bio.length}/200</Text>
        </ScrollView>
      </View>
    </Modal>
  )
}

const THEME_MODES = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
]

export default function Profile() {
  const { logout } = useAuth()
  const router     = useRouter()
  const { theme, mode, setMode } = useTheme()

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
    return <View style={[s.center, { backgroundColor: theme.bg0 }]}><ActivityIndicator size="large" color={theme.gold} /></View>
  }

  const displayName = profile?.display_name || profile?.username || 'User'
  const username    = profile?.username ? `@${profile.username}` : ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('default', { month: 'long', year: 'numeric' })
    : ''

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      <EditModal
        visible={editOpen}
        profile={profile}
        onSave={handleEditSave}
        onCancel={() => setEditOpen(false)}
        theme={theme}
      />

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
      >
        {/* Profile Header */}
        <View style={s.hero}>
          <Avatar name={displayName} size={72} theme={theme} />
          <View style={s.heroInfo}>
            <Text style={[s.displayName, { color: theme.text }]}>{displayName}</Text>
            {username ? <Text style={[s.username, { color: theme.textMut }]}>{username}</Text> : null}
            {profile?.bio ? <Text style={[s.bio, { color: theme.textSub }]}>{profile.bio}</Text> : null}
            {memberSince ? <Text style={[s.memberSince, { color: theme.textMut }]}>Member since {memberSince}</Text> : null}
          </View>
          <TouchableOpacity onPress={() => setEditOpen(true)} style={[s.editBtn, { borderColor: theme.border }]}>
            <Text style={[s.editBtnText, { color: theme.textSub }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {/* Stats */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>WATCH STATS</Text>
          <View style={s.statsGrid}>
            <StatBox value={insights?.totalMovies}  label="Films"    theme={theme} />
            <StatBox value={insights?.totalTV}      label="TV Shows"  theme={theme} />
            <StatBox value={insights?.totalEntries} label="Entries"   theme={theme} />
            <StatBox value={insights?.avgRating ? insights.avgRating.toFixed(1) : null} label="Avg Rating" theme={theme} />
          </View>
          {insights?.totalRuntime > 0 && (
            <View style={[s.runtimeRow, { borderTopColor: theme.border }]}>
              <Text style={[s.runtimeText, { color: theme.textSub }]}>
                ⏱ {Math.floor(insights.totalRuntime / 60)}h {insights.totalRuntime % 60}m watched all-time
              </Text>
            </View>
          )}
        </View>

        {/* Appearance */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>APPEARANCE</Text>
          <View style={s.themeRow}>
            {THEME_MODES.map(m => {
              const active = mode === m.key
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[s.themeBtn, { borderColor: active ? theme.gold : theme.border, backgroundColor: active ? theme.gold + '20' : theme.bg2 }]}
                >
                  <Ionicons name={m.icon} size={18} color={active ? theme.gold : theme.textMut} />
                  <Text style={[s.themeBtnText, { color: active ? theme.gold : theme.textMut }]}>{m.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Navigation */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>COLLECTION</Text>
          {[
            { icon: 'library-outline',  label: 'My Library',  desc: 'Unique titles watched', route: '/(tabs)/library' },
            { icon: 'journal-outline',  label: 'Watch Diary', desc: 'All watch sessions',     route: '/(tabs)/diary'   },
          ].map(item => (
            <TouchableOpacity key={item.route} style={[s.linkRow, { borderBottomColor: theme.border }]} onPress={() => router.push(item.route)}>
              <View style={[s.iconWrap, { backgroundColor: theme.bg2 }]}>
                <Ionicons name={item.icon} size={20} color={theme.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.linkText, { color: theme.text }]}>{item.label}</Text>
                <Text style={[s.linkDesc, { color: theme.textMut }]}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMut} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Account */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.border }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>ACCOUNT</Text>
          <TouchableOpacity style={s.linkRow} onPress={logout}>
            <View style={[s.iconWrap, { backgroundColor: theme.bg2 }]}>
              <Ionicons name="log-out-outline" size={20} color={theme.textSub} />
            </View>
            <Text style={[s.linkText, { color: theme.text, flex: 1 }]}>Sign Out</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textMut} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={s.dangerSection}>
          <Text style={s.dangerLabel}>DANGER ZONE</Text>
          <TouchableOpacity style={s.dangerRow} onPress={confirmDeleteData}>
            <View style={[s.iconWrap, { backgroundColor: 'rgba(220,38,38,0.15)' }]}>
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerTitle}>Delete All My Data</Text>
              <Text style={s.dangerDesc}>Remove diary entries and watchlist</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ef4444" />
          </TouchableOpacity>
          <View style={s.dangerDivider} />
          <TouchableOpacity style={s.dangerRow} onPress={confirmDeleteAccount}>
            <View style={[s.iconWrap, { backgroundColor: 'rgba(220,38,38,0.15)' }]}>
              <Ionicons name="person-remove-outline" size={20} color="#ff4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.dangerTitle, { color: '#ff4444' }]}>Delete Account</Text>
              <Text style={s.dangerDesc}>Permanently delete account and all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  flex:        { flex: 1 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:     { padding: 16, paddingBottom: 60 },

  // Hero
  hero:        { flexDirection: 'row', gap: 12, alignItems: 'flex-start', marginTop: 48, marginBottom: 20 },
  heroInfo:    { flex: 1 },
  displayName: { fontSize: 20, fontWeight: '800' },
  username:    { fontSize: 13, marginTop: 2 },
  bio:         { fontSize: 13, marginTop: 6, lineHeight: 18 },
  memberSince: { fontSize: 11, marginTop: 6 },
  editBtn:     { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6 },
  editBtnText: { fontSize: 13 },

  // Shared section card
  section:     { borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1 },
  sectionLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },

  // Stats
  statsGrid:   { flexDirection: 'row', flexWrap: 'wrap' },
  statBox:     { width: '50%', paddingVertical: 10, alignItems: 'center' },
  statVal:     { fontSize: 26, fontWeight: '700' },
  statLbl:     { fontSize: 11, marginTop: 2 },
  runtimeRow:  { marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  runtimeText: { fontSize: 12, textAlign: 'center' },

  // Appearance
  themeRow:    { flexDirection: 'row', gap: 8 },
  themeBtn:    { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: 'center', gap: 4 },
  themeBtnText:{ fontSize: 11, fontWeight: '600' },

  // Links
  linkRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  iconWrap:    { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  linkText:    { fontSize: 15, fontWeight: '500' },
  linkDesc:    { fontSize: 11, marginTop: 1 },

  // Danger
  dangerSection: { backgroundColor: '#1a0000', borderRadius: 14, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#5c1414' },
  dangerLabel:   { color: '#ef4444', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  dangerRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  dangerTitle:   { color: '#a3a3a3', fontSize: 14, fontWeight: '600' },
  dangerDesc:    { color: '#6b6b6b', fontSize: 11, marginTop: 2 },
  dangerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#3f0000', marginVertical: 4 },

  errorBox:  { backgroundColor: '#3f0000', borderWidth: 1, borderColor: '#dc2626', borderRadius: 12, padding: 14, marginBottom: 16 },
  errorText: { color: '#fca5a5', fontSize: 13 },
})

// Avatar sub-styles (static — colors applied inline in Avatar component)
const a = StyleSheet.create({
  avatarRing: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  avatar:     { alignItems: 'center', justifyContent: 'center' },
  initials:   { fontWeight: '800' },
})
