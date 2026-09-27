import { useState } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../../components";
import { useToast } from "../ui/toast";
import type { Coupon, Promotion } from "../../../store/types";
import { publishProgram } from "../../../store/slices/m04";
import { CHANNEL_LABEL, conditionLine, holdUntilFor } from "../logic/domain";
import { DealCard } from "../ui/DealCard";
import { posPath } from "../ui/hooks";
import { ChannelChips, PosFrame } from "../ui/parts";
import { AdsSection, ChannelsSection } from "./ChannelsAdsSection";
import { AudienceSection, OfferSection, TimingSection, type Errors } from "./ProgramFormSections";
import { BLANK, TEMPLATES, aiSuggest, type Draft } from "./templates";

function toPromotion(d: Draft): Promotion {
  const now = Date.now();
  const hold = Number(d.holdDays);
  return {
    id: "preview", title: d.title, salonId: "kayla-nails", status: "active", emoji: d.emoji, offerType: d.offerType,
    offerValue: Number(d.value) || 0, offerText: d.offerText, audience: d.audience, dealFor: d.dealFor,
    condition: d.condition || "—", industry: "Nail", channels: d.channels, createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + d.expiryHours * 3_600_000).toISOString(), totalSlots: Number(d.totalSlots) || 0,
    returnedSeed: 0, perPersonLimit: d.perPerson,
    holdDays: d.holdDays === "" || hold <= 0 || hold * 24 >= d.expiryHours ? null : hold,
    color: d.color, distanceMi: 0.8, mapAngle: 0, sponsored: d.adsOn,
    stats: { POS: { claimed: 0, used: 0 }, Community: { claimed: 0, used: 0 }, SMS: { claimed: 0, used: 0 },
      QR: { claimed: 0, used: 0 } },
  };
}

/** Doc 04 flow 1 step 5 — the 4 validation messages, verbatim. */
function validate(d: Draft): Errors {
  const e: Errors = {};
  if (!d.title.trim()) e.title = "Nhập tiêu đề coupon";
  if (!(Number(d.totalSlots) >= 1)) e.slots = "Tổng số lượt phải lớn hơn 0";
  const v = Number(d.value);
  if (d.offerType === "percent" && !(v >= 1 && v <= 100)) e.value = "Phần trăm giảm phải từ 1 đến 100";
  if (d.adsOn && !(Number(d.budget) > 0)) e.budget = "Nhập ngân sách quảng cáo";
  return e;
}

function TemplateGrid({ onPick }: { onPick: (patch: Partial<Draft>) => void }) {
  return (
    <div>
      <p
        className={`mb-3 text-sm text-nexoraMuted`}
        >Chọn mẫu — mẫu điền sẵn loại, giá trị, tiêu đề, điều kiện, hạn và tổng lượt.</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {TEMPLATES.map((t) => (
          <button key={t.name} type="button" onClick={() => onPick(t.patch)}
            className={`flex min-h-28 flex-col items-start justify-between rounded-flox-cards border
              border-nexoraBorder bg-white p-4 text-left shadow-nexora-card transition hover:-translate-y-0.5
              hover:border-nexoraBrand`}
          >
            <span className="text-3xl">{t.emoji}</span>
            <span className="text-sm font-bold">{t.name}</span>
          </button>
        ))}
        <button type="button" onClick={() => onPick({})}
          className={`flex min-h-28 flex-col items-start justify-between rounded-flox-cards border-2 border-dashed
            border-nexoraBorder bg-nexoraSurfaceMuted p-4 text-left hover:border-nexoraBrand`}
        >
          <Plus className="text-nexoraBrand" />
          <span className="text-sm font-bold">Tạo trống</span>
        </button>
      </div>
    </div>
  );
}

export function CreateProgramScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<"template" | "form">("template");
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [tried, setTried] = useState(false);
  const set = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    if (tried) setErrors(validate(next));
  };
  const preview = toPromotion(draft);
  const fakeCoupon: Coupon = {
    id: "p", promotionId: "preview", ownerId: "", code: "NX-XXXX-XXXX", status: "active", source: "Community",
    claimedAt: new Date().toISOString(), holdUntil: holdUntilFor(preview, Date.now()),
  };

  const publish = () => {
    const e = validate(draft);
    setTried(true);
    setErrors(e);
    if (Object.keys(e).length) {
      toast("Kiểm tra lại các trường báo đỏ", "danger");
      return;
    }
    const id = publishProgram({
      title: draft.title.trim(), emoji: draft.emoji, offerType: draft.offerType, offerValue: preview.offerValue,
      offerText: draft.offerText, audience: draft.audience, dealFor: draft.dealFor,
      condition: draft.condition.trim() || "—",
      totalSlots: preview.totalSlots, perPersonLimit: draft.perPerson, holdDays: preview.holdDays, color: draft.color,
      channels: draft.channels, expiryHours: draft.expiryHours,
      ads: draft.adsOn
        ? { budgetPerDay: Number(draft.budget), days: draft.adsDays, radiusMi: draft.adsRadius }
        : undefined,
    });
    const order = ["POS", "Community", "SMS", "QR"] as const;
    const channels = order.filter((c) => draft.channels.includes(c)).map((c) => CHANNEL_LABEL[c]);
    toast(`🚀 Đã phát hành: ${channels.join(" · ")}`, "success");
    navigate(posPath(`/promotions?id=${id}`));
  };

  const previewCard = (
    <Card className="p-5">
      <p className="text-sm font-bold">Xem trước trên Community</p>
      <p className="mb-3 text-xs text-nexoraMuted">Deal gần bạn · Coupon theo ngành — cập nhật khi bạn gõ.</p>
      {draft.channels.includes("Community") ? (
        <DealCard promotion={preview} preview />
      ) : (
        <p
          className={`rounded-lg bg-nexoraSurfaceMuted p-4 text-sm text-nexoraMuted`}
          >Kênh Community đang tắt — deal không hiện trên Community.</p>
      )}
      <p className="mt-3 rounded-lg border-l-4 border-nexoraBrand bg-nexoraBrandSoft/60 p-3 text-xs leading-relaxed">
        {conditionLine(preview, fakeCoupon)}
      </p>
      <div
        className={`mt-3 flex items-center gap-2 text-xs text-nexoraMuted`}
        >Kênh: <ChannelChips channels={draft.channels} /></div>
    </Card>
  );

  return (
    <PosFrame crumb="Tạo chương trình" title="Tạo chương trình khuyến mãi"
      subtitle="POS là nguồn duy nhất — Community, SMS và QR tại quầy chỉ là kênh phát.">
      {step === "template" ? (
        <TemplateGrid onPick={(patch) => { setDraft({ ...BLANK, ...patch }); setStep("form"); }} />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-4">
            <button type="button" onClick={() => { setStep("template"); setTried(false); setErrors({}); }}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-nexoraMuted">
              <ArrowLeft size={16} /> Chọn mẫu khác · đang dùng {draft.emoji}
            </button>
            <OfferSection draft={draft} set={set} errors={errors} onAi={() => {
              set(aiSuggest(draft));
              toast("✦ Đã gợi ý theo loại ưu đãi + ngành Nail — bạn sửa lại tuỳ ý");
            }} />
            <TimingSection draft={draft} set={set} errors={errors} />
            <AudienceSection draft={draft} set={set} errors={errors} />
            <ChannelsSection draft={draft} set={set} errors={errors} />
            <AdsSection draft={draft} set={set} errors={errors} />
            <div className="lg:hidden">{previewCard}</div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => navigate(posPath("/promotions"))}>Huỷ</Button>
              <Button variant="gradient" onClick={publish} className="sm:min-w-48">🚀 Phát hành</Button>
            </div>
          </div>
          <div className="hidden lg:block"><div className="sticky top-24">{previewCard}</div></div>
        </div>
      )}
    </PosFrame>
  );
}
