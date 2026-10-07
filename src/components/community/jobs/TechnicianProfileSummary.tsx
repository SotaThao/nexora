import { useTranslation } from '../../../contexts/LanguageContext'
import { technicianProfileCompletion, type PublicTechnicianProfile } from './technicianProfileModel'

import TechnicianPortfolioTile from './TechnicianPortfolioTile'

const TK = 'community_jobs_browser.technicianProfile'

export default function TechnicianProfileSummary({ profile }: { profile: PublicTechnicianProfile }) {
  const { t } = useTranslation()
  const completion = technicianProfileCompletion(profile)
  return (
    <aside className="min-w-0 space-y-4" aria-label={t(`${TK}.previewTitle`)}>
      <section className="overflow-hidden rounded-xl border border-nexoraBorder bg-white p-4 shadow-nexora-card">
        <div className="relative h-24 rounded-xl bg-gradient-to-r from-nexoraBrand to-nexoraViolet">
          {profile.lookingForWork ? <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-bold text-nexoraSuccess">{t(`${TK}.lookingBadge`)}</span> : null}
        </div>
        <span aria-hidden className="relative -mt-10 ml-3 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-nexoraBrand text-2xl font-black text-white">{profile.displayName.trim().slice(0, 1).toUpperCase() || '?'}</span>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h2 className="break-words text-base font-black text-nexoraText">{profile.displayName.trim() || t(`${TK}.noName`)}</h2>
          <span className="rounded bg-nexoraBrandSoft px-2 py-1 text-[10px] font-bold text-nexoraBrand">{t(`${TK}.unverified`)}</span>
        </div>
        <p className="mt-1 text-xs leading-5 text-nexoraMuted">{profile.city || t(`${TK}.noLocation`)} · {profile.experience ? t(`${TK}.experience.${profile.experience}`) : t(`${TK}.noExperience`)}</p>
        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-nexoraMuted"><span>{t(`${TK}.completion`)}</span><strong className="text-nexoraBrand">{completion}%</strong></div>
        <div role="progressbar" aria-label={t(`${TK}.completion`)} aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion} className="mt-1 h-2 overflow-hidden rounded-full bg-nexoraBrandSoft"><div className="h-full rounded-full bg-nexoraBrand" style={{ width: `${completion}%` }} /></div>
        {profile.skills.length ? <div className="mt-3 flex flex-wrap gap-1.5">{profile.skills.map((skill) => <span key={skill} className="rounded-md bg-nexoraBrandSoft px-2 py-1 text-xs font-semibold text-nexoraBrand">{t(`components.dashboard.views.pos.recruitment.enums.skill.${skill}`)}</span>)}</div> : null}
        {profile.portfolio.length ? <div className="mt-3 grid grid-cols-3 gap-2" aria-label={t(`${TK}.portfolioTitle`)}>{profile.portfolio.map((photo, index) => <span key={`${photo}-${index}`} className="grid aspect-square place-items-center rounded-lg border border-nexoraBorder bg-nexoraSurfaceMuted text-2xl" role="img" aria-label={t(`${TK}.demoPhoto`, { index: index + 1 })}><TechnicianPortfolioTile sample={photo} /></span>)}</div> : null}
      </section>
      <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-nexora-card">
        <div className="flex items-center justify-between gap-2"><h2 className="text-sm font-black text-nexoraText">{t(`${TK}.invitations`)}</h2><span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-600">0</span></div>
        <p className="mt-3 text-xs text-nexoraMuted">{t(`${TK}.noInvitations`)}</p>
      </section>
    </aside>
  )
}
