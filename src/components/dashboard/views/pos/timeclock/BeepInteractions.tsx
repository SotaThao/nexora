// The beep block the front desk reads and acts on: status pill, Nudge, Resolve.
//
// It all lives in the Beeper cell rather than the Actions column on purpose. Actions already holds
// Clock in/out + Beep, and on an iPad in portrait a third button there wraps badly — while the
// Beeper cell sits empty for most of the day. Rendering here also means the existing Beep button,
// its modal and its handler are left completely alone.
//
// Nudge has no modal: one tap re-rings with the message the original beep already carried. It calls
// the same send endpoint, which the server treats as a nudge when the tech still has an open call,
// so there is one rate limit and no second code path.
import { BellRing, Check, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { useNudgeBeep, useResolveBeep } from '../../../../../data/hooks/usePosBeep'
import type { PosBeepApiDto } from '../../../../../types/repositories'
import { beepCooldownUntil, useCooldownSeconds } from './beepCooldown'
import PosBeepStatusPill from './PosBeepStatusPill'
import { tk } from './timeClockI18n'

const ACTION_BUTTON =
  'flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition-colors disabled:opacity-60'

export default function BeepInteractions({
  businessId,
  beep,
  staffName,
}: {
  businessId: string
  beep: PosBeepApiDto | undefined
  staffName: string
}) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const nudge = useNudgeBeep(businessId)
  const resolve = useResolveBeep(businessId)

  // The ticker hook has to sit above the early return; it takes 0 and idles when there is no beep.
  const cooldownUntil = beepCooldownUntil(beep)
  const secondsLeft = useCooldownSeconds(cooldownUntil)

  // No beep for this tech today — the Beeper cell keeps whatever it showed before.
  if (!beep) return null

  // Re-enable as soon as the countdown hits zero instead of waiting for the poll to flip
  // `canNudge`. Only a cooldown we actually knew about clears the button: `canNudge: false` with no
  // `nextNudgeAllowedAt` means the server refused for another reason and stays refused.
  const cooldownElapsed = cooldownUntil > 0 && secondsLeft === 0
  const canNudgeNow = (beep.canNudge || cooldownElapsed) && !nudge.isPending
  const isBusy = nudge.isPending || resolve.isPending

  const handleNudge = async () => {
    if (isBusy) return
    try {
      await nudge.mutateAsync({ posStaffProfileId: beep.posStaffProfileId })
      showToast(t(tk('beepNudgeSent'), { name: staffName }))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const handleResolve = async () => {
    if (isBusy) return
    const confirmed = await showConfirm(
      t(tk('beepResolveConfirmBody'), { name: staffName }),
      t(tk('beepResolveConfirmTitle')),
    )
    if (!confirmed) return

    try {
      await resolve.mutateAsync({ beepId: beep.beepId })
      showToast(t(tk('beepResolveSuccess'), { name: staffName }))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  return (
    <div className="mt-1 space-y-1.5">
      <PosBeepStatusPill beep={beep} />

      {beep.canResolve ? (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={handleNudge}
            disabled={!canNudgeNow || isBusy}
            aria-label={t(tk('beepNudgeAria'), { name: staffName })}
            className={`${ACTION_BUTTON} border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-300 hover:bg-amber-100`}
          >
            {nudge.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <BellRing className="h-3 w-3" />
            )}
            {secondsLeft > 0
              ? t(tk('beepNudgeCooldown'), { seconds: secondsLeft })
              : t(tk('beepNudge'))}
          </button>

          <button
            type="button"
            onClick={handleResolve}
            disabled={isBusy}
            aria-label={t(tk('beepResolveAria'), { name: staffName })}
            className={`${ACTION_BUTTON} border-nexoraBorder bg-white text-nexoraMuted hover:border-nexoraBrand hover:text-nexoraBrandDark`}
          >
            {resolve.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" />
            )}
            {t(tk('beepResolve'))}
          </button>
        </div>
      ) : null}
    </div>
  )
}
