import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarClock, MapPin } from "lucide-react";
import { Button, Checkbox, Modal, MoneyTag } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useCommunityGate } from "../m00-foundation/gates";
import { getState, useStore } from "../../store";
import { applyToShift, currentTechId, selectClock } from "../../store/slices/m03";
import type { Shift } from "../../store/types";
import { money, shiftWhen } from "./format";
import { CHECKIN_OPENS_MINUTES, depositFor } from "./rules";
import { HoldPanel, KindBadge, SHIFT_PATHS, TECH_MODE_LABEL } from "./ShiftShared";

export const AGREE_LABEL = "Tôi đã đọc và đồng ý chính sách huỷ & vắng mặt của ca này.";

/** S03-02 — deposit + mandatory policy agreement before taking / applying for a shift. */
export function ApplyShiftModal({ shift, onClose }: { shift: Shift | undefined; onClose: () => void }) {
  const policy = useStore((state) => state.shiftPolicy);
  const clock = useStore(selectClock);
  const salon = useStore((state) => state.salons.find((item) => item.id === shift?.salonId));
  const [agreed, setAgreed] = useState(false);
  const { requireAccount } = useCommunityGate();
  const toast = useShiftToast();
  const navigate = useNavigate();

  useEffect(() => setAgreed(false), [shift?.id]);
  if (!shift) return null;

  const instant = shift.mode === "instant";
  const deposit = depositFor(shift.pay, policy);
  const lateLoss = Math.round((deposit * policy.techLateLossPct) / 100);
  const noShowLoss = Math.round((deposit * policy.noShowLossPct) / 100);
  const salonPay = Math.round((shift.pay * policy.salonLatePayPct) / 100);

  const submit = () =>
    requireAccount("nhận ca/ứng tuyển", () => {
      const result = applyToShift(shift.id, currentTechId(getState()));
      if (result === "full") return toast("Ca đã đủ thợ — chọn ca khác nhé", "danger");
      if (result === "exists") return toast("Bạn đã có trong ca này — xem ở “Ca của tôi”", "info");
      const text = result === "locked" ? "🔒 Đã chốt ca — nhớ check-in khi tới tiệm" : "✓ Đã ứng tuyển — chờ tiệm duyệt";
      toast(text, "success");
      navigate(SHIFT_PATHS.mine);
    });

  return (
    <Modal open onClose={onClose} title={instant ? "⚡ Nhận ca & chốt" : "🙋 Ứng tuyển ca"}>
      <div className="space-y-4">
        <div>
          <div className="flex flex-wrap gap-2">
            <KindBadge kind={shift.kind} />
            <span className="text-xs font-semibold text-nexoraMuted">{TECH_MODE_LABEL[shift.mode]}</span>
          </div>
          <p className="mt-2 font-bold text-nexoraText">{shift.title}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-nexoraMuted">
            <MapPin size={14} /> {salon?.name} · {shift.distanceMi} mi
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm text-nexoraMuted">
            <CalendarClock size={14} /> {shiftWhen(shift, clock)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-nexoraBorder p-3">
            <p className="text-xs text-nexoraMuted">Trả công</p>
            <p className="mt-1 text-lg"><MoneyTag>{money(shift.pay)}</MoneyTag></p>
            <p className="text-xs text-nexoraSubtle">+ tips ~{money(shift.tips)} (ngoài hệ thống)</p>
          </div>
          <div className="rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/60 p-3">
            <p className="text-xs text-nexoraMuted">Cọc chốt ca</p>
            <p className="mt-1 text-lg"><MoneyTag>{money(deposit)}</MoneyTag></p>
            <p className="text-xs text-nexoraSubtle">= {policy.depositPct}% tiền công</p>
          </div>
        </div>

        <HoldPanel title={`Cọc chốt ca ${money(deposit)} · tạm giữ`}>
          🔒 Cọc chỉ tạm giữ trên ví NEXORA / thẻ — không trả thẳng cho tiệm. Làm xong hoàn 100%.
        </HoldPanel>

        <div className="rounded-xl border border-nexoraBorder p-4">
          <p className="text-sm font-bold">Chính sách huỷ & vắng mặt của ca này</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-nexoraMuted">
            <li>Huỷ trước {policy.freeCancelHours}h: miễn phí, hoàn 100% cọc.</li>
            <li>
              Đã chốt, huỷ dưới {policy.freeCancelHours}h: mất {policy.techLateLossPct}% cọc
              ({money(lateLoss)}) → chuyển cho tiệm.
            </li>
            <li>
              Không check-in quá {policy.graceMinutes} phút: vắng mặt, mất {policy.noShowLossPct}% cọc
              ({money(noShowLoss)}).
            </li>
            <li>Check-in mở {CHECKIN_OPENS_MINUTES / 60} giờ trước ca · trễ tối đa {policy.graceMinutes} phút.</li>
            <li>
              Tiệm huỷ dưới {policy.freeCancelHours}h: tiệm trả bạn {money(salonPay)} ({policy.salonLatePayPct}% công).
            </li>
          </ul>
          <p className="mt-2 text-xs text-nexoraSubtle">
            Chính sách v{policy.version} · được ghi vào ca của bạn khi đồng ý, không áp hồi tố. Số mẫu.
          </p>
        </div>

        <Checkbox checked={agreed} onChange={(event) => setAgreed(event.target.checked)} label={AGREE_LABEL} />

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Để sau</Button>
          <Button variant="gradient" disabled={!agreed} onClick={submit}>
            {instant ? "Đặt cọc & chốt ca" : "Đặt cọc & ứng tuyển"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
