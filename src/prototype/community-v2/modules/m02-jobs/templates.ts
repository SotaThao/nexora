import type { JobDay, JobExperience, JobSkill, JobWorkType, PayUnit } from "../../store/types";

export type SeekTemplate = {
  id: string;
  emoji: string;
  name: string;
  role: string;
  skills: JobSkill[];
  workTypes: JobWorkType[];
  hint: string;
};

/** The 8 templates of doc 02 (Cách A). */
export const SEEK_TEMPLATES: SeekTemplate[] = [
  { id: "powder", emoji: "💅", name: "Thợ bột full-time", role: "thợ bột", skills: ["Bột/Acrylic"],
    workTypes: ["Full-time"], hint: "Bột, dip, đắp form" },
  { id: "spa", emoji: "🦶", name: "Thợ tay chân nước", role: "thợ tay chân nước", skills: ["Tay nước", "Chân/Pedicure"],
    workTypes: ["Full-time"], hint: "Mani, pedi, spa chân" },
  { id: "gelx", emoji: "✨", name: "Gel-X / Nail Art", role: "thợ Gel-X / Nail Art", skills: ["Gel-X", "Nail Art"],
    workTypes: ["Full-time"], hint: "Gel-X, vẽ, charm" },
  { id: "weekend", emoji: "📅", name: "Part-time cuối tuần", role: "thợ nail làm part-time", skills: ["Gel Polish"],
    workTypes: ["Part-time", "Cuối tuần"], hint: "Thứ 7 – Chủ nhật" },
  { id: "junior", emoji: "🌱", name: "Mới vào nghề / thợ phụ", role: "thợ phụ mới vào nghề",
    skills: ["Gel Polish", "Tay nước"], workTypes: ["Full-time"], hint: "Muốn học thêm" },
  { id: "temp", emoji: "🔁", name: "Thay ca / làm temp", role: "thợ nhận thay ca", skills: ["Bột/Acrylic"],
    workTypes: ["Thay ca / Temp"], hint: "Ngắn ngày, linh hoạt" },
  { id: "travel", emoji: "🚗", name: "Đi bang khác, cần chỗ ở", role: "thợ sẵn sàng đi bang khác",
    skills: ["Bột/Acrylic"], workTypes: ["Full-time"], hint: "Cần tiệm có chỗ ở" },
  { id: "reception", emoji: "🗣️", name: "Receptionist biết tiếng Anh", role: "receptionist biết tiếng Anh",
    skills: [], workTypes: ["Full-time"], hint: "Lễ tân, đặt lịch" },
];

export const QUICK_PHRASES = [
  "Làm nhanh sạch sẽ",
  "Khách quen đông",
  "Có đồ nghề riêng",
  "Muốn làm lâu dài",
  "Giao tiếp tiếng Anh được",
  "Có xe đi làm đúng giờ",
  "Vui vẻ hoà đồng",
  "Có license TX",
] as const;

export const CLOSING = "Tiệm quan tâm vui lòng gửi lời mời qua NEXORA.";

export type QuickDraft = {
  city: string;
  experience: JobExperience | "";
  days: JobDay[];
  payMode: "negotiable" | "range";
  payFrom: string;
  payTo: string;
  payUnit: PayUnit;
  phrases: string[];
};

export const EMPTY_QUICK: QuickDraft = {
  city: "",
  experience: "",
  days: [],
  payMode: "negotiable",
  payFrom: "",
  payTo: "",
  payUnit: "tuần",
  phrases: [],
};

const money = (value: string) => `$${Number(value.replace(/[^\d]/g, "")).toLocaleString("en-US")}`;

export function payText(mode: QuickDraft["payMode"], from: string, to: string, unit: PayUnit): string {
  if (mode === "negotiable" || (!from && !to)) return "Thoả thuận";
  if (from && to) return `${money(from)}–${money(to).slice(1)}/${unit}`;
  return from ? `Từ ${money(from)}/${unit}` : `Đến ${money(to)}/${unit}`;
}

export function templateTitle(template: SeekTemplate, draft: QuickDraft): string {
  return [template.name, draft.experience, draft.city].filter(Boolean).join(" · ");
}

export function templateBody(template: SeekTemplate, draft: QuickDraft): string {
  const parts = [
    `Mình là ${template.role}${draft.experience ? `, kinh nghiệm ${draft.experience}` : ""}, tìm việc ` +
      `${template.workTypes.join(" / ")}${draft.city ? ` tại ${draft.city}` : ""}.`,
  ];
  if (template.skills.length) parts.push(`Làm được: ${template.skills.join(", ")}.`);
  if (draft.days.length) parts.push(`Có thể làm: ${draft.days.join(", ")}.`);
  parts.push(`Lương mong muốn: ${payText(draft.payMode, draft.payFrom, draft.payTo, draft.payUnit)}.`);
  if (template.id === "travel") parts.push("Cần tiệm có chỗ ở.");
  if (draft.phrases.length) parts.push(`${draft.phrases.join(". ")}.`);
  parts.push(CLOSING);
  return parts.join(" ");
}
