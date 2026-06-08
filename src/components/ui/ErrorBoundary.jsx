import React from 'react'
import { logger } from '../../utils/logger'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Catch errors in any components below and re-render with error message
    logger.error('Uncaught React Error', { error: error.message, stack: error.stack, componentStack: errorInfo.componentStack })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white' }}>
          <h1>ERROR</h1>
          <pre>{this.state.error?.message || 'Unknown error'}</pre>
          <pre>{this.state.errorInfo?.componentStack || ''}</pre>
        </div>
      )
    }
    return this.props.children
  }
}
