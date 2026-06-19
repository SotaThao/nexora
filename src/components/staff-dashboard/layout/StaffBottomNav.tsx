// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
<<<<<<< HEAD
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { STAFF_BOTTOM_NAV_ITEMS } from '../constants'
import AppQrScanner from '../../common/AppQrScanner'
import { resolveQrToAppPath } from '../../../utils/qrNavigate'
=======
// Mirrors the reference app tabs: Home, My QR, Tips, Reviews, Profile.
import { Home, QrCode, CircleDollarSign, Star, User } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

const NAV_ITEMS = [
  { id: 'home',    icon: Home,             labelKey: 'staff_dashboard.nav.tab_home' },
  { id: 'qr',      icon: QrCode,           labelKey: 'staff_dashboard.nav.tab_qr' },
  { id: 'tips',    icon: CircleDollarSign, labelKey: 'staff_dashboard.nav.tips' },
  { id: 'reviews', icon: Star,             labelKey: 'staff_dashboard.nav.reviews' },
  { id: 'profile', icon: User,             labelKey: 'staff_dashboard.nav.profile' },
]
>>>>>>> origin/dev

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useNotification()
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

  // [home, qr] | SCAN | [tips, reviews]
  const before = STAFF_BOTTOM_NAV_ITEMS.slice(0, 2)
  const after = STAFF_BOTTOM_NAV_ITEMS.slice(2)

  function renderItem(item) {
    const Icon = item.icon
    const isActive = activeScreen === item.id
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        className={`flex flex-1 flex-col items-center justify-end gap-1 py-2.5 text-[10px] font-bold transition active:scale-95 ${
          isActive ? 'text-nexoraBrand' : 'text-nexoraMuted hover:text-nexoraText'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
        <span className="truncate px-0.5">{t(item.labelKey)}</span>
      </button>
    )
  }

  return (
<<<<<<< HEAD
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-nexoraSurface shadow-[0_-4px_20px_rgba(11,18,32,0.06)] pb-[env(safe-area-inset-bottom)] lg:hidden">

        {/* Floating scan circle — centered above the nav bar top edge */}
        <button
          type="button"
          onClick={() => setScannerOpen(true)}
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10
                     w-14 h-14 rounded-full bg-nexoraBrand
                     shadow-[0_4px_16px_rgba(0,0,0,0.18),0_0_0_3px_var(--color-nexoraSurface,#fff)]
                     flex items-center justify-center active:scale-95 transition-transform"
          aria-label={t('components.common.AppQrScanner.title')}
        >
          <ScanLine className="h-6 w-6 text-white" strokeWidth={2} />
        </button>

        <div className="mx-auto flex max-w-lg">
          {before.map(renderItem)}

          {/* Center label slot — icon slot is occupied by the floating button above */}
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex flex-1 flex-col items-center justify-end py-2.5 text-[10px] font-bold text-nexoraMuted hover:text-nexoraText transition active:scale-95"
          >
            <span className="truncate px-0.5">{t('staff_dashboard.nav.scan')}</span>
          </button>

          {after.map(renderItem)}
        </div>
      </nav>

      {scannerOpen && (
        <AppQrScanner onClose={() => setScannerOpen(false)} onDetect={handleQrDetect} />
      )}
    </>
=======
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md shadow-[0_-8px_28px_rgba(11,18,32,0.08)] pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition ${
                isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle hover:text-nexoraText'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon
                className="h-[22px] w-[22px]"
                strokeWidth={isActive ? 2.5 : 1.9}
                fill={isActive && item.id === 'home' ? 'currentColor' : 'none'}
              />
              <span className="truncate px-0.5">{t(item.labelKey)}</span>
            </button>
          )
        })}
      </div>
    </nav>
>>>>>>> origin/dev
  )
}
