// Shared "Check in" action for a technician who has not clocked in today. Mirrors
// StationBeepButton's shape (station + pending flag + onClick) so Cards and Compact can render it
// the same way. Reuses the Time Clock tab's own clockIn/clockOut mutation and label — this is the
// same action, just triggered from the Turn Board instead of the roster.
import { LogIn, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { TurnBoardStationApiDto } from '../../../../types/repositories'

const TIME_CLOCK_TK = 'components.dashboard.views.pos.TimeClock.'

export default function StationCheckInButton({
  station,
  isPending,
  isCheckingIn,
  onCheckIn,
}: {
  station: TurnBoardStationApiDto
  isPending: boolean
  isCheckingIn: boolean
  onCheckIn: (station: TurnBoardStationApiDto) => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={() => onCheckIn(station)}
      disabled={isPending}
      className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 text-[11px] font-extrabold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-100 disabled:opacity-60"
    >
      {isCheckingIn ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
      {t(TIME_CLOCK_TK + 'clockIn')}
    </button>
  )
}
