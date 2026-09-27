import { useState } from "react";
import { Tag } from "lucide-react";
import { Button, Card } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { followKeyword, keywordsOf } from "../../../store/slices/m04";
import { useCommunityGate } from "../../m00-foundation/gates";
import { DealCard } from "../ui/DealCard";
import { DealsNav, PageTitle } from "../ui/parts";
import { useCommunityDeals } from "./NearbyScreen";

const ICON: Record<string, string> = {
  Nail: "💅", Tóc: "💇", Mi: "👁️", Spa: "🌿", "Học viện": "🎓", "Thuế & 1099": "🧾", "Nhà cung cấp": "📦",
};

export function CategoriesScreen() {
  const industries = useStore((s) => s.industries);
  const deals = useCommunityDeals();
  const [active, setActive] = useState(industries[0]);
  const { requireAccount } = useCommunityGate();
  const toast = useToast();
  const kw = active.toLowerCase();
  const following = useStore((s) => keywordsOf(s, s.currentPersonId).includes(kw));
  const list = deals
    .filter((p) => p.industry === active)
    .sort((a, b) => Number(Boolean(b.sponsored)) - Number(Boolean(a.sponsored)));

  const follow = () =>
    requireAccount("follow-keyword", () => {
      const result = followKeyword(kw);
      toast(result.error ?? `＋ Đã theo dõi “${kw}” — có deal mới sẽ báo bạn`, result.error ? "danger" : "success");
    });

  return (
    <div>
      <DealsNav />
      <PageTitle
        title="🏷️ Coupon theo ngành"
        subtitle="7 ngành · gồm cả deal Online của đối tác (học viện, thuế, nhà cung cấp)."
      />
      <div role="tablist" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0">
        {industries.map((name) => {
          const count = deals.filter((p) => p.industry === name).length;
          const on = name === active;
          return (
            <button
              key={name}
              role="tab"
              aria-selected={on}
              type="button"
              onClick={() => setActive(name)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold ${
                on ? "bg-nexoraBrand text-white" : "border border-nexoraBorder bg-white text-nexoraMuted"
              }`}
          >
              <span>{ICON[name] ?? "🏷️"}</span>
              {name}
              <span className={`rounded-full px-1.5 text-xs ${on ? "bg-white/20" : "bg-nexoraSurfaceMuted"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {list.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => <DealCard key={p.id} promotion={p} />)}
        </div>
      ) : (
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Tag className="mx-auto text-nexoraBrand" />
          <p className="mt-3 font-bold">Chưa có coupon ngành {active}</p>
          <p className="mt-1 text-sm text-nexoraMuted">
            Theo dõi từ khoá để được báo ngay khi có tiệm phát hành deal mới.
          </p>
          <Button className="mt-4" variant="secondary" onClick={follow} disabled={following}>
            {following ? `✓ Đang theo dõi “${kw}”` : `＋ Theo dõi “${kw}”`}
          </Button>
        </Card>
      )}
    </div>
  );
}
