import { useState } from "react";
import { CheckCircle2, Lock, RotateCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Input } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import type { Coupon } from "../../../store/types";
import { claimOnPublicPage } from "../../../store/slices/m04";
import {
  AUDIENCE_LABEL, COLOR_GRADIENT, fmtDateTime, formatPhone, normalizePhone, offerHeadline, perPersonText, publicLink,
} from "../logic/domain";
import { useSalonName } from "../ui/hooks";

/** S04-08 — what a client without the app sees after scanning the counter QR: mobile web, not the app shell. */
export function PublicClaimScreen() {
  const { couponId: promotionId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const salonName = useSalonName();
  const p = useStore((s) => s.promotions.find((x) => x.id === promotionId));
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ coupon: Coupon; existing: boolean } | null>(null);

  const submit = () => {
    const digits = normalizePhone(phone);
    if (digits.length < 7) {
      setError("Nhập SĐT hợp lệ");
      return;
    }
    const result = claimOnPublicPage(promotionId, digits);
    if (result.kind === "error") {
      setError(result.message);
      return;
    }
    setError(null);
    setDone({ coupon: result.coupon, existing: result.kind === "existing" });
  };

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-nexoraSurfaceMuted lg:pt-10">
      <div
        className={`mx-auto min-h-full max-w-md bg-nexoraCanvas lg:my-10 lg:min-h-0 lg:overflow-hidden
          lg:rounded-2xl lg:border lg:border-nexoraBorder lg:shadow-premium`}
      >
        <div
          className={`sticky top-0 z-10 flex items-center gap-2 border-b border-nexoraBorder bg-white px-3 py-2
            pr-20 lg:static lg:pr-3`}
        >
          <div
            className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-nexoraSurfaceMuted
              px-3 text-sm text-nexoraMuted`}
          >
            <Lock size={13} /> <span className="truncate">{publicLink(promotionId)}</span>
          </div>
          <RotateCw size={16} className="text-nexoraSubtle" aria-hidden />
        </div>

        {!p ? (
          <p className="p-8 text-center text-nexoraMuted">Link coupon không còn hiệu lực.</p>
        ) : (
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <span
                className={`grid size-11 place-items-center rounded-xl bg-gradient-to-br from-nexoraElectric
                  to-nexoraViolet font-bold text-white`}
              >
                {salonName(p.salonId).slice(0, 1)}
              </span>
              <div>
                <p className="font-bold">{salonName(p.salonId)}</p>
                <p className="text-xs text-nexoraMuted">tặng bạn một coupon · qua NEXORA</p>
              </div>
            </div>
            <div className={`rounded-2xl bg-gradient-to-br p-5 text-white shadow-nexora-card ${
              COLOR_GRADIENT[p.color]}`}>
              <p className="text-4xl">{p.emoji}</p>
              <p className="mt-2 text-3xl font-extrabold">{offerHeadline(p)}</p>
              <p className="mt-1 font-semibold">{p.title}</p>
            </div>
            <ul className="space-y-1 text-sm text-nexoraMuted">
              <li>• {p.condition}</li>
              <li>• Áp dụng cho: {AUDIENCE_LABEL[p.audience]} · {perPersonText(p)}</li>
              <li>• HSD {fmtDateTime(p.expiresAt)}</li>
            </ul>

            {done ? (
              <div className="rounded-2xl border border-nexoraSuccess/30 bg-white p-5 text-center">
                <CheckCircle2 className="mx-auto text-nexoraSuccess" size={36} />
                <p className="mt-2 text-xl font-bold">{done.existing ? "Mã đã có trong ví" : "Đã vào ví"}</p>
                <p className="mt-1 font-mono text-lg font-bold tracking-wider">{done.coupon.code}</p>
                <p className="mt-2 text-sm text-nexoraMuted">
                  Tới tiệm chỉ cần đọc SĐT <b className="text-nexoraText">{formatPhone(phone)}</b> lúc check-in —
                  dùng trước {fmtDateTime(done.coupon.holdUntil)}.
                </p>
                <div className="mt-4 rounded-xl bg-nexoraSurfaceMuted p-4 text-left">
                  <p className="text-sm font-bold">Tải app NEXORA để xem ví & deal gần bạn</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <Button variant="secondary" onClick={() => toast("Mở App Store · bản mẫu")}>App Store</Button>
                    <Button variant="secondary" onClick={() => toast("Mở Google Play · bản mẫu")}>Google Play</Button>
                  </div>
                </div>
              </div>
            ) : (
              <form
                className={`rounded-2xl bg-white p-5 shadow-nexora-card`}
                onSubmit={(e) => { e.preventDefault(); submit(); }}>
                <label htmlFor="public-phone" className="text-sm font-bold">Nhập số điện thoại để nhận coupon</label>
                <Input id="public-phone" type="tel" inputMode="tel" autoComplete="tel" className="mt-2"
                  value={phone} placeholder="(713) 555-0000"
                    onChange={(e) => { setPhone(e.target.value); setError(null); }} />
                {error && <p role="alert" className="mt-2 text-sm font-semibold text-nexoraDanger">{error}</p>}
                <Button type="submit" variant="gradient" className="mt-3 w-full">🎟️ Nhận coupon vào ví</Button>
                <p
                  className={`mt-2 text-xs text-nexoraSubtle`}
                  >Không cần cài app. SĐT dùng để tiệm nhận ra bạn lúc check-in.</p>
              </form>
            )}
          </div>
        )}
        <div className="border-t border-nexoraBorder p-4 text-center">
          <button type="button" onClick={() => navigate(-1)}
            className={`min-h-11 text-xs font-semibold text-nexoraSubtle underline`}
          >
            Bản mẫu · thoát trang khách
          </button>
        </div>
      </div>
    </div>
  );
}
