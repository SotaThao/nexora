import { Sparkles } from "lucide-react";
import { Input, Textarea } from "../../../components";
import type { Audience, DealFor, OfferType, ProgramColor } from "../../../store/types";
import { AUDIENCE_LABEL, COLOR_GRADIENT, COLOR_LABEL, OFFER_TYPE_LABEL } from "../logic/domain";
import { Field, Pills, Section } from "./formParts";
import { EXPIRY_OPTIONS, type Draft } from "./templates";

export type Errors = Partial<Record<"title" | "slots" | "value" | "budget", string>>;
type Props = { draft: Draft; set: (patch: Partial<Draft>) => void; errors: Errors; onAi?: () => void };

const VALUE_LABEL: Record<OfferType, string> = {
  percent: "Phần trăm giảm (%)",
  amount: "Số tiền giảm ($)",
  special: "Giá đặc biệt ($)",
  bxgy: "Nội dung (VD: Mua 2 tặng 1)",
  free: "Nội dung miễn phí",
};

export function OfferSection({ draft, set, errors, onAi }: Props) {
  const textValue = draft.offerType === "bxgy" || draft.offerType === "free";
  return (
    <Section title="1 · Ưu đãi" hint="Loại ưu đãi, giá trị và nội dung khách thấy trên coupon.">
      <Field label="Loại ưu đãi">
        <Pills<OfferType>
          value={draft.offerType}
          onChange={(offerType) => set({ offerType })}
          options={(Object.keys(OFFER_TYPE_LABEL) as OfferType[]).map((k) => [
            k, k === "free" ? `${OFFER_TYPE_LABEL[k]} · chỉ Community (cần chốt)` : OFFER_TYPE_LABEL[k],
          ])}
        />
      </Field>
      <Field label={VALUE_LABEL[draft.offerType]} htmlFor="f-value" error={errors.value}>
        {textValue ? (
          <Input id="f-value" value={draft.offerText} onChange={(e) => set({ offerText: e.target.value })}
            placeholder={draft.offerType === "bxgy" ? "Mua 2 tặng 1" : "Buổi học thử miễn phí"} />
        ) : (
          <Input id="f-value" type="number" inputMode="decimal" value={draft.value}
            onChange={(e) => set({ value: e.target.value })} className="max-w-[200px]" />
        )}
      </Field>
      <Field label="Tiêu đề coupon" htmlFor="f-title" error={errors.title} hint={`${draft.title.length}/60 ký tự`}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="f-title" maxLength={60} value={draft.title} onChange={(e) => set({ title: e.target.value })}
            placeholder="VD: Giảm 20% cho khách lần đầu" />
          {onAi && (
            <button type="button" onClick={onAi}
              className={`inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-flox-buttons
                border border-nexoraLavender bg-nexoraBrandSoft px-3 text-sm font-semibold text-nexoraBrand`}
            >
              <Sparkles size={15} /> ✦ AI gợi ý tiêu đề & điều kiện
            </button>
          )}
        </div>
      </Field>
      <Field label="Điều kiện thêm (hiện cho khách)" htmlFor="f-cond">
        <Textarea id="f-cond" rows={2} value={draft.condition} onChange={(e) => set({ condition: e.target.value })}
          placeholder="VD: Áp dụng dịch vụ từ $40 · không cộng dồn" />
      </Field>
    </Section>
  );
}

export function TimingSection({ draft, set, errors }: Props) {
  const hold = Number(draft.holdDays);
  const holdTooLong = draft.holdDays !== "" && hold > 0 && hold * 24 >= draft.expiryHours;
  return (
    <Section
      title="2 · Thời hạn & số lượt"
      hint="Lượt trừ lúc khách lấy; quá hạn giữ chưa dùng thì lượt tự trả về kho."
    >
      <Field label="Hết hạn sau">
        <Pills<number> value={draft.expiryHours} onChange={(expiryHours) => set({ expiryHours })}
          options={EXPIRY_OPTIONS} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Tổng lượt" htmlFor="f-slots" error={errors.slots}>
          <Input id="f-slots" type="number" inputMode="numeric" value={draft.totalSlots}
            onChange={(e) => set({ totalSlots: e.target.value })} />
        </Field>
        <Field label="Giữ lượt sau khi lấy (ngày)" htmlFor="f-hold" hint="Trống = giữ đến khi chương trình hết hạn">
          <Input id="f-hold" type="number" inputMode="numeric" value={draft.holdDays} placeholder="Trống"
            onChange={(e) => set({ holdDays: e.target.value })} />
        </Field>
      </div>
      {holdTooLong && (
        <p role="status"
          className={`rounded-lg border border-nexoraWarning/40 bg-nexoraWarning/10 p-3 text-sm text-nexoraText`}
        >
          ⚠️ Giữ lượt ({hold} ngày) ≥ thời hạn chương trình — khi phát hành hệ thống sẽ <b>bỏ giữ lượt</b>:
          mã giữ tới lúc chương trình hết hạn.
        </p>
      )}
      <Field label="Mỗi khách tối đa">
        <Pills<number | null> value={draft.perPerson} onChange={(perPerson) => set({ perPerson })}
          options={[[1, "1 lần"], [2, "2 lần"], [null, "Không giới hạn"]]} />
      </Field>
    </Section>
  );
}

export function AudienceSection({ draft, set }: Props) {
  return (
    <Section title="3 · Áp dụng cho & giao diện" hint="POS tự kiểm tra bằng lịch sử ghé — thu ngân không phải nhớ.">
      <Field label="Áp dụng cho">
        <div className="grid gap-2 sm:grid-cols-2">
          {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => (
            <button key={a} type="button" onClick={() => set({ audience: a })}
              className={`min-h-11 rounded-lg border p-3 text-left text-sm font-semibold ${
                draft.audience === a
                  ? "border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand"
                  : "border-nexoraBorder bg-white"}`}>
              {AUDIENCE_LABEL[a]}
            </button>
          ))}
        </div>
      </Field>
      <Field label="Hiện trên Community cho">
        <Pills<DealFor> value={draft.dealFor} onChange={(dealFor) => set({ dealFor })}
          options={[["client", "Khách hàng"], ["b2b", "Tiệm & thợ"]]} />
      </Field>
      <Field label="Màu coupon">
        <div className="flex flex-wrap gap-3">
          {(Object.keys(COLOR_GRADIENT) as ProgramColor[]).map((c) => (
            <button key={c} type="button" onClick={() => set({ color: c })} aria-label={COLOR_LABEL[c]}
              className={`size-11 rounded-full bg-gradient-to-br ring-offset-2 ${COLOR_GRADIENT[c]} ${
                draft.color === c ? "ring-2 ring-nexoraBrand" : ""}`} />
          ))}
        </div>
      </Field>
    </Section>
  );
}
