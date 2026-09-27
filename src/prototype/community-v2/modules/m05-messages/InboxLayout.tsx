import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { useStore } from "../../store";
import type { Thread } from "../../store/types";
import { M05Overlays } from "./toast";
import { ChatRoom, DRAFT_ID } from "./ChatRoom";
import { RequestRoom } from "./RequestRoom";
import { type InboxTab, ThreadList } from "./ThreadList";
import { isIncomingRequest, paths, useIsDesktop, useViewerId, visibleThreads } from "./lib";

const TAB_IDS: InboxTab[] = ["dm", "groups", "calls", "privacy"];
const NOT_FOUND_BODY = "Hội thoại có thể đã bị xoá hoặc bạn đã chặn người này.";
const PICK_BODY = "Tin nhắn, nhóm chat và cuộc gọi của bạn ở cùng một chỗ.";

function EmptyPane({ title, body }: { title: string; body: string }) {
  return (
    <div className="grid h-full place-items-center bg-nexoraCanvas p-8 text-center">
      <div>
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-nexoraBrandSoft text-nexoraBrand">
          <MessageCircle size={24} />
        </span>
        <p className="mt-4 font-bold">{title}</p>
        <p className="mt-1 max-w-xs text-sm text-nexoraMuted">{body}</p>
      </div>
    </div>
  );
}

type Props = {
  /** Thread opened by the route (mobile shows it full-screen). */
  selectedId?: string;
  /** Unsaved thread (guest composing to `draftTo`). */
  draft?: Thread;
  draftTo?: string;
  notFound?: boolean;
};

export function InboxLayout({ selectedId, draft, draftTo, notFound }: Props) {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const desktop = useIsDesktop();
  const viewerId = useViewerId();
  const state = useStore((s) => s);
  const threads = visibleThreads(state, viewerId);
  const routeThread = draft ?? state.threads.find((t) => t.id === selectedId);
  const paramTab = params.get("tab") as InboxTab | null;
  const routeTab: InboxTab = routeThread?.kind === "group" ? "groups" : "dm";
  const initialTab: InboxTab = paramTab && TAB_IDS.includes(paramTab) ? paramTab : routeTab;
  const [tab, setTab] = useState<InboxTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  const fallback =
    threads.find((t) => (tab === "groups" ? t.kind === "group" : t.kind === "dm") && !isIncomingRequest(t, viewerId)) ??
    threads.find((t) => !isIncomingRequest(t, viewerId));
  const shown = routeThread ?? (desktop && !notFound ? fallback : undefined);
  const roomOpen = Boolean(routeThread || notFound);
  const back = () => navigate(tab === "dm" ? paths.inbox : `${paths.inbox}?tab=${tab}`);
  const changeTab = (next: InboxTab) => {
    setTab(next);
    if (!selectedId && !draft) setParams(next === "dm" ? {} : { tab: next }, { replace: true });
  };

  let pane;
  if (notFound) {
    pane = <EmptyPane title="Không tìm thấy hội thoại" body={NOT_FOUND_BODY} />;
  }
  else if (!shown) {
    pane = <EmptyPane title="Chọn một hội thoại" body={PICK_BODY} />;
  }
  else if (isIncomingRequest(shown, viewerId)) pane = <RequestRoom key={shown.id} thread={shown} onBack={back} />;
  else {
    const draftTarget = shown.id === DRAFT_ID ? draftTo : undefined;
    pane = <ChatRoom key={shown.id} thread={shown} onBack={back} draftTo={draftTarget} />;
  }

  return (
    <>
      <div className={[
        "lg:grid lg:h-[calc(100dvh-10.5rem)] lg:min-h-[560px] lg:grid-cols-[360px_minmax(0,1fr)]",
        "lg:overflow-hidden lg:rounded-flox-cards lg:border lg:border-nexoraBorder lg:bg-white",
        "lg:shadow-nexora-card",
      ].join(" ")}>
        <div
          className={[
            roomOpen ? "hidden lg:flex" : "flex",
            "min-h-0 flex-col overflow-hidden rounded-flox-cards border border-nexoraBorder bg-white",
            "shadow-nexora-card lg:rounded-none lg:border-0 lg:border-r lg:shadow-none",
          ].join(" ")}
        >
          <ThreadList tab={tab} onTab={changeTab} selectedId={shown?.id} />
        </div>
        <div
          className={[
            roomOpen ? "fixed inset-x-0 bottom-0 top-14 z-[45] flex" : "hidden",
            "min-h-0 flex-col bg-white lg:static lg:z-auto lg:flex",
          ].join(" ")}
        >
          {pane}
        </div>
      </div>
      <M05Overlays />
    </>
  );
}
