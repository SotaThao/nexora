import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Sheet } from "../../../components";
import { useToast } from "../ui/toast";
import type { Coupon, Promotion } from "../../../store/types";
import { startAds, toggleCommunity, togglePause } from "../../../store/slices/m04";
import { money, programState } from "../logic/domain";
import { posPath, useMe } from "../ui/hooks";
import { SampleTag } from "../ui/parts";
import { Pills } from "./formParts";

/** ⏸/▶ · 📣/🔕 · 🖨️ · 🚀 — toasts verbatim from doc 04 flow 5. */
type Props = { p: Promotion; coupons: Coupon[]; compact?: boolean };
export function ProgramActions({ p, coupons, compact = false }: Props) {
  const toast = useToast();
  const navigate = useNavigate();
  const { role } = useMe();
  const [adsOpen, setAdsOpen] = useState(false);
  const [budget, setBudget] = useState(20);
  const [days, setDays] = useState<3 | 7 | 14>(7);
  const [radius, setRadius] = useState<5 | 10 | 25>(10);
  const state = programState(p, coupons);
  const onCommunity = p.channels.includes("Community");
  const size = compact ? "!min-h-11 !px-3 text-xs" : "";

  const pause = () => {
    const next = togglePause(p.id);
    const paused = "Đã dừng — mọi kênh ngừng nhận, POS ngừng đề xuất";
    toast(next === "paused" ? paused : "▶ Đã chạy lại — mọi kênh nhận lại coupon", "success");
  };
  const community = () => {
    const on = toggleCommunity(p.id);
    toast(
      on ? "📣 Đã đăng lên Community" : "Đã gỡ khỏi Community — coupon khách đã lấy vẫn dùng được tới hạn",
      "success",
    );
  };
  const ads = () => {
    if (role !== "owner") {
      toast("Tài khoản thợ không chạy được quảng cáo — chỉ tài khoản doanh nghiệp", "danger");
      return;
    }
    if (state !== "active") {
      toast("Chỉ chạy quảng cáo cho chương trình đang chạy", "danger");
      return;
    }
    setAdsOpen(true);
  };

  return (
    <div className="flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
      <Button variant="secondary" className={size} onClick={pause} disabled={state === "expired"}
        title={state === "expired" ? "Chương trình đã hết hạn" : undefined}>
        {p.status === "paused" ? "▶ Chạy lại" : "⏸ Dừng"}
      </Button>
      <Button variant="secondary" className={size} onClick={community}>
        {onCommunity ? "🔕 Gỡ khỏi Community" : "📣 Đăng lên Community"}
      </Button>
      <Button variant="secondary" className={size} onClick={() => navigate(posPath(`/promotions/${p.id}/qr`))}>
        🖨️ Link & QR
      </Button>
      <Button variant="secondary" className={size} onClick={ads}>
        {p.sponsored ? "🚀 Đang quảng cáo" : "🚀 Quảng cáo"}
      </Button>
      <Sheet open={adsOpen} onClose={() => setAdsOpen(false)} title="🚀 Chạy quảng cáo">
        <div className="space-y-4">
          <p
            className={`text-sm text-nexoraMuted`}
            >Ghim “{p.title}” đầu Deal gần bạn & Bảng tin trong bán kính, nhãn “⭐ Được tài trợ”.</p>
          <div>
            <p className="mb-1.5 text-sm font-semibold">Ngân sách / ngày</p>
            <Pills<number> value={budget} onChange={setBudget} options={[[10, "$10"], [20, "$20"], [35, "$35"]]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold">Số ngày</p>
            <Pills<3 | 7 | 14> value={days} onChange={setDays}
              options={[[3, "3 ngày"], [7, "7 ngày"], [14, "14 ngày"]]} />
          </div>
          <div>
            <p className="mb-1.5 text-sm font-semibold">Bán kính</p>
            <Pills<5 | 10 | 25> value={radius} onChange={setRadius}
              options={[[5, "5 mi"], [10, "10 mi"], [25, "25 mi"]]} />
          </div>
          <p
            className={`flex items-center gap-2 text-sm`}
            >💰 Tổng <b>{money(budget * days)}</b> <SampleTag>GIÁ MẪU</SampleTag></p>
          <Button variant="gradient" className="w-full" onClick={() => {
            startAds(p.id, { budgetPerDay: budget, days, radiusMi: radius });
            setAdsOpen(false);
            toast(`🚀 Đã bật quảng cáo · ${money(budget)}/ngày × ${days} ngày · ${radius} mi`, "success");
          }}>
            Thanh toán & chạy quảng cáo
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
