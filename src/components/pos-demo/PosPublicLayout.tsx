// POS Admin demo (#589 follow-up) — thin layout wrapper for the public /pos* preview
// routes. Only adds PosAdminDemoNav around whatever page is routed; deliberately does
// NOT touch PosServicesView (also reused inside the authenticated dashboard) or
// PosStaffPage themselves.
import type { ReactNode } from 'react'
import PosAdminDemoNav from './PosAdminDemoNav'

export default function PosPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh w-full overflow-x-hidden bg-nexoraCanvas font-sans text-nexoraText">
      <PosAdminDemoNav />
      <div className="mx-auto w-full max-w-6xl p-4 pb-6 sm:p-6 sm:pb-8 lg:p-7 lg:pb-7">{children}</div>
    </div>
  )
}
