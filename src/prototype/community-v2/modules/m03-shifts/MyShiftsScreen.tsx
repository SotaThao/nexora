import { useNavigate } from "react-router-dom";
import { Button, Card, MoneyTag } from "../../components";
import { useStore } from "../../store";
import { currentTechId, selectBoard } from "../../store/slices/m03";
import type { ScreenDefinition, Shift, ShiftApplication } from "../../store/types";
import { ApplicationCard } from "./ApplicationCard";
import { TechCancelModal } from "./CancelModals";
import { ClockControl } from "./ClockControl";
import { money } from "./format";
import { FINISHED, ms, reliabilityOf } from "./rules";
import { ReliabilityLine, RoleGate, SHIFT_PATHS, ShiftNav, ShiftPageHeader } from "./ShiftShared";

type Row = { app: ShiftApplication; shift: Shift };

/** Shared by S03-03 and the tech branch of S03-04 (cancel modal over the list). */
export function MyShiftsView({ title, cancelShiftId }: { title: string; cancelShiftId?: string }) {
  const navigate = useNavigate();
  const techId = useStore(currentTechId);
  const board = useStore(selectBoard);
  const shifts = useStore((state) => state.shifts);
  const apps = useStore((state) => state.shiftApplications);
  const person = useStore((state) => state.people.find((item) => item.id === techId));

  const rows: Row[] = apps
    .filter((item) => item.techId === techId)
    .map((app) => ({ app, shift: shifts.find((item) => item.id === app.shiftId) }))
    .filter((row): row is Row => Boolean(row.shift));
  const upcoming = rows.filter((row) => !FINISHED.includes(row.app.status))
    .sort((a, b) => ms(a.shift.startsAt) - ms(b.shift.startsAt));
  const finished = rows.filter((row) => FINISHED.includes(row.app.status))
    .sort((a, b) => ms(b.shift.startsAt) - ms(a.shift.startsAt));
  const nextLocked = upcoming.find((row) => row.app.status === "locked");
  const held = rows.filter((row) => ["pending", "locked", "working"].includes(row.app.status))
    .reduce((sum, row) => sum + row.app.deposit, 0);
  const reliability = reliabilityOf(person, board.reliability[techId]);
  const cancelRow = rows.find((row) => row.shift.id === cancelShiftId && !FINISHED.includes(row.app.status));

  const section = (label: string, items: Row[]) => (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-nexoraMuted">{label} · {items.length}</h2>
      <div className="grid gap-4 2xl:grid-cols-2">
        {items.map((row) => <ApplicationCard key={row.app.id} app={row.app} shift={row.shift} clock={board.clock} />)}
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      <ShiftPageHeader title={title} subtitle="Mọi trạng thái của lời mời & ứng tuyển · số tiền là số mẫu" />
      <ShiftNav />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="order-2 min-w-0 space-y-6 lg:order-1">
          {rows.length === 0 && (
            <Card className="p-8 text-center">
              <p className="font-bold">Bạn chưa nhận ca nào</p>
              <p className="mt-1 text-sm text-nexoraMuted">Bật “Sẵn sàng làm thêm” và chọn ca gần bạn.</p>
              <Button className="mt-4" variant="gradient" onClick={() => navigate(SHIFT_PATHS.nearby)}>
                Xem ca gần bạn
              </Button>
            </Card>
          )}
          {upcoming.length > 0 && section("Đang diễn ra & sắp tới", upcoming)}
          {finished.length > 0 && section("Đã kết thúc", finished)}
        </div>
        <aside className="order-1 space-y-4 lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <ClockControl
            target={nextLocked && { shift: nextLocked.shift, policy: nextLocked.app.policy ?? nextLocked.shift.policy }}
          />
          <Card className="p-4">
            <p className="text-sm font-bold">Độ tin cậy của bạn</p>
            <div className="mt-2"><ReliabilityLine value={reliability} /></div>
            <p className="mt-3 text-sm text-nexoraMuted">
              Cọc đang tạm giữ: <MoneyTag>{money(held)}</MoneyTag>
            </p>
          </Card>
        </aside>
      </div>
      <TechCancelModal app={cancelRow?.app} shift={cancelRow?.shift} onClose={() => navigate(SHIFT_PATHS.mine)} />
    </div>
  );
}

export function MyShiftsScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <RoleGate need="tech">
      <MyShiftsView title={screen.title} />
    </RoleGate>
  );
}
