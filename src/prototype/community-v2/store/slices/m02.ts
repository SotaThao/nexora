// M02 slice — the only place that writes M02 keys (jobPosts, techProfiles, invites, applications).
import { computeCompletion } from "../../modules/m02-jobs/logic";
import { getState, storeActions } from "../index";
import type { DemoState, InterviewInvite, JobPost, JobPrivacy, TechProfile } from "../types";

const DEFAULT_PRIVACY: JobPrivacy = { seeking: true, hideCurrentSalon: true, hidePhone: true, firstNameOnly: false };

const stamp = () => new Date().toISOString();
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** Normalised read so stale persisted shapes never crash a screen. */
export function selectProfile(
  state: Pick<DemoState, "techProfiles" | "people">,
  personId: string | null | undefined,
): TechProfile | undefined {
  const found = (state.techProfiles ?? []).find((item) => item.personId === personId);
  if (!found) return undefined;
  const person = state.people.find((item) => item.id === personId);
  return {
    ...found,
    displayName: found.displayName ?? person?.name ?? "",
    languages: found.languages ?? [],
    bio: found.bio ?? "",
    skills: found.skills ?? [],
    licenseNumber: found.licenseNumber ?? "",
    portfolio: found.portfolio ?? [],
    workTypes: found.workTypes ?? [],
    payExpected: found.payExpected ?? "",
    phone: found.phone ?? person?.phone ?? "",
    privacy: { ...DEFAULT_PRIVACY, ...found.privacy },
  };
}

function patchProfiles(state: DemoState, personId: string, patch: (profile: TechProfile) => TechProfile) {
  return state.techProfiles.map((item) => {
    if (item.personId !== personId) return item;
    const next = patch(selectProfile(state, personId) ?? item);
    return { ...next, completion: computeCompletion(next) };
  });
}

export function updateProfile(personId: string, patch: Partial<TechProfile>) {
  storeActions.update((s) => ({ ...s, techProfiles: patchProfiles(s, personId, (p) => ({ ...p, ...patch })) }));
}

export function updatePrivacy(personId: string, patch: Partial<JobPrivacy>) {
  storeActions.update((s) => ({
    ...s,
    techProfiles: patchProfiles(s, personId, (p) => ({ ...p, privacy: { ...p.privacy, ...patch } })),
  }));
}

export type SeekDraft = Omit<JobPost, "id" | "kind" | "status" | "views" | "saves" | "daysLeft" | "createdAt">;

/** Publishes a new seeking post on top of the board, or saves an edit (same id, "vừa sửa"). */
export function saveSeekPost(draft: SeekDraft, editId?: string): string {
  const existing = editId ? getState().jobPosts.find((post) => post.id === editId) : undefined;
  if (existing) {
    storeActions.update((s) => ({
      ...s,
      jobPosts: s.jobPosts.map((post) => (post.id === editId ? { ...post, ...draft, edited: true } : post)),
    }));
    return existing.id;
  }
  const id = newId("job-s");
  const post: JobPost = {
    ...draft,
    id,
    kind: "seeking",
    status: "active",
    views: 0,
    saves: 0,
    daysLeft: draft.durationDays ?? 30,
    createdAt: stamp(),
  };
  storeActions.update((s) => ({ ...s, jobPosts: [post, ...s.jobPosts] }));
  return id;
}

export function setSeekStatus(id: string, status: "active" | "paused") {
  storeActions.update((s) => ({
    ...s,
    jobPosts: s.jobPosts.map((post) => (post.id === id && post.status !== "filled" ? { ...post, status } : post)),
  }));
}

export function renewSeekPost(id: string) {
  storeActions.update((s) => ({
    ...s,
    jobPosts: s.jobPosts.map((post) =>
      post.id === id ? { ...post, status: "active", daysLeft: post.daysLeft + 30 } : post,
    ),
  }));
}

/** "Đã có việc": post leaves the board for good, pending invites are told the tech is hired. */
export function markHired(id: string) {
  const post = getState().jobPosts.find((item) => item.id === id);
  if (!post?.seekerId) return;
  const techId = post.seekerId;
  storeActions.update((s) => ({
    ...s,
    jobPosts: s.jobPosts.map((item) => (item.id === id ? { ...item, status: "filled" } : item)),
    techProfiles: patchProfiles(s, techId, (p) => ({ ...p, hired: true })),
    invites: s.invites.map((invite) =>
      invite.techId === techId && invite.status === "pending" ? { ...invite, techHired: true } : invite,
    ),
  }));
}

/** "Xoá": removes the post and the invites that were sent from it. */
export function deleteSeekPost(id: string) {
  storeActions.update((s) => ({
    ...s,
    jobPosts: s.jobPosts.filter((post) => post.id !== id),
    invites: s.invites.filter((invite) => invite.seekPostId !== id),
  }));
}

export function respondInvite(id: string, accept: boolean) {
  storeActions.update((s) => ({
    ...s,
    invites: s.invites.map((invite) =>
      invite.id === id && invite.status === "pending"
        ? { ...invite, status: accept ? "accepted" : "declined" }
        : invite,
    ),
  }));
}

export type InviteResult = { ok: boolean; reason?: "duplicate" | "hired" };

/** One invite per tech per salon; techs marked "Đã có việc" cannot be invited. */
export function sendInvite(input: Pick<InterviewInvite, "salonId" | "techId" | "jobId">): InviteResult {
  const state = getState();
  if (state.invites.some((invite) => invite.salonId === input.salonId && invite.techId === input.techId)) {
    return { ok: false, reason: "duplicate" };
  }
  if (selectProfile(state, input.techId)?.hired) return { ok: false, reason: "hired" };
  const seekPost = state.jobPosts.find(
    (post) => post.kind === "seeking" && post.seekerId === input.techId && post.status === "active",
  );
  const invite: InterviewInvite = {
    ...input,
    id: newId("invite"),
    seekPostId: seekPost?.id,
    status: "pending",
    createdAt: stamp(),
  };
  storeActions.update((s) => ({ ...s, invites: [invite, ...s.invites] }));
  return { ok: true };
}

/** "Ứng tuyển bằng hồ sơ" — creates an application record; the phone number stays hidden. */
export function applyToJob(jobId: string, techId: string): boolean {
  const state = getState();
  if (state.applications.some((item) => item.jobId === jobId && item.techId === techId)) return false;
  storeActions.update((s) => ({
    ...s,
    applications: [{ id: newId("application"), jobId, techId, status: "sent", createdAt: stamp() }, ...s.applications],
  }));
  return true;
}

export type HiringDraft = Pick<
  JobPost,
  "salonId" | "title" | "body" | "city" | "skills" | "workTypes" | "payType" | "payText" | "urgent" | "housing"
>;

export function createHiringPost(draft: HiringDraft): string {
  const id = newId("job-h");
  const post: JobPost = {
    ...draft,
    id,
    kind: "hiring",
    status: "active",
    views: 0,
    saves: 0,
    daysLeft: 30,
    createdAt: stamp(),
  };
  storeActions.update((s) => ({ ...s, jobPosts: [post, ...s.jobPosts] }));
  return id;
}
