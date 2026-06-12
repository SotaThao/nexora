import React from 'react'
import { X, QrCode } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

export default function QrScannerModal({
  showScanner,
  scanTarget,
  currentLanguage,
  setShowScanner,
  setScanTarget,
  isDemoToolsEnabled = false,
}) {
  const { t } = useTranslation()

  if (!showScanner) return null

  return (
    <div className="fixed inset-0 bg-nexoraText/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <style>{`
        @keyframes scannerLaser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-scannerLaser {
          animation: scannerLaser 2.5s linear infinite;
        }
      `}</style>

      <div className="bg-white border border-nexoraRule rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-nexoraText shadow-2xl animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            setShowScanner(false)
            setScanTarget(null)
          }}
          className="absolute right-4 top-4 text-nexoraSubtle hover:text-nexoraText transition p-1.5 rounded-full hover:bg-nexoraSurfaceMuted"
          title="Close Scanner"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-nexoraText">
            {t('components.staff_registration.steps.QrScannerModal.scanQrCode')}
          </h3>
          <p className="text-[10px] text-nexoraMuted font-medium">
            {scanTarget === 'staff'
              ? (t('components.staff_registration.steps.QrScannerModal.scanNexoraPersonalId'))
              : (t('components.staff_registration.steps.QrScannerModal.scanVlinkpayIdTo'))}
          </p>
        </div>

        {/* Scanning viewport */}
        <div className="relative h-48 w-48 mx-auto rounded-2xl border-2 border-nexoraRule bg-nexoraSurfaceMuted overflow-hidden flex items-center justify-center shadow-inner">
          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-nexoraWarning rounded-tl-sm"></div>
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-nexoraWarning rounded-tr-sm"></div>
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-nexoraWarning rounded-bl-sm"></div>
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-nexoraWarning rounded-br-sm"></div>

          {/* QR icon background */}
          <QrCode className="h-20 w-20 text-nexoraBorder opacity-80 animate-pulse" />

          {/* Laser line */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-nexoraWarning to-transparent shadow-[0_0_8px_#f59e0b] animate-scannerLaser"></div>
        </div>

        {/* Helper Text */}
        <p className="text-[10px] text-nexoraMuted font-medium max-w-xs mx-auto">
          {isDemoToolsEnabled
            ? (t('components.staff_registration.steps.QrScannerModal.pointTheCameraAt'))
            : (t('components.staff_registration.steps.QrScannerModal.pointTheCameraAt2'))}
        </p>

        {/* Quick simulation buttons */}
        
        {/* Cancel Button */}
        <button
          type="button"
          onClick={() => {
            setShowScanner(false)
            setScanTarget(null)
          }}
          className="w-full py-2 border border-nexoraBorder hover:bg-nexoraSurfaceMuted text-nexoraMuted hover:text-nexoraText rounded-xl text-xs font-bold transition"
        >
          {t('components.staff_registration.steps.QrScannerModal.cancel')}
        </button>
      </div>
    </div>
  )
}
