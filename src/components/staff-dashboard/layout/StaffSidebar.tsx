// StaffSidebar — desktop (≥1024px) left nav and mobile drawer for the staff dashboard.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { STAFF_MENU_ITEMS } from '../constants'
import { PUBLIC_HOME_MENU_ITEM } from '../../dashboard/constants'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import MenuIcon from '../../ui/MenuIcon'

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

