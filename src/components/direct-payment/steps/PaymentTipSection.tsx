import React from 'react'
import { Plus } from 'lucide-react'

import { formatUsdAmount } from '../../../utils/currencyInput'
import type { TFunction } from '../../../types/contexts'
import type { DirectPaymentTip } from '../hooks/useDirectPaymentTip'

interface PaymentTipSectionProps {
  t: TFunction
  tip: DirectPaymentTip
  /** Even share each selected staff member receives — shown only for 2+ people. */
  perStaffAmount: number
}

/**
 * "Add a tip" block on the review screen: pick who served you, then a tip total
 * that is split evenly across everyone picked.
 */
export default function PaymentTipSection({ t, tip, perStaffAmount }: PaymentTipSectionProps) {
  const hasSelection = tip.selectedStaff.length > 0
  const showPerStaff = tip.selectedStaff.length > 1 && perStaffAmount > 0

  return (
    <div className="space-y-2.5 border-t border-nexoraBorder/70 px-3.5 py-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">
          {t('direct_payment.tip_section_label')}
        </p>
        {hasSelection ? (
          <button
            type="button"
            onClick={tip.skip}
            className="text-[10px] font-bold uppercase tracking-wider text-nexoraBrand hover:text-nexoraBrandDark"
          >
            {t('direct_payment.tip_skip')}
          </button>
        ) : null}
      </div>

      {!hasSelection ? (
        <button
          type="button"
          onClick={tip.openPicker}
          className="flex h-12 w-full items-center gap-2.5 rounded-xl border border-dashed border-nexoraBorder bg-white px-3.5 text-left text-sm font-semibold text-nexoraSubtle transition hover:border-nexoraBrand hover:text-nexoraBrand"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nexoraBrandSoft/40 text-nexoraBrand">
            <Plus className="h-3.5 w-3.5 stroke-[3px]" />
          </span>
          {t('customer.select_staff_title')}
        </button>
      ) : null}

      {hasSelection ? (
        <div className="space-y-2">
          {tip.selectedStaff.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-nexoraBorder bg-white p-2.5"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                {member.photoUrl ? (
                  <img
                    src={member.photoUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border border-nexoraBorder object-cover"
                  />
                ) : (
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-xs font-black text-white">
                    {(member.nickname || member.displayName).charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-nexoraText">
                    {member.displayName}
                  </span>
                  <span className="mt-0.5 flex items-baseline gap-1 text-xs font-semibold text-nexoraSubtle">
                    {member.position ? (
                      <span className="truncate">{member.position}</span>
                    ) : null}
                    {showPerStaff ? (
                      <>
                        {member.position ? <span aria-hidden="true">·</span> : null}
                        <span className="shrink-0 font-black text-nexoraText">
                          {formatUsdAmount(perStaffAmount)}
                        </span>
                        <span className="shrink-0 text-[10px] uppercase">
                          {t('direct_payment.tip_each')}
                        </span>
                      </>
                    ) : null}
                  </span>
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => tip.changeStaff(member.id)}
                  className="text-xs font-bold text-nexoraBrand hover:text-nexoraBrandDark"
                >
                  {t('direct_payment.tip_change')}
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={tip.openPicker}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl border border-dashed border-nexoraBorder bg-white px-3.5 text-left text-xs font-semibold text-nexoraSubtle transition hover:border-nexoraBrand hover:text-nexoraBrand"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3px]" />
            {t('direct_payment.tip_add_another')}
          </button>

          <div className="grid grid-cols-5 gap-1.5">
            {tip.presets.map((preset) => {
              const isActive = !tip.isCustom && tip.presetAmount === preset
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => tip.selectPreset(preset)}
                  className={`h-10 rounded-lg text-[11px] font-black transition ${
                    isActive
                      ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                      : 'border border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
                  }`}
                >
                  {'$' + preset}
                </button>
              )
            })}
            <button
              type="button"
              onClick={tip.startCustom}
              className={`h-10 rounded-lg text-[11px] font-black transition ${
                tip.isCustom
                  ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                  : 'border border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand/50'
              }`}
            >
              {t('customer.custom_tip_btn')}
            </button>
          </div>

          {tip.isCustom ? (
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-nexoraSubtle">
                $
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={tip.customInput}
                onChange={(event) => tip.setCustomInput(event.target.value)}
                aria-label={t('direct_payment.tip_section_label')}
                placeholder={t('direct_payment.tip_custom_placeholder')}
                className="h-11 w-full rounded-xl border border-nexoraBorder bg-white py-2.5 pl-8 pr-3 text-sm font-extrabold text-nexoraText outline-none transition focus:border-nexoraBrand"
              />
            </div>
          ) : null}

          {tip.tipError === 'required' ? (
            <p className="text-xs font-semibold text-nexoraWarning">
              {t('direct_payment.tip_amount_required')}
            </p>
          ) : null}

          {tip.tipError === 'min_item' || tip.tipError === 'max_total' ? (
            <p className="text-xs font-semibold text-nexoraDanger">
              {tip.tipError === 'min_item'
                ? t('direct_payment.tip_min_item_error', {
                    min: formatUsdAmount(tip.constraints.minItemAmount),
                  })
                : t('direct_payment.tip_max_total_error', {
                    max: formatUsdAmount(tip.constraints.maxTotalAmount),
                  })}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
