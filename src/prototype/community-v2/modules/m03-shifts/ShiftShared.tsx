import { type PropsWithChildren, type ReactNode, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Lock, Store, UserRound } from "lucide-react";
import { Badge, Button, Card } from "../../components";
import { ShiftToastHost, useShiftToast } from "./ShiftToast";
import { storeActions, useStore } from "../../store";
import { subscribeShiftNotices } from "../../store/slices/m03";
import type { CommunityRole, ShiftApplicationStatus, ShiftKind, ShiftMode } from "../../store/types";
import type { ScreenComponent } from "../../screenRegistry";
import type { Reliability } from "./rules";

export const OWNER_SALON_ID = "kayla-nails";
export const SHIFT_PATHS = {
  nearby: "/community-v2/shifts",
  mine: "/community-v2/shifts/mine",
  apply: (id: string) => `/community-v2/shifts/${id}/apply`,
  cancel: (id: string) => `/community-v2/shifts/${id}/cancel`,
  post: "/community-v2/pos/shifts/new",
  detail: (id: string) => `/community-v2/pos/shifts/${id}`,
  available: "/community-v2/pos/shifts/available",
  share: "/community-v2/pos/shifts/share",
  policy: "/community-v2/admin/shifts",
  admin: "/community-v2/admin",
};

type Tone = "brand" | "success" | "warning" | "danger" | "neutral";

export const KIND_META: Record<ShiftKind, { label: string; tone: Tone; stripe: string }> = {
  party: { label: "🎉 Party", tone: "brand", stripe: "from-nexoraViolet to-nexoraElectric" },
  busy: { label: "🔥 Khách đông", tone: "warning", stripe: "from-nexoraWarning to-nexoraDanger" },
  urgent: { label: "⚡ Thiếu thợ gấp", tone: "danger", stripe: "from-nexoraDanger to-nexoraViolet" },
};

export const MODE_LABEL: Record<ShiftMode, string> = {
  instant: "Thợ nhận ngay (tự chốt)",
  approval: "Tôi duyệt từng thợ",
};

export const TECH_MODE_LABEL: Record<ShiftMode, string> = {
  instant: "⚡ Nhận ngay · tự chốt",
  approval: "🙋 Tiệm duyệt từng thợ",
};

export const APP_META: Record<ShiftApplicationStatus, { short: string; long: string; tone: Tone }> = {
  invited: { short: "📩 Được mời", long: "📩 Tiệm mời bạn", tone: "brand" },
  pending: { short: "⏳ Chờ duyệt", long: "⏳ Chờ tiệm duyệt · cọc đang tạm giữ", tone: "warning" },
  locked: { short: "🔒 Đã chốt", long: "🔒 Đã chốt ca", tone: "brand" },
  working: { short: "✅ Đang làm", long: "✅ Đã check-in · đang làm", tone: "success" },
  completed: { short: "🎉 Hoàn thành", long: "🎉 Hoàn thành · đã nhận tiền", tone: "success" },
  absent: { short: "Vắng mặt", long: "Vắng mặt · mất cọc", tone: "danger" },
  techCancelled: { short: "Thợ huỷ", long: "Bạn đã huỷ ca", tone: "neutral" },
  salonCancelled: { short: "Tiệm huỷ", long: "Tiệm đã huỷ ca", tone: "neutral" },
  rejected: { short: "Bị từ chối", long: "Bị từ chối · đã hoàn cọc", tone: "neutral" },
};

export function StatusBadge({ status }: { status: ShiftApplicationStatus }) {
  return <Badge tone={APP_META[status].tone}>{APP_META[status].short}</Badge>;
}

export function KindBadge({ kind }: { kind: ShiftKind }) {
  return <Badge tone={KIND_META[kind].tone}>{KIND_META[kind].label}</Badge>;
}

/** Page header — POS screens carry the "POS" tag so the audience knows they left Community. */
export function ShiftPageHeader({ title, subtitle, pos = false, actions }: {
  title: string;
  subtitle?: string;
  pos?: boolean;
  actions?: ReactNode;
}) {
  const salon = useStore((state) => state.salons.find((item) => item.id === OWNER_SALON_ID));
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wider text-nexoraBrand">
          {pos ? (
            <>
              <Badge tone="warning">POS</Badge>
              <span className="inline-flex items-center gap-1 normal-case tracking-normal text-nexoraMuted">
                <Store size={14} /> {salon?.name} · Ca làm thêm
              </span>
            </>
          ) : (
            <span>Community · Ca làm thêm</span>
          )}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-nexoraText">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-nexoraMuted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

const TECH_TABS = [
  { label: "Ca gần bạn", to: SHIFT_PATHS.nearby },
  { label: "Ca của tôi", to: SHIFT_PATHS.mine },
];

export function ShiftNav({ pos = false, detailPath }: { pos?: boolean; detailPath?: string }) {
  const tabs = pos
    ? [
        { label: "Đăng ca", to: SHIFT_PATHS.post },
        { label: "Ca đã đăng", to: detailPath ?? SHIFT_PATHS.detail("shift-kayla-sat") },
        { label: "Thợ rảnh gần tiệm", to: SHIFT_PATHS.available },
        { label: "Chia sẻ thợ dư", to: SHIFT_PATHS.share },
      ]
    : TECH_TABS;
  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-nexoraBorder" aria-label="Ca làm thêm">
      {tabs.map((tab) => (
        <NavLink
          key={tab.label}
          to={tab.to}
          end
          className={({ isActive }) =>
            `inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold ${
              isActive ? "border-nexoraBrand text-nexoraBrand" : "border-transparent text-nexoraMuted"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

const ROLE_COPY: Record<"tech" | "owner" | "admin", { who: string; role: CommunityRole; button: string }> = {
  tech: { who: "thợ", role: "tech", button: "Chuyển sang vai Jessica · thợ" },
  owner: { who: "chủ tiệm (POS)", role: "owner", button: "Chuyển sang vai Kayla · chủ tiệm" },
  admin: { who: "Admin NEXORA", role: "admin", button: "Chuyển sang vai Admin" },
};

/** Screens stay reachable for every role; a mismatch shows a notice with a one-tap role switch. */
export function RoleGate({ need, allowGuest = false, children }: PropsWithChildren<{
  need: "tech" | "owner" | "admin";
  allowGuest?: boolean;
}>) {
  const role = useStore((state) => state.role);
  if (role === need || (allowGuest && role === "guest")) return <>{children}</>;
  const copy = ROLE_COPY[need];
  return (
    <Card className="mx-auto max-w-xl p-6 text-center">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-nexoraBrandSoft text-nexoraBrand">
        <UserRound size={22} />
      </span>
      <p className="mt-3 text-lg font-bold">Màn này dành cho {copy.who}</p>
      <p className="mt-1 text-sm text-nexoraMuted">
        Bạn đang xem với một vai khác. Đổi vai trên thanh Demo hoặc bấm nút dưới đây.
      </p>
      <Button className="mt-4" variant="gradient" onClick={() => storeActions.setRole(copy.role)}>
        {copy.button}
      </Button>
    </Card>
  );
}

/** Light warning panel + lock icon — every deposit / guarantee block (SPEC §3.4). */
export function HoldPanel({ title, children }: PropsWithChildren<{ title: ReactNode }>) {
  return (
    <div className="rounded-xl border border-nexoraWarning/50 bg-nexoraWarning/10 p-4">
      <p className="flex items-center gap-2 text-sm font-bold text-nexoraText">
        <Lock size={16} className="shrink-0 text-nexoraWarning" />
        {title}
      </p>
      <div className="mt-2 text-sm leading-6 text-nexoraMuted">{children}</div>
    </div>
  );
}

export function ReliabilityLine({ value }: { value: Reliability }) {
  return (
    <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-nexoraMuted">
      <span><b className="text-nexoraSuccess">{value.completed}</b> hoàn thành</span>
      <span><b className={value.absent ? "text-nexoraDanger" : "text-nexoraText"}>{value.absent}</b> vắng</span>
      <span><b className="text-nexoraText">{value.lateCancel}</b> huỷ muộn</span>
    </p>
  );
}

/** Mount once per M03 route: shows slice notices (auto no-show from the demo bar) as toasts. */
export function useShiftNotices() {
  const toast = useShiftToast();
  useEffect(() => subscribeShiftNotices((notice) => toast(notice.text, notice.tone)), [toast]);
}

function ShiftNotices() {
  useShiftNotices();
  return null;
}

/** Wraps a registered screen with the M03 toast host (see ShiftToast.tsx) and the slice-notice listener. */
export function withShiftToasts(Screen: ScreenComponent): ScreenComponent {
  return function WithShiftToasts(props) {
    return (
      <>
        <ShiftNotices />
        <Screen {...props} />
        <ShiftToastHost />
      </>
    );
  };
}
