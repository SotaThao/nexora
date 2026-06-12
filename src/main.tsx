import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import { AuthProvider } from './auth/AuthProvider'

// Devtools are loaded lazily so they are excluded from the production bundle
let ReactQueryDevtools = null
if (import.meta.env.DEV) {
  // Dynamic import so the devtools module is tree-shaken in production
  const devtoolsModule = await import('@tanstack/react-query-devtools')
  ReactQueryDevtools = devtoolsModule.ReactQueryDevtools
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
            <NotificationProvider>
              <BrowserRouter>
                <App />
                {ReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
              </BrowserRouter>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
