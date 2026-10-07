import { useState } from 'react'
import { ArrowLeft, ArrowRight, Plus, Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import type { SeekingPostUpsertInput } from '../../../types/communityJobs'
import TechnicianProfileSummary from './TechnicianProfileSummary'
import {
  createTechnicianProfile, publicTechnicianProfile, technicianProfileCompletion, technicianProfileDraft,
  PROFILE_CITIES, PROFILE_EXPERIENCES, PROFILE_LANGUAGES, PROFILE_LICENSES, PROFILE_PAY_PREFERENCES,
  PROFILE_PORTFOLIO, PROFILE_SKILLS, PROFILE_WORK_TYPES, type TechnicianProfile,
} from './technicianProfileModel'
import { readTechnicianProfile, saveTechnicianProfile } from './technicianProfileStore'

import TechnicianPortfolioTile from './TechnicianPortfolioTile'

const TK = 'community_jobs_browser.technicianProfile'
const fieldClass = 'mt-1.5 min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft'
const buttonClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:cursor-default disabled:opacity-50'

function toggle<T>(selected: T[], value: T): T[] { return selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value] }

function ChoiceChips<T extends string>({ label, options, selected, onChange, optionLabel }: { label: string; options: readonly T[]; selected: T[]; onChange: (values: T[]) => void; optionLabel: (value: T) => string }) {
  return <fieldset><legend className="text-xs font-bold text-nexoraText">{label}</legend><div className="mt-2 flex flex-wrap gap-2">{options.map((value) => <button key={value} type="button" aria-pressed={selected.includes(value)} onClick={() => onChange(toggle(selected, value))} className={`${buttonClass} ${selected.includes(value) ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'bg-white'}`}>{optionLabel(value)}</button>)}</div></fieldset>
}

interface CommunityTechnicianProfileProps {
  identity: string
  initialName: string
  editing: boolean
  browsing: boolean
  onEdit: () => void
  onSaved: () => void
  onDraft: (draft: SeekingPostUpsertInput, needsExperience: boolean) => void
}

export default function CommunityTechnicianProfile({ identity, initialName, editing, browsing, onEdit, onSaved, onDraft }: CommunityTechnicianProfileProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [initial] = useState(() => {
    try { return { ...readTechnicianProfile(identity, initialName), error: false } }
    catch { return { profile: createTechnicianProfile(initialName), step: 0, error: true } }
  })
  const [profile, setProfile] = useState(initial.profile)
  const [step, setStep] = useState(initial.step)
  const [storageError, setStorageError] = useState(initial.error)
  const publicProfile = publicTechnicianProfile(profile)
  const completion = technicianProfileCompletion(publicProfile)
  const update = (patch: Partial<TechnicianProfile>) => setProfile((current) => ({ ...current, ...patch }))
  const save = () => {
    try {
      saveTechnicianProfile(identity, profile, step)
      setStorageError(false)
      showToast(t(`${TK}.saved`), 'success', 3500)
      onSaved()
    } catch {
      setStorageError(true)
      showToast(t(`${TK}.saveFailed`), 'error', 4000)
    }
  }
  const steps = ['basic', 'skills', 'portfolio', 'preferences'] as const
  return (
    <section hidden={!editing && !browsing}>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-4">
        {editing ? (
          <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-nexora-card sm:p-5" aria-labelledby="technician-profile-title">
            <h1 id="technician-profile-title" className="text-base font-black text-nexoraText">{t(`${TK}.title`)} <span className="text-xs font-medium text-nexoraMuted">· {t(`${TK}.subtitle`)}</span></h1>
            <ol className="mt-4 grid grid-cols-4 gap-2">{steps.map((value, index) => <li key={value} aria-current={step === index ? 'step' : undefined} className="min-w-0 text-[11px] leading-5 text-nexoraMuted"><div className={`mb-1 h-1.5 rounded-full ${index <= step ? 'bg-nexoraBrand' : 'bg-nexoraBrandSoft'}`} />{index + 1}. {t(`${TK}.steps.${value}`)}</li>)}</ol>
            <div className="mt-5 space-y-4">
              {step === 0 ? <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-nexoraText">{t(`${TK}.displayName`)}<input className={fieldClass} maxLength={80} value={profile.displayName} onChange={(event) => update({ displayName: event.target.value })} /></label>
                  <label className="text-xs font-bold text-nexoraText">{t(`${TK}.experienceLabel`)}<select className={fieldClass} value={profile.experience} onChange={(event) => update({ experience: PROFILE_EXPERIENCES.find((value) => value === event.target.value) ?? '' })}><option value="">{t(`${TK}.choose`)}</option>{PROFILE_EXPERIENCES.map((value) => <option key={value} value={value}>{t(`${TK}.experience.${value}`)}</option>)}</select></label>
                  <label className="text-xs font-bold text-nexoraText">{t(`${TK}.cityLabel`)}<select className={fieldClass} value={profile.city} onChange={(event) => update({ city: PROFILE_CITIES.find((value) => value === event.target.value) ?? '' })}><option value="">{t(`${TK}.choose`)}</option>{PROFILE_CITIES.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <ChoiceChips label={t(`${TK}.languagesLabel`)} options={PROFILE_LANGUAGES} selected={profile.languages} onChange={(languages) => update({ languages })} optionLabel={(value) => t(`${TK}.languages.${value}`)} />
                </div>
                <label className="block text-xs font-bold text-nexoraText">{t(`${TK}.bioLabel`)}<textarea rows={3} maxLength={500} className={`${fieldClass} py-3`} value={profile.bio} onChange={(event) => update({ bio: event.target.value })} placeholder={t(`${TK}.bioPlaceholder`)} /></label>
              </> : null}
              {step === 1 ? <>
                <ChoiceChips label={t(`${TK}.skillsLabel`)} options={PROFILE_SKILLS} selected={profile.skills} onChange={(skills) => update({ skills })} optionLabel={(value) => value === 'Gel' ? t(`${TK}.gelPolish`) : t(`components.dashboard.views.pos.recruitment.enums.skill.${value}`)} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold text-nexoraText">{t(`${TK}.licenseLabel`)}<select className={fieldClass} value={profile.licenseType} onChange={(event) => update({ licenseType: PROFILE_LICENSES.find((value) => value === event.target.value) ?? '' })}><option value="">{t(`${TK}.choose`)}</option>{PROFILE_LICENSES.map((value) => <option key={value} value={value}>{t(`${TK}.licenses.${value}`)}</option>)}</select></label>
                  <label className="text-xs font-bold text-nexoraText">{t(`${TK}.licenseNumberLabel`)}<input className={fieldClass} maxLength={80} value={profile.licenseNumber} onChange={(event) => update({ licenseNumber: event.target.value })} aria-describedby="technician-license-hint" /></label>
                </div>
                <p id="technician-license-hint" className="text-xs leading-5 text-nexoraMuted">{t(`${TK}.licenseHint`)}</p>
              </> : null}
              {step === 2 ? <>
                <h2 className="text-sm font-bold text-nexoraText">{t(`${TK}.portfolioTitle`)}</h2><p className="text-xs leading-5 text-nexoraMuted">{t(`${TK}.portfolioHint`)}</p>
                <div className="grid grid-cols-3 gap-3">{PROFILE_PORTFOLIO.map((_, index) => <button key={index} type="button" aria-label={t(`${TK}.${profile.portfolio[index] ? 'removePhoto' : 'addPhoto'}`, { index: index + 1 })} onClick={() => {
                  if (profile.portfolio[index]) update({ portfolio: profile.portfolio.filter((_, photoIndex) => photoIndex !== index) })
                  else {
                    const next = PROFILE_PORTFOLIO.find((photo) => !profile.portfolio.includes(photo))
                    if (next) update({ portfolio: [...profile.portfolio, next] })
                  }
                }} className={`${buttonClass} aspect-square bg-nexoraSurfaceMuted text-3xl`}>{profile.portfolio[index] ? <TechnicianPortfolioTile sample={profile.portfolio[index]} /> : <Plus aria-hidden className="h-6 w-6 text-nexoraSubtle" />}</button>)}</div>
              </> : null}
              {step === 3 ? <>
                <ChoiceChips label={t(`${TK}.workTypesLabel`)} options={PROFILE_WORK_TYPES} selected={profile.workTypes} onChange={(workTypes) => update({ workTypes })} optionLabel={(value) => t(`${TK}.workTypes.${value}`)} />
                <ChoiceChips label={t(`${TK}.payPreferencesLabel`)} options={PROFILE_PAY_PREFERENCES} selected={profile.payPreferences} onChange={(payPreferences) => update({ payPreferences })} optionLabel={(value) => t(`${TK}.payPreferences.${value}`)} />
                <label className="block text-xs font-bold text-nexoraText">{t(`${TK}.desiredAmountLabel`)}<input className={fieldClass} maxLength={120} value={profile.desiredAmount} onChange={(event) => update({ desiredAmount: event.target.value })} placeholder={t(`${TK}.desiredAmountPlaceholder`)} /><span className="mt-2 block font-medium text-nexoraMuted">{t(`${TK}.desiredAmountHint`)}</span></label>
              </> : null}
            </div>
            {storageError ? <p role="alert" className="mt-4 text-xs font-semibold text-rose-600">{t(`${TK}.storageError`)}</p> : null}
            <footer className="mt-5 flex items-center justify-between gap-3"><button type="button" className={buttonClass} disabled={step === 0} onClick={() => setStep((current) => current - 1)}><ArrowLeft aria-hidden className="h-4 w-4" />{t(`${TK}.back`)}</button><button type="button" className={`${buttonClass} border-nexoraBrand bg-nexoraBrand text-white hover:bg-nexoraBrandDark`} onClick={() => step === 3 ? save() : setStep((current) => current + 1)}>{t(`${TK}.${step === 3 ? 'save' : 'next'}`)}{step < 3 ? <ArrowRight aria-hidden className="h-4 w-4" /> : null}</button></footer>
          </section>
        ) : (
          <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-nexora-card sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-base font-black text-nexoraText">{t(`${TK}.title`)}</h2><button type="button" onClick={onEdit} className={buttonClass}>{t(`${TK}.edit`)}</button></div>
            <p className="mt-3 text-xs leading-5 text-nexoraMuted">{t(`${TK}.aiHint`)}</p>
            <button type="button" disabled={completion < 60} onClick={() => onDraft(technicianProfileDraft(publicProfile, t), !profile.experience)} className={`${buttonClass} mt-4 w-full border-nexoraBrand bg-nexoraBrand text-white hover:bg-nexoraBrandDark`}><Sparkles aria-hidden className="h-4 w-4" />{t(`${TK}.aiDraft`)}</button>
          </section>
        )}
        {editing ? <section className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-nexora-card sm:p-5"><h2 className="text-sm font-black text-nexoraText">{t(`${TK}.privacyTitle`)}</h2>{(['lookingForWork', 'hideFromCurrentSalon', 'hidePhone'] as const).map((key) => <div key={key} className="flex items-center justify-between gap-4 border-t border-nexoraRule py-3 first:mt-3"><div><p id={`technician-${key}-label`} className="text-xs font-bold text-nexoraText">{t(`${TK}.privacy.${key}`)}</p><p className="mt-1 text-xs leading-5 text-nexoraMuted">{t(`${TK}.privacy.${key}Hint`)}</p></div><button type="button" role="switch" aria-checked={profile[key]} aria-labelledby={`technician-${key}-label`} onClick={() => update({ [key]: !profile[key] })} className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"><span aria-hidden className={`flex h-6 w-10 items-center rounded-full px-0.5 ${profile[key] ? 'justify-end bg-nexoraBrand' : 'justify-start bg-slate-300'}`}><span className="h-5 w-5 rounded-full bg-white" /></span></button></div>)}<p className="border-t border-nexoraRule pt-3 text-xs leading-5 text-nexoraMuted">{t(`${TK}.demoPrivacyHint`)}</p></section> : null}
      </div>
      <TechnicianProfileSummary profile={publicProfile} />
      </div>
    </section>
  )
}
