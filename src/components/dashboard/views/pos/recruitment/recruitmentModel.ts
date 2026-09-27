import {
  JobPayType,
  JobPayUnit,
  JobPosition,
  JobPostingStatus,
  JOB_VISIBILITY_PRESET_OPTIONS,
  JobVisibilityPreset,
  JobWorkType,
  RecruitmentBenefit,
  RecruitmentSkill,
} from '../../../../../constants/posRecruitment'
import { formatNationalNumber, PhoneDialCode } from '../../../../CountryCodeSelect'
import type { MerchantBusinessInfo } from '../../../../../types/domain'
import type { TranslationVariables } from '../../../../../types/contexts'
import type {
  JobPostingVisibility,
  PosJobPosting,
  PosJobPostingUpsertInput,
} from '../../../../../types/posRecruitment'
import { formatUsdAmount } from '../../../../../utils/currencyInput'

export type RecruitmentDraftField =
  | 'title'
  | 'headcount'
  | 'skills'
  | 'deadline'
  | 'payAmount'
  | 'body'
  | 'contactName'
  | 'phone'
  | 'privacy'

export type RecruitmentValidationErrors = Partial<Record<RecruitmentDraftField, string>>

export interface HiddenInfoLeak {
  field: 'businessName' | 'address' | 'zipCode' | 'contactName' | 'phone'
  value: string
}

export type RecruitmentPreviewDraft = PosJobPostingUpsertInput & {
  status?: JobPostingStatus
}

export type RecruitmentTranslate = (key: string, variables?: TranslationVariables) => string

export interface QuickPostDraft {
  salonName: string
  location: string
  workType: JobWorkType
  payText: string
  message: string
  isUrgent: boolean
  benefits: RecruitmentBenefit[]
}

export type QuickPostValidationErrors = Partial<Record<'salonName' | 'location' | 'message', string>>

export function joinRecruitmentMeta(parts: Array<string | null | undefined>): string {
  return parts.map((part) => part?.trim()).filter(Boolean).join(' · ')
}

export function formatRecruitmentLocation(
  city: string | null | undefined,
  state: string | null | undefined,
  fallback = '',
): string {
  return [city, state].map((part) => part?.trim()).filter(Boolean).join(', ') || fallback
}

const SKILL_KEYWORDS: Array<{ skill: RecruitmentSkill; patterns: RegExp[] }> = [
  { skill: RecruitmentSkill.Acrylic, patterns: [/acrylic/i, /nail bột/i] },
  { skill: RecruitmentSkill.Dip, patterns: [/\bdip\b/i] },
  { skill: RecruitmentSkill.GelX, patterns: [/gel\s*x/i] },
  { skill: RecruitmentSkill.BuilderGel, patterns: [/builder\s*gel/i] },
  { skill: RecruitmentSkill.Pedicure, patterns: [/pedi/i, /chân nước/i] },
  { skill: RecruitmentSkill.Manicure, patterns: [/mani/i, /tay nước/i] },
  { skill: RecruitmentSkill.French, patterns: [/french/i] },
  { skill: RecruitmentSkill.HeadSpa, patterns: [/head\s*spa/i] },
  { skill: RecruitmentSkill.Lash, patterns: [/lash/i, /eyelash/i, /nối mi/i] },
  { skill: RecruitmentSkill.Waxing, patterns: [/wax/i] },
  { skill: RecruitmentSkill.ThreeDNailArt, patterns: [/\b3d\b/i] },
  { skill: RecruitmentSkill.NailArt, patterns: [/design/i, /nail\s*art/i, /vẽ/i] },
  { skill: RecruitmentSkill.Gel, patterns: [/gel/i, /shellac/i] },
]

const GENERIC_MANAGER_LABELS = ['Salon manager', 'Quản lý tiệm']

export function normalizeRecruitmentSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/\s+/g, ' ')
    .trim()
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function phoneDigits(value: string): string {
  const digits = digitsOnly(value)
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits
}

function isGenericManagerLabel(value: string): boolean {
  const normalized = normalizeRecruitmentSearch(value)
  return GENERIC_MANAGER_LABELS.some((label) => normalizeRecruitmentSearch(label) === normalized)
}

function defaultDeadline(today: Date): string {
  const deadline = new Date(today)
  deadline.setDate(deadline.getDate() + 30)
  return deadline.toISOString().slice(0, 10)
}

export function resolveVisibilityPreset(preset: JobVisibilityPreset): JobPostingVisibility {
  if (preset === JobVisibilityPreset.ChatOnly) {
    return {
      showBusinessName: true,
      showAddress: true,
      showContactName: false,
      showPhone: false,
    }
  }
  if (preset === JobVisibilityPreset.HideNameAndContact) {
    return {
      showBusinessName: false,
      showAddress: false,
      showContactName: false,
      showPhone: false,
    }
  }
  return {
    showBusinessName: true,
    showAddress: true,
    showContactName: true,
    showPhone: true,
  }
}

export function deriveVisibilityPreset(visibility: JobPostingVisibility): JobVisibilityPreset {
  const matches = (preset: JobVisibilityPreset) => {
    const resolved = resolveVisibilityPreset(preset)
    return Object.keys(resolved).every((key) => {
      const field = key as keyof JobPostingVisibility
      return visibility[field] === resolved[field]
    })
  }

  for (const preset of JOB_VISIBILITY_PRESET_OPTIONS) {
    if (matches(preset)) return preset
  }
  return JobVisibilityPreset.Custom
}

export function visibilityMatchesPreset(
  visibility: JobPostingVisibility,
  preset: JobVisibilityPreset,
): boolean {
  const resolved = resolveVisibilityPreset(preset)
  return Object.keys(resolved).every((key) => {
    const field = key as keyof JobPostingVisibility
    return visibility[field] === resolved[field]
  })
}

export function createDefaultJobDraft(
  businessInfo: MerchantBusinessInfo = {},
  today = new Date(),
): PosJobPostingUpsertInput {
  const rawPhoneDigits = typeof businessInfo.phone === 'string'
    ? businessInfo.phone.replace(/\D/g, '')
    : ''
  const nationalPhoneDigits = rawPhoneDigits.length === 11 && rawPhoneDigits.startsWith('1')
    ? rawPhoneDigits.slice(1)
    : rawPhoneDigits
  const phone = formatNationalNumber(nationalPhoneDigits, PhoneDialCode.US)
  return {
    title: '',
    position: JobPosition.NailTechnician,
    headcount: 1,
    workType: JobWorkType.FullTime,
    skills: [],
    payType: JobPayType.Negotiable,
    payAmount: null,
    payUnit: JobPayUnit.Hour,
    payText: null,
    isUrgent: false,
    benefits: [],
    body: '',
    deadline: defaultDeadline(today),
    businessName: typeof businessInfo.name === 'string' ? businessInfo.name : '',
    address: typeof businessInfo.address === 'string' ? businessInfo.address : '',
    city: typeof businessInfo.city === 'string' ? businessInfo.city : '',
    state: typeof businessInfo.state === 'string' ? businessInfo.state : '',
    zipCode: typeof businessInfo.zipCode === 'string' ? businessInfo.zipCode : '',
    contactName: '',
    phone,
    visibilityPreset: JobVisibilityPreset.ShowAll,
    visibility: resolveVisibilityPreset(JobVisibilityPreset.ShowAll),
    selectedServices: [],
  }
}

export function postingToDraft(posting: PosJobPosting): PosJobPostingUpsertInput {
  return {
    title: posting.title,
    position: posting.position,
    headcount: posting.headcount,
    workType: posting.workType,
    skills: [...posting.skills],
    payType: posting.payType,
    payAmount: posting.payAmount,
    payUnit: posting.payUnit ?? JobPayUnit.Hour,
    payText: posting.payText,
    isUrgent: posting.isUrgent,
    benefits: [...posting.benefits],
    body: posting.body,
    deadline: posting.deadline,
    businessName: posting.businessName,
    address: posting.address,
    city: posting.city,
    state: posting.state,
    zipCode: posting.zipCode,
    contactName: posting.contactName,
    phone: posting.phone,
    visibilityPreset: posting.visibilityPreset,
    visibility: { ...posting.visibility },
    selectedServices: posting.selectedServices.map((service) => ({ ...service })),
  }
}

export function validateJobDraft(
  draft: PosJobPostingUpsertInput,
  messages: Partial<Record<RecruitmentDraftField, string>> = {},
): RecruitmentValidationErrors {
  const error = (field: RecruitmentDraftField, fallback: string) => messages[field] ?? fallback
  const result: RecruitmentValidationErrors = {}
  const title = draft.title.trim()
  if (!title) result.title = error('title', 'Title is required.')
  else if (title.length > 120) result.title = error('title', 'Title must be 120 characters or fewer.')
  if (!Number.isInteger(draft.headcount) || draft.headcount < 1 || draft.headcount > 50) {
    result.headcount = error('headcount', 'Headcount must be an integer from 1 to 50.')
  }
  if (draft.skills.length === 0) result.skills = error('skills', 'Select at least one skill.')
  if (!draft.deadline) result.deadline = error('deadline', 'A deadline is required.')
  if (
    draft.payType === JobPayType.Fixed
    && (draft.payAmount == null || draft.payAmount <= 0 || draft.payAmount > 100000)
  ) {
    result.payAmount = error('payAmount', 'Fixed pay must be greater than $0 and no more than $100,000.')
  }
  const body = draft.body.trim()
  if (body.length < 20 || body.length > 4000) {
    result.body = error('body', 'Description must be between 20 and 4,000 characters.')
  }
  if (!draft.contactName.trim()) result.contactName = error('contactName', 'Contact name is required.')
  if (phoneDigits(draft.phone).length !== 10) {
    result.phone = error('phone', 'Enter a valid 10-digit US phone number.')
  }
  return result
}

export function findHiddenInfoLeaks(draft: PosJobPostingUpsertInput): HiddenInfoLeak[] {
  const content = normalizeRecruitmentSearch(`${draft.title} ${draft.body}`)
  const contentDigits = digitsOnly(`${draft.title} ${draft.body}`)
  const candidates: HiddenInfoLeak[] = []
  const addText = (field: HiddenInfoLeak['field'], value: string, hidden: boolean) => {
    const normalized = normalizeRecruitmentSearch(value)
    if (hidden && normalized.length >= 3 && content.includes(normalized)) {
      candidates.push({ field, value })
    }
  }
  addText('businessName', draft.businessName, !draft.visibility.showBusinessName)
  addText('address', draft.address, !draft.visibility.showAddress)
  addText('zipCode', draft.zipCode, !draft.visibility.showAddress)
  if (!isGenericManagerLabel(draft.contactName)) {
    addText('contactName', draft.contactName, !draft.visibility.showContactName)
  }
  const phone = phoneDigits(draft.phone)
  if (!draft.visibility.showPhone && phone.length === 10 && contentDigits.includes(phone)) {
    candidates.push({ field: 'phone', value: draft.phone })
  }
  return candidates
}

export function getPublicSalonLabel(
  draft: Pick<PosJobPostingUpsertInput, 'businessName' | 'city' | 'state' | 'visibility'>,
  t: RecruitmentTranslate,
): string {
  if (draft.visibility.showBusinessName) {
    return draft.businessName.trim() || t('components.dashboard.views.pos.recruitment.preview.salonFallback')
  }
  const location = formatRecruitmentLocation(draft.city, draft.state)
  return location
    ? t('components.dashboard.views.pos.recruitment.preview.hiddenSalon', { location })
    : t('components.dashboard.views.pos.recruitment.preview.hiddenSalonFallback')
}

export function getRecruitmentPayLabel(
  draft: Pick<PosJobPostingUpsertInput, 'payType' | 'payAmount' | 'payUnit' | 'payText'>,
  t: RecruitmentTranslate,
): string {
  const key = 'components.dashboard.views.pos.recruitment'
  if (draft.payText?.trim()) return draft.payText.trim()
  if (draft.payType === JobPayType.Negotiable) return t(`${key}.preview.negotiablePay`)
  if (draft.payType === JobPayType.Commission) return t(`${key}.preview.commissionPay`)
  if (!draft.payAmount) return t(`${key}.preview.fixedPayMissing`)
  const amount = Number.isInteger(draft.payAmount)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(draft.payAmount)
    : formatUsdAmount(draft.payAmount)
  return t(`${key}.preview.fixedPay`, {
    amount,
    unit: draft.payUnit ? t(`${key}.enums.payUnit.${draft.payUnit}`) : '',
  })
}

export function formatRecruitmentDate(value: string, language: string): string {
  const localDateMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const date = localDateMatch
    ? new Date(
        Number(localDateMatch[1]),
        Number(localDateMatch[2]) - 1,
        Number(localDateMatch[3]),
      )
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en-US', {
    month: language === 'vi' ? '2-digit' : 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function buildSuggestedDescription(
  draft: PosJobPostingUpsertInput,
  t: RecruitmentTranslate,
): string {
  const key = 'components.dashboard.views.pos.recruitment'
  const location = formatRecruitmentLocation(draft.city, draft.state)
  const salon = getPublicSalonLabel(draft, t)
  const position = t(`${key}.enums.position.${draft.position}`).toLocaleLowerCase()
  const workType = t(`${key}.enums.workType.${draft.workType}`).toLocaleLowerCase()
  const skills = draft.skills.map((skill) => t(`${key}.enums.skill.${skill}`)).join(', ')
  const intro = t(`${key}.composer.content.template.${location ? 'introWithLocation' : 'intro'}`, {
    salon,
    count: draft.headcount,
    position,
    location,
  })
  const details = t(`${key}.composer.content.template.${skills ? 'details' : 'detailsWithoutSkills'}`, {
    skills,
    workType,
    pay: getRecruitmentPayLabel(draft, t),
  })
  const benefits = draft.benefits.length > 0
    ? t(`${key}.composer.content.template.benefits`, {
        benefits: draft.benefits.map((benefit) => t(`${key}.enums.benefit.${benefit}`)).join(', '),
      })
    : ''
  const closing = draft.visibility.showPhone && draft.phone.trim()
    ? t(`${key}.composer.content.template.phoneClosing`, {
        contact: draft.visibility.showContactName && draft.contactName.trim() && !isGenericManagerLabel(draft.contactName)
          ? draft.contactName.trim()
          : t(`${key}.composer.content.template.manager`),
        phone: draft.phone,
      })
    : t(`${key}.composer.content.template.chatClosing`)

  return [intro, details, benefits, `${t(`${key}.composer.content.template.team`)} ${closing}`]
    .filter(Boolean)
    .join('\n\n')
}

export function buildQuickPostTitle(
  workType: JobWorkType,
  location: string,
  t: RecruitmentTranslate,
): string {
  const key = 'components.dashboard.views.pos.recruitment.quick'
  const base = t(`${key}.autoTitle`, { workType: t(`${key}.workType.${workType}`) })
  return joinRecruitmentMeta([base, location])
}

export function validateQuickPostDraft(
  draft: Pick<QuickPostDraft, 'salonName' | 'location' | 'workType' | 'message'>,
  t: RecruitmentTranslate,
): QuickPostValidationErrors {
  const key = 'components.dashboard.views.pos.recruitment.quick.validation'
  const errors: QuickPostValidationErrors = {}
  if (!draft.salonName.trim()) errors.salonName = t(`${key}.salonName`)
  if (buildQuickPostTitle(draft.workType, draft.location.trim(), t).length > 120) {
    errors.location = t(`${key}.titleLength`)
  }
  if (draft.message.length > 500) errors.message = t(`${key}.message`)
  return errors
}

function splitQuickLocation(location: string): { city: string; state: string } {
  const [city = '', ...stateParts] = location.split(',').map((part) => part.trim()).filter(Boolean)
  return { city, state: stateParts.join(', ') }
}

export function createQuickPostingInput(
  quick: QuickPostDraft & { businessInfo?: MerchantBusinessInfo },
  t: RecruitmentTranslate,
  today = new Date(),
): PosJobPostingUpsertInput {
  const base = createDefaultJobDraft(quick.businessInfo, today)
  const location = quick.location.trim()
  const { city, state } = splitQuickLocation(location)
  return {
    ...base,
    title: buildQuickPostTitle(quick.workType, location, t),
    position: JobPosition.NailTechnician,
    headcount: 1,
    workType: quick.workType,
    skills: [],
    payType: JobPayType.Negotiable,
    payAmount: null,
    payUnit: base.payUnit ?? JobPayUnit.Hour,
    payText: quick.payText.trim() || null,
    body: quick.message.trim(),
    businessName: quick.salonName.trim(),
    city,
    state,
    contactName: t('components.dashboard.views.pos.recruitment.preview.managerFallback'),
    visibilityPreset: base.phone.trim() ? JobVisibilityPreset.ShowAll : JobVisibilityPreset.Custom,
    visibility: {
      ...resolveVisibilityPreset(JobVisibilityPreset.ShowAll),
      showPhone: Boolean(base.phone.trim()),
    },
    selectedServices: [],
    isUrgent: quick.isUrgent,
    benefits: [...new Set(quick.benefits)],
  }
}

export function buildQuickSuggestedMessage(
  draft: PosJobPostingUpsertInput,
  t: RecruitmentTranslate,
): string {
  const sections = buildSuggestedDescription(draft, t).split('\n\n').filter(Boolean)
  if (sections.length <= 2) return sections.join('\n\n')

  const required = [sections[0], sections[sections.length - 1]]
  const selected = [required[0]]
  for (const optional of sections.slice(1, -1)) {
    const candidate = [...selected, optional, required[1]].join('\n\n')
    if (candidate.length <= 500) selected.push(optional)
  }
  selected.push(required[1])
  return selected.join('\n\n')
}

export function deriveSkillsFromServices(serviceNames: string[]): RecruitmentSkill[] {
  const result = new Set<RecruitmentSkill>()
  for (const serviceName of serviceNames) {
    for (const entry of SKILL_KEYWORDS) {
      if (entry.patterns.some((pattern) => pattern.test(serviceName))) result.add(entry.skill)
    }
  }
  return Array.from(result)
}

export function postingMatchesSearch(posting: PosJobPosting, query: string): boolean {
  const normalizedQuery = normalizeRecruitmentSearch(query)
  if (!normalizedQuery) return true
  return normalizeRecruitmentSearch(`${posting.title} ${posting.skills.join(' ')}`).includes(normalizedQuery)
}
