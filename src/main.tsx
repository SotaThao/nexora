import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { initNativeShell } from './native/initNativeShell'

initNativeShell()
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import SkeletonProvider from './components/ui/skeleton/SkeletonProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import { AuthProvider } from './auth/AuthProvider'
import OneSignalAuthBridge from './native/OneSignalAuthBridge'
import CapgoUpdateBridge from './native/CapgoUpdateBridge'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <OneSignalAuthBridge />
          <LanguageProvider>
            <CapgoUpdateBridge />
            <NotificationProvider>
              <BrowserRouter
                future={{
                  v7_startTransition: true,
                  v7_relativeSplatPath: true,
                }}
              >
                <SkeletonProvider>
                  <App />
                </SkeletonProvider>
              </BrowserRouter>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
