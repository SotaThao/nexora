import { type ReactNode, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Camera, CameraOff, Captions, Lock, Mic, MicOff, Minimize2, PhoneOff, SwitchCamera, Volume2, VolumeX,
} from "lucide-react";
import { Avatar } from "../../components";
import { getState, useStore } from "../../store";
import type { ScreenDefinition } from "../../store/types";
import { connectCall, endCall, setCallMinimized, startCall } from "../../store/slices/m05";
import { M05Overlays } from "./toast";
import { duration, nameOf, paths, usePeople, useNow, useViewerId } from "./lib";

const LINES = [
  {
    peer: true,
    vi: "Chị cần thêm 1 thợ chiều thứ bảy nha.",
    en: "I need one more tech on Saturday afternoon.",
  },
  { peer: false, vi: "Dạ em làm được từ 1 giờ tới 7 giờ.", en: "I can work from 1 to 7 PM." },
  { peer: true, vi: "Ok, em nhớ check-in trên app nha.", en: "OK, remember to check in on the app." },
  { peer: false, vi: "Dạ, em cảm ơn chị.", en: "Thank you so much." },
];

export function CallButton({ label, active, danger, onClick, children }: {
  label: string; active?: boolean; danger?: boolean; onClick: () => void; children: ReactNode;
}) {
  const idle = "bg-white/15 text-white hover:bg-white/25";
  const tone = danger ? "bg-nexoraDanger text-white" : active ? "bg-white text-nexoraSidebar" : idle;
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className={[
      "flex w-16 flex-col items-center gap-1.5 text-[11px] text-white/85",
    ].join(" ")}>
      <span className={`grid size-14 place-items-center rounded-full transition ${tone}`}>{children}</span>
      <span className="text-center leading-tight">{label}</span>
    </button>
  );
}

export function CallStage({ children }: { children: ReactNode }) {
  return (
    <div className={[
      "fixed inset-x-0 bottom-0 top-14 z-[45] flex flex-col overflow-hidden bg-gradient-to-b",
      "from-nexoraSidebar to-nexoraSidebarPanel text-white lg:static lg:z-auto",
      "lg:h-[calc(100dvh-10.5rem)] lg:min-h-[560px] lg:rounded-2xl",
    ].join(" ")}>
      {children}
      <M05Overlays />
    </div>
  );
}

export function CallScreen({ screen }: { screen: ScreenDefinition }) {
  const { callId } = useParams();
  const navigate = useNavigate();
  const viewerId = useViewerId();
  const people = usePeople();
  const active = useStore((s) => s.activeCall);
  const [mic, setMic] = useState(true);
  const [speaker, setSpeaker] = useState(false);
  const [subtitles, setSubtitles] = useState(false);
  const [camera, setCamera] = useState(true);
  const [front, setFront] = useState(true);
  const video = screen.id === "S05-08" || active?.type === "video";
  const matches = active && active.id === callId;
  const now = useNow(Boolean(matches));

  useEffect(() => {
    if (matches) {
      if (active.minimized) setCallMinimized(false);
      return;
    }
    // Deep link / "Gọi lại" from a history row: (re)start a call to that person.
    const record = getState().calls.find((c) => c.id === callId);
    const id = startCall({
      peerIds: record?.peerIds ?? ["kayla"],
      type: screen.id === "S05-08" ? "video" : (record?.type ?? "voice"),
      threadId: record?.threadId,
      group: record?.group,
    });
    navigate(paths.call(id, screen.id === "S05-08"), { replace: true });
  }, [callId, matches]);

  useEffect(() => {
    if (!matches || active.phase !== "ringing") return undefined;
    const timer = window.setTimeout(connectCall, 2200);
    return () => window.clearTimeout(timer);
  }, [matches, active?.phase]);

  if (!matches || !viewerId) return <CallStage><p className="m-auto text-white/70">Đang gọi...</p></CallStage>;

  const peerName = active.group ? `Nhóm · ${active.peerIds.length + 1} người` : nameOf(people, active.peerIds[0]);
  const seconds = active.startedAt ? Math.max(0, Math.floor((now - active.startedAt) / 1000)) : 0;
  const connected = active.phase === "connected";
  const index = Math.floor(seconds / 3.5);
  const visibleLines = connected ? [LINES[(index + LINES.length - 1) % LINES.length], LINES[index % LINES.length]] : [];
  const me = nameOf(people, viewerId);
  const camTone = front ? "from-nexoraTeal/50 to-nexoraBrand/60" : "from-nexoraWarning/40 to-nexoraDanger/40";
  const back = active.threadId ? paths.thread(active.threadId) : paths.inbox;
  const minimize = () => {
    setCallMinimized(true);
    navigate(back);
  };
  const hangUp = () => {
    const threadId = endCall(viewerId);
    navigate(threadId ? paths.thread(threadId) : paths.calls);
  };

  return (
    <CallStage>
      <div className="flex items-center justify-between px-4 pt-4">
        <span className={[
          "inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold",
        ].join(" ")}><Lock size={12} /> Mã hoá</span>
        <button type="button" onClick={minimize} className={[
          "flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-white/85",
          "hover:bg-white/10",
        ].join(" ")}>
          <Minimize2 size={16} /> Thu nhỏ
        </button>
      </div>
      {video ? (
        <div className={[
          "relative mx-4 mt-3 min-h-0 flex-1 overflow-hidden rounded-2xl bg-gradient-to-br",
          "from-nexoraElectric/60 via-nexoraViolet/50 to-nexoraSidebar",
        ].join(" ")}>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <Avatar name={peerName} className="mx-auto size-28 !text-[28px] ring-4 ring-white/30" />
              <p className="mt-3 text-lg font-bold">{peerName}</p>
              <p className="text-sm text-white/75">{connected ? duration(seconds) : "Đang gọi..."}</p>
            </div>
          </div>
          <div className={[
            "absolute bottom-3 right-3 grid h-40 w-28 place-items-center overflow-hidden rounded-xl",
            "border-2 border-white/40 bg-nexoraSidebarPanel lg:h-48 lg:w-36",
          ].join(" ")}>
            {camera ? (
              <div className={`grid h-full w-full place-items-center bg-gradient-to-br ${camTone}`}>
                <span className={[
                  "text-center text-xs font-semibold",
                ].join(" ")}>
                  Bạn<br /><span className="text-white/70">{front ? "Cam trước" : "Cam sau"}</span>
                </span>
              </div>
            ) : (
              <span className={[
                "text-center text-xs text-white/70",
              ].join(" ")}><CameraOff size={18} className="mx-auto mb-1" />Camera tắt</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 text-center">
          <span className="relative grid place-items-center">
            {!connected && <span className="absolute size-36 animate-ping rounded-full bg-white/10" />}
            <Avatar name={peerName} className="relative size-28 !text-[28px] ring-4 ring-white/20" />
          </span>
          <h2 className="mt-5 text-2xl font-bold">{peerName}</h2>
          <p className="mt-1 font-mono text-lg text-white/80">{connected ? duration(seconds) : "Đang gọi..."}</p>
        </div>
      )}
      {subtitles && (
        <div className="mx-4 mt-3 space-y-2 rounded-xl bg-black/30 p-3 text-sm" aria-live="polite">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white/60">
            Phụ đề AI · Việt ⇄ Anh
          </p>
          {visibleLines.length === 0 && (
            <p className="text-white/70">Phụ đề sẽ hiện khi cuộc gọi kết nối.</p>
          )}
          {visibleLines.map((line, i) => (
            <div key={`${index}-${i}`} className={i === 0 ? "opacity-60" : ""}>
              <p><b>{line.peer ? peerName : me}:</b> {line.vi}</p>
              <p className="text-white/75">🌐 {line.en}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap justify-center gap-3 px-4 pb-6 pt-5 lg:gap-5">
        <CallButton label={mic ? "Tắt mic" : "Bật mic"} active={!mic} onClick={() => setMic(!mic)}>
          {mic ? <Mic size={22} /> : <MicOff size={22} />}
        </CallButton>
        {video ? (
          <>
            <CallButton label="Camera" active={!camera} onClick={() => setCamera(!camera)}>
              {camera ? <Camera size={22} /> : <CameraOff size={22} />}
            </CallButton>
            <CallButton label="Đổi cam" onClick={() => setFront(!front)}><SwitchCamera size={22} /></CallButton>
          </>
        ) : (
          <CallButton label="Loa" active={speaker} onClick={() => setSpeaker(!speaker)}>
            {speaker ? <Volume2 size={22} /> : <VolumeX size={22} />}
          </CallButton>
        )}
        <CallButton
          label="Phụ đề AI"
          active={subtitles}
          onClick={() => setSubtitles(!subtitles)}><Captions size={22} /></CallButton>
        <CallButton label="Kết thúc" danger onClick={hangUp}><PhoneOff size={22} /></CallButton>
      </div>
      <p className={[
        "px-4 pb-4 text-center text-[11px] text-white/50",
      ].join(" ")}>
        AI dịch/phụ đề chỉ để hỗ trợ — không dùng cho mục đích pháp lý hay y tế.
      </p>
    </CallStage>
  );
}
