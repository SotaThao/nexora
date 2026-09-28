// POS Admin demo (#589 follow-up) — fixed desktop sidebar for the public /pos* preview
// routes (>=1024px). See PosSidebarNav for the shared nav content and PosSidebarDrawer
// for the <1024px slide-in equivalent.
import PosSidebarNav from './PosSidebarNav'

export default function PosSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
      <PosSidebarNav />
    </aside>
  )
}
