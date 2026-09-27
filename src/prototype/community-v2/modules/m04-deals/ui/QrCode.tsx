import { useMemo } from "react";
import { qrMatrix } from "../logic/dynamicCode";

type Props = { seed: string; className?: string; label?: string };

/** SVG QR-like code, deterministic per seed. Pass a seed containing the 30 s window to make it rotate. */
export function QrCode({ seed, className = "size-48", label = "Mã QR" }: Props) {
  const grid = useMemo(() => qrMatrix(seed), [seed]);
  const size = grid.length;
  const cells: string[] = [];
  grid.forEach((row, y) =>
    row.forEach((on, x) => {
      if (on) cells.push(`M${x + 2} ${y + 2}h1v1h-1z`);
    }),
  );
  return (
    <svg
      viewBox={`0 0 ${size + 4} ${size + 4}`}
      className={`rounded-lg bg-white ${className}`}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect width={size + 4} height={size + 4} fill="white" />
      <path d={cells.join("")} className="fill-nexoraText" />
    </svg>
  );
}
