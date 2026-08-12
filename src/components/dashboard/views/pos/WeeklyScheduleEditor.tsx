// WeeklyScheduleEditor — shared presentational "7 rows x day" editor (toggle
// working/off + start/end time), generalized from the day-row UI the
// Business Hours section (now part of PosGeneralSettingsView, US-014/US-02)
// built first for the business's own hours. Only new callers (Staff Weekly
// Schedule, US-09) use this shared version, to avoid regressing that screen.
import ToggleSwitch from '../../../ui/ToggleSwitch'

export interface WeeklyScheduleEditorDay {
  dayOfWeek: string // "Sunday".."Saturday"
  isWorking: boolean
  startTime: string // "HH:mm", empty when not working
  endTime: string
  error?: string
}

interface WeeklyScheduleEditorProps {
  days: WeeklyScheduleEditorDay[]
  dayLabel: (dayOfWeek: string) => string
  offLabel: string
  errorMessage: (error: string) => string
  onToggleWorking: (dayOfWeek: string) => void
  onChangeStart: (dayOfWeek: string, value: string) => void
  onChangeEnd: (dayOfWeek: string, value: string) => void
}

export default function WeeklyScheduleEditor({
  days,
  dayLabel,
  offLabel,
  errorMessage,
  onToggleWorking,
  onChangeStart,
  onChangeEnd,
}: WeeklyScheduleEditorProps) {
  const inputClass = (error?: string) =>
    `mt-1 h-10 w-full rounded-lg border bg-nexoraCanvas focus:bg-white px-3.5 text-xs text-nexoraText outline-none transition-all ${
      error
        ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
        : 'border-nexoraBorder focus:border-nexoraBrand'
    }`

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div
          key={day.dayOfWeek}
          className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-t border-slate-50 first:border-t-0"
        >
          <div className="flex items-center gap-2 sm:w-32 shrink-0">
            <ToggleSwitch
              checked={day.isWorking}
              onChange={() => onToggleWorking(day.dayOfWeek)}
              ariaLabel={`Toggle ${dayLabel(day.dayOfWeek)} working`}
              activeColor="bg-emerald-500"
              inactiveColor="bg-slate-300"
            />
            <span className="text-xs font-bold text-nexoraText">{dayLabel(day.dayOfWeek)}</span>
          </div>
          {day.isWorking ? (
            <div className="flex items-center gap-2">
              <input
                type="time"
                aria-label={`${dayLabel(day.dayOfWeek)} start time`}
                className={inputClass(day.error)}
                value={day.startTime}
                onChange={(e) => onChangeStart(day.dayOfWeek, e.target.value)}
              />
              <span className="text-nexoraMuted text-xs">–</span>
              <input
                type="time"
                aria-label={`${dayLabel(day.dayOfWeek)} end time`}
                className={inputClass(day.error)}
                value={day.endTime}
                onChange={(e) => onChangeEnd(day.dayOfWeek, e.target.value)}
              />
            </div>
          ) : (
            <span className="text-[11px] font-medium italic text-nexoraMuted">{offLabel}</span>
          )}
          {day.error && (
            <p role="alert" className="mt-1 text-[10px] font-bold text-rose-500">
              {errorMessage(day.error)}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}
