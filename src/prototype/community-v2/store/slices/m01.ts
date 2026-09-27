// M01 slice — the only writer of `groups`, `posts`, `marketItems`, `composerDraft`.
import { getState, storeActions } from "../index";
import { groups as seedGroups, posts as seedPosts } from "../seed/m01";
import type { ComposerDraft, DemoState, Group, GroupIndustry, GroupKind, Post } from "../types";

export const OFFICIAL_AUTHOR_ID = "nexora";
export const FEED_GROUP_ID = "feed";

export const EMPTY_DRAFT: ComposerDraft = {
  type: "showcase",
  body: "",
  category: "Máy móc & thiết bị",
  price: "",
  area: "Houston",
  images: [],
  imageRights: false,
  warnedBody: null,
  step1Passed: false,
  destinations: [],
  destinationsTouched: false,
  plan: "free",
  boostDays: 7,
  payMethod: "wallet",
};

/** Key used for per-viewer state (likes, hidden posts, joins). */
export function viewerKey(state: DemoState = getState()) {
  return state.currentPersonId ?? "guest";
}

function setPosts(mutate: (posts: Post[]) => Post[]) {
  storeActions.update((s) => ({ ...s, posts: mutate(s.posts) }));
}

function setGroups(mutate: (groups: Group[]) => Group[]) {
  storeActions.update((s) => ({ ...s, groups: mutate(s.groups) }));
}

/** Older persisted states (Codex draft shape) lack destinations — reset M01 keys to the seed once. */
export function migrateM01() {
  const state = getState();
  const valid = state.posts.every((post) => Array.isArray(post.destinations) && Array.isArray(post.likedBy));
  const groupsValid = state.groups.every((group) => Array.isArray(group.joinedBy));
  if (valid && groupsValid) return;
  storeActions.update((s) => ({
    ...s,
    posts: JSON.parse(JSON.stringify(seedPosts)) as Post[],
    groups: JSON.parse(JSON.stringify(seedGroups)) as Group[],
    marketItems: [],
    composerDraft: null,
  }));
}

export function toggleLike(postId: string) {
  const key = viewerKey();
  setPosts((posts) => posts.map((post) => {
    if (post.id !== postId) return post;
    const liked = post.likedBy.includes(key);
    return { ...post, likedBy: liked ? post.likedBy.filter((id) => id !== key) : [...post.likedBy, key] };
  }));
}

export function hidePost(postId: string) {
  const key = viewerKey();
  setPosts((posts) => posts.map((post) => (
    post.id === postId && !post.hiddenFor.includes(key) ? { ...post, hiddenFor: [...post.hiddenFor, key] } : post
  )));
}

export function deletePost(postId: string) {
  setPosts((posts) => posts.map((post) => (post.id === postId ? { ...post, deleted: true } : post)));
}

/** Toggles membership for the current viewer; returns true when the viewer is now a member. */
export function toggleJoin(groupId: string): boolean {
  const key = viewerKey();
  const group = getState().groups.find((item) => item.id === groupId);
  const joined = Boolean(group?.joinedBy.includes(key));
  setGroups((groups) => groups.map((item) => {
    if (item.id !== groupId) return item;
    return joined
      ? { ...item, joinedBy: item.joinedBy.filter((id) => id !== key), members: item.members - 1 }
      : { ...item, joinedBy: [...item.joinedBy, key], members: item.members + 1 };
  }));
  return !joined;
}

export type NewGroupInput = {
  name: string; industry: GroupIndustry; kind: Exclude<GroupKind, "feed">; rules: string[];
};

export function createGroup(input: NewGroupInput): string {
  const key = viewerKey();
  const id = `group-${Date.now()}`;
  const group: Group = {
    id,
    name: input.name.trim(),
    kind: input.kind,
    industry: input.industry,
    members: 1,
    rules: input.rules,
    joinedBy: [key],
    createdBy: key,
    description: input.kind === "market" ? "Nhóm Chợ do thành viên tạo." : "Cộng đồng do thành viên tạo.",
  };
  setGroups((groups) => [...groups, group]);
  return id;
}

export function updateDraft(patch: Partial<ComposerDraft>) {
  storeActions.update((s) => ({ ...s, composerDraft: { ...EMPTY_DRAFT, ...(s.composerDraft ?? {}), ...patch } }));
}

export function startDraft(patch: Partial<ComposerDraft> = {}) {
  storeActions.update((s) => ({ ...s, composerDraft: { ...EMPTY_DRAFT, ...patch } }));
}

export function clearDraft() {
  storeActions.update((s) => ({ ...s, composerDraft: null }));
}

/** Publishes the current draft: adds the post on top, auto-joins target groups, clears the draft. */
export function publishDraft(): { postId: string; places: number } | null {
  const state = getState();
  const draft = state.composerDraft;
  if (!draft) return null;
  const key = viewerKey(state);
  const featured = draft.plan === "featured";
  const post: Post = {
    id: `post-${Date.now()}`,
    authorId: state.role === "admin" ? OFFICIAL_AUTHOR_ID : key,
    type: state.role === "admin" ? "official" : draft.type,
    body: draft.body.trim(),
    destinations: draft.destinations,
    createdAt: new Date().toISOString(),
    likes: 0,
    likedBy: [],
    images: draft.images,
    market: draft.type === "market"
      ? { category: draft.category, price: Number(draft.price), area: draft.area }
      : undefined,
    boostDays: featured ? draft.boostDays : undefined,
    boostedUntil: featured ? new Date(Date.now() + draft.boostDays * 86_400_000).toISOString() : null,
    hiddenFor: [],
  };
  storeActions.update((s) => ({
    ...s,
    posts: [post, ...s.posts],
    composerDraft: null,
    groups: s.groups.map((group) => (
      draft.destinations.includes(group.id) && group.kind !== "feed" && !group.joinedBy.includes(key)
        ? { ...group, joinedBy: [...group.joinedBy, key], members: group.members + 1 }
        : group
    )),
  }));
  return { postId: post.id, places: draft.destinations.length };
}
