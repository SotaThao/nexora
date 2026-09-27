import { AlertTriangle } from "lucide-react";
import { Badge, Button, Modal, MoneyTag } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useStore } from "../../store";
import { cancelByTech, cancelShiftBySalon, selectClock } from "../../store/slices/m03";
import type { Shift, ShiftApplication } from "../../store/types";
import { money, shiftWhen } from "./format";
import { cancelMatrix, depositFor, quoteSalonCancel, quoteTechCancel } from "./rules";
import { HoldPanel } from "./ShiftShared";

type Cell = "techFree" | "techLate" | "salonFree" | "salonLate";

/** The 2 × 2 matrix (ai huỷ × còn ≥/< N giờ) with this shift's sample amounts; the applicable cell is lit. */
function CancelMatrix({ shift, deposit, active }: { shift: Shift; deposit: number; active: Cell }) {
  const matrix = cancelMatrix(shift, deposit);
  const cell = (key: Cell) => (
    <div
      className={`rounded-lg border p-2.5 text-xs leading-5 ${
        key === active
          ? "border-nexoraBrand bg-nexoraBrandSoft text-nexoraText"
          : "border-nexoraBorder text-nexoraMuted"
      }`}
    >
      {matrix[key]}
    </div>
  );
  return (
    <div>
      <p className="text-sm font-bold">
        Ma trận huỷ ca <span className="font-normal text-nexoraSubtle">· số mẫu</span>
      </p>
      <div className="mt-2 grid grid-cols-[64px_1fr_1fr] gap-2">
        <span />
        <span className="text-xs font-semibold text-nexoraMuted">Còn ≥ {matrix.hours}h</span>
        <span className="text-xs font-semibold text-nexoraMuted">Còn &lt; {matrix.hours}h</span>
        <span className="self-center text-xs font-semibold">Thợ huỷ</span>
        {cell("techFree")}
        {cell("techLate")}
        <span className="self-center text-xs font-semibold">Tiệm huỷ</span>
        {cell("salonFree")}
        {cell("salonLate")}
      </div>
    </div>
  );
}

function Verdict({ late, text }: { late: boolean; text: string }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        late ? "border-nexoraDanger/40 bg-nexoraDanger/5" : "border-nexoraSuccess/40 bg-nexoraSuccess/5"
      }`}
    >
      <Badge tone={late ? "danger" : "success"}>{late ? "Huỷ muộn · có phí" : "Huỷ miễn phí"}</Badge>
      <p className="mt-2 flex gap-2 text-sm leading-6 text-nexoraText">
        {late && <AlertTriangle size={18} className="mt-0.5 shrink-0 text-nexoraDanger" />}
        {text}
      </p>
    </div>
  );
}

/** S03-04 · thợ huỷ. Invited / pending are always free. */
type TechCancelProps = { app?: ShiftApplication; shift?: Shift; onClose: () => void };

export function TechCancelModal({ app, shift, onClose }: TechCancelProps) {
  const clock = useStore(selectClock);
  const toast = useShiftToast();
  if (!app || !shift) return null;
  const quote = quoteTechCancel(app, shift, clock);
  const invite = app.status === "invited";
  const deposit = app.deposit || depositFor(shift.pay, shift.policy);
  const confirm = () => {
    const applied = cancelByTech(app.id);
    if (!applied) return;
    if (invite) toast("Đã từ chối lời mời — miễn phí", "info");
    else if (applied.late) {
      toast(`Đã huỷ ca — mất ${money(applied.amount)} cọc cho tiệm, hoàn ${money(applied.refund)}`, "danger");
    }
    else toast(`Đã huỷ — hoàn 100% cọc ${money(applied.refund)}`, "success");
    onClose();
  };
  const active: Cell = quote.late ? "techLate" : "techFree";
  return (
    <Modal open onClose={onClose} title={invite ? "Từ chối lời mời" : "Huỷ ca"}>
      <div className="space-y-4">
        <div>
          <p className="font-bold">{shift.title}</p>
          <p className="text-sm text-nexoraMuted">{shiftWhen(shift, clock)}</p>
        </div>
        <Verdict late={quote.late} text={invite ? "Miễn phí — bạn chưa đặt cọc cho lời mời này." : quote.text} />
        {!invite && (
          <HoldPanel title={`Cọc đang tạm giữ ${money(app.deposit)}`}>
            {quote.late ? (
              <>Mất <MoneyTag>{money(quote.amount)}</MoneyTag> → tiệm · hoàn <MoneyTag>{money(quote.refund)}</MoneyTag>
                {" "}· độ tin cậy +1 huỷ muộn.</>
            ) : (
              <>Hoàn <MoneyTag>{money(quote.refund)}</MoneyTag> về ví NEXORA / thẻ.</>
            )}
          </HoldPanel>
        )}
        <CancelMatrix shift={shift} deposit={deposit} active={active} />
        <p className="text-xs text-nexoraSubtle">
          Tính theo chính sách v{(app.policy ?? shift.policy).version} đã ghi vào ca lúc bạn đồng ý.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Giữ ca</Button>
          <Button variant="danger" onClick={confirm}>{invite ? "Từ chối lời mời" : "Xác nhận huỷ"}</Button>
        </div>
      </div>
    </Modal>
  );
}

/** S03-04 · tiệm huỷ ca đã có thợ chốt. */
export function SalonCancelModal({ shift, onClose }: { shift?: Shift; onClose: () => void }) {
  const clock = useStore(selectClock);
  const apps = useStore((state) => state.shiftApplications);
  const toast = useShiftToast();
  if (!shift) return null;
  const quote = quoteSalonCancel(shift, apps, clock);
  const confirm = () => {
    const applied = cancelShiftBySalon(shift.id);
    if (!applied) return;
    toast(
      applied.late
        ? `Đã huỷ ca — trả ${money(applied.amount)} cho mỗi thợ đã chốt (${applied.seated} thợ), hoàn cọc thợ`
        : "Đã huỷ ca — hoàn cọc thợ & trả lại toàn bộ tiền công bảo đảm",
      applied.late ? "danger" : "success",
    );
    onClose();
  };
  return (
    <Modal open onClose={onClose} title="Huỷ ca đã có thợ chốt">
      <div className="space-y-4">
        <div>
          <p className="font-bold">{shift.title}</p>
          <p className="text-sm text-nexoraMuted">{shiftWhen(shift, clock)} · {quote.seated} thợ đã chốt</p>
        </div>
        <Verdict late={quote.late} text={quote.text} />
        <HoldPanel title={`Tiền công bảo đảm đang giữ ${money(shift.guarantee)}`}>
          {quote.late ? (
            <>Trả thợ <MoneyTag>{money(quote.amount * quote.seated)}</MoneyTag> · tiệm nhận lại{" "}
              <MoneyTag>{money(quote.refund)}</MoneyTag>. Thợ hoàn đủ cọc.</>
          ) : (
            <>Tiệm nhận lại <MoneyTag>{money(shift.guarantee)}</MoneyTag>. Thợ hoàn đủ cọc.</>
          )}
        </HoldPanel>
        <CancelMatrix
          shift={shift}
          deposit={depositFor(shift.pay, shift.policy)}
          active={quote.late ? "salonLate" : "salonFree"}
        />
        <p className="text-xs text-nexoraSubtle">Tiệm huỷ muộn “sẽ bị giảm hiển thị” — chưa có logic trong bản mẫu.</p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose}>Giữ ca</Button>
          <Button variant="danger" onClick={confirm}>Xác nhận huỷ ca</Button>
        </div>
      </div>
    </Modal>
  );
}
