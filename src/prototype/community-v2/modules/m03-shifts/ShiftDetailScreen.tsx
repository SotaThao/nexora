import { useNavigate, useParams } from "react-router-dom";
import { CalendarClock, MessageCircle, UserPlus, Users, X } from "lucide-react";
import { Avatar, Badge, Button, Card, MoneyTag } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useStore } from "../../store";
import { completeShift, lockCandidate, rejectCandidate, selectBoard } from "../../store/slices/m03";
import type { ScreenDefinition, Shift, ShiftApplication } from "../../store/types";
import { SalonCancelModal } from "./CancelModals";
import { money, shiftWhen } from "./format";
import { isPast, reliabilityOf, seatedCount } from "./rules";
import { HoldPanel, KindBadge, MODE_LABEL, OWNER_SALON_ID, ReliabilityLine, RoleGate, SHIFT_PATHS, ShiftNav,
  ShiftPageHeader, StatusBadge } from "./ShiftShared";
import { PostedShiftsList } from "./PostedShiftsList";

function CandidateRow({ app, shift }: { app: ShiftApplication; shift: Shift }) {
  const person = useStore((state) => state.people.find((item) => item.id === app.techId));
  const delta = useStore((state) => selectBoard(state).reliability[app.techId]);
  const toast = useShiftToast();
  const navigate = useNavigate();
  const name = person?.name ?? app.techId;
  const hours = shift.policy.freeCancelHours;

  const lock = () => {
    if (!lockCandidate(app.id)) return toast("Ca đã đủ thợ — không chốt thêm được", "danger");
    toast(`🔒 Đã chốt ${name} — cả 2 bên không huỷ miễn phí trong ${hours}h trước ca`, "success");
  };
  const reject = () => {
    rejectCandidate(app.id);
    toast(`Đã từ chối ${name} — hoàn 100% cọc ${money(app.deposit)}`, "info");
  };
  const done = () => {
    completeShift(app.id);
    toast(`✓ Đã trả ${money(shift.pay)} cho ${name} & hoàn cọc`, "success");
  };

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-nexoraText">
            {name} <StatusBadge status={app.status} />
          </p>
          <p className="truncate text-xs text-nexoraMuted">
            {person?.skills?.join(" · ")} · {person?.experienceYears ?? 0} năm · {person?.city}
          </p>
          <div className="mt-1"><ReliabilityLine value={reliabilityOf(person, delta)} /></div>
          {app.note && <p className="mt-1 text-xs text-nexoraMuted">{app.note}</p>}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {app.deposit > 0 && ["pending", "locked", "working"].includes(app.status) && (
          <span className="text-xs text-nexoraMuted">Cọc <MoneyTag>{money(app.deposit)}</MoneyTag></span>
        )}
        {app.status === "pending" && (
          <>
            <Button variant="gradient" onClick={lock}>Chốt</Button>
            <Button variant="secondary" aria-label={`Từ chối ${name}`} onClick={reject}><X size={16} /></Button>
          </>
        )}
        {["locked", "working"].includes(app.status) && (
          <>
            <Button variant="secondary" aria-label={`Nhắn ${name}`}
              onClick={() => navigate(`/community-v2/messages/new?to=${app.techId}`)}>
              <MessageCircle size={16} />
            </Button>
            <Button variant="gradient" onClick={done}>Xong ca · trả tiền</Button>
          </>
        )}
      </div>
    </li>
  );
}

type GroupProps = { title: string; apps: ShiftApplication[]; shift: Shift; empty?: string };

function Group({ title, apps, shift, empty }: GroupProps) {
  if (!apps.length && !empty) return null;
  return (
    <Card className="p-4">
      <p className="text-sm font-bold">{title} <span className="font-normal text-nexoraMuted">· {apps.length}</span></p>
      {apps.length ? (
        <ul className="divide-y divide-nexoraRule">
          {apps.map((app) => <CandidateRow key={app.id} app={app} shift={shift} />)}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-nexoraMuted">{empty}</p>
      )}
    </Card>
  );
}

export function ShiftDetailView({ title, shiftId, cancelOpen = false }: {
  title: string;
  shiftId?: string;
  cancelOpen?: boolean;
}) {
  const navigate = useNavigate();
  const board = useStore(selectBoard);
  const shift = useStore((state) =>
    state.shifts.find((item) => item.id === shiftId && item.salonId === OWNER_SALON_ID));
  const apps = useStore((state) => state.shiftApplications);
  if (!shift) {
    return (
      <div className="space-y-5">
        <ShiftPageHeader pos title={title} />
        <ShiftNav pos />
        <Card className="p-6 text-sm text-nexoraMuted">Không tìm thấy ca này của tiệm. Chọn một ca bên dưới.</Card>
        <PostedShiftsList />
      </div>
    );
  }
  const mine = apps.filter((item) => item.shiftId === shift.id);
  const by = (...statuses: string[]) => mine.filter((item) => statuses.includes(item.status));
  const seated = seatedCount(shift.id, apps);
  const lockedNow = by("locked", "working").length;
  const past = isPast(shift, board.clock);
  const canCancel = !past && shift.status !== "cancelled" && lockedNow >= 1;

  return (
    <div className="space-y-5">
      <ShiftPageHeader pos title={title} subtitle="Duyệt ứng viên, xác nhận xong ca và trả tiền công" />
      <ShiftNav pos detailPath={SHIFT_PATHS.detail(shift.id)} />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="order-2 lg:order-1"><PostedShiftsList activeId={shift.id} /></div>
        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <KindBadge kind={shift.kind} />
              <Badge tone="neutral">{MODE_LABEL[shift.mode]}</Badge>
              {shift.status === "cancelled" && <Badge tone="danger">Tiệm đã huỷ</Badge>}
              {past && shift.status !== "cancelled" && <Badge tone="neutral">Đã qua giờ</Badge>}
            </div>
            <h2 className="mt-3 text-xl font-bold">{shift.title}</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-nexoraMuted">
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={15} />{shiftWhen(shift, board.clock)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Users size={15} />{seated}/{shift.staffNeeded} thợ đã chốt
              </span>
              <span><MoneyTag>{money(shift.pay)}/thợ</MoneyTag></span>
            </div>
            <p className="mt-2 text-xs text-nexoraSubtle">{shift.services.join(" · ")}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
              <HoldPanel title={`Tiền công bảo đảm đang giữ ${money(shift.guarantee)}`}>
                = {money(shift.pay)} × {shift.staffNeeded} thợ · chính sách v{shift.policy.version} ghi vào ca.
              </HoldPanel>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" onClick={() => navigate(SHIFT_PATHS.available)}>
                  <UserPlus size={16} className="mr-1 inline" />Mời thợ rảnh
                </Button>
                {canCancel && (
                  <Button variant="danger" onClick={() => navigate(SHIFT_PATHS.cancel(shift.id))}>Huỷ ca</Button>
                )}
              </div>
            </div>
            {!canCancel && shift.status !== "cancelled" && (
              <p className="mt-3 text-xs text-nexoraSubtle">
                Chỉ huỷ được khi ca chưa qua giờ và có ≥ 1 thợ đã chốt (doc 03).
              </p>
            )}
          </Card>
          <Group title="Ứng viên chờ duyệt" apps={by("pending")} shift={shift}
            empty={shift.mode === "approval" ? "Chưa có ứng viên mới." : undefined} />
          <Group title="Thợ đã chốt" apps={by("locked", "working")} shift={shift} empty="Chưa có thợ chốt ca này." />
          <Group title="Đã mời · chờ thợ nhận" apps={by("invited")} shift={shift} />
          <Group title="Lịch sử" apps={by("completed", "absent", "techCancelled", "salonCancelled", "rejected")}
            shift={shift} />
        </div>
      </div>
      {cancelOpen && canCancel && (
        <SalonCancelModal shift={shift} onClose={() => navigate(SHIFT_PATHS.detail(shift.id))} />
      )}
    </div>
  );
}

export function ShiftDetailScreen({ screen }: { screen: ScreenDefinition }) {
  const { shiftId } = useParams();
  return (
    <RoleGate need="owner">
      <ShiftDetailView title={screen.title} shiftId={shiftId} />
    </RoleGate>
  );
}
