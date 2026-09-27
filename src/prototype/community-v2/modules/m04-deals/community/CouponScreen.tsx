import { ArrowLeft, RotateCcw, Sun } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, EmptyState } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { claimAsCurrent, expireHoldNow } from "../../../store/slices/m04";
import { WINDOW_MS, pinFor, secondsLeftInWindow, windowIndex } from "../logic/dynamicCode";
import { couponState, fmtDateTime, offerHeadline } from "../logic/domain";
import { QrCode } from "../ui/QrCode";
import { dealPath, useNow, useSalonName } from "../ui/hooks";

function CountdownRing({ seconds }: { seconds: number }) {
  const r = 26;
  const circumference = 2 * Math.PI * r;
  const fraction = seconds / (WINDOW_MS / 1000);
  return (
    <svg viewBox="0 0 64 64" className="size-16" role="img" aria-label={`PIN đổi sau ${seconds} giây`}>
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-nexoraSurfaceMuted" />
      <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
        className={seconds <= 5 ? "stroke-nexoraDanger" : "stroke-nexoraBrand"}
        strokeDasharray={circumference} strokeDashoffset={circumference * (1 - fraction)}
        transform="rotate(-90 32 32)" style={{ transition: "stroke-dashoffset 1s linear" }} />
      <text x="32" y="37" textAnchor="middle" className="fill-nexoraText text-[15px] font-bold">{seconds}s</text>
    </svg>
  );
}

/** S04-06 — full-screen code for counters without check-in: QR rotates every 30 s + 6-digit PIN. */
export function CouponScreen() {
  const { couponId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const now = useNow(1000);
  const salonName = useSalonName();
  const coupon = useStore((s) => s.coupons.find((c) => c.id === couponId));
  const p = useStore((s) => s.promotions.find((x) => x.id === coupon?.promotionId));
  const mine = useStore((s) => coupon?.ownerId === s.currentPersonId);

  if (!coupon || !p || !mine) {
    return <EmptyState title="Không tìm thấy mã trong ví của bạn" body="Mở Ví coupon để chọn mã cần dùng." />;
  }
  const state = couponState(coupon, p, now);
  const w = windowIndex(now);
  const pin = pinFor(coupon.code, w);
  const seconds = secondsLeftInWindow(now);

  const reclaim = () => {
    const result = claimAsCurrent(p.id);
    if (result.kind === "error") toast(result.message, "danger");
    else navigate(dealPath(`/${p.id}/claimed?coupon=${result.coupon.id}`));
  };

  return (
    <div className="fixed inset-0 z-[45] overflow-y-auto bg-white lg:bg-nexoraCanvas lg:pt-10">
      <div
        className={`mx-auto flex min-h-full max-w-md flex-col px-5 pb-8 pt-3 lg:my-8 lg:min-h-0 lg:rounded-2xl
          lg:bg-white lg:shadow-premium`}
      >
        <div className="flex items-center gap-2 pr-16 lg:pr-0">
          <button type="button" onClick={() => navigate(dealPath("/wallet"))} aria-label="Đóng"
            className="grid size-11 place-items-center rounded-full hover:bg-nexoraSurfaceMuted">
            <ArrowLeft size={20} />
          </button>
          <span
            className={`inline-flex items-center gap-1 rounded-full bg-nexoraWarning/10 px-3 py-1 text-xs
              font-semibold`}
          >
            <Sun size={14} /> Độ sáng tối đa
          </span>
        </div>
        <div className="mt-3 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{salonName(p.salonId)}</p>
          <h1 className="mt-1 text-xl font-bold">{p.title}</h1>
          <p className="text-2xl font-extrabold text-nexoraBrand">{offerHeadline(p)}</p>
        </div>

        <div className="relative mx-auto mt-5">
          <QrCode seed={`${coupon.code}|${state === "active" ? w : "void"}`} label={`QR của ${coupon.code}`}
            className={`size-60 border border-nexoraBorder p-2 transition ${
              state === "active" ? "" : "opacity-20 blur-[2px]"}`} />
          {state !== "active" && (
            <div className="absolute inset-0 grid place-items-center">
              <span className="rounded-full bg-nexoraText px-4 py-2 text-sm font-bold text-white">
                {state === "used" ? "Đã dùng" : "Đã trả lượt"}
              </span>
            </div>
          )}
        </div>
        <p className="mt-2 text-center font-mono text-base font-semibold tracking-wider">{coupon.code}</p>

        {state === "active" && (
          <>
            <div className="mt-4 flex items-center justify-center gap-4 rounded-xl bg-nexoraSurfaceMuted p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-nexoraSubtle">PIN động</p>
                <p className="font-mono text-4xl font-bold tracking-[0.2em]">{pin.slice(0, 3)} {pin.slice(3)}</p>
              </div>
              <CountdownRing seconds={seconds} />
            </div>
            <p className="mt-3 text-center text-sm text-nexoraMuted">
              Hạn giữ tới <b className="text-nexoraText">{fmtDateTime(coupon.holdUntil)}</b>
              <span className="block text-xs">QR & PIN đổi mỗi 30 giây — ảnh chụp màn hình không dùng được.</span>
            </p>
            <p className="mt-3 rounded-lg bg-nexoraBrandSoft/60 p-3 text-center text-xs text-nexoraText">
              Tiệm có POS NEXORA? Chỉ cần đọc SĐT lúc check-in, không phải mở mã.
            </p>
            <button type="button" onClick={() => expireHoldNow(coupon.id)}
              className={`mx-auto mt-4 min-h-11 rounded-full border border-dashed border-nexoraBorder px-4 text-xs
                font-semibold text-nexoraMuted`}
            >
              Demo · mô phỏng hết hạn giữ
            </button>
          </>
        )}
        {state === "returned" && (
          <div className="mt-4 rounded-xl bg-nexoraSurfaceMuted p-4 text-center text-sm">
            <p
              className={`font-semibold`}
              >Mã đã hết thời gian giữ lượt ({fmtDateTime(coupon.holdUntil)}) — lượt đã trả về kho.</p>
            <p className="mt-1 text-nexoraMuted">Bạn có thể lấy lại nếu coupon còn lượt.</p>
            <Button className="mt-3" onClick={reclaim}><RotateCcw size={15} className="mr-1 inline" /> Lấy lại</Button>
          </div>
        )}
        {state === "used" && (
          <p className="mt-4 rounded-xl bg-nexoraSurfaceMuted p-4 text-center text-sm">
            Mã đã được dùng lúc {fmtDateTime(coupon.usedAt)} — mỗi mã chỉ dùng 1 lần.
          </p>
        )}
      </div>
    </div>
  );
}
