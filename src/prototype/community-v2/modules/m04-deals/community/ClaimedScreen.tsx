import { CheckCircle2, Download, Mail, Smartphone, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button, Modal } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { COLOR_GRADIENT, conditionLine, offerHeadline } from "../logic/domain";
import { dealPath, useSalonName } from "../ui/hooks";
import { DealDetailBody } from "./DealDetailScreen";

function SaveOption({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 text-left
        text-sm font-semibold hover:bg-nexoraSurfaceMuted`}
  >
      <span className="text-nexoraBrand">{icon}</span>
      {label}
    </button>
  );
}

/** S04-04 — popup over the deal detail. The condition line is verbatim from doc 04 flow 2 step 3. */
export function ClaimedScreen() {
  const { dealId = "" } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const salonName = useSalonName();
  const p = useStore((s) => s.promotions.find((x) => x.id === dealId));
  const coupon = useStore((s) => {
    const wanted = params.get("coupon");
    return s.coupons.find((c) =>
      wanted ? c.id === wanted : c.promotionId === dealId && c.ownerId === s.currentPersonId,
    );
  });
  const close = () => navigate(dealPath(`/${dealId}`));
  const open = Boolean(p && coupon);

  return (
    <>
      <DealDetailBody dealId={dealId} />
      <Modal open={open} onClose={close} title="🎟️ Đã lấy coupon!">
        {p && coupon && (
          <div className="space-y-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-nexoraSuccess">
              <CheckCircle2 size={18} /> Đã tự lưu vào Ví NEXORA.
            </p>
            <div className="overflow-hidden rounded-xl border border-nexoraBorder">
              <div className={`bg-gradient-to-br p-4 text-white ${COLOR_GRADIENT[p.color]}`}>
                <p className="text-xs font-semibold text-white/85">{salonName(p.salonId)}</p>
                <p className="font-bold">{p.title}</p>
                <p className="text-2xl font-extrabold">{offerHeadline(p)}</p>
              </div>
              <div className="border-t border-dashed border-nexoraBorder bg-white p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-nexoraSubtle">Mã coupon</p>
                <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-nexoraText">{coupon.code}</p>
              </div>
            </div>
            <p
              className={`rounded-lg border-l-4 border-nexoraBrand bg-nexoraBrandSoft/60 p-3 text-sm leading-relaxed
                text-nexoraText`}
            >
              {conditionLine(p, coupon)}
            </p>
            <div>
              <p className="mb-2 text-sm font-bold">Lưu thêm</p>
              <div className="grid grid-cols-2 gap-2">
                <SaveOption icon={<Wallet size={18} />} label="Apple Wallet"
                  onClick={() => toast("Apple Wallet · bản mẫu — cần tài khoản nhà phát triển Apple")} />
                <SaveOption icon={<Wallet size={18} />} label="Google Wallet"
                  onClick={() => toast("Google Wallet · bản mẫu — cần tài khoản nhà phát triển Google")} />
                <SaveOption icon={<Download size={18} />} label="Tải PNG"
                  onClick={() => toast(`Đã tải ảnh ${coupon.code}.png (có QR) · bản mẫu`)} />
                <SaveOption icon={<Mail size={18} />} label="Gửi SMS/Email"
                  onClick={() => toast("Đã gửi link · người nhận mở link → nhập SĐT → vào ví (bản mẫu)")} />
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button variant="gradient" className="flex-1" onClick={() => navigate(dealPath(`/coupon/${coupon.id}`))}>
                <Smartphone size={16} className="mr-1 inline" /> Xem mã tại quầy
              </Button>
              <Button variant="secondary"
                className={`flex-1`}
                onClick={() => navigate(dealPath(`/wallet?highlight=${coupon.id}`))}>
                Mở Ví coupon
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
