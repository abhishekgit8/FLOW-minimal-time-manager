'use client'

import { Component, ReactNode } from 'react'

interface Props { children: ReactNode; fallback?: ReactNode }
interface State { hasError: boolean }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text)', marginBottom: 8 }}>Something went wrong</p>
          <button onClick={() => this.setState({ hasError: false })} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 12, background: 'var(--accent)', color: 'var(--bg)', border: 'none', cursor: 'pointer' }}>Try again</button>
        </div>
      )
    }
    return this.props.children
  }
}
