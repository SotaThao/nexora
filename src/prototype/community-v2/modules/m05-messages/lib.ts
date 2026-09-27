import { useEffect, useState } from "react";
import { useStore } from "../../store";
import type { DemoState, Message, Person, Thread } from "../../store/types";
import { SYSTEM_ID } from "../../store/slices/m05";

export const BASE = "/community-v2";
export const paths = {
  inbox: `${BASE}/messages`,
  thread: (id: string) => `${BASE}/messages/${id}`,
  request: (id: string) => `${BASE}/messages/requests/${id}`,
  salon: `${BASE}/messages/salon`,
  community: `${BASE}/messages/community`,
  find: `${BASE}/messages/find`,
  newDm: (to: string) => `${BASE}/messages/new?to=${to}`,
  calls: `${BASE}/calls`,
  call: (id: string, video = false) => `${BASE}/calls/${id}${video ? "/video" : ""}`,
  incoming: `${BASE}/calls/incoming`,
  groupCall: (id: string) => `${BASE}/calls/group/${id}`,
  privacy: `${BASE}/privacy`,
  id: `${BASE}/id`,
};

export function lastOf<T>(list: T[]): T | undefined {
  return list[list.length - 1];
}

export const REACTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"];
export const QUICK_REPLIES = [
  "Em đang làm khách, xíu gọi lại nha",
  "Nhắn tin giúp em, em đọc liền",
  "Gọi lại sau 30 phút được không?",
];
export const SCAM_PATTERN = new RegExp(
  ["zelle", "cash app", "gift card", "đặt cọc", "chuyển tiền trước", "phí giữ chỗ", "western union"]
    .join("|"),
  "i",
);
export const SCAM_WARNING =
  "⚠️ AI cảnh báo lừa đảo: tin nhắn đòi chuyển tiền trước / đặt cọc … " +
  "Tiệm thật trên NEXORA không thu phí giữ chỗ qua tin nhắn. Đừng chuyển tiền.";
export const NOT_FOUND =
  "🔒 Không tìm thấy người dùng — Người này có thể chưa dùng NEXORA " +
  "hoặc không cho tìm bằng số điện thoại/email. " +
  "NEXORA không tiết lộ ai đang dùng số/email này.";

/** Signed-in viewer; guests have no personal inbox. Admin (no person) previews as Jessica. */
export function useViewerId(): string | null {
  return useStore((s) => (s.role === "guest" ? null : (s.currentPersonId ?? "jessica")));
}

export function usePeople() {
  return useStore((s) => s.people);
}

export function personOf(people: Person[], id: string | undefined) {
  return people.find((p) => p.id === id);
}

export function nameOf(people: Person[], id: string | undefined) {
  if (id === SYSTEM_ID) return "NEXORA";
  return personOf(people, id)?.name ?? "Thành viên NEXORA";
}

export function defaultNickname(person: Pick<Person, "id" | "name">) {
  const plain = person.name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .split(" ");
  return `${plain[0]}.${plain[plain.length - 1]}`.replace(/[^a-z0-9.]/g, "");
}

export function nicknameOf(state: Pick<DemoState, "nicknames" | "people">, id: string) {
  const person = personOf(state.people, id);
  return state.nicknames?.[id] ?? (person ? defaultNickname(person) : id);
}

export const ROLE_LABEL: Record<string, string> = {
  tech: "Thợ nail",
  owner: "Chủ tiệm",
  client: "Khách",
  admin: "Admin",
  guest: "Khách",
};

export function threadTitle(thread: Thread, people: Person[], viewerId: string | null) {
  if (thread.kind === "group") return thread.name ?? "Nhóm chat";
  const other = thread.participantIds.find((id) => id !== viewerId) ?? thread.participantIds[0];
  return nameOf(people, other);
}

export function otherId(thread: Thread, viewerId: string | null) {
  return thread.participantIds.find((id) => id !== viewerId) ?? thread.participantIds[0];
}

export function preview(message: Message | undefined) {
  if (!message) return "Chưa có tin nhắn";
  switch (message.kind) {
    case "voice":
      return "🎤 Tin thoại";
    case "shift":
      return "🗓️ Ca làm thêm";
    case "location":
      return "📍 Vị trí tiệm";
    case "image":
      return "🖼️ Ảnh";
    case "call":
      return message.call?.outcome === "missed" ? "📵 Cuộc gọi nhỡ" : "📞 Cuộc gọi";
    default:
      return message.body;
  }
}

export function clock(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(date.toDateString()).getTime()) / 864e5);
  if (diff <= 0) return clock(iso);
  if (diff === 1) return "Hôm qua";
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function duration(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function unreadOf(thread: Thread, viewerId: string | null) {
  return viewerId ? (thread.unread?.[viewerId] ?? 0) : 0;
}

export function isIncomingRequest(thread: Thread, viewerId: string | null) {
  return Boolean(thread.request && thread.request.toId === viewerId);
}

export function visibleThreads(state: DemoState, viewerId: string | null) {
  if (!viewerId) return [];
  return state.threads
    .filter((t) => t.participantIds.includes(viewerId))
    .filter((t) => !(t.request && t.request.toId === viewerId && state.blockedUserIds.includes(t.request.fromId)))
    .sort((a, b) => (lastOf(b.messages)?.at ?? "").localeCompare(lastOf(a.messages)?.at ?? ""));
}

/** Badge = unread + pending requests (requests count 0 when "Chặn hết"). */
export function inboxBadge(state: DemoState, viewerId: string | null) {
  const threads = visibleThreads(state, viewerId);
  const blockAll = state.privacy.strangers === "Chặn hết";
  const requests = blockAll ? 0 : threads.filter((t) => isIncomingRequest(t, viewerId)).length;
  const unread = threads
    .filter((t) => !isIncomingRequest(t, viewerId))
    .reduce((sum, t) => sum + unreadOf(t, viewerId), 0);
  return { requests, unread, total: requests + unread };
}

export function useIsDesktop() {
  const query = "(min-width: 1024px)";
  const [desktop, setDesktop] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setDesktop(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, []);
  return desktop;
}

export function useNow(active = true, ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(timer);
  }, [active, ms]);
  return now;
}
