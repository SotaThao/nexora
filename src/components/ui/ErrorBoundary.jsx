import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="nexora-card max-w-md w-full text-center p-8 space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-800">
              Đã xảy ra lỗi / Something went wrong
            </h2>
            <p className="text-gray-500 text-sm">
              Ứng dụng gặp sự cố không mong muốn. Vui lòng thử lại.
              <br />
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="nexora-btn-primary mt-2"
            >
              Tải lại / Reload
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
