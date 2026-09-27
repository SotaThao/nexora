import { Link } from "react-router-dom";
import { MessageCircle, Pin } from "lucide-react";
import { Avatar, Sheet } from "../../components";
import { useStore } from "../../store";
import type { Thread } from "../../store/types";
import { ROLE_LABEL, nameOf, paths, personOf, preview, usePeople, useViewerId } from "./lib";

export function PinnedBar({ thread }: { thread: Thread }) {
  const pinned = thread.messages.find((msg) => msg.id === thread.pinnedMessageId);
  if (!pinned) return null;
  return (
    <div className="flex items-start gap-2 border-b border-nexoraBorder bg-nexoraBrandSoft/60 px-4 py-2.5">
      <Pin size={15} className="mt-0.5 shrink-0 text-nexoraBrand" />
      <div className="min-w-0 text-xs">
        <p className="font-bold text-nexoraBrand">Tin đã ghim</p>
        <p className="line-clamp-2 text-nexoraText">{preview(pinned)}</p>
      </div>
    </div>
  );
}

export function GroupCallBanner({ thread }: { thread: Thread }) {
  const viewerId = useViewerId();
  const call = thread.groupCall;
  if (!call || call.participantIds.length === 0) return null;
  const joined = viewerId ? call.participantIds.includes(viewerId) : false;
  return (
    <div className="flex items-center gap-3 border-b border-nexoraSuccess/30 bg-nexoraSuccess/10 px-4 py-2">
      <p className="min-w-0 flex-1 text-xs font-bold text-nexoraSuccess">
        ● ĐANG GỌI · {call.participantIds.length} người đang tham gia
      </p>
      <Link
        to={paths.groupCall(call.callId)}
        className={[
          "flex min-h-10 items-center rounded-full bg-nexoraSuccess px-4 text-sm font-semibold",
          "text-white hover:opacity-90",
        ].join(" ")}
      >
        {joined ? "Mở cuộc gọi" : "Tham gia"}
      </Link>
    </div>
  );
}

function MemberList({ thread }: { thread: Thread }) {
  const people = usePeople();
  const viewerId = useViewerId();
  const salon = useStore((s) => s.salons.find((item) => item.id === thread.salonId));
  return (
    <div className="space-y-1">
      {thread.groupType === "pos" && (
        <p className="mb-2 rounded-lg bg-nexoraWarning/10 px-3 py-2 text-xs text-nexoraMuted">
          Thành viên = nhân viên đang làm tại {salon?.name ?? "tiệm"}
          (đồng bộ từ POS, nghỉ việc tự rời).
        </p>
      )}
      {thread.groupType === "public" && (
        <p className={[
          "mb-2 text-xs text-nexoraMuted",
        ].join(" ")}>{thread.memberCount?.toLocaleString("vi-VN")} thành viên · hiển thị một phần</p>
      )}
      {thread.participantIds.map((id) => {
        const person = personOf(people, id);
        return (
          <div key={id} className="flex min-h-12 items-center gap-2.5 rounded-lg px-2 py-1.5">
            <Avatar name={nameOf(people, id)} className="size-9 text-xs" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{nameOf(people, id)}{id === viewerId && " (bạn)"}</p>
              <p className="truncate text-xs text-nexoraSubtle">
                {person ? `${ROLE_LABEL[person.role]} · ${person.city}` : "Thành viên"}
              </p>
            </div>
            {id !== viewerId && (
              <Link to={paths.newDm(id)} aria-label={`Nhắn ${nameOf(people, id)}`}
                className="grid size-10 place-items-center rounded-full text-nexoraBrand hover:bg-nexoraBrandSoft">
                <MessageCircle size={17} />
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function MembersPanel({ thread }: { thread: Thread }) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-l border-nexoraBorder bg-white xl:flex">
      <p className="border-b border-nexoraBorder px-4 py-4 font-bold">Thành viên · {thread.participantIds.length}</p>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <MemberList thread={thread} />
      </div>
    </aside>
  );
}

export function MembersSheet({ thread, open, onClose }: { thread: Thread; open: boolean; onClose: () => void }) {
  return (
    <Sheet open={open} onClose={onClose} title={`Thành viên · ${thread.participantIds.length}`}>
      <MemberList thread={thread} />
    </Sheet>
  );
}
