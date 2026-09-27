import type { PropsWithChildren, ReactNode } from "react";
import { AlertTriangle, BadgeCheck, ImageIcon, ShieldAlert } from "lucide-react";
import { Avatar } from "../../components";
import type { PostType } from "../../store/types";
import { COPY, TYPE_LABEL } from "./constants";
import type { AuthorView } from "./data";

const TONES = [
  "from-nexoraBrandSoft via-nexoraLavender/40 to-nexoraViolet/30",
  "from-nexoraElectric/25 via-nexoraBrandSoft to-nexoraViolet/35",
  "from-nexoraWarning/25 via-nexoraSurfaceMuted to-nexoraDanger/20",
  "from-nexoraTeal/25 via-nexoraSurfaceMuted to-nexoraElectric/25",
  "from-nexoraViolet/30 via-nexoraBrandSoft to-nexoraLavender/30",
  "from-nexoraLavender/60 via-nexoraSurfaceMuted to-nexoraWarning/25",
];

/** Gradient + SVG placeholder for a user photo (no real/AI images in the prototype). */
export function PhotoTile({ tone, className = "", label }: { tone: number; className?: string; label?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-gradient-to-br ${TONES[tone % TONES.length]} ${className}`}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full opacity-40" aria-hidden="true">
        <circle cx={20 + tone * 11} cy="30" r="22" className="fill-white" />
        <circle cx={80 - tone * 7} cy="78" r="30" className="fill-white/60" />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-nexoraBrand/70">
        <ImageIcon size={22} aria-hidden="true" />
      </span>
      {label && (
        <span className="absolute bottom-2 left-2 rounded-full bg-white/85 px-2 py-0.5 text-xs font-semibold">
          {label}
        </span>
      )}
    </div>
  );
}

export function PhotoGrid({ images }: { images: number[] }) {
  if (!images.length) return null;
  if (images.length === 1) return <PhotoTile tone={images[0]} className="aspect-[16/9] w-full" />;
  const shown = images.slice(0, 3);
  return (
    <div className={`grid gap-1.5 ${shown.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
      {shown.map((tone, index) => (
        <PhotoTile
          key={`${tone}-${index}`}
          tone={tone}
          className="aspect-square w-full"
          label={index === 2 && images.length > 3 ? `+${images.length - 3}` : undefined}
        />
      ))}
    </div>
  );
}

export function AuthorAvatar({ author, className = "" }: { author: AuthorView; className?: string }) {
  if (author.official) {
    return (
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-full bg-nexoraSidebar font-bold text-white
          ${className}`}
      >
        N
      </span>
    );
  }
  return <Avatar name={author.name} className={className} />;
}

export function AuthorName({ author }: { author: AuthorView }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1 font-semibold text-nexoraText">
      <span className="truncate">{author.name}</span>
      {author.verified && <BadgeCheck size={15} className="shrink-0 text-nexoraBrand" aria-label="Đã xác minh" />}
    </span>
  );
}

const TYPE_TONE: Record<PostType, string> = {
  showcase: "bg-nexoraBrandSoft text-nexoraBrand",
  tip: "bg-nexoraWarning/15 text-nexoraText",
  question: "bg-nexoraTeal/10 text-nexoraText",
  market: "bg-nexoraViolet/10 text-nexoraText",
  official: "bg-nexoraSidebar text-white",
};

export function TypeBadge({ type }: { type: PostType }) {
  return (
    <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${TYPE_TONE[type]}`}>
      {TYPE_LABEL[type]}
    </span>
  );
}

export function Disclaimer() {
  return (
    <p className="flex gap-2 rounded-lg border border-nexoraWarning/40 bg-nexoraWarning/10 p-3 text-xs
      leading-5 text-nexoraText">
      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-nexoraWarning" aria-hidden="true" />
      <span>{COPY.disclaimer}</span>
    </p>
  );
}

export function FieldError({ children }: PropsWithChildren) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-nexoraDanger">
      <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

export function Notice({ tone, children }: PropsWithChildren<{ tone: "danger" | "warning" | "info" }>) {
  const styles = {
    danger: "border-nexoraDanger/40 bg-nexoraDanger/10 text-nexoraDangerDark",
    warning: "border-nexoraWarning/50 bg-nexoraWarning/10 text-nexoraText",
    info: "border-nexoraBrand/30 bg-nexoraBrandSoft text-nexoraText",
  };
  return (
    <div role="alert" className={`rounded-lg border p-3 text-sm font-medium leading-6 ${styles[tone]}`}>
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold text-nexoraText">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-nexoraMuted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
