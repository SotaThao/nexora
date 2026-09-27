import { Copy, ExternalLink, Printer } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Card, EmptyState, Select } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { COLOR_GRADIENT, POS_SALON_ID, fmtDate, offerHeadline, programState, publicLink } from "../logic/domain";
import { QrCode } from "../ui/QrCode";
import { posPath, useSalonName } from "../ui/hooks";
import { PosFrame, ProgramStateBadge } from "../ui/parts";

const STEPS = [
  "Mở camera điện thoại, quét mã QR",
  "Nhập số điện thoại của bạn — không cần cài app",
  "Coupon vào Ví NEXORA · lần tới chỉ cần đọc SĐT lúc check-in",
];

/** S04-14 — A5 counter poster preview: offer, QR, nexora.link/c/<id>, 3 steps. */
export function PosterScreen() {
  const { promotionId = "" } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const salonName = useSalonName();
  const promotions = useStore((s) => s.promotions);
  const coupons = useStore((s) => s.coupons);
  const mine = promotions.filter((p) => p.salonId === POS_SALON_ID);
  const p = mine.find((x) => x.id === promotionId);
  const link = publicLink(promotionId);

  const copy = () => {
    try {
      void navigator.clipboard?.writeText(`https://${link}`);
    } catch {
      /* clipboard is optional in the demo */
    }
    toast(`Đã sao chép ${link}`);
  };

  return (
    <PosFrame crumb="Link & QR tại quầy" title="QR tại quầy · poster A5"
      subtitle="Dán tại quầy hoặc in tờ rơi — khách quét, nhập SĐT, coupon vào ví, POS tạo hồ sơ khách.">
      {!p ? (
        <EmptyState title="Không tìm thấy chương trình" body="Chọn chương trình từ danh sách Chương trình." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex justify-center rounded-flox-cards bg-nexoraSurfaceMuted p-4 sm:p-8">
            <article
              className={`flex w-full sm:aspect-[148/210] max-w-[420px] flex-col overflow-hidden rounded-md bg-white
                shadow-premium`}
            >
              <div className={`bg-gradient-to-br px-6 pb-5 pt-6 text-white ${COLOR_GRADIENT[p.color]}`}>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">{salonName(p.salonId)}</p>
                <p className="mt-2 text-4xl font-extrabold leading-none">{p.emoji} {offerHeadline(p)}</p>
                <p className="mt-2 text-lg font-bold leading-snug">{p.title}</p>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-4">
                <QrCode seed={link} label={`QR ${link}`} className="aspect-square w-[52%] min-w-[140px]" />
                <p className="font-mono text-sm font-bold text-nexoraText">{link}</p>
              </div>
              <ol className="space-y-1.5 border-t border-dashed border-nexoraBorder px-6 py-4 text-[13px] leading-snug">
                {STEPS.map((s, i) => (
                  <li key={s} className="flex gap-2">
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full bg-nexoraBrand text-[11px]
                        font-bold text-white`}
                      >{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <p className="bg-nexoraSurfaceMuted px-6 py-2 text-[10px] text-nexoraMuted">
                {p.condition} · HSD {fmtDate(p.expiresAt)} · điều kiện đầy đủ hiện khi quét · POS NEXORA
              </p>
            </article>
          </div>
          <Card className="h-fit space-y-4 p-5">
            <div>
              <label htmlFor="poster-program" className="mb-1.5 block text-sm font-semibold">Chương trình</label>
              <Select id="poster-program" value={p.id}
                onChange={(e) => navigate(posPath(`/promotions/${e.target.value}/qr`), { replace: true })}>
                {mine.map((x) => <option key={x.id} value={x.id}>{x.emoji} {x.title}</option>)}
              </Select>
              <div className="mt-2"><ProgramStateBadge state={programState(p, coupons)} /></div>
            </div>
            {!p.channels.includes("QR") && (
              <p className="rounded-lg bg-nexoraWarning/10 p-3 text-sm">
                Kênh “QR tại quầy” chưa bật cho chương trình này — lượt lấy qua QR vẫn trừ chung, báo cáo ghi kênh QR.
              </p>
            )}
            <div className="grid gap-2">
              <Button variant="gradient" onClick={() => toast("🖨️ Đã gửi poster A5 tới máy in · bản mẫu")}>
                <Printer size={16} className="mr-1 inline" /> In poster A5
              </Button>
              <Button variant="secondary" onClick={copy}><Copy size={16}
                className={`mr-1 inline`}
                /> Sao chép link</Button>
              <Button variant="secondary" onClick={() => navigate(`/community-v2/c/${p.id}`)}>
                <ExternalLink size={16} className="mr-1 inline" /> Mở trang khách {link}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PosFrame>
  );
}
