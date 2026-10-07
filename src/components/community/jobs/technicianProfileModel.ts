import { SeekingExperience } from '../../../constants/communityJobs'
import { JobPayType, JobWorkType, RecruitmentSkill } from '../../../constants/posRecruitment'
import type { SeekingPostUpsertInput } from '../../../types/communityJobs'
import type { StaffJobsTranslate } from '../../staff-dashboard/community/jobs/staffJobsModel'

export const PROFILE_EXPERIENCES = [SeekingExperience.UnderOneYear, SeekingExperience.OneToThreeYears, SeekingExperience.ThreeToFiveYears, 'FiveToTenYears', 'OverTenYears'] as const
export const PROFILE_LANGUAGES = ['vi', 'en', 'es'] as const
export const PROFILE_LICENSES = ['TX', 'OtherState', 'Studying'] as const
export const PROFILE_WORK_TYPES = [JobWorkType.FullTime, JobWorkType.PartTime, 'Weekend', 'Substitute'] as const
export const PROFILE_PAY_PREFERENCES = ['Guaranteed', 'Commission', 'ChairRental', 'Negotiated'] as const
export const PROFILE_CITIES = ['Houston', 'Dallas', 'Austin'] as const
export const PROFILE_SKILLS = [RecruitmentSkill.Acrylic, RecruitmentSkill.Dip, RecruitmentSkill.GelX, RecruitmentSkill.Gel, RecruitmentSkill.NailArt, RecruitmentSkill.Pedicure, RecruitmentSkill.Manicure, RecruitmentSkill.Waxing, RecruitmentSkill.Lash] as const
export const PROFILE_PORTFOLIO = ['sample-1', 'sample-2', 'sample-3', 'sample-4', 'sample-5', 'sample-6', 'sample-7', 'sample-8', 'sample-9'] as const

export interface TechnicianProfile {
  displayName: string
  experience: typeof PROFILE_EXPERIENCES[number] | ''
  city: typeof PROFILE_CITIES[number] | ''
  languages: Array<typeof PROFILE_LANGUAGES[number]>
  bio: string
  skills: RecruitmentSkill[]
  licenseType: typeof PROFILE_LICENSES[number] | ''
  licenseNumber: string
  portfolio: string[]
  workTypes: Array<typeof PROFILE_WORK_TYPES[number]>
  payPreferences: Array<typeof PROFILE_PAY_PREFERENCES[number]>
  desiredAmount: string
  lookingForWork: boolean
  hideFromCurrentSalon: boolean
  hidePhone: boolean
}

export type PublicTechnicianProfile = Omit<TechnicianProfile, 'licenseNumber'>

export function createTechnicianProfile(name: string): TechnicianProfile {
  return { displayName: name, experience: '', city: '', languages: ['vi'], bio: '', skills: [], licenseType: '', licenseNumber: '', portfolio: [], workTypes: [], payPreferences: [], desiredAmount: '', lookingForWork: true, hideFromCurrentSalon: true, hidePhone: true }
}

export function publicTechnicianProfile({ licenseNumber: _privateLicense, ...profile }: TechnicianProfile): PublicTechnicianProfile {
  return profile
}

export function technicianProfileCompletion(profile: PublicTechnicianProfile): number {
  return (profile.displayName.trim() ? 10 : 0) + (profile.experience ? 10 : 0) + (profile.city ? 10 : 0)
    + (profile.bio.trim() ? 10 : 0) + (profile.skills.length ? 15 : 0) + (profile.licenseType ? 10 : 0)
    + Math.min(profile.portfolio.length, 3) * 5 + (profile.workTypes.length ? 10 : 0) + (profile.payPreferences.length ? 10 : 0)
}

export function technicianProfileDraft(profile: PublicTechnicianProfile, t: StaffJobsTranslate): SeekingPostUpsertInput {
  const key = 'community_jobs_browser.technicianProfile'
  const experience = profile.experience === 'FiveToTenYears' || profile.experience === 'OverTenYears'
    ? SeekingExperience.FivePlusYears : profile.experience || SeekingExperience.UnderOneYear
  const workTypes = Array.from(new Set(profile.workTypes.map((value) => value === 'Weekend' || value === 'Substitute' ? JobWorkType.Flexible : value)))
  const skills = profile.skills.map((value) => t(`components.dashboard.views.pos.recruitment.enums.skill.${value}`)).join(', ')
  const preferences = profile.payPreferences.map((value) => t(`${key}.payPreferences.${value}`)).join(', ')
  const payText = [preferences, profile.desiredAmount.trim()].filter(Boolean).join(' · ') || null
  const title = t(`${key}.draftTitle`, { name: profile.displayName.trim(), city: profile.city || t(`${key}.noLocation`) }).slice(0, 120)
  const body = [profile.bio.trim(), t(`${key}.draftSkills`, { skills }), profile.experience ? t(`${key}.draftExperience`, { experience: t(`${key}.experience.${profile.experience}`) }) : '', t(`${key}.draftWorkTypes`, { types: profile.workTypes.map((value) => t(`${key}.workTypes.${value}`)).join(', ') }), payText ? t(`${key}.draftPay`, { pay: payText }) : ''].filter(Boolean).join('\n\n')
  return {
    title, body, skills: [...profile.skills], experience, workTypes, city: profile.city, state: profile.city ? 'TX' : '',
    payType: profile.payPreferences.length === 1 && profile.payPreferences[0] === 'Commission' ? JobPayType.Commission : JobPayType.Negotiable,
    payAmount: null, payUnit: null, payText: payText?.slice(0, 60) ?? null, availableFrom: null, displayName: profile.displayName.trim(), phone: '',
    visibility: { showFullName: true, showPhone: !profile.hidePhone },
  }
}
