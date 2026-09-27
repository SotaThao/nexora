import { useState } from "react";
import { History, Save } from "lucide-react";
import { Button, Input, MoneyTag } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useStore } from "../../store";
import { type PolicyValues, savePolicy, selectBoard } from "../../store/slices/m03";
import { dateLabel, money, timeLabel } from "./format";

type Key = keyof PolicyValues;
const FIELDS: { key: Key; label: string; min: number; max: number }[] = [
  { key: "depositPct", label: "Cọc thợ (% tiền công)", min: 0, max: 100 },
  { key: "freeCancelHours", label: "Huỷ miễn phí trước (giờ)", min: 0, max: 168 },
  { key: "techLateLossPct", label: "Thợ huỷ muộn mất (% cọc)", min: 0, max: 100 },
  { key: "noShowLossPct", label: "Không đến mất (% cọc)", min: 0, max: 100 },
  { key: "salonLatePayPct", label: "Tiệm huỷ muộn trả thợ (% công)", min: 0, max: 100 },
  { key: "graceMinutes", label: "Cho trễ tối đa (phút)", min: 0, max: 120 },
];
const SAMPLE_PAY = 180;

/** S03-09 / S00-07 tab — the 6 admin parameters (SỐ MẪU) with input bounds. */
export function PolicyForm({ onSaved }: { onSaved?: () => void }) {
  const policy = useStore((state) => state.shiftPolicy);
  const history = useStore((state) => selectBoard(state).policyHistory);
  const toast = useShiftToast();
  const [values, setValues] = useState<Record<Key, string>>(() =>
    Object.fromEntries(FIELDS.map((field) => [field.key, String(policy[field.key])])) as Record<Key, string>);
  const [errors, setErrors] = useState<Partial<Record<Key, string>>>({});

  const parsed = Object.fromEntries(FIELDS.map((field) => [field.key, Number(values[field.key])])) as PolicyValues;
  const deposit = Math.round((SAMPLE_PAY * (parsed.depositPct || 0)) / 100);

  const save = () => {
    const next: Partial<Record<Key, string>> = {};
    FIELDS.forEach(({ key, min, max }) => {
      const raw = values[key].trim();
      const value = Number(raw);
      if (raw === "" || !Number.isInteger(value) || value < min || value > max) {
        next[key] = `Nhập số nguyên từ ${min} đến ${max}`;
      }
    });
    setErrors(next);
    if (Object.keys(next).length) return toast("Có tham số ngoài giới hạn — kiểm tra lại", "danger");
    const saved = savePolicy(parsed);
    toast(`✓ Đã lưu chính sách ca v${saved.version} — áp dụng cho ca & cọc mới`, "success");
    onSaved?.();
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label, min, max }) => (
          <label key={key} className="block text-sm font-semibold text-nexoraText">
            {label} <span className="font-normal text-nexoraSubtle">({min}–{max})</span>
            <Input
              className={`mt-1 ${errors[key] ? "border-nexoraDanger" : ""}`}
              inputMode="numeric"
              value={values[key]}
              aria-invalid={Boolean(errors[key])}
              onChange={(event) => setValues({ ...values, [key]: event.target.value })}
            />
            {errors[key] && <span className="mt-1 block text-xs font-medium text-nexoraDanger">{errors[key]}</span>}
          </label>
        ))}
      </div>
      <div className="rounded-xl bg-nexoraSurfaceMuted p-4 text-sm text-nexoraMuted">
        <p className="font-semibold text-nexoraText">Ví dụ với ca trả công <MoneyTag>{money(SAMPLE_PAY)}</MoneyTag></p>
        <p className="mt-1">
          Cọc {money(deposit)} · thợ huỷ muộn mất {money(Math.round((deposit * (parsed.techLateLossPct || 0)) / 100))} ·
          vắng mặt mất {money(Math.round((deposit * (parsed.noShowLossPct || 0)) / 100))} · tiệm huỷ muộn trả{" "}
          {money(Math.round((SAMPLE_PAY * (parsed.salonLatePayPct || 0)) / 100))}/thợ
        </p>
      </div>
      <p className="rounded-xl border border-nexoraBrand/30 bg-nexoraBrandSoft/60 p-3 text-sm text-nexoraText">
        💡 Chính sách được ghi vào từng ca, không áp hồi tố — ca và cọc đã có giữ nguyên phiên bản cũ.
      </p>
      <p className="text-xs text-nexoraSubtle">
        Cửa sổ mở check-in “1 giờ trước ca” và “48h khiếu nại” hiện gắn cứng, không trong bảng.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-xs text-nexoraMuted">
          <History size={14} /> Hiện hành v{policy.version} · {history.length} phiên bản
          {history[0] && ` · cập nhật ${dateLabel(history[0].updatedAt)} ${timeLabel(history[0].updatedAt)}`}
        </p>
        <Button variant="gradient" onClick={save}><Save size={16} className="mr-1 inline" />Lưu chính sách</Button>
      </div>
    </div>
  );
}
