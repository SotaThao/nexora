import React from 'react'
import { X, QrCode } from 'lucide-react'

export default function QrScannerModal({
  showScanner,
  scanTarget,
  currentLanguage,
  setShowScanner,
  setScanTarget,
  simulateSuccessfulScan,
  handleSearchIdChange,
  handleVlinkpayIdChange,
}) {
  if (!showScanner) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
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

      <div className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl animate-scaleUp">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            setShowScanner(false)
            setScanTarget(null)
          }}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
          title="Close Scanner"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {currentLanguage === 'vi' ? 'Quét Mã QR Nhận Diện' : 'Scan QR Code'}
          </h3>
          <p className="text-[10px] text-slate-500 font-medium">
            {scanTarget === 'staff'
              ? (currentLanguage === 'vi' ? 'Quét mã NEXORA STAFF ID để liên kết hồ sơ' : 'Scan NEXORA STAFF ID to link your profile')
              : (currentLanguage === 'vi' ? 'Quét mã VLINKPAY ID để tự động điền thông tin' : 'Scan VLINKPAY ID to autofill profile data')}
          </p>
        </div>

        {/* Scanning viewport */}
        <div className="relative h-48 w-48 mx-auto rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
          {/* Corner brackets */}
          <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm"></div>
          <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm"></div>
          <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm"></div>
          <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm"></div>

          {/* QR icon background */}
          <QrCode className="h-20 w-20 text-slate-300 opacity-80 animate-pulse" />

          {/* Laser line */}
          <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b] animate-scannerLaser"></div>
        </div>

        {/* Helper Text */}
        <p className="text-[10px] text-slate-500 font-medium max-w-xs mx-auto">
          {currentLanguage === 'vi'
            ? 'Hướng camera về phía mã QR hoặc chọn giả lập quét thành công bên dưới.'
            : 'Point the camera at the QR code, or choose a mockup scan profile below.'}
        </p>

        {/* Quick simulation buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
            {currentLanguage === 'vi' ? 'Giả lập quét QR' : 'Simulate QR Scan'}
          </span>

          <div className="flex flex-col gap-2">
            {/* Standard Successful Scan button required by prompt */}
            <button
              type="button"
              onClick={simulateSuccessfulScan}
              className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
            >
              {currentLanguage === 'vi' ? 'Giả lập Quét Lisa Tran' : 'Simulate Successful Scan'}
            </button>

            {/* Additional quick options for high-end feel */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (scanTarget === 'staff') {
                    handleSearchIdChange('NEX-STAFF-ANNA0921')
                  } else {
                    handleVlinkpayIdChange('VLP-0921-ANNA')
                  }
                  setShowScanner(false)
                  setScanTarget(null)
                }}
                className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
              >
                Anna Nguyen
              </button>
              <button
                type="button"
                onClick={() => {
                  if (scanTarget === 'staff') {
                    handleSearchIdChange('NEX-STAFF-HN1148')
                  } else {
                    handleVlinkpayIdChange('VLP-1148-HN')
                  }
                  setShowScanner(false)
                  setScanTarget(null)
                }}
                className="py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors"
              >
                Hanna Nguyen
              </button>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={() => {
            setShowScanner(false)
            setScanTarget(null)
          }}
          className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 rounded-xl text-xs font-bold transition"
        >
          {currentLanguage === 'vi' ? 'HỦY BỎ' : 'CANCEL'}
        </button>
      </div>
    </div>
  )
}
