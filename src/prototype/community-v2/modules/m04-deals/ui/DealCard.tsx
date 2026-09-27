import { Heart, MapPin, Wifi } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, SponsoredBadge } from "../../../components";
import { useToast } from "./toast";
import { useStore } from "../../../store";
import type { Promotion } from "../../../store/types";
import { toggleWish, wishlistOf } from "../../../store/slices/m04";
import { useCommunityGate } from "../../m00-foundation/gates";
import { COLOR_GRADIENT, OFFER_TYPE_LABEL, daysLeft, offerHeadline, remainingSlots } from "../logic/domain";
import { dealPath, useNow, useSalonName } from "./hooks";

export function ExpiryChip({ promotion, now }: { promotion: Promotion; now?: number }) {
  const days = daysLeft(promotion, now);
  return <Badge tone={days <= 3 ? "danger" : "neutral"}>còn {days} ngày</Badge>;
}

export function DistanceText({ promotion }: { promotion: Promotion }) {
  if (promotion.distanceMi === null) {
    return <span className="inline-flex items-center gap-1"><Wifi size={14} /> Online</span>;
  }
  return <span className="inline-flex items-center gap-1"><MapPin size={14} /> {promotion.distanceMi} mi</span>;
}

type Props = { promotion: Promotion; preview?: boolean; highlighted?: boolean };

/** The Community coupon card — used by S04-01/02/07 and as the live preview in S04-10. */
export function DealCard({ promotion, preview = false, highlighted = false }: Props) {
  const navigate = useNavigate();
  const now = useNow(60_000);
  const salonName = useSalonName();
  const coupons = useStore((s) => s.coupons);
  const saved = useStore((s) => wishlistOf(s, s.currentPersonId).includes(promotion.id));
  const { requireAccount } = useCommunityGate();
  const toast = useToast();
  const remaining = preview ? promotion.totalSlots : remainingSlots(promotion, coupons, now);
  const open = () => !preview && navigate(dealPath(`/${promotion.id}`));

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-flox-cards border bg-nexoraSurface shadow-nexora-card
        transition ${
        highlighted ? "border-nexoraBrand ring-2 ring-nexoraBrand/20" : "border-nexoraBorder"
      } ${preview ? "" : "hover:-translate-y-0.5 hover:shadow-nexora-soft"}`}
  >
      <button
        type="button"
        onClick={open}
        className={`relative min-h-[112px] bg-gradient-to-br p-4 text-left text-white ${
          COLOR_GRADIENT[promotion.color]}`}
    >
        <span className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-white/20 text-xl">
          {promotion.emoji}
        </span>
        <span className="block text-xs font-semibold uppercase tracking-wider text-white/80">
          {OFFER_TYPE_LABEL[promotion.offerType]}
        </span>
        <span className="mt-1 block pr-12 text-2xl font-extrabold leading-tight">{offerHeadline(promotion)}</span>
        <span className="mt-1 block text-xs text-white/85">{salonName(promotion.salonId)}</span>
      </button>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {promotion.sponsored && <span><SponsoredBadge /></span>}
        <button type="button" onClick={open} className="text-left font-bold leading-snug text-nexoraText">
          {promotion.title || "Tiêu đề coupon"}
        </button>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-nexoraMuted">
          <DistanceText promotion={promotion} />
          {promotion.dealFor === "b2b" && <span>Dành cho tiệm & thợ</span>}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <ExpiryChip promotion={promotion} now={now} />
          {remaining > 0 ? <Badge tone="success">còn {remaining} lượt</Badge> : <Badge tone="warning">Hết lượt</Badge>}
          {!preview && (
            <button
              type="button"
              aria-label={saved ? "Bỏ khỏi Wish list" : "Lưu vào Wish list"}
              onClick={() => requireAccount("wishlist", () =>
                toast(toggleWish(promotion.id) ? "♡ Đã lưu vào Wish list" : "Đã bỏ khỏi Wish list"))}
              className={`ml-auto grid size-11 place-items-center rounded-full text-nexoraMuted
                hover:bg-nexoraSurfaceMuted`}
          >
              <Heart size={19} className={saved ? "fill-nexoraDanger text-nexoraDanger" : ""} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
