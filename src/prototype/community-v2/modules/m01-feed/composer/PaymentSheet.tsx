import { useEffect, useState } from "react";
import { CreditCard, Loader2, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, MoneyTag, Sheet, Toggle } from "../../../components";
import { useStore } from "../../../store";
import { publishDraft } from "../../../store/slices/m01";
import { BOOST_PLANS, COPY, ROUTES } from "../constants";
import { groupName, useDraft, useViewer } from "../data";
import { Notice } from "../ui";
import { useToast } from "../toast";

const PAYMENT_FAILED = "Thanh toán không thành công — bài chưa được đăng. Bản nháp vẫn được giữ, bạn có thể thử lại.";

/** S01-10 · mock payment for Nổi bật (business accounts only). */
export function PaymentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const draft = useDraft();
  const groups = useStore((s) => s.groups);
  const { isBusiness } = useViewer();
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [status, setStatus] = useState<"idle" | "paying" | "failed">("idle");
  const plan = BOOST_PLANS.find((item) => item.days === draft.boostDays) ?? BOOST_PLANS[1];

  useEffect(() => {
    if (!open) setStatus("idle");
  }, [open]);

  const pay = () => {
    setStatus("paying");
    window.setTimeout(() => {
      if (simulateFailure) {
        setStatus("failed");
        return;
      }
      navigate(ROUTES.feed);
      window.setTimeout(() => {
        if (publishDraft()) toast(COPY.toastFeatured(plan.days, plan.price), "success");
      }, 0);
    }, 700);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Thanh toán Nổi bật">
      {!isBusiness || draft.plan !== "featured" ? (
        <div className="space-y-4">
          <Notice tone="warning">{COPY.featuredLocked}</Notice>
          <Button variant="secondary" className="w-full" onClick={onClose}>← Quay lại bước 3</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <dl className="divide-y divide-nexoraRule rounded-xl border border-nexoraBorder text-sm">
            <div className="flex justify-between gap-3 p-3">
              <dt className="text-nexoraMuted">Gói</dt>
              <dd className="font-semibold">⭐ Nổi bật {plan.days} ngày</dd>
            </div>
            <div className="flex justify-between gap-3 p-3">
              <dt className="text-nexoraMuted">Ghim tại</dt>
              <dd className="text-right font-semibold">
                {draft.destinations.map((id) => groupName(groups, id)).join(", ")}
              </dd>
            </div>
            <div className="flex justify-between gap-3 p-3">
              <dt className="text-nexoraMuted">Phương thức</dt>
              <dd className="inline-flex items-center gap-1.5 font-semibold">
                {draft.payMethod === "wallet" ? <Wallet size={16} /> : <CreditCard size={16} />}
                {draft.payMethod === "wallet" ? "Ví NEXORA" : "Thẻ •••• 4242"}
              </dd>
            </div>
            <div className="flex justify-between gap-3 p-3 text-base">
              <dt className="font-semibold">Tổng</dt>
              <dd className="font-bold"><MoneyTag>${plan.price}</MoneyTag></dd>
            </div>
          </dl>
          <p className="text-xs text-nexoraSubtle">
            Giá mẫu — Brian chốt giá thật, thuế & hoá đơn. Bài sẽ gắn nhãn “⭐ Được tài trợ”.
          </p>

          {status === "failed" && <Notice tone="danger">{PAYMENT_FAILED}</Notice>}

          <div className="rounded-xl border border-dashed border-nexoraBorder bg-nexoraSurfaceMuted/60">
            <Toggle checked={simulateFailure} onChange={setSimulateFailure} label="Mô phỏng lỗi thanh toán" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={onClose} disabled={status === "paying"}>Huỷ</Button>
            <Button variant="gradient" onClick={pay} disabled={status === "paying"}>
              {status === "paying" ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Đang xử lý…
                </span>
              ) : status === "failed" ? `Thử lại · $${plan.price}` : `Thanh toán $${plan.price}`}
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
