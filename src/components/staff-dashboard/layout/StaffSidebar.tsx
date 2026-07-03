// StaffSidebar — desktop (≥1024px) left nav and mobile drawer for the staff dashboard.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_MENU_ITEMS } from '../constants'
import { PUBLIC_HOME_MENU_ITEM } from '../../dashboard/constants'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import MenuIcon from '../../ui/MenuIcon'

const APP_STORE_URL = 'https://apps.apple.com/us/app/nexora-touch/id6775340468'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=net.vlinkgroup.nexora'

function AppleIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
    </svg>
  )
}

function AndroidIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48A5.84 5.84 0 0 0 12 1c-.96 0-1.86.23-2.66.63L7.85.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31A5.98 5.98 0 0 0 6 7h12c0-2.12-1.1-3.98-2.47-4.84zM10 5H9V4h1v1zm5 0h-1V4h1v1z"/>
    </svg>
  )
}

export default function StaffSidebar({ activeScreen, onNavigate, onLogout, isOpen, onClose }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { staffMember, account } = useStaffAccount()
  const displayName = account.defaultDisplayName || staffMember.fullName || 'Staff'
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  const renderContent = (isMobile = false) => (
    <>
      {/* Mobile close handle — small button straddling the drawer's right edge */}
      {isMobile && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation menu"
          className="absolute right-0 top-5 z-10 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-white text-nexoraText shadow-lg ring-1 ring-black/5 transition hover:bg-nexoraSurfaceMuted"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      )}

      {/* Profile card */}
      <div className="rounded-xl border border-white/15 bg-white/5 p-4 shrink-0">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsProfileExpanded(!isProfileExpanded)}
        >
          <div className="flex items-center gap-3 min-w-0">
            {account.avatar ? (
              <img src={account.avatar} alt="" className="h-11 w-11 rounded-full border border-white/15 object-cover" />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-base font-extrabold">
                {displayName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-white">{account.fullName || staffMember.fullName || displayName}</div>
              <div className="mt-0.5 truncate text-[11px] text-white/65">{t('staff_dashboard.staff_id')}: {account.staffCode || staffMember.id}</div>
            </div>
          </div>
          <div className="text-white/85 hover:text-white transition ml-2">
            {isProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {isProfileExpanded && (
          <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1 animate-fadeIn">
            {[
              { tab: 'account', labelKey: 'staff_dashboard.nav.profile_account', disabled: false },
              { tab: 'kyc', labelKey: 'staff_dashboard.nav.profile_kyc', disabled: true },
            ].map(({ tab, labelKey, disabled }) => {
              const isSubActive = activeScreen === 'profile' && tab === 'account'
              return (
                <button
                  key={tab}
                  type="button"
                  disabled={disabled}
                  aria-disabled={disabled || undefined}
                  onClick={() => {
                    if (disabled) return
                    onNavigate('profile', { tab })
                    if (isMobile && onClose) onClose()
                  }}
                  className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                    disabled
                      ? 'cursor-not-allowed text-white/40 opacity-60'
                      : isSubActive
                        ? 'text-brandCyan font-extrabold'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                  <span>
                    {t(labelKey)}
                    {disabled ? ` (${t('common.coming_soon')})` : ''}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
        <button
          type="button"
          onClick={() => {
            navigate('/')
            if (isMobile && onClose) onClose()
          }}
          className="flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold text-white/85 transition hover:bg-white/5 hover:text-white"
        >
          <MenuIcon item={PUBLIC_HOME_MENU_ITEM} active={false} />
          <span className="truncate">{t('dashboard.menu.home')}</span>
        </button>

        <div className="my-1 border-t border-white/10" />

        {STAFF_MENU_ITEMS.map((item) => {
          const isActive = activeScreen === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onNavigate(item.id)
                if (isMobile && onClose) onClose()
              }}
              className={`flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold transition ${
                isActive
                  ? 'bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white shadow-lg shadow-nexoraElectric/20'
                  : 'text-white/85 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MenuIcon item={item} active={isActive} />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          )
        })}

        <div className="my-2 border-t border-white/10" />

        <button
          type="button"
          onClick={() => {
            window.open(APP_STORE_URL, '_blank', 'noopener')
            if (isMobile && onClose) onClose()
          }}
          className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-nexoraElectric to-nexoraViolet shadow-lg shadow-nexoraViolet/20">
            <AppleIcon className="h-6 w-6 text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-white">{t('staff_dashboard.nav.download_ios')}</span>
            <span className="mt-0.5 block truncate text-[11px] text-white/55">{t('staff_dashboard.nav.download_ios_sub')}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
        </button>

        <button
          type="button"
          onClick={() => {
            window.open(GOOGLE_PLAY_URL, '_blank', 'noopener')
            if (isMobile && onClose) onClose()
          }}
          className="group mt-2 flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-white/20 hover:bg-white/[0.06]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-nexoraViolet shadow-lg shadow-emerald-500/20">
            <AndroidIcon className="h-6 w-6 text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-white">{t('staff_dashboard.nav.download_android')}</span>
            <span className="mt-0.5 block truncate text-[11px] text-white/55">{t('staff_dashboard.nav.download_android_sub')}</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/50 transition group-hover:translate-x-0.5 group-hover:text-white" />
        </button>
      </nav>

      {/* Sign out */}
      <div className="mt-auto border-t border-white/15 pt-4">
        <button
          type="button"
          onClick={onLogout}
          className="flex w-full items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          {t('staff_dashboard.sign_out')}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-nexoraText/60"
            aria-label="Close navigation menu"
            onClick={onClose}
          />
          <aside className="relative flex h-full w-[min(84vw,320px)] flex-col bg-nexoraSidebar px-5 py-6 text-white shadow-2xl animate-scaleIn">
            {renderContent(true)}
          </aside>
        </div>
      )}
    </>
  )
}

