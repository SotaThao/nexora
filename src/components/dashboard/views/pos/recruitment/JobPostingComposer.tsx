import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { JobPayType, RecruitmentSkill } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  usePublishPosJobPosting,
  useSavePosJobPostingDraft,
} from '../../../../../data/hooks/usePosRecruitment'
import type { PosCategoryApiDto, PosServiceApiDto } from '../../../../../types/repositories'
import type { PosJobPosting, PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import { recruitmentCompensationPreview } from './recruitmentCompensation'
import ComposerContentSection from './ComposerContentSection'
import ComposerNeedsSection from './ComposerNeedsSection'
import ComposerResultStep from './ComposerResultStep'
import ComposerReviewStep from './ComposerReviewStep'
import MenuServicePickerModal from './MenuServicePickerModal'
import NailhubPostPreview from './NailhubPostPreview'
import {
  buildSuggestedDescription,
  deriveVisibilityPreset,
  deriveSkillsFromServices,
  validateJobDraft,
  type RecruitmentDraftField,
  type RecruitmentValidationErrors,
} from './recruitmentModel'
import JobPostingPreviewModal from './JobPostingPreviewModal'
import { normalizePostingVideoUrl, postingHtmlFromText, POSTING_VIDEO_MAX } from './recruitmentPostingContent'

const TK = 'components.dashboard.views.pos.recruitment.composer'

interface JobPostingComposerProps {
  postingId: string | null
  initialDraft: PosJobPostingUpsertInput
  logo?: string | null
  services: PosServiceApiDto[]
  categories: PosCategoryApiDto[]
  onCancel: () => void
  onSavedDraft: (posting: PosJobPosting) => void
  onPublishedDone: (posting: PosJobPosting) => void
}

type ComposerStep = 'compose' | 'review' | 'result'

export default function JobPostingComposer({
  postingId,
  initialDraft,
  logo,
  services,
  categories,
  onCancel,
  onSavedDraft,
  onPublishedDone,
}: JobPostingComposerProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(initialDraft)
  const [errors, setErrors] = useState<RecruitmentValidationErrors>({})
  const [mediaBusy, setMediaBusy] = useState(false)
  const [step, setStep] = useState<ComposerStep>('compose')
  const [servicePickerOpen, setServicePickerOpen] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [result, setResult] = useState<PosJobPosting | null>(null)
  const [resultPreviewOpen, setResultPreviewOpen] = useState(false)
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)
  const leaveActionRef = useRef<(() => void) | null>(null)
  const [suppressedSuggestions, setSuppressedSuggestions] = useState<RecruitmentSkill[]>([])
  const saveDraftMutation = useSavePosJobPostingDraft()
  const publishMutation = usePublishPosJobPosting()
  // Compare immutable image strings directly instead of serializing raster data on every keystroke.
  const draftSnapshot = (value: PosJobPostingUpsertInput) => JSON.stringify({ ...value, postingContent: value.postingContent ? { html: value.postingContent.html, videoUrls: value.postingContent.videoUrls } : undefined })
  const initialSnapshot = useMemo(() => draftSnapshot(initialDraft), [initialDraft])
  const initialImages = initialDraft.postingContent?.images ?? []
  const images = draft.postingContent?.images ?? []
  const initialCover = initialDraft.postingContent?.coverImage
  const cover = draft.postingContent?.coverImage
  const isDirty = draftSnapshot(draft) !== initialSnapshot
    || cover?.url !== initialCover?.url || cover?.name !== initialCover?.name
    || images.length !== initialImages.length
    || images.some((image, index) => image.url !== initialImages[index]?.url || image.name !== initialImages[index]?.name)
  const suggestedSkills = deriveSkillsFromServices(draft.selectedServices.map((service) => service.name))
  const firstError = Object.values(errors)[0]
  const previewDraft = recruitmentCompensationPreview(draft)
  const previewResult = result ? recruitmentCompensationPreview(result) : null
  const invalidCompensationAmount = draft.payType === JobPayType.Fixed
    && draft.payAmount !== null
    && (!Number.isFinite(draft.payAmount) || draft.payAmount <= 0 || draft.payAmount > 100000)
  const invalidVideos = Boolean(draft.postingContent && (draft.postingContent.videoUrls.length > POSTING_VIDEO_MAX
    || draft.postingContent.videoUrls.some((url) => url.trim() && !normalizePostingVideoUrl(url))))

  const requestLeave = useCallback((action: () => void) => {
    if (!isDirty || result) {
      action()
      return
    }
    leaveActionRef.current = action
    setLeaveConfirmOpen(true)
  }, [isDirty, result])

  useEffect(() => {
    if (!isDirty || result) return
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty, result])

  useEffect(() => {
    if (!isDirty || result) return
    const handleInternalNavigation = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target instanceof Element ? event.target : null
      const anchor = target?.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.origin !== window.location.origin) return
      const destination = `${anchor.pathname}${anchor.search}${anchor.hash}`
      const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
      if (destination === current) return
      event.preventDefault()
      event.stopPropagation()
      requestLeave(() => navigate(destination))
    }
    document.addEventListener('click', handleInternalNavigation, true)
    return () => document.removeEventListener('click', handleInternalNavigation, true)
  }, [isDirty, navigate, requestLeave, result])

  const updateDraft = (patch: Partial<PosJobPostingUpsertInput>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setErrors((current) => {
      const next = { ...current }
      for (const key of Object.keys(patch)) delete next[key as RecruitmentDraftField]
      return next
    })
  }

  const focusField = (field: RecruitmentDraftField) => {
    window.requestAnimationFrame(() => {
      document.getElementById(`recruitment-field-${field}`)?.focus()
    })
  }

  const validationMessages: Partial<Record<RecruitmentDraftField, string>> = {
    title: t(`${TK}.validation.title`),
    headcount: t(`${TK}.validation.headcount`),
    skills: t(`${TK}.validation.skills`),
    deadline: t(`${TK}.validation.deadline`),
    payAmount: t(`${TK}.validation.payAmount`),
    body: t(`${TK}.validation.${draft.body.trim().length > 4000 ? 'bodyTooLong' : 'body'}`),
  }

  const handlePreview = () => {
    if (mediaBusy || saveDraftMutation.isPending) return
    const nextErrors = validateJobDraft(draft, validationMessages)
    if (invalidCompensationAmount) nextErrors.payAmount = t(`${TK}.validation.payAmount`)
    if (invalidVideos) nextErrors.postingContent = t(`${TK}.richContent.invalidVideo`)
    setErrors(nextErrors)
    const first = Object.keys(nextErrors)[0] as RecruitmentDraftField | undefined
    if (first) {
      focusField(first)
      return
    }
    setConfirmed(false)
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveDraft = async () => {
    if (saveDraftMutation.isPending || mediaBusy) return
    if (draft.body.length > 4000) {
      setErrors({ body: t(`${TK}.validation.bodyTooLong`) }); focusField('body'); return
    }
    if (!draft.title.trim()) {
      setErrors({ title: t(`${TK}.validation.draftTitle`) })
      focusField('title')
      return
    }
    if (invalidCompensationAmount) {
      setErrors({ payAmount: t(`${TK}.validation.payAmount`) })
      focusField('payAmount')
      return
    }
    if (invalidVideos) {
      setErrors({ postingContent: t(`${TK}.richContent.invalidVideo`) })
      focusField('postingContent')
      return
    }
    try {
      const input = { ...draft, visibilityPreset: deriveVisibilityPreset(draft.visibility) }
      const posting = await saveDraftMutation.mutateAsync({ input, id: postingId })
      showToast(t(`${TK}.draftSaved`), 'success', 3000)
      onSavedDraft(posting)
    } catch {
      showToast(t(`${TK}.saveFailed`), 'error', 3500)
    }
  }

  const handlePublish = async () => {
    if (publishMutation.isPending || !confirmed) return
    try {
      const input = { ...draft, visibilityPreset: deriveVisibilityPreset(draft.visibility) }
      const posting = await publishMutation.mutateAsync({ input, id: postingId })
      setResult(posting)
      setStep('result')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      showToast(t(`${TK}.publishFailed`), 'error', 3500)
    }
  }

  const handleCancel = () => requestLeave(onCancel)

  const handleApplyServices = (selected: PosServiceApiDto[]) => {
    const selectedServices = selected.map((service) => ({ posServiceId: service.id, name: service.name }))
    const suggested = deriveSkillsFromServices(selected.map((service) => service.name))
      .filter((skill) => !suppressedSuggestions.includes(skill))
    setDraft((current) => ({
      ...current,
      selectedServices,
      skills: Array.from(new Set([...current.skills, ...suggested])),
    }))
    setServicePickerOpen(false)
  }

  const handleToggleSkill = (skill: RecruitmentSkill) => {
    const selected = draft.skills.includes(skill)
    if (selected) {
      if (suggestedSkills.includes(skill)) {
        setSuppressedSuggestions((current) => Array.from(new Set([...current, skill])))
      }
      updateDraft({ skills: draft.skills.filter((item) => item !== skill) })
    } else {
      setSuppressedSuggestions((current) => current.filter((item) => item !== skill))
      updateDraft({ skills: [...draft.skills, skill] })
    }
  }

  const stepItems = [
    { id: 'compose', label: t(`${TK}.steps.compose`) },
    { id: 'review', label: t(`${TK}.steps.review`) },
    { id: 'result', label: t(`${TK}.steps.result`) },
  ] as const
  const currentIndex = stepItems.findIndex((item) => item.id === step)

  return (
    <div className="space-y-5">
      <header className="relative flex min-h-11 items-center justify-center">
        <button type="button" onClick={handleCancel} disabled={publishMutation.isPending} aria-label={t(`${TK}.backToRecruitment`)} className="absolute inset-y-0 left-0 inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted hover:text-nexoraText disabled:opacity-50 sm:justify-start"><ArrowLeft className="h-4 w-4" aria-hidden /><span className="hidden sm:inline">{t(`${TK}.backToRecruitment`)}</span></button>
        <h1 className="min-w-0 px-12 text-center text-xl font-black tracking-tight text-nexoraText sm:px-40">{t(`${TK}.${postingId ? 'editTitle' : 'title'}`)}</h1>
      </header>

      <ol className="grid grid-cols-3 border-y border-nexoraRule py-3">
        {stepItems.map((item, index) => (
          <li key={item.id} className={`flex min-h-11 items-center gap-2 text-xs font-bold ${index <= currentIndex ? 'text-nexoraBrand' : 'text-nexoraSubtle'}`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border ${index < currentIndex ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : index === currentIndex ? 'border-nexoraBrand bg-nexoraBrand text-white' : 'border-nexoraBorder bg-white'}`}>{index < currentIndex ? <Check className="h-3.5 w-3.5" aria-hidden /> : index + 1}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </li>
        ))}
      </ol>

      {step === 'compose' ? (
        <>
          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="min-w-0 space-y-5">
              <ComposerNeedsSection draft={draft} errors={errors} disabled={saveDraftMutation.isPending} onChange={updateDraft} onOpenServices={() => setServicePickerOpen(true)} onClearServices={() => updateDraft({ selectedServices: [] })} onToggleSkill={handleToggleSkill} />
              <ComposerContentSection draft={draft} errors={errors} disabled={saveDraftMutation.isPending} onChange={updateDraft} onMediaBusyChange={setMediaBusy} onUseSuggested={() => { const body = buildSuggestedDescription(previewDraft, t); updateDraft({ body, postingContent: { ...(draft.postingContent ?? { images: [], videoUrls: [] }), html: postingHtmlFromText(body) } }); showToast(t(`${TK}.suggestedApplied`), 'success', 3000) }} />
            </div>
            <aside className="hidden space-y-2 xl:sticky xl:top-4 xl:block">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-nexoraSubtle"><span>{t(`${TK}.quickPreview`)}</span><span className="normal-case tracking-normal text-emerald-700">NailHub</span></div>
              <NailhubPostPreview draft={previewDraft} compact logo={logo} />
              <p className="px-2 text-xs font-medium leading-5 text-nexoraMuted">↗ {t(`${TK}.quickPreviewNote`)}</p>
            </aside>
          </div>

          <footer className="sticky bottom-0 z-50 -mx-2 flex flex-col gap-2 border-t border-nexoraRule bg-white/95 px-3 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-end">
            {firstError ? <p role="alert" className="text-xs font-semibold text-rose-600 sm:mr-auto">{firstError}</p> : null}
            <div className="flex w-full gap-2 sm:w-auto">
              <button type="button" disabled={saveDraftMutation.isPending || mediaBusy} onClick={handleSaveDraft} className="min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg border border-nexoraBorder px-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted disabled:opacity-50 sm:flex-none sm:px-4">{saveDraftMutation.isPending ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}{t(`${TK}.saveDraft`)}</button>
              <button type="button" disabled={saveDraftMutation.isPending || mediaBusy} onClick={handlePreview} className="min-h-11 min-w-0 flex-1 whitespace-nowrap rounded-lg bg-nexoraBrand px-2 text-xs font-black text-white hover:bg-nexoraBrandDark disabled:opacity-50 sm:flex-none sm:px-4">{t(`${TK}.previewAction`)} →</button>
            </div>
          </footer>
        </>
      ) : null}

      {step === 'review' ? <ComposerReviewStep draft={previewDraft} logo={logo} confirmed={confirmed} isPending={publishMutation.isPending} isEditing={Boolean(postingId)} onConfirmedChange={setConfirmed} onPublish={handlePublish} onBack={() => setStep('compose')} /> : null}
      {step === 'result' && result && previewResult ? <ComposerResultStep posting={previewResult} onPreview={() => setResultPreviewOpen(true)} onDone={() => onPublishedDone(result)} /> : null}

      <MenuServicePickerModal open={servicePickerOpen} services={services} categories={categories} selectedIds={draft.selectedServices.map((service) => service.posServiceId)} onApply={handleApplyServices} onClose={() => setServicePickerOpen(false)} />
      {previewResult && resultPreviewOpen ? <JobPostingPreviewModal posting={previewResult} logo={logo} onClose={() => setResultPreviewOpen(false)} /> : null}
      {leaveConfirmOpen ? createPortal(
        <div className="community-jobs-theme fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={() => setLeaveConfirmOpen(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="leave-composer-title" className="nexora-modal-card flex w-full max-w-md flex-col rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="leave-composer-title" className="text-lg font-black text-nexoraText">{t(`${TK}.unsavedTitle`)}</h2>
            <p className="mt-3 text-sm font-medium text-nexoraMuted">{t(`${TK}.unsavedConfirm`)}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setLeaveConfirmOpen(false)} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">{t(`${TK}.unsavedCancel`)}</button>
              <button type="button" onClick={() => { const action = leaveActionRef.current; leaveActionRef.current = null; setLeaveConfirmOpen(false); action?.() }} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark">{t(`${TK}.unsavedLeave`)}</button>
            </div>
          </div>
        </div>,
        document.body,
      ) : null}
    </div>
  )
}
