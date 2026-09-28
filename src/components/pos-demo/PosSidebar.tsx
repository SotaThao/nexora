// POS Admin demo (#589 follow-up) — fixed desktop sidebar for the public /pos* preview
// routes (>=1024px). See PosSidebarNav for the shared nav content and PosSidebarDrawer
// for the <1024px slide-in equivalent.
import { SIDEBAR_SHELL_CLASS } from '../ui/sidebarMenuStyles'
import PosSidebarNav from './PosSidebarNav'

export default function PosSidebar() {
  return (
    <aside className={SIDEBAR_SHELL_CLASS}>
      <PosSidebarNav />
    </aside>
  )
}
