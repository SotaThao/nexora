import React from 'react'
import { logger } from '../../utils/logger'

interface ErrorBoundaryProps {
  children: React.ReactNode
  resetKey?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
  resetKey?: string
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null, resetKey: props.resetKey }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  // Auto-recover on navigation: when the caller passes a changing `resetKey`
  // (e.g. the router pathname), clear any captured error so the new route can
  // render instead of leaving the user stuck on the error screen until a full
  // page reload.
  static getDerivedStateFromProps(props: ErrorBoundaryProps, state: ErrorBoundaryState): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, error: null, errorInfo: null, resetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Persist the component stack so it can be surfaced in development.
    this.setState({ errorInfo })
    logger.error('Uncaught React Error', { error: error.message, stack: error.stack, componentStack: errorInfo?.componentStack })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Only expose raw error details in development; production users get a
      // friendly recovery UI without leaking internal stack traces.
      const isDev = import.meta.env.DEV
      return (
        <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-nexoraBorder shadow-premium p-8 text-center">
            <h1 className="text-xl font-bold text-nexoraText">Something went wrong</h1>
            <p className="mt-2 text-sm text-nexoraSubtle">
              An unexpected error occurred. Please try reloading the page.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 min-h-11 px-6 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all hover:opacity-90"
            >
              Reload
            </button>
            {isDev && (
              <pre className="mt-6 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-red-50 p-3 text-left text-[11px] text-red-700">
                {this.state.error?.message || 'Unknown error'}
                {this.state.errorInfo?.componentStack || ''}
              </pre>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
