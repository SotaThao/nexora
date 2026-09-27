import type { Promotion } from "../../../store/types";
import { offerHeadline } from "../logic/domain";
import { useSalonName } from "./hooks";

/** Distance → map radius (viewBox 400). Non-linear so 1 mi and 25 mi both read on one map. */
const RINGS: [number, number][] = [[0, 0], [1, 42], [5, 92], [10, 132], [25, 184]];
export function ringRadius(mi: number) {
  for (let i = 1; i < RINGS.length; i += 1) {
    const [m0, r0] = RINGS[i - 1];
    const [m1, r1] = RINGS[i];
    if (mi <= m1) return r0 + ((mi - m0) / (m1 - m0)) * (r1 - r0);
  }
  return RINGS[RINGS.length - 1][1];
}

type Props = {
  deals: Promotion[];
  radius: number;
  onlineCount: number;
  selectedSalon: string | null;
  onSelectSalon: (salonId: string | null) => void;
  className?: string;
};

/** Illustrative SVG map (no tiles): streets, a bayou, parks, radius rings and one pin per salon. */
export function DealMap({ deals, radius, onlineCount, selectedSalon, onSelectSalon, className = "" }: Props) {
  const salonName = useSalonName();
  const bySalon = new Map<string, Promotion[]>();
  deals
    .filter((d) => d.distanceMi !== null)
    .forEach((d) => bySalon.set(d.salonId, [...(bySalon.get(d.salonId) ?? []), d]));

  return (
    <div className={`relative overflow-hidden rounded-flox-cards border border-nexoraBorder bg-nexoraSurfaceMuted ${
      className}`}>
      <svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" role="img"
        aria-label="Bản đồ minh hoạ các deal quanh bạn">
        <rect width="400" height="400" className="fill-nexoraSurfaceMuted" />
        <g className="fill-nexoraTeal/10">
          <rect x="24" y="36" width="92" height="64" rx="14" />
          <rect x="276" y="286" width="96" height="70" rx="16" />
          <circle cx="318" cy="84" r="34" />
        </g>
        <path d="M-10 250C60 220 110 300 190 270S300 190 410 220" fill="none" strokeWidth="14"
          className="stroke-nexoraElectric/15" strokeLinecap="round" />
        <g className="stroke-white" strokeWidth="7" fill="none" strokeLinecap="round">
          <path d="M0 150H400M0 322H400M130 0V400M268 0V400" />
          <path d="M0 40L400 380M60 400L380 0" />
        </g>
        <g className="stroke-white" strokeWidth="3" fill="none">
          <path d="M0 96H400M0 206H400M0 370H400M60 0V400M200 0V400M338 0V400" />
        </g>
        {[1, 5, 10, 25].map((mi) => (
          <g key={mi}>
            <circle cx="200" cy="200" r={ringRadius(mi)} fill={mi === radius ? "currentColor" : "none"}
              className={mi === radius ? "text-nexoraBrand/10 stroke-nexoraBrand" : "stroke-nexoraSubtle/40"}
              strokeWidth={mi === radius ? 2 : 1} strokeDasharray={mi === radius ? "0" : "4 5"} />
            <text x={200 + ringRadius(mi) * 0.7} y={200 - ringRadius(mi) * 0.7}
              className={`fill-nexoraMuted text-[10px] font-semibold`}
            >
              {mi} mi
            </text>
          </g>
        ))}
        <circle cx="200" cy="200" r="16" className="fill-nexoraElectric/20 animate-pulse" />
        <circle cx="200" cy="200" r="7" className="fill-nexoraElectric stroke-white" strokeWidth="3" />
      </svg>

      {[...bySalon.entries()].map(([salonId, list]) => {
        const first = list[0];
        const r = ringRadius(first.distanceMi ?? 0);
        const rad = (first.mapAngle * Math.PI) / 180;
        const left = ((200 + r * Math.cos(rad)) / 400) * 100;
        const top = ((200 - r * Math.sin(rad)) / 400) * 100;
        const active = selectedSalon === salonId;
        const sponsored = list.some((d) => d.sponsored);
        return (
          <button
            key={salonId}
            type="button"
            onClick={() => onSelectSalon(active ? null : salonId)}
            style={{ left: `${left}%`, top: `${top}%` }}
            aria-label={`${salonName(salonId)} · ${list.length} deal`}
            className={`absolute flex min-h-11 -translate-x-1/2 -translate-y-full items-center gap-1.5 whitespace-nowrap
              rounded-full border-2 px-2.5 text-xs font-bold shadow-nexora-soft transition ${
              active
                ? "z-20 border-nexoraBrand bg-nexoraBrand text-white"
                : "z-10 border-white bg-white text-nexoraText hover:border-nexoraBrand"
            }`}
        >
            <span className="text-base">{sponsored ? "⭐" : first.emoji}</span>
            <span>{offerHeadline(first)}</span>
            {list.length > 1 && (
              <span className={`rounded-full px-1.5 ${active ? "bg-white/20" : "bg-nexoraBrandSoft text-nexoraBrand"}`}>
                +{list.length - 1}
              </span>
            )}
          </button>
        );
      })}

      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="rounded-full bg-white/95 px-3 py-1.5 font-semibold text-nexoraMuted shadow-nexora-card">
          Bản đồ minh hoạ · Houston · bạn ở giữa
        </span>
        {onlineCount > 0 && (
          <span className="rounded-full bg-white/95 px-3 py-1.5 font-semibold text-nexoraBrand shadow-nexora-card">
            + {onlineCount} deal Online
          </span>
        )}
      </div>
    </div>
  );
}
