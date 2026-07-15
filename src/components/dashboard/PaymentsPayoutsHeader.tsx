import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  PAYMENTS_PAYOUTS_MENU_ITEM,
  PAYMENTS_PAYOUTS_SUBMENU,
  isPaymentsPayoutsSubActive,
} from './constants'

// Unified page header for every screen under the Payments & Payouts sidebar
// menu. The tab bar mirrors PAYMENTS_PAYOUTS_SUBMENU so page tabs and sidebar
// submenu always stay in sync, navigating across the tips/reports screens.
export default function PaymentsPayoutsHeader() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const activeMenu = location.pathname.split('/')[2] || 'overview'
  const tabParam = searchParams.get('tab')

  return (
    <div className="border-b border-nexoraBorder pb-5">
      <h2 className="text-2xl font-black text-inkBlue dark:text-white tracking-tight">
        {t(PAYMENTS_PAYOUTS_MENU_ITEM.labelKey)}
      </h2>

      <div className="mt-3 flex w-full flex-wrap gap-1 bg-nexoraSurfaceMuted dark:bg-luxuryCoal p-1 rounded-xl border border-nexoraBorder dark:border-luxuryGold/10 sm:w-fit">
        {PAYMENTS_PAYOUTS_SUBMENU.map((item) => {
          const isActive = isPaymentsPayoutsSubActive(activeMenu, tabParam, item)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                navigate(`/dashboard/${item.screen}?tab=${encodeURIComponent(item.params.tab)}`)
              }
              className={`h-9 rounded-lg px-4 text-xs font-bold transition-all min-w-[44px] ${
                isActive
                  ? 'bg-white dark:bg-luxuryBlack text-luxuryGold shadow-sm font-black'
                  : 'text-mutedGrey hover:text-inkBlue dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {t(item.labelKey)}
            </button>
          )
        })}
      </div>
    </div>
  )
}
