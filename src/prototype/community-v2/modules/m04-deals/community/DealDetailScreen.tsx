import { useState } from "react";
import { ArrowLeft, Heart, MessageCircle, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, SponsoredBadge } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { claimAsCurrent, toggleWish, wishlistOf } from "../../../store/slices/m04";
import { useCommunityGate } from "../../m00-foundation/gates";
import {
  AUDIENCE_LABEL, COLOR_GRADIENT, OFFER_TYPE_LABEL, couponState, fmtDateTime, offerHeadline, perPersonText,
  programState, remainingSlots,
} from "../logic/domain";
import { DistanceText, ExpiryChip } from "../ui/DealCard";
import { dealPath, useMe, useNow, useSalonName } from "../ui/hooks";
import { DealsNav, Fact, ProgramStateBadge } from "../ui/parts";

/** S04-03 — shared with S04-04, which renders the "Đã lấy coupon!" popup on top of it. */
export function DealDetailBody({ dealId }: { dealId: string }) {
  const navigate = useNavigate();
  const toast = useToast();
  const now = useNow(30_000);
  const salonName = useSalonName();
  const { requireAccount } = useCommunityGate();
  const { personId, isGuest } = useMe();
  const p = useStore((s) => s.promotions.find((x) => x.id === dealId));
  const coupons = useStore((s) => s.coupons);
  const salon = useStore((s) => s.salons.find((x) => x.id === p?.salonId));
  const saved = useStore((s) => wishlistOf(s, s.currentPersonId).includes(dealId));
  const [error, setError] = useState<string | null>(null);

  if (!p) return <EmptyState title="Không tìm thấy deal" body="Deal có thể đã bị gỡ khỏi Community." />;
  const remaining = remainingSlots(p, coupons, now);
  const state = programState(p, coupons, now);
  const mine = coupons.find(
    (c) => c.ownerId === personId && c.promotionId === p.id && couponState(c, p, now) === "active",
  );
  const pct = Math.round((remaining / p.totalSlots) * 100);

  // Doc 04 flow 2 · step 2 — requireAccount replays the claim right after sign-up.
  const claim = () =>
    requireAccount("claim-coupon", () => {
      const result = claimAsCurrent(p.id);
      if (result.kind === "ok") {
        setError(null);
        navigate(dealPath(`/${p.id}/claimed?coupon=${result.coupon.id}`));
      } else if (result.kind === "existing") {
        toast(`Bạn đã có mã ${result.coupon.code} còn hiệu lực — mở Ví coupon`);
        navigate(dealPath(`/wallet?highlight=${result.coupon.id}`));
      } else {
        setError(result.message);
        toast(result.message, "danger");
      }
    });
  const wish = () =>
    requireAccount("wishlist", () => toast(toggleWish(p.id) ? "♡ Đã lưu vào Wish list" : "Đã bỏ khỏi Wish list"));

  const claimPanel = (
    <Card className="p-5">
      <p className="text-sm text-nexoraMuted">{OFFER_TYPE_LABEL[p.offerType]}</p>
      <p className="text-3xl font-extrabold text-nexoraBrand">{offerHeadline(p)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <ExpiryChip promotion={p} now={now} />
        {remaining > 0 ? <Badge tone="success">còn {remaining} lượt</Badge> : <Badge tone="warning">Hết lượt</Badge>}
        {state !== "active" && <ProgramStateBadge state={state} />}
      </div>
      {mine && (
        <p className="mt-3 rounded-lg bg-nexoraSuccess/10 p-3 text-sm text-nexoraText">
          ✓ Bạn đã có mã <b className="font-mono">{mine.code}</b> trong ví · dùng trước {fmtDateTime(mine.holdUntil)}
        </p>
      )}
      {error && <p role="alert"
        className={`mt-3 rounded-lg bg-nexoraDanger/10 p-3 text-sm font-semibold text-nexoraDanger`}
        >{error}</p>}
      <div className="mt-4 hidden gap-2 lg:flex">
        <Button variant="gradient" className="flex-1" onClick={claim}>🎟️ Lấy coupon</Button>
        <Button variant="secondary" onClick={wish} aria-label="Wish list">
          <Heart size={18} className={saved ? "fill-nexoraDanger text-nexoraDanger" : ""} />
        </Button>
      </div>
      <p className="mt-3 flex items-start gap-2 text-xs text-nexoraMuted">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-nexoraSuccess" />
        {isGuest
          ? "Cần tài khoản NEXORA · miễn phí — tạo xong coupon tự vào ví."
          : "Điều kiện coupon hiện đầy đủ ngay khi lấy."}
      </p>
    </Card>
  );

  return (
    <div className="pb-24 lg:pb-0">
      <DealsNav />
      <Link to={dealPath("/nearby")}
        className={`mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-nexoraMuted`}
      >
        <ArrowLeft size={16} /> Deal gần bạn
      </Link>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <div
            className={`rounded-flox-cards bg-gradient-to-br p-6 text-white shadow-nexora-card lg:p-8 ${
              COLOR_GRADIENT[p.color]}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white/85">{salonName(p.salonId)}</p>
                <h1 className="mt-1 text-2xl font-extrabold leading-tight lg:text-3xl">{p.title}</h1>
                <p className="mt-2 text-4xl font-extrabold">{offerHeadline(p)}</p>
              </div>
              <span
                className={`grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl`}
                >{p.emoji}</span>
            </div>
            <p className="mt-4 flex flex-wrap items-center gap-3 text-sm text-white/90">
              <DistanceText promotion={p} />
              {p.sponsored && <span
                className={`rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-nexoraText`}
                >⭐ Được tài trợ</span>}
            </p>
          </div>
          <div className="lg:hidden">{claimPanel}</div>
          <Card className="p-5">
            <h2 className="font-bold">Thông tin ưu đãi</h2>
            <dl className="mt-2">
              <Fact label="Ưu đãi">{OFFER_TYPE_LABEL[p.offerType]} · {offerHeadline(p)}</Fact>
              <Fact label="Điều kiện">{p.condition}</Fact>
              <Fact label="Áp dụng cho">{AUDIENCE_LABEL[p.audience]} <span
                className={`text-nexoraSubtle`}
                >· POS tự kiểm tra</span></Fact>
              <Fact label="Hạn sử dụng">{fmtDateTime(p.expiresAt)}</Fact>
              <Fact label="Mỗi khách">{perPersonText(p)} · mỗi mã dùng 1 lần</Fact>
              <Fact label="Giữ lượt">
                {p.holdDays === null
                  ? "Giữ tới khi chương trình hết hạn"
                  : `${p.holdDays} ngày sau khi lấy — quá hạn lượt tự trả về kho`}
              </Fact>
              <Fact label="Còn lượt">{remaining} / {p.totalSlots}</Fact>
            </dl>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-nexoraSurfaceMuted">
              <div
                className={`h-full rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet`}
                style={{ width: `${pct}%` }} />
            </div>
          </Card>
          <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold">{salon?.name}</p>
              <p
                className={`text-sm text-nexoraMuted`}
                >{salon?.online ? "Đối tác online" : `${salon?.specialty} · ${salon?.city}`}</p>
              <p
                className={`mt-1 text-xs text-nexoraMuted`}
                >Tới tiệm chỉ cần đọc SĐT lúc check-in — POS tự thấy coupon trong ví bạn.</p>
            </div>
            {p.salonId === "kayla-nails" && (
              <Button variant="secondary" onClick={() => navigate("/community-v2/messages/new?to=kayla")}>
                <MessageCircle size={16} className="mr-1 inline" /> Nhắn tiệm
              </Button>
            )}
          </Card>
        </div>
        <div className="hidden lg:block"><div className="sticky top-24">{claimPanel}</div></div>
      </div>
      <div
        className={`fixed inset-x-0 bottom-[68px] z-30 flex gap-2 border-t border-nexoraBorder bg-white p-3
          lg:hidden`}
      >
        <Button variant="secondary" onClick={wish} aria-label="Wish list" className="w-12">
          <Heart size={18} className={saved ? "fill-nexoraDanger text-nexoraDanger" : ""} />
        </Button>
        <Button variant="gradient" className="flex-1" onClick={claim}>🎟️ Lấy coupon</Button>
      </div>
    </div>
  );
}

export function DealDetailScreen() {
  const { dealId } = useParams();
  return <DealDetailBody dealId={dealId ?? ""} />;
}
