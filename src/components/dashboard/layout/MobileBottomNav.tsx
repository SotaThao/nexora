import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Users, CircleDollarSign, QrCode, ScanLine } from 'lucide-react'
import { useNotification } from '../../../contexts/NotificationContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import AppQrScanner from '../../common/AppQrScanner'
import { resolveQrToAppPath } from '../../../utils/qrNavigate'

const NAV_ITEMS = [
  { id: 'overview',    labelKey: 'nav_home',    Icon: Home,             image: '/assets/menu/dashboard.png' },
  { id: 'staff',       labelKey: 'nav_staff',   Icon: Users,            image: '/assets/menu/staff.png' },
  { id: 'tips',        labelKey: 'nav_tips',    Icon: CircleDollarSign, image: '/assets/menu/tips.png' },
  { id: 'touchpoints', labelKey: 'nav_qr',      Icon: QrCode,           image: '/assets/menu/touchpoint.png' },
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

  function renderItem({ id, labelKey, Icon, image }) {
    const isActive = activeMenu === id
    return (
      <button
        key={id}
        type="button"
        onClick={() => onNavigate(id)}
        className="flex flex-1 min-w-0 flex-col items-center justify-center gap-1 h-full focus:outline-none active:scale-95 transition-transform"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className={`h-[22px] w-[22px] object-contain transition-opacity duration-200 ${
              isActive ? 'opacity-100' : 'opacity-70'
            }`}
            aria-hidden="true"
          />
        ) : (
          <Icon
            className={`h-[22px] w-[22px] transition-colors duration-200 ${
              isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle'
            }`}
            strokeWidth={isActive ? 2.5 : 1.9}
            fill={isActive && id === 'overview' ? 'currentColor' : 'none'}
          />
        )}
        <span
          className={`text-[11px] font-bold transition-colors duration-200 ${
            isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle'
          }`}
        >
          {t(`dashboard.owner_home.${labelKey}`)}
        </span>
      </button>
    )
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md lg:hidden"
        style={{
          paddingBottom: 'var(--app-safe-area-bottom, env(safe-area-inset-bottom, 0px))',
          boxShadow: '0 -8px 28px rgba(15,23,42,0.08)',
        }}
      >
        <div className="flex items-center h-[68px] px-2">
          {before.map(renderItem)}

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label={t('components.common.AppQrScanner.title')}
            className="relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 h-full focus:outline-none active:scale-95 transition-transform"
          >
            <span
              className="absolute top-0 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-nexoraBrand shadow-[0_4px_16px_rgba(0,0,0,0.18),0_0_0_3px_#fff] active:scale-95 transition-transform"
              aria-hidden="true"
            >
              <ScanLine className="h-6 w-6 text-white" strokeWidth={2} />
            </span>
            <span className="h-[22px]" aria-hidden="true" />
            <span className="text-[11px] font-bold text-nexoraSubtle">
              {t('dashboard.menu.scan')}
            </span>
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
