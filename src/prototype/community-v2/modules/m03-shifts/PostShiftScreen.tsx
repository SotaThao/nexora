import { type ReactNode, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Minus, Plus, ShieldCheck } from "lucide-react";
import { Button, Card, Input, Modal, MoneyTag, RadioCard, Select } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useCommunityGate } from "../m00-foundation/gates";
import { useStore } from "../../store";
import { postShift } from "../../store/slices/m03";
import type { ScreenDefinition, ShiftKind, ShiftMode } from "../../store/types";
import { money } from "./format";
import { depositFor } from "./rules";
import { HoldPanel, KIND_META, MODE_LABEL, OWNER_SALON_ID, RoleGate, SHIFT_PATHS, ShiftNav, ShiftPageHeader }
  from "./ShiftShared";
import { PostedShiftsList } from "./PostedShiftsList";

export const SERVICES = ["Bột/Acrylic", "Dip", "Gel-X", "Gel Polish", "Nail Art", "Chân/Pedicure", "Tay nước", "Wax"];
const WHEN = ["Hôm nay", "Ngày mai", "2 ngày", "3 ngày"];
const HOURS = Array.from({ length: 15 }, (_, index) => `${String(index + 7).padStart(2, "0")}:00`);
const MISSING = "Vui lòng chọn loại, tiêu đề, dịch vụ và trả công";

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <p className="text-sm font-semibold text-nexoraText">{label}</p>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 text-xs text-nexoraSubtle">{hint}</p>}
    </div>
  );
}

function PostShiftForm() {
  const policy = useStore((state) => state.shiftPolicy);
  const navigate = useNavigate();
  const toast = useShiftToast();
  const { requireAccount } = useCommunityGate();
  const [kind, setKind] = useState<ShiftKind | null>(null);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(1);
  const [start, setStart] = useState("10:00");
  const [end, setEnd] = useState("18:00");
  const [staff, setStaff] = useState(2);
  const [services, setServices] = useState<string[]>([]);
  const [pay, setPay] = useState("");
  const [mode, setMode] = useState<ShiftMode>("approval");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const payValue = Number(pay.replace(/[^\d]/g, "")) || 0;
  const guarantee = payValue * staff;

  const toggleService = (service: string) =>
    setServices((list) => (list.includes(service) ? list.filter((item) => item !== service) : [...list, service]));

  const submit = () => {
    if (!kind || !title.trim() || services.length === 0 || payValue <= 0) return setError(MISSING);
    if (end <= start) return setError("Giờ kết thúc phải sau giờ bắt đầu");
    setError("");
    setConfirming(true);
  };

  const confirm = () =>
    requireAccount("Đăng ca", () => {
      if (!kind) return;
      const id = postShift({ kind, title, dayOffset: when, start, end, staffNeeded: staff, services, pay: payValue,
        mode, salonId: OWNER_SALON_ID });
      setConfirming(false);
      toast("✓ Đã đăng ca — thợ rảnh gần tiệm được báo ngay", "success");
      navigate(SHIFT_PATHS.detail(id));
    });

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
      <Card className="space-y-5 p-5">
        <Field label="Loại ca">
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(KIND_META) as ShiftKind[]).map((item) => (
              <RadioCard key={item} checked={kind === item} onClick={() => setKind(item)}>
                <span className="block text-center text-sm font-semibold">{KIND_META[item].label}</span>
              </RadioCard>
            ))}
          </div>
        </Field>
        <Field label="Tiêu đề">
          <Input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)}
            placeholder="VD: Party cuối tuần — cần thợ Gel-X" />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Khi nào">
            <div className="grid grid-cols-4 gap-1.5">
              {WHEN.map((label, index) => (
                <button key={label} type="button" onClick={() => setWhen(index)} aria-pressed={when === index}
                  className={`min-h-11 rounded-lg px-1 text-xs font-semibold ${when === index
                    ? "bg-nexoraBrand text-white" : "border border-nexoraBorder text-nexoraMuted"}`}>
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Giờ làm">
            <div className="grid grid-cols-2 gap-2">
              <Select aria-label="Bắt đầu" value={start} onChange={(event) => setStart(event.target.value)}>
                {HOURS.map((hour) => <option key={hour}>{hour}</option>)}
              </Select>
              <Select aria-label="Kết thúc" value={end} onChange={(event) => setEnd(event.target.value)}>
                {HOURS.map((hour) => <option key={hour}>{hour}</option>)}
              </Select>
            </div>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Số thợ cần" hint="1–4 thợ">
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                aria-label="Bớt thợ"
                disabled={staff <= 1}
                onClick={() => setStaff(staff - 1)}
              >
                <Minus size={16} />
              </Button>
              <span className="w-8 text-center text-lg font-bold">{staff}</span>
              <Button
                variant="secondary"
                aria-label="Thêm thợ"
                disabled={staff >= 4}
                onClick={() => setStaff(staff + 1)}
              >
                <Plus size={16} />
              </Button>
            </div>
          </Field>
          <Field label="Trả công/thợ ($)" hint="Số mẫu">
            <Input
              value={pay}
              inputMode="numeric"
              placeholder="VD: 180"
              onChange={(event) => setPay(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Dịch vụ">
          <div className="flex flex-wrap gap-2">
            {SERVICES.map((service) => (
              <button key={service} type="button" onClick={() => toggleService(service)}
                aria-pressed={services.includes(service)}
                className={`min-h-11 rounded-full px-3 text-sm font-semibold ${services.includes(service)
                  ? "bg-nexoraBrand text-white" : "border border-nexoraBorder bg-white text-nexoraMuted"}`}>
                {service}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Chế độ nhận">
          <div className="grid gap-2 sm:grid-cols-2">
            {(["approval", "instant"] as ShiftMode[]).map((item) => (
              <RadioCard key={item} checked={mode === item} onClick={() => setMode(item)}>
                <span className="block text-sm font-semibold">{MODE_LABEL[item]}</span>
                <span className="mt-0.5 block text-xs text-nexoraMuted">
                  {item === "approval" ? "Thợ ứng tuyển, bạn chốt từng người" : "Thợ đặt cọc là chốt luôn"}
                </span>
              </RadioCard>
            ))}
          </div>
        </Field>
        {error && (
          <p role="alert" className="rounded-lg bg-nexoraDanger/10 p-3 text-sm font-medium text-nexoraDanger">
            {error}
          </p>
        )}
        <Button className="w-full sm:w-auto" variant="gradient" onClick={submit}>Đăng ca</Button>
      </Card>

      <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <HoldPanel title="Tạm giữ tiền công bảo đảm">
          <div className="space-y-1">
            <p className="flex justify-between"><span>Trả công/thợ</span><MoneyTag>{money(payValue)}</MoneyTag></p>
            <p className="flex justify-between"><span>× Số thợ cần</span><b className="text-nexoraText">{staff}</b></p>
            <p className="flex justify-between border-t border-nexoraWarning/30 pt-2 text-base">
              <span className="font-bold text-nexoraText">= Bảo đảm</span><MoneyTag>{money(guarantee)}</MoneyTag>
            </p>
          </div>
          <p className="mt-2 text-xs">Tạm giữ qua ví NEXORA/thẻ khi đăng. Thợ thấy “Tiệm đã bảo đảm tiền công”.</p>
        </HoldPanel>
        <Card className="p-4 text-sm text-nexoraMuted">
          <p className="flex items-center gap-2 font-bold text-nexoraText">
            <ShieldCheck size={16} className="text-nexoraBrand" /> Chính sách v{policy.version} ghi vào ca này
          </p>
          <ul className="mt-2 space-y-1">
            <li>Cọc thợ {policy.depositPct}% = {money(depositFor(payValue, policy))}/thợ</li>
            <li>Huỷ miễn phí trước {policy.freeCancelHours}h</li>
            <li>Tiệm huỷ muộn trả {policy.salonLatePayPct}% công/thợ đã chốt</li>
          </ul>
        </Card>
        <PostedShiftsList compact />
      </div>

      <Modal open={confirming} onClose={() => setConfirming(false)} title="Xác nhận tạm giữ bảo đảm">
        <div className="space-y-4">
          <p className="text-sm text-nexoraMuted">
            {kind && KIND_META[kind].label} · {title} · {WHEN[when]} {start}–{end}
          </p>
          <HoldPanel title={`NEXORA tạm giữ ${money(guarantee)}`}>
            = {money(payValue)} × {staff} thợ. Trả cho thợ khi bạn bấm “Xong ca · trả tiền”; phần không dùng hoàn lại
            theo chính sách (chờ Brian chốt).
          </HoldPanel>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setConfirming(false)}>Sửa lại</Button>
            <Button variant="gradient" onClick={confirm}>Tạm giữ & đăng ca</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export function PostShiftScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <RoleGate need="owner">
      <div className="space-y-5">
        <ShiftPageHeader pos title={screen.title} subtitle="Đăng ca thiếu thợ — thợ rảnh gần tiệm được báo ngay" />
        <ShiftNav pos />
        <PostShiftForm />
      </div>
    </RoleGate>
  );
}
