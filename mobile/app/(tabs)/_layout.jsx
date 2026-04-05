import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { C } from '../../constants/theme'

function TabIcon({ emoji, focused }) {
  return <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.4 }}>{emoji}</Text>
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: C.bg0, borderTopColor: C.border },
        tabBarActiveTintColor: C.gold,
        tabBarInactiveTintColor: C.textMut,
        headerStyle: { backgroundColor: C.bg1 },
        headerTintColor: C.text,
        headerTitleStyle: { color: C.text, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: 'Diary',
          tabBarIcon: ({ focused }) => <TabIcon emoji="📔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{
          title: 'Watchlist',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔖" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
          headerShown: false,
        }}
      />
      {/* Hidden from tab bar but still routable */}
      <Tabs.Screen
        name="library"
        options={{
          title: 'Library',
          href: null,   // hides from tab bar
        }}
      />
    </Tabs>
  )
}
