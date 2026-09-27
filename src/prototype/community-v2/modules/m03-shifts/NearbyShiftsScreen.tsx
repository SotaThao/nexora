import { useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MoonStar, Radar } from "lucide-react";
import { Button, Card, Toggle } from "../../components";
import { useCommunityGate } from "../m00-foundation/gates";
import { useStore } from "../../store";
import { currentTechId, selectBoard, setAvailability } from "../../store/slices/m03";
import type { ScreenDefinition, Shift, TechAvailability } from "../../store/types";
import { ApplyShiftModal } from "./ApplyShiftModal";
import { clockLabel } from "./format";
import { FINISHED, isPast, ms } from "./rules";
import { ShiftCard } from "./ShiftCard";
import { RoleGate, SHIFT_PATHS, ShiftNav, ShiftPageHeader } from "./ShiftShared";

const DAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const RADII: TechAvailability["radius"][] = [5, 10, 25];
const OFF: TechAvailability = { ready: false, days: [], radius: 10 };

type PanelProps = { value: TechAvailability; onChange: (patch: Partial<TechAvailability>) => void };

function AvailabilityPanel({ value, onChange }: PanelProps) {
  const toggleDay = (day: string) =>
    onChange({ days: value.days.includes(day) ? value.days.filter((item) => item !== day) : [...value.days, day] });
  return (
    <Card className="p-4 lg:sticky lg:top-24">
      <div className={`rounded-xl ${value.ready ? "bg-nexoraSuccess/10" : "bg-nexoraSurfaceMuted"}`}>
        <Toggle checked={value.ready} onChange={(ready) => onChange({ ready })} label="🟢 Sẵn sàng làm thêm" />
      </div>
      <p className="mt-2 text-xs text-nexoraMuted">
        {value.ready
          ? "Bạn đang hiện với tiệm gần đây trong “Thợ rảnh gần tiệm”."
          : "Đang tắt — bạn không thấy ca mới, tiệm cũng không thấy bạn."}
      </p>
      <fieldset className="mt-4" disabled={!value.ready}>
        <legend className="text-sm font-semibold">Ngày rảnh</legend>
        <div className="mt-2 grid grid-cols-7 gap-1">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              aria-pressed={value.days.includes(day)}
              onClick={() => toggleDay(day)}
              className={`min-h-11 rounded-lg text-xs font-semibold disabled:opacity-50 ${
                value.days.includes(day) ? "bg-nexoraBrand text-white" : "border border-nexoraBorder text-nexoraMuted"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="mt-4" disabled={!value.ready}>
        <legend className="text-sm font-semibold">Đi xa tối đa</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {RADII.map((radius) => (
            <button
              key={radius}
              type="button"
              aria-pressed={value.radius === radius}
              onClick={() => onChange({ radius })}
              className={`min-h-11 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                value.radius === radius ? "bg-nexoraBrand text-white" : "border border-nexoraBorder text-nexoraMuted"
              }`}
            >
              {radius} mi
            </button>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-xs text-nexoraSubtle">Bản mẫu lọc theo bán kính; ngày rảnh chỉ để hiển thị.</p>
    </Card>
  );
}

function OffState({ onTurnOn }: { onTurnOn: () => void }) {
  return (
    <Card className="p-8 text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-nexoraSurfaceMuted text-nexoraSubtle">
        <MoonStar size={26} />
      </span>
      <p className="mt-4 text-lg font-bold">Bạn đang tắt “Sẵn sàng làm thêm”</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-nexoraMuted">
        Khi tắt, bạn không thấy ca làm thêm gần mình và tiệm gần đây cũng không thấy bạn trong danh sách
        thợ rảnh. Bật lại để xem ca và nhận lời mời.
      </p>
      <Button className="mt-5" variant="gradient" onClick={onTurnOn}>🟢 Bật Sẵn sàng làm thêm</Button>
    </Card>
  );
}

/** Shared by S03-01 and S03-02 (the apply modal opens over the list). */
function NearbyShiftsView({ title, applyId }: { title: string; applyId?: string }) {
  const [params] = useSearchParams();
  const focusId = params.get("shift") ?? applyId ?? undefined;
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const role = useStore((state) => state.role);
  const techId = useStore(currentTechId);
  const board = useStore(selectBoard);
  const shifts = useStore((state) => state.shifts);
  const apps = useStore((state) => state.shiftApplications);
  const city = useStore((state) => state.people.find((item) => item.id === state.currentPersonId)?.city ?? "Houston");
  const guest = role === "guest";
  const availability = guest ? { ready: true, days: [], radius: 25 as const } : board.availability[techId] ?? OFF;
  const mineFor = (shift: Shift) => apps.find((item) => item.shiftId === shift.id && item.techId === techId);
  const focusRef = useRef<HTMLDivElement>(null);

  const { visible, farther } = useMemo(() => {
    const live = shifts
      .filter((item) => item.status !== "cancelled" && !isPast(item, board.clock))
      .filter((item) => {
        const mine = apps.find((app) => app.shiftId === item.id && app.techId === techId);
        return item.status === "open" || (mine && !FINISHED.includes(mine.status));
      })
      .sort((a, b) => ms(a.startsAt) - ms(b.startsAt));
    return {
      visible: live.filter((item) => item.distanceMi <= availability.radius),
      farther: live.filter((item) => item.distanceMi > availability.radius).length,
    };
  }, [shifts, apps, board.clock, availability.radius, techId]);

  const focused = shifts.find((item) => item.id === focusId);
  const list = focused ? [focused, ...visible.filter((item) => item.id !== focused.id)] : visible;
  const change = (patch: Partial<TechAvailability>) =>
    requireAccount("Sẵn sàng làm thêm", () => setAvailability(techId, patch));

  useEffect(() => {
    if (focused && !applyId) focusRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [focused, applyId]);

  const grid = (items: Shift[]) => (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {items.map((shift) => (
        <ShiftCard
          key={shift.id}
          ref={shift.id === focusId ? focusRef : undefined}
          shift={shift}
          clock={board.clock}
          mine={mineFor(shift)}
          highlight={shift.id === params.get("shift")}
          onTake={(item) => navigate(SHIFT_PATHS.apply(item.id))}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <ShiftPageHeader title={title} subtitle={`Ca gần ${city} · giờ giả lập ${clockLabel(board.clock)} · số mẫu`} />
      <ShiftNav />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div>
          {guest ? (
            <Card className="p-4">
              <p className="font-bold">🟢 Sẵn sàng làm thêm</p>
              <p className="mt-1 text-sm text-nexoraMuted">Tạo tài khoản miễn phí để bật và nhận ca gần bạn.</p>
              <Button className="mt-3 w-full" variant="gradient" onClick={() => change({ ready: true })}>
                Bật Sẵn sàng làm thêm
              </Button>
            </Card>
          ) : (
            <AvailabilityPanel value={availability} onChange={change} />
          )}
        </div>
        <div className="min-w-0 space-y-4">
          {availability.ready ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-nexoraMuted">
                <p className="inline-flex items-center gap-2">
                  <Radar size={16} className="text-nexoraBrand" />
                  <b className="text-nexoraText">{visible.length} ca</b> trong {availability.radius} mi
                </p>
                {farther > 0 && <p>{farther} ca xa hơn — tăng bán kính để xem</p>}
              </div>
              {list.length ? grid(list) : (
                <Card className="p-8 text-center text-sm text-nexoraMuted">
                  Chưa có ca trong {availability.radius} mi. Tăng bán kính hoặc quay lại sau.
                </Card>
              )}
            </>
          ) : (
            <>
              <OffState onTurnOn={() => change({ ready: true })} />
              {focused && grid([focused])}
            </>
          )}
        </div>
      </div>
      <ApplyShiftModal
        shift={shifts.find((item) => item.id === applyId)}
        onClose={() => navigate(`${SHIFT_PATHS.nearby}?shift=${applyId}`)}
      />
    </div>
  );
}

export function NearbyShiftsScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <RoleGate need="tech" allowGuest>
      <NearbyShiftsView title={screen.title} />
    </RoleGate>
  );
}

export function ApplyShiftScreen() {
  const { shiftId } = useParams();
  return (
    <RoleGate need="tech" allowGuest>
      <NearbyShiftsView title="Ca gần bạn" applyId={shiftId} />
    </RoleGate>
  );
}
