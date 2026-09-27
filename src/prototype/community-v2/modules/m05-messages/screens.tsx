import { useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components";
import { useStore } from "../../store";
import type { ScreenDefinition, Thread } from "../../store/types";
import { openOrCreateDm } from "../../store/slices/m05";
import { CallHistory } from "./CallHistory";
import { CallScreen } from "./CallScreen";
import { DRAFT_ID } from "./ChatRoom";
import { FindPeople } from "./FindPeople";
import { GroupCall } from "./GroupCall";
import { GroupDiscovery } from "./GroupDiscovery";
import { IdCard } from "./IdCard";
import { IncomingCall } from "./IncomingCall";
import { InboxLayout } from "./InboxLayout";
import { PageHeader } from "./PageHeader";
import { PrivacyScreen } from "./PrivacyScreen";
import { paths, useViewerId } from "./lib";

type Props = { screen: ScreenDefinition };
const DRAFT_HINT =
  "Tạo tài khoản NEXORA miễn phí để gửi tin — tin bạn gõ sẽ tự gửi sau khi đăng ký.";
const SALON_EMPTY =
  "Nhóm tiệm tự tạo từ danh sách nhân viên POS — chỉ thợ và chủ tiệm đang làm mới thấy.";

/** Contract 3: /community-v2/messages/new?to=<personId>. */
function NewDm() {
  const [params] = useSearchParams();
  const to = params.get("to") ?? "";
  const viewerId = useViewerId();
  const navigate = useNavigate();
  const person = useStore((s) => s.people.find((p) => p.id === to));
  const blocked = useStore((s) => s.blockedUserIds.includes(to));
  const valid = Boolean(person) && !blocked;

  useEffect(() => {
    if (!valid || !viewerId) return;
    if (to === viewerId) {
      navigate(paths.id, { replace: true });
      return;
    }
    navigate(paths.thread(openOrCreateDm(viewerId, to)), { replace: true });
  }, [valid, viewerId, to, navigate]);

  if (!valid) return <InboxLayout notFound />;
  if (viewerId) return <InboxLayout />;
  const draft: Thread = {
    id: DRAFT_ID,
    kind: "dm",
    participantIds: [to],
    messages: [
      {
        id: "draft-hint",
        senderId: "system",
        kind: "system",
        at: new Date().toISOString(),
        body: DRAFT_HINT,
      },
    ],
  };
  return <InboxLayout draft={draft} draftTo={to} />;
}

export function InboxScreen(_: Props) {
  const location = useLocation();
  if (location.pathname.replace(/\/$/, "").endsWith("/messages/new")) return <NewDm />;
  return <InboxLayout />;
}

export function RoomScreen(_: Props) {
  const { threadId = "" } = useParams();
  const exists = useStore((s) => s.threads.some((t) => t.id === threadId));
  if (threadId === "new") return <NewDm />;
  return exists ? <InboxLayout selectedId={threadId} /> : <InboxLayout notFound />;
}

export function RequestScreen(_: Props) {
  const { threadId = "" } = useParams();
  const exists = useStore((s) => s.threads.some((t) => t.id === threadId));
  return exists ? <InboxLayout selectedId={threadId} /> : <Navigate to={paths.inbox} replace />;
}

export function SalonScreen(_: Props) {
  const viewerId = useViewerId();
  const threads = useStore((s) => s.threads);
  const pos = threads.find((t) => t.groupType === "pos" && viewerId && t.participantIds.includes(viewerId));
  if (pos) return <InboxLayout selectedId={pos.id} />;
  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Nhóm tiệm" />
      <EmptyState
        title="Bạn chưa thuộc nhóm tiệm nào"
        body={SALON_EMPTY}
      />
    </div>
  );
}

export const CommunityScreen = (_: Props) => <GroupDiscovery />;
export const FindScreen = (_: Props) => <FindPeople />;
export const IncomingScreen = (_: Props) => <IncomingCall />;
export const HistoryScreen = (_: Props) => <CallHistory />;
export const GroupCallScreen = (_: Props) => <GroupCall />;
export const PrivacyRoute = (_: Props) => <PrivacyScreen />;
export const IdScreen = (_: Props) => <IdCard />;
export { CallScreen };
