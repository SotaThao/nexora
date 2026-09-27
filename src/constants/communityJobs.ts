import { POS_RECRUITMENT_PATHS } from './posRecruitment'

export enum JobPostKind {
  Hiring = 'Hiring',
  Seeking = 'Seeking',
}

export enum SeekingExperience {
  UnderOneYear = 'UnderOneYear',
  OneToThreeYears = 'OneToThreeYears',
  ThreeToFiveYears = 'ThreeToFiveYears',
  FivePlusYears = 'FivePlusYears',
}

export enum JobApplicationStatus {
  Submitted = 'Submitted',
}

export enum StaffCommunityJobsTab {
  Browse = 'browse',
  Mine = 'mine',
  Applied = 'applied',
}

export const COMMUNITY_JOBS_PATHS = {
  postings: POS_RECRUITMENT_PATHS.postings,
  myPostings: POS_RECRUITMENT_PATHS.list,
  applications: (postingId: string) => `${POS_RECRUITMENT_PATHS.postings}/${postingId}/applications`,
  myApplications: '/api/v1/community/job-applications/my-applications',
} as const

export const SEEKING_BODY_MIN = 20
export const SEEKING_BODY_MAX = 2000
export const APPLICATION_NOTE_MAX = 500
