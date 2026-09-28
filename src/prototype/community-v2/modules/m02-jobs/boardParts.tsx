import { useEffect, useState, type CSSProperties } from "react";
import { Search } from "lucide-react";
import { Input, SegmentedPills, Select, Skeleton } from "../../components";
import type { DemoState, JobPost } from "../../store/types";
import { JOB_CITIES } from "../../store/types";
import { salonName, techPublicName } from "./shared";

export const FILTERS = ["Tất cả", "Tìm việc", "Tuyển thợ"] as const;
export const ALL_AREAS = "Tất cả khu vực";

/**
 * HARD CONSTRAINT (S02-01 Bảng việc làm): keep the card GRID design, but column count must follow the actual
 * content width instead of a device breakpoint. Match the main Jobs grid's
 * auto-fill 18rem minimum in TechBoard, CardGridSkeleton and OwnerBoard.
 */
export const JOB_CARD_GRID_STYLE: CSSProperties = {
  gridTemplateColumns: "repeat(auto-fill, minmax(18rem, 1fr))",
};

export function useFakeLoading(ms = 350) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), ms);
    return () => window.clearTimeout(timer);
  }, [ms]);
  return loading;
}

/** Board filter: kind pill, area, free text over title / name / salon / area. */
export function filterBoard(state: DemoState, posts: JobPost[], kind: string, area: string, query: string) {
  const q = query.trim().toLowerCase();
  return posts.filter((post) => {
    if (kind === "Tìm việc" && post.kind !== "seeking") return false;
    if (kind === "Tuyển thợ" && post.kind !== "hiring") return false;
    if (area !== ALL_AREAS && post.city !== area) return false;
    if (!q) return true;
    const who = post.kind === "hiring" ? salonName(state, post.salonId) : techPublicName(state, post.seekerId);
    return `${post.title} ${who} ${post.city}`.toLowerCase().includes(q);
  });
}

export function BoardFilters(props: {
  kind: string;
  setKind: (value: string) => void;
  area: string;
  setArea: (value: string) => void;
  query: string;
  setQuery: (value: string) => void;
  kinds?: readonly string[];
}) {
  return (
    <div className="grid gap-3 xl:grid-cols-[auto_180px_1fr] xl:items-center">
      <SegmentedPills items={[...(props.kinds ?? FILTERS)]} active={props.kind} onChange={props.setKind} />
      <Select aria-label="Khu vực" value={props.area} onChange={(event) => props.setArea(event.target.value)}>
        <option>{ALL_AREAS}</option>
        {JOB_CITIES.map((city) => <option key={city}>{city}</option>)}
      </Select>
      <label className="relative block">
        <Search className="pointer-events-none absolute left-3 top-3 text-nexoraSubtle" size={18} />
        <Input
          aria-label="Tìm việc làm"
          value={props.query}
          onChange={(event) => props.setQuery(event.target.value)}
          className="pl-10"
          placeholder="Tìm theo tiêu đề, tên hoặc khu vực"
        />
      </label>
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="grid gap-4" style={JOB_CARD_GRID_STYLE}>
      {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-52" />)}
    </div>
  );
}
