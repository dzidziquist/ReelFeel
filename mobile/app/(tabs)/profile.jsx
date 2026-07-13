import { useCallback, useEffect, useState } from 'react'
import {
  View, Text, Image, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, RefreshControl, StyleSheet, Switch, Linking,
} from 'react-native'
import { useRouter, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getProfile, upsertProfile, getInsights, deleteAllMyData, deleteMyAccount } from '../../lib/queries'
import { DEMO_MODE } from '../../constants/demo'
import { DEMO_PROFILE, DEMO_INSIGHTS } from '../../lib/demoData'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { useTabBar } from '../../context/TabBarContext'

function fmtRuntime(mins) {
  if (!mins) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const EMOTION_COLORS = ['#d4af37', '#7c3aed', '#ec4899']

function Avatar({ name, size = 64, theme }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <View style={[
      a.ring,
      { width: size + 10, height: size + 10, borderRadius: (size + 10) / 2, borderColor: theme?.gold ?? '#d4af37' },
    ]}>
      <View style={[a.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: theme?.bg2 ?? '#1a1a1a' }]}>
        <Text style={[a.initials, { fontSize: size * 0.38, color: theme?.gold ?? '#d4af37' }]}>{initials}</Text>
      </View>
    </View>
  )
}

function EditModal({ visible, profile, onSave, onCancel, theme = {} }) {
  const [displayName, setDisplayName] = useState(profile?.display_name || profile?.username || '')
  const [bio,         setBio]         = useState(profile?.bio || '')
  const [saving,      setSaving]      = useState(false)

  useEffect(() => {
    if (visible) {
      setDisplayName(profile?.display_name || profile?.username || '')
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
    header:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 56, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.text ?? '#fff' },
    title:     { color: theme.text ?? '#fff', fontSize: 16, fontWeight: '700' },
    cancel:    { color: theme.textSub ?? '#a3a3a3', fontSize: 15 },
    save:      { color: theme.gold ?? '#d4af37', fontSize: 15, fontWeight: '700' },
    body:      { padding: 20 },
    label:     { color: theme.textSub ?? '#a3a3a3', fontSize: 13, fontWeight: '600', marginBottom: 8 },
    optional:  { color: theme.textMut ?? '#6b6b6b', fontWeight: '400' },
    input:     { backgroundColor: theme.bg1 ?? '#111', borderWidth: StyleSheet.hairlineWidth, borderColor: theme.text ?? '#fff', borderRadius: 6, paddingHorizontal: 16, paddingVertical: 12, color: theme.text ?? '#fff', fontSize: 14, marginBottom: 20 },
    charCount: { color: theme.textMut ?? '#6b6b6b', fontSize: 11, textAlign: 'right', marginTop: -16, marginBottom: 20 },
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onCancel}>
      <View style={mi.container}>
        <View style={mi.header}>
          <TouchableOpacity onPress={onCancel}><Text style={mi.cancel}>Cancel</Text></TouchableOpacity>
          <Text style={mi.title}>Edit Profile</Text>
          <TouchableOpacity onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color={theme.gold ?? '#d4af37'} /> : <Text style={mi.save}>Save</Text>}
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

const BRIGHTNESS_MODES = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light',  label: 'Light',  icon: 'sunny-outline' },
  { key: 'dark',   label: 'Dark',   icon: 'moon-outline' },
]

export default function Profile() {
  const { logout } = useAuth()
  const router     = useRouter()
  const { theme, isDark, mode, setMode, navbarShowLabels, setNavbarShowLabels } = useTheme()
  const { onScroll, reset } = useTabBar()
  const insets = useSafeAreaInsets()

  const [profile,    setProfile]    = useState(null)
  const [insights,   setInsights]   = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [editOpen,   setEditOpen]   = useState(false)
  const [aboutOpen,  setAboutOpen]  = useState(false)
  const [error,      setError]      = useState('')

  const load = useCallback(async () => {
    setError('')
    if (DEMO_MODE) { setProfile(DEMO_PROFILE); setInsights(DEMO_INSIGHTS); return }
    try {
      const [p, ins] = await Promise.all([getProfile(), getInsights()])
      setProfile(p); setInsights(ins)
    } catch (err) { setError(err.message) }
  }, [])

  useFocusEffect(useCallback(() => { reset() }, []))
  useEffect(() => { load().finally(() => setLoading(false)) }, [load])

  async function handleRefresh() { setRefreshing(true); await load(); setRefreshing(false) }
  function handleEditSave(updates) { setProfile(prev => ({ ...prev, ...updates })); setEditOpen(false) }

  function confirmDeleteData() {
    Alert.alert('Delete All My Data?', 'This will permanently delete all your diary entries and watchlist. Your account will remain active.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete Data', style: 'destructive', onPress: async () => {
        try {
          await deleteAllMyData()
          setInsights({ totalMovies: 0, totalTV: 0, totalEntries: 0, avgRating: null, thisMonth: 0 })
          Alert.alert('Done', 'All your data has been deleted.')
        } catch (err) { Alert.alert('Error', err.message) }
      }},
    ])
  }

  function confirmDeleteAccount() {
    Alert.alert('Delete Account?', 'This will permanently delete your account and ALL data. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', style: 'destructive', onPress: () => {
        Alert.alert('Are you absolutely sure?', 'This action is irreversible.', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete Forever', style: 'destructive', onPress: async () => {
            try { await deleteMyAccount() } catch {
              await deleteAllMyData(); await logout()
            }
          }},
        ])
      }},
    ])
  }

  if (loading) {
    return <View style={[s.center, { backgroundColor: theme.bg0 }]}><ActivityIndicator size="large" color={theme.gold} /></View>
  }

  const displayName = profile?.display_name || profile?.username || 'User'
  const username    = profile?.username ? `@${profile.username}` : ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString('default', { month: 'long', year: 'numeric' })
    : ''

  const mediaParts = [
    insights?.totalMovies  ? `${insights.totalMovies} films`  : null,
    insights?.totalTV      ? `${insights.totalTV} shows`      : null,
    fmtRuntime(insights?.totalRuntime),
  ].filter(Boolean)

  const STATS = [
    { value: String(insights?.totalEntries ?? '—'), label: 'WATCHED' },
    { value: insights?.avgRating != null ? `${insights.avgRating.toFixed(1)}★` : '—', label: 'RATING' },
    { value: insights?.streak     ? `${insights.streak} 🔥` : '—', label: 'STREAK' },
    { value: insights?.thisMonth  != null ? String(insights.thisMonth) : '—', label: 'THIS MO' },
  ]

  return (
    <View style={[s.flex, { backgroundColor: theme.bg0 }]}>
      {editOpen && <EditModal visible={true} profile={profile} onSave={handleEditSave} onCancel={() => setEditOpen(false)} theme={theme} />}

      <ScrollView
        style={s.flex}
        contentContainerStyle={s.content}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.gold} colors={[theme.gold]} />}
      >

        {/* ── Hero ── */}
        <View style={[s.hero, { backgroundColor: theme.bg0, paddingTop: insets.top + 16 }]}>
          <View style={s.heroTop}>
            <Avatar name={displayName} size={72} theme={theme} />
            <View style={s.heroNames}>
              <View style={s.heroNameRow}>
                <View style={s.heroNameBlock}>
                  <Text style={[s.heroName, { color: theme.text }]}>{displayName}</Text>
                  {username ? <Text style={[s.heroHandle, { color: theme.gold }]}>{username}</Text> : null}
                </View>
                <TouchableOpacity
                  onPress={() => setEditOpen(true)}
                  style={[s.editIconBtn, { borderColor: theme.border, backgroundColor: theme.bg1 }]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="pencil-outline" size={15} color={theme.textSub} />
                </TouchableOpacity>
              </View>
              {mediaParts.length > 0 && (
                <Text style={[s.heroMedia, { color: theme.textMut }]}>
                  {mediaParts.join('  ·  ')}
                </Text>
              )}
              {memberSince ? <Text style={[s.heroSince, { color: theme.textMut }]}>Member since {memberSince}</Text> : null}
              {profile?.bio ? <Text style={[s.heroBio, { color: theme.textSub }]}>{profile.bio}</Text> : null}
            </View>
          </View>
        </View>

        {error ? <View style={s.errorBox}><Text style={s.errorText}>{error}</Text></View> : null}

        {/* ── Stats Band ── */}
        {insights && (
          <View style={[s.statsBand, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
            {STATS.map((stat, i) => (
              <View
                key={stat.label}
                style={[s.stat, i < STATS.length - 1 && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: theme.border }]}
              >
                <Text style={[s.statValue, { color: theme.text }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: theme.textMut }]}>{stat.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Mood Fingerprint ── */}
        {insights?.topEmotions?.length > 0 && (
          <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
            <Text style={[s.sectionLabel, { color: theme.textMut }]}>WHAT MOVES YOU</Text>
            <Text style={[s.sectionSub, { color: theme.textMut }]}>Your top 3 emotions from diary entries</Text>
            {insights.topEmotions.map((em, i) => {
              const maxCount = insights.topEmotions[0].count
              const pct = Math.max(8, Math.round((em.count / maxCount) * 100))
              return (
                <View key={em.name} style={[s.emotionRow, i > 0 && { marginTop: 16 }]}>
                  <Text style={s.emotionIcon}>{em.icon}</Text>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={s.emotionMeta}>
                      <Text style={[s.emotionName, { color: theme.text }]}>{em.name}</Text>
                      <Text style={[s.emotionCount, { color: theme.textMut }]}>{em.count}×</Text>
                    </View>
                    <View style={[s.barTrack, { backgroundColor: theme.bg2 }]}>
                      <View style={[s.barFill, { width: `${pct}%`, backgroundColor: EMOTION_COLORS[i] }]} />
                    </View>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* ── Collection ── */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>COLLECTION</Text>
          {[
            { icon: 'library-outline', label: 'My Library',  desc: 'Unique titles watched', route: '/(tabs)/library' },
            { icon: 'journal-outline', label: 'Watch Diary', desc: 'All watch sessions',     route: '/(tabs)/diary'   },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.route}
              style={[s.linkRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.border }]}
              onPress={() => router.push(item.route)}
            >
              <View style={[s.linkIconWrap, { backgroundColor: theme.bg2 }]}>
                <Ionicons name={item.icon} size={19} color={theme.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.linkText, { color: theme.text }]}>{item.label}</Text>
                <Text style={[s.linkDesc, { color: theme.textMut }]}>{item.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMut} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Appearance ── */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>APPEARANCE</Text>

          <View style={[s.segmented, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
            {BRIGHTNESS_MODES.map(m => {
              const active = mode === m.key
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setMode(m.key)}
                  style={[s.segment, active
                    ? { backgroundColor: theme.gold, borderColor: theme.gold }
                    : { backgroundColor: isDark ? theme.bg3 : theme.bg1, borderColor: 'transparent' }
                  ]}
                >
                  <Ionicons name={m.icon} size={14} color={active ? (isDark ? '#000' : '#fff') : theme.textSub} />
                  <Text style={[s.segmentText, { color: active ? (isDark ? '#000' : '#fff') : theme.textSub }]}>{m.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View style={[s.switchRow, { borderTopColor: theme.border }]}>
            <Text style={[s.switchLabel, { color: theme.textSub }]}>Show tab labels</Text>
            <Switch
              value={navbarShowLabels}
              onValueChange={setNavbarShowLabels}
              trackColor={{ true: theme.gold, false: theme.bg3 }}
              thumbColor={theme.text}
            />
          </View>
        </View>

        {/* ── Account ── */}
        <View style={[s.section, { backgroundColor: theme.bg1, borderColor: theme.text }]}>
          <Text style={[s.sectionLabel, { color: theme.textMut }]}>ACCOUNT</Text>
          {[
            { icon: 'information-circle-outline', label: 'About ReelFeel', onPress: () => setAboutOpen(true),                            trail: 'chevron-forward' },
            { icon: 'shield-checkmark-outline',   label: 'Privacy Policy', onPress: () => Linking.openURL('https://reelfeel.me/privacy'), trail: 'open-outline' },
            { icon: 'log-out-outline',            label: 'Sign Out',       onPress: logout,                                               trail: 'chevron-forward', muted: true },
          ].map((item, i, arr) => (
            <TouchableOpacity
              key={item.label}
              style={[s.linkRow, i < arr.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth * 2, borderBottomColor: theme.border }]}
              onPress={item.onPress}
            >
              <View style={[s.linkIconWrap, { backgroundColor: theme.bg2 }]}>
                <Ionicons name={item.icon} size={19} color={item.muted ? theme.textMut : theme.gold} />
              </View>
              <Text style={[s.linkText, { color: theme.text, flex: 1 }]}>{item.label}</Text>
              <Ionicons name={item.trail} size={16} color={theme.textMut} />
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Danger Zone ── */}
        <View style={s.dangerSection}>
          <Text style={s.dangerLabel}>DANGER ZONE</Text>
          <TouchableOpacity style={s.dangerRow} onPress={confirmDeleteData}>
            <View style={s.dangerIcon}>
              <Ionicons name="trash-outline" size={19} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerTitle}>Delete All My Data</Text>
              <Text style={s.dangerDesc}>Remove diary entries and watchlist</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#ef4444" />
          </TouchableOpacity>
          <View style={s.dangerDivider} />
          <TouchableOpacity style={s.dangerRow} onPress={confirmDeleteAccount}>
            <View style={s.dangerIcon}>
              <Ionicons name="person-remove-outline" size={19} color="#ff4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.dangerTitle, { color: '#ff4444' }]}>Delete Account</Text>
              <Text style={s.dangerDesc}>Permanently delete account and all data</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#ff4444" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── About modal ── */}
      <Modal visible={aboutOpen} transparent animationType="slide" onRequestClose={() => setAboutOpen(false)}>
        <View style={ab.overlay}>
          <View style={[ab.sheet, { backgroundColor: theme.bg1 }]}>
            <View style={[ab.handle, { backgroundColor: theme.border }]} />
            <Text style={[ab.title, { color: theme.text }]}>About ReelFeel</Text>
            <Text style={[ab.body, { color: theme.textSub }]}>
              ReelFeel is your personal film and TV diary — log watches, rate them, and tag how they made you feel.
            </Text>
            <View style={[ab.tmdbBox, { backgroundColor: theme.bg2, borderColor: theme.border }]}>
              <Image
                source={{ uri: 'https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fb228cf3ded904ef09b136fe3fec72548ebc1fea3fbbd1ad9e36364db38b.svg' }}
                style={ab.tmdbLogo}
                resizeMode="contain"
              />
              <Text style={[ab.tmdbText, { color: theme.textSub }]}>
                This product uses the TMDb API but is not endorsed or certified by TMDb.
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://www.themoviedb.org')}>
                <Text style={[ab.tmdbLink, { color: theme.gold }]}>themoviedb.org</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[ab.closeBtn, { backgroundColor: theme.gold }]} onPress={() => setAboutOpen(false)}>
              <Text style={ab.closeBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  flex:    { flex: 1 },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingBottom: 140 },

  // Hero
  hero:         { paddingBottom: 24, paddingHorizontal: 16 },
  heroTop:      { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  heroNames:    { flex: 1, gap: 3 },
  heroNameRow:  { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroNameBlock:{ flex: 1, gap: 2 },
  heroName:     { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  heroHandle:   { fontSize: 13, fontWeight: '700' },
  heroBio:      { fontSize: 13, lineHeight: 19, marginTop: 2 },
  heroMedia:    { fontSize: 12, letterSpacing: 0.2, marginTop: 2 },
  heroSince:    { fontSize: 11 },
  editIconBtn:  {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth, marginLeft: 8,
  },

  // Stats band
  statsBand: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  stat:      { flex: 1, alignItems: 'center', paddingVertical: 18 },
  statValue: { fontSize: 21, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginTop: 4 },

  // Mood fingerprint
  emotionRow:   { flexDirection: 'row', alignItems: 'center', gap: 14 },
  emotionIcon:  { fontSize: 22, width: 28, textAlign: 'center' },
  emotionMeta:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  emotionName:  { fontSize: 13, fontWeight: '700' },
  emotionCount: { fontSize: 12 },
  barTrack:     { height: 5, borderRadius: 3, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 3 },

  // Shared section
  section:      {
    marginHorizontal: 16, marginBottom: 10, borderRadius: 6, padding: 16, borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  sectionLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 4 },
  sectionSub:   { fontSize: 11, marginBottom: 14 },

  // Segmented theme control
  segmented:    { flexDirection: 'row', borderRadius: 6, borderWidth: StyleSheet.hairlineWidth, padding: 3, gap: 3 },
  segment:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8, borderRadius: 4 },
  segmentText:  { fontSize: 12, fontWeight: '700' },

  // Switch row
  switchRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1 },
  switchLabel:  { fontSize: 13, fontWeight: '600' },

  // Link rows
  linkRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  linkIconWrap: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  linkText:     { fontSize: 14, fontWeight: '700' },
  linkDesc:     { fontSize: 11, marginTop: 1 },

  // Danger
  dangerSection: {
    marginHorizontal: 16, marginBottom: 16, backgroundColor: '#1a0000',
    borderRadius: 6, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: '#5c1414',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  dangerLabel:   { color: '#ef4444', fontSize: 10, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  dangerRow:     { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  dangerIcon:    { width: 34, height: 34, borderRadius: 8, backgroundColor: 'rgba(220,38,38,0.15)', alignItems: 'center', justifyContent: 'center' },
  dangerTitle:   { color: '#a3a3a3', fontSize: 14, fontWeight: '600' },
  dangerDesc:    { color: '#6b6b6b', fontSize: 11, marginTop: 2 },
  dangerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: '#3f0000', marginVertical: 4 },

  errorBox:  { marginHorizontal: 16, backgroundColor: '#3f0000', borderWidth: StyleSheet.hairlineWidth, borderColor: '#dc2626', borderRadius: 6, padding: 14, marginBottom: 14 },
  errorText: { color: '#fca5a5', fontSize: 13 },
})

const a = StyleSheet.create({
  ring:     { borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  circle:   { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '900' },
})

const ab = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:        { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:       { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  title:        { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  body:         { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  tmdbBox:      { borderRadius: 12, borderWidth: 1, padding: 16, alignItems: 'center', gap: 10, marginBottom: 24 },
  tmdbLogo:     { width: 80, height: 80 },
  tmdbText:     { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  tmdbLink:     { fontSize: 13, fontWeight: '600' },
  closeBtn:     { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  closeBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
})
