import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import MenuIcon from '../../ui/MenuIcon'
import {
  PAYMENTS_PAYOUTS_MENU_ITEM,
  PAYMENTS_PAYOUTS_SUBMENU,
  isPaymentsPayoutsRouteActive,
  isPaymentsPayoutsSubActive,
} from '../constants'
import {
  SIDEBAR_SUBMENU_WRAP_CLASS,
  sidebarMenuItemBetweenClass,
  sidebarSubmenuItemClass,
} from '../../ui/sidebarMenuStyles'

type PaymentsPayoutsMenuSectionProps = {
  activeMenu: string
  tabParam: string | null
  isExpanded: boolean
  onToggle: () => void
  onNavigate: (screen: string, tab?: string) => void
}

export default function PaymentsPayoutsMenuSection({
  activeMenu,
  tabParam,
  isExpanded,
  onToggle,
  onNavigate,
}: PaymentsPayoutsMenuSectionProps) {
  const { t } = useTranslation()
  const isSectionActive = isPaymentsPayoutsRouteActive(activeMenu, tabParam)

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={sidebarMenuItemBetweenClass(isSectionActive)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <MenuIcon item={PAYMENTS_PAYOUTS_MENU_ITEM} active={isSectionActive} />
          <span className="truncate">{t(PAYMENTS_PAYOUTS_MENU_ITEM.labelKey)}</span>
        </div>
        <div className="shrink-0 text-white/50">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {isExpanded && (
        <div className={SIDEBAR_SUBMENU_WRAP_CLASS}>
          {PAYMENTS_PAYOUTS_SUBMENU.map((item) => {
            const isSubActive = isPaymentsPayoutsSubActive(activeMenu, tabParam, item)
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.screen, item.params?.tab)}
                className={sidebarSubmenuItemClass(isSubActive)}
              >
                <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                <span>{t(item.labelKey)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
