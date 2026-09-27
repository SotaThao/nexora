import type { PropsWithChildren, ReactNode } from "react";
import { ChevronRight, LockKeyhole, Store } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Badge, Button, Card } from "../../../components";
import { storeActions } from "../../../store";
import type { Channel } from "../../../store/types";
import { useCommunityGate } from "../../m00-foundation/gates";
import { CHANNEL_LABEL, PROGRAM_STATE_LABEL, PROGRAM_STATE_TONE, type ProgramState } from "../logic/domain";
import { dealPath, posPath, useMe } from "./hooks";

const pill = (active: boolean) =>
  `inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm font-semibold transition ${
    active ? "bg-nexoraBrand text-white" : "border border-nexoraBorder bg-white text-nexoraMuted hover:text-nexoraText"
  }`;

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-nexoraText lg:text-2xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-nexoraMuted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

/** Community sub-navigation for Deal & Coupon (doc 00 menu: 🔥 · 🏷️ · 🎟️ · ♡). */
export function DealsNav() {
  const { role } = useMe();
  const items = [
    { to: dealPath("/nearby"), label: "🔥 Deal gần bạn" },
    { to: dealPath("/categories"), label: "🏷️ Coupon theo ngành" },
    { to: dealPath("/wallet"), label: "🎟️ Ví coupon" },
    { to: dealPath("/wishlist"), label: "♡ Wish list" },
  ];
  return (
    <nav aria-label="Deal & Coupon" className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} className={({ isActive }) => pill(isActive)}>
          {item.label}
        </NavLink>
      ))}
      {role === "owner" && (
        <NavLink to={posPath("/promotions/new")} className={pill(false)}>
          ➕ Tạo coupon · trong POS
        </NavLink>
      )}
    </nav>
  );
}

/** Wallet / wish list need an account; guests get the account sheet, then come back here. */
export function MemberGate({ what, children }: PropsWithChildren<{ what: string }>) {
  const { isGuest } = useMe();
  const { requireAccount } = useCommunityGate();
  if (!isGuest) return <>{children}</>;
  return (
    <Card className="mx-auto max-w-xl p-8 text-center">
      <LockKeyhole className="mx-auto text-nexoraBrand" />
      <p className="mt-3 font-bold">{what} cần tài khoản NEXORA</p>
      <p className="mt-1 text-sm text-nexoraMuted">Tạo tài khoản miễn phí bằng số điện thoại — mất chưa tới 1 phút.</p>
      <Button className="mt-4" variant="gradient" onClick={() => requireAccount(`open-${what}`, () => undefined)}>
        Tạo tài khoản NEXORA · miễn phí
      </Button>
    </Card>
  );
}

export function ProgramStateBadge({ state }: { state: ProgramState }) {
  return <Badge tone={PROGRAM_STATE_TONE[state]}>{PROGRAM_STATE_LABEL[state]}</Badge>;
}

export function ChannelChips({ channels }: { channels: Channel[] }) {
  const order: Channel[] = ["POS", "Community", "SMS", "QR"];
  return (
    <span className="flex flex-wrap gap-1">
      {order.filter((c) => channels.includes(c)).map((c) => (
        <span
          key={c}
          className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
            c === "POS" ? "bg-nexoraSidebar text-white" : "bg-nexoraBrandSoft text-nexoraBrand"
          }`}
      >
          {c === "QR" ? "QR" : CHANNEL_LABEL[c]}
        </span>
      ))}
    </span>
  );
}

const POS_TABS = [
  { to: posPath("/promotions"), label: "Chương trình", end: true },
  { to: posPath("/promotions/new"), label: "Tạo chương trình", end: false },
  { to: posPath("/check-in"), label: "Check-in khách", end: false },
  { to: posPath("/redeem"), label: "Quầy redeem", end: false },
  { to: posPath("/promotions/report"), label: "Báo cáo", end: false },
];

type PosFrameProps = PropsWithChildren<{ crumb: string; title: string; subtitle?: ReactNode; actions?: ReactNode }>;

/** Merchant-dashboard frame: "POS" breadcrumb tag + Promotion tabs. Only owner / tech (salon staff). */
export function PosFrame({ crumb, title, subtitle, actions, children }: PosFrameProps) {
  const { role } = useMe();
  const allowed = role === "owner" || role === "tech";
  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-1.5 text-xs font-semibold text-nexoraMuted">
        <span className="rounded bg-nexoraSidebar px-2 py-0.5 font-bold tracking-wider text-white">POS</span>
        <span className="inline-flex items-center gap-1"><Store size={13} /> Kayla Nails & Spa</span>
        <ChevronRight size={13} />
        <span>Promotion</span>
        <ChevronRight size={13} />
        <span className="text-nexoraText">{crumb}</span>
      </div>
      <PageTitle title={title} subtitle={subtitle} actions={allowed ? actions : undefined} />
      <nav aria-label="POS Promotion"
        className={`-mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-nexoraBorder px-4 lg:mx-0 lg:px-0`}
      >
        {POS_TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `inline-flex min-h-11 shrink-0 items-center border-b-2 px-3 text-sm font-semibold ${
                isActive
                  ? "border-nexoraBrand text-nexoraBrand"
                  : "border-transparent text-nexoraMuted hover:text-nexoraText"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>
      {allowed ? children : (
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Store className="mx-auto text-nexoraBrand" />
          <p className="mt-3 font-bold">Màn POS dành cho chủ tiệm và nhân viên tiệm</p>
          <p
            className={`mt-1 text-sm text-nexoraMuted`}
            >Khách và Community chỉ thấy coupon ở Deal gần bạn / Ví coupon.</p>
          <Button
            className={`mt-4`}
            onClick={() => storeActions.setRole("owner")}>Chuyển sang vai Kayla · chủ tiệm</Button>
        </Card>
      )}
    </div>
  );
}

export function Fact({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-nexoraRule py-2.5 text-sm last:border-0">
      <dt className="shrink-0 text-nexoraMuted">{label}</dt>
      <dd className="text-right font-medium text-nexoraText">{children}</dd>
    </div>
  );
}

export function SampleTag({ children = "số mẫu" }: PropsWithChildren) {
  return <span
    className={`rounded bg-nexoraSurfaceMuted px-1.5 py-0.5 text-[11px] font-semibold text-nexoraSubtle`}
    >{children}</span>;
}
