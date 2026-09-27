// M02 · Việc làm — one unified enum set shared by profile, seek posts, hiring posts and AI
// suggestions (doc 02 open question #1). Tech-side values were chosen; see docs/community-v2/L3a-NOTES.md.

export const JOB_SKILLS = [
  "Bột/Acrylic",
  "Dip",
  "Gel-X",
  "Gel Polish",
  "Nail Art",
  "Chân/Pedicure",
  "Tay nước",
  "Wax",
  "Lash",
  "Massage",
] as const;
export const JOB_EXPERIENCE = ["Mới vào nghề", "1–3 năm", "3–5 năm", "5–10 năm", "Trên 10 năm"] as const;
export const JOB_WORK_TYPES = ["Full-time", "Part-time", "Cuối tuần", "Thay ca / Temp"] as const;
export const JOB_PAY_TYPES = [
  "Lương bao",
  "Ăn chia (commission)",
  "Bao lương + ăn chia",
  "Thuê ghế",
  "Thoả thuận",
] as const;
export const JOB_CITIES = ["Houston", "Dallas", "Austin", "San Antonio"] as const;
export const JOB_LICENSES = ["Có license TX", "License bang khác", "Đang học · chờ thi"] as const;
export const JOB_LANGUAGES = ["Tiếng Việt", "English", "Español"] as const;
export const JOB_DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export type JobSkill = (typeof JOB_SKILLS)[number];
export type JobExperience = (typeof JOB_EXPERIENCE)[number];
export type JobWorkType = (typeof JOB_WORK_TYPES)[number];
export type JobPayType = (typeof JOB_PAY_TYPES)[number];
export type JobCity = (typeof JOB_CITIES)[number];
export type JobLicense = (typeof JOB_LICENSES)[number];
export type JobLanguage = (typeof JOB_LANGUAGES)[number];
export type JobDay = (typeof JOB_DAYS)[number];

export type JobKind = "hiring" | "seeking";
/** active = Đang hiển thị · paused = Tạm ẩn · expired = Hết hạn · filled = Đã có việc */
export type JobStatus = "active" | "paused" | "expired" | "filled";
export type PayUnit = "tuần" | "ngày" | "tháng";

export interface JobPost {
  id: string;
  kind: JobKind;
  title: string;
  body: string;
  city: string;
  status: JobStatus;
  /** hiring posts */
  salonId?: string;
  urgent?: boolean;
  housing?: boolean;
  /** seeking posts */
  seekerId?: string;
  experience?: JobExperience;
  days?: JobDay[];
  hideFromSalonId?: string;
  durationDays?: number;
  method?: "template" | "ai" | "steps";
  english?: string;
  edited?: boolean;
  skills: JobSkill[];
  workTypes: JobWorkType[];
  payType?: JobPayType;
  payText: string;
  views: number;
  saves: number;
  daysLeft: number;
  createdAt: string;
}

export interface JobPrivacy {
  seeking: boolean;
  hideCurrentSalon: boolean;
  hidePhone: boolean;
  firstNameOnly: boolean;
}

export interface TechProfile {
  personId: string;
  /** Derived with the doc 02 formula on every write (kept for other modules that read it). */
  completion: number;
  available: boolean;
  sharingConsent?: boolean;
  displayName: string;
  experience?: JobExperience;
  city?: string;
  languages: JobLanguage[];
  bio: string;
  skills: JobSkill[];
  licenseType?: JobLicense;
  licenseNumber: string;
  /** Portfolio placeholders (gradient index per photo), max 9, first = cover. */
  portfolio: number[];
  workTypes: JobWorkType[];
  payType?: JobPayType;
  payExpected: string;
  travel?: string;
  shift?: string;
  start?: string;
  privacy: JobPrivacy;
  currentSalonId?: string;
  phone: string;
  hired?: boolean;
}

export interface InterviewInvite {
  id: string;
  techId: string;
  salonId: string;
  /** hiring post of the salon the invite is for */
  jobId?: string;
  /** seeking post of the tech the invite was sent from (deleted together with it) */
  seekPostId?: string;
  status: "pending" | "accepted" | "declined";
  techHired?: boolean;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  techId: string;
  status: "sent" | "viewed";
  createdAt: string;
}

export interface M02State {
  jobPosts: JobPost[];
  techProfiles: TechProfile[];
  invites: InterviewInvite[];
  applications: Application[];
}
