// POS Admin demo (#589 follow-up) — shared sidebar nav content for the public /pos*
// preview routes, rendered inside both the fixed desktop PosSidebar and the mobile
// PosSidebarDrawer. Matches the approved reference (OneQR pack, "Recruitment · POS ->
// NailHub" screen): NEXORA TOUCH brand block, business card, POS group (expanded,
// gradient-active) with Front Desk / Vật tư & Đặt hàng / Salon Settings / Report /
// Promotions children, then the NailHub + owner cards pinned to the bottom.
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { BNB_BUSINESS_INFO } from '../community/jobs/communityJobsDemoData'
import {
  isPosGroupActive,
  isSalonSettingsActive,
  SALON_SETTINGS_DEFAULT_PATH,
} from './posSidebarNavConfig'

const TK = 'components.pos_demo.PosSidebarNav'

type PosSidebarNavProps = {
  onNavigate?: () => void
}

export default function PosSidebarNav({ onNavigate }: PosSidebarNavProps) {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { showToast } = useNotification()

  const isPosActive = isPosGroupActive(pathname)
  const isSalonSettingsChildActive = isSalonSettingsActive(pathname)

  const showComingSoon = () => {
    showToast(t(`${TK}.comingSoon`), 'info')
  }

  const handleSalonSettingsClick = () => {
    navigate(SALON_SETTINGS_DEFAULT_PATH)
    onNavigate?.()
  }

  const inertRowClass =
    'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-bold text-white/60 ' +
    'transition hover:bg-white/5 hover:text-white/80'
  const inertSubRowClass =
    'flex h-9 w-full items-center rounded-lg px-3 text-left text-xs font-bold text-white/50 ' +
    'transition hover:bg-white/5 hover:text-white/70'

  return (
    <>
      <Link
        to="/"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-1 py-1 text-white"
        aria-label={t(`${TK}.brandName`)}
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-nexoraBrand text-lg font-black">
          N
        </span>
        <span className="leading-tight">
          <span className="block text-lg font-black tracking-wide">{t(`${TK}.brandName`)}</span>
          <span className="block text-[10px] font-bold tracking-[0.3em] text-white/60">{t(`${TK}.brandSub`)}</span>
        </span>
      </Link>

      <div className="mt-6 flex shrink-0 items-center gap-2.5 rounded-xl border border-white/15 px-3 py-3">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold text-white"
        >
          {BNB_BUSINESS_INFO.name.charAt(0)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold text-white">{BNB_BUSINESS_INFO.name}</span>
          <span className="block truncate text-xs text-white/60">
            {String(BNB_BUSINESS_INFO.city)} · {t(`${TK}.sampleBranch`)}
          </span>
        </span>
      </div>

      <nav
        aria-label={t(`${TK}.navAriaLabel`)}
        className="mt-5 flex-1 space-y-1 overflow-y-auto pr-1"
      >
        <button type="button" onClick={showComingSoon} className={inertRowClass}>
          <span aria-hidden="true">⌂</span>
          <span className="truncate">{t(`${TK}.overview`)}</span>
        </button>
        <button type="button" onClick={showComingSoon} className={inertRowClass}>
          <span aria-hidden="true">▦</span>
          <span className="truncate">{t(`${TK}.oneQr`)}</span>
        </button>

        <div
          aria-current={isPosActive ? 'true' : undefined}
          className={
            'flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold text-white ' +
            'bg-gradient-to-r from-nexoraElectric to-nexoraViolet shadow-lg shadow-nexoraElectric/20'
          }
        >
          <span aria-hidden="true">▣</span>
          <span className="truncate">{t(`${TK}.pos`)}</span>
          <span className="ml-auto text-white/80" aria-hidden="true">
            ⌃
          </span>
        </div>

        <div className="ml-4 mt-1 space-y-0.5 border-l border-white/15 pl-3">
          <button type="button" onClick={showComingSoon} className={inertSubRowClass}>
            <span className="truncate">{t(`${TK}.frontDesk`)}</span>
          </button>
          <button type="button" onClick={showComingSoon} className={inertSubRowClass}>
            <span className="truncate">{t(`${TK}.supplies`)}</span>
          </button>
          <button
            type="button"
            onClick={handleSalonSettingsClick}
            className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
              isSalonSettingsChildActive ? 'text-brandCyan' : 'text-white/75 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isSalonSettingsChildActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'
              }`}
              aria-hidden="true"
            />
            <span className="truncate">{t(`${TK}.salonSettings`)}</span>
          </button>
          <button type="button" onClick={showComingSoon} className={inertSubRowClass}>
            <span className="truncate">{t(`${TK}.report`)}</span>
          </button>
          <button type="button" onClick={showComingSoon} className={inertSubRowClass}>
            <span className="truncate">{t(`${TK}.promotions`)}</span>
          </button>
        </div>
      </nav>

      <div className="mt-auto shrink-0 space-y-3 pt-3">
        <div className="flex items-center gap-2.5 border-t border-white/15 px-1 pt-4">
          <span
            className={
              'grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-emerald-50 ' +
              'text-sm font-black italic text-emerald-700'
            }
          >
            nh
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">{t(`${TK}.nailHubName`)}</span>
            <span className="block truncate text-xs text-white/60">{t(`${TK}.nailHubTagline`)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5 px-1">
          <span
            className={
              'grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold text-white'
            }
          >
            BN
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-white">{t(`${TK}.ownerRole`)}</span>
            <span className="block truncate text-xs text-white/60">{t(`${TK}.ownerSpace`)}</span>
          </span>
        </div>
      </div>
    </>
  )
}
