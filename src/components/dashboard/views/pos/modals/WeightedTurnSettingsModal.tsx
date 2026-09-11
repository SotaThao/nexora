// Weighted Turn Settings — how much a turn is worth for each service-value band, plus the
// default booking turn credit. Opened from the Turn Board and from the Bookings calendar; both
// entry points render THIS component against the same endpoint, so the salon only ever maintains
// one set of numbers.
//
// Two rules the copy in here is not decoration:
//  - the service value is what the customer pays (discounts included, tips/tax/products/gift
//    cards excluded), which is why the note sits above the bands;
//  - credit already recorded on a paid visit never changes, which is why changing these numbers
//    is safe mid-shift.
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useTurnSettings, useUpdateTurnSettings } from '../../../../../data/hooks/usePosTurnSettings'
import { SkeletonList } from '../../../../ui/skeleton'
import type { PosTurnTierApiDto } from '../../../../../types/repositories'

const K = 'components.dashboard.views.pos.WeightedTurnSettingsModal.'

const MAX_TURN_CREDIT = 100

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
})

/**
 * Band label built from the thresholds themselves rather than four hardcoded strings, so opening
 * the thresholds for editing later does not need this component rewritten. The upper bound is the
 * next band's threshold minus a cent; the last band is open-ended.
 */
function tierLabel(tiers: readonly PosTurnTierApiDto[], index: number) {
  const from = tiers[index].thresholdAmount
  const next = tiers[index + 1]?.thresholdAmount
  return next === undefined
    ? `${currency.format(from)}+`
    : `${currency.format(from)}–${currency.format(next - 0.01)}`
}

/** Empty string is kept as-is so a cleared field reads as "required", not as zero. */
function isValidCredit(value: string) {
  if (value.trim() === '') return false
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= MAX_TURN_CREDIT
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

  const [bookingTurnCredit, setBookingTurnCredit] = useState('')
  const [tierCredits, setTierCredits] = useState<string[]>([])
  const [showFieldErrors, setShowFieldErrors] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Seeded from the server response rather than held as initial state, so re-opening the modal
  // always shows what is actually in force.
  useEffect(() => {
    if (!data) return
    setBookingTurnCredit(String(data.bookingTurnCredit))
    setTierCredits(data.serviceTurnTiers.map((tier) => String(tier.turnCredit)))
    setShowFieldErrors(false)
    setSaveError('')
  }, [data])

  const tiers = data?.serviceTurnTiers ?? []
  const canManage = data?.canManage ?? false

  const bookingCreditInvalid = !isValidCredit(bookingTurnCredit)
  const tierCreditInvalid = (index: number) => !isValidCredit(tierCredits[index] ?? '')
  const hasInvalidField = bookingCreditInvalid || tiers.some((_, index) => tierCreditInvalid(index))

  // A caution, never a block: a salon may deliberately give small jobs more credit so nobody is
  // left with only cheap work.
  const creditsDecrease = tierCredits.some((value, index) => {
    if (index === 0) return false
    const previous = Number(tierCredits[index - 1])
    const current = Number(value)
    return Number.isFinite(previous) && Number.isFinite(current) && current < previous
  })

  const handleSave = async () => {
    setSaveError('')
    if (hasInvalidField) {
      setShowFieldErrors(true)
      return
    }

    try {
      await updateTurnSettings.mutateAsync({
        bookingTurnCredit: Number(bookingTurnCredit),
        serviceTurnTiers: tiers.map((tier, index) => ({
          thresholdAmount: tier.thresholdAmount,
          turnCredit: Number(tierCredits[index]),
        })),
      })
      onClose()
    } catch {
      // Deliberately worded as "not applied" and kept separate from field validation: the one
      // thing a manager must never do is walk away believing new rules are live when they are not.
      setSaveError(t(K + 'saveFailed'))
    }
  }

  const creditInputClass = (invalid: boolean) =>
    `h-11 w-24 rounded-lg border px-3 text-sm font-bold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30 ${
      invalid ? 'border-nexoraDanger bg-red-50' : 'border-nexoraBorder bg-nexoraSurface'
    }`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="nexora-modal-card w-full max-w-xl">
        <div className="shrink-0">
          <h3 className="text-base font-extrabold text-nexoraText">{t(K + 'title')}</h3>
          <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(K + 'description')}</p>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto">
          {isLoading ? (
            <SkeletonList count={5} lines={1} />
          ) : isError || !data ? (
            <p className="text-xs font-bold text-nexoraDanger">{t(K + 'loadFailed')}</p>
          ) : (
            <div className="space-y-4">
              <label className="block">
                <span className="text-xs font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t(K + 'bookingTurnCreditLabel')}
                </span>
                <input
                  type="number"
                  min={0}
                  max={MAX_TURN_CREDIT}
                  step="any"
                  inputMode="decimal"
                  disabled={!canManage}
                  value={bookingTurnCredit}
                  onChange={(event) => setBookingTurnCredit(event.target.value)}
                  placeholder={t(K + 'creditPlaceholder')}
                  className={`mt-1 block ${creditInputClass(showFieldErrors && bookingCreditInvalid)}`}
                />
                {showFieldErrors && bookingCreditInvalid ? (
                  <span className="mt-1 block text-[11px] font-bold text-nexoraDanger">
                    {t(K + 'creditInvalid', { max: MAX_TURN_CREDIT })}
                  </span>
                ) : null}
                <span className="mt-1 block text-[11px] font-medium text-nexoraMuted">
                  {t(K + 'bookingTurnCreditHint')}
                </span>
              </label>

              <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3">
                <span className="text-xs font-extrabold uppercase tracking-wide text-nexoraMuted">
                  {t(K + 'serviceTiersLabel')}
                </span>
                <div className="mt-2 space-y-2">
                  {tiers.map((tier, index) => (
                    <div
                      key={tier.thresholdAmount}
                      className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_auto]"
                    >
                      <span className="text-sm font-bold text-nexoraText">
                        {tierLabel(tiers, index)}
                      </span>
                      <div>
                        <input
                          type="number"
                          min={0}
                          max={MAX_TURN_CREDIT}
                          step="any"
                          inputMode="decimal"
                          disabled={!canManage}
                          value={tierCredits[index] ?? ''}
                          onChange={(event) => {
                            const next = event.target.value
                            setTierCredits((current) =>
                              current.map((value, position) => (position === index ? next : value)),
                            )
                          }}
                          placeholder={t(K + 'creditPlaceholder')}
                          aria-label={t(K + 'tierCreditAria', { range: tierLabel(tiers, index) })}
                          className={creditInputClass(showFieldErrors && tierCreditInvalid(index))}
                        />
                        {showFieldErrors && tierCreditInvalid(index) ? (
                          <span className="mt-1 block text-[11px] font-bold text-nexoraDanger">
                            {t(K + 'creditInvalid', { max: MAX_TURN_CREDIT })}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {creditsDecrease ? (
                <p className="rounded-lg border border-nexoraWarning/40 bg-amber-50 p-2.5 text-[11px] font-bold text-nexoraWarning">
                  {t(K + 'decreasingCreditsWarning')}
                </p>
              ) : null}

              <p className="text-[11px] font-medium text-nexoraMuted">{t(K + 'recordedTurnsNote')}</p>

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

        <div className="mt-4 flex shrink-0 justify-end gap-2">
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
              {updateTurnSettings.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t(K + 'save')}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
