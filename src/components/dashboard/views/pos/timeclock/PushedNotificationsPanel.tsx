// "Pushed to Staff app" — who the front desk beeped today, newest first. Derived from the roster's
// lastBeepAt rather than a second endpoint: the beep itself is stored as a notification, and the
// roster query already reports the most recent one per tech.
import { Bell } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { TimeClockRosterRowApiDto } from '../../../../../types/repositories'
import { formatPosTime } from '../posDateTime'
import { tk } from './timeClockI18n'

export default function PushedNotificationsPanel({ rows }: { rows: TimeClockRosterRowApiDto[] }) {
  const { t, currentLanguage } = useTranslation()

  const beeped = rows
    .filter((row) => Boolean(row.lastBeepAt))
    .sort((a, b) => new Date(b.lastBeepAt as string).getTime() - new Date(a.lastBeepAt as string).getTime())

  return (
    <section className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-nexoraText">
        <Bell className="h-4 w-4 text-nexoraBrand" />
        {t(tk('pushTitle'))}
      </h3>

      {beeped.length === 0 ? (
        <p className="mt-3 text-xs text-nexoraMuted">
          {t(tk('pushEmpty'))}
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {beeped.map((row) => (
            <li key={row.posStaffProfileId} className="text-[11px] text-nexoraMuted">
              {t(tk('pushLine'), {
                name: row.displayName,
                time: formatPosTime(row.lastBeepAt, currentLanguage),
              })}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
