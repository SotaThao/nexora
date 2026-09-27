import { Clock3 } from "lucide-react";
import { Card } from "../../components";
import { useStore } from "../../store";
import { DEMO_CLOCK } from "../../store/seed/m03";
import { selectClock, setClock } from "../../store/slices/m03";
import type { Shift, ShiftPolicy } from "../../store/types";
import { clockLabel, timeLabel, untilLabel } from "./format";
import { MINUTE, checkInWindow, ms, toLocalIso } from "./rules";

type Target = { shift: Shift; policy: ShiftPolicy } | undefined;

const chip =
  "min-h-11 rounded-lg border border-nexoraBorder bg-white px-2 text-xs font-semibold text-nexoraText " +
  "hover:border-nexoraBrand hover:text-nexoraBrand";

/** "Giờ giả lập" — lets presenters move the demo clock to open/close the check-in window. */
export function ClockControl({ target }: { target: Target }) {
  const clock = useStore(selectClock);
  const shiftBy = (minutes: number) => setClock(toLocalIso(ms(clock) + minutes * MINUTE));
  const slot = target ? checkInWindow(target.shift, target.policy) : undefined;
  const jump = (time: number) => setClock(toLocalIso(time));

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 bg-nexoraSidebar px-4 py-3 text-white">
        <Clock3 size={20} className="text-brandCyan" />
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-white/60">Giờ giả lập · demo</p>
          <p className="font-mono text-lg font-bold">{clockLabel(clock)}</p>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="grid grid-cols-4 gap-2">
          <button type="button" className={chip} onClick={() => shiftBy(-60)}>−1 giờ</button>
          <button type="button" className={chip} onClick={() => shiftBy(-15)}>−15′</button>
          <button type="button" className={chip} onClick={() => shiftBy(15)}>+15′</button>
          <button type="button" className={chip} onClick={() => shiftBy(60)}>+1 giờ</button>
        </div>
        {target && slot ? (
          <div className="rounded-lg bg-nexoraSurfaceMuted p-3">
            <p className="text-xs text-nexoraMuted">
              Ca đã chốt gần nhất: <b className="text-nexoraText">{target.shift.title}</b> ·{" "}
              {untilLabel(target.shift.startsAt, clock)}
            </p>
            <p className="mt-1 text-xs text-nexoraMuted">
              Cửa sổ check-in: <b className="text-nexoraText">{timeLabel(toLocalIso(slot.opensAt))}</b> –{" "}
              <b className="text-nexoraText">{timeLabel(toLocalIso(slot.closesAt))}</b>
            </p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <button type="button" className={chip} onClick={() => jump(slot.opensAt)}>1 giờ trước ca</button>
              <button type="button" className={chip} onClick={() => jump(ms(target.shift.startsAt))}>
                Đúng giờ ca
              </button>
              <button type="button" className={chip} onClick={() => jump(slot.closesAt - 5 * MINUTE)}>
                Trễ {target.policy.graceMinutes - 5}′
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-nexoraMuted">Không có ca đã chốt nào đang chờ check-in.</p>
        )}
        <button type="button" className={`${chip} w-full`} onClick={() => setClock(DEMO_CLOCK)}>
          Về giờ demo ban đầu ({clockLabel(DEMO_CLOCK)})
        </button>
        <p className="text-xs text-nexoraSubtle">
          Quá giờ cho trễ mà chưa check-in ⇒ hệ thống tự chuyển Vắng mặt (hoặc dùng Mô phỏng › Quá giờ check-in ca).
        </p>
      </div>
    </Card>
  );
}
