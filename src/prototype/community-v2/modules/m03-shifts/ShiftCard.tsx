import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, MapPin, ShieldCheck, Users } from "lucide-react";
import { Badge, Button, Card, MoneyTag } from "../../components";
import { useStore } from "../../store";
import type { Shift, ShiftApplication } from "../../store/types";
import { money, shiftWhen } from "./format";
import { FINISHED, isPast, seatedCount } from "./rules";
import { APP_META, KIND_META, KindBadge, SHIFT_PATHS, StatusBadge, TECH_MODE_LABEL } from "./ShiftShared";

type Props = {
  shift: Shift;
  clock: string;
  mine?: ShiftApplication;
  highlight?: boolean;
  onTake: (shift: Shift) => void;
};

export const ShiftCard = forwardRef<HTMLDivElement, Props>(function ShiftCard(props, ref) {
  const { shift, clock, mine, highlight = false, onTake } = props;
  const salon = useStore((state) => state.salons.find((item) => item.id === shift.salonId));
  const seated = useStore((state) => seatedCount(shift.id, state.shiftApplications));
  const left = Math.max(0, shift.staffNeeded - seated);
  const past = isPast(shift, clock);
  const closed = shift.status === "cancelled" || past || left === 0;
  const invited = mine?.status === "invited";
  const navigate = useNavigate();

  let action = (
    <Button className="w-full" variant="gradient" onClick={() => onTake(shift)}>
      {shift.mode === "instant" ? "⚡ Nhận ca & chốt" : "🙋 Ứng tuyển"}
    </Button>
  );
  if (invited && !closed) {
    action = (
      <Button className="w-full" variant="gradient" onClick={() => onTake(shift)}>
        📩 Nhận lời mời & chốt
      </Button>
    );
  } else if (mine && FINISHED.includes(mine.status)) {
    action = <Button className="w-full" variant="secondary" disabled>{APP_META[mine.status].long}</Button>;
  } else if (mine && !invited) {
    action = (
      <Button className="w-full" variant="secondary" onClick={() => navigate(SHIFT_PATHS.mine)}>
        Xem trong “Ca của tôi”
      </Button>
    );
  } else if (closed) {
    const reason = shift.status === "cancelled" ? "Tiệm đã huỷ ca" : past ? "Ca đã qua giờ" : "Đã đủ thợ";
    action = <Button className="w-full" variant="secondary" disabled>{reason}</Button>;
  }

  return (
    <div ref={ref} className="scroll-mt-40">
      <Card
        className={`flex h-full flex-col overflow-hidden transition ${
          highlight ? "ring-2 ring-nexoraBrand ring-offset-2 ring-offset-nexoraCanvas" : ""
        }`}
      >
        <div className={`h-1.5 bg-gradient-to-r ${KIND_META[shift.kind].stripe}`} />
        <div className="flex flex-1 flex-col p-4">
          <div className="flex flex-wrap items-center gap-2">
            <KindBadge kind={shift.kind} />
            <Badge tone="neutral">{TECH_MODE_LABEL[shift.mode]}</Badge>
            {mine && <StatusBadge status={mine.status} />}
            {highlight && <Badge tone="brand">📌 Ca bạn đang mở</Badge>}
          </div>
          <h3 className="mt-3 text-base font-bold leading-snug text-nexoraText">{shift.title}</h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-nexoraMuted">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{salon?.name} · {salon?.city} · {shift.distanceMi} mi</span>
          </p>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex items-center gap-2 text-nexoraText">
              <CalendarClock size={15} className="shrink-0 text-nexoraBrand" />
              <dt className="sr-only">Thời gian</dt>
              <dd className="font-semibold">{shiftWhen(shift, clock)}</dd>
            </div>
            <div className="flex items-center gap-2 text-nexoraMuted">
              <Users size={15} className="shrink-0 text-nexoraBrand" />
              <dt className="sr-only">Số thợ</dt>
              <dd>Cần {shift.staffNeeded} thợ · <b className="text-nexoraText">còn {left} chỗ</b></dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shift.services.map((service) => (
              <span key={service} className="rounded-md bg-nexoraSurfaceMuted px-2 py-1 text-xs text-nexoraMuted">
                {service}
              </span>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-nexoraRule pt-3">
            <p className="text-lg">
              <MoneyTag>{money(shift.pay)}/thợ</MoneyTag>
            </p>
            {shift.tips > 0 && <p className="text-xs text-nexoraMuted">+ tips ~{money(shift.tips)}</p>}
          </div>
          <p className="mt-2 flex items-center gap-1.5 rounded-lg bg-nexoraSuccess/10 px-2.5 py-2 text-xs font-semibold
            text-nexoraText">
            <ShieldCheck size={15} className="shrink-0 text-nexoraSuccess" />
            Tiệm đã bảo đảm tiền công
          </p>
          <div className="mt-auto pt-4">{action}</div>
        </div>
      </Card>
    </div>
  );
});
