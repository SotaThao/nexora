import type {
  JobDay,
  JobExperience,
  JobLanguage,
  JobLicense,
  JobPayType,
  JobPost,
  JobSkill,
  JobWorkType,
  PayUnit,
  TechProfile,
} from "../../store/types";
import { CLOSING, payText } from "./templates";

export const POSITIONS = ["Thợ chính", "Thợ phụ", "Receptionist", "Quản lý tiệm"] as const;
export const TRAVEL = ["Chỉ trong thành phố", "Trong 25 mi", "Đi bang khác được"] as const;
export const SHIFTS = ["Ca sáng", "Ca chiều", "Cả ngày"] as const;
export const STARTS = ["Ngay", "Trong 2 tuần", "Trong 1 tháng"] as const;
export const DURATIONS = [14, 30, 60] as const;
export const STEP_TITLES = ["Việc muốn tìm", "Lương & lịch", "Về bạn", "Nội dung & đăng"] as const;

export const STEP_ERRORS = [
  "Vui lòng chọn vị trí, ít nhất 1 dịch vụ, loại việc và khu vực.",
  "Vui lòng chọn hình thức lương và ngày có thể làm. Mức “Từ” phải nhỏ hơn “Đến”.",
  "Vui lòng chọn kinh nghiệm.",
  "Tiêu đề cần ít nhất 10 ký tự và phần giới thiệu ít nhất 30 ký tự.",
];

export type StepsDraft = {
  position: string;
  skills: JobSkill[];
  workTypes: JobWorkType[];
  city: string;
  travel: string;
  payType: JobPayType | "";
  payFrom: string;
  payTo: string;
  payUnit: PayUnit;
  days: JobDay[];
  shift: string;
  start: string;
  experience: JobExperience | "";
  licenseType: JobLicense | "";
  languages: JobLanguage[];
  photos: number[];
  title: string;
  body: string;
  english: string;
  hideCurrentSalon: boolean;
  duration: 14 | 30 | 60;
};

export const EMPTY_STEPS: StepsDraft = {
  position: "",
  skills: [],
  workTypes: [],
  city: "",
  travel: "",
  payType: "",
  payFrom: "",
  payTo: "",
  payUnit: "tuần",
  days: [],
  shift: "",
  start: "",
  experience: "",
  licenseType: "",
  languages: [],
  photos: [],
  title: "",
  body: "",
  english: "",
  hideCurrentSalon: true,
  duration: 30,
};

export function validateStep(step: number, d: StepsDraft): boolean {
  if (step === 0) return Boolean(d.position && d.skills.length && d.workTypes.length && d.city);
  if (step === 1) {
    const rangeOk = !(d.payFrom && d.payTo && Number(d.payFrom) >= Number(d.payTo));
    return Boolean(d.payType && d.days.length && rangeOk);
  }
  if (step === 2) return Boolean(d.experience);
  return d.title.trim().length >= 10 && d.body.trim().length >= 30;
}

/** "Điền nhanh" — copies what the NEXORA tech profile already knows. */
export function fillFromProfile(d: StepsDraft, p: TechProfile): StepsDraft {
  return {
    ...d,
    position: d.position || "Thợ chính",
    skills: p.skills.length ? p.skills : d.skills,
    workTypes: p.workTypes.length ? p.workTypes : d.workTypes,
    city: p.city ?? d.city,
    travel: p.travel ?? d.travel,
    payType: p.payType ?? d.payType,
    shift: p.shift ?? d.shift,
    start: p.start ?? d.start,
    experience: p.experience ?? d.experience,
    licenseType: p.licenseType ?? d.licenseType,
    languages: p.languages.length ? p.languages : d.languages,
    photos: p.portfolio.slice(0, 6),
    hideCurrentSalon: p.privacy.hideCurrentSalon,
  };
}

export function fromPost(post: JobPost, profile?: TechProfile): StepsDraft {
  const amounts = post.payText.match(/\d[\d,]*/g)?.map((value) => value.replace(/,/g, "")) ?? [];
  const unit = post.payText.includes("/ngày") ? "ngày" : post.payText.includes("/tháng") ? "tháng" : "tuần";
  return {
    ...EMPTY_STEPS,
    ...(profile ? fillFromProfile(EMPTY_STEPS, profile) : {}),
    skills: post.skills,
    workTypes: post.workTypes,
    city: post.city,
    payType: post.payType ?? profile?.payType ?? "Thoả thuận",
    payFrom: amounts[0] ?? "",
    payTo: amounts[1] ?? "",
    payUnit: unit,
    days: post.days ?? [],
    experience: post.experience ?? profile?.experience ?? "",
    title: post.title,
    body: post.body,
    english: post.english ?? "",
    hideCurrentSalon: Boolean(post.hideFromSalonId),
    duration: (DURATIONS as readonly number[]).includes(post.durationDays ?? 30)
      ? (post.durationDays as 14 | 30 | 60)
      : 30,
  };
}

export const draftPay = (d: StepsDraft) =>
  d.payFrom || d.payTo ? payText("range", d.payFrom, d.payTo, d.payUnit) : "Thoả thuận";

/** "✦ AI viết giúp" — only assembles what the tech selected, never invents facts. */
export function aiWrite(d: StepsDraft): Pick<StepsDraft, "title" | "body"> {
  const skills = d.skills.slice(0, 2).join(" & ") || "Thợ nail";
  const title = [skills, d.experience, "tìm", d.workTypes[0], d.city].filter(Boolean).join(" ");
  const parts = [
    `Mình là ${(d.position || "thợ").toLowerCase()}${d.experience ? `, kinh nghiệm ${d.experience}` : ""}` +
      `${d.skills.length ? `, làm ${d.skills.join(", ")}` : ""}.`,
    `Tìm việc ${d.workTypes.join(" / ") || "phù hợp"}${d.city ? ` tại ${d.city}` : ""}` +
      `${d.travel ? ` (${d.travel.toLowerCase()})` : ""}.`,
    `Lương mong muốn: ${[d.payType, draftPay(d)].filter(Boolean).join(" · ")}.`,
  ];
  if (d.days.length) parts.push(`Có thể làm: ${d.days.join(", ")}${d.shift ? ` · ${d.shift}` : ""}.`);
  if (d.start) parts.push(`Bắt đầu: ${d.start.toLowerCase()}.`);
  if (d.licenseType) parts.push(`${d.licenseType}.`);
  if (d.languages.length) parts.push(`Ngôn ngữ: ${d.languages.join(", ")}.`);
  parts.push(CLOSING);
  return { title, body: parts.join(" ") };
}

const EN_WORK: Record<string, string> = {
  "Full-time": "full-time",
  "Part-time": "part-time",
  "Cuối tuần": "weekend",
  "Thay ca / Temp": "temp / cover shifts",
};

export function englishVersion(d: StepsDraft): string {
  const years = !d.experience
    ? ""
    : d.experience === "Mới vào nghề"
      ? " (entry level)"
      : ` with ${d.experience.replace("Trên", "over").replace("năm", "years")} of experience`;
  const work = d.workTypes.map((type) => EN_WORK[type] ?? type).join(" / ") || "nail";
  return [
    `🌐 English: Nail technician${years}${d.skills.length ? ` in ${d.skills.join(", ")}` : ""}.`,
    `Looking for ${work} work${d.city ? ` in ${d.city}` : ""}. Expected pay: ${draftPay(d)}.`,
    "Interested salons, please send an invite via NEXORA.",
  ].join(" ");
}

/** "✂️ Viết ngắn lại" — keep the first two sentences plus the closing line. */
export function shorten(body: string): string {
  const sentences = body.replace(CLOSING, "").split(/(?<=\.)\s+/).filter((item) => item.trim());
  return [...sentences.slice(0, 2), CLOSING].join(" ");
}
