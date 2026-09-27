import { useNavigate } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { MoneyTag } from "../../components";
import { useStore } from "../../store";
import { selectClock } from "../../store/slices/m03";
import { money, shiftWhen } from "./format";
import { KindBadge, SHIFT_PATHS } from "./ShiftShared";

/**
 * Shift card for chat attachments (SPEC §8: L3 owns it, M05 imports it).
 * Reads only contract-1 fields plus display extras; opens S03-01 with `?shift=<id>` (contract 4).
 */
export function ShiftChatCard({ shiftId }: { shiftId: string }) {
  const navigate = useNavigate();
  const clock = useStore(selectClock);
  const shift = useStore((state) => state.shifts.find((item) => item.id === shiftId));
  const salon = useStore((state) => state.salons.find((item) => item.id === shift?.salonId));
  if (!shift) return <p className="text-sm text-nexoraMuted">Ca này không còn.</p>;
  return (
    <button
      type="button"
      onClick={() => navigate(`${SHIFT_PATHS.nearby}?shift=${shift.id}`)}
      className="block w-full max-w-xs rounded-xl border border-nexoraBorder bg-white p-3 text-left shadow-nexora-card
        hover:border-nexoraBrand"
    >
      <KindBadge kind={shift.kind} />
      <span className="mt-2 block text-sm font-bold text-nexoraText">{shift.title}</span>
      <span className="block text-xs text-nexoraMuted">{salon?.name}</span>
      <span className="mt-1 flex items-center gap-1 text-xs text-nexoraMuted">
        <CalendarClock size={13} /> {shiftWhen(shift, clock)}
      </span>
      <span className="mt-2 flex items-center justify-between text-sm">
        <MoneyTag>{money(shift.pay)}/thợ</MoneyTag>
        <span className="font-semibold text-nexoraBrand">Xem ca →</span>
      </span>
    </button>
  );
}
