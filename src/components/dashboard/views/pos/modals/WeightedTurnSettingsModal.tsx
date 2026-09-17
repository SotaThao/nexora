// Weighted Turn Settings — how much a turn is worth for each service-value range. Opened from
// the Turn Board, the Bookings calendar and Salon Settings > Salon Information; every entry point
// renders THIS component against the same endpoint, so the salon only ever maintains one set of
// numbers.
//
// Rules the copy in here is not decoration for:
//  - the service value is what the customer pays (discounts included, tips/tax/products/gift
//    cards excluded), which is why the note sits below the ranges;
//  - credit already recorded on a paid visit never changes, which is why changing these numbers
//    is safe mid-shift;
//  - the ranges themselves are salon-defined, not fixed: From is always derived (previous row's
//    Up to + $0.01), the last row is always open-ended, and only ThresholdAmount/TurnCredit are
//    ever sent to the server — From is never a field of its own.
//
// Booking turn credit is intentionally NOT editable here — it belongs to a separate ticket. Its
// current value is still round-tripped unchanged on every save (the API requires it), it is just
// not rendered or exposed to the Manager on this screen.
// TODO: no screen anywhere lets a Manager edit BookingTurnCredit right now — PosTurnSettingsPanel
// only displays it, and BookingTab opens this same modal. When the other ticket ships its own
// editor, either remove this TODO (if that screen writes to the same PosTurnSettings endpoint) or
// bring the input back here (if it doesn't).
//
// Layout otherwise matches the PO prototype; two lines of prototype copy were deliberately not
// carried over: "Technician overrides still apply" and the "Booking Incentive Policy" link.
// Neither describes anything this codebase implements — no per-technician override or policy page
// exists.
import { useEffect, useState } from 'react'
import { Check, FileText, Infinity as InfinityIcon, Layers, Loader2, Plus, ShieldCheck, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useTurnSettings, useUpdateTurnSettings } from '../../../../../data/hooks/usePosTurnSettings'
import { SkeletonList } from '../../../../ui/skeleton'
import { MAX_TURN_CREDIT } from '../posTurnTiers'

const K = 'components.dashboard.views.pos.WeightedTurnSettingsModal.'

/** Always two decimals ($0.00, not $0) — the From column is a fixed amount, not a terse label. */
const wholeCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

interface TierRowDraft {
  /** "" only for the last row, which has no Up to — it is always open-ended. */
  upTo: string
  turnCredit: string
}

/** Empty string is kept as-is so a cleared field reads as "required", not as zero. */
function isValidCredit(value: string) {
  if (value.trim() === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_TURN_CREDIT
}

function hasAtMostTwoDecimals(value: number) {
  return Math.round(value * 100) / 100 === value
}

/**
 * previousUpTo is null only for the first row — it has no range before it, so its only
 * constraint is being a valid non-negative amount. Every other row must strictly exceed the
 * previous row's Up to, or the two ranges would overlap or leave a gap.
 */
function isValidUpTo(value: string, previousUpTo: number | null) {
  if (value.trim() === '') return false
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0 || !hasAtMostTwoDecimals(parsed)) return false
  if (previousUpTo !== null && parsed <= previousUpTo) return false
  return true
}

/** Row 0 always starts at $0; every other row starts one cent above the previous row's Up to. */
function computeFrom(rows: TierRowDraft[], index: number): number | null {
  if (index === 0) return 0
  const previous = Number(rows[index - 1].upTo)
  return Number.isFinite(previous) ? Math.round((previous + 0.01) * 100) / 100 : null
}

export default function WeightedTurnSettingsModal({
  businessId,
  onClose,
}: {
  businessId: string
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useTurnSettings(businessId)
  const updateTurnSettings = useUpdateTurnSettings(businessId)

  const [rows, setRows] = useState<TierRowDraft[]>([])
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Seeded from the server response rather than held as initial state, so re-opening the modal
  // always shows what is actually in force. The server always returns tiers sorted ascending.
  useEffect(() => {
    if (!data) return
    setRows(
      data.serviceTurnTiers.map((tier, index) => {
        const next = data.serviceTurnTiers[index + 1]
        return {
          upTo: next === undefined ? '' : (next.thresholdAmount - 0.01).toFixed(2),
          turnCredit: String(tier.turnCredit),
        }
      }),
    )
    setShowFieldErrors(false)
    setSaveError('')
  }, [data])

  const canManage = data?.canManage ?? false

  const rowCreditInvalid = (index: number) => !isValidCredit(rows[index]?.turnCredit ?? '')
  const rowUpToInvalid = (index: number) => {
    if (index === rows.length - 1) return false
    const previousUpTo = index === 0 ? null : Number(rows[index - 1].upTo)
    return !isValidUpTo(rows[index]?.upTo ?? '', Number.isFinite(previousUpTo) ? previousUpTo : null)
  }
  const hasInvalidField =
    rows.some((_, index) => rowCreditInvalid(index)) || rows.some((_, index) => rowUpToInvalid(index))

  // A caution, never a block: a salon may deliberately give small jobs more credit so nobody is
  // left with only cheap work.
  const creditsDecrease = rows.some((row, index) => {
    if (index === 0) return false
    const previous = Number(rows[index - 1].turnCredit)
    const current = Number(row.turnCredit)
    return Number.isFinite(previous) && Number.isFinite(current) && current < previous
  })

  const updateRow = (index: number, patch: Partial<TierRowDraft>) => {
    setRows((current) => current.map((row, position) => (position === index ? { ...row, ...patch } : row)))
  }

  const addRange = () => {
    setRows((current) => {
      const lastCredit = Number(current[current.length - 1]?.turnCredit)
      const nextCredit = Number.isFinite(lastCredit) ? lastCredit + 0.5 : 0.5
      return [...current, { upTo: '', turnCredit: String(nextCredit) }]
    })
  }

  const removeRange = (index: number) => {
    setRows((current) => (current.length <= 1 ? current : current.filter((_, position) => position !== index)))
  }

  const handleSave = async () => {
    setSaveError('')
    if (hasInvalidField) {
      setShowFieldErrors(true)
      return
    }

    try {
      await updateTurnSettings.mutateAsync({
        // Booking turn credit is not editable from this modal (separate ticket) — pass the
        // server's current value straight through so saving ranges never touches it.
        bookingTurnCredit: data?.bookingTurnCredit ?? 0,
        // computeFrom cannot return null here — hasInvalidField already guaranteed every non-last
        // row's Up to is a valid amount greater than the previous one.
        serviceTurnTiers: rows.map((row, index) => ({
          thresholdAmount: computeFrom(rows, index) ?? 0,
          turnCredit: Number(row.turnCredit),
        })),
      })
      onClose()
    } catch {
      // Deliberately worded as "not applied" and kept separate from field validation: the one
      // thing a manager must never do is walk away believing new rules are live when they are not.
      setSaveError(t(K + 'saveFailed'))
    }
  }

  const fieldInputClass = (invalid: boolean) =>
    `h-11 w-full rounded-lg border px-3 text-sm font-bold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30 ${
      invalid ? 'border-nexoraDanger bg-red-50' : 'border-nexoraBorder bg-nexoraSurface'
    }`

  const describeRange = (index: number) => {
    const from = computeFrom(rows, index)
    const fromText = from === null ? '' : wholeCurrency.format(from)
    const isLast = index === rows.length - 1
    const upToText = isLast ? t(K + 'noLimit') : wholeCurrency.format(Number(rows[index].upTo) || 0)
    return `${fromText}–${upToText}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="nexora-modal-card w-full max-w-2xl">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-nexoraBorder pb-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-nexoraBrandSoft text-nexoraBrand">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <span className="block text-[11px] font-extrabold uppercase tracking-wide text-nexoraMuted">
                {t(K + 'eyebrow')}
              </span>
              <h3 className="text-base font-extrabold text-nexoraText">{t(K + 'title')}</h3>
              <p className="mt-0.5 text-xs font-medium text-nexoraMuted">{t(K + 'description')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(K + 'closeAria')}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraMuted hover:bg-nexoraCanvas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <SkeletonList count={5} lines={1} />
          ) : isError || !data ? (
            <p className="text-xs font-bold text-nexoraDanger">{t(K + 'loadFailed')}</p>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-nexoraText">{t(K + 'serviceTiersLabel')}</span>
                  <span className="flex shrink-0 items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-nexoraMuted">
                    <Layers className="h-3 w-3" />
                    {t(K + 'rangeCount', { count: rows.length })}
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium text-nexoraMuted">{t(K + 'serviceTiersHint')}</p>
              </div>

              <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSurface">
                <div className="hidden items-center gap-2 bg-nexoraCanvas px-4 py-2.5 text-xs font-medium text-nexoraMuted sm:flex">
                  <span className="mr-3 w-8 shrink-0">{t(K + 'rangeColumnLabel')}</span>
                  <span className="w-20 shrink-0">
                    {t(K + 'fromLabel')}{' '}
                    <span className="rounded-full bg-nexoraBorder/40 px-1.5 py-0.5 text-[9px] font-medium text-nexoraMuted/70">
                      {t(K + 'autoBadge')}
                    </span>
                  </span>
                  <span className="flex-1">{t(K + 'upToLabel')}</span>
                  <span className="flex-1">{t(K + 'turnCreditColumnLabel')}</span>
                  <span className="w-9 shrink-0" />
                </div>

                <div className="divide-y divide-nexoraBorder px-4">
                  {rows.map((row, index) => {
                    const isLast = index === rows.length - 1
                    const from = computeFrom(rows, index)
                    return (
                      <div key={index} className="flex flex-wrap items-start gap-2 py-3 sm:flex-nowrap sm:items-center">
                        <span className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas text-xs font-extrabold text-nexoraMuted">
                          {index + 1}
                        </span>

                        <div className="w-20 shrink-0">
                          <span className="block text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted sm:hidden">
                            {t(K + 'fromLabel')}
                          </span>
                          <span className="flex h-11 items-center text-sm font-medium text-nexoraMuted sm:h-auto">
                            {from === null ? '—' : wholeCurrency.format(from)}
                          </span>
                        </div>

                        <div className="min-w-[120px] flex-1">
                          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted sm:hidden">
                            {t(K + 'upToLabel')}
                          </span>
                          {isLast ? (
                            <span className="flex h-11 items-center justify-center gap-1 text-sm font-medium text-nexoraMuted">
                              <InfinityIcon className="h-3.5 w-3.5" />
                              {t(K + 'noLimit')}
                            </span>
                          ) : (
                            <>
                              <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-nexoraMuted">
                                  $
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  inputMode="decimal"
                                  disabled={!canManage}
                                  value={row.upTo}
                                  onChange={(event) => updateRow(index, { upTo: event.target.value })}
                                  placeholder={t(K + 'upToPlaceholder')}
                                  aria-label={`${t(K + 'upToLabel')} ${index + 1}`}
                                  className={`${fieldInputClass(showFieldErrors && rowUpToInvalid(index))} pl-6 pr-3 text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
                                />
                              </div>
                              {showFieldErrors && rowUpToInvalid(index) ? (
                                <span className="mt-1 block text-[11px] font-bold text-nexoraDanger">
                                  {t(K + 'upToInvalid')}
                                </span>
                              ) : null}
                            </>
                          )}
                        </div>

                        <div className="min-w-[120px] flex-1">
                          <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted sm:hidden">
                            {t(K + 'turnCreditColumnLabel')}
                          </span>
                          <div
                            className={`flex h-11 items-center gap-1.5 rounded-lg border px-3 ${
                              showFieldErrors && rowCreditInvalid(index)
                                ? 'border-nexoraDanger bg-red-50'
                                : 'border-nexoraBrand/10 bg-nexoraBrandSoft/30'
                            }`}
                          >
                            <input
                              type="number"
                              min={0}
                              max={MAX_TURN_CREDIT}
                              step="any"
                              inputMode="decimal"
                              disabled={!canManage}
                              value={row.turnCredit}
                              onChange={(event) => updateRow(index, { turnCredit: event.target.value })}
                              placeholder={t(K + 'creditPlaceholder')}
                              aria-label={t(K + 'tierCreditAria', { range: describeRange(index) })}
                              className="w-full bg-transparent text-center text-sm font-medium text-nexoraBrandDark focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span className="shrink-0 text-[10px] font-bold text-nexoraMuted">{t(K + 'turnsUnit')}</span>
                          </div>
                          {showFieldErrors && rowCreditInvalid(index) ? (
                            <span className="mt-1 block text-[11px] font-bold text-nexoraDanger">
                              {t(K + 'creditInvalid', { max: MAX_TURN_CREDIT })}
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          disabled={!canManage || rows.length === 1}
                          onClick={() => removeRange(index)}
                          aria-label={t(K + 'removeRangeAria', { range: describeRange(index) })}
                          className="flex h-9 w-9 shrink-0 items-center justify-center self-center rounded-lg text-nexoraMuted hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <button
                type="button"
                disabled={!canManage}
                onClick={addRange}
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-3.5 w-3.5" />
                {t(K + 'addRange')}
              </button>

              <div className="flex items-start gap-2 text-[11px] font-medium text-nexoraMuted">
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>
                  <span className="block font-medium text-nexoraMuted">{t(K + 'serviceValueNoteTitle')}</span>
                  {t(K + 'serviceValueNoteDetail')}
                </span>
              </div>

              {creditsDecrease ? (
                <p className="rounded-lg border border-nexoraWarning/40 bg-amber-50 p-2.5 text-[11px] font-bold text-nexoraWarning">
                  {t(K + 'decreasingCreditsWarning')}
                </p>
              ) : null}

              {saveError ? (
                <p role="alert" className="text-xs font-bold text-nexoraDanger">
                  {saveError}
                </p>
              ) : null}

              {!canManage ? (
                <p className="text-[11px] font-bold text-nexoraMuted">{t(K + 'readOnlyNote')}</p>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-4 flex shrink-0 items-center justify-between gap-3 border-t border-nexoraBorder pt-4">
          <div className="flex min-w-0 items-start gap-2 text-[11px] font-medium text-nexoraMuted">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="min-w-0">
              <span className="block font-medium text-nexoraMuted">{t(K + 'appliesToNewTurnsTitle')}</span>
              {t(K + 'recordedTurnsNote')}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-nexoraBorder px-4 text-sm font-bold text-nexoraText hover:bg-nexoraCanvas"
            >
              {t(K + 'cancel')}
            </button>
            {canManage ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={updateTurnSettings.isPending}
                className="flex h-11 items-center gap-2 rounded-lg bg-nexoraBrand px-5 text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
              >
                {updateTurnSettings.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {t(K + 'save')}
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
