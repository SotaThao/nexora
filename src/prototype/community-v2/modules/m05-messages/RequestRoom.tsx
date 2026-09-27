import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Avatar, Button } from "../../components";
import { useToast } from "./toast";
import { useStore } from "../../store";
import type { Thread } from "../../store/types";
import { acceptRequest, blockAndReport } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { MessageBubble } from "./MessageBubble";
import { nameOf, paths, personOf, usePeople } from "./lib";

/** S05-03 — no composer, no call buttons; only Chấp nhận / 🚫 Chặn & báo cáo. */
export function RequestRoom({ thread, onBack }: { thread: Thread; onBack: () => void }) {
  const people = usePeople();
  const scamWarnings = useStore((s) => s.privacy.scamWarnings);
  const { requireAccount } = useCommunityGate();
  const navigate = useNavigate();
  const toast = useToast();
  const fromId = thread.request?.fromId ?? thread.participantIds[0];
  const sender = personOf(people, fromId);

  const accept = () =>
    requireAccount("chấp nhận lời mời nhắn tin", () => {
      acceptRequest(thread.id);
      toast("Đã chấp nhận — có thể trả lời", "success");
      navigate(paths.thread(thread.id), { replace: true });
    });
  const block = () =>
    requireAccount("chặn & báo cáo", () => {
      blockAndReport(thread.id);
      toast("🚫 Đã chặn & gửi báo cáo cho đội kiểm duyệt NEXORA", "success");
      navigate(paths.inbox, { replace: true });
    });

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col bg-white">
      <header className="flex min-h-16 items-center gap-2 border-b border-nexoraBorder px-2 lg:px-4">
        <button type="button" aria-label="Quay lại hộp thư" onClick={onBack}
          className={[
            "grid size-11 place-items-center rounded-full text-nexoraMuted hover:bg-nexoraSurfaceMuted",
            "lg:hidden",
          ].join(" ")}>
          <ArrowLeft size={20} />
        </button>
        <Avatar name={nameOf(people, fromId)} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{nameOf(people, fromId)}</p>
          <p className="truncate text-xs text-nexoraSubtle">
            Người lạ · {sender ? `${sender.city} · ${sender.nxId}` : "chưa kết nối"}
          </p>
        </div>
        <span className={[
          "rounded-full bg-nexoraWarning/15 px-3 py-1 text-xs font-bold text-nexoraText",
        ].join(" ")}>Lời mời nhắn tin</span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto bg-nexoraCanvas px-3 py-4 lg:px-5">
        <p className={[
          "mx-auto mb-3 max-w-md rounded-xl border border-nexoraWarning/50 bg-nexoraWarning/10 px-4",
          "py-3 text-center text-xs text-nexoraMuted",
        ].join(" ")}>
          Người lạ — bạn duyệt mới trả lời được.
          Họ không thấy bạn online và không gọi được cho tới khi bạn chấp nhận.
        </p>
        {thread.messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            own={false}
            people={people}
            firstOfRun={index === 0}
            lastOfRun={index === thread.messages.length - 1}
            isGroup={false}
            term=""
            scamWarnings={scamWarnings}
            menuOpen={false}
            onMenu={() => undefined}
            onReply={() => undefined}
            onReact={() => undefined}
            onCallBack={() => undefined}
          />
        ))}
      </div>
      <footer className="border-t border-nexoraBorder bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p className="mb-2 text-center text-xs text-nexoraSubtle">Chặn sẽ không báo cho người kia.</p>
        <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
          <Button variant="secondary" className="border-nexoraDanger/50 text-nexoraDanger" onClick={block}>
            🚫 Chặn & báo cáo
          </Button>
          <Button onClick={accept}>Chấp nhận</Button>
        </div>
      </footer>
    </section>
  );
}
