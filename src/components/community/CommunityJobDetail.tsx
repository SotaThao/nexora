import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, ChevronLeft, ImagePlus, Mail, MapPin, MessageCircle, Phone, Search, Send, Trash2, X } from 'lucide-react'

import { DEFAULT_JOB_IMAGE, demoJobs, JOB_LOCATIONS } from './communityDemoContent'
import { COMMUNITY_DEMO_PERSONAS, useCommunityAuth } from './CommunityAuth'
import { useCommunityChatDock } from './CommunityChatDock'
import { useFindOrCreateDirectChannel, useProfileSearch } from '../../data/hooks/useDirectMessages'
import { useMyJobContacts, useRecordJobContact } from '../../data/hooks/useJobContacts'
import { resolveJobChatTarget } from './jobChatTarget'
import type { JobChatTarget } from './jobChatTarget'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import Pagination from '../ui/Pagination'
import { formatSalaryChip } from './jobSalary'
import { JobFilterSheet } from './JobFilterSheet'
import {
  communityJobsReducer,
  createInitialPanelState,
  DEFAULT_LOCATION_FILTER,
} from './communityJobsReducer'

// Jobs-specific grid page size (docs/community-jobs-ui-improvement-plan.md "Card
// (D1 = 1B)": 12, divisible by 3 and 2 columns so page 1 is always full).
// Deliberately NOT src/constants/pagination.ts's DEFAULT_PAGE_SIZE — that
// constant is shared by 28+ other screens with their own page-size needs.
const JOBS_PAGE_SIZE = 12

import type { DemoJob } from './communityDemoContent'
import type { JobContactDto } from '../../data/hooks/useJobContacts'
import type { PanelAction, PanelState } from './communityJobsReducer'

// DEMO ONLY — mirrors communityDemoContent.ts's own rule: Jobs has no backend yet.
// This panel never calls an API or the real CommunityChatDock/useCommunityChat
// (those need a real Supabase user id; demo job posters don't have one). It only
// reuses the same visual/interaction shell: a right-side detail drawer plus a
// separate floating chat dock that never overlaps it (see Visual Gate fix in
// .codex/community-jobs-visual-gate/index.html). Post/edit/delete/status here are
// local React state only — see docs/community-341/00-master/community-jobs-341_*
// for the real (Supabase-backed) implementation plan.
const gradientClass = 'bg-gradient-to-br from-nexoraElectric to-nexoraViolet'

type PostKind = DemoJob['postKind']

const JOB_IMAGE_OPTIONS = [
  { src: DEFAULT_JOB_IMAGE, label: 'Chăm sóc spa' },
  { src: '/assets/images/marketing/nail/nail_rose_quartz.jpg', label: 'Mẫu nail rose quartz' },
  { src: '/assets/images/marketing/nail/nail_zen_minimalist.jpg', label: 'Không gian zen' },
  { src: '/assets/images/marketing/nail/nail_art_luxury.jpg', label: 'Nail art cao cấp' },
  { src: '/assets/images/marketing/nail/nail_glam_french.jpg', label: 'French glam' },
  { src: '/assets/images/marketing/nail/nail_summer_pop.jpg', label: 'Nail summer pop' },
] as const

const OWNER_SUPPORT_OPTIONS = ['Lịch linh hoạt', 'Đào tạo thêm', 'Hỗ trợ chỗ ở'] as const

function postKindLabel(kind: PostKind) {
  return kind === 'hiring' ? 'Tuyển thợ' : 'Tìm việc'
}

function statusLabel(status: DemoJob['status'], postKind: PostKind) {
  if (status === 'filled') return postKind === 'hiring' ? 'Đã tuyển xong' : 'Đã tìm được việc'
  if (status === 'closed') return 'Đã đóng'
  return postKind === 'hiring' ? 'Đang tuyển' : 'Đang tìm việc'
}

// Filtering/pagination live in the component (not the reducer) because they need
// the actual `jobs` array, which the reducer never sees — see
// communityJobsReducer.ts's header comment and the plan's reducer-signature note.
export function filterJobsForState(
  jobs: DemoJob[],
  state: PanelState,
  persona: { id: string } | null,
  contacts: readonly JobContactDto[] = [],
): DemoJob[] {
  const contactedAtByJobId = new Map(contacts.map((contact) => [contact.jobId, contact.lastContactedAt]))
  const filteredJobs = jobs.filter((job) => {
    if (state.viewTab === 'contacted') {
      if (!contactedAtByJobId.has(job.id)) return false
    } else if (state.viewTab === 'mine') {
      // Bài của tôi: all of the persona's own posts, including filled/closed
      // (business rule change 2026-09-24 — no statusFilter here).
      if (!persona || job.ownerPersonaId !== persona.id) return false
    } else if (job.status !== 'open') {
      // Duyệt tin: filled/closed posts are hidden from the public feed
      // (docs/community-jobs-ui-improvement-plan.md "Business rule change").
      return false
    }
    if (state.kindFilter !== 'all' && job.postKind !== state.kindFilter) return false
    if (state.locationFilter !== DEFAULT_LOCATION_FILTER && job.location !== state.locationFilter) return false
    if (state.query.trim()) {
      const haystack = `${job.title} ${job.salon ?? ''} ${job.location} ${job.description}`.toLowerCase()
      if (!haystack.includes(state.query.trim().toLowerCase())) return false
    }
    return true
  })

  if (state.viewTab !== 'contacted') return filteredJobs
  return filteredJobs.sort((left, right) => (
    (contactedAtByJobId.get(right.id) ?? '').localeCompare(contactedAtByJobId.get(left.id) ?? '')
  ))
}

function paginate(filteredJobs: DemoJob[], pageNumber: number) {
  const totalPages = Math.max(1, Math.ceil(filteredJobs.length / JOBS_PAGE_SIZE))
  const safePageNumber = Math.min(Math.max(pageNumber, 1), totalPages)
  const start = (safePageNumber - 1) * JOBS_PAGE_SIZE
  const pageJobs = filteredJobs.slice(start, start + JOBS_PAGE_SIZE)
  return { totalPages, safePageNumber, pageJobs }
}

// Mirrors, for the subset of actions that change which jobs are visible, what the
// reducer itself is about to do to `state` — used only to compute `visibleJobIds`
// (the reducer's 3rd param) before dispatching, from the component's own `jobs`.
function projectFilterState(state: PanelState, action: PanelAction): PanelState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.query }
    case 'SET_KIND_FILTER':
      return { ...state, kindFilter: action.kind }
    case 'SET_LOCATION_FILTER':
      return { ...state, locationFilter: action.location }
    case 'SET_VIEW_TAB':
      return { ...state, viewTab: action.tab, pageNumber: 1 }
    case 'SET_PAGE':
      return { ...state, pageNumber: action.page }
    default:
      return state
  }
}

function useCurrentPersona() {
  const { user, isAnonymous } = useCommunityAuth()
  return useMemo(() => {
    if (isAnonymous || !user?.email) return null
    const normalizedEmail = user.email.toLowerCase()
    return COMMUNITY_DEMO_PERSONAS.find((persona) => (
      persona.id !== 'linh' && persona.email.toLowerCase() === normalizedEmail
    )) ?? null
  }, [user?.email, isAnonymous])
}

type DemoBubble = { id: string; from: 'me' | 'them'; body: string }

function seedConversation(job: DemoJob): DemoBubble[] {
  return [
    { id: `${job.id}-1`, from: 'me', body: `Chào ${job.posterName.split(' ')[0]}, mình thấy tin "${job.title}" — vị trí này còn nhận không?` },
    { id: `${job.id}-2`, from: 'them', body: 'Còn bạn ơi, bên mình đang cần gấp. Bạn có kinh nghiệm bao lâu rồi?' },
  ]
}

interface DraftJob extends Pick<DemoJob, 'title' | 'location' | 'salary' | 'employmentType' | 'experience' | 'description' | 'image'> {
  salon: string
  skills: string[]
  availability: string
  payModel: string
  support: string[]
  urgent: boolean
}

type DraftField = keyof DraftJob
type DraftErrors = Partial<Record<DraftField, string>>

// Fixed for the demo's only 'hiring' persona (Kayla) — her business name is
// already hardcoded in DemoMerchantShell.tsx's sidebar/header, so prefill it
// here instead of asking her to retype it.
const KNOWN_HIRING_SALON_NAME = 'Bitcoin Nail Bar'

const emptyDraft: DraftJob = {
  title: '',
  location: JOB_LOCATIONS[1] ?? '',
  salary: '',
  employmentType: 'Full-time',
  experience: '',
  description: '',
  image: DEFAULT_JOB_IMAGE,
  salon: '',
  skills: [],
  availability: '',
  payModel: '',
  support: [],
  urgent: false,
}

function validateDraft(draft: DraftJob, postKind: PostKind): DraftErrors {
  const errors: DraftErrors = {}
  if (postKind === 'hiring' && !draft.salon.trim()) errors.salon = 'Nhập tên salon để người tìm việc nhận ra tiệm của bạn.'
  return errors
}

function buildJobHeadline(draft: DraftJob, postKind: PostKind) {
  const skills = draft.skills.slice(0, 2).join(' & ') || (postKind === 'hiring' ? 'thợ nail' : 'Thợ nail')
  return postKind === 'hiring'
    ? `Tuyển ${skills} ${draft.employmentType.toLowerCase()} · ${draft.location}`
    : draft.experience.trim()
      ? `${skills} · ${draft.experience.trim()} · Tìm việc ${draft.location}`
      : `${skills} · Tìm việc ${draft.location}`
}

function PostJobModal({
  postKind,
  personaLabel,
  initial,
  onClose,
  onSubmit,
}: {
  postKind: PostKind
  personaLabel: string
  initial: DraftJob | null
  onClose: () => void
  onSubmit: (draft: DraftJob) => void
}) {
  const [draft, setDraft] = useState<DraftJob>(
    initial ?? (postKind === 'hiring' ? { ...emptyDraft, salon: KNOWN_HIRING_SALON_NAME } : emptyDraft)
  )
  const [errors, setErrors] = useState<DraftErrors>({})
  const errorSummaryRef = useRef<HTMLDivElement>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [showSupportOptions, setShowSupportOptions] = useState(false)
  const [showImagePicker, setShowImagePicker] = useState(false)
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl)
    }
  }, [uploadedImageUrl])

  const updateDraft = <Field extends DraftField>(field: Field, value: DraftJob[Field]) => {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...remaining } = current
      return remaining
    })
  }

  const validateField = (field: DraftField) => {
    const nextErrors = validateDraft(draft, postKind)
    setErrors((current) => {
      const next = { ...current }
      if (nextErrors[field]) next[field] = nextErrors[field]
      else delete next[field]
      return next
    })
  }

  const fieldClassName = (field: DraftField, multiline = false) => [
    'mt-1 w-full rounded-lg border bg-nexoraSurface px-3 text-sm text-nexoraText outline-none',
    multiline ? 'resize-none py-2' : 'min-h-11',
    errors[field]
      ? 'border-nexoraDanger focus:border-nexoraDanger focus-visible:ring-2 focus-visible:ring-nexoraDanger/30'
      : 'border-nexoraBorder focus:border-nexoraBrand focus-visible:ring-2 focus-visible:ring-nexoraBrand/30',
  ].join(' ')

  const toggleListValue = (field: 'skills' | 'support', value: string) => {
    setDraft((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }))
    setErrors((current) => {
      if (!current[field]) return current
      const { [field]: _removed, ...remaining } = current
      return remaining
    })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl)
    const objectUrl = URL.createObjectURL(file)
    setUploadedImageUrl(objectUrl)
    updateDraft('image', objectUrl)
  }

  const clearUploadedImage = () => {
    if (uploadedImageUrl) URL.revokeObjectURL(uploadedImageUrl)
    setUploadedImageUrl(null)
    updateDraft('image', DEFAULT_JOB_IMAGE)
  }

  const generateDescriptionWithAI = async () => {
    setAiError(null)
    const missingRequired = postKind === 'hiring' && !draft.salon.trim()
    if (missingRequired) {
      setAiError('Điền tên salon trước khi dùng AI.')
      return
    }
    setAiLoading(true)
    try {
      const response = await fetch('/api/generate-job-description', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          postKind,
          salon: postKind === 'hiring' ? draft.salon : undefined,
          skills: draft.skills,
          salary: draft.salary,
          employmentType: draft.employmentType,
          availability: draft.availability,
          payModel: draft.payModel,
          support: draft.support,
          experience: draft.experience,
          location: draft.location,
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok || !data?.description) {
        setAiError(data?.error || 'Không kết nối được AI — tính năng này chỉ chạy khi deploy trên Vercel (hoặc `vercel dev`), không khả dụng trên `pnpm dev` thường.')
        return
      }
      updateDraft('description', String(data.description).slice(0, 500))
    } catch {
      setAiError('Không kết nối được AI — tính năng này chỉ chạy khi deploy trên Vercel (hoặc `vercel dev`), không khả dụng trên `pnpm dev` thường.')
    } finally {
      setAiLoading(false)
    }
  }

  const generatedHeadline = buildJobHeadline(draft, postKind)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const nextErrors = validateDraft(draft, postKind)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      requestAnimationFrame(() => errorSummaryRef.current?.focus())
      return
    }
    onSubmit({ ...draft, title: generatedHeadline })
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-end justify-center bg-nexoraText/40 p-0 sm:items-center sm:p-5" role="dialog" aria-modal="true" aria-label={postKind === 'hiring' ? 'Đăng tin tuyển thợ' : 'Đăng tin tìm việc'}>
      <form noValidate onSubmit={submit} className="max-h-[92dvh] w-full max-w-[640px] overflow-y-auto rounded-t-2xl bg-nexoraSurface p-5 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-nexoraText">{initial ? 'Sửa tin' : postKind === 'hiring' ? 'Đăng tin tuyển thợ' : 'Đăng tin tìm việc'}</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="grid min-h-11 min-w-11 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:ring-2 focus-visible:ring-nexoraBrand"><X className="h-4 w-4" aria-hidden="true" /></button>
        </div>
        <p className="mt-1 text-xs text-nexoraMuted">Vai trò hiện tại: <b className="text-nexoraText">{personaLabel}</b> → tin sẽ đăng dạng <b className="text-nexoraText">{postKindLabel(postKind)}</b>. Không đổi được loại tin theo vai trò đang đăng nhập.</p>
        <label className="mt-3 flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm font-bold text-nexoraText focus-within:border-nexoraBrand">
          <input
            type="checkbox"
            checked={draft.urgent}
            onChange={(event) => updateDraft('urgent', event.target.checked)}
            className="h-4 w-4 rounded border-nexoraBorder text-nexoraDanger focus-visible:ring-2 focus-visible:ring-nexoraDanger/30"
          />
          Đánh dấu "Cần gấp"
          <span className="font-normal text-nexoraSubtle">(hiển thị nổi bật hơn trong danh sách)</span>
        </label>
        {Object.keys(errors).length > 0 ? (
          <div ref={errorSummaryRef} tabIndex={-1} role="alert" className="mt-4 rounded-lg border border-nexoraDanger/40 bg-nexoraDanger/10 px-3 py-2 text-xs font-semibold text-nexoraDanger">
            Kiểm tra lại các trường được đánh dấu trước khi đăng tin.
          </div>
        ) : null}

        <div className="mt-5 space-y-5">
          <section>
            <div className={postKind === 'hiring' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid gap-3'}>
              {postKind === 'hiring' ? <div><label htmlFor="job-salon" className="block text-xs font-bold text-nexoraText">Tên salon <span className="text-nexoraDanger">*</span></label><input id="job-salon" value={draft.salon} onBlur={() => validateField('salon')} onChange={(event) => updateDraft('salon', event.target.value)} aria-invalid={Boolean(errors.salon)} aria-describedby={errors.salon ? 'job-salon-error' : undefined} className={fieldClassName('salon')} placeholder="VD: Luxury Nails & Spa" />{errors.salon ? <p id="job-salon-error" className="mt-1 text-xs text-nexoraDanger">{errors.salon}</p> : null}</div> : null}
              <div><label htmlFor="job-location" className="block text-xs font-bold text-nexoraText">Khu vực</label><select id="job-location" value={draft.location} onChange={(event) => updateDraft('location', event.target.value)} className={fieldClassName('location')}>{JOB_LOCATIONS.filter((loc) => loc !== JOB_LOCATIONS[0]).map((loc) => <option key={loc} value={loc}>{loc}</option>)}</select></div>
            </div>
          </section>

          <section aria-labelledby="job-fit-heading">
            <div className="mb-3"><h3 id="job-fit-heading" className="text-sm font-extrabold text-nexoraText">Lịch làm & thu nhập</h3></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label htmlFor="job-employment-type" className="block text-xs font-bold text-nexoraText">Hình thức</label><select id="job-employment-type" value={draft.employmentType} onChange={(event) => updateDraft('employmentType', event.target.value === 'Part-time' ? 'Part-time' : 'Full-time')} className={fieldClassName('employmentType')}><option value="Full-time">Full-time</option><option value="Part-time">Part-time</option></select></div>
              <div><label htmlFor="job-salary" className="block text-xs font-bold text-nexoraText">{postKind === 'hiring' ? 'Mức trả cụ thể' : 'Mức mong muốn'} <span className="font-normal text-nexoraSubtle">(không bắt buộc)</span></label><input id="job-salary" value={draft.salary} onBlur={() => validateField('salary')} onChange={(event) => updateDraft('salary', event.target.value)} aria-invalid={Boolean(errors.salary)} aria-describedby={errors.salary ? 'job-salary-error' : undefined} className={fieldClassName('salary')} placeholder="VD: $1,000 - $1,300/tuần" />{errors.salary ? <p id="job-salary-error" className="mt-1 text-xs text-nexoraDanger">{errors.salary}</p> : null}</div>
            </div>
            {postKind === 'hiring' ? (
              (showSupportOptions || draft.support.length > 0) ? (
                <div role="group" aria-labelledby="job-support-label" className="mt-3"><p id="job-support-label" className="text-xs font-bold text-nexoraText">Điều tiệm hỗ trợ <span className="font-normal text-nexoraSubtle">(không bắt buộc)</span></p><div className="mt-2 flex flex-wrap gap-2">{OWNER_SUPPORT_OPTIONS.map((option) => { const selected = draft.support.includes(option); return <button key={option} type="button" aria-pressed={selected} onClick={() => toggleListValue('support', option)} className={`min-h-11 rounded-full border px-3 text-xs font-bold focus-visible:ring-2 focus-visible:ring-nexoraBrand ${selected ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand' : 'border-nexoraBorder text-nexoraMuted hover:bg-nexoraSurfaceMuted'}`}>{option}</button> })}</div></div>
              ) : (
                <button type="button" onClick={() => setShowSupportOptions(true)} className="mt-3 text-xs font-bold text-nexoraBrand hover:underline">+ Thêm điều tiệm hỗ trợ (tuỳ chọn)</button>
              )
            ) : null}
          </section>

          <section aria-labelledby="job-intro-heading">
            <div className="mb-3"><h3 id="job-intro-heading" className="text-sm font-extrabold text-nexoraText">{postKind === 'hiring' ? 'Điều thợ cần biết về tiệm' : 'Điều salon nên biết về bạn'}</h3></div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-nexoraText">{postKind === 'hiring' ? 'Ảnh salon' : 'Ảnh mẫu tay nghề'}</p>
                {(showImagePicker || draft.image !== DEFAULT_JOB_IMAGE) ? (
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-nexoraBorder text-nexoraSubtle hover:border-nexoraBrand hover:text-nexoraBrand focus-visible:ring-2 focus-visible:ring-nexoraBrand"
                    >
                      <ImagePlus className="h-4 w-4" aria-hidden="true" />
                      <span className="text-[9px] font-bold leading-none">Tải ảnh lên</span>
                    </button>
                    {uploadedImageUrl ? (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => updateDraft('image', uploadedImageUrl)}
                          aria-label="Chọn ảnh đã tải lên"
                          aria-pressed={draft.image === uploadedImageUrl}
                          className={`relative block min-h-16 w-full overflow-hidden rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-nexoraBrand ${draft.image === uploadedImageUrl ? 'border-nexoraBrand' : 'border-transparent hover:border-nexoraBorder'}`}
                        >
                          <img src={uploadedImageUrl} alt="Ảnh bạn đã tải lên" className="h-16 w-full object-cover" />
                          {draft.image === uploadedImageUrl ? <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-nexoraBrand text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}
                        </button>
                        <button
                          type="button"
                          onClick={clearUploadedImage}
                          aria-label="Xoá ảnh đã tải lên"
                          className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-nexoraText/80 text-white hover:bg-nexoraDanger focus-visible:ring-2 focus-visible:ring-nexoraBrand"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    ) : null}
                    {JOB_IMAGE_OPTIONS.map((option) => { const selected = draft.image === option.src; return <button key={option.src} type="button" onClick={() => updateDraft('image', option.src)} aria-label={`Chọn ảnh ${option.label}`} aria-pressed={selected} className={`relative min-h-16 overflow-hidden rounded-lg border-2 focus-visible:ring-2 focus-visible:ring-nexoraBrand ${selected ? 'border-nexoraBrand' : 'border-transparent hover:border-nexoraBorder'}`}><img src={option.src} alt="" className="h-16 w-full object-cover" />{selected ? <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-nexoraBrand text-white"><Check className="h-3.5 w-3.5" aria-hidden="true" /></span> : null}</button> })}
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={draft.image} alt="Ảnh đã chọn" className="h-10 w-10 rounded-md object-cover" />
                    <button type="button" onClick={() => setShowImagePicker(true)} className="text-xs font-bold text-nexoraBrand hover:underline">Đổi ảnh</button>
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-end justify-between gap-3">
                  <div className="flex items-end gap-3">
                    <label htmlFor="job-description" className="text-xs font-bold text-nexoraText">Lời nhắn thêm <span className="font-normal text-nexoraSubtle">(không bắt buộc)</span></label>
                    <button type="button" onClick={generateDescriptionWithAI} disabled={aiLoading} className="text-xs font-bold text-nexoraBrand hover:underline disabled:cursor-not-allowed disabled:text-nexoraSubtle disabled:no-underline">{aiLoading ? 'Đang tạo…' : '✨ Viết bằng AI'}</button>
                  </div>
                  <span className={`text-xs font-semibold ${draft.description.length >= 450 ? 'text-nexoraDanger' : 'text-nexoraSubtle'}`} aria-live="polite">{draft.description.length}/500</span>
                </div>
                <textarea id="job-description" value={draft.description} maxLength={500} onChange={(event) => updateDraft('description', event.target.value)} rows={5} className={fieldClassName('description', true)} placeholder={postKind === 'hiring' ? 'VD: Tiệm đông khách, có khách quen và môi trường làm việc thoải mái…' : 'VD: Có khách quen, giao tiếp tiếng Anh cơ bản, muốn tìm nơi làm lâu dài…'} />
                {aiError ? <p className="mt-1 text-xs text-nexoraDanger">{aiError}</p> : null}
              </div>
            </div>
          </section>

          <section aria-labelledby="job-preview-heading" className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3"><div className="mb-2 flex items-center justify-between"><h3 id="job-preview-heading" className="text-sm font-extrabold text-nexoraText">Xem trước tin đăng</h3><span className="flex items-center gap-1.5">{draft.urgent ? <span className="shrink-0 rounded bg-nexoraDanger px-1.5 py-1 text-xs font-extrabold text-white">Cần gấp</span> : null}<span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-[11px] font-bold text-nexoraBrand">{postKindLabel(postKind)}</span></span></div><div className="flex gap-3 rounded-lg bg-nexoraSurface p-2.5"><img src={draft.image} alt="Ảnh minh hoạ đã chọn" className="h-16 w-16 shrink-0 rounded-md object-cover" /><div className="min-w-0"><b className="block truncate text-sm text-nexoraText">{generatedHeadline}</b><p className="mt-0.5 truncate text-xs text-nexoraMuted">{postKind === 'hiring' ? draft.salon.trim() || 'Tên salon' : personaLabel} · {draft.location}</p><p className="mt-1 truncate text-xs font-bold text-nexoraText">{draft.skills.length ? draft.skills.join(' · ') : 'Chọn tay nghề'} · {draft.salary.trim() || 'Mức thu nhập'}</p><p className="mt-0.5 text-xs text-nexoraMuted">{draft.employmentType} · {draft.availability || 'Chọn thời điểm'}</p></div></div></section>
        </div>

        <p className="mt-3 rounded-lg bg-nexoraBrandSoft px-3 py-2 text-xs text-nexoraBrand">Dữ liệu mẫu cho mục đích trình bày — tin không được lưu thật, sẽ mất khi tải lại trang.</p>
        <div className="mt-4 flex gap-2.5">
          <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-nexoraBorder text-sm font-bold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:ring-2 focus-visible:ring-nexoraBrand">Huỷ</button>
          <button type="submit" className={`min-h-11 flex-1 rounded-xl text-sm font-extrabold text-white focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 ${gradientClass}`}>{initial ? 'Lưu thay đổi' : 'Đăng tin'}</button>
        </div>
      </form>
    </div>
  )
}

// ---- Card grid + full-width detail view (JobDetailView) ------------------------
// History: this went through split-view (Variant A) -> card-grid-plus-docking-panel
// (Variant B) -> a full-width JobDetailView per direct user request, applied at
// ALL widths (2026-09-23 decision) — the old `<1280px` overlay drawer and the
// `>=1280px` docking panel are both fully deleted now, not "kept untouched."
// There is exactly one grid rendering path and one detail view, used everywhere.

// `dimmed` defaults to false so a caller that never dims still renders the
// plain, unmodified card. (`selected` was removed here in P3 cleanup round 4:
// the grid is hidden — via the `visibleSelectedJob ? 'hidden' : ...` wrapper in
// CommunityJobsPanel — for every state where a card could legitimately render
// `selected`, and the one technical edge case where it isn't (the create/edit
// modal open, which forces `visibleSelectedJob` to null while
// `panelState.selectedJobId` stays set) is still 100% visually covered by that
// modal's full-screen overlay. Verified via grep that no other call site passed
// `selected` before removing it.)
function JobCard({
  job,
  dimmed = false,
  onSelect,
}: {
  job: DemoJob
  dimmed?: boolean
  onSelect: () => void
}) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Mở chi tiết tin: ${job.title}`}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      // `dimmed`: opacity-90 (not the visually-stronger opacity-60 an earlier
      // draft used) — opacity-60 measured at ~2.8:1 contrast for nexoraMuted
      // (#4D5870) text against nexoraSurface (#FFFFFF), well under the 4.5:1 AA
      // minimum for normal text (blended color ≈ rgb(148,155,169), luminance
      // ≈0.326). opacity-90 blends to ≈rgb(95,105,126), luminance ≈0.140,
      // giving ≈5.5:1 — verified by hand, not eyeballed (P3 fix).
      className={`cursor-pointer rounded-xl border border-nexoraBorder bg-nexoraSurface p-2.5 text-left shadow-nexora-card transition-colors hover:border-nexoraBrand hover:bg-nexoraBrandSoft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 ${dimmed ? 'opacity-90 saturate-[0.6]' : ''}`}
    >
      <div className="flex items-start gap-2.5">
        <img src={job.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
        <div className="min-w-0 flex-1">
          {/* Badge row: Cần gấp · salary · status (open jobs show no status
              chip). No "Tuyển thợ / Tìm việc" kind badge (D9/plan "Card (D1 =
              1B)") — post type is still filtered via the kind chips above the
              grid, just not repeated on every card. */}
          <div className="flex flex-wrap items-center gap-1.5">
            {job.urgent ? <span className="shrink-0 rounded-md bg-nexoraDanger px-2 py-0.5 text-xs font-extrabold text-white">Cần gấp</span> : null}
            {formatSalaryChip(job.salary) ? (
              <span
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-nexoraSuccess/40 bg-nexoraSuccess/10 px-2 py-0.5 text-xs font-extrabold text-nexoraText"
                title={job.salary}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-nexoraSuccess" aria-hidden="true" />
                {formatSalaryChip(job.salary)}
              </span>
            ) : null}
            {job.status !== 'open' ? (
              <span className="shrink-0 rounded-md bg-nexoraSurfaceMuted px-2 py-0.5 text-xs font-extrabold text-nexoraMuted">
                {statusLabel(job.status, job.postKind)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-nexoraText">{job.title}</h3>
        </div>
      </div>
      <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-sm text-nexoraMuted">
        <span className="min-w-0 truncate font-semibold text-nexoraBrand">{job.salon || job.posterName}</span>
        <span aria-hidden="true">·</span>
        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{job.location}</span>
        <span aria-hidden="true">·</span>
        <span className="shrink-0">{job.posted}</span>
      </p>
      <p className="mt-2 min-h-[63px] line-clamp-3 text-sm leading-relaxed text-nexoraMuted">{job.description}</p>
    </article>
  )
}

function InlineChatSection({
  job,
  expanded,
  onToggle,
  prefersReducedMotion,
  label = 'Nhắn tin',
}: {
  job: DemoJob
  expanded: boolean
  onToggle: () => void
  prefersReducedMotion: boolean
  label?: string
}) {
  const [messages, setMessages] = useState<DemoBubble[]>(() => seedConversation(job))
  const [body, setBody] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    setMessages((current) => [...current, { id: `local-${current.length}`, from: 'me', body: text }])
    setBody('')
  }

  const rowsTransitionClass = prefersReducedMotion ? '' : 'transition-[grid-template-rows] duration-[180ms] ease-out'
  const chevronTransitionClass = prefersReducedMotion ? '' : 'transition-transform duration-150'

  return (
    <div className="border-t border-nexoraRule">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`community-job-chat-${job.id}`}
        className="flex min-h-11 w-full items-center gap-2 px-5 py-3 text-left text-sm font-bold text-nexoraText hover:bg-nexoraSurfaceMuted"
      >
        <MessageCircle className="h-4 w-4 text-nexoraBrand" aria-hidden="true" />
        {label}
        <ChevronDown className={`ml-auto h-4 w-4 text-nexoraSubtle ${expanded ? 'rotate-180' : ''} ${chevronTransitionClass}`} aria-hidden="true" />
      </button>
      <div
        id={`community-job-chat-${job.id}`}
        className={`grid overflow-hidden ${rowsTransitionClass}`}
        style={{ gridTemplateRows: expanded ? '1fr' : '0fr' }}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="max-h-64 space-y-2 overflow-y-auto bg-nexoraCanvas px-4 py-3">
            <p className="rounded-lg bg-nexoraBrandSoft px-2.5 py-1.5 text-center text-[11px] text-nexoraBrand">Cuộc trò chuyện demo · Tin nhắn không được lưu hoặc gửi thật.</p>
            {messages.map((message) => (
              <p key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[12.5px] leading-snug ${message.from === 'me' ? 'ml-auto bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraText'}`}>
                {message.body}
              </p>
            ))}
          </div>
          <form onSubmit={submit} className="flex items-center gap-1.5 border-t border-nexoraBorder p-2.5">
            <input
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={500}
              placeholder="Nhắn tin…"
              aria-label={`Nhắn tin cho ${job.posterName}`}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-3 text-xs text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
            />
            {/* h-11 w-11 (44px, up from h-9/36px): icon-only send control, so the
                hit area matters even more than for labeled buttons (HIG touch-target
                audit, round 10). */}
            <button type="submit" disabled={!body.trim()} aria-label="Gửi tin nhắn" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-white ${gradientClass} disabled:cursor-not-allowed disabled:opacity-50`}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// Poster phone + email, shown on every post that has them — with or without a
// Nexora account (mock seed values until the Nailhub.ai API is wired — see
// DemoJob.contactPhone). Renders nothing when the post has neither.
function JobPosterContacts({ job }: { job: DemoJob }) {
  if (!job.contactPhone && !job.contactEmail) return null
  return (
    <dl className="mt-4 space-y-2.5">
      {job.contactPhone ? (
        <div className="flex items-center gap-2.5">
          <dt className="sr-only">Số điện thoại</dt>
          <Phone className="h-4 w-4 shrink-0 text-nexoraBrand" aria-hidden="true" />
          <dd className="min-w-0">
            <a href={`tel:${job.contactPhone.replace(/[^\d+]/g, '')}`} className="inline-flex min-h-10 items-center text-base font-bold text-nexoraText hover:text-nexoraBrand hover:underline lg:text-sm">
              {job.contactPhone}
            </a>
          </dd>
        </div>
      ) : null}
      {job.contactEmail ? (
        <div className="flex items-center gap-2.5">
          <dt className="sr-only">Email</dt>
          <Mail className="h-4 w-4 shrink-0 text-nexoraBrand" aria-hidden="true" />
          <dd className="min-w-0">
            <a href={`mailto:${job.contactEmail}`} className="inline-flex min-h-10 items-center break-all text-base font-bold text-nexoraText hover:text-nexoraBrand hover:underline lg:text-sm">
              {job.contactEmail}
            </a>
          </dd>
        </div>
      ) : null}
    </dl>
  )
}

// Real-account message action for the contact card's 'direct' target
// (jobChatTarget.ts) — routes into the EXISTING chat system instead of the
// local demo chat: resolve the poster's real profile id via useProfileSearch,
// then findOrCreate the DM channel and open it (desktop dock / mobile route).
// A separate component (not inlined) so its own pending/error state doesn't
// leak across different jobs — mirrors InlineChatSection's `key={job.id}` reset.
function JobDirectMessageAction({
  job,
  target,
  isDesktopLayout,
}: {
  job: DemoJob
  target: Extract<JobChatTarget, { kind: 'direct' }>
  isDesktopLayout: boolean
}) {
  const navigate = useNavigate()
  const dock = useCommunityChatDock()
  const profileSearch = useProfileSearch(target.displayName, { enabled: target.kind === 'direct' })
  const findOrCreateChannel = useFindOrCreateDirectChannel()
  const recordJobContact = useRecordJobContact()
  const [dmError, setDmError] = useState(false)

  const openChat = () => {
    setDmError(false)
    const profile = profileSearch.data?.find(
      (candidate) => candidate.displayName.toLowerCase() === target.displayName.toLowerCase()
    )
    if (!profile) {
      setDmError(true)
      return
    }
    findOrCreateChannel.mutate(profile.id, {
      onSuccess: (channel) => {
        recordJobContact.mutate({ jobId: job.id, channelId: channel.id })
        if (isDesktopLayout) {
          dock.openDirectChat({ id: channel.id, title: channel.otherParticipant?.displayName ?? target.displayName })
        } else {
          navigate(`/community/chat/dm/${channel.id}`)
        }
      },
      onError: () => setDmError(true),
    })
  }

  const pending = findOrCreateChannel.isPending

  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={openChat}
        disabled={pending}
        aria-label={`Nhắn tin cho ${target.displayName} về tin "${job.title}"`}
        className={`min-h-11 w-full rounded-xl text-sm font-extrabold text-white focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${gradientClass}`}
      >
        {pending ? 'Đang mở cuộc trò chuyện…' : `💬 Nhắn tin cho ${target.displayName}`}
      </button>
      <p className="mt-2 text-xs text-nexoraSubtle">Tin demo — tin nhắn gửi tới tài khoản demo {target.displayName}</p>
      {dmError ? <p className="mt-1 text-xs text-nexoraDanger">Không mở được cuộc trò chuyện. Thử lại.</p> : null}
    </div>
  )
}

// The full-width JobDetailView that displays complete job details when a card is selected —
// replaces the side docking panel / drawer per user request: "bấm vào bài viết sẽ hiển thị chi tiết thay vì hiển thị modal bên cạnh".
function JobDetailView({
  job,
  allJobs,
  isActive,
  isOwn,
  deleteConfirmId,
  chatExpanded,
  prefersReducedMotion,
  onClose,
  onEdit,
  onCycleStatus,
  onRequestDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggleChat,
  onSelectRelated,
}: {
  job: DemoJob | null
  allJobs: DemoJob[]
  isActive: boolean
  isOwn: boolean
  deleteConfirmId: string | null
  chatExpanded: boolean
  prefersReducedMotion: boolean
  onClose: () => void
  onEdit: (job: DemoJob) => void
  onCycleStatus: (job: DemoJob) => void
  onRequestDelete: (job: DemoJob) => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
  onToggleChat: () => void
  onSelectRelated: (jobId: string) => void
}) {
  // Scroll-to-top + focus-the-back-button on open — symmetric with the
  // scroll/focus restoration that runs on close (in the parent component).
  // Keyed on `job?.id` (not just mount) so this also fires when the selection
  // advances to a different job while staying open (e.g. delete confirmed ->
  // next item), not only on the very first open. Hooks must run unconditionally
  // before the `if (!job) return null` below (Rules of Hooks), so the guard
  // lives inside the effect body instead. `isActive` guard (P3 fix, round 4):
  // this panel can still hold a stale, non-null selection while `hidden` behind
  // the OTHER jobMode panel (both stay mounted now) — without this check, that
  // hidden instance's JobDetailView would still scroll/focus the page the user
  // is actually looking at.
  const backButtonRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!job || !isActive) return
    try {
      window.scrollTo({ top: 0, behavior: 'auto' })
    } catch {
      // jsdom (unit tests) does not implement scrollTo — harmless no-op there.
    }
    backButtonRef.current?.focus()
  }, [job?.id, isActive])

  // 2-column layout only >=1024px (lg) — driven by a real media query, not a
  // CSS-only reorder/duplicate-markup trick: the right column holds
  // `InlineChatSection`, which owns its own React state, so rendering it twice
  // (once per breakpoint branch, toggled via `hidden`) would mount two
  // independent chat instances. Same established pattern as
  // `prefersReducedMotion` above in this file.
  const isDesktopLayout = useMediaQuery('(min-width: 1024px)')

  // Where "Nhắn tin" should go (jobChatTarget.ts): real DM (desktop dock /
  // mobile route) for the two personas with real accounts, local demo chat for
  // an anonymous viewer, or no message action for self/no-account posters.
  // Signed-in demo account id for self-detection — unlike useCurrentPersona()
  // this includes 'linh': guests can't post, but Linh Tran is a seed poster
  // and must see her own post as "tin của bạn", not a DM to herself.
  const { user, isAnonymous } = useCommunityAuth()
  const currentAccountId = useMemo(() => {
    if (isAnonymous || !user?.email) return null
    const normalizedEmail = user.email.toLowerCase()
    return COMMUNITY_DEMO_PERSONAS.find((persona) => persona.email.toLowerCase() === normalizedEmail)?.id ?? null
  }, [user?.email, isAnonymous])
  const chatTarget = useMemo(
    () => resolveJobChatTarget({
      posterPersonaId: job?.posterPersonaId ?? job?.ownerPersonaId ?? undefined,
      currentPersonaId: currentAccountId,
      isAnonymous,
    }),
    [job?.posterPersonaId, job?.ownerPersonaId, currentAccountId, isAnonymous],
  )

  // Bài viết liên quan (docs/01-product/..._product_260924_v1.09.24.md
  // Wireframe): <=3 other posts of the same postKind, same location first —
  // sourced from the panel's own `jobs` list (not the current view's filtered/
  // paginated set), same as the approved mockup's `rel = JOBS.filter(...)`.
  const relatedJobs = useMemo(() => {
    if (!job) return []
    return allJobs
      .filter((candidate) => candidate.id !== job.id && candidate.postKind === job.postKind)
      .sort((a, b) => Number(b.location === job.location) - Number(a.location === job.location))
      .slice(0, 3)
  }, [allJobs, job])

  if (!job) return null
  const confirmingDelete = deleteConfirmId === job.id
  const salaryChip = formatSalaryChip(job.salary)
  const posterInitials = (job.posterName || 'N')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  // Badge row: Cần gấp · status (open shows no status chip) — no "Tuyển thợ /
  // Tìm việc" kind badge and no duplicate status chip (D9, dropped from here).
  const badges = (
    <>
      {job.urgent ? <span className="shrink-0 rounded-md bg-nexoraDanger px-2 py-0.5 text-xs font-extrabold text-white">Cần gấp</span> : null}
      {job.status !== 'open' ? (
        <span className="shrink-0 rounded-md bg-nexoraSurfaceMuted px-2 py-0.5 text-xs font-extrabold text-nexoraMuted">
          {statusLabel(job.status, job.postKind)}
        </span>
      ) : null}
    </>
  )

  const salaryBig = salaryChip ? (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl border border-nexoraSuccess/40 bg-nexoraSuccess/10 px-3 py-1.5 text-lg font-extrabold text-nexoraText lg:px-2.5 lg:py-1"
      title={job.salary}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-nexoraSuccess" aria-hidden="true" />
      {salaryChip}
    </span>
  ) : null

  const jobDetailCard = (
    <section className="overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card">
      <h2 className="border-b border-nexoraRule px-5 py-4 text-lg font-extrabold text-nexoraText lg:py-3.5 lg:text-base">Chi tiết công việc</h2>
      <div className="px-5 py-4">
        <dl className="mb-5 grid grid-flow-row-dense grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-x-6 gap-y-4">
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Hình thức</dt>
            <dd className="mt-1 text-base font-bold lg:text-sm text-nexoraText">{job.employmentType}</dd>
          </div>
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Kinh nghiệm</dt>
            <dd className="mt-1 text-base font-bold lg:text-sm text-nexoraText">{job.experience || 'Không yêu cầu'}</dd>
          </div>
          {job.payModel ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Thu nhập</dt>
              <dd className="mt-1 text-base font-bold lg:text-sm text-nexoraText">{job.payModel}</dd>
            </div>
          ) : null}
          {job.availability ? (
            <div>
              <dt className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Thời gian</dt>
              <dd className="mt-1 text-base font-bold lg:text-sm text-nexoraText">{job.availability}</dd>
            </div>
          ) : null}
          {job.skills && job.skills.length > 0 ? (
            <div className="col-span-full">
              <dt className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Tay nghề</dt>
              <dd className="mt-1 text-base font-bold lg:text-sm text-nexoraText">{job.skills.join(' · ')}</dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Trạng thái</dt>
            <dd className={`mt-1 text-base font-bold lg:text-sm ${job.status === 'open' ? 'text-nexoraSuccess' : 'text-nexoraText'}`}>
              {statusLabel(job.status, job.postKind)}
            </dd>
          </div>
        </dl>
        <p className="whitespace-pre-line text-base leading-relaxed text-nexoraText lg:text-sm">{job.description}</p>
        {job.support && job.support.length > 0 ? (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-nexoraSubtle">Tiệm hỗ trợ</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {job.support.map((item) => (
                <span key={item} className="rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-2.5 py-1 text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {/* Replaces the old "Nội dung mẫu" chip (hardcoded #8a5a00) with a
            small subtle line — Design System Audit item (product doc). */}
        <p className="mt-4 text-xs text-nexoraSubtle">Nội dung mẫu · tin và tin nhắn không được lưu</p>
      </div>
    </section>
  )

  const contactCard = (
    <section className="overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card">
      <h2 className="border-b border-nexoraRule px-5 py-4 text-lg font-extrabold text-nexoraText lg:py-3.5 lg:text-base">Thông tin liên lạc</h2>
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-sm font-extrabold text-white ${gradientClass}`} aria-hidden="true">
            {posterInitials}
          </span>
          <div className="min-w-0">
            <b className="block truncate text-base text-nexoraText lg:text-sm">{job.salon || job.posterName}</b>
            <span className="block truncate text-sm text-nexoraMuted">{job.posterName} · {job.posterRole}</span>
          </div>
        </div>
        <p className="mt-3 text-base text-nexoraMuted lg:text-sm">{job.location}</p>
        <JobPosterContacts job={job} />

        {confirmingDelete ? (
          <div role="alertdialog" aria-label="Xác nhận xoá tin" className="mt-4 flex flex-wrap items-center gap-2.5 rounded-xl border border-nexoraDanger/20 bg-nexoraDanger/10 p-4">
            <p className="flex-1 text-sm font-semibold text-nexoraDanger">Xoá tin này? Không thể hoàn tác.</p>
            <button type="button" onClick={onCancelDelete} className="min-h-11 rounded-xl border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">Huỷ</button>
            <button type="button" onClick={onConfirmDelete} className="min-h-11 rounded-xl bg-nexoraDanger px-4 text-xs font-extrabold text-white hover:bg-opacity-90">Xác nhận xoá</button>
          </div>
        ) : isOwn ? (
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button type="button" onClick={() => onEdit(job)} className="min-h-11 flex-1 rounded-xl border border-nexoraBorder text-sm font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">
              Sửa
            </button>
            <button type="button" onClick={() => onCycleStatus(job)} className="min-h-11 flex-1 rounded-xl border border-nexoraBorder text-sm font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">
              Đổi trạng thái
            </button>
            {/* Delete always routes through the inline confirm step above
                (REQUEST_DELETE -> "Xác nhận xoá") — unchanged behavior, only
                its position moved from the old top action bar into this card
                (P1 fix history preserved). */}
            <button
              type="button"
              onClick={() => onRequestDelete(job)}
              className="min-h-11 flex-1 rounded-xl bg-nexoraDanger text-sm font-extrabold text-white hover:bg-opacity-90"
            >
              Xoá
            </button>
          </div>
        ) : !job.posterPersonaId && !job.ownerPersonaId ? (
          // Poster has no Nexora account (e.g. listings from Nailhub.ai): no chat
          // entry point — the phone/email above is the only contact path.
          job.contactPhone || job.contactEmail ? null : (
            <p className="mt-4 text-xs text-nexoraSubtle">Người đăng chưa có tài khoản nhắn tin</p>
          )
        ) : chatTarget.kind === 'demo' ? (
          // Anonymous viewer: unchanged behavior from before this layout pass —
          // InlineChatSection's own header IS the message toggle, personalized
          // via `label`. Always mounted (not conditional on `chatExpanded`) so
          // its CSS grid-template-rows transition can play on both open AND close.
          <div className="mt-4 overflow-hidden rounded-xl border border-nexoraRule">
            <InlineChatSection
              key={job.id}
              job={job}
              expanded={chatExpanded}
              onToggle={onToggleChat}
              prefersReducedMotion={prefersReducedMotion}
              label={`Nhắn tin cho ${job.posterName.split(' ')[0]}`}
            />
          </div>
        ) : chatTarget.kind === 'direct' ? (
          // Logged-in persona viewing another real-account persona's post:
          // route "Nhắn tin" into the EXISTING chat system (dock/full-page DM),
          // not the local demo chat above.
          <JobDirectMessageAction key={job.id} job={job} target={chatTarget} isDesktopLayout={isDesktopLayout} />
        ) : (
          <p className="mt-4 text-xs text-nexoraSubtle">
            {chatTarget.kind === 'self' ? 'Đây là tin của bạn' : 'Người đăng chưa có tài khoản nhắn tin'}
          </p>
        )}
      </div>
    </section>
  )

  const relatedCard = (
    <section className="overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-nexora-card">
      <h2 className="border-b border-nexoraRule px-5 py-4 text-lg font-extrabold text-nexoraText lg:py-3.5 lg:text-base">Bài viết liên quan</h2>
      <div className="divide-y divide-nexoraRule px-5">
        {relatedJobs.map((related) => {
          const relatedSalary = formatSalaryChip(related.salary)
          return (
            <button
              key={related.id}
              type="button"
              onClick={() => onSelectRelated(related.id)}
              className="flex w-full items-start gap-3 rounded-lg py-3 text-left hover:bg-nexoraSurfaceMuted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"
            >
              <img src={related.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">
                  <span className="font-semibold text-nexoraBrand">{related.salon || related.posterName}</span>
                  <span className="text-nexoraSubtle"> · {related.location}</span>
                </p>
                <b className="mt-0.5 block line-clamp-2 text-base font-bold leading-snug text-nexoraText lg:text-sm">{related.title}</b>
                {relatedSalary ? (
                  <span
                    className="mt-1.5 inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-nexoraSuccess/40 bg-nexoraSuccess/10 px-2 py-0.5 text-xs font-extrabold text-nexoraText"
                    title={related.salary}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-nexoraSuccess" aria-hidden="true" />
                    {relatedSalary}
                  </span>
                ) : null}
              </div>
            </button>
          )
        })}
        {relatedJobs.length === 0 ? <p className="py-4 text-sm text-nexoraMuted">Chưa có bài viết liên quan.</p> : null}
      </div>
    </section>
  )

  return (
    // Inline content, not a modal — no role="dialog"/aria-modal (there's no focus
    // trap or Escape handling, which a real dialog role would imply). Applies at
    // ALL widths per user decision (2026-09-23): this replaces both the old
    // <1280px overlay drawer and the >=1280px docking panel with one unified view.
    <div className="space-y-5">
      <button
        ref={backButtonRef}
        type="button"
        onClick={onClose}
        // No aria-label here: the visible text "Quay lại danh sách tin" is
        // already a complete, descriptive accessible name. An aria-label that
        // doesn't contain the visible text would violate WCAG 2.5.3 (Label in
        // Name) — a speech-input user saying "quay lại danh sách tin" wouldn't
        // match a differently-worded aria-label like the earlier "Đóng chi tiết".
        className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface px-4 text-xs font-bold text-nexoraText shadow-sm hover:border-nexoraBrand hover:text-nexoraBrand transition-colors"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <span>Quay lại danh sách tin</span>
      </button>

      {/* Header: small image + salon/location/posted + badges + large title;
          large salary chip on the right >=lg, below the title on smaller
          screens (docs/01-product/community-jobs-ui_product_260924_v1.09.24.md
          Wireframe: Detail). */}
      <section className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 lg:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:gap-5">
          <div className="flex gap-4 lg:flex-1">
            <img
              src={job.image}
              alt=""
              className="h-20 w-28 shrink-0 rounded-xl object-cover lg:h-24 lg:w-36"
            />
            <div className="min-w-0">
              <p className="text-sm leading-snug">
                <span className="font-semibold text-nexoraBrand">{job.salon || job.posterName}</span>
                <span className="text-nexoraMuted"> · {job.location} · {job.posted}</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">{badges}</div>
              {/* Desktop title lives next to the image; the mobile/tablet
                  title (below) renders full-width instead. */}
              <h1 className="mt-2 hidden text-xl font-extrabold leading-tight md:text-2xl lg:block lg:text-xl">{job.title}</h1>
            </div>
          </div>
          <h1 className="text-xl font-extrabold leading-tight md:text-2xl lg:hidden">{job.title}</h1>
          {salaryBig ? <div className="lg:shrink-0 lg:pt-1">{salaryBig}</div> : null}
        </div>
      </section>

      {isDesktopLayout ? (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          {jobDetailCard}
          <div className="space-y-5">
            {contactCard}
            {relatedCard}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {jobDetailCard}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {contactCard}
            {relatedCard}
          </div>
        </div>
      )}
    </div>
  )
}


export function CommunityJobsPanel({ isActive = true }: { isActive?: boolean } = {}) {
  const persona = useCurrentPersona()
  const { authReady, isAnonymous, user } = useCommunityAuth()
  const isLinhAccount = Boolean(user?.email && COMMUNITY_DEMO_PERSONAS.some((candidate) => (
    candidate.id === 'linh' && candidate.email.toLowerCase() === user.email?.toLowerCase()
  )))
  const canViewContacted = authReady && Boolean(user) && !isAnonymous && !isLinhAccount
  const contactsQuery = useMyJobContacts({ enabled: canViewContacted })
  const personaLabel = persona ? (persona.id === 'kayla' ? 'Kayla · Chủ salon' : 'Jessica · Thợ nail') : 'Khách (chỉ xem)'
  const myPostKind: PostKind | null = persona ? (persona.id === 'kayla' ? 'hiring' : 'seeking') : null

  const [jobs, setJobs] = useState<DemoJob[]>(demoJobs)
  const [panelState, setPanelState] = useState<PanelState>(createInitialPanelState)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)

  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

  const isOwn = (job: DemoJob) => persona !== null && job.ownerPersonaId === persona.id

  const editingJob = jobs.find((job) => job.id === editingJobId) ?? null
  const filteredJobs = useMemo(
    () => filterJobsForState(jobs, panelState, persona, contactsQuery.data ?? []),
    [jobs, panelState.viewTab, panelState.kindFilter, panelState.locationFilter, panelState.query, persona, contactsQuery.data],
  )
  // While the create/edit modal is open, JobDetailView should not show — the
  // modal is a full overlay either way. Selection must also stay within
  // filteredJobs so mutations or active filters do not show an excluded job
  // (P2 fix).
  const visibleSelectedJob = createOpen ? null : filteredJobs.find((job) => job.id === panelState.selectedJobId) ?? null
  const { totalPages, safePageNumber, pageJobs } = useMemo(
    () => paginate(filteredJobs, panelState.pageNumber),
    [filteredJobs, panelState.pageNumber],
  )
  // Wraps the pure reducer: computes `visibleJobIds` (the reducer's 3rd param)
  // from the component-owned `jobs` array before every dispatch, per the
  // reducer-signature note ("visibleJobIds lives in the component, not PanelState").
  const dispatch = (action: PanelAction) => {
    setPanelState((prev) => {
      const projected = projectFilterState(prev, action)
      const projectedFiltered = filterJobsForState(jobs, projected, persona, contactsQuery.data ?? [])
      const { pageJobs: projectedPageJobs } = paginate(projectedFiltered, projected.pageNumber)
      return communityJobsReducer(prev, action, projectedPageJobs.map((job) => job.id))
    })
  }

  useEffect(() => {
    if (!canViewContacted && panelState.viewTab === 'contacted') {
      dispatch({ type: 'SET_VIEW_TAB', tab: 'browse' })
    }
  }, [canViewContacted, panelState.viewTab])

  // Scroll + focus restoration (P1 fix): JobDetailView is full-width and applies
  // at ALL widths (user decision, 2026-09-23) — opening it replaces the grid in
  // place, so without this the user loses their scroll position and keyboard
  // focus every time they open then close a detail view. Captured at the moment
  // of selecting a job (not in an effect) so it reflects exactly where the user
  // was an instant before navigating away; restored only on a genuine
  // open->closed transition.
  //
  // Round-3 fix: this used to watch `visibleSelectedJob`, which `createOpen`
  // (the edit modal) ALSO forces to `null` — so opening "Sửa" incorrectly ran
  // the close restoration (scrolled back, focused the card behind the now-open
  // modal). `panelState.selectedJobId` is not touched by `createOpen` (edit
  // preserves selection — see submitDraft/handleManage), so watching ITS
  // transition to `null` only fires on an actual close: the back button, a
  // delete that empties the list, or the stale-selection cleanup effect below —
  // never when the edit modal merely opens on top of the same selection.
  const lastScrollYRef = useRef(0)
  const lastFocusedElementRef = useRef<HTMLElement | null>(null)
  const prevSelectedJobIdRef = useRef<string | null>(null)
  // Fallback focus target (P3 fix): when the originally-clicked card is gone
  // (deleted) or the closing wasn't triggered by an explicit card click at all
  // (e.g. the stale-selection cleanup effect below, after a status
  // change/edit drops the open job out of the active filter), focus was
  // dropping to `<body>`. Fall back to the grid's search input instead of
  // leaving focus nowhere.
  const searchInputRef = useRef<HTMLInputElement>(null)

  const selectJob = (jobId: string | null) => {
    if (jobId !== null) {
      lastScrollYRef.current = window.scrollY
      lastFocusedElementRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    }
    dispatch({ type: 'SELECT_JOB', jobId })
  }

  useEffect(() => {
    const wasOpen = prevSelectedJobIdRef.current !== null
    const isOpen = panelState.selectedJobId !== null
    // `isActive` guard (P3 fix, round 4): both Jobs panels (this one and
    // OwnerJobsPanel) now stay mounted always — toggled via a `hidden` class in
    // CommunityScreens.tsx, not conditional mounting, so switching jobMode
    // preserves state (round-5 fix). But that means a persona switch (which
    // resets this panel's selection to null) while this panel is the HIDDEN one
    // would otherwise still run `window.scrollTo`/`.focus()` here — `scrollTo`
    // is a `window`-level call, so it would visibly scroll whichever panel IS
    // showing, even though this panel's own content is `display:none`.
    if (wasOpen && !isOpen && isActive) {
      try {
        window.scrollTo({ top: lastScrollYRef.current, behavior: 'auto' })
      } catch {
        // jsdom (unit tests) does not implement scrollTo — harmless no-op there.
      }
      const el = lastFocusedElementRef.current
      if (el && document.body.contains(el)) {
        el.focus()
      } else {
        searchInputRef.current?.focus()
      }
    }
    prevSelectedJobIdRef.current = panelState.selectedJobId
  }, [panelState.selectedJobId])

  // Round-3 blocker fix: `visibleSelectedJob` correctly hides JobDetailView the
  // instant its job drops out of `filteredJobs` (e.g. Kayla changes her own
  // post's status while filtered to "Đang mở"), but `panelState.selectedJobId`
  // itself was never cleared — it kept pointing at the now-invisible job. The
  // next filter/tab/page dispatch would then see a non-null selection that
  // isn't in the visible set and (before this round) re-clamp to
  // `visibleJobIds[0]`, silently opening a stranger's post. Proactively clear
  // the stale id as soon as it's detected (not while the create/edit modal is
  // open, which legitimately forces `visibleSelectedJob` to null too without
  // the selection actually being invalid).
  useEffect(() => {
    if (!createOpen && panelState.selectedJobId !== null && !visibleSelectedJob) {
      dispatch({ type: 'SELECT_JOB', jobId: null })
    }
  }, [createOpen, panelState.selectedJobId, visibleSelectedJob])

  useEffect(() => {
    // Persona switch (demo login change): full reset per Selection invariants —
    // filters/tab back to defaults, selection cleared.
    setCreateOpen(false)
    setEditingJobId(null)
    setPanelState(createInitialPanelState())
  }, [persona?.id])

  // NOTE: there is deliberately no "auto-select the first result" effect here.
  // The detail view only opens on an explicit card click. An earlier version of
  // this effect auto-selected pageJobs[0] whenever selectedJobId was null, which
  // also fired right after the detail view's own close button set selectedJobId
  // to null — so it could never actually stay closed (Blocker fix, round 1).
  // Blocker 1 (round 2) was the same root bug one level down: the reducer's own
  // re-clamp logic treated "no selection" the same as "invalid selection," so
  // every filter/tab/page change re-triggered it too — fixed in
  // communityJobsReducer.ts's clampSelection, not here.

  const cycleJobStatus = (job: DemoJob) => {
    if (!isOwn(job)) return
    setJobs((current) => current.map((item) => {
      if (item.id !== job.id) return item
      const next = item.status === 'open' ? 'filled' : item.status === 'filled' ? 'closed' : 'open'
      return { ...item, status: next }
    }))
  }

  // Delete always routes through the inline confirm step (REQUEST_DELETE ->
  // CONFIRM_DELETE/CANCEL_DELETE), at every width — see JobDetailView (P1 fix,
  // removed the old <1280px-immediate-delete / >=1280px-confirm split that only
  // existed to feed the now-deleted JobDetailDrawer).
  const requestDeleteJob = (job: DemoJob) => dispatch({ type: 'REQUEST_DELETE', jobId: job.id })
  const cancelDeleteJob = () => dispatch({ type: 'CANCEL_DELETE' })
  const confirmDeleteJob = () => {
    const deletingId = panelState.deleteConfirmId
    if (!deletingId) return
    dispatch({ type: 'CONFIRM_DELETE' })
    setJobs((current) => current.filter((item) => item.id !== deletingId))
  }

  const submitDraft = (draft: DraftJob) => {
    if (editingJobId) {
      if (!editingJob || !isOwn(editingJob)) {
        setCreateOpen(false)
        setEditingJobId(null)
        return
      }
      setJobs((current) => current.map((item) => (item.id === editingJob.id ? { ...item, ...draft, salon: draft.salon || null } : item)))
      // Selection is left untouched — "Edit saved" stays on the same job id at
      // every width (Selection invariants), the detail view simply re-shows the
      // (now updated) job once the modal closes.
    } else if (myPostKind && persona) {
      const newJob: DemoJob = {
        id: `local-${Date.now()}`,
        postKind: myPostKind,
        title: draft.title,
        salon: myPostKind === 'hiring' ? draft.salon || 'Salon của bạn' : null,
        location: draft.location,
        salary: draft.salary,
        employmentType: draft.employmentType,
        status: 'open',
        urgent: draft.urgent,
        posted: 'Vừa xong',
        posterName: persona.id === 'kayla' ? 'Kayla' : 'Jessica',
        posterRole: myPostKind === 'hiring' ? 'Chủ salon' : 'Thợ nail',
        experience: draft.experience || 'Không yêu cầu kinh nghiệm',
        skills: draft.skills,
        availability: draft.availability,
        payModel: draft.payModel,
        support: draft.support,
        image: draft.image,
        description: draft.description,
        ownerPersonaId: persona.id,
      }
      setJobs((current) => [newJob, ...current])
      dispatch({ type: 'RESET_FILTERS' })
      // Selection moves to the new post, at every width (Selection invariants).
      selectJob(newJob.id)
    }
    setCreateOpen(false)
    setEditingJobId(null)
  }

  const postButtonNode = myPostKind ? (
    <button
      type="button"
      onClick={() => { setEditingJobId(null); setCreateOpen(true) }}
      className={`min-h-11 shrink-0 rounded-lg px-4 text-sm font-extrabold text-white ${gradientClass}`}
    >
      {myPostKind === 'hiring' ? 'Đăng tin tuyển thợ' : 'Đăng tin tìm việc'}
    </button>
  ) : (
    // Plain subtle text, not a disabled-looking pill (round 2 layout pass) —
    // same text, same condition, unchanged behavior. `max-w-[45%] text-right`
    // (round 3): keeps it sharing Row A with the view-tab segmented control
    // instead of a separate hint line below; may wrap to 2 lines at 375px.
    <span className="max-w-[45%] text-right text-xs text-nexoraSubtle">Đăng nhập persona thợ/chủ để đăng tin</span>
  )

  // Duplicate-CTA fix (P2): the toolbar's CTA is generic/always-there, so when
  // the grid's own empty state already shows the same CTA with context ("Bạn
  // chưa có tin nào...", mine tab + zero listings), suppress the toolbar copy —
  // show it in exactly one place instead of both simultaneously.
  const isMineEmpty = panelState.viewTab === 'mine' && filteredJobs.length === 0

  // <768px "Bộ lọc" bottom sheet (Task 3/4, round 2 layout pass). Only
  // `locationFilter` counts as a non-default filter for now (kindFilter/query
  // are not surfaced in the sheet). `jobsCountForLocation` reuses
  // `filterJobsForState` via a projected state instead of duplicating filter
  // logic — same technique `projectFilterState`/`dispatch` already use above.
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const activeFilterCount = panelState.locationFilter !== DEFAULT_LOCATION_FILTER ? 1 : 0
  const jobsCountForLocation = (location: string) =>
    filterJobsForState(jobs, { ...panelState, locationFilter: location }, persona, contactsQuery.data ?? []).length
  const closeFilterSheet = () => {
    setFilterSheetOpen(false)
    requestAnimationFrame(() => filterButtonRef.current?.focus())
  }
  const applyLocationFilter = (location: string) => {
    dispatch({ type: 'SET_LOCATION_FILTER', location })
    closeFilterSheet()
  }

  return (
    <>
      {/* Small, separate status element — NOT nested inside the grid's hideable
          wrapper below, which used to make it announce nothing: a live region's
          text changing at the same instant its ancestor gets `display:none` is
          never read aloud by screen readers (P2 fix). */}
      <p aria-live="polite" className="sr-only">{visibleSelectedJob ? `Đã chọn: ${visibleSelectedJob.title}` : ''}</p>

      {visibleSelectedJob ? (
        <JobDetailView
          job={visibleSelectedJob}
          allJobs={jobs}
          isActive={isActive}
          isOwn={isOwn(visibleSelectedJob)}
          deleteConfirmId={panelState.deleteConfirmId}
          chatExpanded={panelState.chatExpanded}
          prefersReducedMotion={prefersReducedMotion}
          onClose={() => selectJob(null)}
          onEdit={(job) => {
            setEditingJobId(job.id)
            setCreateOpen(true)
          }}
          onCycleStatus={cycleJobStatus}
          onRequestDelete={requestDeleteJob}
          onConfirmDelete={confirmDeleteJob}
          onCancelDelete={cancelDeleteJob}
          onToggleChat={() => dispatch({ type: 'TOGGLE_CHAT' })}
          onSelectRelated={(jobId) => selectJob(jobId)}
        />
      ) : null}

      <div className={visibleSelectedJob ? 'hidden' : 'space-y-4'}>
        {/* No Jobs workspace header ("Nexora Community / Jobs · N tin") here —
            the user explicitly chose the headerless version (reversing an
            earlier round's P2 restoration), same product decision as the
            global header removal in CommunityScreens.tsx's CommunityHome. */}
        <div className="space-y-2 border-0 bg-transparent p-0 shadow-none md:space-y-2.5 md:rounded-2xl md:border md:border-nexoraBorder md:bg-nexoraSurface md:p-3.5 md:shadow-nexora-card">
          {/* Row A: view tabs (left) + post CTA / persona hint (right). Tabs
              restyled as a compact segmented control (round 3 layout pass),
              matching the mode switcher above CommunityJobsPanel in
              CommunityScreens.tsx, to reclaim vertical space previously spent
              on large brand-filled pills. Same handlers/aria, no behavior
              change. */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="no-scrollbar inline-flex min-w-0 max-w-full flex-nowrap overflow-x-auto rounded-xl bg-nexoraSurfaceMuted p-1">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_VIEW_TAB', tab: 'browse' })}
                aria-pressed={panelState.viewTab === 'browse'}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors ${panelState.viewTab === 'browse' ? 'bg-nexoraSurface text-nexoraBrand shadow-sm' : 'text-nexoraMuted hover:text-nexoraText'}`}
              >
                Duyệt tin
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_VIEW_TAB', tab: 'mine' })}
                aria-pressed={panelState.viewTab === 'mine'}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors ${panelState.viewTab === 'mine' ? 'bg-nexoraSurface text-nexoraBrand shadow-sm' : 'text-nexoraMuted hover:text-nexoraText'}`}
              >
                Bài của tôi
              </button>
              {canViewContacted ? (
                <button
                  type="button"
                  onClick={() => dispatch({ type: 'SET_VIEW_TAB', tab: 'contacted' })}
                  aria-pressed={panelState.viewTab === 'contacted'}
                  className={`min-h-11 shrink-0 whitespace-nowrap rounded-lg px-3 text-sm font-bold transition-colors ${panelState.viewTab === 'contacted' ? 'bg-nexoraSurface text-nexoraBrand shadow-sm' : 'text-nexoraMuted hover:text-nexoraText'}`}
                >
                  Đã liên hệ
                </button>
              ) : null}
            </div>
            {isMineEmpty ? null : postButtonNode}
          </div>

          {/* Row B: search (flex-1) + <768px "Bộ lọc" button (opens the sheet)
              / >=768px inline "Khu vực" select. `flex-wrap` (not a fixed row)
              is intentional: at compact width (375px) these controls stack
              onto their own lines instead of clipping or hiding (HIG
              responsive audit, round 10). All controls min-h-11 (44px). */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[180px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle" aria-hidden="true" />
              <input
                ref={searchInputRef}
                value={panelState.query}
                onChange={(event) => dispatch({ type: 'SET_QUERY', query: event.target.value })}
                placeholder="Tìm theo tiêu đề, salon, khu vực…"
                aria-label="Tìm tin tuyển dụng"
                className="min-h-11 w-full rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted pl-9 pr-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
              />
            </div>
            <button
              ref={filterButtonRef}
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 text-sm font-bold text-nexoraText md:hidden"
            >
              Bộ lọc
              {activeFilterCount > 0 ? (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-nexoraBrand px-1 text-xs font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            <select
              value={panelState.locationFilter}
              onChange={(event) => dispatch({ type: 'SET_LOCATION_FILTER', location: event.target.value })}
              aria-label="Lọc theo khu vực"
              className="hidden min-h-11 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand md:block"
            >
              {JOB_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {/* Row C: kind chips (horizontally scrollable, no-wrap) + active
              location-filter chip when set + result count. The count used to
              be its own Row D line below this one — folded in here,
              right-aligned, to reclaim a line of vertical space (round 3
              layout pass); same `filteredJobs.length` value, unchanged. */}
          <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pt-0.5" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {(['all', 'seeking', 'hiring'] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => dispatch({ type: 'SET_KIND_FILTER', kind })}
                className={`min-h-11 shrink-0 whitespace-nowrap rounded-full px-3 text-xs font-bold transition-colors ${panelState.kindFilter === kind ? 'bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-nexoraBrandSoft'}`}
              >
                {kind === 'all' ? 'Tất cả' : postKindLabel(kind)}
              </button>
            ))}
            {panelState.locationFilter !== DEFAULT_LOCATION_FILTER ? (
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_LOCATION_FILTER', location: DEFAULT_LOCATION_FILTER })}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-nexoraBrand bg-nexoraBrandSoft px-3 text-xs font-bold text-nexoraBrand"
              >
                {panelState.locationFilter}
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            ) : null}
            <p className="ml-auto shrink-0 text-xs text-nexoraSubtle">{filteredJobs.length} tin</p>
          </div>
        </div>

        {/* Grid + pagination unified across all widths — the earlier isXlUp
            split here only existed to pair with the now-deleted docking
            panel/drawer split; JobDetailView applies at every width now. */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fill,minmax(18rem,1fr))]">
          {pageJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              dimmed={job.status !== 'open'}
              onSelect={() => selectJob(job.id)}
            />
          ))}
          {pageJobs.length === 0 ? (
            panelState.viewTab === 'mine' ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-nexoraBorder bg-nexoraSurface p-10 text-center shadow-nexora-card">
                <p className="text-sm font-semibold text-nexoraText">Bạn chưa có tin nào. Đăng tin đầu tiên.</p>
                <div className="mt-3">
                  {postButtonNode}
                </div>
              </div>
            ) : panelState.viewTab === 'contacted' ? (
              <div className="col-span-full rounded-xl border border-dashed border-nexoraBorder p-6 text-center">
                <p className="text-sm font-semibold text-nexoraText">
                  {contactsQuery.isPending
                    ? 'Đang tải lịch sử liên hệ…'
                    : 'Bạn chưa liên hệ tin nào. Bấm Nhắn tin ở một tin để bắt đầu.'}
                </p>
                {!contactsQuery.isPending && contactsQuery.error?.isMissingTable ? (
                  <p className="mt-1 text-xs text-nexoraSubtle">Chưa bật lưu lịch sử liên hệ</p>
                ) : null}
                {!contactsQuery.isPending && contactsQuery.error && !contactsQuery.error.isMissingTable ? (
                  <p className="mt-1 text-xs font-semibold text-nexoraDanger">Không tải được lịch sử liên hệ. Thử lại.</p>
                ) : null}
              </div>
            ) : (
              <div className="col-span-full rounded-xl border border-dashed border-nexoraBorder p-6 text-center text-sm text-nexoraMuted">
                <p>Không có tin phù hợp bộ lọc. Thử đổi khu vực hoặc loại tin.</p>
                <button type="button" onClick={() => dispatch({ type: 'CLEAR_ALL_FILTERS' })} className="mt-2 text-xs font-bold text-nexoraBrand hover:underline">Xoá bộ lọc</button>
              </div>
            )
          ) : null}
        </section>
        {totalPages > 1 ? (
          <Pagination pageNumber={safePageNumber} pageSize={JOBS_PAGE_SIZE} totalPages={totalPages} onPageChange={(page) => dispatch({ type: 'SET_PAGE', page })} variant="simple" className="mt-4" />
        ) : null}
      </div>

      {createOpen && myPostKind ? (
        <PostJobModal
          postKind={editingJob ? editingJob.postKind : myPostKind}
          personaLabel={personaLabel}
          initial={editingJob ? {
            title: editingJob.title,
            location: editingJob.location,
            salary: editingJob.salary,
            employmentType: editingJob.employmentType,
            experience: editingJob.experience,
            skills: editingJob.skills ?? [],
            availability: editingJob.availability ?? '',
            payModel: editingJob.payModel ?? '',
            support: editingJob.support ?? [],
            description: editingJob.description,
            image: editingJob.image,
            salon: editingJob.salon ?? '',
            urgent: editingJob.urgent ?? false,
          } : null}
          onClose={() => { setCreateOpen(false); setEditingJobId(null) }}
          onSubmit={submitDraft}
        />
      ) : null}

      {filterSheetOpen ? (
        <JobFilterSheet
          locations={JOB_LOCATIONS}
          defaultLocation={DEFAULT_LOCATION_FILTER}
          currentLocation={panelState.locationFilter}
          jobsCountForLocation={jobsCountForLocation}
          onApply={applyLocationFilter}
          onClose={closeFilterSheet}
        />
      ) : null}
    </>
  )
}
