// One place that turns a beep status into a pill. Rendered from four call sites (roster table,
// roster card, Turn Board station card, beep history panel) — if the status/colour/copy mapping
// drifted between them the front desk would read something untrue about a tech, so it is a single
// presentational component rather than repeated JSX.
//
// Amber for "waiting" deliberately matches the amber Beep button: it means someone still owes an
// answer. Sky moves to Delayed, where "acknowledged but not here yet" is information rather than
// something to act on.
import { Bell, BellOff, BellRing, Check, Clock, XCircle } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosStaffBeepStatus, isDelayLapsed } from '../../../../../constants/posStaffBeep'
import type { PosBeepApiDto } from '../../../../../types/repositories'
import { parseApiDateTime } from '../../../utils'
import { useElapsedLabel } from '../../../../../hooks/useElapsedLabel'
import { formatPosTime } from '../posDateTime'
import { tk } from './timeClockI18n'

const PILL_BASE = 'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-extrabold'

type PillTone = 'amber' | 'emerald' | 'sky' | 'rose' | 'slate' | 'slateMuted'

const TONE_CLASS: Record<PillTone, string> = {
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  sky: 'border-sky-200 bg-sky-50 text-sky-700',
  rose: 'border-rose-200 bg-rose-50 text-rose-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-600',
  slateMuted: 'border-slate-200 bg-slate-50 text-slate-400',
}

export default function PosBeepStatusPill({ beep }: { beep: PosBeepApiDto }) {
  const { t, currentLanguage } = useTranslation()
  const elapsedLabel = useElapsedLabel()

  const respondedAt = parseApiDateTime(beep.respondedAt)
  const delayLapsed = isDelayLapsed(beep.status, respondedAt, beep.delayMinutes)

  let tone: PillTone = 'slate'
  let Icon = Bell
  let label = ''
  let secondLine: string | null = null

  switch (beep.status) {
    case PosStaffBeepStatus.Sent:
      tone = 'amber'
      Icon = BellRing
      label = t(tk('beepStatusWaiting'), { ago: elapsedLabel(beep.beepedAt) })
      break
    case PosStaffBeepStatus.Acknowledged:
      tone = 'emerald'
      Icon = Check
      label = t(tk('beepStatusOnMyWay'), { time: formatPosTime(beep.respondedAt, currentLanguage) })
      break
    case PosStaffBeepStatus.Delayed:
      tone = delayLapsed ? 'rose' : 'sky'
      Icon = Clock
      label = delayLapsed
        ? t(tk('beepStatusBusyOverdue'), { minutes: beep.delayMinutes ?? 0 })
        : t(tk('beepStatusBusy'), { minutes: beep.delayMinutes ?? 0 })
      if (!delayLapsed && respondedAt && beep.delayMinutes) {
        const backBy = new Date(respondedAt.getTime() + beep.delayMinutes * 60_000)
        secondLine = t(tk('beepStatusBusyBackBy'), {
          time: formatPosTime(backBy.toISOString(), currentLanguage),
        })
      }
      break
    case PosStaffBeepStatus.Declined:
      tone = 'rose'
      Icon = XCircle
      label = t(tk('beepStatusDeclined'))
      break
    case PosStaffBeepStatus.Expired:
      tone = 'slate'
      Icon = BellOff
      label = t(tk('beepStatusExpired'), { time: formatPosTime(beep.beepedAt, currentLanguage) })
      break
    case PosStaffBeepStatus.Resolved:
      tone = 'slateMuted'
      Icon = Check
      label = t(tk('beepStatusResolved'), { time: formatPosTime(beep.resolvedAt, currentLanguage) })
      break
    default:
      return null
  }

  return (
    <div className="space-y-0.5">
      <span className={`${PILL_BASE} ${TONE_CLASS[tone]}`}>
        <Icon className="h-3 w-3" />
        {label}
      </span>

      {secondLine ? <p className="text-[11px] text-nexoraMuted">{secondLine}</p> : null}

      {beep.nudgeCount > 0 ? (
        <p className="text-[11px] font-bold text-amber-700">
          {t(tk('beepNudgeCount'), { count: beep.nudgeCount })}
        </p>
      ) : null}

      {/* Full note in the tooltip — a tech's reason can be longer than the cell. */}
      {beep.responseNote ? (
        <p className="line-clamp-2 text-[11px] text-nexoraMuted" title={beep.responseNote}>
          {beep.responseNote}
        </p>
      ) : null}
    </div>
  )
}
