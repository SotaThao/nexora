// Time Clock tab of the POS Front Desk: rotating clock-in QR on top, the day's roster on the left,
// day log and beep history on the right.
//
// "Today" is the device's local day (the iPad sits in the salon) resolved once per mount and again
// whenever the roster polls — the window is recomputed on each render so an iPad left open
// overnight rolls onto the new day by itself.
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useTimeClockLog, useTimeClockRoster } from '../../../../../data/hooks/usePosTimeClock'
import { useMerchantBeepFeed } from '../../../../../data/hooks/usePosBeep'
import { SkeletonList } from '../../../../ui/skeleton'
import BeepHistoryPanel from './BeepHistoryPanel'
import ClockQrPanel from './ClockQrPanel'
import PushedNotificationsPanel from './PushedNotificationsPanel'
import TimeClockRoster from './TimeClockRoster'
import TodayLogPanel from './TodayLogPanel'
import { getLocalDayWindow } from './timeClockDay'
import { tk } from './timeClockI18n'

export default function TimeClockTab({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const dayWindow = getLocalDayWindow()
  const { data: roster, isLoading: isRosterLoading } = useTimeClockRoster(businessId, dayWindow)
  const { data: log = [] } = useTimeClockLog(businessId, dayWindow)
  // Beep state comes from its own polled feed, not the roster: the roster is one row per staff
  // member and cannot carry several calls to the same tech, each with its own reply.
  const { data: beeps = [] } = useMerchantBeepFeed(businessId, dayWindow)
  const latestBeepByStaffId = new Map(
    [...beeps].reverse().map((beep) => [beep.posStaffProfileId, beep]),
  )

  return (
    <div className="space-y-4">
      <ClockQrPanel businessId={businessId} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          {isRosterLoading && !roster ? (
            <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-6">
              <SkeletonList count={4} lines={2} />
            </div>
          ) : (
            <TimeClockRoster
              businessId={businessId}
              rows={roster?.rows ?? []}
              onShiftCount={roster?.onShiftCount ?? 0}
              beepByStaffId={latestBeepByStaffId}
            />
          )}
        </div>

        <div className="space-y-4">
          <PushedNotificationsPanel rows={roster?.rows ?? []} />
          <BeepHistoryPanel beeps={beeps} />
          <TodayLogPanel entries={log} />
        </div>
      </div>

      <p className="px-0.5 text-[11px] text-nexoraMuted">
        {t(tk('subtitle'))}
      </p>
    </div>
  )
}
