import { type PropsWithChildren, type ReactNode, useMemo } from "react";
import { ChevronRight, Hand, Store } from "lucide-react";
import { Badge, Button, Card } from "../../components";
import { storeActions, useStore } from "../../store";
import { selectProfile } from "../../store/slices/m02";
import type { DemoState, JobStatus, TechProfile } from "../../store/types";
import { publicName } from "./logic";

export const JOBS = "/community-v2/jobs";
export const POS_JOBS = "/community-v2/pos/jobs";

/** Owner ↔ salon mapping for the demo seed (only Kayla has an owner account). */
export const OWNER_SALON: Record<string, string> = { kayla: "kayla-nails" };
export const SALON_OWNER: Record<string, string> = { "kayla-nails": "kayla" };

/** Memoised normalised profile — never select derived objects straight from useStore. */
export function useProfile(personId: string | null | undefined): TechProfile | undefined {
  const techProfiles = useStore((state) => state.techProfiles);
  const people = useStore((state) => state.people);
  return useMemo(() => selectProfile({ techProfiles, people }, personId), [techProfiles, people, personId]);
}

export function useJobsViewer() {
  const role = useStore((state) => state.role);
  const personId = useStore((state) => state.currentPersonId);
  const profile = useProfile(personId);
  const salonId = role === "owner" ? OWNER_SALON[personId ?? ""] ?? "kayla-nails" : undefined;
  return { role, personId, profile, salonId };
}

export function techPublicName(state: DemoState, techId: string | undefined): string {
  const person = state.people.find((item) => item.id === techId);
  return publicName(selectProfile(state, techId), person?.name ?? "Thợ NEXORA");
}

export function salonName(state: DemoState, salonId: string | undefined): string {
  return state.salons.find((salon) => salon.id === salonId)?.name ?? "Tiệm NEXORA";
}

export function PageHeader({
  eyebrow = "Việc làm",
  title,
  subtitle,
  pos,
  actions,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  pos?: boolean;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-nexoraSubtle">
          {pos && <span className="rounded bg-nexoraSidebar px-1.5 py-0.5
            text-[10px] tracking-wider text-white">POS</span>}
          <span className="uppercase tracking-wider">{pos ? "POS" : "Community"}</span>
          <ChevronRight size={13} />
          <span className="uppercase tracking-wider text-nexoraBrand">{eyebrow}</span>
        </div>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-nexoraText">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-nexoraMuted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function ChipToggle({ active, onClick, children }: PropsWithChildren<{ active: boolean; onClick: () => void }>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 rounded-full border px-3.5 text-sm font-semibold transition focus-visible:outline-none
        focus-visible:ring-2 focus-visible:ring-nexoraBrand/20 ${
          active
            ? "border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand"
            : "border-nexoraBorder bg-white text-nexoraMuted hover:border-nexoraLavender"
        }`}
    >
      {children}
    </button>
  );
}

export function ChipGroup<T extends string>({
  options,
  value,
  onChange,
  single,
}: {
  options: readonly T[];
  value: T[];
  onChange: (next: T[]) => void;
  single?: boolean;
}) {
  const toggle = (option: T) => {
    if (single) return onChange(value.includes(option) ? [] : [option]);
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <ChipToggle key={option} active={value.includes(option)} onClick={() => toggle(option)}>
          {option}
        </ChipToggle>
      ))}
    </div>
  );
}

export function Field({ label, hint, children }: PropsWithChildren<{ label: string; hint?: string }>) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-semibold text-nexoraText">
        {label}
        {hint && <span className="ml-1.5 font-normal text-nexoraSubtle">{hint}</span>}
      </p>
      {children}
    </div>
  );
}

export function ErrorText({ children }: PropsWithChildren) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg border border-nexoraDanger/30 bg-nexoraDanger/5
      px-3 py-2 text-sm text-nexoraDanger">
      {children}
    </p>
  );
}

export function LicenseBadge({ profile }: { profile?: TechProfile }) {
  if (!profile?.licenseType || !profile.licenseNumber?.trim()) return null;
  return (
    <span className="inline-flex items-center rounded-full bg-nexoraSuccess/10 px-2.5 py-1 text-[11px] font-black
      tracking-wide text-nexoraSuccess">
      ✓ LICENSE XÁC MINH
    </span>
  );
}

const STATUS: Record<JobStatus, { label: string; tone: "success" | "warning" | "neutral" | "brand" }> = {
  active: { label: "Đang hiển thị", tone: "success" },
  paused: { label: "Tạm ẩn", tone: "neutral" },
  expired: { label: "Hết hạn", tone: "warning" },
  filled: { label: "Đã có việc", tone: "brand" },
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return <Badge tone={STATUS[status].tone}>{STATUS[status].label}</Badge>;
}

export function CompletionRing({ value, size = 112 }: { value: number; size?: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const locked = value < 60;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="m02-ring" x1="0" x2="1">
            <stop offset="0%" stopColor="#2B59FF" />
            <stop offset="100%" stopColor="#8E4DF8" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E9E9FF" strokeWidth="10" />
        <circle
          cx="50" cy="50" r={radius} fill="none" strokeWidth="10" strokeLinecap="round"
          stroke={locked ? "#F59E0B" : "url(#m02-ring)"}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <p className={`${size >= 100 ? "text-2xl" : "text-lg"} font-black tracking-tight text-nexoraText`}>
            {value}%
          </p>
          {size >= 100 && (
            <p className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">hoàn thiện</p>
          )}
        </div>
      </div>
    </div>
  );
}

const GRADIENTS = [
  "from-nexoraElectric to-nexoraViolet",
  "from-nexoraBrandSoft to-nexoraLavender",
  "from-nexoraTeal to-nexoraElectric",
  "from-nexoraViolet to-nexoraLavender",
  "from-nexoraWarning/70 to-nexoraViolet/70",
  "from-nexoraSidebar to-nexoraBrand",
  "from-nexoraLavender to-nexoraTealAlt",
];

export function PortfolioTile({ index, label }: { index: number; label?: string }) {
  return (
    <div className={`relative grid aspect-square place-items-center overflow-hidden rounded-lg bg-gradient-to-br
      ${GRADIENTS[index % GRADIENTS.length]}`}>
      <Hand className="text-white/70" size={28} />
      {label && (
        <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5
          text-[10px] font-bold text-nexoraText">
          {label}
        </span>
      )}
    </div>
  );
}

export function SalonMark({ name, index = 0 }: { name: string; index?: number }) {
  return (
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white
      ${GRADIENTS[(index + 5) % GRADIENTS.length]}`} aria-hidden="true">
      <Store size={19} />
      <span className="sr-only">{name}</span>
    </span>
  );
}

/** Tech- or owner-only screen opened with another demo role. */
export function RoleNotice({ need }: { need: "tech" | "owner" }) {
  const tech = need === "tech";
  return (
    <Card className="mx-auto max-w-xl p-6 text-center">
      <p className="text-lg font-bold">{tech ? "Màn này dành cho thợ" : "Màn này nằm trong POS của chủ tiệm"}</p>
      <p className="mt-2 text-sm text-nexoraMuted">
        Trong demo, đổi vai sang {tech ? "“Jessica · thợ”" : "“Kayla · chủ tiệm”"} ở thanh demo để xem màn này.
      </p>
      <Button className="mt-5" variant="gradient" onClick={() => storeActions.setRole(tech ? "tech" : "owner")}>
        Chuyển sang {tech ? "Jessica · thợ" : "Kayla · chủ tiệm"}
      </Button>
    </Card>
  );
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}
