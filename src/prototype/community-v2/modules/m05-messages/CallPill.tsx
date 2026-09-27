import { useNavigate } from "react-router-dom";
import { Maximize2, PhoneOff } from "lucide-react";
import { useStore } from "../../store";
import { endCall, setCallMinimized } from "../../store/slices/m05";
import { duration, nameOf, paths, usePeople, useNow, useViewerId } from "./lib";

/** Minimised call — floats over M05 screens so you keep chatting (S05-07). */
export function CallPill() {
  const active = useStore((s) => s.activeCall);
  const people = usePeople();
  const viewerId = useViewerId();
  const navigate = useNavigate();
  const now = useNow(Boolean(active?.minimized));
  if (!active || !active.minimized) return null;
  const seconds = active.startedAt ? Math.max(0, Math.floor((now - active.startedAt) / 1000)) : 0;
  const label = active.group
    ? `Gọi nhóm · ${active.peerIds.length + 1} người`
    : nameOf(people, active.peerIds[0]);
  const reopen = () => {
    setCallMinimized(false);
    navigate(active.group ? paths.groupCall(active.id) : paths.call(active.id, active.type === "video"));
  };
  return (
    <div className={[
      "fixed bottom-[84px] right-4 z-[46] flex items-center gap-1 rounded-full bg-nexoraSidebar",
      "p-1 pl-4 text-white shadow-premium lg:bottom-24 lg:right-10",
    ].join(" ")}>
      <button type="button" onClick={reopen} className="flex min-h-11 items-center gap-2 pr-2 text-sm font-semibold">
        <span className="size-2 animate-pulse rounded-full bg-nexoraSuccess" />
        <span className="max-w-36 truncate">{label}</span>
        <span className={[
          "font-mono tabular-nums text-white/80",
        ].join(" ")}>{active.phase === "connected" ? duration(seconds) : "Đang gọi..."}</span>
        <Maximize2 size={15} className="text-white/70" />
      </button>
      <button
        type="button"
        aria-label="Kết thúc cuộc gọi"
        onClick={() => viewerId && endCall(viewerId)}
        className="grid size-11 place-items-center rounded-full bg-nexoraDanger text-white"
      >
        <PhoneOff size={17} />
      </button>
    </div>
  );
}
