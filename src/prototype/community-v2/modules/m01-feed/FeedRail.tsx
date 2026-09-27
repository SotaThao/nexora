import { Gift, Plus, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, SponsoredBadge } from "../../components";
import { useStore } from "../../store";
import { useViewer, isMember } from "./data";
import { ROUTES } from "./constants";
import { useJoinToggle } from "./useJoinToggle";

function SuggestedGroups() {
  const groups = useStore((s) => s.groups);
  const { key } = useViewer();
  const join = useJoinToggle();
  const suggestions = groups.filter((group) => group.kind !== "feed" && !isMember(group, key)).slice(0, 4);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold">
          <UsersRound size={18} className="text-nexoraBrand" /> Nhóm gợi ý
        </h3>
        <Link to={ROUTES.groups} className="text-sm font-semibold text-nexoraBrand">Xem tất cả</Link>
      </div>
      {suggestions.length === 0 && <p className="mt-3 text-sm text-nexoraMuted">Bạn đã tham gia mọi nhóm.</p>}
      <ul className="mt-3 space-y-3">
        {suggestions.map((group) => (
          <li key={group.id} className="flex items-center gap-3">
            <Link to={ROUTES.group(group.id)} className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-nexoraText">{group.name}</p>
              <p className="text-xs text-nexoraSubtle">
                {group.kind === "market" ? "🛍️ Chợ" : "👥 Cộng đồng"}
                · {group.members.toLocaleString("vi-VN")} thành viên
              </p>
            </Link>
            <Button
              variant="secondary"
              className="shrink-0 px-3"
              onClick={() => join(group)}
              aria-label={`Tham gia ${group.name}`}
            >
              <Plus size={16} />
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** Contract 2 — reads only id, title, salonId, sponsored from promotions (M04 owns them). */
function NearbyDeals() {
  const promotions = useStore((s) => s.promotions);
  const salons = useStore((s) => s.salons);
  const deals = [...promotions].sort((a, b) => Number(Boolean(b.sponsored)) - Number(Boolean(a.sponsored))).slice(0, 3);

  return (
    <Card className="p-4">
      <h3 className="flex items-center gap-2 font-bold">
        <Gift size={18} className="text-nexoraBrand" /> Deal gần bạn
      </h3>
      <ul className="mt-3 space-y-2">
        {deals.map((deal) => (
          <li key={deal.id}>
            <Link
              to={ROUTES.deal(deal.id)}
              className="block rounded-lg border border-nexoraBorder p-3 hover:border-nexoraBrand/40
                hover:bg-nexoraSurfaceMuted"
            >
              {deal.sponsored && <div className="mb-1.5"><SponsoredBadge /></div>}
              <p className="text-sm font-semibold text-nexoraText">{deal.title}</p>
              <p className="mt-0.5 text-xs text-nexoraSubtle">
                {salons.find((salon) => salon.id === deal.salonId)?.name}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function FeedRail() {
  return (
    <div className="space-y-4">
      <SuggestedGroups />
      <NearbyDeals />
    </div>
  );
}
