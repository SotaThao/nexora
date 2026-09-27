import { useStore } from "../../store";
import { EMPTY_DRAFT, FEED_GROUP_ID, OFFICIAL_AUTHOR_ID } from "../../store/slices/m01";
import type { DemoState, Group, Person, Post } from "../../store/types";

const FRESH_MS = 10 * 60_000;

export function useViewer() {
  const role = useStore((s) => s.role);
  const personId = useStore((s) => s.currentPersonId);
  const person = useStore((s) => s.people.find((item) => item.id === s.currentPersonId));
  const key = personId ?? "guest";
  const firstName = person?.name.split(" ")[0] ?? (role === "admin" ? "Admin" : "Bạn");
  return { role, key, person, firstName, isGuest: role === "guest", isBusiness: role === "owner" };
}

export function useDraft() {
  return useStore((s) => s.composerDraft ?? EMPTY_DRAFT);
}

export type AuthorView = { name: string; subtitle: string; verified: boolean; official: boolean };

export function authorOf(state: Pick<DemoState, "people">, authorId: string): AuthorView {
  if (authorId === OFFICIAL_AUTHOR_ID) {
    return { name: "NEXORA Community", subtitle: "Tài khoản chính thức", verified: true, official: true };
  }
  const person: Person | undefined = state.people.find((item) => item.id === authorId);
  if (!person) return { name: "Thành viên NEXORA", subtitle: "", verified: false, official: false };
  const role = person.role === "owner" ? "Chủ tiệm" : person.role === "tech" ? "Thợ" : "Thành viên";
  const subtitle = `${role} · ${person.city}`;
  return { name: person.name, subtitle, verified: Boolean(person.verified), official: false };
}

export function useAuthor(authorId: string) {
  const people = useStore((s) => s.people);
  return authorOf({ people }, authorId);
}

export const isBoosted = (post: Post, now = Date.now()) =>
  Boolean(post.boostedUntil && new Date(post.boostedUntil).getTime() > now);

export const isFresh = (post: Post, now = Date.now()) => now - new Date(post.createdAt).getTime() < FRESH_MS;

export const likeCount = (post: Post) => post.likes + post.likedBy.length;

/** Own just-published posts first (doc 01 · 3.2 "bài lên đầu"), then active Nổi bật, then newest. */
export function sortFeed(posts: Post[], viewer: string) {
  const now = Date.now();
  const rank = (post: Post) => (post.authorId === viewer && isFresh(post, now) ? 0 : isBoosted(post, now) ? 1 : 2);
  return [...posts].sort((a, b) => rank(a) - rank(b) || b.createdAt.localeCompare(a.createdAt));
}

export function useVisiblePosts(filter?: (post: Post) => boolean) {
  const posts = useStore((s) => s.posts);
  const { key } = useViewer();
  const visible = posts.filter((post) => !post.deleted && !post.hiddenFor.includes(key) && (!filter || filter(post)));
  return sortFeed(visible, key);
}

export function isMember(group: Group, key: string) {
  return group.kind === "feed" || group.joinedBy.includes(key);
}

export function groupName(groups: Group[], id: string) {
  return groups.find((group) => group.id === id)?.name ?? (id === FEED_GROUP_ID ? "Bảng tin chung" : id);
}

export function timeAgo(iso: string) {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return `${Math.round(hours / 24)} ngày trước`;
}

export const formatPrice = (price: number) => `$${price.toLocaleString("en-US")}`;

/** Market listing title = first line of the body. */
export function splitMarketBody(body: string) {
  const [title, ...rest] = body.split("\n");
  return { title: title.trim(), rest: rest.join("\n").trim() };
}
