import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Phone, PhoneMissed, Play, Video } from "lucide-react";
import { MoneyTag, PlaceholderImage } from "../../components";
import { useToast } from "./toast";
import { SCREENS } from "../../routes";
import { useStore } from "../../store";
import type { Message } from "../../store/types";
import { duration } from "./lib";

export function shiftPath(shiftId: string) {
  const base = SCREENS.find((s) => s.id === "S03-01")?.path ?? "/community-v2/shifts";
  return `${base}?shift=${shiftId}`;
}

function when(iso: string) {
  const date = new Date(iso);
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  const time = `${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
  return `${days[date.getDay()]} ${date.getDate()}/${date.getMonth() + 1} · ${time}`;
}

/** Contract 1 (read-only Shift fields) + contract 4 ("Xem ca & nhận" → S03-01?shift=<id>). */
export function ShiftCard({ shiftId }: { shiftId: string }) {
  const shift = useStore((s) => s.shifts.find((item) => item.id === shiftId));
  const salon = useStore((s) => s.salons.find((item) => item.id === shift?.salonId));
  if (!shift) return <p className="text-sm text-nexoraSubtle">Ca làm thêm không còn khả dụng.</p>;
  return (
    <div className="w-64 max-w-full overflow-hidden rounded-xl border border-nexoraBorder bg-white text-nexoraText">
      <div className="flex items-center gap-2 bg-nexoraBrandSoft px-3 py-2 text-xs font-bold text-nexoraBrand">
        <CalendarClock size={14} /> Ca làm thêm
      </div>
      <div className="space-y-1 p-3">
        <p className="font-bold leading-snug">{shift.title}</p>
        <p className="text-xs text-nexoraMuted">{salon?.name ?? "Tiệm"} · {salon?.city}</p>
        <p className="text-xs text-nexoraMuted">{when(shift.startsAt)}</p>
        <p className="text-sm">
          Trả công <MoneyTag>${shift.pay}</MoneyTag>
        </p>
        <Link
          to={shiftPath(shift.id)}
          className={[
            "mt-2 flex min-h-11 items-center justify-center rounded-flox-buttons bg-nexoraBrand text-sm",
            "font-semibold text-white hover:bg-nexoraBrandDark",
          ].join(" ")}
        >
          Xem ca & nhận
        </Link>
      </div>
    </div>
  );
}

export function LocationCard({ salonId }: { salonId: string }) {
  const salon = useStore((s) => s.salons.find((item) => item.id === salonId));
  const toast = useToast();
  return (
    <div className="w-64 max-w-full overflow-hidden rounded-xl border border-nexoraBorder bg-white text-nexoraText">
      <svg viewBox="0 0 256 110" className="block h-24 w-full bg-nexoraSurfaceMuted" aria-hidden="true">
        <path
          d="M0 70 L256 40 M40 0 L90 110 M150 0 L180 110 M0 20 L256 95"
          className="stroke-nexoraBorder"
          strokeWidth="8"
        />
        <path d="M0 70 L256 40" className="stroke-white" strokeWidth="3" />
        <circle cx="128" cy="52" r="16" className="fill-nexoraBrand/20" />
        <circle cx="128" cy="52" r="6" className="fill-nexoraBrand" />
      </svg>
      <div className="p-3">
        <p className={[
          "flex items-center gap-1.5 font-bold",
        ].join(" ")}><MapPin size={15} className="text-nexoraBrand" />{salon?.name ?? "Tiệm"}</p>
        <p className="text-xs text-nexoraMuted">{salon?.specialty} · {salon?.city}</p>
        <button
          type="button"
          onClick={() => toast("Đã mở chỉ đường tới tiệm (mô phỏng)")}
          className={[
            "mt-2 min-h-11 w-full rounded-flox-buttons border border-nexoraBorder text-sm font-semibold",
            "hover:bg-nexoraSurfaceMuted",
          ].join(" ")}
        >
          Chỉ đường
        </button>
      </div>
    </div>
  );
}

const BARS = [6, 12, 18, 10, 22, 14, 8, 16, 20, 9, 13, 19, 7, 15, 11, 17, 6, 12];

export function VoiceBody({ message, own }: { message: Message; own: boolean }) {
  const playTone = own ? "bg-white/20" : "bg-nexoraBrand text-white";
  return (
    <div className="flex min-w-48 items-center gap-2">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${playTone}`}>
        <Play size={14} fill="currentColor" />
      </span>
      <span className="flex h-6 flex-1 items-center gap-[2px]" aria-hidden="true">
        {BARS.map((h, i) => (
          <span
            key={i}
            className={`w-[3px] rounded-full ${own ? "bg-white/70" : "bg-nexoraBrand/60"}`}
            style={{ height: h }}
          />
        ))}
      </span>
      <span className="text-xs tabular-nums">{duration(message.voiceSeconds ?? 5)}</span>
    </div>
  );
}

export function CallBubble({ message, onCallBack }: { message: Message; onCallBack: () => void }) {
  const info = message.call;
  if (!info) return null;
  const missed = info.outcome === "missed" || info.outcome === "declined";
  const frame = missed ? "border-nexoraDanger/40" : "border-nexoraBorder";
  const badge = missed ? "bg-nexoraDanger/10 text-nexoraDanger" : "bg-nexoraBrandSoft text-nexoraBrand";
  const Icon = missed ? PhoneMissed : info.type === "video" ? Video : Phone;
  const label = missed
    ? `Cuộc gọi ${info.type === "video" ? "video" : "thoại"} nhỡ`
    : info.outcome === "no-answer"
      ? "Cuộc gọi · không trả lời"
      : `Cuộc gọi ${info.type === "video" ? "video" : "thoại"} · ${duration(info.seconds ?? 0)}`;
  return (
    <div className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2 ${frame}`}>
      <span className={`grid size-9 place-items-center rounded-full ${badge}`}>
        <Icon size={16} />
      </span>
      <span className={`text-sm font-semibold ${missed ? "text-nexoraDanger" : "text-nexoraText"}`}>{label}</span>
      <button type="button" onClick={onCallBack} className={[
        "ml-2 min-h-11 rounded-lg px-3 text-sm font-semibold text-nexoraBrand",
        "hover:bg-nexoraBrandSoft",
      ].join(" ")}>
        Gọi lại
      </button>
    </div>
  );
}

export function ImageBody({ label }: { label?: string }) {
  return (
    <div className="w-56 max-w-full">
      <PlaceholderImage label={label ?? "Ảnh"} />
    </div>
  );
}
