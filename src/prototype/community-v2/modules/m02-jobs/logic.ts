// Pure M02 business rules (no store / React imports) — shared by the seed, the slice and the UI.
import type { JobPost, JobSkill, TechProfile } from "../../store/types/m02";

export const AI_THRESHOLD = 60;

export type CompletionItem = { label: string; points: number; max: number };

/**
 * Doc 02 formula: +10 each for name / experience / city / bio / license; +15 skills;
 * +5 per photo (max 15); +10 work type; +10 pay type; capped at 100.
 */
export function completionBreakdown(profile: TechProfile): CompletionItem[] {
  const has = (value: unknown) => (Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim()));
  return [
    { label: "Tên hiển thị", points: has(profile.displayName) ? 10 : 0, max: 10 },
    { label: "Kinh nghiệm", points: has(profile.experience) ? 10 : 0, max: 10 },
    { label: "Thành phố", points: has(profile.city) ? 10 : 0, max: 10 },
    { label: "Giới thiệu ngắn", points: has(profile.bio) ? 10 : 0, max: 10 },
    { label: "License", points: has(profile.licenseType) ? 10 : 0, max: 10 },
    { label: "Kỹ năng", points: has(profile.skills) ? 15 : 0, max: 15 },
    { label: "Ảnh mẫu tay (+5/ảnh)", points: Math.min(15, (profile.portfolio?.length ?? 0) * 5), max: 15 },
    { label: "Loại việc", points: has(profile.workTypes) ? 10 : 0, max: 10 },
    { label: "Hình thức lương", points: has(profile.payType) ? 10 : 0, max: 10 },
  ];
}

export function computeCompletion(profile: TechProfile): number {
  return Math.min(100, completionBreakdown(profile).reduce((sum, item) => sum + item.points, 0));
}

/** "✓ LICENSE XÁC MINH" only when both license type and license number are present. */
export function licenseVerified(profile?: TechProfile): boolean {
  return Boolean(profile?.licenseType && profile.licenseNumber?.trim());
}

export type MatchScore = { total: number; skill: number; city: number; workType: number; matched: JobSkill[] };

/** `60 × matched skills / required skills` + 25 same city + 15 work type match, capped at 100. */
export function matchScore(job: JobPost, profile: TechProfile): MatchScore {
  const required = job.skills ?? [];
  const matched = required.filter((skill) => (profile.skills ?? []).includes(skill));
  const skill = required.length ? Math.round((60 * matched.length) / required.length) : 0;
  const city = profile.city && profile.city === job.city ? 25 : 0;
  const workType = (job.workTypes ?? []).some((type) => (profile.workTypes ?? []).includes(type)) ? 15 : 0;
  return { total: Math.min(100, skill + city + workType), skill, city, workType, matched };
}

/** Name shown to others: full name, or only the first name when "Ẩn họ, chỉ hiện tên" is on. */
export function publicName(profile: TechProfile | undefined, fallback: string): string {
  const name = profile?.displayName?.trim() || fallback;
  return profile?.privacy?.firstNameOnly ? name.split(" ")[0] : name;
}

const US_PHONE = /(\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;

export function hasPhone(text: string): boolean {
  return new RegExp(US_PHONE.source).test(text);
}

export function stripPhones(text: string): string {
  return text.replace(new RegExp(US_PHONE.source, "g"), "[liên hệ qua NEXORA]");
}

export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return raw;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
