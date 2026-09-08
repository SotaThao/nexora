// Read-only day log next to the roster. Correcting a wrong time is deliberately not here — that
// lives with Weekly Payroll, where the hours actually get paid.
import { ScrollText } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosClockSource } from '../../../../../constants/posClockSource'
import type { TimeClockLogEntryApiDto } from '../../../../../types/repositories'
import { formatPosTime } from '../posDateTime'
import { formatHours } from './timeClockDay'
import { tk } from './timeClockI18n'

export default function TodayLogPanel({ entries }: { entries: TimeClockLogEntryApiDto[] }) {
  const { t, currentLanguage } = useTranslation()

  return (
    <section className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-nexoraText">
        <ScrollText className="h-4 w-4 text-nexoraBrand" />
        {t(tk('logTitle'))}
      </h3>

      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-nexoraMuted">
          {t(tk('logEmpty'))}
        </p>
      ) : (
        <ul className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {entries.map((entry) => (
            <li key={entry.id} className="border-b border-nexoraBorder pb-2 last:border-0 last:pb-0">
              <p className="text-xs font-bold text-nexoraText">{entry.displayName}</p>
              <p className="text-[11px] font-semibold text-nexoraText">
                {entry.isOpen
                  ? `${t(tk('inSince'), {
                      time: formatPosTime(entry.clockInAt, currentLanguage),
                    })} · ${t(tk('logOnShift'))}`
                  : t(tk('logLine'), {
                      inTime: formatPosTime(entry.clockInAt, currentLanguage),
                      outTime: formatPosTime(entry.clockOutAt, currentLanguage),
                      hours: formatHours(entry.hours),
                    })}
              </p>
              {entry.clockOutSource === PosClockSource.AutoClose ? (
                <p className="text-[11px] font-bold text-nexoraWarning">
                  {t(tk('logAutoClosed'))}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
