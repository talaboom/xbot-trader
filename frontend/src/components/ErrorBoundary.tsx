import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <div className="max-w-lg w-full bg-[#0d0d20] border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-400 mb-4">
            This page hit an error. You can try again, or navigate to another section from the sidebar.
          </p>
          <pre className="text-xs text-red-300 bg-black/30 rounded-lg p-3 mb-5 text-left overflow-auto max-h-40">
            {error.message}
          </pre>
          <div className="flex gap-3 justify-center">
            <button
              onClick={this.reset}
              className="bg-blue-500/20 border border-blue-500/40 text-blue-300 px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-500/30 transition"
            >
              Try again
            </button>
            <a
              href="/dashboard"
              className="bg-white/5 border border-white/10 text-gray-300 px-5 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    )
  }
}
