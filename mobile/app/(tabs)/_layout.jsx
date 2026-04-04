import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useAuth } from '../../context/AuthContext'

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  )
}

export default function TabLayout() {
  const { logout } = useAuth()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#111827', borderTopColor: '#1f2937' },
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
        headerStyle: { backgroundColor: '#111827' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff', fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Diary',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📚" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
    </Tabs>
  )
}
