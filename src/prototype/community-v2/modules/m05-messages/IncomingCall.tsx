import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, MessageSquareText, Phone, PhoneOff } from "lucide-react";
import { Avatar, Button, Sheet } from "../../components";
import { useToast } from "./toast";
import { getState, useStore } from "../../store";
import { answerIncoming, declineIncoming, receiveIncoming } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { CallButton, CallStage } from "./CallScreen";
import { QUICK_REPLIES, ROLE_LABEL, nameOf, paths, personOf, usePeople, useViewerId } from "./lib";

/** S05-09 — opened by the `call.incoming` simulation (see index.ts) or directly. */
export function IncomingCall() {
  const navigate = useNavigate();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const viewerId = useViewerId();
  const people = usePeople();
  const incoming = useStore((s) => s.incomingCall);
  const [quickOpen, setQuickOpen] = useState(false);
  const blockedHandled = useRef(false);

  useEffect(() => {
    if (!incoming) receiveIncoming(viewerId === "kayla" ? "jessica" : "kayla", "voice");
  }, [incoming, viewerId]);

  useEffect(() => {
    if (!incoming || !viewerId || blockedHandled.current) return;
    if (getState().privacy.calls !== "Không ai") return;
    blockedHandled.current = true;
    declineIncoming(viewerId);
    toast("📵 Cuộc gọi bị chặn theo cài đặt Riêng tư — lưu vào cuộc nhỡ", "info");
    navigate(paths.calls, { replace: true });
  }, [incoming, viewerId, navigate, toast]);

  if (!incoming) return <CallStage><p className="m-auto text-white/70">Đang kết nối…</p></CallStage>;
  const caller = personOf(people, incoming.fromId);
  const callerName = nameOf(people, incoming.fromId);

  const answer = () =>
    requireAccount("nghe cuộc gọi", () => {
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      const active = answerIncoming(me);
      if (active) navigate(paths.call(active.id, active.type === "video"), { replace: true });
    });
  const decline = (reply?: string) =>
    requireAccount("từ chối cuộc gọi", () => {
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      const threadId = declineIncoming(me, reply);
      setQuickOpen(false);
      toast(reply ? `Đã gửi: “${reply}”` : "Đã từ chối — lưu vào cuộc gọi nhỡ");
      navigate(threadId ? paths.thread(threadId) : paths.calls, { replace: true });
    });

  return (
    <CallStage>
      <div className="flex justify-center pt-6">
        <span className={[
          "inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold",
        ].join(" ")}><Lock size={12} /> Mã hoá</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-white/70">
          {incoming.type === "video" ? "Cuộc gọi video đến" : "Cuộc gọi thoại đến"}
        </p>
        <span className="relative mt-6 grid place-items-center">
          <span className="absolute size-40 animate-ping rounded-full bg-nexoraSuccess/20" />
          <Avatar name={callerName} className="relative size-28 !text-[28px] ring-4 ring-white/20" />
        </span>
        <h2 className="mt-6 text-2xl font-bold">{callerName}</h2>
        {caller && <p className="mt-1 text-sm text-white/70">{ROLE_LABEL[caller.role]} · {caller.city}</p>}
      </div>
      <div className="flex justify-center gap-8 px-4 pb-10 pt-4">
        <CallButton label="Từ chối" danger onClick={() => decline()}><PhoneOff size={24} /></CallButton>
        <CallButton label="Nhắn nhanh" onClick={() => setQuickOpen(true)}><MessageSquareText size={22} /></CallButton>
        <button type="button" onClick={answer} className={[
          "flex w-16 flex-col items-center gap-1.5 text-[11px] text-white/85",
        ].join(" ")}>
          <span className={[
            "grid size-14 animate-bounce place-items-center rounded-full bg-nexoraSuccess text-white",
          ].join(" ")}><Phone size={24} /></span>
          Nghe
        </button>
      </div>
      <div className="text-nexoraText">
      <Sheet open={quickOpen} onClose={() => setQuickOpen(false)} title="Nhắn nhanh">
        <p className="mb-3 text-sm text-nexoraMuted">Từ chối cuộc gọi và gửi ngay một câu trả lời:</p>
        <div className="space-y-2">
          {QUICK_REPLIES.map((reply) => (
            <Button
              key={reply}
              variant="secondary"
              className="w-full justify-start text-left"
              onClick={() => decline(reply)}>
              {reply}
            </Button>
          ))}
        </div>
      </Sheet>
      </div>
    </CallStage>
  );
}
