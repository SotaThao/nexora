import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Sparkles, UsersRound, X } from 'lucide-react'
import { COMMUNITY_DEMO_PERSONAS, useCommunityAuth } from './CommunityAuth'
import {
  type Candidate,
  type JobPost,
  type CandidateFilters,
  INITIAL_CANDIDATES,
  INITIAL_JOB_POSTS,
  DEFAULT_CANDIDATE_FILTERS,
  filterCandidates,
  jobCompensationLabel,
} from './ownerJobsData'

// Same persona-resolution pattern as CommunityJobDetail.tsx's useCurrentPersona():
// match the signed-in user's email against the demo persona list.
function useIsOwnerPersona() {
  const { user, isAnonymous } = useCommunityAuth()
  return useMemo(() => {
    if (isAnonymous || !user?.email) return false
    const normalizedEmail = user.email.toLowerCase()
    const persona = COMMUNITY_DEMO_PERSONAS.find((p) => p.email.toLowerCase() === normalizedEmail)
    return persona?.id === 'kayla'
  }, [user?.email, isAnonymous])
}

export function OwnerJobsPanel({ isActive = true }: { isActive?: boolean } = {}) {
  const isOwnerPersona = useIsOwnerPersona()

  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES)
  const [jobPosts, setJobPosts] = useState<JobPost[]>(INITIAL_JOB_POSTS)
  const [filters, setFilters] = useState<CandidateFilters>(DEFAULT_CANDIDATE_FILTERS)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Form states for Create Job Post
  const [formTitle, setFormTitle] = useState('')
  const [formSkills, setFormSkills] = useState('')
  const [formDistance, setFormDistance] = useState('10')
  const [formAvailability, setFormAvailability] = useState('')
  const [formCompensation, setFormCompensation] = useState<'split-6-4' | 'weekly-guarantee'>('split-6-4')
  const [formError, setFormError] = useState<string | null>(null)

  const showNotice = (msg: string) => {
    if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    setNotice(msg)
    noticeTimeoutRef.current = setTimeout(() => setNotice(null), 3500)
  }

  // Clear the pending notice timer on unmount — an earlier version used
  // useState for the timer id, which doesn't run any cleanup on unmount (P3 fix).
  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) clearTimeout(noticeTimeoutRef.current)
    }
  }, [])

  // Real modal behavior for the Create Job Post dialog: focus it on open,
  // Escape to close (P2 fix — this one IS meant to be a real modal, unlike
  // JobDetailView elsewhere in Jobs which is inline content). `isActive` guard
  // (P3 fix, round 4): both Jobs panels stay mounted always now (toggled via a
  // `hidden` class, not conditional mounting), so a hidden instance of this
  // panel must not steal focus even in the unlikely case its own dialog state
  // is somehow open.
  useEffect(() => {
    if (!createDialogOpen || !isActive) return
    dialogRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCreateDialogOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [createDialogOpen, isActive])

  // Filtered candidate list
  const visibleCandidates = useMemo(() => {
    return filterCandidates(candidates, filters)
  }, [candidates, filters])

  // Active posts
  const activePosts = useMemo(() => {
    return jobPosts.filter((job) => job.status === 'active')
  }, [jobPosts])

  // Pipeline metrics
  const pipelineCounts = useMemo(() => {
    return {
      matched: candidates.filter((c) => c.stage === 'matched').length,
      contactRequested: candidates.filter((c) => c.stage === 'contact-requested').length,
      interviewing: candidates.filter((c) => c.stage === 'interviewing').length,
      closed: candidates.filter((c) => c.stage === 'closed').length,
    }
  }, [candidates])

  // Candidate Actions
  const handleRequestContact = (candidateId: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: 'contact-requested' } : c)),
    )
    showNotice('Đã gửi yêu cầu liên hệ. Thợ sẽ được thông báo ẩn danh.')
  }

  const handleToggleSave = (candidateId: string) => {
    const target = candidates.find((c) => c.id === candidateId)
    const nextSaved = target ? !target.saved : true
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, saved: nextSaved } : c)),
    )
    showNotice(nextSaved ? 'Đã lưu ứng viên cho phiên này.' : 'Đã bỏ lưu ứng viên.')
  }

  const handleShareWithManager = () => {
    showNotice('Đã chia sẻ tóm tắt ứng viên ẩn danh với quản lý cho phiên này.')
  }

  const handleDismiss = (candidateId: string) => {
    // 'dismissed', not 'closed' (P3 fix, round 4) — a dismissal must not inflate
    // the "Đã đóng" pipeline metric, which is a different concept.
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, stage: 'dismissed' } : c)),
    )
    showNotice('Đã bỏ qua ứng viên. AI sẽ dùng phản hồi này để cải thiện gợi ý.')
  }

  const handleClearFilters = () => {
    setFilters(DEFAULT_CANDIDATE_FILTERS)
  }

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim()) {
      setFormError('Vui lòng nhập chức danh cần tuyển.')
      return
    }
    if (!formSkills.trim()) {
      setFormError('Vui lòng nhập tay nghề yêu cầu.')
      return
    }

    const newPost: JobPost = {
      id: `job-${Date.now()}`,
      title: formTitle.trim(),
      // Free-text input, split into an array to match Candidate.skills (P3 fix,
      // round 4) — same "VD: Gel-X, Vẽ móng" comma-separated convention the
      // placeholder already documents.
      skills: formSkills.trim().split(',').map((s) => s.trim()).filter(Boolean),
      distance: Number(formDistance) || 10,
      availability: formAvailability.trim() || 'Lịch linh hoạt',
      compensation: formCompensation,
      status: 'active',
      statusLabel: 'Đang hoạt động',
    }

    setJobPosts((prev) => [newPost, ...prev])
    setCreateDialogOpen(false)
    setFormTitle('')
    setFormSkills('')
    setFormDistance('10')
    setFormAvailability('')
    setFormCompensation('split-6-4')
    setFormError(null)
    showNotice('Đã đăng tin tuyển dụng cho phiên này.')
  }

  // Owner-only gate (P1 fix): this is an "AI Matching for owners" tool — every
  // other Jobs surface enforces persona eligibility the same way (see
  // CommunityJobDetail.tsx's "Đăng nhập persona thợ/chủ để đăng tin" pattern for
  // non-eligible personas). A guest or Jessica (nail tech) must not be able to
  // post jobs, request contact, or save/dismiss candidates as if they were the
  // salon owner.
  if (!isOwnerPersona) {
    return (
      <div className="w-full max-w-[1180px] mx-auto py-2">
        <div className="rounded-2xl border border-dashed border-nexoraBorder bg-nexoraSurface p-8 text-center shadow-nexora-card">
          <p className="text-sm font-semibold text-nexoraText">Chỉ chủ salon mới xem được trang Quản lý tuyển dụng.</p>
          <p className="mt-1.5 text-xs text-nexoraMuted">Đăng nhập persona chủ salon (Kayla) để dùng tính năng AI gợi ý ứng viên.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1180px] mx-auto py-2">
      {/* Toast Notice — z-[130]: above DemoStateBar's persona switcher (z-[120])
          but below the Create Job Post modal (z-[150]) (P2 fix). */}
      {notice && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-[130] rounded-xl border border-nexoraBrand/20 bg-nexoraSurface px-4 py-3 text-sm font-semibold text-nexoraText shadow-2xl transition-all duration-200"
        >
          {notice}
        </div>
      )}

      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {/* h2, not h1 (P3 fix, round 4): the page-level "Cộng đồng" <h1>
                (restored in CommunityHome, CommunityScreens.tsx) is the one true
                page title — this panel is a sub-view, not its own page. */}
            <h2 className="text-2xl font-extrabold text-nexoraText tracking-tight">Quản lý tuyển dụng</h2>
            {/* Business Rule 11: every listing card/detail view carries a "Sample
                content" label — same badge/wording as CommunityJobDetail.tsx. */}
            <span className="inline-flex items-center rounded-full bg-nexoraWarning/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#8a5a00] border border-nexoraWarning/40">Nội dung mẫu</span>
          </div>
          <p className="text-sm font-medium text-nexoraMuted mt-1">
            Tìm thợ nail phù hợp với vị trí đang tuyển, đồng thời bảo vệ danh tính ứng viên.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-nexoraBrand/20 bg-nexoraBrand/10 px-3 py-1.5 text-xs font-extrabold text-nexoraBrand">
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> AI gợi ý
          </span>
          <button
            type="button"
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-4 py-2.5 text-sm font-extrabold text-white shadow-sm hover:opacity-95 transition-opacity"
          >
            Đăng tin tuyển thợ
          </button>
        </div>
      </div>

      {/* 2. Metric Grid (4 stat cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <article className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card">
          <span className="text-xs font-semibold text-nexoraMuted block">Tin đang tuyển</span>
          <strong className="text-2xl font-black text-nexoraText mt-1.5 block" data-testid="metric-active-posts">
            {activePosts.length}
          </strong>
        </article>
        <article className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card">
          <span className="text-xs font-semibold text-nexoraMuted block">Ứng viên mới</span>
          <strong className="text-2xl font-black text-nexoraText mt-1.5 block" data-testid="metric-new-matches">
            {pipelineCounts.matched}
          </strong>
        </article>
        <article className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card">
          <span className="text-xs font-semibold text-nexoraMuted block">Yêu cầu liên hệ</span>
          <strong className="text-2xl font-black text-nexoraText mt-1.5 block" data-testid="metric-contact-requests">
            {pipelineCounts.contactRequested}
          </strong>
        </article>
        <article className="rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card">
          <span className="text-xs font-semibold text-nexoraMuted block">Phỏng vấn</span>
          <strong className="text-2xl font-black text-nexoraText mt-1.5 block" data-testid="metric-interviews">
            {pipelineCounts.interviewing}
          </strong>
        </article>
      </div>

      {/* 3. Grouped Demand Card */}
      <article className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-white to-emerald-50/50 p-4 shadow-nexora-card flex items-start gap-3.5 mb-5">
        <span className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-700 grid place-items-center shrink-0">
          <UsersRound className="w-5 h-5" aria-hidden="true" />
        </span>
        <div>
          {/* Count derived from `candidates.length`, not hardcoded — an earlier
              draft hardcoded "4" while only 2 candidates were ever shown below,
              and separately claimed "grouped, shown only at 3+, individuals
              can't be identified" while displaying exactly those individuals'
              skills/distance — both self-contradictions (P2 fix). The subtitle
              now describes the actual anonymity mechanism used elsewhere in
              Jobs (identity revealed only after the tech approves contact),
              not a "3+ grouping" threshold that isn't what's implemented here. */}
          <strong className="block text-sm font-bold text-nexoraText leading-snug">
            {candidates.length} thợ Gel-X đang tìm việc trong vòng 10 dặm quanh bạn
          </strong>
          <p className="text-xs text-nexoraMuted mt-1 leading-relaxed">
            Hồ sơ ẩn danh — bạn chỉ thấy tên hoặc số điện thoại sau khi thợ đồng ý cho bạn liên hệ.
          </p>
        </div>
      </article>

      {/* 4. Active Job Post(s) */}
      <div className="space-y-3 mb-6">
        {activePosts.length > 0 ? (
          activePosts.map((job) => (
            <article
              key={job.id}
              className="rounded-2xl border border-nexoraBorder border-l-4 border-l-nexoraBrand bg-nexoraSurface p-4 shadow-nexora-card"
            >
              <strong className="block text-sm font-bold text-nexoraText leading-snug">
                Tin đang tuyển của bạn: “{job.title}”
              </strong>
              <p className="text-xs text-nexoraMuted mt-1 leading-relaxed">
                {job.skills.join(', ')} · Trong vòng {job.distance} dặm · {job.availability} · {jobCompensationLabel(job.compensation)}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-nexoraBorder p-4 text-center text-xs text-nexoraMuted">
            Bạn chưa có tin tuyển dụng nào đang hoạt động. Đăng tin để bắt đầu ghép nối ứng viên.
          </p>
        )}
      </div>

      {/* 5. Section Heading with Match Count */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-base sm:text-lg font-extrabold text-nexoraText">
          Ứng viên ẩn danh cho tin tuyển dụng của bạn
        </h2>
        <span className="inline-flex items-center rounded-full border border-nexoraBrand/20 bg-nexoraBrand/10 px-3 py-1 text-xs font-extrabold text-nexoraBrand">
          {visibleCandidates.length} phù hợp
        </span>
      </div>

      {/* 6. Filter Controls */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <select
          value={filters.skill}
          onChange={(e) => setFilters((prev) => ({ ...prev, skill: e.target.value }))}
          aria-label="Lọc theo tay nghề"
          className="w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-xs font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
        >
          {/* option `value`s stay as internal matching keys (compared against
              Candidate.skills, never rendered directly) — only the label text
              is translated. */}
          <option value="all">Tất cả tay nghề</option>
          <option value="Gel-X">Gel-X</option>
          <option value="Design">Vẽ móng</option>
          <option value="Pedicure">Pedicure</option>
        </select>

        <select
          value={filters.distance}
          onChange={(e) => setFilters((prev) => ({ ...prev, distance: e.target.value }))}
          aria-label="Lọc theo khoảng cách"
          className="w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-xs font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
        >
          <option value="all">Mọi khoảng cách</option>
          <option value="5">Trong vòng 5 dặm</option>
          <option value="10">Trong vòng 10 dặm</option>
        </select>

        <select
          value={filters.availability}
          onChange={(e) => setFilters((prev) => ({ ...prev, availability: e.target.value }))}
          aria-label="Lọc theo lịch rảnh"
          className="w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-xs font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
        >
          <option value="all">Mọi lịch rảnh</option>
          <option value="weekdays">Ngày thường</option>
          <option value="weekends">Cuối tuần</option>
        </select>

        <select
          value={filters.compensation}
          onChange={(e) => setFilters((prev) => ({ ...prev, compensation: e.target.value }))}
          aria-label="Lọc theo hình thức trả lương"
          className="w-full rounded-xl border border-nexoraBorder bg-nexoraSurface px-3 py-2.5 text-xs font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
        >
          <option value="all">Mọi hình thức trả lương</option>
          <option value="split-6-4">Ăn chia 6/4</option>
          <option value="weekly-guarantee">Lương tuần cố định</option>
        </select>
      </div>

      {/* 7. Candidate Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        {visibleCandidates.map((candidate) => {
          const isDismissed = candidate.stage === 'dismissed'
          const isRequested = candidate.stage === 'contact-requested'

          return (
            <article
              key={candidate.id}
              data-testid={`candidate-card-${candidate.id}`}
              // `opacity-90` (not the visually-stronger opacity-45 an earlier
              // draft used) — opacity-45 measured at ~2.1:1 contrast for
              // nexoraMuted text against nexoraSurface, well under the 4.5:1 AA
              // minimum; opacity-90 measures ~5.5:1 (same fix approach already
              // verified for JobCard's dimmed state in CommunityJobDetail.tsx).
              className={`rounded-2xl border border-nexoraBorder bg-nexoraSurface p-5 shadow-nexora-card transition-all ${
                isDismissed ? 'opacity-90 grayscale' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-extrabold text-nexoraText leading-snug">{candidate.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-black ${
                    candidate.matchScore >= 90
                      ? 'bg-emerald-500/15 text-emerald-800 border border-emerald-500/20'
                      : 'bg-amber-500/15 text-amber-800 border border-amber-500/20'
                  }`}
                >
                  {candidate.matchScore}% phù hợp
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {candidate.chips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-[11px] font-bold text-nexoraMuted"
                  >
                    {chip}
                  </span>
                ))}
              </div>

              <p className="mt-3.5 rounded-xl bg-nexoraBrand/5 p-3 text-xs leading-relaxed text-nexoraMuted">
                <strong className="font-bold text-nexoraBrand">Lý do:</strong> {candidate.why}
              </p>

              {/* min-h-11 (44px, up from min-h-10/40px): touch-target audit,
                  round 10 — these are the primary candidate actions, same
                  minimum as every other control in the Jobs surface. */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => handleRequestContact(candidate.id)}
                  disabled={isRequested || isDismissed}
                  className={`min-h-11 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-colors ${
                    isRequested
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 cursor-default'
                      : 'border border-nexoraBrand bg-nexoraBrand text-white hover:bg-nexoraBrand/90'
                  }`}
                >
                  {isRequested ? 'Đã gửi yêu cầu liên hệ' : 'Yêu cầu liên hệ'}
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSave(candidate.id)}
                  aria-pressed={candidate.saved}
                  className={`min-h-11 rounded-xl border border-nexoraBorder px-3.5 py-2 text-xs font-bold transition-colors ${
                    candidate.saved ? 'bg-nexoraBrand/10 text-nexoraBrand border-nexoraBrand/30' : 'text-nexoraMuted hover:bg-nexoraSurfaceMuted'
                  }`}
                >
                  {candidate.saved ? 'Đã lưu ứng viên' : 'Lưu ứng viên'}
                </button>
                <button
                  type="button"
                  onClick={handleShareWithManager}
                  className="min-h-11 rounded-xl border border-nexoraBorder px-3.5 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition-colors"
                >
                  Chia sẻ với quản lý
                </button>
                <button
                  type="button"
                  onClick={() => handleDismiss(candidate.id)}
                  disabled={isDismissed}
                  className="min-h-11 rounded-xl border border-nexoraBorder px-3.5 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition-colors disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  {isDismissed ? 'Đã bỏ qua' : 'Bỏ qua'}
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {/* Empty State */}
      {visibleCandidates.length === 0 && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-2xl border border-dashed border-nexoraBorder p-8 text-center my-6"
        >
          <strong className="block text-sm font-bold text-nexoraText mb-1">
            Không có ứng viên phù hợp với bộ lọc này.
          </strong>
          <span className="block text-xs text-nexoraMuted mb-3">
            Thử mở rộng tay nghề, khoảng cách, lịch rảnh hoặc hình thức trả lương.
          </span>
          <button
            type="button"
            onClick={handleClearFilters}
            className="rounded-xl border border-nexoraBorder bg-nexoraSurface px-4 py-2 text-xs font-extrabold text-nexoraBrand hover:bg-nexoraSurfaceMuted transition-colors"
          >
            Xoá bộ lọc
          </button>
        </div>
      )}

      {/* 8. Hiring Pipeline Status */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-nexora-card my-5">
        <article className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-semibold text-nexoraMuted">Phù hợp</span>
          <strong className="text-xl font-black text-nexoraText mt-1" data-testid="pipeline-matched">
            {pipelineCounts.matched}
          </strong>
        </article>
        <article className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-semibold text-nexoraMuted">Đã yêu cầu liên hệ</span>
          <strong className="text-xl font-black text-nexoraText mt-1" data-testid="pipeline-contact-requested">
            {pipelineCounts.contactRequested}
          </strong>
        </article>
        <article className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-semibold text-nexoraMuted">Đang phỏng vấn</span>
          <strong className="text-xl font-black text-nexoraText mt-1" data-testid="pipeline-interviewing">
            {pipelineCounts.interviewing}
          </strong>
        </article>
        <article className="flex flex-col items-center justify-center p-2 text-center">
          <span className="text-xs font-semibold text-nexoraMuted">Đã đóng</span>
          <strong className="text-xl font-black text-nexoraText mt-1" data-testid="pipeline-closed">
            {pipelineCounts.closed}
          </strong>
        </article>
      </div>

      {/* 9. Privacy and Hiring Guardrails */}
      <aside className="rounded-2xl border border-nexoraBrand/20 bg-gradient-to-br from-white to-nexoraBrand/5 p-4 shadow-nexora-card mt-5">
        <strong className="block text-xs font-bold text-nexoraBrand mb-1">
          Quyền riêng tư & nguyên tắc tuyển dụng
        </strong>
        <p className="text-xs text-nexoraMuted leading-relaxed">
          AI xếp hạng hồ sơ thợ ẩn danh; bạn sẽ không thấy danh tính chỉ từ một gợi ý. Việc liên hệ diễn ra
          hai chiều: thợ phải đồng ý trước khi bạn thấy tên hoặc số điện thoại. NEXORA là nền tảng kết nối,
          không tuyển dụng, trả lương, hay tư vấn về hình thức hợp đồng 1099/W-2.
        </p>
      </aside>

      {/* 10. Create Job Post Dialog — z-[150] matches the Variant B modal scale
          (PostJobModal in CommunityJobDetail.tsx), well above DemoStateBar's
          persona switcher (z-[120]), which used to stay clickable above this
          "modal" at the old z-50 (P2 fix). `tabIndex={-1}` + the focus effect
          above make the dialog itself the initial focus target on open. */}
      {createDialogOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-job-title"
          tabIndex={-1}
          // items-end at compact / items-center at sm+ (bottom sheet -> centered
          // dialog), matching PostJobModal's pattern in CommunityJobDetail.tsx.
          className="fixed inset-0 z-[150] flex items-end justify-center bg-black/50 p-0 outline-none sm:items-center sm:p-4"
        >
          {/* No animate-in/fade-in/zoom-in-95 here (P3 fix): this repo's Tailwind
              config has plugins: [] — tailwindcss-animate isn't installed, so
              those classes were dead (no working animation), not a real one
              that's just invisible. Adding the plugin is out of scope here. */}
          {/* max-h-[92dvh] + overflow-y-auto (HIG touch/keyboard audit, round 10):
              this dialog has 5 fields + header + footer (~520px of content) and
              previously had NO height cap and NO scroll — on a short viewport, or
              with the software keyboard open shrinking the visual viewport, the
              footer's submit button could render fully off-screen with no way to
              scroll to it. PostJobModal already had this right; this dialog did
              not — brought to parity rather than left inconsistent. */}
          <section className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-nexoraSurface p-6 shadow-2xl sm:rounded-2xl">
            <header className="flex items-center justify-between border-b border-nexoraRule pb-4 mb-4">
              <h2 id="create-job-title" className="text-lg font-extrabold text-nexoraText">
                Đăng tin tuyển thợ
              </h2>
              <button
                type="button"
                onClick={() => setCreateDialogOpen(false)}
                aria-label="Đóng đăng tin"
                className="rounded-full p-1.5 text-nexoraMuted hover:bg-nexoraSurfaceMuted transition-colors"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={handleCreateSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="job-title-input" className="block text-xs font-bold text-nexoraText mb-1.5">
                  Chức danh cần tuyển *
                </label>
                <input
                  id="job-title-input"
                  name="jobTitle"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="VD: Cần thợ Gel-X + Vẽ móng, ăn chia 6/4"
                  required
                  className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3.5 py-2.5 text-sm font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
                />
              </div>

              <div>
                <label htmlFor="job-skills-input" className="block text-xs font-bold text-nexoraText mb-1.5">
                  Tay nghề yêu cầu *
                </label>
                <input
                  id="job-skills-input"
                  name="jobSkills"
                  value={formSkills}
                  onChange={(e) => setFormSkills(e.target.value)}
                  placeholder="VD: Gel-X, Vẽ móng"
                  required
                  className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3.5 py-2.5 text-sm font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
                />
              </div>

              <div>
                <label htmlFor="job-distance-input" className="block text-xs font-bold text-nexoraText mb-1.5">
                  Khoảng cách tối đa (dặm)
                </label>
                <input
                  id="job-distance-input"
                  name="jobDistance"
                  type="number"
                  min="1"
                  value={formDistance}
                  onChange={(e) => setFormDistance(e.target.value)}
                  className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3.5 py-2.5 text-sm font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
                />
              </div>

              <div>
                <label htmlFor="job-availability-input" className="block text-xs font-bold text-nexoraText mb-1.5">
                  Lịch làm việc
                </label>
                <input
                  id="job-availability-input"
                  name="jobAvailability"
                  value={formAvailability}
                  onChange={(e) => setFormAvailability(e.target.value)}
                  placeholder="VD: Thứ 6 đến Chủ nhật"
                  className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3.5 py-2.5 text-sm font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
                />
              </div>

              <div>
                <label htmlFor="job-compensation-input" className="block text-xs font-bold text-nexoraText mb-1.5">
                  Hình thức trả lương mong muốn
                </label>
                <select
                  id="job-compensation-input"
                  name="jobCompensation"
                  value={formCompensation}
                  onChange={(e) => setFormCompensation(e.target.value as 'split-6-4' | 'weekly-guarantee')}
                  className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas px-3.5 py-2.5 text-sm font-semibold text-nexoraText focus:outline-none focus:ring-2 focus:ring-nexoraBrand"
                >
                  <option value="split-6-4">Ăn chia 6/4</option>
                  <option value="weekly-guarantee">Lương tuần cố định</option>
                </select>
              </div>

              {formError && (
                <p role="alert" className="text-xs font-bold text-nexoraDanger">
                  {formError}
                </p>
              )}

              <footer className="flex items-center justify-end gap-3 pt-4 border-t border-nexoraRule">
                <button
                  type="button"
                  onClick={() => setCreateDialogOpen(false)}
                  className="rounded-xl border border-nexoraBorder px-4 py-2 text-sm font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition-colors"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-5 py-2 text-sm font-extrabold text-white shadow-sm hover:opacity-95 transition-opacity"
                >
                  Đăng tin
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
