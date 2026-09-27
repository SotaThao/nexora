import { subscribeSimulation } from "../../events";
import { ACTIVE, MINUTE, canCheckIn, depositFor, ms, quoteSalonCancel, quoteTechCancel, seatedCount, toLocalIso }
  from "../../modules/m03-shifts/rules";
import { shiftBoard as seedBoard } from "../seed/m03";
import { getState, storeActions } from "../index";
import type { DemoState, ReliabilityDelta, Shift, ShiftApplication, ShiftApplicationStatus, ShiftBoard, ShiftKind,
  ShiftMode, ShiftPolicy, StaffShare, TechAvailability } from "../types";

/** Stable reference so `useStore(selectBoard)` never sees a fresh object for the same state. */
export const selectBoard = (state: DemoState): ShiftBoard => state.shiftBoard ?? seedBoard;
export const selectClock = (state: DemoState) => selectBoard(state).clock;
export const currentTechId = (state: DemoState) => state.currentPersonId ?? "jessica";

type Notice = { text: string; tone: "success" | "danger" | "info" };
const noticeListeners = new Set<(notice: Notice) => void>();
let pendingNotices: Notice[] = [];

/** M03 screens show slice notices (e.g. auto no-show) as toasts; queued until a screen mounts. */
export function subscribeShiftNotices(listener: (notice: Notice) => void) {
  noticeListeners.add(listener);
  pendingNotices.forEach(listener);
  pendingNotices = [];
  return () => {
    noticeListeners.delete(listener);
  };
}

function emit(notice: Notice) {
  if (noticeListeners.size === 0) pendingNotices.push(notice);
  noticeListeners.forEach((listener) => listener(notice));
}

function write(mutator: (state: DemoState, board: ShiftBoard) => Partial<DemoState>) {
  storeActions.update((state) => ({ ...state, ...mutator(state, selectBoard(state)) }));
}

type AppPatch = Partial<ShiftApplication>;
const move = (app: ShiftApplication, status: ShiftApplicationStatus, at: string, patch: AppPatch = {}) =>
  ({ ...app, ...patch, status, history: [...app.history, { status, at }] });

function bump(board: ShiftBoard, techId: string, key: keyof ReliabilityDelta): ShiftBoard {
  const current = board.reliability[techId] ?? { completed: 0, absent: 0, lateCancel: 0 };
  return { ...board, reliability: { ...board.reliability, [techId]: { ...current, [key]: current[key] + 1 } } };
}

/** Recomputes open/full after seats change. */
function refreshShifts(shifts: Shift[], apps: ShiftApplication[]) {
  return shifts.map((item) => {
    if (item.status === "cancelled") return item;
    return { ...item, status: seatedCount(item.id, apps) >= item.staffNeeded ? "full" : "open" } as Shift;
  });
}

/** Doc 03 · Luồng 3 bước 2 — auto no-show once the grace period has passed; stale pending → refund. */
function processClock(state: DemoState, board: ShiftBoard): Partial<DemoState> {
  const now = ms(board.clock);
  let nextBoard = board;
  const me = currentTechId(state);
  const apps = state.shiftApplications.map((item) => {
    const shift = state.shifts.find((entry) => entry.id === item.shiftId);
    if (!shift || shift.status === "cancelled") return item;
    const policy = item.policy ?? shift.policy;
    const start = ms(shift.startsAt);
    if (item.status === "locked" && now > start + policy.graceMinutes * MINUTE) {
      const lost = Math.round((item.deposit * policy.noShowLossPct) / 100);
      nextBoard = bump(nextBoard, item.techId, "absent");
      if (item.techId === me) {
        const text = `❌ Không check-in quá ${policy.graceMinutes} phút → vắng mặt, cọc chuyển cho tiệm`;
        emit({ text, tone: "danger" });
      }
      return move(item, "absent", board.clock, { note: `Mất $${lost} cọc → chuyển cho tiệm` });
    }
    if (item.status === "pending" && now > start) {
      const note = `Ca qua giờ chưa được chọn — hoàn 100% cọc $${item.deposit}`;
      return move(item, "rejected", board.clock, { note });
    }
    return item;
  });
  return { shiftApplications: apps, shiftBoard: nextBoard };
}

export function setClock(iso: string) {
  write((state, board) => processClock(state, { ...board, clock: iso }));
}

export function setAvailability(techId: string, patch: Partial<TechAvailability>) {
  write((_, board) => {
    const current = board.availability[techId] ?? { ready: false, days: [], radius: 10 };
    return { shiftBoard: { ...board, availability: { ...board.availability, [techId]: { ...current, ...patch } } } };
  });
}

export type ApplyResult = "locked" | "pending" | "full" | "exists";

/** S03-02 — deposit held, policy snapshotted onto the application. */
export function applyToShift(shiftId: string, techId: string): ApplyResult {
  const state = getState();
  const shift = state.shifts.find((item) => item.id === shiftId);
  if (!shift) return "exists";
  const existing = state.shiftApplications.find((item) => item.shiftId === shiftId && item.techId === techId);
  if (existing && existing.status !== "invited") return "exists";
  if (shift.mode === "instant" && seatedCount(shiftId, state.shiftApplications) >= shift.staffNeeded) return "full";
  const status: ShiftApplicationStatus = shift.mode === "instant" ? "locked" : "pending";
  write((current, board) => {
    const policy = { ...current.shiftPolicy };
    const patch = { deposit: depositFor(shift.pay, policy), policy, agreedAt: board.clock };
    const apps = existing
      ? current.shiftApplications.map((item) =>
        (item.id === existing.id ? move(item, status, board.clock, patch) : item))
      : [...current.shiftApplications, move(
        { id: `app-${Date.now()}`, shiftId, techId, status, deposit: 0, history: [] }, status, board.clock, patch)];
    return { shiftApplications: apps, shifts: refreshShifts(current.shifts, apps) };
  });
  return status;
}

function updateApp(appId: string, next: (app: ShiftApplication, state: DemoState, board: ShiftBoard) =>
  { app: ShiftApplication; board?: ShiftBoard }) {
  write((state, board) => {
    let nextBoard = board;
    const apps = state.shiftApplications.map((item) => {
      if (item.id !== appId) return item;
      const result = next(item, state, board);
      nextBoard = result.board ?? board;
      return result.app;
    });
    return { shiftApplications: apps, shifts: refreshShifts(state.shifts, apps), shiftBoard: nextBoard };
  });
}

/** S03-06 — owner locks a pending candidate. Returns false when the shift is already full. */
export function lockCandidate(appId: string) {
  const state = getState();
  const app = state.shiftApplications.find((item) => item.id === appId);
  const shift = state.shifts.find((item) => item.id === app?.shiftId);
  if (!app || !shift || seatedCount(shift.id, state.shiftApplications) >= shift.staffNeeded) return false;
  updateApp(appId, (item, _, board) => ({ app: move(item, "locked", board.clock) }));
  return true;
}

export function rejectCandidate(appId: string) {
  updateApp(appId, (item, _, board) => ({
    app: move(item, "rejected", board.clock, { note: `Tiệm chọn thợ khác — hoàn 100% cọc $${item.deposit}` }),
  }));
}

export function completeShift(appId: string) {
  updateApp(appId, (item, state, board) => {
    const shift = state.shifts.find((entry) => entry.id === item.shiftId);
    const note = `Đã nhận $${shift?.pay ?? 0} tiền công · hoàn 100% cọc $${item.deposit}`;
    return { app: move(item, "completed", board.clock, { note }), board: bump(board, item.techId, "completed") };
  });
}

export function checkIn(appId: string) {
  const state = getState();
  const app = state.shiftApplications.find((item) => item.id === appId);
  const shift = state.shifts.find((item) => item.id === app?.shiftId);
  const clock = selectClock(state);
  if (!app || !shift || app.status !== "locked" || !canCheckIn(shift, app.policy ?? shift.policy, clock)) return false;
  updateApp(appId, (item, _, board) => ({ app: move(item, "working", board.clock, { checkedInAt: board.clock }) }));
  return true;
}

/** S03-04 — tech cancels (or declines an invite). Returns the quote that was applied. */
export function cancelByTech(appId: string) {
  const state = getState();
  const app = state.shiftApplications.find((item) => item.id === appId);
  const shift = state.shifts.find((item) => item.id === app?.shiftId);
  if (!app || !shift) return null;
  const quote = quoteTechCancel(app, shift, selectClock(state));
  updateApp(appId, (item, _, board) => {
    const note = quote.late
      ? `Huỷ muộn — mất $${quote.amount} cọc → tiệm · hoàn $${quote.refund}`
      : item.status === "invited" ? "Đã từ chối lời mời — miễn phí" : `Huỷ miễn phí — hoàn 100% cọc $${item.deposit}`;
    const nextBoard = quote.late ? bump(board, item.techId, "lateCancel") : board;
    return { app: move(item, "techCancelled", board.clock, { note }), board: nextBoard };
  });
  return quote;
}

/** S03-04 / S03-06 — salon cancels a shift that has ≥ 1 locked tech. */
export function cancelShiftBySalon(shiftId: string) {
  const state = getState();
  const shift = state.shifts.find((item) => item.id === shiftId);
  if (!shift) return null;
  const quote = quoteSalonCancel(shift, state.shiftApplications, selectClock(state));
  write((current, board) => {
    const apps = current.shiftApplications.map((item) => {
      if (item.shiftId !== shiftId || !ACTIVE.includes(item.status)) return item;
      const seated = ["locked", "working"].includes(item.status);
      const note = seated && quote.late
        ? `Tiệm huỷ muộn — bạn nhận $${quote.amount} (${shift.policy.salonLatePayPct}% công) · hoàn 100% cọc`
        : `Tiệm huỷ ca — hoàn 100% cọc $${item.deposit}`;
      return move(item, "salonCancelled", board.clock, { note });
    });
    const shifts = current.shifts.map((item) =>
      (item.id === shiftId ? { ...item, status: "cancelled" as const } : item));
    return { shiftApplications: apps, shifts };
  });
  return quote;
}

/** S03-07 — owner invites an available tech to one of the salon's shifts. */
export function inviteToShift(shiftId: string, techId: string) {
  const state = getState();
  if (state.shiftApplications.some((item) => item.shiftId === shiftId && item.techId === techId)) return false;
  write((current, board) => ({
    shiftApplications: [...current.shiftApplications, {
      id: `app-${Date.now()}`, shiftId, techId, status: "invited", deposit: 0,
      history: [{ status: "invited", at: board.clock }],
    }],
  }));
  return true;
}

export type PostShiftInput = {
  kind: ShiftKind;
  title: string;
  dayOffset: number;
  start: string;
  end: string;
  staffNeeded: number;
  services: string[];
  pay: number;
  mode: ShiftMode;
  salonId: string;
};

/** S03-05 — guarantee (pay × techs) is held; the current policy is written onto the shift. */
export function postShift(input: PostShiftInput) {
  const id = `shift-${Date.now()}`;
  write((state, board) => {
    const day = new Date(ms(board.clock));
    day.setDate(day.getDate() + input.dayOffset);
    const at = (time: string) => {
      const [hour, minute] = time.split(":").map(Number);
      const date = new Date(day);
      date.setHours(hour, minute, 0, 0);
      return toLocalIso(date.getTime());
    };
    const shift: Shift = {
      id, title: input.title.trim(), salonId: input.salonId, startsAt: at(input.start), endsAt: at(input.end),
      pay: input.pay, status: "open", kind: input.kind, mode: input.mode, services: input.services,
      staffNeeded: input.staffNeeded, tips: 0, distanceMi: 2.1, guarantee: input.pay * input.staffNeeded,
      policy: { ...state.shiftPolicy }, postedAt: board.clock,
    };
    return { shifts: [shift, ...state.shifts] };
  });
  return id;
}

export function setShare(techId: string, patch: Partial<StaffShare>) {
  write((_, board) => {
    const current = board.share[techId];
    if (!current) return {};
    return { shiftBoard: { ...board, share: { ...board.share, [techId]: { ...current, ...patch } } } };
  });
}

export type PolicyValues = Omit<ShiftPolicy, "version" | "updatedAt">;

/** S03-09 — new version; applies only to shifts/deposits created afterwards (không áp hồi tố). */
export function savePolicy(values: PolicyValues) {
  const next = { ...values, version: getState().shiftPolicy.version + 1, updatedAt: toLocalIso(Date.now()) };
  write((_, board) => ({ shiftPolicy: next, shiftBoard: { ...board, policyHistory: [next, ...board.policyHistory] } }));
  return next;
}

/** Contract 5 — the demo bar's "Quá giờ check-in ca" jumps past the grace period of my next locked shift. */
function onOverdue() {
  const state = getState();
  const me = currentTechId(state);
  const locked = state.shiftApplications
    .filter((item) => item.techId === me && item.status === "locked")
    .map((item) => ({ item, shift: state.shifts.find((entry) => entry.id === item.shiftId) }))
    .filter((entry): entry is { item: ShiftApplication; shift: Shift } => Boolean(entry.shift))
    .sort((a, b) => ms(a.shift.startsAt) - ms(b.shift.startsAt));
  const target = locked[0];
  if (!target) {
    emit({ text: "Không có ca đã chốt nào đang chờ check-in", tone: "info" });
    return;
  }
  const grace = (target.item.policy ?? target.shift.policy).graceMinutes;
  const due = ms(target.shift.startsAt) + (grace + 1) * MINUTE;
  setClock(toLocalIso(Math.max(due, ms(selectClock(state)))));
}

subscribeSimulation((event) => {
  if (event === "shift.checkin.overdue") onOverdue();
});
