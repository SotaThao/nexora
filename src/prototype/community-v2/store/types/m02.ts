export type JobPost = { id: string; title: string; salonId?: string; city: string; urgent?: boolean; housing?: boolean; kind?: "hiring" | "seeking"; status?: string };
export type TechProfile = { personId: string; completion: number; available: boolean; sharingConsent?: boolean };
export type InterviewInvite = { id: string; jobId: string; techId: string; status: "pending" | "accepted" | "declined" };
export type Application = { id: string; jobId: string; techId: string; status: string };
export type M02State = { jobPosts: JobPost[]; techProfiles: TechProfile[]; invites: InterviewInvite[]; applications: Application[] };
