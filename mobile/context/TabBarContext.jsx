import { createContext, useContext, useRef, useState } from 'react'
import { Animated } from 'react-native'

const TabBarCtx = createContext(null)

export function TabBarProvider({ children }) {
  const collapsedAnim  = useRef(new Animated.Value(0)).current
  const lastY          = useRef(0)
  const isCollapsed    = useRef(false)
  const [collapsed, setCollapsed] = useState(false)

  function collapse() {
    isCollapsed.current = true
    setCollapsed(true)
    Animated.spring(collapsedAnim, {
      toValue: 1, useNativeDriver: false,
      tension: 280, friction: 28,
    }).start()
  }

  function expand() {
    isCollapsed.current = false
    setCollapsed(false)
    Animated.spring(collapsedAnim, {
      toValue: 0, useNativeDriver: false,
      tension: 220, friction: 24,
    }).start()
  }

  function reset() {
    lastY.current = 0
    expand()
  }

  function onScroll(e) {
    const y    = e.nativeEvent.contentOffset.y
    const diff = y - lastY.current
    lastY.current = y

    if (diff > 5 && y > 40 && !isCollapsed.current) collapse()
    else if (diff < -5 && isCollapsed.current) expand()
  }

  return (
    <TabBarCtx.Provider value={{ collapsedAnim, collapsed, onScroll, expand, reset }}>
      {children}
    </TabBarCtx.Provider>
  )
}

export function useTabBar() {
  return useContext(TabBarCtx)
}
