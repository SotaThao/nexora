import { useTranslation } from '../../../contexts/LanguageContext'
import { TWELVE_HOUR_INPUT_LANG } from '../../../constants/timeFormat'
import { TechScheduleTimeBox } from './TechnicianFormControls'

interface ScheduleDay {
  id: string
  label: string
  dayOff: boolean
  start: string
  end: string
  error?: string
}

export default function TechnicianWeeklySchedule({ days, onDayOffChange, onTimeChange }: {
  days: ScheduleDay[]
  onDayOffChange: (id: string, off: boolean) => void
  onTimeChange: (id: string, field: 'start' | 'end', value: string) => void
}) {
  const { t } = useTranslation()
  const TK = 'components.dashboard.views.BookingHubView.team'
  return <>
    <div className="tech-schedule">
      {days.map((day) => (
        <div key={day.id} className={`tech-schedule-row ${day.dayOff ? 'is-day-off' : ''} ${day.error ? 'has-error' : ''}`}
          role="button" tabIndex={0}
          onClick={() => onDayOffChange(day.id, !day.dayOff)}
          onKeyDown={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onDayOffChange(day.id, !day.dayOff) }
          }}>
          <span className="tech-schedule-day">{day.label}</span>
          <label className="tech-schedule-off">
            <input className="tech-schedule-toggle" type="checkbox" checked={day.dayOff}
              aria-label={`${day.label} ${t(`${TK}.dayOff`)}`}
              onClick={(event) => event.stopPropagation()}
              onChange={(event) => onDayOffChange(day.id, event.target.checked)} />
            {t(`${TK}.dayOff`)}
          </label>
          <span className="tech-schedule-time" lang={TWELVE_HOUR_INPUT_LANG}>
            <TechScheduleTimeBox value={day.start} disabled={day.dayOff} invalid={Boolean(day.error)}
              ariaLabel={`${day.label} ${t(`${TK}.scheduleStartTimeLabel`)}`} onChange={(value) => onTimeChange(day.id, 'start', value)} />
            <span>{t(`${TK}.scheduleTo`)}</span>
            <TechScheduleTimeBox value={day.end} disabled={day.dayOff} invalid={Boolean(day.error)}
              ariaLabel={`${day.label} ${t(`${TK}.scheduleEndTimeLabel`)}`} onChange={(value) => onTimeChange(day.id, 'end', value)} />
          </span>
          {day.error && <span className="tech-schedule-row-error">{day.error}</span>}
        </div>
      ))}
    </div>
    {days.some((day) => day.error) && <div className="tech-schedule-error">{t(`${TK}.scheduleValidationSummary`)}</div>}
  </>
}
