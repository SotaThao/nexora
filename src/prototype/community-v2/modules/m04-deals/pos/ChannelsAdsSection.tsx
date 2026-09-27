import { Check, Lock } from "lucide-react";
import { Input, Toggle } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import type { Channel } from "../../../store/types";
import { AUDIENCE_LABEL, money } from "../logic/domain";
import { visitFacts } from "../logic/eligibility";
import { useMe } from "../ui/hooks";
import { SampleTag } from "../ui/parts";
import { Field, Pills, Section } from "./formParts";
import type { Draft } from "./templates";
import type { Errors } from "./ProgramFormSections";

type Props = { draft: Draft; set: (patch: Partial<Draft>) => void; errors: Errors };

function useSmsReach(audience: Draft["audience"]) {
  const customers = useStore((s) => s.customers);
  return customers.filter((c) => {
    const f = visitFacts(c);
    if (audience === "new") return f.count === 0;
    if (audience === "regular") return f.count >= 2;
    if (audience === "lapsed") return f.count > 0 && (f.daysSinceLast ?? 0) >= 60;
    return true;
  }).length;
}

export function ChannelsSection({ draft, set }: Props) {
  const toast = useToast();
  const reach = useSmsReach(draft.audience);
  const rows: [Channel, string, string][] = [
    ["POS", "POS", "Luôn bật · tự đề xuất khi khách check-in bằng SĐT"],
    ["Community", "Community", "Deal gần bạn · Coupon theo ngành · báo người theo dõi từ khoá"],
    ["SMS", "SMS cho khách trong POS", `Gửi link tới ${reach} khách khớp “${AUDIENCE_LABEL[draft.audience]}”`],
    ["QR", "QR tại quầy / tờ rơi", "Tạo link nexora.link/c/<id> + QR để in"],
  ];
  const toggle = (c: Channel) => {
    if (c === "POS") {
      toast("POS luôn bật — đây là nguồn gốc của chương trình");
      return;
    }
    set({ channels: draft.channels.includes(c) ? draft.channels.filter((x) => x !== c) : [...draft.channels, c] });
  };
  return (
    <Section title="4 · Kênh phát" hint="Một chương trình gốc — mọi kênh dùng chung số lượt.">
      <div className="space-y-2">
        {rows.map(([c, label, hint]) => {
          const on = draft.channels.includes(c);
          return (
            <button key={c} type="button" onClick={() => toggle(c)} aria-pressed={on}
              className={`flex min-h-14 w-full items-center gap-3 rounded-lg border p-3 text-left ${
                on ? "border-nexoraBrand bg-nexoraBrandSoft/50" : "border-nexoraBorder bg-white"}`}>
              <span className={`grid size-6 shrink-0 place-items-center rounded-md border ${
                on ? "border-nexoraBrand bg-nexoraBrand text-white" : "border-nexoraBorder bg-white"}`}>
                {c === "POS" ? <Lock size={13} /> : on && <Check size={15} />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold">{label}</span>
                <span className="block text-xs text-nexoraMuted">{hint}</span>
              </span>
            </button>
          );
        })}
      </div>
    </Section>
  );
}

export function AdsSection({ draft, set, errors }: Props) {
  const { role } = useMe();
  const locked = role !== "owner";
  const total = (Number(draft.budget) || 0) * draft.adsDays;
  return (
    <Section
      title="5 · 🚀 Chạy quảng cáo (tuỳ chọn)"
      hint="Ghim đầu Deal gần bạn & Bảng tin trong bán kính, nhãn “⭐ Được tài trợ”."
    >
      {locked ? (
        <p className="flex items-start gap-2 rounded-lg bg-nexoraSurfaceMuted p-3 text-sm text-nexoraMuted">
          <Lock size={16} className="mt-0.5 shrink-0" />
          Tài khoản thợ không chạy được quảng cáo — chỉ tài khoản doanh nghiệp (chủ tiệm).
        </p>
      ) : (
        <>
          <div
            className={`-mx-3`}
            ><Toggle label="🚀 Chạy quảng cáo" checked={draft.adsOn} onChange={(adsOn) => set({ adsOn })} /></div>
          {draft.adsOn && (
            <div className="space-y-4 rounded-lg border border-nexoraWarning/40 bg-nexoraWarning/5 p-4">
              <Field label="Ngân sách / ngày ($)" htmlFor="f-budget" error={errors.budget}>
                <Input id="f-budget" type="number" inputMode="decimal" value={draft.budget} placeholder="VD: 20"
                  onChange={(e) => set({ budget: e.target.value })} className="max-w-[200px]" />
              </Field>
              <Field label="Số ngày">
                <Pills<3 | 7 | 14> value={draft.adsDays} onChange={(adsDays) => set({ adsDays })}
                  options={[[3, "3 ngày"], [7, "7 ngày"], [14, "14 ngày"]]} />
              </Field>
              <Field label="Bán kính">
                <Pills<5 | 10 | 25> value={draft.adsRadius} onChange={(adsRadius) => set({ adsRadius })}
                  options={[[5, "5 mi"], [10, "10 mi"], [25, "25 mi"]]} />
              </Field>
              <p className="flex flex-wrap items-center gap-2 text-sm">
                💰 Tổng: <b>{money(total)}</b> ({money(Number(draft.budget) || 0)} × {draft.adsDays} ngày)
                <SampleTag>GIÁ MẪU</SampleTag>
              </p>
              <p
                className={`text-xs text-nexoraMuted`}
                >Thanh toán: trừ vào ví doanh nghiệp NEXORA (bản mẫu — giá thật chưa chốt).</p>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
