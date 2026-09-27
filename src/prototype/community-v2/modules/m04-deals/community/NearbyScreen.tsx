import { useMemo, useState } from "react";
import { List, Map as MapIcon, Search, X } from "lucide-react";
import { EmptyState, Select } from "../../../components";
import { useStore } from "../../../store";
import type { Promotion } from "../../../store/types";
import { daysLeft, matchesKeyword, programState, remainingSlots } from "../logic/domain";
import { DealCard } from "../ui/DealCard";
import { DealMap } from "../ui/DealMap";
import { useNow, useSalonName } from "../ui/hooks";
import { DealsNav, PageTitle } from "../ui/parts";

type Sort = "near" | "expiry" | "slots";
type Audience = "all" | "client" | "b2b";
const RADII = [1, 5, 10, 25];
const AUDIENCES: [Audience, string][] = [["all", "Tất cả"], ["client", "Khách hàng"], ["b2b", "Tiệm & thợ"]];
const pill = (on: boolean) =>
  `min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
    on ? "bg-nexoraBrand text-white" : "border border-nexoraBorder bg-white text-nexoraMuted"
  }`;

/** Shown on Community: not paused, not expired, Community channel on. Sold-out stays visible. */
export function useCommunityDeals() {
  const promotions = useStore((s) => s.promotions);
  const coupons = useStore((s) => s.coupons);
  const now = useNow(60_000);
  return useMemo(
    () =>
      promotions.filter((p) => {
        const state = programState(p, coupons, now);
        return p.channels.includes("Community") && state !== "paused" && state !== "expired";
      }),
    [promotions, coupons, now],
  );
}

export function NearbyScreen() {
  const deals = useCommunityDeals();
  const coupons = useStore((s) => s.coupons);
  const salonName = useSalonName();
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(10);
  const [online, setOnline] = useState(false);
  const [audience, setAudience] = useState<Audience>("all");
  const [sort, setSort] = useState<Sort>("near");
  const [salon, setSalon] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const toggleCls = "inline-flex flex-1 items-center justify-center gap-2";

  const filtered = useMemo(() => {
    const base = deals.filter((p) => {
      if (audience !== "all" && p.dealFor !== audience) return false;
      if (query.trim().length && !matchesKeyword(p, salonName(p.salonId), query)) return false;
      if (p.distanceMi === null) return online;
      return p.distanceMi <= radius;
    });
    const key = (p: Promotion) =>
      sort === "near" ? p.distanceMi ?? 999 : sort === "expiry" ? daysLeft(p) : remainingSlots(p, coupons);
    return [...base].sort((a, b) => Number(Boolean(b.sponsored)) - Number(Boolean(a.sponsored)) || key(a) - key(b));
  }, [deals, audience, query, online, radius, sort, coupons, salonName]);

  const inMap = filtered.filter((p) => p.distanceMi !== null);
  const list = salon ? filtered.filter((p) => p.salonId === salon) : filtered;
  const onlineCount = filtered.length - inMap.length;

  const filters = (
    <div className="space-y-3">
      <label className="flex min-h-11 items-center gap-2 rounded-flox-inputs border border-nexoraBorder bg-white px-3">
        <Search size={18} className="text-nexoraSubtle" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm deal: gel-x, pedicure, tên tiệm…"
          className="min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        {query && (
          <button type="button" aria-label="Xoá tìm kiếm" onClick={() => setQuery("")}
            className={`grid size-9 place-items-center`}
          >
            <X size={16} />
          </button>
        )}
      </label>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {RADII.map((mi) => (
          <button key={mi} type="button" className={pill(radius === mi)} onClick={() => setRadius(mi)}>{mi} mi</button>
        ))}
        <button type="button" className={pill(online)} onClick={() => setOnline(!online)}>+ Online</button>
        <span className="mx-1 hidden w-px bg-nexoraBorder lg:block" />
        {AUDIENCES.map(([v, l]) => (
          <button key={v} type="button" className={pill(audience === v)} onClick={() => setAudience(v)}>{l}</button>
        ))}
      </div>
    </div>
  );

  const listBlock = (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-nexoraMuted">
          <b className="text-nexoraText">{list.length}</b> deal
          {salon ? ` tại ${salonName(salon)}` : ` trong ${radius} mi${online ? " + Online" : ""}`}
        </p>
        <Select aria-label="Sắp xếp" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="!w-auto">
          <option value="near">Gần nhất</option>
          <option value="expiry">Sắp hết hạn</option>
          <option value="slots">Sắp hết lượt</option>
        </Select>
      </div>
      {salon && (
        <button type="button" onClick={() => setSalon(null)} className={`${pill(true)} inline-flex items-center gap-2`}>
          Đang xem: {salonName(salon)} <X size={15} />
        </button>
      )}
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {list.map((p) => <DealCard key={p.id} promotion={p} />)}
        </div>
      ) : (
        <EmptyState
          title="Chưa có deal phù hợp"
          body={online ? "Thử tăng bán kính hoặc đổi từ khoá." : "Thử tăng bán kính, bật “+ Online” hoặc đổi bộ lọc."}
        />
      )}
    </div>
  );

  const map = (
    <DealMap deals={inMap} radius={radius} onlineCount={onlineCount} selectedSalon={salon}
      onSelectSalon={setSalon} className="aspect-square w-full" />
  );

  return (
    <div>
      <DealsNav />
      <PageTitle
        title="🔥 Deal gần bạn"
        subtitle="Coupon của các tiệm quanh bạn — lấy trên Community, dùng tại quầy chỉ cần SĐT."
      />
      {filters}
      <div className="mt-3 flex gap-2 lg:hidden">
        <button type="button" className={`${pill(mobileView === "list")} ${toggleCls}`}
          onClick={() => setMobileView("list")}><List size={16} /> Danh sách</button>
        <button type="button" className={`${pill(mobileView === "map")} ${toggleCls}`}
          onClick={() => setMobileView("map")}><MapIcon size={16} /> Bản đồ</button>
      </div>
      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className={`${mobileView === "map" ? "block" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-24">{map}</div>
        </div>
        <div className={`${mobileView === "list" || salon ? "block" : "hidden"} lg:block`}>{listBlock}</div>
      </div>
    </div>
  );
}
