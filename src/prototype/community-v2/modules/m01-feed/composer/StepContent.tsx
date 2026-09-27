import { useState } from "react";
import { ImagePlus, Sparkles, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Checkbox, Input, Select, Textarea } from "../../../components";
import { useStore } from "../../../store";
import { updateDraft } from "../../../store/slices/m01";
import type { ComposerDraft, ScreenDefinition } from "../../../store/types";
import { COPY, MARKET_AREAS, MARKET_CATEGORIES, MAX_BODY, MAX_IMAGES, POST_TYPES, ROUTES } from "../constants";
import { useDraft } from "../data";
import { FieldError, Notice, PhotoTile } from "../ui";
import { ComposerLayout } from "./ComposerLayout";
import { aiCheck, suggestDestinations, validDestinationsFor, validateStep1, type Step1Errors } from "./rules";

const label = "block text-sm font-semibold text-nexoraText";

function MarketFields({ draft, errors }: { draft: ComposerDraft; errors: Step1Errors }) {
  return (
    <div className="grid gap-4 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted/60 p-4 sm:grid-cols-3">
      <label className={label}>
        Danh mục
        <Select className="mt-1.5" value={draft.category} onChange={(e) => updateDraft({ category: e.target.value })}>
          {MARKET_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </label>
      <label className={label}>
        Giá ($)
        <div className="relative mt-1.5">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-nexoraSubtle">$</span>
          <Input
            inputMode="numeric"
            maxLength={6}
            placeholder="VD: 180"
            className={`pl-7 ${errors.price ? "border-nexoraDanger" : ""}`}
            value={draft.price}
            onChange={(e) => updateDraft({ price: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          />
        </div>
        <FieldError>{errors.price}</FieldError>
      </label>
      <label className={label}>
        Khu vực
        <Select className="mt-1.5" value={draft.area} onChange={(e) => updateDraft({ area: e.target.value })}>
          {MARKET_AREAS.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </label>
    </div>
  );
}

function Images({ draft, errors }: { draft: ComposerDraft; errors: Step1Errors }) {
  const add = () => updateDraft({ images: [...draft.images, (draft.images.length * 5 + 1) % 6] });
  const remove = (index: number) => updateDraft({ images: draft.images.filter((_, i) => i !== index) });
  return (
    <div>
      <p className={label}>
        Ảnh <span className="font-normal text-nexoraSubtle">({draft.images.length}/{MAX_IMAGES})</span>
      </p>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
        {draft.images.map((tone, index) => (
          <div key={`${tone}-${index}`} className="relative">
            <PhotoTile tone={tone} className="aspect-square w-full" />
            <button
              type="button"
              aria-label={`Xoá ảnh ${index + 1}`}
              onClick={() => remove(index)}
              className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-white/90
                text-nexoraText shadow"
            >
              <X size={15} />
            </button>
          </div>
        ))}
        {draft.images.length < MAX_IMAGES && (
          <button
            type="button"
            onClick={add}
            className="grid aspect-square w-full place-items-center rounded-lg border-2 border-dashed
              border-nexoraBorder text-nexoraMuted hover:border-nexoraBrand hover:text-nexoraBrand"
          >
            <span className="grid justify-items-center gap-1 text-xs font-semibold">
              <ImagePlus size={20} /> Thêm ảnh
            </span>
          </button>
        )}
      </div>
      {draft.images.length > 0 && (
        <div className="mt-2">
          <Checkbox
            checked={draft.imageRights}
            onChange={(e) => updateDraft({ imageRights: e.target.checked })}
            label={COPY.imageRights}
          />
          <FieldError>{errors.rights}</FieldError>
        </div>
      )}
    </div>
  );
}

export function StepContent(_: { screen: ScreenDefinition }) {
  const navigate = useNavigate();
  const draft = useDraft();
  const groups = useStore((s) => s.groups);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState<"block" | "warn" | null>(null);
  const errors = attempted ? validateStep1(draft) : {};

  const setType = (type: ComposerDraft["type"]) =>
    updateDraft({ type, destinations: validDestinationsFor(type, draft.destinations, groups), step1Passed: false });

  const next = () => {
    setAttempted(true);
    if (Object.keys(validateStep1(draft)).length) return setNotice(null);
    const verdict = aiCheck(draft.body);
    if (verdict === "block") return setNotice("block");
    if (verdict === "warn" && draft.warnedBody !== draft.body) {
      updateDraft({ warnedBody: draft.body });
      return setNotice("warn");
    }
    const destinations = draft.destinationsTouched
      ? validDestinationsFor(draft.type, draft.destinations, groups)
      : suggestDestinations(draft);
    updateDraft({ step1Passed: true, destinations });
    navigate(ROUTES.composeStep2);
  };

  return (
    <ComposerLayout
      step={1}
      title="Bạn muốn đăng gì?"
      subtitle="Chọn loại bài, viết nội dung và thêm ảnh. AI sẽ kiểm tra trước khi sang bước tiếp."
      footer={
        <>
          <Button variant="secondary" onClick={() => navigate(ROUTES.feed)}>Để sau</Button>
          <Button variant="gradient" className="sm:min-w-40" onClick={next}>Tiếp →</Button>
        </>
      }
    >
      <div role="radiogroup" aria-label="Loại bài" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POST_TYPES.map((type) => (
          <button
            key={type.id}
            type="button"
            role="radio"
            aria-checked={draft.type === type.id}
            onClick={() => setType(type.id)}
            className={`min-h-16 rounded-xl border p-3 text-left transition ${
              draft.type === type.id
                ? "border-nexoraBrand bg-nexoraBrandSoft"
                : "border-nexoraBorder bg-white hover:border-nexoraBrand/40"
            }`}
          >
            <span className="block text-sm font-bold">{type.emoji} {type.label}</span>
            <span className="mt-0.5 block text-xs text-nexoraMuted">{type.hint}</span>
          </button>
        ))}
      </div>

      {draft.type === "market" && <MarketFields draft={draft} errors={errors} />}

      <label className={label}>
        Nội dung
        <Textarea
          className={`mt-1.5 min-h-44 ${errors.body ? "border-nexoraDanger" : ""}`}
          maxLength={MAX_BODY}
          value={draft.body}
          placeholder={
            draft.type === "market"
              ? "Dòng đầu là tiêu đề — VD: Thanh lý máy mài móng…"
              : "Chia sẻ với cộng đồng…"
          }
          onChange={(e) => { updateDraft({ body: e.target.value }); setNotice(null); }}
        />
        <span className="mt-1 flex justify-between gap-3 text-xs font-normal text-nexoraSubtle">
          <FieldError>{errors.body}</FieldError>
          <span className={`ml-auto ${draft.body.length >= MAX_BODY ? "text-nexoraDanger" : ""}`}>
            {draft.body.length}/{MAX_BODY}
          </span>
        </span>
      </label>

      <Images draft={draft} errors={errors} />

      {notice === "block" && <Notice tone="danger">{COPY.aiBlock}</Notice>}
      {notice === "warn" && <Notice tone="warning">{COPY.aiWarn}</Notice>}
      {!notice && (
        <p className="flex items-center gap-2 text-xs text-nexoraSubtle">
          <Sparkles size={14} className="text-nexoraBrand" />
          AI kiểm tra nội dung trước khi đăng để chặn dấu hiệu lừa đảo.
        </p>
      )}
    </ComposerLayout>
  );
}
