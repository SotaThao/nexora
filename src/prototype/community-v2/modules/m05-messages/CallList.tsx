import { useNavigate } from "react-router-dom";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Video } from "lucide-react";
import { Avatar } from "../../components";
import { useStore } from "../../store";
import type { Call } from "../../store/types";
import { startCall } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { dayLabel, duration, nameOf, paths, usePeople, useViewerId } from "./lib";

function describe(call: Call) {
  const kind = call.type === "video" ? "Video" : "Thoại";
  if (call.outcome === "missed" || call.outcome === "declined") return `Cuộc gọi nhỡ · ${kind}`;
  if (call.outcome === "no-answer") return `Gọi đi · không trả lời · ${kind}`;
  const dir = call.direction === "outgoing" ? "Gọi đi" : "Gọi đến";
  return `${dir} · ${duration(call.seconds ?? 0)} · ${kind}`;
}

function CallIcon({ call }: { call: Call }) {
  if (call.outcome === "missed" || call.outcome === "declined") {
    return <PhoneMissed size={15} className="text-nexoraDanger" />;
  }
  if (call.direction === "outgoing") return <PhoneOutgoing size={15} className="text-nexoraSuccess" />;
  return <PhoneIncoming size={15} className="text-nexoraBrand" />;
}

export function useCallBack() {
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  return (call: Pick<Call, "peerIds" | "type" | "threadId" | "group">) =>
    requireAccount("gọi lại", () => {
      const id = startCall({ peerIds: call.peerIds, type: call.type, threadId: call.threadId, group: call.group });
      navigate(paths.call(id, call.type === "video"));
    });
}

export function CallList({ compact = false }: { compact?: boolean }) {
  const viewerId = useViewerId();
  const people = usePeople();
  const calls = useStore((s) => s.calls).filter((c) => c.ownerId === viewerId);
  const callBack = useCallBack();
  if (!viewerId) {
    return <p className="p-4 text-center text-sm text-nexoraMuted">Đăng ký để gọi thoại & video.</p>;
  }
  if (!calls.length) return <p className="p-4 text-center text-sm text-nexoraMuted">Chưa có cuộc gọi nào.</p>;
  return (
    <ul className={compact ? "space-y-1" : "divide-y divide-nexoraRule"}>
      {calls.map((call) => {
        const missed = call.outcome === "missed" || call.outcome === "declined";
        const rowPad = compact ? "rounded-lg px-3 py-2 hover:bg-nexoraSurfaceMuted" : "px-4 py-3";
        const title = call.group ? `Nhóm · ${call.peerIds.length + 1} người` : nameOf(people, call.peerIds[0]);
        return (
          <li
            key={call.id}
            className={`flex min-h-16 items-center gap-3 ${rowPad}`}>
            <Avatar name={call.group ? "Nhóm POS" : title} className={compact ? "size-10" : "size-11"} />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-semibold ${missed ? "text-nexoraDanger" : ""}`}>{title}</p>
              <p className={`flex items-center gap-1.5 text-xs ${missed ? "text-nexoraDanger" : "text-nexoraSubtle"}`}>
                <CallIcon call={call} />
                <span className="truncate">{describe(call)}</span>
              </p>
            </div>
            <span className="hidden shrink-0 text-xs text-nexoraSubtle sm:inline">{dayLabel(call.at)}</span>
            <button
              type="button"
              onClick={() => callBack(call)}
              aria-label={`Gọi lại ${title}`}
              className={[
                "flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border border-nexoraBorder px-3",
                "text-sm font-semibold text-nexoraBrand hover:bg-nexoraBrandSoft",
              ].join(" ")}
            >
              {call.type === "video" ? <Video size={16} /> : <Phone size={16} />}
              {!compact && "Gọi lại"}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
