import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppRouter from './app/AppRouter'
import { initStorage } from './utils/storage'
import { KybGateProvider } from './contexts/KybGateContext'
import { useAuth } from './auth/useAuth'

export default function App() {
  const location = useLocation()
  const isPublicHome = location.pathname === '/'
  const isCommunity = location.pathname === '/community' || location.pathname.startsWith('/community/')

  useEffect(() => {
    initStorage()
  }, [])

  return (
    <KybGateProvider>
      <div
        className={
          isPublicHome
            ? 'min-h-dvh w-full min-w-0 overflow-x-hidden'
            : `min-h-dvh w-full min-w-0 ${isCommunity ? 'overflow-x-clip' : 'overflow-x-hidden'} bg-nexoraCanvas text-inkBlue font-sans antialiased`
        }
      >
        <AppRouter />
      </div>
    </KybGateProvider>
  )
}
