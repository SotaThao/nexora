// The day's beeps with what came back. Sits alongside the older "Pushed to Staff app" panel, which
// is derived from the roster's lastBeepAt and therefore can only ever show one line per tech with
// no message and no reply — this panel is the same events read from the beep feed, so three calls
// to the same tech show as three rows and each carries its answer.
import { BellRing } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosBeepApiDto } from '../../../../../types/repositories'
import { useElapsedLabel } from '../../../../../hooks/useElapsedLabel'
import { formatPosTime } from '../posDateTime'
import PosBeepStatusPill from './PosBeepStatusPill'
import { tk } from './timeClockI18n'

export default function BeepHistoryPanel({ beeps }: { beeps: PosBeepApiDto[] }) {
  const { t, currentLanguage } = useTranslation()
  const elapsedLabel = useElapsedLabel()

  return (
    <section className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-nexoraText">
        <BellRing className="h-4 w-4 text-nexoraBrand" />
        {t(tk('beepHistoryTitle'))}
      </h3>

      {beeps.length === 0 ? (
        <p className="mt-3 text-xs text-nexoraMuted">{t(tk('beepHistoryEmpty'))}</p>
      ) : (
        <ul className="mt-3 max-h-[320px] space-y-3 overflow-y-auto pr-1">
          {beeps.map((beep) => (
            <li key={beep.beepId} className="border-b border-nexoraBorder/60 pb-2.5 last:border-0 last:pb-0">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[11px] font-extrabold text-nexoraText">
                  {beep.staffDisplayName}
                </p>
                <span className="shrink-0 text-[10px] text-nexoraSubtle">
                  {formatPosTime(beep.beepedAt, currentLanguage)} ·{' '}
                  {t(tk('beepHistorySentAgo'), { ago: elapsedLabel(beep.beepedAt) })}
                </span>
              </div>

              <p className="mt-0.5 text-[11px] text-nexoraMuted">
                {beep.message?.trim() || t(tk('beepHistoryNoMessage'))}
              </p>

              <div className="mt-1">
                <PosBeepStatusPill beep={beep} />
              </div>

              {/* Explains a beep that will never be answered, rather than leaving the front desk
                  waiting on a tech who has no app account to receive it. */}
              {!beep.hasAppAccount ? (
                <p className="mt-1 text-[11px] font-bold text-rose-600">
                  {t(tk('beepHistoryNoAppAccount'))}
                </p>
              ) : null}

              {beep.sentByDisplayName ? (
                <p className="mt-1 text-[10px] text-nexoraSubtle">
                  {t(tk('beepHistorySentBy'), { name: beep.sentByDisplayName })}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
