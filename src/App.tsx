import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import AppRouter from './app/AppRouter'
import CallOverlayHost from './calls/components/CallOverlayHost'
import { VoiceCallPlanRoute } from './data/voiceTrial/domain'
import { initStorage } from './utils/storage'
import { KybGateProvider } from './contexts/KybGateContext'

const APP_SHELL_CLASS_HOME =
  'min-h-dvh w-full min-w-0 overflow-x-hidden'
const APP_SHELL_CLASS_VOICE_CALL_PLAN =
  'min-h-dvh w-full min-w-0 overflow-x-hidden bg-white'
const APP_SHELL_CLASS_DEFAULT =
  'min-h-dvh w-full min-w-0 overflow-x-hidden bg-nexoraCanvas text-inkBlue font-sans antialiased'

const APP_SHELL_CLASS_BY_PATH: Record<string, string> = {
  '/': APP_SHELL_CLASS_HOME,
  [VoiceCallPlanRoute.path]: APP_SHELL_CLASS_VOICE_CALL_PLAN,
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    initStorage()
  }, [])

  const shellClassName =
    APP_SHELL_CLASS_BY_PATH[location.pathname] ?? APP_SHELL_CLASS_DEFAULT

  return (
    <KybGateProvider>
      <div className={shellClassName}>
        <AppRouter />
      </div>
      {location.pathname !== '/preview/oneqr' && <CallOverlayHost />}
    </KybGateProvider>
  )
}
