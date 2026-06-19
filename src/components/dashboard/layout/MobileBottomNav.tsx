import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, QrCode, CircleDollarSign, Star, ScanLine } from 'lucide-react'
import { useNotification } from '../../../contexts/NotificationContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import AppQrScanner from '../../common/AppQrScanner'
import { resolveQrToAppPath } from '../../../utils/qrNavigate'

const NAV_ITEMS = [
  { id: 'overview', label: 'Home', Icon: Home },
  { id: 'touchpoints', label: 'QR', Icon: QrCode },
  { id: 'tips', label: 'Tips', Icon: CircleDollarSign },
  { id: 'reviews', label: 'Reviews', Icon: Star },
]

export default function MobileBottomNav({ activeMenu, onNavigate }) {
  const navigate = useNavigate()
  const { showToast } = useNotification()
  const { t } = useTranslation()
  const [scannerOpen, setScannerOpen] = useState(false)

  function handleQrDetect(raw: string) {
    setScannerOpen(false)
    const path = resolveQrToAppPath(raw)
    if (!path) {
      showToast(t('components.common.AppQrScanner.unsupported_qr'), 'error')
      return
    }
    navigate(path)
  }

  const before = NAV_ITEMS.slice(0, 2)
  const after = NAV_ITEMS.slice(2)

  function renderItem({ id, label, Icon }) {
    const isActive = activeMenu === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className="flex flex-1 flex-col items-center justify-end gap-1 pb-2.5 pt-1 focus:outline-none active:scale-95 transition-transform"
      >
        <Icon
          className={`h-5 w-5 transition-colors duration-200 ${isActive ? 'text-nexoraBrand' : 'text-gray-400'}`}
          strokeWidth={isActive ? 2.5 : 1.8}
          fill={isActive && id === 'overview' ? 'currentColor' : 'none'}
        />
        <span className={`text-[10px] font-bold transition-colors duration-200 ${isActive ? 'text-nexoraBrand' : 'text-gray-400'}`}>
          {label}
        </span>
      </button>
    )
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 bg-white lg:hidden"
        style={{ paddingBottom: 'var(--app-safe-area-bottom)', boxShadow: '0 -4px 20px rgba(0,0,0,0.08)' }}
      >
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                     w-14 h-14 rounded-full bg-nexoraBrand
                     shadow-[0_4px_16px_rgba(0,0,0,0.18),0_0_0_3px_#fff]
                     flex items-center justify-center active:scale-95 transition-transform"
          aria-label={t('components.common.AppQrScanner.title')}
        >
          <ScanLine className="h-6 w-6 text-white" strokeWidth={2} />
        </button>

        <div className="flex items-stretch h-16 px-2">
          {before.map(renderItem)}

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex flex-1 flex-col items-center justify-end pb-2.5 focus:outline-none active:scale-95 transition-transform"
          >
            <span className="text-[10px] font-bold text-gray-400">{t('dashboard.menu.scan')}</span>
          </button>

          {after.map(renderItem)}
        </div>
      </nav>

      {scannerOpen && (
        <AppQrScanner onClose={() => setScannerOpen(false)} onDetect={handleQrDetect} />
      )}
    </>
  )
}
