import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import ErrorBoundary from './components/ui/ErrorBoundary.jsx'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient.js'

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
        <LanguageProvider>
          <NotificationProvider>
            <App />
            {ReactQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
          </NotificationProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
