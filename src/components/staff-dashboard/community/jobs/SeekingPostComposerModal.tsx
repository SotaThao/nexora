import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'

import { SeekingExperience } from '../../../../constants/communityJobs'
import {
  JobPayType,
  JobPayUnit,
  JobWorkType,
  RecruitmentSkill,
} from '../../../../constants/posRecruitment'
import { formatNationalNumber, getNationalPhonePlaceholder, PhoneDialCode } from '../../../CountryCodeSelect'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  usePublishStaffSeekingPost,
  useSaveStaffSeekingDraft,
} from '../../../../data/hooks/useStaffCommunityJobs'
import IconButton from '../../../ui/IconButton'
import type { SeekingPost, SeekingPostUpsertInput } from '../../../../types/communityJobs'
import SeekingPostPreview from './SeekingPostPreview'
import {
  findSeekingPhoneLeak,
  validateSeekingDraft,
  type SeekingDraftField,
  type SeekingValidationErrors,
} from './staffJobsModel'
import { useCommunityJobsModalFocusTrap } from './useCommunityJobsModalFocusTrap'

const TK = 'staff_dashboard.community.jobs.composer'
const ENUM_TK = 'components.dashboard.views.pos.recruitment.enums'
const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 disabled:text-nexoraSubtle'

interface SeekingPostComposerModalProps {
  postId: string | null
  initialDraft: SeekingPostUpsertInput
  staffKey: string | undefined
  onClose: () => void
  onSavedDraft: (post: SeekingPost) => void
  onPublished: (post: SeekingPost) => void
}

export default function SeekingPostComposerModal({
  postId,
  initialDraft,
  staffKey,
  onClose,
  onSavedDraft,
  onPublished,
}: SeekingPostComposerModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const saveDraftMutation = useSaveStaffSeekingDraft(staffKey)
  const publishMutation = usePublishStaffSeekingPost(staffKey)
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmDialogRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState<SeekingPostUpsertInput>(initialDraft)
  const [errors, setErrors] = useState<SeekingValidationErrors>({})
  const [dirty, setDirty] = useState(false)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const isLocked = saveDraftMutation.isPending || publishMutation.isPending
  const leak = findSeekingPhoneLeak(draft)
  const firstError = Object.values(errors)[0]

  useCommunityJobsModalFocusTrap(!confirmCloseOpen, dialogRef, requestClose)
  useCommunityJobsModalFocusTrap(confirmCloseOpen, confirmDialogRef, () => setConfirmCloseOpen(false))

  function requestClose() {
    if (isLocked) return
    if (!dirty) {
      onClose()
      return
    }
    setConfirmCloseOpen(true)
  }

  const validationMessages: Partial<Record<SeekingDraftField, string>> = {
    title: t(`${TK}.validation.title`),
    skills: t(`${TK}.validation.skills`),
    workTypes: t(`${TK}.validation.workTypes`),
    body: t(`${TK}.validation.body`),
    displayName: t(`${TK}.validation.displayName`),
    phone: t(`${TK}.validation.phone`),
  }

  const updateDraft = (patch: Partial<SeekingPostUpsertInput>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key as SeekingDraftField]
      return next
    })
  }

  const toggleSkill = (skill: RecruitmentSkill) => {
    const selected = draft.skills.includes(skill)
    updateDraft({ skills: selected ? draft.skills.filter((item) => item !== skill) : [...draft.skills, skill] })
  }

  const toggleWorkType = (workType: JobWorkType) => {
    const selected = draft.workTypes.includes(workType)
    updateDraft({ workTypes: selected ? draft.workTypes.filter((item) => item !== workType) : [...draft.workTypes, workType] })
  }

  const handleSaveDraft = async () => {
    if (isLocked) return
    if (!draft.title.trim()) {
      setErrors({ title: t(`${TK}.validation.draftTitle`) })
      return
    }
    try {
      const post = await saveDraftMutation.mutateAsync({ input: draft, id: postId ?? undefined })
      showToast(t(`${TK}.draftSaved`), 'success', 3000)
      setDirty(false)
      onSavedDraft(post)
    } catch {
      showToast(t(`${TK}.saveFailed`), 'error', 3500)
    }
  }

  const handlePublish = async () => {
    if (isLocked) return
    const nextErrors = validateSeekingDraft(draft, validationMessages)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    try {
      const post = await publishMutation.mutateAsync({ input: draft, id: postId ?? undefined })
      showToast(t(`${TK}.publishSuccess`), 'success', 3000)
      setDirty(false)
      onPublished(post)
    } catch {
      showToast(t(`${TK}.publishFailed`), 'error', 3500)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4" onMouseDown={requestClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seeking-composer-title"
        className="nexora-modal-card flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between gap-4 border-b border-nexoraRule px-4 py-3 sm:px-5">
          <h2 id="seeking-composer-title" className="text-lg font-black text-nexoraText">{t(`${TK}.${postId ? 'editTitle' : 'title'}`)}</h2>
          <IconButton label={t(`${TK}.close`)} onClick={requestClose} disabled={isLocked} className="min-h-11 min-w-11 disabled:opacity-50">
            <X className="h-5 w-5" aria-hidden />
          </IconButton>
        </header>

        <div className="grid flex-1 items-start gap-5 overflow-y-auto p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-5">
            <section className="space-y-3">
              <label className="block text-xs font-bold text-nexoraText">
                {t(`${TK}.titleLabel`)} <span className="text-rose-600" aria-hidden>*</span>
                <input type="text" maxLength={120} disabled={isLocked} value={draft.title} onChange={(event) => updateDraft({ title: event.target.value })} placeholder={t(`${TK}.placeholders.title`)} aria-invalid={Boolean(errors.title)} className={`${fieldClass} mt-1.5 ${errors.title ? 'border-rose-400' : ''}`} />
                {errors.title ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.title}</span> : null}
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.experienceLabel`)}
                  <select disabled={isLocked} value={draft.experience} onChange={(event) => updateDraft({ experience: event.target.value as SeekingExperience })} className={`${fieldClass} mt-1.5 bg-white`}>
                    {Object.values(SeekingExperience).map((experience) => (
                      <option key={experience} value={experience}>{t(`staff_dashboard.community.jobs.experience.${experience}`)}</option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.availableFromLabel`)} <span className="font-medium text-nexoraMuted">{t(`${TK}.optional`)}</span>
                  <input type="date" disabled={isLocked} value={draft.availableFrom ?? ''} onChange={(event) => updateDraft({ availableFrom: event.target.value || null })} className={`${fieldClass} mt-1.5`} />
                </label>
              </div>

              <fieldset>
                <legend className="text-xs font-bold text-nexoraText">{t(`${TK}.workTypesLabel`)} <span className="text-rose-600" aria-hidden>*</span></legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.values(JobWorkType).map((workType) => {
                    const selected = draft.workTypes.includes(workType)
                    return (
                      <button key={workType} type="button" disabled={isLocked} aria-pressed={selected} onClick={() => toggleWorkType(workType)} className={`min-h-11 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${selected ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'border-nexoraBorder text-nexoraMuted hover:border-nexoraLavender'}`}>
                        {t(`${ENUM_TK}.workType.${workType}`)}
                      </button>
                    )
                  })}
                </div>
                {errors.workTypes ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.workTypes}</span> : null}
              </fieldset>

              <fieldset>
                <legend className="text-xs font-bold text-nexoraText">{t(`${TK}.skillsLabel`)} <span className="text-rose-600" aria-hidden>*</span></legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.values(RecruitmentSkill).map((skill) => {
                    const selected = draft.skills.includes(skill)
                    return (
                      <button key={skill} type="button" disabled={isLocked} aria-pressed={selected} onClick={() => toggleSkill(skill)} className={`min-h-11 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${selected ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'border-nexoraBorder text-nexoraMuted hover:border-nexoraLavender'}`}>
                        {t(`${ENUM_TK}.skill.${skill}`)}
                      </button>
                    )
                  })}
                </div>
                {errors.skills ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.skills}</span> : null}
              </fieldset>
            </section>

            <section className="space-y-3 border-t border-nexoraRule pt-4">
              <h3 className="text-sm font-black text-nexoraText">{t(`${TK}.locationPaySection`)}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.cityLabel`)}
                  <input type="text" maxLength={80} disabled={isLocked} value={draft.city} onChange={(event) => updateDraft({ city: event.target.value })} placeholder={t(`${TK}.placeholders.city`)} className={`${fieldClass} mt-1.5`} />
                </label>
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.stateLabel`)}
                  <input type="text" maxLength={40} disabled={isLocked} value={draft.state} onChange={(event) => updateDraft({ state: event.target.value })} placeholder={t(`${TK}.placeholders.state`)} className={`${fieldClass} mt-1.5`} />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.payTypeLabel`)}
                  <select disabled={isLocked} value={draft.payType} onChange={(event) => updateDraft({ payType: event.target.value as JobPayType })} className={`${fieldClass} mt-1.5 bg-white`}>
                    {Object.values(JobPayType).map((payType) => (
                      <option key={payType} value={payType}>{t(`${ENUM_TK}.payType.${payType}`)}</option>
                    ))}
                  </select>
                </label>
                {draft.payType === JobPayType.Fixed ? (
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-bold text-nexoraText">
                      {t(`${TK}.payAmountLabel`)}
                      <input type="number" min={0} disabled={isLocked} value={draft.payAmount ?? ''} onChange={(event) => updateDraft({ payAmount: event.target.value === '' ? null : Number(event.target.value) })} placeholder={t(`${TK}.placeholders.payAmount`)} className={`${fieldClass} mt-1.5`} />
                    </label>
                    <label className="block text-xs font-bold text-nexoraText">
                      {t(`${TK}.payUnitLabel`)}
                      <select disabled={isLocked} value={draft.payUnit ?? JobPayUnit.Hour} onChange={(event) => updateDraft({ payUnit: event.target.value as JobPayUnit })} className={`${fieldClass} mt-1.5 bg-white`}>
                        {Object.values(JobPayUnit).map((payUnit) => (
                          <option key={payUnit} value={payUnit}>{t(`${ENUM_TK}.payUnit.${payUnit}`)}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                ) : (
                  <label className="block text-xs font-bold text-nexoraText">
                    {t(`${TK}.payTextLabel`)} <span className="font-medium text-nexoraMuted">{t(`${TK}.optional`)}</span>
                    <input type="text" maxLength={60} disabled={isLocked} value={draft.payText ?? ''} onChange={(event) => updateDraft({ payText: event.target.value || null })} placeholder={t(`${TK}.placeholders.payText`)} className={`${fieldClass} mt-1.5`} />
                  </label>
                )}
              </div>
            </section>

            <section className="space-y-3 border-t border-nexoraRule pt-4">
              <h3 className="text-sm font-black text-nexoraText">{t(`${TK}.contactSection`)}</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.displayNameLabel`)} <span className="text-rose-600" aria-hidden>*</span>
                  <input type="text" maxLength={80} disabled={isLocked} value={draft.displayName} onChange={(event) => updateDraft({ displayName: event.target.value })} placeholder={t(`${TK}.placeholders.displayName`)} aria-invalid={Boolean(errors.displayName)} className={`${fieldClass} mt-1.5 ${errors.displayName ? 'border-rose-400' : ''}`} />
                  {errors.displayName ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.displayName}</span> : null}
                </label>
                <label className="block text-xs font-bold text-nexoraText">
                  {t(`${TK}.phoneLabel`)} <span className="text-rose-600" aria-hidden>*</span>
                  <input type="tel" disabled={isLocked} value={draft.phone} onChange={(event) => updateDraft({ phone: formatNationalNumber(event.target.value, PhoneDialCode.US) })} placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)} aria-invalid={Boolean(errors.phone)} className={`${fieldClass} mt-1.5 ${errors.phone ? 'border-rose-400' : ''}`} />
                  {errors.phone ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.phone}</span> : null}
                </label>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <label className="flex min-h-11 items-center gap-3 rounded-lg border border-nexoraBorder px-3 text-xs text-nexoraText">
                  <input type="checkbox" disabled={isLocked} checked={draft.visibility.showFullName} onChange={(event) => updateDraft({ visibility: { ...draft.visibility, showFullName: event.target.checked } })} className="h-4 w-4 rounded border-nexoraBorder accent-nexoraBrand" />
                  <span>{t(`${TK}.showFullNameLabel`)}</span>
                </label>
                <label className="flex min-h-11 items-center gap-3 rounded-lg border border-nexoraBorder px-3 text-xs text-nexoraText">
                  <input type="checkbox" disabled={isLocked} checked={draft.visibility.showPhone} onChange={(event) => updateDraft({ visibility: { ...draft.visibility, showPhone: event.target.checked } })} className="h-4 w-4 rounded border-nexoraBorder accent-nexoraBrand" />
                  <span>{t(`${TK}.showPhoneLabel`)}</span>
                </label>
              </div>
            </section>

            <section className="space-y-2 border-t border-nexoraRule pt-4">
              <div className="flex items-center justify-between text-xs font-bold text-nexoraText">
                <label htmlFor="seeking-composer-body">{t(`${TK}.bodyLabel`)} <span className="text-rose-600" aria-hidden>*</span></label>
                <span className="font-medium text-nexoraMuted">{draft.body.length}/2000</span>
              </div>
              <textarea id="seeking-composer-body" rows={6} maxLength={2000} disabled={isLocked} value={draft.body} onChange={(event) => updateDraft({ body: event.target.value })} placeholder={t(`${TK}.placeholders.body`)} aria-invalid={Boolean(errors.body)} className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm font-medium leading-6 text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 ${errors.body ? 'border-rose-400' : 'border-nexoraBorder'}`} />
              {errors.body ? <span role="alert" className="block text-[11px] font-semibold text-rose-600">{errors.body}</span> : null}
              {leak ? <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-800">{t(`${TK}.phoneLeakWarning`)}</p> : null}
            </section>
          </div>

          <aside className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-nexoraSubtle">{t(`${TK}.previewLabel`)}</p>
            <SeekingPostPreview draft={draft} compact />
          </aside>
        </div>

        <footer className="sticky bottom-0 z-10 flex flex-col gap-2 border-t border-nexoraRule bg-white/95 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-end sm:px-5">
          {firstError ? <p role="alert" className="text-xs font-semibold text-rose-600 sm:mr-auto">{firstError}</p> : null}
          <button type="button" disabled={isLocked} onClick={handleSaveDraft} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted disabled:opacity-50">
            {saveDraftMutation.isPending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}{t(`${TK}.saveDraft`)}
          </button>
          <button type="button" disabled={isLocked} onClick={handlePublish} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark disabled:opacity-50">
            {publishMutation.isPending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}{t(`${TK}.${publishMutation.isPending ? 'publishing' : 'publish'}`)}
          </button>
        </footer>
      </div>

      {confirmCloseOpen ? (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(event) => { event.stopPropagation(); setConfirmCloseOpen(false) }}>
          <div ref={confirmDialogRef} role="dialog" aria-modal="true" aria-labelledby="seeking-unsaved-title" className="nexora-modal-card flex w-full max-w-sm flex-col rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="seeking-unsaved-title" className="text-lg font-black text-nexoraText">{t(`${TK}.unsavedTitle`)}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-nexoraMuted">{t(`${TK}.unsavedConfirm`)}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmCloseOpen(false)} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">{t(`${TK}.unsavedStay`)}</button>
              <button type="button" onClick={() => { setConfirmCloseOpen(false); onClose() }} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark">{t(`${TK}.unsavedLeave`)}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
