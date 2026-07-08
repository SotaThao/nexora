import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { StatusFilter, useMerchantStaff } from '../../../data/hooks/useMerchantStaff'
import type { StaffMember } from '../../../types/domain'

const MENU_GAP = 6
const VIEWPORT_PAD = 8
const SEARCH_DEBOUNCE_MS = 300
const STAFF_PAGE_SIZE = 20

function formatStaffLabel(staff: StaffMember): string {
  const name = (staff.displayName || staff.fullName || staff.nickname || '—') as string
  return staff.staffCode ? `${name} (${staff.staffCode})` : name
}

function isPayoutEligibleStaff(staff: StaffMember): boolean {
  return Boolean(staff.staffProfileId) && (staff.isActive || staff.status === 'Active')
}

export default function PayoutStaffSelect({
  value,
  selectedStaff,
  onSelect,
  allowedStaffProfileIds,
  disabled = false,
  error = null,
  enabled = true,
}: {
  value: string
  selectedStaff: StaffMember | null
  onSelect: (staff: StaffMember) => void
  allowedStaffProfileIds?: Set<string>
  disabled?: boolean
  error?: string | null
  enabled?: boolean
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('')
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number; width: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedKeyword(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  const { data, isFetching, isPending } = useMerchantStaff({
    statusFilter: StatusFilter.Active,
    pageNumber: 1,
    pageSize: STAFF_PAGE_SIZE,
    keyword: debouncedKeyword || undefined,
    enabled: enabled && isOpen && !disabled,
  })

  const staffOptions = useMemo(
    () => (data?.items ?? []).filter((staff) => {
      if (!isPayoutEligibleStaff(staff)) return false
      if (!allowedStaffProfileIds) return true
      return Boolean(staff.staffProfileId && allowedStaffProfileIds.has(staff.staffProfileId))
    }),
    [data?.items, allowedStaffProfileIds],
  )

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current
    const menu = menuRef.current
    if (!button || !menu) return

    const rect = button.getBoundingClientRect()
    const menuHeight = menu.offsetHeight
    const width = Math.min(Math.max(rect.width, 280), window.innerWidth - VIEWPORT_PAD * 2)

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD
    const spaceAbove = rect.top - VIEWPORT_PAD
    const openUp = menuHeight > spaceBelow && spaceAbove > spaceBelow

    let top = openUp ? rect.top - MENU_GAP - menuHeight : rect.bottom + MENU_GAP
    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PAD))

    const maxLeft = window.innerWidth - width - VIEWPORT_PAD
    const left = Math.max(VIEWPORT_PAD, Math.min(rect.left, maxLeft))

    setMenuCoords({ top, left, width })
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuCoords(null)
      return undefined
    }

    updateMenuPosition()
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [isOpen, staffOptions.length, isFetching, updateMenuPosition])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen) {
      setSearchInput('')
      setDebouncedKeyword('')
      return
    }
    const timer = window.setTimeout(() => searchInputRef.current?.focus(), 0)
    return () => window.clearTimeout(timer)
  }, [isOpen])

  const buttonLabel = selectedStaff
    ? formatStaffLabel(selectedStaff)
    : t('dashboard.tips.payouts_manager.staff_placeholder')

  const isLoading = isOpen && (isFetching || isPending)

  const handleSelect = (staff: StaffMember) => {
    if (!staff.staffProfileId) return
    onSelect(staff)
    setIsOpen(false)
  }

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuCoords?.top ?? -9999,
            left: menuCoords?.left ?? 0,
            width: menuCoords?.width ?? buttonRef.current?.offsetWidth,
            zIndex: 10000,
            visibility: menuCoords ? 'visible' : 'hidden',
          }}
          className="overflow-hidden rounded-lg border border-nexoraBorder bg-white shadow-premium"
        >
          <div className="border-b border-nexoraBorder p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-mutedGrey" />
              <input
                ref={searchInputRef}
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('dashboard.tips.payouts_manager.staff_search_placeholder')}
                className="h-9 w-full rounded-lg border border-nexoraBorder bg-white pl-8 pr-8 text-sm outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20"
              />
              {isLoading ? (
                <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-nexoraBrand" />
              ) : null}
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {isLoading && staffOptions.length === 0 ? (
              <p className="px-4 py-3 text-xs text-mutedGrey">{t('dashboard.tips.payouts_manager.staff_search_loading')}</p>
            ) : staffOptions.length === 0 ? (
              <p className="px-4 py-3 text-xs text-mutedGrey">{t('dashboard.tips.payouts_manager.staff_search_empty')}</p>
            ) : (
              staffOptions.map((staff) => {
                const staffProfileId = staff.staffProfileId as string
                const isSelected = value === staffProfileId
                return (
                  <button
                    key={staffProfileId}
                    type="button"
                    onClick={() => handleSelect(staff)}
                    className={`flex w-full cursor-pointer select-none items-center px-4 py-2.5 text-left text-sm transition-colors ${
                      isSelected
                        ? 'bg-nexoraBrand/10 font-bold text-nexoraBrand'
                        : 'text-inkBlue hover:bg-slate-50'
                    }`}
                  >
                    {formatStaffLabel(staff)}
                  </button>
                )
              })
            )}
          </div>
        </div>,
        document.body,
      )
    : null

  return (
    <div className="relative min-w-0 w-full" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((open) => !open)}
        className={`flex min-h-[42px] w-full items-center justify-between rounded-lg border bg-white px-4 py-2.5 text-left text-sm transition-all select-none focus:outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 ${
          error ? 'border-red-400' : 'border-nexoraBorder'
        } ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-mutedGrey' : 'cursor-pointer'} ${
          value ? 'font-semibold text-inkBlue' : 'text-mutedGrey'
        }`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'payout-staff-error' : undefined}
      >
        <span className="truncate">{buttonLabel}</span>
        <ChevronDown
          className={`ml-2 h-4 w-4 shrink-0 text-mutedGrey transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-nexoraBrand' : ''
          }`}
        />
      </button>
      {error ? (
        <p id="payout-staff-error" className="mt-1.5 text-xs font-semibold text-red-600">
          {error}
        </p>
      ) : null}
      {menu}
    </div>
  )
}
