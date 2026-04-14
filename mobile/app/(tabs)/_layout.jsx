import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: theme.bg0, borderTopColor: theme.border },
        tabBarActiveTintColor: theme.gold,
        tabBarInactiveTintColor: theme.textMut,
        headerStyle: { backgroundColor: theme.bg1 },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ color, size }) => <Ionicons name="journal-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ color, size }) => <Ionicons name="bookmark-outline" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
          headerShown: false,
        }}
      />
      {/* Hidden from tab bar but still routable */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          href: null,
        }}
      />
    </Tabs>
  )
}
