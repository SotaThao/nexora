export enum JobPostingStatus {
  Draft = 'Draft',
  Pending = 'Pending',
  Published = 'Published',
  Closed = 'Closed',
  Filled = 'Filled',
}

export enum JobPosition {
  NailTechnician = 'NailTechnician',
  AcrylicDipTechnician = 'AcrylicDipTechnician',
  ManicurePedicureTechnician = 'ManicurePedicureTechnician',
  Receptionist = 'Receptionist',
  SalonManager = 'SalonManager',
}

export enum JobWorkType {
  FullTime = 'FullTime',
  PartTime = 'PartTime',
  Flexible = 'Flexible',
}

export enum JobPayType {
  Negotiable = 'Negotiable',
  Fixed = 'Fixed',
  Commission = 'Commission',
}

export enum JobPayUnit {
  Hour = 'Hour',
  Day = 'Day',
  Week = 'Week',
  Month = 'Month',
  Year = 'Year',
}

export enum RecruitmentSkill {
  Acrylic = 'Acrylic',
  Dip = 'Dip',
  Gel = 'Gel',
  Manicure = 'Manicure',
  Pedicure = 'Pedicure',
  NailArt = 'NailArt',
  French = 'French',
  GelX = 'GelX',
  BuilderGel = 'BuilderGel',
  ThreeDNailArt = 'ThreeDNailArt',
  HeadSpa = 'HeadSpa',
  Lash = 'Lash',
  Waxing = 'Waxing',
}

export enum RecruitmentBenefit {
  FlexibleSchedule = 'FlexibleSchedule',
  AdditionalTraining = 'AdditionalTraining',
  HousingSupport = 'HousingSupport',
}

export enum JobVisibilityPreset {
  ShowAll = 'ShowAll',
  ChatOnly = 'ChatOnly',
  HideNameAndContact = 'HideNameAndContact',
  Custom = 'Custom',
}

export const JOB_VISIBILITY_PRESET_OPTIONS = [
  JobVisibilityPreset.ShowAll,
  JobVisibilityPreset.ChatOnly,
  JobVisibilityPreset.HideNameAndContact,
] as const

export const ACTIVE_JOB_POSTING_STATUSES = [
  JobPostingStatus.Draft,
  JobPostingStatus.Pending,
  JobPostingStatus.Published,
] as const

export const POS_RECRUITMENT_PATHS = {
  list: '/api/v1/community/job-postings/my-postings',
  postings: '/api/v1/community/job-postings',
} as const

/** Existing POS service contract value used by the recruitment menu picker. */
export const POS_ACTIVE_SERVICE_STATUS = 'Active' as const
