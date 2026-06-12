import React, { useEffect } from 'react'
import AppRouter from './app/AppRouter'
import { initStorage } from './utils/storage'
import { KybGateProvider } from './contexts/KybGateContext'

export default function App() {
  useEffect(() => {
    initStorage()
  }, [])

  return (
    <KybGateProvider>
      <div className="min-h-dvh bg-nexoraCanvas text-inkBlue font-sans antialiased">
        <AppRouter />
      </div>
    </KybGateProvider>
  )
}
