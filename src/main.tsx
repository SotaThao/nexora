import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { LanguageProvider } from './contexts/LanguageContext'
import { NotificationProvider } from './contexts/NotificationContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import SkeletonProvider from './components/ui/skeleton/SkeletonProvider'
import { QueryClientProvider } from '@tanstack/react-query'
import queryClient from './lib/queryClient'
import { AuthProvider } from './auth/AuthProvider'

const ReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((mod) => ({
        default: mod.ReactQueryDevtools,
      })),
    )
  : null

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <LanguageProvider>
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
                {ReactQueryDevtools ? (
                  <Suspense fallback={null}>
                    <ReactQueryDevtools initialIsOpen={false} />
                  </Suspense>
                ) : null}
              </BrowserRouter>
            </NotificationProvider>
          </LanguageProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)
