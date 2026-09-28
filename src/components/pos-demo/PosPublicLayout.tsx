// POS Admin demo (#589 follow-up) — layout wrapper for the public /pos* preview routes.
// Renders the approved sidebar (PosSidebar desktop / PosSidebarDrawer mobile) plus the
// breadcrumb + Salon Settings tab row (PosContentHeader) around whatever page is routed;
// deliberately does NOT touch PosServicesView (also reused inside the authenticated
// dashboard) or PosStaffPage themselves.
import { useState, type ReactNode } from 'react'
import { Menu } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { BNB_BUSINESS_INFO } from '../community/jobs/communityJobsDemoData'
import PosSidebar from './PosSidebar'
import PosSidebarDrawer from './PosSidebarDrawer'
import PosContentHeader from './PosContentHeader'

export default function PosPublicLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-nexoraCanvas font-sans text-nexoraText lg:pl-72">
      <PosSidebar />
      <PosSidebarDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      <header
        className={
          'sticky top-0 z-20 flex min-h-16 items-center gap-3 bg-nexoraSidebar px-4 text-white lg:hidden'
        }
      >
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          aria-label={t('components.pos_demo.PosSidebarNav.openMenuAria')}
          className={
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 ' +
            'bg-white/5 text-white transition hover:bg-white/10'
          }
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-nexoraBrand text-sm font-black">
          N
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-black tracking-wide">
            {t('components.pos_demo.PosSidebarNav.brandName')}
          </span>
        </span>
        <span className="ml-auto min-w-0 text-right leading-tight">
          <span className="block truncate text-xs font-bold text-white">{BNB_BUSINESS_INFO.name}</span>
          <span className="block truncate text-[10px] text-white/60">
            {String(BNB_BUSINESS_INFO.city)} · {t('components.pos_demo.PosSidebarNav.sampleBranch')}
          </span>
        </span>
      </header>

      <PosContentHeader />

      <div className="mx-auto w-full max-w-6xl p-4 pb-6 sm:p-6 sm:pb-8 lg:p-7 lg:pb-7">{children}</div>
    </div>
  )
}
