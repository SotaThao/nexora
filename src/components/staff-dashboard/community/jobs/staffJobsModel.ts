import {
  SEEKING_BODY_MAX,
  SEEKING_BODY_MIN,
  SeekingExperience,
  StaffCommunityJobsTab,
} from '../../../../constants/communityJobs'
import {
  JobPayType,
  JobPayUnit,
  JobPostingStatus,
  JobWorkType,
  RecruitmentSkill,
} from '../../../../constants/posRecruitment'
import { formatNationalNumber, PhoneDialCode } from '../../../CountryCodeSelect'
import type { TranslationVariables } from '../../../../types/contexts'
import type {
  JobApplication,
  SeekingPost,
  SeekingPostUpsertInput,
  SeekingPostVisibility,
} from '../../../../types/communityJobs'
import type { PosJobPosting } from '../../../../types/posRecruitment'

export type StaffJobsTranslate = (key: string, variables?: TranslationVariables) => string

export type SeekingDraftField =
  | 'title'
  | 'skills'
  | 'workTypes'
  | 'body'
  | 'displayName'
  | 'phone'

export type SeekingValidationErrors = Partial<Record<SeekingDraftField, string>>

const DEFAULT_SEEKING_VISIBILITY: SeekingPostVisibility = {
  showFullName: true,
  showPhone: false,
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** Minimal shape of `useStaffAccount()`'s `account`/`staffMember` blobs (loosely typed DomainRecord upstream). */
export interface StaffAccountLike {
  fullName?: unknown
  defaultDisplayName?: unknown
  phone?: unknown
}

export function createDefaultSeekingDraft(account: StaffAccountLike = {}): SeekingPostUpsertInput {
  const displayName = typeof account.fullName === 'string' && account.fullName.trim()
    ? account.fullName.trim()
    : typeof account.defaultDisplayName === 'string'
      ? account.defaultDisplayName.trim()
      : ''
  const rawPhoneDigits = typeof account.phone === 'string' ? account.phone.replace(/\D/g, '') : ''
  const nationalPhoneDigits = rawPhoneDigits.length === 11 && rawPhoneDigits.startsWith('1')
    ? rawPhoneDigits.slice(1)
    : rawPhoneDigits

  return {
    title: '',
    skills: [],
    experience: SeekingExperience.UnderOneYear,
    workTypes: [],
    city: '',
    state: '',
    payType: JobPayType.Negotiable,
    payAmount: null,
    payUnit: JobPayUnit.Hour,
    payText: null,
    availableFrom: null,
    body: '',
    displayName,
    phone: formatNationalNumber(nationalPhoneDigits, PhoneDialCode.US),
    visibility: { ...DEFAULT_SEEKING_VISIBILITY },
  }
}

export function seekingPostToDraft(post: SeekingPost): SeekingPostUpsertInput {
  return {
    title: post.title,
    skills: [...post.skills],
    experience: post.experience,
    workTypes: [...post.workTypes],
    city: post.city,
    state: post.state,
    payType: post.payType,
    payAmount: post.payAmount,
    payUnit: post.payUnit ?? JobPayUnit.Hour,
    payText: post.payText,
    availableFrom: post.availableFrom,
    body: post.body,
    displayName: post.displayName,
    phone: post.phone,
    visibility: { ...post.visibility },
  }
}

export function validateSeekingDraft(
  draft: SeekingPostUpsertInput,
  messages: Partial<Record<SeekingDraftField, string>> = {},
): SeekingValidationErrors {
  const error = (field: SeekingDraftField, fallback: string) => messages[field] ?? fallback
  const result: SeekingValidationErrors = {}
  const title = draft.title.trim()
  if (!title) result.title = error('title', 'Title is required.')
  else if (title.length > 120) result.title = error('title', 'Title must be 120 characters or fewer.')
  if (draft.skills.length === 0) result.skills = error('skills', 'Select at least one skill.')
  if (draft.workTypes.length === 0) result.workTypes = error('workTypes', 'Select at least one work type.')
  const body = draft.body.trim()
  if (body.length < SEEKING_BODY_MIN || body.length > SEEKING_BODY_MAX) {
    result.body = error('body', `Description must be between ${SEEKING_BODY_MIN} and ${SEEKING_BODY_MAX} characters.`)
  }
  if (!draft.displayName.trim()) result.displayName = error('displayName', 'Your name is required.')
  const phoneDigits = digitsOnly(draft.phone)
  if (phoneDigits.length !== 10) result.phone = error('phone', 'Enter a valid 10-digit US phone number.')
  return result
}

export interface SeekingPhoneLeak {
  field: 'phone'
  value: string
}

/** Mirrors owner-side findHiddenInfoLeaks, scoped to the one field a seeking post can hide: phone. */
export function findSeekingPhoneLeak(draft: SeekingPostUpsertInput): SeekingPhoneLeak | null {
  if (draft.visibility.showPhone) return null
  const phone = digitsOnly(draft.phone)
  if (phone.length !== 10) return null
  const contentDigits = digitsOnly(`${draft.title} ${draft.body}`)
  return contentDigits.includes(phone) ? { field: 'phone', value: draft.phone } : null
}

export function normalizeStaffJobsTab(value: string | null | undefined): StaffCommunityJobsTab {
  if (value === StaffCommunityJobsTab.Mine) return StaffCommunityJobsTab.Mine
  if (value === StaffCommunityJobsTab.Applied) return StaffCommunityJobsTab.Applied
  return StaffCommunityJobsTab.Browse
}

export function buildAppliedPostingIdSet(applications: JobApplication[]): Set<string> {
  return new Set(applications.map((application) => application.postingId).filter(Boolean))
}

export type HiringPostChatAction =
  | { type: 'directChat'; businessId: string }
  | { type: 'inbox' }

/**
 * Q3 decision: message the salon 1:1 when the staff is linked to that business
 * (real chat via openStaffCommunityChat); otherwise fall back to the community
 * chat inbox with a hint that direct chat unlocks once the hiring API links them.
 */
export function resolveHiringPostChatAction(
  posting: Pick<PosJobPosting, 'businessId'>,
  linkedBusinessIds: ReadonlySet<string> | string[],
): HiringPostChatAction {
  const businessId = posting.businessId?.trim()
  if (!businessId) return { type: 'inbox' }
  const linked = Array.isArray(linkedBusinessIds) ? new Set(linkedBusinessIds) : linkedBusinessIds
  return linked.has(businessId) ? { type: 'directChat', businessId } : { type: 'inbox' }
}

/** Seeking-post byline: real name when the poster opted in, otherwise a generic fallback string. */
export function getSeekingPublicName(
  post: Pick<SeekingPost, 'displayName' | 'visibility'>,
  fallback: string,
): string {
  if (post.visibility.showFullName && post.displayName.trim()) return post.displayName.trim()
  return fallback
}

export const SEEKING_WORK_TYPE_OPTIONS: JobWorkType[] = Object.values(JobWorkType)

export const SEEKING_SKILL_OPTIONS: RecruitmentSkill[] = Object.values(RecruitmentSkill)

export const SEEKING_EXPERIENCE_OPTIONS: SeekingExperience[] = Object.values(SeekingExperience)

/**
 * `resolveTranslation` (src/utils/translate.ts) does plain dot-notation lookup + `{{var}}`
 * interpolation — no i18next-style `_one`/`_other` plural suffix support. So headcount uses its
 * own staff-namespace keys with an explicit count===1 branch rather than the owner-side
 * `components.dashboard.views.pos.recruitment.preview.headcount` key (which is EN-only "openings"
 * text, wrong for count===1, and not ours to change).
 */
export function getHeadcountLabel(count: number, t: StaffJobsTranslate): string {
  const key = count === 1
    ? 'staff_dashboard.community.jobs.card.headcountOne'
    : 'staff_dashboard.community.jobs.card.headcountOther'
  return t(key, { count })
}

export const SEEKING_STATUS_LABEL_KEY: Record<JobPostingStatus, string> = {
  [JobPostingStatus.Draft]: 'staff_dashboard.community.jobs.seekingStatus.Draft',
  [JobPostingStatus.Pending]: 'staff_dashboard.community.jobs.seekingStatus.Pending',
  [JobPostingStatus.Published]: 'staff_dashboard.community.jobs.seekingStatus.Published',
  [JobPostingStatus.Closed]: 'staff_dashboard.community.jobs.seekingStatus.Closed',
  [JobPostingStatus.Filled]: 'staff_dashboard.community.jobs.seekingStatus.Closed',
}
