import { Link, useNavigate } from "react-router-dom";
import { CalendarClock, MapPin } from "lucide-react";
import { Button, Card, MoneyTag } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useStore } from "../../store";
import { checkIn } from "../../store/slices/m03";
import type { Shift, ShiftApplication, ShiftApplicationStatus } from "../../store/types";
import { dateLabel, money, shiftWhen, timeLabel } from "./format";
import { CHECKIN_OPENS_MINUTES, canCheckIn, checkInWindow, depositFor, toLocalIso } from "./rules";
import { APP_META, HoldPanel, KindBadge, SHIFT_PATHS, StatusBadge } from "./ShiftShared";

const MAIN: ShiftApplicationStatus[] = ["invited", "pending", "locked", "working", "completed"];
const BAD: ShiftApplicationStatus[] = ["absent", "techCancelled", "salonCancelled", "rejected"];

type Step = { status: ShiftApplicationStatus; state: "done" | "current" | "todo" | "bad"; at?: string };

function steps(app: ShiftApplication, shift: Shift): Step[] {
  const reached = new Map(app.history.map((entry) => [entry.status, entry.at]));
  const path = MAIN.filter((status) => {
    if (status === "invited") return reached.has("invited");
    if (status === "pending") return reached.has("pending") || (shift.mode === "approval" && !BAD.includes(app.status));
    return true;
  });
  if (BAD.includes(app.status)) {
    const done = path.filter((status) => reached.has(status));
    return [
      ...done.map((status) => ({ status, state: "done" as const, at: reached.get(status) })),
      { status: app.status, state: "bad", at: reached.get(app.status) },
    ];
  }
  const index = path.indexOf(app.status);
  return path.map((status, position) => ({
    status,
    at: reached.get(status),
    state: position < index ? "done" : position === index ? (status === "completed" ? "done" : "current") : "todo",
  }));
}

function Timeline({ app, shift }: { app: ShiftApplication; shift: Shift }) {
  const dot = {
    done: "bg-nexoraSuccess",
    current: "bg-nexoraBrand ring-4 ring-nexoraBrandSoft",
    todo: "bg-nexoraBorder",
    bad: "bg-nexoraDanger",
  };
  return (
    <ol className="relative space-y-3 border-l-2 border-nexoraRule pl-5">
      {steps(app, shift).map((step) => (
        <li key={step.status} className="relative">
          <span className={`absolute -left-[27px] top-1 size-3 rounded-full ${dot[step.state]}`} />
          <p className={`text-sm ${step.state === "todo" ? "text-nexoraSubtle" : "font-semibold text-nexoraText"}`}>
            {APP_META[step.status].long}
          </p>
          {step.at && <p className="text-xs text-nexoraSubtle">{dateLabel(step.at)} · {timeLabel(step.at)}</p>}
        </li>
      ))}
    </ol>
  );
}

export function ApplicationCard({ app, shift, clock }: { app: ShiftApplication; shift: Shift; clock: string }) {
  const salon = useStore((state) => state.salons.find((item) => item.id === shift.salonId));
  const navigate = useNavigate();
  const toast = useShiftToast();
  const policy = app.policy ?? shift.policy;
  const open = canCheckIn(shift, policy, clock);
  const slot = checkInWindow(shift, policy);
  const held = ["pending", "locked", "working"].includes(app.status);

  const doCheckIn = () => {
    if (checkIn(app.id)) toast("📍 Check-in thành công — vị trí khớp với tiệm", "success");
  };

  return (
    <Card className="flex flex-col p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={app.status} />
        <KindBadge kind={shift.kind} />
      </div>
      <Link
        to={`${SHIFT_PATHS.nearby}?shift=${shift.id}`}
        className="mt-2 block font-bold text-nexoraText hover:text-nexoraBrand"
      >
        {shift.title}
      </Link>
      <p className="mt-1 flex items-center gap-1 text-sm text-nexoraMuted">
        <MapPin size={14} className="shrink-0" /> <span className="truncate">{salon?.name} · {salon?.city}</span>
      </p>
      <p className="mt-1 flex items-center gap-1 text-sm text-nexoraMuted">
        <CalendarClock size={14} className="shrink-0" /> {shiftWhen(shift, clock)} ·{" "}
        <MoneyTag>{money(shift.pay)}</MoneyTag>
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Timeline app={app} shift={shift} />
        <div className="space-y-3">
          {held && (
            <HoldPanel title={`Cọc ${money(app.deposit)} đang tạm giữ`}>
              Chính sách v{policy.version} đã ghi vào ca: huỷ miễn phí trước {policy.freeCancelHours}h · vắng mặt
              mất {policy.noShowLossPct}% cọc.
            </HoldPanel>
          )}
          {app.note && (
            <p className={`rounded-lg p-3 text-sm ${app.status === "absent" ? "bg-nexoraDanger/10 text-nexoraDanger"
              : "bg-nexoraSurfaceMuted text-nexoraMuted"}`}>
              {app.status === "absent" ? "❌ " : ""}{app.note}
            </p>
          )}
          {app.status === "invited" && (
            <p className="rounded-lg bg-nexoraBrandSoft p-3 text-sm text-nexoraText">
              Tiệm mời bạn vào ca. Nhận lời mời cần đặt cọc {money(depositFor(shift.pay, shift.policy))}.
            </p>
          )}
          {app.status === "working" && (
            <p className="rounded-lg bg-nexoraSuccess/10 p-3 text-sm text-nexoraText">
              Đang làm — chờ tiệm bấm “Xong ca · trả tiền” để nhận tiền công & hoàn cọc.
            </p>
          )}
        </div>
      </div>

      {["invited", "pending", "locked"].includes(app.status) && (
      <div className="mt-4 flex flex-col gap-2 border-t border-nexoraRule pt-4 sm:flex-row sm:flex-wrap">
        {app.status === "invited" && (
          <>
            <Button variant="gradient" onClick={() => navigate(SHIFT_PATHS.apply(shift.id))}>
              📩 Nhận lời mời & chốt
            </Button>
            <Button variant="secondary" onClick={() => navigate(SHIFT_PATHS.cancel(shift.id))}>Từ chối lời mời</Button>
          </>
        )}
        {app.status === "pending" && (
          <Button variant="secondary" onClick={() => navigate(SHIFT_PATHS.cancel(shift.id))}>Huỷ ứng tuyển</Button>
        )}
        {app.status === "locked" && (
          <div className="w-full space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="gradient" className="sm:flex-1" disabled={!open} onClick={doCheckIn}>
                📍 Check-in tại tiệm
              </Button>
              <Button variant="secondary" onClick={() => navigate(SHIFT_PATHS.cancel(shift.id))}>Huỷ ca</Button>
            </div>
            {!open && (
              <p className="text-xs text-nexoraMuted">
                Check-in mở {CHECKIN_OPENS_MINUTES / 60} giờ trước ca · trễ tối đa {policy.graceMinutes} phút
                {" "}(mở {timeLabel(toLocalIso(slot.opensAt))} – {timeLabel(toLocalIso(slot.closesAt))})
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </Card>
  );
}
