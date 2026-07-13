import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../../context/ThemeContext'
import FloatingTabBar from '../../components/FloatingTabBar'
import { TabBarProvider } from '../../context/TabBarContext'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <TabBarProvider>
    <Tabs
      tabBar={props => <FloatingTabBar {...props} />}

      screenOptions={{
        headerStyle: { backgroundColor: theme.bg1 },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size }) => <Ionicons name="telescope-outline" size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'My Diary',
          tabBarIcon: ({ color, size }) => <Ionicons name="heart-outline" size={size} color={color} />,
          headerShown: false,
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
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-circle-outline" size={size} color={color} />,
          headerShown: false,
        }}
      />
      {/* Hidden from tab bar but still routable */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
    </TabBarProvider>
  )
}
