import { Component } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <View style={s.container}>
        <Text style={s.emoji}>💥</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.message}>{this.state.error?.message ?? 'An unexpected error occurred.'}</Text>
        <TouchableOpacity
          style={s.btn}
          onPress={() => this.setState({ hasError: false, error: null })}
        >
          <Text style={s.btnText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji:     { fontSize: 48, marginBottom: 16 },
  title:     { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  message:   { color: '#a3a3a3', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 28 },
  btn:       { backgroundColor: '#dc2626', borderRadius: 6, paddingHorizontal: 28, paddingVertical: 13 },
  btnText:   { color: '#fff', fontWeight: '800', fontSize: 15 },
})
