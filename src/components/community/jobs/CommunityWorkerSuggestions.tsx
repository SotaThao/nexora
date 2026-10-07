import { Check, MapPin, ShieldCheck, Sparkles } from 'lucide-react'

import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'

const TK = 'community_jobs_browser.suggestions'
const SUGGESTIONS = [
  { id: 'vy', initials: 'VT', match: 100 },
  { id: 'lan', initials: 'CL', match: 100 },
  { id: 'linda', initials: 'LV', match: 75 },
] as const

interface CommunityWorkerSuggestionsProps {
  invitedIds: ReadonlySet<string>
  onInvite: (id: string) => void
}

export default function CommunityWorkerSuggestions({ invitedIds, onInvite }: CommunityWorkerSuggestionsProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const inviteWorker = (id: string) => {
    if (invitedIds.has(id)) return
    onInvite(id)
    showToast(t(`${TK}.inviteFeedback`, { name: t(`${TK}.workers.${id}.name`) }), 'success', 4000)
  }

  return (
    <section aria-labelledby="community-worker-suggestions-title" className="rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/30 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 shrink-0 text-nexoraBrand" aria-hidden />
        <h2 id="community-worker-suggestions-title" className="text-lg font-black text-nexoraText">{t(`${TK}.title`)}</h2>
        <span className="rounded-md border border-nexoraBorder px-2 py-1 text-xs font-bold text-nexoraMuted">{t(`${TK}.demoLabel`)}</span>
      </div>
      <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-nexoraMuted">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>{t(`${TK}.privacyHint`)}</span>
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        {SUGGESTIONS.map((worker) => {
          const key = `${TK}.workers.${worker.id}`
          const invited = invitedIds.has(worker.id)
          return (
            <article key={worker.id} aria-label={t(`${key}.name`)} className="min-w-0 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card">
              <div className="flex items-center gap-3">
                <span aria-hidden className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraBrandSoft text-sm font-black text-nexoraBrand">{worker.initials}</span>
                <h3 className="min-w-0 flex-1 text-sm font-black text-nexoraText">{t(`${key}.name`)}</h3>
                <span className="rounded-full bg-nexoraSuccess/10 px-2 py-1 text-xs font-black text-nexoraText" aria-label={t(`${TK}.matchLabel`, { percent: worker.match })}>{worker.match}%</span>
              </div>
              <p className="mt-3 flex items-center gap-1 text-xs text-nexoraMuted"><MapPin className="h-3.5 w-3.5" aria-hidden />{t(`${key}.location`)} · {t(`${key}.experience`)}</p>
              <p className="mt-2 min-h-10 text-xs font-semibold leading-5 text-nexoraText">{t(`${key}.skills`)}</p>
              <button type="button" disabled={invited} onClick={() => inviteWorker(worker.id)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-black text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 disabled:cursor-default disabled:opacity-60">
                {invited ? <Check className="h-4 w-4" aria-hidden /> : null}{t(`${TK}.${invited ? 'invited' : 'invite'}`)}
              </button>
              <details className="mt-2 rounded-lg border border-nexoraBorder">
                <summary className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg px-3 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">{t(`${TK}.profile`)}</summary>
                <div className="space-y-2 border-t border-nexoraRule p-3 text-xs leading-5 text-nexoraMuted">
                  <p className="font-bold text-nexoraText">{t(`${TK}.profileTitle`, { name: t(`${key}.name`) })}</p>
                  <p>{t(`${key}.bio`)}</p>
                  <p>{t(`${key}.availability`)}</p>
                  <p>{t(`${TK}.demoHint`)}</p>
                </div>
              </details>
            </article>
          )
        })}
      </div>
    </section>
  )
}
