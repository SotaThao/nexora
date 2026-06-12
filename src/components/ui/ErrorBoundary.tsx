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

  static getDerivedStateFromProps(
    props: ErrorBoundaryProps,
    state: ErrorBoundaryState,
  ): Partial<ErrorBoundaryState> | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, error: null, errorInfo: null, resetKey: props.resetKey }
    }
    return null
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo })
    logger.error('Uncaught React Error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
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
              Reload Page
            </button>
            {isDev && (
              <pre className="mt-6 text-left text-xs text-red-600 overflow-auto max-h-48 p-3 bg-red-50 rounded-lg">
                {this.state.error?.toString()}
                {'\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
