import { useState } from "react";
import { QrCode as QrIcon, RotateCcw, Smartphone } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, EmptyState, Tabs } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import type { Coupon, Promotion } from "../../../store/types";
import { claimAsCurrent } from "../../../store/slices/m04";
import {
  COLOR_GRADIENT, couponState, fmtDateTime, formatPhone, offerHeadline, type CouponState,
} from "../logic/domain";
import { dealPath, useMe, useNow, useSalonName } from "../ui/hooks";
import { DealsNav, MemberGate, PageTitle } from "../ui/parts";

const TABS: [CouponState, string][] = [["active", "Còn hiệu lực"], ["used", "Đã dùng"], ["returned", "Đã trả lượt"]];
const EMPTY_TITLE: Record<CouponState, string> = {
  active: "Chưa có coupon còn hiệu lực",
  used: "Chưa dùng coupon nào",
  returned: "Không có mã đã trả lượt",
};

type TicketProps = { c: Coupon; p: Promotion; state: CouponState; highlighted: boolean };
function CouponTicket({ c, p, state, highlighted }: TicketProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const salonName = useSalonName();
  const soon = state === "active" && new Date(c.holdUntil).getTime() - Date.now() < 86_400_000;

  const reclaim = () => {
    const result = claimAsCurrent(p.id);
    if (result.kind === "ok") {
      toast(`Đã lấy mã mới ${result.coupon.code} — mã cũ giữ nguyên`, "success");
      navigate(dealPath(`/${p.id}/claimed?coupon=${result.coupon.id}`));
    } else if (result.kind === "existing") {
      navigate(dealPath(`/coupon/${result.coupon.id}`));
    } else {
      toast(result.message, "danger");
    }
  };

  return (
    <article className={`flex overflow-hidden rounded-flox-cards border bg-white shadow-nexora-card ${
      highlighted ? "border-nexoraBrand ring-2 ring-nexoraBrand/20" : "border-nexoraBorder"} ${
        state === "active" ? "" : "opacity-90"}`}>
      <div className={`grid w-20 shrink-0 place-items-center bg-gradient-to-b text-3xl ${
        state === "active" ? COLOR_GRADIENT[p.color] : "from-nexoraSubtle to-nexoraMuted"}`}>
        <span>{p.emoji}</span>
      </div>
      <div className="min-w-0 flex-1 border-l-2 border-dashed border-nexoraBorder p-4">
        <p className="text-xs font-semibold text-nexoraMuted">{salonName(p.salonId)}</p>
        <p className="font-bold leading-snug">{p.title}</p>
        <p className="mt-0.5 text-sm font-semibold text-nexoraBrand">{offerHeadline(p)}</p>
        <p className="mt-1 font-mono text-sm tracking-wider text-nexoraText">{c.code}</p>
        <p className={`mt-1 text-xs ${soon ? "font-semibold text-nexoraDanger" : "text-nexoraMuted"}`}>
          {state === "active" && `Dùng trước ${fmtDateTime(c.holdUntil)} · lấy từ ${c.source}`}
          {state === "used" && `Đã dùng lúc ${fmtDateTime(c.usedAt)}`}
          {state === "returned" && `Hết giữ lượt ${fmtDateTime(c.holdUntil)} — lượt đã trả về kho`}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {state === "active" && (
            <Button onClick={() => navigate(dealPath(`/coupon/${c.id}`))}>
              <QrIcon size={16} className="mr-1 inline" /> Mở mã QR + PIN
            </Button>
          )}
          {state === "returned" && (
            <Button variant="secondary" onClick={reclaim}><RotateCcw size={15}
              className={`mr-1 inline`}
              /> Lấy lại</Button>
          )}
          <Button variant="ghost" onClick={() => navigate(dealPath(`/${p.id}`))}>Xem deal</Button>
        </div>
      </div>
    </article>
  );
}

export function WalletScreen() {
  const now = useNow(15_000);
  const [params] = useSearchParams();
  const { personId, person } = useMe();
  const coupons = useStore((s) => s.coupons);
  const promotions = useStore((s) => s.promotions);
  const byId = new Map(promotions.map((p) => [p.id, p]));
  const [tab, setTab] = useState<CouponState>(() => {
    const hit = coupons.find((c) => c.id === params.get("highlight"));
    return hit ? couponState(hit, byId.get(hit.promotionId)) : "active";
  });
  const mine = coupons
    .filter((c) => c.ownerId === personId && byId.has(c.promotionId))
    .map((c) => ({ c, p: byId.get(c.promotionId), state: couponState(c, byId.get(c.promotionId), now) }));
  const count = (s: CouponState) => mine.filter((x) => x.state === s).length;
  const labels = TABS.map(([s, l]) => `${l} (${count(s)})`);
  const shown = mine.filter((x) => x.state === tab);

  return (
    <div>
      <DealsNav />
      <PageTitle title="🎟️ Ví coupon" subtitle="Mọi coupon bạn lấy từ Community, SMS hay QR tại quầy đều ở đây." />
      <MemberGate what="Ví coupon">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <Tabs items={labels} active={labels[TABS.findIndex(([s]) => s === tab)]}
              onChange={(label) => setTab(TABS[labels.indexOf(label)][0])} />
            <div className="mt-4 grid gap-3 xl:grid-cols-2">
              {shown.map(({ c, p, state }) => (
                <CouponTicket key={c.id} c={c} p={p} state={state} highlighted={params.get("highlight") === c.id} />
              ))}
            </div>
            {!shown.length && (
              <div className="mt-4">
                <EmptyState
                  title={EMPTY_TITLE[tab]}
                  body={tab === "active"
                    ? "Vào Deal gần bạn để lấy coupon — tự lưu vào ví."
                    : "Mã sẽ hiện ở đây khi có thay đổi."}
                />
              </div>
            )}
          </div>
          <Card className="h-fit p-5">
            <p
              className={`flex items-center gap-2 font-bold`}
              ><Smartphone size={18} className="text-nexoraBrand" /> Dùng coupon thế nào?</p>
            <ol className="mt-3 space-y-3 text-sm text-nexoraMuted">
              <li><b
                className={`text-nexoraText`}
                >1 · Tiệm có POS NEXORA:</b> chỉ cần đọc SĐT lúc check-in — POS tự thấy coupon và áp.</li>
              <li><b
                className={`text-nexoraText`}
                >2 · Tiệm chưa có check-in:</b> mở mã, đưa QR + PIN động (đổi mỗi 30 giây).</li>
            </ol>
            {person?.phone && (
              <p className="mt-4 rounded-lg bg-nexoraSurfaceMuted p-3 text-sm">
                SĐT tài khoản: <b>{formatPhone(person.phone)}</b>
                <span
                  className={`block text-xs text-nexoraMuted`}
                  >SĐT là khoá — POS ghép ví với hồ sơ khách theo số này.</span>
              </p>
            )}
          </Card>
        </div>
      </MemberGate>
    </div>
  );
}
