// StaffBottomNav — fixed bottom navigation for mobile (<1024px).
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ScanLine } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { STAFF_BOTTOM_NAV_ITEMS, isStaffTopLevelMenuItemActive } from '../constants'
import AppQrScanner from '../../common/AppQrScanner'
import { resolveQrToAppPath } from '../../../utils/qrNavigate'

export default function StaffBottomNav({ activeScreen, onNavigate }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
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

  const before = STAFF_BOTTOM_NAV_ITEMS.slice(0, 2)
  const after = STAFF_BOTTOM_NAV_ITEMS.slice(2)

  function renderItem(item) {
    const Icon = item.icon
    const isActive = isStaffTopLevelMenuItemActive(activeScreen, tabParam, item.id)
    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        className={`flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold transition active:scale-95 ${
          isActive ? 'text-nexoraBrand' : 'text-nexoraSubtle hover:text-nexoraText'
        }`}
        aria-current={isActive ? 'page' : undefined}
      >
        {item.image ? (
          <img
            src={item.image}
            alt=""
            className={`h-[22px] w-[22px] object-contain transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-70'
            }`}
            aria-hidden="true"
          />
        ) : (
          <Icon
            className="h-[22px] w-[22px]"
            strokeWidth={isActive ? 2.5 : 1.9}
            fill={isActive && item.id === 'home' ? 'currentColor' : 'none'}
          />
        )}
        <span className="truncate px-0.5">{t(item.labelKey)}</span>
      </button>
    )
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-nexoraBorder bg-white/95 backdrop-blur-md shadow-[0_-8px_28px_rgba(11,18,32,0.08)] pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex max-w-lg">
          {before.map(renderItem)}

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            aria-label={t('components.common.AppQrScanner.title')}
            className="relative flex flex-1 min-w-0 flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-bold text-nexoraSubtle hover:text-nexoraText transition active:scale-95"
          >
            <span
              className="absolute top-0 left-1/2 z-10 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-nexoraBrand shadow-[0_4px_16px_rgba(0,0,0,0.18),0_0_0_3px_#fff] active:scale-95 transition-transform"
              aria-hidden="true"
            >
              <ScanLine className="h-6 w-6 text-white" strokeWidth={2} />
            </span>
            <span className="h-[22px]" aria-hidden="true" />
            <span className="truncate px-0.5">{t('staff_dashboard.nav.scan')}</span>
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
