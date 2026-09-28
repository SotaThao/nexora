// POS Admin demo (#589 follow-up) — layout wrapper for the public /pos* preview routes.
// Renders the approved sidebar (PosSidebar desktop / PosSidebarDrawer mobile) plus the
// breadcrumb + Salon Settings tab row (PosContentHeader) around whatever page is routed;
// deliberately does NOT touch PosServicesView (also reused inside the authenticated
// dashboard) or PosStaffPage themselves.
import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import PosSidebar from './PosSidebar'
import PosSidebarDrawer from './PosSidebarDrawer'
import PosContentHeader from './PosContentHeader'

// Mobile header mirrors DashboardHeader.mobile.tsx's <=lg bar (hamburger + Nexora logo);
// query-backed search/notifications/avatar controls are omitted as demo-unsafe.
export default function PosPublicLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-nexoraCanvas font-sans text-nexoraText lg:pl-72">
      <PosSidebar />
      <PosSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <header
        className={
          'safe-area-top sticky top-0 z-20 border-b border-nexoraBorder ' +
          'bg-nexoraSurface/90 backdrop-blur-md lg:hidden'
        }
      >
        <div className="flex min-h-16 items-center gap-2 px-4">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label={t('components.pos_demo.PosSidebarNav.openMenuAria')}
            className={
              'flex h-11 w-11 items-center justify-center rounded-xl border border-nexoraBorder ' +
              'bg-white text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted'
            }
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        </div>
      </header>

      <PosContentHeader />

      <div className="mx-auto w-full max-w-6xl p-4 pb-6 sm:p-6 sm:pb-8 lg:p-7 lg:pb-7">{children}</div>
    </div>
  )
}
