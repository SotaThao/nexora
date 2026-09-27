import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Search, UserPlus, UsersRound } from "lucide-react";
import { Avatar, Button } from "../../components";
import { useStore } from "../../store";
import type { Thread } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { CallList } from "./CallList";
import { PrivacyTab } from "./PrivacyTab";
import {
  dayLabel, inboxBadge, lastOf, isIncomingRequest, paths, preview, threadTitle, unreadOf, usePeople, useViewerId,
  visibleThreads,
} from "./lib";

export type InboxTab = "dm" | "groups" | "calls" | "privacy";
const TABS: { id: InboxTab; emoji: string; label: string }[] = [
  { id: "dm", emoji: "💬", label: "Tin nhắn" },
  { id: "groups", emoji: "👥", label: "Nhóm chat" },
  { id: "calls", emoji: "📞", label: "Cuộc gọi" },
  { id: "privacy", emoji: "🛡️", label: "Riêng tư & ID" },
];

function ThreadRow({ thread, selected }: { thread: Thread; selected: boolean }) {
  const people = usePeople();
  const viewerId = useViewerId();
  const unread = unreadOf(thread, viewerId);
  const last = lastOf(thread.messages.filter((msg) => msg.kind !== "system")) ?? lastOf(thread.messages);
  const title = threadTitle(thread, people, viewerId);
  const pending = thread.request && thread.request.fromId === viewerId;
  return (
    <Link
      to={paths.thread(thread.id)}
      aria-current={selected ? "page" : undefined}
      className={`flex min-h-16 items-center gap-3 rounded-lg px-3 py-2.5 transition ${
        selected ? "bg-nexoraBrandSoft" : "hover:bg-nexoraSurfaceMuted"
      }`}
    >
      {thread.kind === "group" ? (
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-nexoraSidebar text-white">
          <UsersRound size={19} />
        </span>
      ) : (
        <Avatar name={title} className="size-11" />
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className={`truncate text-sm ${unread ? "font-bold" : "font-semibold"}`}>{title}</span>
          {thread.groupType === "pos" && (
            <span className="rounded bg-nexoraWarning/15 px-1.5 text-[10px] font-bold text-nexoraText">POS</span>
          )}
          <span className="ml-auto shrink-0 text-xs text-nexoraSubtle">{last ? dayLabel(last.at) : ""}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={`truncate text-xs ${unread ? "font-semibold text-nexoraText" : "text-nexoraSubtle"}`}>
            {pending ? "Đang chờ họ chấp nhận" : preview(last)}
          </span>
          {thread.groupCall && thread.groupCall.participantIds.length > 0 && <span className={[
            "shrink-0 text-[10px] font-bold text-nexoraSuccess",
          ].join(" ")}>● ĐANG GỌI</span>}
          {unread > 0 && (
            <span className={[
              "ml-auto grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-nexoraBrand px-1.5",
              "text-[11px] font-bold text-white",
            ].join(" ")}>
              {unread}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

function RequestCard({ requests }: { requests: Thread[] }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  if (!requests.length) return null;
  const openCard = () => (requests.length === 1 ? navigate(paths.request(requests[0].id)) : setOpen(!open));
  return (
    <div className="rounded-xl border border-nexoraWarning/60 bg-nexoraWarning/10">
      <button type="button" onClick={openCard} className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-left">
        <span className="text-xl">✉️</span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-bold">
            Lời mời nhắn tin
            <span className={[
              "grid h-5 min-w-5 place-items-center rounded-full bg-nexoraWarning px-1.5 text-[11px]",
              "text-white",
            ].join(" ")}>
              {requests.length}
            </span>
          </span>
          <span className="block text-xs text-nexoraMuted">
            Người lạ — bạn duyệt mới trả lời được
          </span>
        </span>
        <ChevronRight size={18} className="text-nexoraMuted" />
      </button>
      {open && (
        <div className="border-t border-nexoraWarning/40 p-1">
          {requests.map((t) => (
            <Link key={t.id} to={paths.request(t.id)} className="block rounded-lg px-3 py-2 text-sm hover:bg-white/60">
              {lastOf(t.messages)?.body}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function GuestPrompt() {
  const { requireAccount } = useCommunityGate();
  const navigate = useNavigate();
  return (
    <div className="rounded-xl border border-dashed border-nexoraBorder p-5 text-center">
      <p className="font-bold">Nhắn tin & gọi cần tài khoản</p>
      <p className="mt-1 text-sm text-nexoraMuted">Bạn vẫn xem được các cộng đồng công khai.</p>
      <div className="mt-4 grid gap-2">
        <Button variant="gradient" onClick={() => requireAccount("Gửi tin", () => navigate(paths.inbox))}>
          Tạo tài khoản miễn phí
        </Button>
        <Button variant="secondary" onClick={() => navigate(paths.community)}>
          Xem cộng đồng công khai
        </Button>
      </div>
    </div>
  );
}

type Props = { tab: InboxTab; onTab: (tab: InboxTab) => void; selectedId?: string };

export function ThreadList({ tab, onTab, selectedId }: Props) {
  const state = useStore((s) => s);
  const viewerId = useViewerId();
  const people = usePeople();
  const [query, setQuery] = useState("");
  const badge = inboxBadge(state, viewerId);
  const all = visibleThreads(state, viewerId);
  const blockAll = state.privacy.strangers === "Chặn hết";
  const requests = blockAll ? [] : all.filter((t) => isIncomingRequest(t, viewerId));
  const q = query.trim().toLowerCase();
  const matches = (t: Thread) =>
    !q ||
    threadTitle(t, people, viewerId).toLowerCase().includes(q) ||
    t.messages.some((msg) => msg.body.toLowerCase().includes(q));
  const list = all
    .filter((t) => !isIncomingRequest(t, viewerId))
    .filter((t) => (tab === "groups" ? t.kind === "group" : t.kind === "dm"))
    .filter(matches);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <h2 className="text-lg font-bold">Tin nhắn & Gọi</h2>
        <Link to={paths.find} className={[
          "flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-nexoraBrand",
          "hover:bg-nexoraBrandSoft",
        ].join(" ")}>
          <UserPlus size={17} /> Tìm người
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-1 px-3" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => onTab(item.id)}
            className={`relative flex min-h-14 flex-col items-center justify-center rounded-lg px-1 text-[11px] ${
              "font-semibold leading-tight"} ${
              tab === item.id ? "bg-nexoraBrandSoft text-nexoraBrand" : "text-nexoraMuted hover:bg-nexoraSurfaceMuted"
            }`}
          >
            <span className="text-base">{item.emoji}</span>
            <span className="mt-0.5 text-center">{item.label}</span>
            {item.id === "dm" && badge.total > 0 && (
              <span className={[
                "absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-nexoraDanger",
                "px-1 text-[10px] text-white",
              ].join(" ")}>
                {badge.total}
              </span>
            )}
          </button>
        ))}
      </div>
      {(tab === "dm" || tab === "groups") && (
        <label className="mx-3 mt-3 flex min-h-11 items-center gap-2 rounded-lg bg-nexoraSurfaceMuted px-3">
          <Search size={17} className="text-nexoraSubtle" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === "dm" ? "Tìm hội thoại" : "Tìm nhóm chat"}
            aria-label="Tìm trong hộp thư"
            className="w-full bg-transparent text-base outline-none lg:text-sm"
          />
        </label>
      )}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3">
        {tab === "calls" && <CallList compact />}
        {tab === "privacy" && <PrivacyTab />}
        {(tab === "dm" || tab === "groups") && !viewerId && <GuestPrompt />}
        {tab === "dm" && viewerId && !q && <RequestCard requests={requests} />}
        {(tab === "dm" || tab === "groups") && viewerId && list.map((t) => (
          <ThreadRow key={t.id} thread={t} selected={t.id === selectedId} />
        ))}
        {(tab === "dm" || tab === "groups") && viewerId && q && !list.length && (
          <Link to={`${paths.find}?q=${encodeURIComponent(query)}`} className={[
            "block rounded-lg p-4 text-center text-sm text-nexoraMuted hover:bg-nexoraSurfaceMuted",
          ].join(" ")}>
            Không có hội thoại khớp.{" "}
            <span className="font-semibold text-nexoraBrand">Tìm “{query}” trên NEXORA →</span>
          </Link>
        )}
        {tab === "groups" && (
          <Link to={paths.community} className={[
            "mt-2 flex min-h-14 items-center gap-3 rounded-xl border border-nexoraBorder px-3",
            "hover:bg-nexoraSurfaceMuted",
          ].join(" ")}>
            <span className="text-xl">🌎</span>
            <span className="flex-1 text-sm">
              <b className="block">Khám phá cộng đồng công khai</b>
              <span className="text-xs text-nexoraMuted">Theo thành phố & chủ đề · tham gia 1 chạm</span>
            </span>
            <ChevronRight size={18} className="text-nexoraMuted" />
          </Link>
        )}
      </div>
    </div>
  );
}
