import React, { useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'

import type { TFunction } from '../../../types/contexts'
import type { PublicDirectPaymentStaff } from '../../../types/domain'

interface SelectServerModalProps {
  t: TFunction
  staff: PublicDirectPaymentStaff[]
  selectedStaffIds: string[]
  onSelect: (ids: string[]) => void
  onClose: () => void
}

/**
 * "Who served you today?" picker — multi-select, committed on Done.
 * Draft selection lives here so Close leaves the review screen untouched.
 */
export default function SelectServerModal({
  t,
  staff,
  selectedStaffIds,
  onSelect,
  onClose,
}: SelectServerModalProps) {
  const [draftIds, setDraftIds] = useState<string[]>(selectedStaffIds)
  const [query, setQuery] = useState('')

  const filteredStaff = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return staff
    return staff.filter((member) => (
      member.displayName.toLowerCase().includes(needle)
      || (member.nickname || '').toLowerCase().includes(needle)
    ))
  }, [query, staff])

  const toggle = (staffId: string) => {
    setDraftIds((prev) => (
      prev.includes(staffId) ? prev.filter((id) => id !== staffId) : [...prev, staffId]
    ))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4">
      <div className="nexora-modal-card w-full max-w-md rounded-b-none sm:rounded-2xl">
        <div className="flex items-center justify-between gap-3 pb-4">
          <h3 className="text-base font-black text-nexoraText">
            {t('customer.select_staff_title')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-nexoraBrand hover:text-nexoraBrandDark"
          >
            {t('common.close')}
          </button>
        </div>

        <div className="relative pb-3">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-nexoraSubtle" />
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={t('direct_payment.tip_search_placeholder')}
            placeholder={t('direct_payment.tip_search_placeholder')}
            className="h-10 w-full rounded-xl border border-nexoraBorder bg-white pl-9 pr-3 text-sm font-medium text-nexoraText outline-none transition focus:border-nexoraBrand"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
          {filteredStaff.map((member) => {
            const isSelected = draftIds.includes(member.id)
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggle(member.id)}
                className={`flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition ${
                  isSelected
                    ? 'border-nexoraBrand bg-nexoraBrandSoft/20'
                    : 'border-nexoraBorder bg-white hover:border-nexoraBrand/40'
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  {member.photoUrl ? (
                    <img
                      src={member.photoUrl}
                      alt=""
                      className="h-10 w-10 shrink-0 rounded-full border border-nexoraBorder object-cover"
                    />
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-sm font-black text-white">
                      {(member.nickname || member.displayName).charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-extrabold text-nexoraText">
                      {member.displayName}
                    </span>
                    {member.position ? (
                      <span className="mt-0.5 block truncate text-xs font-semibold text-nexoraSubtle">
                        {member.position}
                      </span>
                    ) : null}
                  </span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                    isSelected
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder bg-white'
                  }`}
                >
                  {isSelected ? <Check className="h-3.5 w-3.5 stroke-[3px]" /> : null}
                </span>
              </button>
            )
          })}

          {filteredStaff.length === 0 ? (
            <p className="py-8 text-center text-xs font-semibold text-nexoraMuted">
              {staff.length === 0
                ? t('direct_payment.tip_no_staff')
                : t('direct_payment.tip_no_staff_match')}
            </p>
          ) : null}
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => onSelect(draftIds)}
            disabled={draftIds.length === 0}
            className="h-11 w-full rounded-xl bg-nexoraBrand text-sm font-black text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('customer.done')}
          </button>
        </div>
      </div>
    </div>
  )
}
