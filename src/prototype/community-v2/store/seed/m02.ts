import { computeCompletion } from "../../modules/m02-jobs/logic";
import type { Application, InterviewInvite, JobPost, JobPrivacy, TechProfile } from "../types";

// All person / salon ids come from store/seed/m00.ts. Money values are sample numbers ("số mẫu").

type HireSeed = Pick<JobPost, "id" | "salonId" | "title" | "body" | "city" | "skills" | "workTypes" | "payText"> &
  Partial<JobPost>;

const hire = (seed: HireSeed): JobPost => ({
  kind: "hiring",
  status: "active",
  views: 0,
  saves: 0,
  daysLeft: 30,
  createdAt: "2026-09-25T09:00:00Z",
  ...seed,
});

const POS_LINE = "Tiệm dùng NEXORA POS — tips minh bạch, trả đúng hạn.";

const hiringPosts: JobPost[] = [
  hire({
    id: "job-h1", salonId: "kayla-nails", city: "Houston", urgent: true,
    title: "[Cần gấp] Thợ Gel-X Full-time tại Houston",
    body: `Kayla Nails & Spa (Houston) cần thợ biết Gel-X, Nail Art, làm Full-time. Khách quen đông. ${POS_LINE}`,
    skills: ["Gel-X", "Nail Art"], workTypes: ["Full-time"], payType: "Ăn chia (commission)",
    payText: "$1,000–1,400/tuần", views: 212, createdAt: "2026-09-26T08:00:00Z",
  }),
  hire({
    id: "job-h2", salonId: "kayla-nails", city: "Houston",
    title: "Thợ Chân/Pedicure Cuối tuần tại Houston",
    body: `Kayla Nails & Spa cần thợ chân nước làm Thứ 7 – Chủ nhật. ${POS_LINE}`,
    skills: ["Chân/Pedicure", "Tay nước"], workTypes: ["Cuối tuần"], payType: "Lương bao",
    payText: "$180/ngày", views: 96, createdAt: "2026-09-24T08:00:00Z",
  }),
  hire({
    id: "job-h3", salonId: "lotus", city: "Dallas", urgent: true, housing: true,
    title: "[Cần gấp] Thợ Bột/Acrylic Full-time tại Dallas",
    body: `Lotus Spa (Dallas) cần gấp 2 thợ bột, có chỗ ở cho thợ từ bang khác. ${POS_LINE}`,
    skills: ["Bột/Acrylic", "Dip"], workTypes: ["Full-time"], payType: "Bao lương + ăn chia",
    payText: "$1,100/tuần", views: 340, createdAt: "2026-09-25T10:00:00Z",
  }),
  hire({
    id: "job-h4", salonId: "crystal", city: "Austin",
    title: "Thợ Nail Art Part-time tại Austin",
    body: `Crystal Nails (Austin) tìm thợ vẽ Nail Art, ưu tiên có portfolio. ${POS_LINE}`,
    skills: ["Nail Art", "Gel Polish"], workTypes: ["Part-time"], payType: "Ăn chia (commission)",
    payText: "Ăn chia 60/40", views: 77, createdAt: "2026-09-23T10:00:00Z",
  }),
  hire({
    id: "job-h5", salonId: "bloom", city: "Houston",
    title: "Thợ Bột/Acrylic Full-time tại Houston",
    body: `Bloom Nail Lounge cần thợ bột lâu dài, tiệm đông khách cuối tuần. ${POS_LINE}`,
    skills: ["Bột/Acrylic"], workTypes: ["Full-time"], payType: "Lương bao",
    payText: "$950/tuần", views: 58, createdAt: "2026-09-22T10:00:00Z",
  }),
  hire({
    id: "job-h6", salonId: "ivy", city: "Dallas", housing: true,
    title: "Thợ Gel Polish Thay ca / Temp tại Dallas",
    body: `Ivy Beauty Bar cần thợ thay ca 2 tuần, có chỗ ở. ${POS_LINE}`,
    skills: ["Gel Polish", "Wax"], workTypes: ["Thay ca / Temp"], payType: "Thoả thuận",
    payText: "Thoả thuận", views: 41, createdAt: "2026-09-21T10:00:00Z",
  }),
];

type SeekSeed = Pick<JobPost, "id" | "seekerId" | "title" | "body" | "city" | "skills" | "workTypes" | "payText"> &
  Partial<JobPost>;

const seek = (seed: SeekSeed): JobPost => ({
  kind: "seeking",
  status: "active",
  views: 0,
  saves: 0,
  daysLeft: 30,
  durationDays: 30,
  method: "template",
  days: ["T2", "T3", "T4", "T5", "T6"],
  createdAt: "2026-09-25T09:00:00Z",
  ...seed,
});

const CLOSE = "Tiệm quan tâm vui lòng gửi lời mời qua NEXORA.";

const seekingPosts: JobPost[] = [
  seek({
    id: "job-s1", seekerId: "jessica", city: "Houston", status: "active", hideFromSalonId: "bloom",
    title: "Thợ bột & Gel-X 5 năm tìm tiệm full-time Houston",
    body: `Mình có 5 năm làm bột và Gel-X, có license TX, làm nhanh sạch sẽ, muốn làm lâu dài. ${CLOSE}`,
    skills: ["Bột/Acrylic", "Gel-X"], workTypes: ["Full-time"], experience: "5–10 năm",
    payType: "Ăn chia (commission)", payText: "$1,000–1,300/tuần", views: 124, saves: 9, daysLeft: 18,
    createdAt: "2026-09-15T09:00:00Z",
  }),
  seek({
    id: "job-s2", seekerId: "jessica", city: "Houston", status: "expired", hideFromSalonId: "bloom",
    title: "Nhận thay ca cuối tuần khu Bellaire",
    body: `Mình nhận thay ca Thứ 7, Chủ nhật khu Bellaire, có đồ nghề riêng. ${CLOSE}`,
    skills: ["Gel-X"], workTypes: ["Thay ca / Temp"], experience: "5–10 năm", days: ["T7", "CN"],
    payText: "Thoả thuận", views: 63, saves: 4, daysLeft: 0, durationDays: 14, createdAt: "2026-08-20T09:00:00Z",
  }),
  seek({
    id: "job-s3", seekerId: "1048", city: "Dallas", status: "paused",
    title: "Thợ bột 7 năm tìm tiệm Dallas",
    body: `Bột, Dip, ombre đều làm được, có xe đi làm đúng giờ. ${CLOSE}`,
    skills: ["Bột/Acrylic", "Dip"], workTypes: ["Full-time"], experience: "5–10 năm",
    payText: "$1,200/tuần", views: 88, saves: 6, daysLeft: 22,
  }),
  seek({
    id: "job-s4", seekerId: "2221", city: "Austin", method: "ai",
    title: "Thợ Nail Art 4 năm tìm part-time Austin",
    body: `Mình vẽ Nail Art và Gel-X, giao tiếp tiếng Anh được. ${CLOSE}`,
    skills: ["Nail Art", "Gel-X"], workTypes: ["Part-time"], experience: "3–5 năm",
    payText: "Ăn chia 60/40", views: 51, saves: 7, daysLeft: 25, createdAt: "2026-09-26T07:00:00Z",
  }),
  seek({
    id: "job-s5", seekerId: "3332", city: "Houston", status: "filled",
    title: "Thợ Gel-X tìm tiệm gần Sugar Land",
    body: `Gel-X, chrome, vui vẻ hoà đồng. ${CLOSE}`,
    skills: ["Gel-X"], workTypes: ["Full-time"], experience: "3–5 năm",
    payText: "Thoả thuận", views: 140, saves: 12, daysLeft: 9,
  }),
  seek({
    id: "job-s6", seekerId: "4450", city: "Dallas", method: "steps",
    title: "Đi bang khác được, cần tiệm có chỗ ở",
    body: `Mình làm tay nước và bột 6 năm, sẵn sàng chuyển tới Dallas nếu tiệm có chỗ ở. ${CLOSE}`,
    skills: ["Tay nước", "Bột/Acrylic"], workTypes: ["Full-time"], experience: "5–10 năm",
    payText: "$1,000/tuần", views: 72, saves: 3, daysLeft: 12,
  }),
  seek({
    id: "job-s7", seekerId: "6683", city: "Houston", hideFromSalonId: "kayla-nails",
    title: "Thợ chân & wax 9 năm tìm chỗ mới",
    body: `Chân/Pedicure, wax, khách quen đông. ${CLOSE}`,
    skills: ["Chân/Pedicure", "Wax"], workTypes: ["Full-time"], experience: "5–10 năm",
    payText: "$1,100/tuần", views: 39, saves: 2, daysLeft: 27,
  }),
  seek({
    id: "job-s8", seekerId: "7701", city: "Dallas",
    title: "Thợ Gel-X nhận full-time hoặc cuối tuần",
    body: `Gel-X, French tip, Gel Polish. Có license TX. ${CLOSE}`,
    skills: ["Gel-X", "Gel Polish"], workTypes: ["Full-time", "Cuối tuần"], experience: "3–5 năm",
    payText: "$900–1,100/tuần", views: 45, saves: 5, daysLeft: 20,
  }),
  seek({
    id: "job-s9", seekerId: "8818", city: "Houston", method: "ai",
    title: "Thợ bột & 3D art tìm tiệm Houston",
    body: `Bột, Nail Art 3D, có đồ nghề riêng. ${CLOSE}`,
    skills: ["Bột/Acrylic", "Nail Art"], workTypes: ["Full-time"], experience: "5–10 năm",
    payText: "$1,000–1,200/tuần", views: 33, saves: 1, daysLeft: 29, createdAt: "2026-09-26T12:00:00Z",
  }),
];

export const jobPosts: JobPost[] = [...hiringPosts, ...seekingPosts];

const DEFAULT_PRIVACY = { seeking: true, hideCurrentSalon: true, hidePhone: true, firstNameOnly: false };

type ProfileSeed = Pick<TechProfile, "personId" | "displayName" | "phone"> &
  Partial<Omit<TechProfile, "privacy">> & { privacy?: Partial<JobPrivacy> };

const profile = (seed: ProfileSeed): TechProfile => {
  const draft: TechProfile = {
    completion: 0,
    available: true,
    languages: ["Tiếng Việt"],
    bio: "",
    skills: [],
    licenseNumber: "",
    portfolio: [],
    workTypes: [],
    payExpected: "",
    ...seed,
    privacy: { ...DEFAULT_PRIVACY, ...seed.privacy },
  };
  return { ...draft, completion: computeCompletion(draft) };
};

const bio = "Làm nhanh, sạch sẽ, khách quen đông.";

export const techProfiles: TechProfile[] = [
  // Jessica ≈ 70%: no bio, 1 photo, no pay type yet.
  profile({
    personId: "jessica", displayName: "Jessica Nguyen", phone: "7135553107", experience: "5–10 năm",
    city: "Houston", languages: ["Tiếng Việt", "English"], skills: ["Bột/Acrylic", "Gel-X"],
    licenseType: "Có license TX", licenseNumber: "TX-0712345", portfolio: [0], workTypes: ["Full-time"],
    payExpected: "$1,000–1,300/tuần", currentSalonId: "bloom", sharingConsent: true,
  }),
  profile({
    personId: "1048", displayName: "Minh Phan", phone: "2145551048", experience: "5–10 năm", city: "Dallas",
    bio, skills: ["Bột/Acrylic", "Dip"], licenseType: "Có license TX", licenseNumber: "TX-0551048",
    portfolio: [1, 2, 3], workTypes: ["Full-time"], payType: "Lương bao", payExpected: "$1,200/tuần",
  }),
  profile({
    personId: "2221", displayName: "Hân Lê", phone: "5125552221", experience: "3–5 năm", city: "Austin",
    bio, languages: ["Tiếng Việt", "English"], skills: ["Nail Art", "Gel-X"], licenseType: "Có license TX",
    licenseNumber: "TX-0552221", portfolio: [4, 5, 6], workTypes: ["Part-time"], payType: "Ăn chia (commission)",
    privacy: { firstNameOnly: true }, currentSalonId: "crystal",
  }),
  profile({
    personId: "1199", displayName: "Tuấn Nguyễn", phone: "7135551199", experience: "5–10 năm", city: "Houston",
    bio, skills: ["Chân/Pedicure", "Bột/Acrylic"], licenseType: "Có license TX", licenseNumber: "TX-0551199",
    portfolio: [2, 3], workTypes: ["Full-time"], payType: "Lương bao", available: false,
    privacy: { seeking: false },
  }),
  profile({
    personId: "3332", displayName: "Vy Hoàng", phone: "2815553332", experience: "3–5 năm", city: "Houston",
    bio, skills: ["Gel-X", "Nail Art"], licenseType: "Có license TX", licenseNumber: "TX-0553332",
    portfolio: [5, 1], workTypes: ["Full-time"], payType: "Thoả thuận", hired: true,
  }),
  profile({
    personId: "4450", displayName: "Thảo Trần", phone: "4695554450", experience: "5–10 năm", city: "Dallas",
    bio, skills: ["Tay nước", "Bột/Acrylic"], licenseType: "License bang khác", licenseNumber: "",
    portfolio: [3], workTypes: ["Full-time"], payType: "Lương bao", travel: "Đi bang khác được",
  }),
  profile({
    personId: "5574", displayName: "Nhi Bùi", phone: "5125555574", experience: "Mới vào nghề", city: "Austin",
    skills: ["Nail Art"], licenseType: "Đang học · chờ thi",
  }),
  profile({
    personId: "6683", displayName: "Quỳnh Đỗ", phone: "8325556683", experience: "5–10 năm", city: "Houston",
    bio, skills: ["Chân/Pedicure", "Wax"], licenseType: "Có license TX", licenseNumber: "TX-0556683",
    portfolio: [0, 4], workTypes: ["Full-time"], payType: "Lương bao", currentSalonId: "kayla-nails",
  }),
  profile({
    personId: "7701", displayName: "Kim Lưu", phone: "9725557701", experience: "3–5 năm", city: "Dallas",
    bio, skills: ["Gel-X", "Gel Polish"], licenseType: "Có license TX", licenseNumber: "TX-0557701",
    portfolio: [6, 2], workTypes: ["Full-time", "Cuối tuần"], payType: "Ăn chia (commission)",
    privacy: { firstNameOnly: true },
  }),
  profile({
    personId: "8818", displayName: "Duy Phạm", phone: "3465558818", experience: "5–10 năm", city: "Houston",
    bio, skills: ["Bột/Acrylic", "Nail Art"], licenseType: "Có license TX", licenseNumber: "TX-0558818",
    portfolio: [1, 5, 6], workTypes: ["Full-time"], payType: "Ăn chia (commission)",
  }),
];

export const invites: InterviewInvite[] = [
  // Jessica's side (S02-08): pending / ok / no from other salons — Kayla can still invite her in K5.
  { id: "invite-1", techId: "jessica", salonId: "lotus", jobId: "job-h3", seekPostId: "job-s1",
    status: "pending", createdAt: "2026-09-26T15:20:00Z" },
  { id: "invite-2", techId: "jessica", salonId: "crystal", jobId: "job-h4", seekPostId: "job-s1",
    status: "accepted", createdAt: "2026-09-24T11:00:00Z" },
  { id: "invite-3", techId: "jessica", salonId: "ivy", jobId: "job-h6", status: "declined",
    createdAt: "2026-09-22T11:00:00Z" },
  // Kayla's side (S02-11): pending / ok / no.
  { id: "invite-4", techId: "1048", salonId: "kayla-nails", jobId: "job-h1", seekPostId: "job-s3",
    status: "pending", createdAt: "2026-09-26T10:00:00Z" },
  { id: "invite-5", techId: "2221", salonId: "kayla-nails", jobId: "job-h1", seekPostId: "job-s4",
    status: "accepted", createdAt: "2026-09-25T10:00:00Z" },
  { id: "invite-6", techId: "4450", salonId: "kayla-nails", jobId: "job-h2", seekPostId: "job-s6",
    status: "declined", createdAt: "2026-09-24T10:00:00Z" },
];

export const applications: Application[] = [
  { id: "application-1", jobId: "job-h1", techId: "7701", status: "sent", createdAt: "2026-09-26T09:30:00Z" },
  { id: "application-2", jobId: "job-h2", techId: "8818", status: "viewed", createdAt: "2026-09-25T16:00:00Z" },
  { id: "application-3", jobId: "job-h3", techId: "jessica", status: "sent", createdAt: "2026-09-25T12:00:00Z" },
];
