import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { track } from '../../shared/analytics'
import { Button, StatusNotice } from '../../shared/ui'

type AppErrorBoundaryProps = { children: ReactNode; title: string; description: string; actionLabel: string }
type AppErrorBoundaryState = { error: Error | null }

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    track('error', { boundary: 'app', componentStackPresent: Boolean(errorInfo.componentStack), message: error.message.slice(0, 120) })
  }

  reset = () => {
    this.setState({ error: null })
    window.history.replaceState(null, '', '/guide')
    window.dispatchEvent(new PopStateEvent('popstate'))
  }

  render() {
    if (this.state.error) {
      return (
        <main className="product-page">
          <StatusNotice state="ERROR" title={this.props.title}>
            {this.props.description}
          </StatusNotice>
          <Button onClick={this.reset}>{this.props.actionLabel}</Button>
        </main>
      )
    }
    return this.props.children
  }
}
