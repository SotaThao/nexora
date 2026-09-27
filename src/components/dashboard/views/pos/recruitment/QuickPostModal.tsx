import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { createPortal } from 'react-dom'
import { Loader2, X } from 'lucide-react'

import {
  JobWorkType,
  RecruitmentBenefit,
} from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { usePublishPosJobPosting } from '../../../../../data/hooks/usePosRecruitment'
import type { MerchantBusinessInfo } from '../../../../../types/domain'
import type { PosJobPosting } from '../../../../../types/posRecruitment'
import {
  buildQuickPostTitle,
  buildQuickSuggestedMessage,
  createQuickPostingInput,
  formatRecruitmentLocation,
  joinRecruitmentMeta,
  validateQuickPostDraft,
  type QuickPostDraft,
  type QuickPostValidationErrors,
} from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment'
const QUICK_WORK_TYPES = [JobWorkType.FullTime, JobWorkType.PartTime]
const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 disabled:text-nexoraSubtle'

interface QuickPostModalProps {
  businessInfo: MerchantBusinessInfo
  currentUserName: string
  logo?: string | null
  onClose: () => void
  onPublished: (posting: PosJobPosting) => void
}

export default function QuickPostModal({ businessInfo, currentUserName, logo, onClose, onPublished }: QuickPostModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const publishMutation = usePublishPosJobPosting()
  const savedLocation = formatRecruitmentLocation(
    typeof businessInfo.city === 'string' ? businessInfo.city : '',
    typeof businessInfo.state === 'string' ? businessInfo.state : '',
  )
  const [draft, setDraft] = useState<QuickPostDraft>(() => ({
    salonName: typeof businessInfo.name === 'string' ? businessInfo.name : '',
    location: savedLocation,
    workType: JobWorkType.FullTime,
    payText: '',
    message: '',
    isUrgent: false,
    benefits: [],
  }))
  const [errors, setErrors] = useState<QuickPostValidationErrors>({})
  const [benefitsOpen, setBenefitsOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false)
  const [previewLogo, setPreviewLogo] = useState<string | null>(logo ?? null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const confirmDialogRef = useRef<HTMLDivElement>(null)
  const stayButtonRef = useRef<HTMLButtonElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)
  const submittingRef = useRef(false)
  const confirmCloseOpenRef = useRef(false)
  const isLocked = publishMutation.isPending || submitting
  const previewTitle = buildQuickPostTitle(draft.workType, draft.location, t)
  const workTypeLabel = t(`${TK}.quick.workTypeDisplay.${draft.workType}`)
  const salonLocation = joinRecruitmentMeta([draft.salonName, draft.location])
  const skillPayLine = joinRecruitmentMeta([
    t(`${TK}.quick.skillFallback`),
    draft.payText.trim() || t(`${TK}.quick.incomeFallback`),
  ])

  const updateDraft = (patch: Partial<QuickPostDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    setDirty(true)
    setErrors((current) => {
      const next = { ...current }
      if ('salonName' in patch) delete next.salonName
      if ('location' in patch || 'workType' in patch) delete next.location
      if ('message' in patch) delete next.message
      return next
    })
  }

  const requestClose = () => {
    if (isLocked) return
    if (!dirty) {
      onClose()
      return
    }
    if (confirmCloseOpenRef.current) return
    confirmCloseOpenRef.current = true
    setConfirmCloseOpen(true)
  }
  const requestCloseRef = useRef(requestClose)
  requestCloseRef.current = requestClose

  const stayInQuickForm = () => {
    confirmCloseOpenRef.current = false
    setConfirmCloseOpen(false)
  }

  const discardAndClose = () => {
    confirmCloseOpenRef.current = false
    setConfirmCloseOpen(false)
    onClose()
  }

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])
    focusable()[0]?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (confirmCloseOpenRef.current) return
      if (event.key === 'Escape') {
        event.preventDefault()
        requestCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  useEffect(() => {
    if (!confirmCloseOpen) return
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = confirmDialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])
    const focusFrame = window.requestAnimationFrame(() => stayButtonRef.current?.focus())
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        stayInQuickForm()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [confirmCloseOpen])

  useEffect(() => () => {
    if (objectUrlRef.current && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const handlePhotoChange = (file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast(t(`${TK}.quick.imageInvalidType`), 'error', 3500)
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      showToast(t(`${TK}.quick.imageTooLarge`), 'error', 3500)
      return
    }
    if (objectUrlRef.current && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(objectUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl
    setPreviewLogo(objectUrl)
    setDirty(true)
  }

  const handlePhotoInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handlePhotoChange(event.currentTarget.files?.[0])
    event.currentTarget.value = ''
  }

  const handleSuggestedMessage = () => {
    const input = createQuickPostingInput({ ...draft, businessInfo }, t)
    updateDraft({ message: buildQuickSuggestedMessage(input, t) })
  }

  const handlePublish = async () => {
    if (publishMutation.isPending || submittingRef.current) return
    const nextErrors = validateQuickPostDraft(draft, t)
    setErrors(nextErrors)
    if (nextErrors.salonName) {
      window.requestAnimationFrame(() => document.getElementById('quick-post-salon-name')?.focus())
      return
    }
    if (nextErrors.location) {
      window.requestAnimationFrame(() => document.getElementById('quick-post-location')?.focus())
      return
    }
    if (nextErrors.message) {
      window.requestAnimationFrame(() => document.getElementById('quick-post-message')?.focus())
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    try {
      const input = createQuickPostingInput({ ...draft, businessInfo }, t)
      const posting = await publishMutation.mutateAsync({ input })
      showToast(t(`${TK}.quick.success`), 'success', 3000)
      onPublished(posting)
    } catch {
      showToast(t(`${TK}.quick.publishFailed`), 'error', 3500)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const previewInitial = useMemo(() => (draft.salonName.trim() || t(`${TK}.preview.salonFallback`)).charAt(0).toUpperCase(), [draft.salonName, t])

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4" onMouseDown={requestClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="quick-post-title" className="nexora-modal-card flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-4 border-b border-nexoraRule px-4 py-3 sm:px-5">
          <h2 id="quick-post-title" className="text-lg font-black text-nexoraText">{t(`${TK}.quick.title`)}</h2>
          <button type="button" disabled={isLocked} onClick={requestClose} aria-label={t(`${TK}.quick.close`)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50"><X className="h-5 w-5" aria-hidden /></button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
          <p className="text-xs font-medium leading-5 text-nexoraMuted">
            {t(`${TK}.quick.rolePrefix`, { name: currentUserName })} <strong className="text-nexoraText">{t(`${TK}.quick.ownerRole`)}</strong> {t(`${TK}.quick.roleMiddle`)} <strong className="text-nexoraText">{t(`${TK}.quick.postType`)}</strong>. {t(`${TK}.quick.roleSuffix`)}
          </p>

          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-nexoraBorder px-3 text-xs text-nexoraText">
            <input type="checkbox" disabled={isLocked} checked={draft.isUrgent} onChange={(event) => updateDraft({ isUrgent: event.target.checked })} className="h-4 w-4 rounded border-nexoraBorder accent-nexoraBrand" />
            <span><strong>{t(`${TK}.quick.urgentLabel`)}</strong> <span className="ml-1 text-nexoraMuted">{t(`${TK}.quick.urgentHint`)}</span></span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs font-bold text-nexoraText">
              {t(`${TK}.quick.salonName`)} <span className="text-rose-600" aria-hidden>*</span>
              <input id="quick-post-salon-name" type="text" required maxLength={100} disabled={isLocked} value={draft.salonName} onChange={(event) => updateDraft({ salonName: event.target.value })} placeholder={t(`${TK}.quick.placeholders.salonName`)} aria-invalid={Boolean(errors.salonName)} className={`${fieldClass} mt-1.5 ${errors.salonName ? 'border-rose-400' : ''}`} />
              {errors.salonName ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.salonName}</span> : null}
            </label>
            <label className="text-xs font-bold text-nexoraText">
              {t(`${TK}.quick.location`)}
              {savedLocation ? (
                <select id="quick-post-location" disabled={isLocked} value={draft.location} onChange={(event) => updateDraft({ location: event.target.value })} aria-invalid={Boolean(errors.location)} className={`${fieldClass} mt-1.5 ${errors.location ? 'border-rose-400' : ''}`}><option value={savedLocation}>{savedLocation}</option></select>
              ) : (
                <input id="quick-post-location" type="text" maxLength={80} disabled={isLocked} value={draft.location} onChange={(event) => updateDraft({ location: event.target.value })} placeholder={t(`${TK}.quick.placeholders.location`)} aria-invalid={Boolean(errors.location)} className={`${fieldClass} mt-1.5 ${errors.location ? 'border-rose-400' : ''}`} />
              )}
              {errors.location ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.location}</span> : null}
            </label>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-black text-nexoraText">{t(`${TK}.quick.scheduleIncome`)}</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs font-bold text-nexoraText">{t(`${TK}.quick.workTypeLabel`)}<select disabled={isLocked} value={draft.workType} onChange={(event) => updateDraft({ workType: event.target.value as JobWorkType })} className={`${fieldClass} mt-1.5`}>{QUICK_WORK_TYPES.map((workType) => <option key={workType} value={workType}>{t(`${TK}.quick.workTypeDisplay.${workType}`)}</option>)}</select></label>
              <label className="text-xs font-bold text-nexoraText">{t(`${TK}.quick.payTextLabel`)} <span className="font-medium text-nexoraMuted">{t(`${TK}.quick.optional`)}</span><input type="text" maxLength={60} disabled={isLocked} value={draft.payText} onChange={(event) => updateDraft({ payText: event.target.value })} placeholder={t(`${TK}.quick.placeholders.payText`)} className={`${fieldClass} mt-1.5`} /></label>
            </div>
            {!benefitsOpen ? <button type="button" disabled={isLocked} onClick={() => setBenefitsOpen(true)} className="min-h-11 rounded-lg px-1 text-xs font-bold text-nexoraBrand hover:underline disabled:opacity-50">{t(`${TK}.quick.showBenefits`)}</button> : (
              <fieldset>
                <legend className="text-xs font-bold text-nexoraText">{t(`${TK}.quick.benefitsLabel`)} <span className="font-medium text-nexoraMuted">{t(`${TK}.quick.optional`)}</span></legend>
                <div className="mt-2 flex flex-wrap gap-2">{Object.values(RecruitmentBenefit).map((benefit) => {
                  const selected = draft.benefits.includes(benefit)
                  return <button key={benefit} type="button" disabled={isLocked} aria-pressed={selected} onClick={() => updateDraft({ benefits: selected ? draft.benefits.filter((item) => item !== benefit) : [...draft.benefits, benefit] })} className={`min-h-11 rounded-full border px-3 text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50 ${selected ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'border-nexoraBorder text-nexoraMuted hover:border-nexoraLavender'}`}>{t(`${TK}.enums.benefit.${benefit}`)}</button>
                })}</div>
              </fieldset>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-black text-nexoraText">{t(`${TK}.quick.salonDetails`)}</h3>
            <div>
              <p className="text-xs font-bold text-nexoraText">{t(`${TK}.quick.salonPhoto`)}</p>
              <div className="mt-2 flex items-center gap-3">
                {previewLogo ? <img src={previewLogo} width="48" height="48" alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="grid h-12 w-12 place-items-center rounded-lg bg-nexoraBrandSoft text-sm font-black text-nexoraBrand">{previewInitial}</span>}
                <input ref={fileInputRef} type="file" accept="image/*" disabled={isLocked} onChange={handlePhotoInputChange} className="hidden" />
                <button type="button" disabled={isLocked} onClick={() => fileInputRef.current?.click()} className="min-h-11 rounded-lg px-2 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-50">{t(`${TK}.quick.changePhoto`)}</button>
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-nexoraText"><span><label htmlFor="quick-post-message">{t(`${TK}.quick.messageLabel`)} <span className="font-medium text-nexoraMuted">{t(`${TK}.quick.optional`)}</span></label> <button type="button" disabled={isLocked} onClick={handleSuggestedMessage} className="ml-1 min-h-11 rounded-lg px-1 font-bold text-nexoraBrand hover:underline disabled:opacity-50">{t(`${TK}.quick.writeWithAi`)}</button></span><span className="font-medium text-nexoraMuted">{draft.message.length}/500</span></div>
              <textarea id="quick-post-message" rows={5} maxLength={500} disabled={isLocked} value={draft.message} onChange={(event) => updateDraft({ message: event.target.value })} placeholder={t(`${TK}.quick.placeholders.message`)} aria-invalid={Boolean(errors.message)} className={`mt-1.5 w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm font-medium leading-6 text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 ${errors.message ? 'border-rose-400' : 'border-nexoraBorder'}`} />
              {errors.message ? <span role="alert" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.message}</span> : null}
            </div>
          </section>

          <section className="rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-sm font-black text-nexoraText">{t(`${TK}.quick.previewTitle`)}</h3><div className="flex gap-1.5">{draft.isUrgent ? <span className="rounded-md bg-rose-500 px-2 py-1 text-[10px] font-black text-white">{t(`${TK}.preview.urgentBadge`)}</span> : null}<span className="rounded-md bg-nexoraBrandSoft px-2 py-1 text-[10px] font-bold text-nexoraBrand">{t(`${TK}.quick.workerBadge`)}</span></div></div>
            <div className="mt-3 flex gap-3 rounded-lg bg-white p-3">
              {previewLogo ? <img src={previewLogo} width="64" height="64" alt="" className="h-16 w-16 shrink-0 rounded-lg object-cover" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-nexoraBrandSoft text-lg font-black text-nexoraBrand">{previewInitial}</span>}
              <div className="min-w-0 space-y-1 text-xs"><p className="font-black leading-5 text-nexoraText">{previewTitle}</p><p className="font-medium text-nexoraMuted">{salonLocation}</p><p className="font-black text-nexoraText">{skillPayLine}</p><p className="font-medium text-nexoraMuted">{joinRecruitmentMeta([workTypeLabel, t(`${TK}.quick.timingFallback`)])}</p></div>
            </div>
            {draft.benefits.length > 0 ? <div className="mt-2 flex flex-wrap gap-1.5">{draft.benefits.map((benefit) => <span key={benefit} className="rounded-md border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800">{t(`${TK}.enums.benefit.${benefit}`)}</span>)}</div> : null}
          </section>
        </div>

        <footer className="grid grid-cols-1 gap-2 border-t border-nexoraRule bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:grid-cols-2 sm:px-5">
          <button type="button" disabled={isLocked} onClick={requestClose} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50">{t(`${TK}.quick.cancel`)}</button>
          <button type="button" disabled={publishMutation.isPending || submitting} onClick={handlePublish} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50">{isLocked ? <Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : null}{t(`${TK}.quick.${isLocked ? 'publishing' : 'publish'}`)}</button>
        </footer>
      </div>
      {confirmCloseOpen ? (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={(event) => { event.stopPropagation(); stayInQuickForm() }}>
          <div ref={confirmDialogRef} role="dialog" aria-modal="true" aria-labelledby="quick-unsaved-title" className="nexora-modal-card flex w-full max-w-sm flex-col rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl" onMouseDown={(event) => event.stopPropagation()}>
            <h2 id="quick-unsaved-title" className="text-lg font-black text-nexoraText">{t(`${TK}.quick.unsavedTitle`)}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-nexoraMuted">{t(`${TK}.quick.unsavedConfirm`)}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={stayButtonRef} type="button" onClick={stayInQuickForm} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">{t(`${TK}.quick.unsavedStay`)}</button>
              <button type="button" onClick={discardAndClose} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white hover:bg-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">{t(`${TK}.quick.unsavedLeave`)}</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
