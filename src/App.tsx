import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppRouter from './app/AppRouter'
import { initStorage } from './utils/storage'
import { KybGateProvider } from './contexts/KybGateContext'
import { useAuth } from './auth/useAuth'

export default function App() {
  const location = useLocation()
  const isPublicHome = location.pathname === '/'

  useEffect(() => {
    initStorage()
  }, [])

  return (
    <KybGateProvider>
      <div
        className={
          isPublicHome
            ? 'min-h-dvh'
            : 'min-h-dvh bg-nexoraCanvas text-inkBlue font-sans antialiased'
        }
      >
        <AppRouter />
      </div>
    </KybGateProvider>
  )
}
