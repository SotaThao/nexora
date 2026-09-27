import { type ReactNode, useEffect, useState } from "react";
import { CalendarClock, ChevronLeft, ChevronRight, ImageIcon, MapPin } from "lucide-react";
import { MoneyTag, Sheet } from "../../components";
import { useStore } from "../../store";

export type Attachment =
  | { kind: "image"; label: string }
  | { kind: "shift"; shiftId: string; title: string }
  | { kind: "location"; salonId: string; name: string };

type Step = "menu" | "shift" | "location";

function Option({ icon, title, body, onClick }: { icon: ReactNode; title: string; body: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={[
        "flex min-h-16 w-full items-center gap-3 rounded-xl border border-nexoraBorder px-4 py-3",
        "text-left hover:bg-nexoraSurfaceMuted",
      ].join(" ")}>
      <span className={[
        "grid size-10 shrink-0 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand",
      ].join(" ")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-xs text-nexoraMuted">{body}</span>
      </span>
      <ChevronRight size={18} className="text-nexoraSubtle" />
    </button>
  );
}

type Props = { open: boolean; onClose: () => void; onPick: (a: Attachment) => void };

export function AttachSheet({ open, onClose, onPick }: Props) {
  const [step, setStep] = useState<Step>("menu");
  const shifts = useStore((s) => s.shifts).filter((shift) => shift.status === "open");
  const salons = useStore((s) => s.salons).filter((salon) => !salon.online);
  const salonName = (id: string) => salons.find((salon) => salon.id === id)?.name ?? "Tiệm";
  useEffect(() => {
    if (!open) setStep("menu");
  }, [open]);
  const pick = (a: Attachment) => {
    onPick(a);
    onClose();
  };
  const titles: Record<Step, string> = {
    menu: "Đính kèm",
    shift: "Chia sẻ ca làm thêm",
    location: "Gửi vị trí tiệm",
  };
  const title = titles[step];
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {step !== "menu" && (
        <button type="button" onClick={() => setStep("menu")} className={[
          "mb-3 flex min-h-11 items-center gap-1 text-sm font-semibold text-nexoraBrand",
        ].join(" ")}>
          <ChevronLeft size={16} /> Quay lại
        </button>
      )}
      {step === "menu" && (
        <div className="space-y-2">
          <Option icon={<ImageIcon size={19} />} title="Ảnh / video"
            body="Ảnh mẫu minh hoạ (không dùng ảnh thật)"
            onClick={() => pick({ kind: "image", label: "Ảnh mẫu tay" })} />
          <Option icon={<CalendarClock size={19} />} title="Chia sẻ ca làm thêm"
            body="Gửi card ca, người nhận bấm “Xem ca & nhận”"
            onClick={() => setStep("shift")} />
          <Option icon={<MapPin size={19} />} title="Vị trí tiệm"
            body="Gửi địa điểm tiệm kèm chỉ đường"
            onClick={() => setStep("location")} />
        </div>
      )}
      {step === "shift" && (
        <div className="space-y-2">
          {shifts.map((shift) => (
            <button key={shift.id} type="button"
              onClick={() => pick({ kind: "shift", shiftId: shift.id, title: shift.title })}
              className={[
                "flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border",
                "border-nexoraBorder px-4 py-3 text-left hover:bg-nexoraSurfaceMuted",
              ].join(" ")}>
              <span className="min-w-0">
                <span className="block font-semibold">{shift.title}</span>
                <span className="block text-xs text-nexoraMuted">{salonName(shift.salonId)}</span>
              </span>
              <MoneyTag>${shift.pay}</MoneyTag>
            </button>
          ))}
          {!shifts.length && <p className="text-sm text-nexoraMuted">Chưa có ca đang mở để chia sẻ.</p>}
        </div>
      )}
      {step === "location" && (
        <div className="space-y-2">
          {salons.map((salon) => (
            <button key={salon.id} type="button"
              onClick={() => pick({ kind: "location", salonId: salon.id, name: salon.name })}
              className={[
                "flex min-h-14 w-full items-center gap-3 rounded-xl border border-nexoraBorder px-4 py-3",
                "text-left hover:bg-nexoraSurfaceMuted",
              ].join(" ")}>
              <MapPin size={18} className="text-nexoraBrand" />
              <span>
                <span className="block font-semibold">{salon.name}</span>
                <span className="block text-xs text-nexoraMuted">{salon.specialty} · {salon.city}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
