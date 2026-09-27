// Fake "AI điền giúp" for Cách B: keyword parsing only (doc 02 Luồng 2 · B).
import type { JobDay, JobExperience, JobPayType, JobSkill, JobWorkType, PayUnit } from "../../store/types";
import { EMPTY_QUICK, type QuickDraft } from "./templates";

export type Parsed = {
  templateId: string;
  skills: JobSkill[];
  workType?: JobWorkType;
  payType?: JobPayType;
  english: boolean;
  travel: boolean;
  draft: QuickDraft;
  recognized: number;
};

const SKILL_WORDS: [RegExp, JobSkill][] = [
  [/bột|acrylic/, "Bột/Acrylic"],
  [/\bdip\b/, "Dip"],
  [/gel[\s-]?x/, "Gel-X"],
  [/gel polish|sơn gel/, "Gel Polish"],
  [/nail art|vẽ/, "Nail Art"],
  [/chân|pedi/, "Chân/Pedicure"],
  [/tay nước/, "Tay nước"],
  [/\bwax/, "Wax"],
  [/\blash|nối mi/, "Lash"],
  [/massage/, "Massage"],
];

const WORK_WORDS: [RegExp, JobWorkType][] = [
  [/full[\s-]?time|toàn thời gian/, "Full-time"],
  [/part[\s-]?time|bán thời gian/, "Part-time"],
  [/cuối tuần|weekend/, "Cuối tuần"],
  [/thay ca|\btemp\b/, "Thay ca / Temp"],
];

const DEFAULT_DAYS: Record<JobWorkType, JobDay[]> = {
  "Full-time": ["T2", "T3", "T4", "T5", "T6", "T7"],
  "Part-time": ["T6", "T7", "CN"],
  "Cuối tuần": ["T7", "CN"],
  "Thay ca / Temp": ["T2", "T3", "T4", "T5", "T6"],
};

export function experienceFromYears(years: number): JobExperience {
  if (years < 1) return "Mới vào nghề";
  if (years < 3) return "1–3 năm";
  if (years < 5) return "3–5 năm";
  if (years < 10) return "5–10 năm";
  return "Trên 10 năm";
}

function nearestTemplate(p: Omit<Parsed, "templateId" | "draft" | "recognized">, text: string): string {
  if (p.travel) return "travel";
  if (/receptionist|lễ tân/.test(text)) return "reception";
  if (/mới vào nghề|thợ phụ|mới học/.test(text)) return "junior";
  if (p.workType === "Thay ca / Temp") return "temp";
  if (p.workType === "Cuối tuần" || p.workType === "Part-time") return "weekend";
  if (p.skills.some((skill) => skill === "Gel-X" || skill === "Nail Art")) return "gelx";
  if (p.skills.some((skill) => skill === "Chân/Pedicure" || skill === "Tay nước")) return "spa";
  return "powder";
}

export function parseSentence(input: string): Parsed {
  const text = input.toLowerCase();
  const skills = SKILL_WORDS.filter(([word]) => word.test(text)).map(([, skill]) => skill);
  const workType = WORK_WORDS.find(([word]) => word.test(text))?.[1];
  const cityMatch = text.match(/houston|dallas|austin|san antonio/);
  const city = cityMatch ? cityMatch[0].replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
  const yearMatch = text.match(/(\d+)\s*(năm|years?|yrs?)/);
  const experience: JobExperience | "" = /mới vào nghề|thợ phụ/.test(text)
    ? "Mới vào nghề"
    : yearMatch
      ? experienceFromYears(Number(yearMatch[1]))
      : "";
  const payMatch = text.match(/\$?\s?(\d[\d,.]{2,})\s*(k)?\s*(?:\/|một|mỗi)?\s*(tuần|ngày|tháng|week|day|month)?/);
  const unitWord = payMatch?.[3] ?? "";
  const payUnit: PayUnit = /ngày|day/.test(unitWord) ? "ngày" : /tháng|month/.test(unitWord) ? "tháng" : "tuần";
  const payFrom = payMatch ? String(Math.round(Number(payMatch[1].replace(/[,.]/g, ""))
    * (payMatch[2] ? 1000 : 1))) : "";
  const payType: JobPayType | undefined = /ăn chia|commission/.test(text)
    ? "Ăn chia (commission)"
    : /lương bao|bao lương/.test(text)
      ? "Lương bao"
      : undefined;
  const english = /tiếng anh|english/.test(text);
  const travel = /bang khác|đi xa|chỗ ở/.test(text);
  const base = { skills, workType, payType, english, travel };
  const recognized = [skills.length > 0, workType, city, experience, payFrom, payType, english, travel].filter(Boolean)
    .length;
  const draft: QuickDraft = {
    ...EMPTY_QUICK,
    city,
    experience,
    days: workType ? DEFAULT_DAYS[workType] : [],
    payMode: payFrom ? "range" : "negotiable",
    payFrom,
    payUnit,
    phrases: english ? ["Giao tiếp tiếng Anh được"] : [],
  };
  return { ...base, templateId: nearestTemplate(base, text), draft, recognized };
}
