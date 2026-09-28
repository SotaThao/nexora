// POS Admin demo (#589 follow-up) — mobile/tablet (<1024px) slide-in drawer equivalent of
// PosSidebar, opened from the hamburger button in PosPublicLayout. Follows the same
// overlay + focus-trap + Escape-to-close pattern as the authenticated dashboard's
// MobileMenuDrawer (src/components/dashboard/layout/MobileMenuDrawer.tsx).
import { useEffect, useRef } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import PosSidebarNav from './PosSidebarNav'

type PosSidebarDrawerProps = {
  isOpen: boolean
  onClose: () => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export default function PosSidebarDrawer({ isOpen, onClose }: PosSidebarDrawerProps) {
  const { t } = useTranslation()
  const asideRef = useRef<HTMLElement | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    closeButtonRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !asideRef.current) return

      const focusable = Array.from(asideRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] lg:hidden" id="pos-demo-mobile-sidebar">
      <button
        type="button"
        className="absolute inset-0 bg-nexoraText/60"
        aria-label={t('components.pos_demo.PosSidebarNav.closeMenuAria')}
        onClick={onClose}
      />
      <aside
        ref={asideRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('components.pos_demo.PosSidebarNav.navAriaLabel')}
        className={
          'mobile-drawer-safe relative flex h-full w-[min(84vw,320px)] flex-col bg-nexoraSidebar ' +
          'px-5 py-7 text-white shadow-2xl animate-scaleIn'
        }
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label={t('components.pos_demo.PosSidebarNav.closeMenuAria')}
          className={
            'absolute right-0 top-5 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center ' +
            'rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted'
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <PosSidebarNav onNavigate={onClose} />
      </aside>
    </div>
  )
}
