import React from 'react'

export default function Processing({ t, selectedWallet }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
      <div className="w-10 h-10 border-4 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
      <p className="text-xs text-nexoraBrand font-bold uppercase tracking-wider animate-pulse">
        {t('customer.processing_payment', { name: selectedWallet })}
      </p>
    </div>
  )
}
