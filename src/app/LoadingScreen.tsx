import React from 'react'

export default function LoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
        <p className="text-xs text-nexoraBrand font-semibold uppercase tracking-wider animate-pulse">Loading...</p>
      </div>
    </div>
  )
}
