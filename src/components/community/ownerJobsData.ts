// Data models, seed data and helpers for Owner Jobs (AI Matching & Anonymous Candidates)
// Derived from the official Nexora Touch HTML prototype:
// https://taxiq-nexora-touch.vercel.app/html/pages/community.html?tab=jobs

export type JobCompensation = 'split-6-4' | 'weekly-guarantee'
// 'dismissed' is its own stage, distinct from 'closed' (P3 fix, round 4): a
// dismissed candidate and a genuinely closed pipeline entry are different
// concepts and must not share one bucket — 'closed' stays reserved for the
// latter (not currently set by any action in this demo), so the "Đã đóng"
// pipeline metric doesn't get inflated by "Bỏ qua" clicks.
export type JobStage = 'matched' | 'contact-requested' | 'interviewing' | 'closed' | 'dismissed'

export interface Candidate {
  id: string
  nameTag: string
  title: string
  matchScore: number
  skills: string[]
  distance: number
  availability: string[]
  compensation: JobCompensation
  chips: string[]
  why: string
  stage: JobStage
  saved: boolean
}

export interface JobPost {
  id: string
  title: string
  // string[] to match Candidate.skills (P3 fix, round 4) — was a plain string
  // previously, an inconsistency with no functional bug but worth fixing while
  // touching this file.
  skills: string[]
  distance: number
  availability: string
  compensation: JobCompensation
  status: 'active' | 'closed'
  // Renamed from `createdAt` (P3 fix, round 4): this was always a human-readable
  // status string ("Đang hoạt động"), never a date/timestamp — the old name was
  // misleading for a field that isn't currently rendered anywhere but would be
  // confusing to a future real-API integration expecting `createdAt` to BE a
  // date.
  statusLabel: string
}

export interface CandidateFilters {
  skill: string
  distance: string
  availability: string
  compensation: string
}

// nameTag/title/chips/why below are display text (translated to Vietnamese, matching
// CommunityJobDetail.tsx's tone/terminology). `skills` stays untranslated: it is an
// internal matching key compared against the filter `<option value="...">` in
// OwnerJobsPanel.tsx (never rendered directly), same pattern as `DemoJob['postKind']`
// elsewhere — only the filter option's visible label is translated, not this value.
export const INITIAL_CANDIDATES: Candidate[] = [
  {
    id: 'a7',
    nameTag: 'Thợ #A7',
    title: 'Thợ #A7 — Gel-X · Vẽ móng · 5 năm kinh nghiệm',
    matchScore: 94,
    skills: ['Gel-X', 'Design'],
    distance: 4,
    availability: ['weekends'],
    compensation: 'split-6-4',
    chips: ['Có chứng chỉ hành nghề', 'Muốn ăn chia 6/4', 'Rảnh Thứ 6 – Chủ nhật', 'Trong vòng 4 dặm'],
    why: 'Cả hai tay nghề yêu cầu đều khớp, mức ăn chia mong muốn bằng đúng mức bạn đưa ra, và lịch rảnh trùng với giờ cao điểm của bạn.',
    stage: 'matched',
    saved: false,
  },
  {
    id: 'c2',
    nameTag: 'Thợ #C2',
    title: 'Thợ #C2 — Gel-X · Pedicure · 2 năm kinh nghiệm',
    matchScore: 71,
    skills: ['Gel-X', 'Pedicure'],
    distance: 8,
    availability: ['weekdays'],
    compensation: 'weekly-guarantee',
    chips: ['Có chứng chỉ hành nghề', 'Muốn lương tuần cố định', 'Rảnh ngày thường', 'Trong vòng 8 dặm'],
    why: 'Gel-X thì khớp, nhưng thợ này không có kỹ năng Vẽ móng và đang muốn lương tuần cố định — điều tin đăng của bạn chưa đáp ứng.',
    stage: 'matched',
    saved: false,
  },
]

export const INITIAL_JOB_POSTS: JobPost[] = [
  {
    id: 'job-gel-x-design',
    title: 'Cần thợ Gel-X + Vẽ móng, ăn chia 6/4',
    skills: ['Gel-X', 'Vẽ móng'],
    distance: 10,
    availability: 'Thứ 6 đến Chủ nhật',
    compensation: 'split-6-4',
    status: 'active',
    statusLabel: 'Đang hoạt động',
  },
]

export const DEFAULT_CANDIDATE_FILTERS: CandidateFilters = {
  skill: 'all',
  distance: 'all',
  availability: 'all',
  compensation: 'all',
}

export function jobCompensationLabel(comp: JobCompensation | string): string {
  return comp === 'weekly-guarantee' ? 'Lương tuần cố định' : 'Ăn chia 6/4'
}

export function filterCandidates(candidates: Candidate[], filters: CandidateFilters): Candidate[] {
  const { skill, distance, availability, compensation } = filters
  const maxDist = distance === 'all' || !distance ? null : Number(distance)

  return candidates.filter((c) => {
    const matchSkill = skill === 'all' || c.skills.includes(skill)
    const matchDist = maxDist === null || (!isNaN(maxDist) && c.distance <= maxDist)
    const matchAvail = availability === 'all' || c.availability.includes(availability)
    const matchComp = compensation === 'all' || c.compensation === compensation
    return matchSkill && matchDist && matchAvail && matchComp
  })
}
