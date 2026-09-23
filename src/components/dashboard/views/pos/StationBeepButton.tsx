// Split out from PosFrontDeskView so `useCooldownSeconds` (a hook) is called once per actual
// component instance instead of once per plain-function call inside `stations.map(renderStationCard)`
// — calling a hook from a function invoked a variable number of times per render breaks the Rules
// of Hooks. Shared by the Stations and Compact Turn Board views.
import { Bell, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { cannotReceiveBeep } from '../../../../constants/posStaffBeep'
import { beepCooldownUntil, useCooldownSeconds } from './timeclock/beepCooldown'
import type { PosBeepApiDto, TurnBoardStationApiDto } from '../../../../types/repositories'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'

export default function StationBeepButton({
  station,
  beep,
  isPending,
  isBeeping,
  onOpen,
}: {
  station: TurnBoardStationApiDto
  beep: PosBeepApiDto | undefined
  isPending: boolean
  isBeeping: boolean
  onOpen: (station: TurnBoardStationApiDto) => void
}) {
  const { t } = useTranslation()
  // A re-beep on a tech who already has an open call is a nudge on that same row server-side, so it
  // shares the Nudge button's rate limit — same cooldown data, same countdown behaviour.
  const cooldownUntil = beepCooldownUntil(beep)
  const secondsLeft = useCooldownSeconds(cooldownUntil)
  const onCooldown = secondsLeft > 0
  // Local staff / no email on file — no app to ring, so sending would always be undelivered. The
  // turn-board station carries its own isLocalStaff/email (unlike the roster, which has neither and
  // falls back to the check-in technician list).
  const blockedLocal = cannotReceiveBeep(station)

  return (
    <span title={blockedLocal ? t(TK + 'beepLocalStaffTooltip') : undefined} className="inline-flex">
      <button
        type="button"
        onClick={() => onOpen(station)}
        disabled={isPending || onCooldown || blockedLocal}
        aria-label={t(TK + 'beepAria', { name: station.displayName })}
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-extrabold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
      >
        {isBeeping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
        {isBeeping
          ? t(TK + 'beepPending')
          : onCooldown
            ? t(TK + 'beepCooldown', { seconds: secondsLeft })
            : t(TK + 'beep')}
      </button>
    </span>
  )
}
