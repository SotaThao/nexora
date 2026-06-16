import React, { useEffect } from 'react'
import { Capacitor } from '@capacitor/core'
import { Keyboard } from '@capacitor/keyboard'
import AppRouter from './app/AppRouter'
import { initStorage } from './utils/storage'
import { KybGateProvider } from './contexts/KybGateContext'
import { logger } from './utils/logger'

export default function App() {
  useEffect(() => {
    initStorage()

    // iOS keyboard assistant bar can emit AutoLayout conflicts in WKWebView.
    // Disabling it avoids noisy "Unable to simultaneously satisfy constraints" logs.
    if (Capacitor.getPlatform() === 'ios') {
      Keyboard.setAccessoryBarVisible({ isVisible: false }).catch((error) => {
        logger.warn('Failed to hide iOS keyboard accessory bar', error)
      })
    }
  }, [])

  return (
    <KybGateProvider>
      <div className="min-h-dvh bg-nexoraCanvas text-inkBlue font-sans antialiased">
        <AppRouter />
      </div>
    </KybGateProvider>
  )
}
