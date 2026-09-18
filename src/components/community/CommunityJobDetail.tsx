import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Check, ImagePlus, MapPin, Search, Send, Trash2, X } from 'lucide-react'

import { DEFAULT_JOB_IMAGE, demoJobs, JOB_LOCATIONS } from './communityDemoContent'
import { COMMUNITY_DEMO_PERSONAS, useCommunityAuth } from './CommunityAuth'

import type { DemoJob } from './communityDemoContent'

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

function initials(name?: string | null) {
  return (name || 'N').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function Avatar({ name, className = 'h-9 w-9' }: { name?: string | null; className?: string }) {
  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center rounded-full ${gradientClass} text-xs font-extrabold text-white ${className}`}>
      {initials(name)}
    </span>
  )
}

function postKindLabel(kind: PostKind) {
  return kind === 'hiring' ? 'Tuyển thợ' : 'Tìm việc'
}

function postKindBadgeClassName(kind: PostKind) {
  return kind === 'hiring' ? 'bg-yellow-50 text-yellow-800' : 'bg-blue-50 text-blue-700'
}

function displayableSalary(salary: string): string | null {
  const normalized = salary.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes('/tuần') || normalized.includes('thương lượng')) return salary
  return null
}

function statusLabel(status: DemoJob['status'], postKind: PostKind) {
  if (status === 'filled') return postKind === 'hiring' ? 'Đã tuyển xong' : 'Đã tìm được việc'
  if (status === 'closed') return 'Đã đóng'
  return postKind === 'hiring' ? 'Đang tuyển' : 'Đang tìm việc'
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

function JobChatDock({ job, onClose }: { job: DemoJob; onClose: () => void }) {
  const [messages, setMessages] = useState<DemoBubble[]>(() => seedConversation(job))
  const [body, setBody] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    setMessages((current) => [...current, { id: `local-${current.length}`, from: 'me', body: text }])
    setBody('')
  }

  return (
    <div
      role="dialog"
      aria-label={`Cuộc trò chuyện demo với ${job.posterName}`}
      className="fixed inset-0 z-[145] flex w-full flex-col overflow-hidden bg-nexoraSurface shadow-2xl lg:inset-auto lg:bottom-4 lg:right-[calc(min(560px,100vw)+16px)] lg:h-[min(430px,calc(100dvh-32px))] lg:w-[340px] lg:max-w-[calc(100vw-32px)] lg:rounded-2xl lg:border lg:border-nexoraBorder"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b border-nexoraBorder px-3.5 py-3">
        <Avatar name={job.posterName} className="h-9 w-9 text-xs" />
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm text-nexoraText">{job.posterName}</b>
          <p className="truncate text-[11px] text-nexoraMuted">{job.posterRole}{job.salon ? ` · ${job.salon}` : ''}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng cuộc trò chuyện" className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-nexoraCanvas px-3 py-3">
        <p className="rounded-lg bg-nexoraBrandSoft px-2.5 py-1.5 text-center text-[11px] text-nexoraBrand">Cuộc trò chuyện demo · Tin nhắn không được lưu hoặc gửi thật.</p>
        {messages.map((message) => (
          <p key={message.id} className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-[12.5px] leading-snug ${message.from === 'me' ? 'ml-auto bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraText'}`}>
            {message.body}
          </p>
        ))}
      </div>
      <form onSubmit={submit} className="flex shrink-0 items-center gap-1.5 border-t border-nexoraBorder p-2">
        <input
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={500}
          placeholder="Nhắn tin…"
          aria-label={`Nhắn tin cho ${job.posterName}`}
          className="min-h-9 min-w-0 flex-1 rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted px-3 text-xs text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
        />
        <button type="submit" disabled={!body.trim()} aria-label="Gửi tin nhắn" className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-white ${gradientClass} disabled:cursor-not-allowed disabled:opacity-50`}>
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </form>
    </div>
  )
}

function JobDetailDrawer({
  job,
  isOwn,
  onClose,
  onMessage,
  onManage,
}: {
  job: DemoJob | null
  isOwn: boolean
  onClose: () => void
  onMessage: (job: DemoJob) => void
  onManage: (job: DemoJob, action: 'edit' | 'delete' | 'cycle-status') => void
}) {
  if (!job) return null
  return (
    <aside role="dialog" aria-label="Chi tiết tin tuyển dụng" className="fixed inset-y-0 right-0 z-[140] flex w-full flex-col bg-nexoraSurface shadow-2xl sm:w-[560px]">
      <header className="flex shrink-0 items-center justify-between border-b border-nexoraRule px-5 py-4">
        <b className="text-sm text-nexoraText">Tin tuyển dụng</b>
        <button type="button" onClick={onClose} aria-label="Đóng chi tiết" className="grid h-9 w-9 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <img src={job.image} alt="Không gian salon minh hoạ cho tin tuyển dụng" className="h-56 w-full rounded-xl object-cover" />
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-nexoraWarning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a00] border border-nexoraWarning/40">Nội dung mẫu</span>
          <span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-xs font-bold text-nexoraBrand">{postKindLabel(job.postKind)}</span>
          {job.urgent ? <span className="shrink-0 rounded bg-nexoraWarning px-1.5 py-1 text-[10px] font-extrabold text-white">Cần gấp</span> : null}
          <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${job.status === 'open' ? 'bg-nexoraSuccess/15 text-nexoraSuccess' : 'bg-nexoraSubtle/15 text-nexoraSubtle'}`}>{statusLabel(job.status, job.postKind)}</span>
          {isOwn ? <span className="ml-auto rounded-full bg-nexoraSurfaceMuted px-2 py-0.5 text-xs font-bold text-nexoraText">Bài của bạn</span> : null}
        </div>
        <h2 className="mt-2 text-xl font-extrabold text-nexoraText">{job.title}</h2>
        <p className="mt-1 flex items-center gap-1 text-sm text-nexoraMuted"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />Đăng bởi <b className="font-bold text-nexoraText">{job.posterName}</b> · {job.location} · {job.posted}</p>
        <p className="mt-1.5 text-sm font-bold text-nexoraText">{job.salary} · {job.experience}</p>
        {job.skills?.length ? <p className="mt-1 text-sm text-nexoraMuted">{job.skills.join(' · ')} · {job.availability}</p> : null}
        <p className="mt-4 text-sm leading-relaxed text-nexoraMuted">{job.description}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <div className="rounded-lg bg-nexoraSurfaceMuted p-2.5"><span className="block text-[11px] font-bold text-nexoraSubtle">Mức lương</span><b className="mt-0.5 block text-sm text-nexoraText">{job.salary}</b></div>
          <div className="rounded-lg bg-nexoraSurfaceMuted p-2.5"><span className="block text-[11px] font-bold text-nexoraSubtle">Kinh nghiệm</span><b className="mt-0.5 block text-sm text-nexoraText">{job.experience}</b></div>
          <div className="rounded-lg bg-nexoraSurfaceMuted p-2.5"><span className="block text-[11px] font-bold text-nexoraSubtle">Hình thức</span><b className="mt-0.5 block text-sm text-nexoraText">{job.employmentType}</b></div>
          <div className="rounded-lg bg-nexoraSurfaceMuted p-2.5"><span className="block text-[11px] font-bold text-nexoraSubtle">Trạng thái</span><b className="mt-0.5 block text-sm text-nexoraText">{statusLabel(job.status, job.postKind)}</b></div>
          {job.payModel ? <div className="rounded-lg bg-nexoraSurfaceMuted p-2.5"><span className="block text-[11px] font-bold text-nexoraSubtle">Thu nhập</span><b className="mt-0.5 block text-sm text-nexoraText">{job.payModel}</b></div> : null}
          {job.support?.length ? <div className="rounded-lg bg-nexoraSurfaceMuted p-2.5"><span className="block text-[11px] font-bold text-nexoraSubtle">Tiệm hỗ trợ</span><b className="mt-0.5 block text-sm text-nexoraText">{job.support.join(' · ')}</b></div> : null}
        </div>
        <p className="mt-4 rounded-lg bg-nexoraBrandSoft px-3 py-2 text-xs text-nexoraBrand">Dữ liệu mẫu cho mục đích trình bày. Tin tuyển dụng và cuộc trò chuyện không được lưu hoặc gửi thật.</p>
      </div>
      <footer className="flex shrink-0 gap-2.5 border-t border-nexoraRule px-5 py-4">
        <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded-xl border border-nexoraBorder text-sm font-bold text-nexoraText">Quay lại</button>
        {isOwn ? (
          <>
            <button type="button" onClick={() => onManage(job, 'edit')} className="min-h-11 flex-1 rounded-xl border border-nexoraBorder text-sm font-bold text-nexoraText">Sửa</button>
            <button type="button" onClick={() => onManage(job, 'cycle-status')} className="min-h-11 flex-1 rounded-xl border border-nexoraBorder text-sm font-bold text-nexoraText">Đổi trạng thái</button>
            <button type="button" onClick={() => onManage(job, 'delete')} className="min-h-11 flex-1 rounded-xl bg-nexoraDanger text-sm font-extrabold text-white">Xoá</button>
          </>
        ) : (
          <button type="button" onClick={() => onMessage(job)} className={`min-h-11 flex-1 rounded-xl text-sm font-extrabold text-white ${gradientClass}`}>Nhắn tin cho {job.posterName.split(' ')[0]}</button>
        )}
      </footer>
    </aside>
  )
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

          <section aria-labelledby="job-preview-heading" className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3"><div className="mb-2 flex items-center justify-between"><h3 id="job-preview-heading" className="text-sm font-extrabold text-nexoraText">Xem trước tin đăng</h3><span className="flex items-center gap-1.5">{draft.urgent ? <span className="shrink-0 rounded bg-nexoraWarning px-1.5 py-1 text-[10px] font-extrabold text-white">Cần gấp</span> : null}<span className="rounded-full bg-nexoraBrandSoft px-2 py-0.5 text-[11px] font-bold text-nexoraBrand">{postKindLabel(postKind)}</span></span></div><div className="flex gap-3 rounded-lg bg-nexoraSurface p-2.5"><img src={draft.image} alt="Ảnh minh hoạ đã chọn" className="h-16 w-16 shrink-0 rounded-md object-cover" /><div className="min-w-0"><b className="block truncate text-sm text-nexoraText">{generatedHeadline}</b><p className="mt-0.5 truncate text-xs text-nexoraMuted">{postKind === 'hiring' ? draft.salon.trim() || 'Tên salon' : personaLabel} · {draft.location}</p><p className="mt-1 truncate text-xs font-bold text-nexoraText">{draft.skills.length ? draft.skills.join(' · ') : 'Chọn tay nghề'} · {draft.salary.trim() || 'Mức thu nhập'}</p><p className="mt-0.5 text-xs text-nexoraMuted">{draft.employmentType} · {draft.availability || 'Chọn thời điểm'}</p></div></div></section>
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

export function CommunityJobsPanel() {
  const persona = useCurrentPersona()
  const personaLabel = persona ? (persona.id === 'kayla' ? 'Kayla · Chủ salon' : 'Jessica · Thợ nail') : 'Khách (chỉ xem)'
  const myPostKind: PostKind | null = persona ? (persona.id === 'kayla' ? 'hiring' : 'seeking') : null

  const [jobs, setJobs] = useState<DemoJob[]>(demoJobs)
  const [detailJobId, setDetailJobId] = useState<string | null>(null)
  const [chatJobId, setChatJobId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [editingJobId, setEditingJobId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [kindFilter, setKindFilter] = useState<'all' | PostKind>('all')
  const [locationFilter, setLocationFilter] = useState(JOB_LOCATIONS[0])

  useEffect(() => {
    setCreateOpen(false)
    setEditingJobId(null)
  }, [persona?.id])

  const detailJob = jobs.find((job) => job.id === detailJobId) ?? null
  const chatJob = jobs.find((job) => job.id === chatJobId) ?? null
  const editingJob = jobs.find((job) => job.id === editingJobId) ?? null

  const visibleJobs = jobs.filter((job) => {
    if (kindFilter !== 'all' && job.postKind !== kindFilter) return false
    if (locationFilter !== JOB_LOCATIONS[0] && job.location !== locationFilter) return false
    if (query.trim()) {
      const haystack = `${job.title} ${job.salon ?? ''} ${job.location} ${job.description}`.toLowerCase()
      if (!haystack.includes(query.trim().toLowerCase())) return false
    }
    return true
  })

  const isOwn = (job: DemoJob) => persona !== null && job.ownerPersonaId === persona.id

  const handleManage = (job: DemoJob, action: 'edit' | 'delete' | 'cycle-status') => {
    if (!isOwn(job)) return
    if (action === 'edit') {
      setEditingJobId(job.id)
      setCreateOpen(true)
      setDetailJobId(null)
      return
    }
    if (action === 'delete') {
      setJobs((current) => current.filter((item) => item.id !== job.id))
      setDetailJobId(null)
      setChatJobId((current) => current === job.id ? null : current)
      return
    }
    setJobs((current) => current.map((item) => {
      if (item.id !== job.id) return item
      const next = item.status === 'open' ? 'filled' : item.status === 'filled' ? 'closed' : 'open'
      return { ...item, status: next }
    }))
  }

  const submitDraft = (draft: DraftJob) => {
    if (editingJobId) {
      if (!editingJob || !isOwn(editingJob)) {
        setCreateOpen(false)
        setEditingJobId(null)
        return
      }
      setJobs((current) => current.map((item) => (item.id === editingJob.id ? { ...item, ...draft, salon: draft.salon || null } : item)))
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
      setQuery('')
      setKindFilter('all')
      setLocationFilter(JOB_LOCATIONS[0])
    }
    setCreateOpen(false)
    setEditingJobId(null)
  }

  return (
    <>
      <div className="mb-3 space-y-2.5 rounded-xl border border-nexoraBorder bg-nexoraSurface p-3 shadow-nexora-card">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tiêu đề, salon, khu vực…"
              aria-label="Tìm tin tuyển dụng"
              className="min-h-10 w-full rounded-full border border-nexoraBorder bg-nexoraSurfaceMuted pl-9 pr-3 text-sm text-nexoraText outline-none placeholder:text-nexoraSubtle focus:border-nexoraBrand"
            />
          </div>
          <select value={locationFilter} onChange={(event) => setLocationFilter(event.target.value)} aria-label="Lọc theo khu vực" className="min-h-10 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand">
            {JOB_LOCATIONS.map((loc) => <option key={loc} value={loc}>{loc}</option>)}
          </select>
          {myPostKind ? (
            <button
              type="button"
              onClick={() => { setEditingJobId(null); setCreateOpen(true) }}
              className={`min-h-10 shrink-0 rounded-lg px-4 text-sm font-extrabold text-white ${gradientClass}`}
            >
              {myPostKind === 'hiring' ? 'Đăng tin tuyển thợ' : 'Đăng tin tìm việc'}
            </button>
          ) : (
            <span className="rounded-lg bg-nexoraSurfaceMuted px-3 py-2 text-xs font-semibold text-nexoraSubtle">Đăng nhập persona thợ/chủ để đăng tin</span>
          )}
        </div>
        <div className="flex gap-1.5">
          {(['all', 'seeking', 'hiring'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={`min-h-8 rounded-full px-3 text-xs font-bold transition-colors ${kindFilter === kind ? 'bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-nexoraBrandSoft'}`}
            >
              {kind === 'all' ? 'Tất cả' : postKindLabel(kind)}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(18rem,1fr))]">
        {visibleJobs.map((job) => {
          return (
            <article
              key={job.id}
              role="button"
              tabIndex={0}
              aria-label={`Mở chi tiết tin: ${job.title}`}
              onClick={() => setDetailJobId(job.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  setDetailJobId(job.id)
                }
              }}
              className="cursor-pointer rounded-xl border border-nexoraBorder bg-nexoraSurface p-2.5 text-left shadow-nexora-card transition-colors hover:border-nexoraBrand hover:bg-nexoraBrandSoft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2"
            >
              <div className="flex items-start gap-2.5">
                <img src={job.image} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {job.urgent ? <span className="shrink-0 rounded bg-nexoraDanger px-1.5 py-1 text-[10px] font-extrabold text-white">Cần gấp</span> : null}
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-extrabold ${postKindBadgeClassName(job.postKind)}`}>{postKindLabel(job.postKind)}</span>
                    </div>
                    {displayableSalary(job.salary) ? (
                      <span
                        className="shrink-0 max-w-[144px] truncate rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-black leading-tight text-blue-700"
                        title={job.salary}
                      >
                        {job.salary}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-1 line-clamp-2 text-sm font-extrabold leading-snug text-nexoraText">{job.title}</h3>
                </div>
              </div>
              <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-xs text-nexoraMuted">
                <span className="min-w-0 truncate font-semibold text-nexoraBrand">{job.salon || job.posterName}</span>
                <span aria-hidden="true">·</span>
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                <span className="truncate">{job.location}</span>
              </p>
              <p className="mt-2 min-h-[63px] line-clamp-3 text-sm leading-relaxed text-nexoraMuted">{job.description}</p>
            </article>
          )
        })}
        {visibleJobs.length === 0 ? (
          <p className="col-span-full rounded-xl border border-dashed border-nexoraBorder p-6 text-center text-sm text-nexoraMuted">Không có tin phù hợp bộ lọc. Thử đổi khu vực hoặc loại tin.</p>
        ) : null}
      </section>

      <JobDetailDrawer
        job={detailJob}
        isOwn={detailJob ? isOwn(detailJob) : false}
        onClose={() => setDetailJobId(null)}
        onMessage={(job) => setChatJobId(job.id)}
        onManage={handleManage}
      />
      {chatJob ? <JobChatDock key={chatJob.id} job={chatJob} onClose={() => setChatJobId(null)} /> : null}
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
    </>
  )
}
