import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { Badge, Card } from "../../components";
import { useStore } from "../../store";
import { selectClock } from "../../store/slices/m03";
import { shiftWhen } from "./format";
import { isPast, ms, seatedCount } from "./rules";
import { KIND_META, OWNER_SALON_ID, SHIFT_PATHS } from "./ShiftShared";

/** POS list of the salon's shifts ("Đang tuyển → Đủ thợ → Đã qua giờ → Tiệm huỷ"). */
export function PostedShiftsList({ activeId, compact = false }: { activeId?: string; compact?: boolean }) {
  const clock = useStore(selectClock);
  const shifts = useStore((state) => state.shifts);
  const apps = useStore((state) => state.shiftApplications);
  const mine = shifts
    .filter((item) => item.salonId === OWNER_SALON_ID)
    .sort((a, b) => ms(b.startsAt) - ms(a.startsAt));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-nexoraBorder px-4 py-3">
        <p className="text-sm font-bold">Ca đã đăng của tiệm</p>
        <span className="text-xs text-nexoraMuted">{mine.length} ca</span>
      </div>
      <ul className={`divide-y divide-nexoraRule ${compact ? "max-h-80 overflow-y-auto" : ""}`}>
        {mine.map((shift) => {
          const seated = seatedCount(shift.id, apps);
          const pending = apps.filter((item) => item.shiftId === shift.id && item.status === "pending").length;
          const state = shift.status === "cancelled"
            ? { label: "Tiệm huỷ", tone: "neutral" as const }
            : isPast(shift, clock)
              ? { label: "Đã qua giờ", tone: "neutral" as const }
              : shift.status === "full"
                ? { label: "Đủ thợ", tone: "success" as const }
                : { label: "Đang tuyển", tone: "brand" as const };
          return (
            <li key={shift.id}>
              <Link
                to={SHIFT_PATHS.detail(shift.id)}
                className={`flex min-h-16 items-center gap-3 px-4 py-3 hover:bg-nexoraSurfaceMuted ${
                  shift.id === activeId ? "bg-nexoraBrandSoft/60" : ""
                }`}
              >
                <span className={`h-10 w-1 shrink-0 rounded-full bg-gradient-to-b ${KIND_META[shift.kind].stripe}`} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-nexoraText">{shift.title}</span>
                  <span className="block text-xs text-nexoraMuted">
                    {shiftWhen(shift, clock)} · {seated}/{shift.staffNeeded} thợ
                    {pending > 0 && ` · ${pending} chờ duyệt`}
                  </span>
                </span>
                <Badge tone={state.tone}>{state.label}</Badge>
                <ChevronRight size={16} className="shrink-0 text-nexoraSubtle" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
