import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Captions, Lock, Mic, MicOff, Minimize2, PhoneOff, UsersRound } from "lucide-react";
import { Avatar, Button } from "../../components";
import { getState, useStore } from "../../store";
import { endCall, joinGroupCall, setCallMinimized } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { CallButton, CallStage } from "./CallScreen";
import { duration, nameOf, paths, usePeople, useNow, useViewerId } from "./lib";

/** S05-11 — banner "● ĐANG GỌI · N người đang tham gia" + Tham gia + participant grid. */
export function GroupCall() {
  const { callId } = useParams();
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const viewerId = useViewerId();
  const people = usePeople();
  const threads = useStore((s) => s.threads);
  const active = useStore((s) => s.activeCall);
  const thread = threads.find((t) => t.groupCall?.callId === callId);
  const call = thread?.groupCall;
  const inCall = Boolean(active && active.id === callId && viewerId && call?.participantIds.includes(viewerId));
  const now = useNow(inCall);
  const [mic, setMic] = useState(true);
  const [subtitles, setSubtitles] = useState(false);

  useEffect(() => {
    // Opening the screen (banner / pill) restores a minimised call — mount only, so "Thu nhỏ" sticks.
    if (getState().activeCall?.id === callId && getState().activeCall?.minimized) setCallMinimized(false);
  }, [callId]);

  if (!thread || !call) {
    return (
      <div className={[
        "mx-auto max-w-lg rounded-flox-cards border border-nexoraBorder bg-white p-8 text-center",
        "shadow-nexora-card",
      ].join(" ")}>
        <p className="font-bold">Cuộc gọi nhóm đã kết thúc</p>
        <Link to={paths.inbox} className={[
          "mt-4 inline-flex min-h-11 items-center font-semibold text-nexoraBrand",
        ].join(" ")}>Về hộp thư</Link>
      </div>
    );
  }

  const join = () =>
    requireAccount("tham gia cuộc gọi đa người", () => {
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      joinGroupCall(thread.id, me);
    });
  const leave = () => {
    if (viewerId) endCall(viewerId);
    navigate(paths.thread(thread.id));
  };
  const minimize = () => {
    setCallMinimized(true);
    navigate(paths.thread(thread.id));
  };
  const seconds = active?.startedAt ? Math.max(0, Math.floor((now - active.startedAt) / 1000)) : 0;
  const speaking = call.participantIds[Math.floor(seconds / 3) % Math.max(call.participantIds.length, 1)];

  return (
    <CallStage>
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <div className="min-w-0">
          <p className="truncate font-bold">{thread.name}</p>
          <p className={[
            "flex items-center gap-1 text-xs text-white/70",
          ].join(" ")}><Lock size={11} /> Mã hoá · {call.type === "video" ? "Video nhóm" : "Gọi nhóm"}</p>
        </div>
        {inCall && (
          <button type="button" onClick={minimize} className={[
            "flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white/85",
            "hover:bg-white/10",
          ].join(" ")}>
            <Minimize2 size={16} /> Thu nhỏ
          </button>
        )}
      </div>
      {!inCall && (
        <div className="mx-4 mt-4 flex flex-col gap-3 rounded-xl bg-nexoraSuccess/20 p-4 sm:flex-row sm:items-center">
          <p className="flex-1 font-bold text-white">
            ● ĐANG GỌI · {call.participantIds.length} người đang tham gia
          </p>
          <Button className="bg-nexoraSuccess hover:bg-nexoraSuccess/90" onClick={join}>Tham gia</Button>
        </div>
      )}
      {inCall && <p className={[
        "mt-3 text-center font-mono text-white/80",
      ].join(" ")}>{duration(seconds)} · {call.participantIds.length} người</p>}
      <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto p-4 lg:grid-cols-3">
        {call.participantIds.map((id) => (
          <div
            key={id}
            className={[
              "relative grid aspect-square place-items-center rounded-2xl bg-white/10 p-3 lg:aspect-video",
              inCall && id === speaking ? "ring-2 ring-nexoraSuccess" : "",
            ].join(" ")}>
            <div className="text-center">
              <Avatar name={nameOf(people, id)} className="mx-auto size-16 !text-lg" />
              <p className="mt-2 truncate text-sm font-semibold">{nameOf(people, id)}{id === viewerId && " (bạn)"}</p>
              {inCall && id === speaking && <p className="text-[11px] text-nexoraSuccess">đang nói</p>}
            </div>
          </div>
        ))}
        {!call.participantIds.length && (
          <p className={[
            "col-span-full m-auto text-white/70",
          ].join(" ")}><UsersRound className="mx-auto mb-2" />Chưa có ai trong cuộc gọi</p>
        )}
      </div>
      {subtitles && inCall && (
        <div className="mx-4 rounded-xl bg-black/30 p-3 text-sm">
          <p>
            <b>{nameOf(people, speaking)}:</b>{" "}
            Tuần này tiệm đông, mọi người nhớ check-in đúng giờ nha.
          </p>
          <p className="text-white/75">🌐 The salon is busy this week, please check in on time.</p>
        </div>
      )}
      {inCall && (
        <div className="flex justify-center gap-5 px-4 pb-6 pt-4">
          <CallButton label={mic ? "Tắt mic" : "Bật mic"} active={!mic} onClick={() => setMic(!mic)}>
            {mic ? <Mic size={22} /> : <MicOff size={22} />}
          </CallButton>
          <CallButton
            label="Phụ đề AI"
            active={subtitles}
            onClick={() => setSubtitles(!subtitles)}><Captions size={22} /></CallButton>
          <CallButton label="Rời cuộc gọi" danger onClick={leave}><PhoneOff size={22} /></CallButton>
        </div>
      )}
    </CallStage>
  );
}
