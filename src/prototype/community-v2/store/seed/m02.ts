import type { Application, InterviewInvite, JobPost, TechProfile } from "../types";

export const jobPosts: JobPost[] = [
  ["Cần thợ Gel-X cuối tuần", "kayla-nails", "Houston", true, false, "hiring", "active"], ["Cần gấp thợ bột", "lotus", "Dallas", true, true, "hiring", "active"], ["Tuyển thợ full-time", "crystal", "Austin", false, false, "hiring", "active"], ["Cần thợ pedicure", "bloom", "Houston", true, false, "hiring", "active"], ["Tuyển thợ có kinh nghiệm", "ivy", "Dallas", false, true, "hiring", "active"], ["Cần thợ cuối tuần", "kayla-nails", "Houston", true, false, "hiring", "active"],
  ["Jessica tìm tiệm ổn định", "", "Houston", false, false, "seeking", "active"], ["Minh tìm ca Dallas", "", "Dallas", false, false, "seeking", "paused"], ["Hân tìm việc nail art", "", "Austin", false, false, "seeking", "expired"], ["Vy đã có việc", "", "Houston", false, false, "seeking", "filled"], ["Thảo tìm tiệm có chỗ ở", "", "Dallas", false, true, "seeking", "active"], ["Quỳnh nhận khách cuối tuần", "", "Houston", false, false, "seeking", "active"],
].map(([title, salonId, city, urgent, housing, kind, status], index) => ({ id: `job-${index + 1}`, title: String(title), salonId: String(salonId) || undefined, city: String(city), urgent: Boolean(urgent), housing: Boolean(housing), kind: kind as JobPost["kind"], status: String(status) }));

export const techProfiles: TechProfile[] = [
  { personId: "jessica", completion: 72, available: true, sharingConsent: true }, { personId: "1048", completion: 88, available: true, sharingConsent: false }, { personId: "2221", completion: 64, available: true, sharingConsent: true }, { personId: "1199", completion: 91, available: false, sharingConsent: false },
];

export const invites: InterviewInvite[] = [
  { id: "invite-1", jobId: "job-1", techId: "jessica", status: "pending" }, { id: "invite-2", jobId: "job-2", techId: "1048", status: "accepted" }, { id: "invite-3", jobId: "job-3", techId: "2221", status: "declined" },
];
export const applications: Application[] = [{ id: "application-1", jobId: "job-1", techId: "jessica", status: "pending" }, { id: "application-2", jobId: "job-4", techId: "3332", status: "reviewed" }];
