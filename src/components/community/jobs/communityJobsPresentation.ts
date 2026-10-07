import { JobPostingStatus } from '../../../constants/posRecruitment'
import { DEFAULT_JOB_IMAGE } from '../communityDemoContent'
import { formatRecruitmentDate, formatRecruitmentLocation, getPublicSalonLabel, getRecruitmentPayLabel } from '../../dashboard/views/pos/recruitment/recruitmentModel'
import { formatSalaryCardLabel } from '../../staff-dashboard/community/jobs/salaryCardLabel'
import type { CommunityBrowseJob } from '../CommunityJobDetail'
import type { PosJobPosting } from '../../../types/posRecruitment'
import type { SeekingPost } from '../../../types/communityJobs'
import { getSeekingPublicName } from '../../staff-dashboard/community/jobs/staffJobsModel'
import type { StaffJobsTranslate } from '../../staff-dashboard/community/jobs/staffJobsModel'

const DEMO_POST_KEYS: Record<string, string> = {
  'mock-hiring-seed-001': 'acrylicDip',
  'mock-hiring-seed-002': 'manicurePedicure',
  'mock-hiring-seed-003': 'nailArt',
  'mock-hiring-seed-004': 'headSpa',
}

/** Presentation only: never rewrite shared POS fixtures or user-created postings. */
export function presentCommunityDemoPosting(posting: PosJobPosting, t: StaffJobsTranslate): PosJobPosting {
  const demoKey = DEMO_POST_KEYS[posting.id]
  const seedSequence = posting.id.slice(-3)
  if (
    !demoKey
    || posting.businessId != null
    || posting.code !== `SEED-${seedSequence}`
    || posting.createdAt !== '2026-09-01T12:00:00.000Z'
    || posting.updatedAt !== posting.createdAt
  ) return posting
  const key = `community_jobs_browser.demoPosts.${demoKey}`
  return {
    ...posting,
    title: t(`${key}.title`),
    body: t(`${key}.body`),
    payText: t(`${key}.payText`),
    contactName: t('community_jobs_browser.demoPosts.contactName'),
  }
}

export function normalizeCommunityJobsSearch(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim()
}

export function matchesCommunityPostingKeyword(posting: PosJobPosting, keyword?: string): boolean {
  const query = normalizeCommunityJobsSearch(keyword ?? '')
  return !query || normalizeCommunityJobsSearch([
    posting.title, posting.body, posting.payText, posting.businessName, posting.city, posting.state, ...posting.skills,
  ].filter(Boolean).join(' ')).includes(query)
}

/** A read-only card projection; detail/application actions always look up the raw ID. */
export function toCommunityHiringCard(posting: PosJobPosting, t: StaffJobsTranslate, language: string): CommunityBrowseJob {
  const salary = getRecruitmentPayLabel(posting, t)
  return {
    id: posting.id,
    postKind: 'hiring',
    title: posting.title,
    salon: getPublicSalonLabel(posting, t),
    location: formatRecruitmentLocation(posting.city, posting.state),
    salary,
    // Preserve commission and non-weekly units instead of the legacy demo fallback.
    salaryChipLabel: formatSalaryCardLabel(salary, t('staff_dashboard.community.jobs.card.salaryNegotiable')) ?? salary,
    status: posting.status === JobPostingStatus.Filled ? 'filled' : posting.status === JobPostingStatus.Closed || posting.status === JobPostingStatus.Draft ? 'closed' : 'open',
    urgent: posting.isUrgent,
    posted: formatRecruitmentDate(posting.publishedAt || posting.createdAt, language),
    posterName: posting.visibility.showContactName ? posting.contactName : getPublicSalonLabel(posting, t),
    image: DEFAULT_JOB_IMAGE,
    description: posting.body,
    ownerPersonaId: null,
    skills: posting.skills,
  }
}

/** Public seeking feed projection contains no phone or hidden name; raw records stay in the parent. */
export function toCommunitySeekingCard(post: SeekingPost, t: StaffJobsTranslate, language: string): CommunityBrowseJob {
  const publicName = getSeekingPublicName(post, t('staff_dashboard.community.jobs.feed.anonymousTechnician'))
  const salary = getRecruitmentPayLabel(post, t)
  return {
    id: `public-seeking:${post.id}`,
    postKind: 'seeking',
    title: post.title,
    salon: publicName,
    location: formatRecruitmentLocation(post.city, post.state),
    salary,
    salaryChipLabel: formatSalaryCardLabel(salary, t('staff_dashboard.community.jobs.card.salaryNegotiable')) ?? salary,
    status: 'open',
    urgent: false,
    posted: formatRecruitmentDate(post.publishedAt || post.createdAt, language),
    posterName: publicName,
    image: DEFAULT_JOB_IMAGE,
    description: post.body,
    ownerPersonaId: null,
    skills: post.skills,
  }
}

export function matchesCommunityBrowseKeyword(job: CommunityBrowseJob, keyword: string): boolean {
  const query = normalizeCommunityJobsSearch(keyword)
  return !query || normalizeCommunityJobsSearch([
    job.title, job.salon, job.location, job.description, job.salary, ...(job.skills ?? []),
  ].filter(Boolean).join(' ')).includes(query)
}
