import type { ReactNode } from 'react'
import useDrawerPresence from '../../hooks/useDrawerPresence'
import { SIDEBAR_MOBILE_DRAWER_CLASS } from './sidebarMenuStyles'

type MobileSidebarOverlayProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Extra classes for the panel (e.g. py-6). */
  panelClassName?: string
  id?: string
}

/**
 * Full-screen mobile nav shell: fading backdrop + left slide panel.
 * Enter uses CSS keyframes on mount (smooth on mobile); exit keeps the node mounted.
 */
export default function MobileSidebarOverlay({
  isOpen,
  onClose,
  children,
  panelClassName = '',
  id = 'dashboard-mobile-menu',
}: MobileSidebarOverlayProps) {
  const { mounted, phase } = useDrawerPresence(isOpen)
  const isVisible = phase === 'open'

  if (!mounted) return null

  return (
    <div
      className={`mobile-sidebar-overlay is-${phase}`}
      id={id}
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        className="mobile-sidebar-overlay__backdrop"
        aria-label="Close navigation menu"
        onClick={onClose}
        tabIndex={isVisible ? 0 : -1}
      />
      <aside
        className={[SIDEBAR_MOBILE_DRAWER_CLASS, 'mobile-sidebar-overlay__panel', panelClassName]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </aside>
    </div>
  )
}
