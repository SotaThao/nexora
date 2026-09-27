import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, Input, RadioCard, Select, Textarea, useToast } from "../../components";
import { saveSeekPost } from "../../store/slices/m02";
import type { JobExperience, PayUnit } from "../../store/types";
import { JOB_CITIES, JOB_DAYS, JOB_EXPERIENCE } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { stripPhones } from "./logic";
import { PhoneWarning } from "./PhoneWarning";
import { ChipGroup, ErrorText, Field, JOBS, useJobsViewer } from "./shared";
import { QUICK_PHRASES, type QuickDraft, type SeekTemplate, payText, templateBody, templateTitle } from "./templates";

const QUICK_ERROR =
  "Vui lòng chọn khu vực, kinh nghiệm, ít nhất 1 ngày làm; tiêu đề ≥ 10 ký tự, bài ≥ 30 ký tự.";

/** "Màn Nhanh" shared by Cách A (mẫu) and Cách B (nói/gõ 1 câu → AI điền). */
export function QuickForm({
  template,
  initial,
  method,
}: {
  template: SeekTemplate;
  initial: QuickDraft;
  method: "template" | "ai";
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const { personId, profile } = useJobsViewer();
  const [draft, setDraft] = useState<QuickDraft>(initial);
  const [manual, setManual] = useState(false);
  const [title, setTitle] = useState(() => templateTitle(template, initial));
  const [body, setBody] = useState(() => templateBody(template, initial));
  const [error, setError] = useState("");

  useEffect(() => setDraft(initial), [initial]);
  useEffect(() => {
    if (manual) return;
    setTitle(templateTitle(template, draft));
    setBody(templateBody(template, draft));
  }, [template, draft, manual]);

  const set = (patch: Partial<QuickDraft>) => {
    setError("");
    setDraft((current) => ({ ...current, ...patch }));
  };
  const rewrite = () => {
    setManual(false);
    setTitle(templateTitle(template, draft));
    setBody(templateBody(template, draft));
  };

  const publish = () => {
    const valid = draft.city && draft.experience && draft.days.length && title.trim().length >= 10 &&
      body.trim().length >= 30;
    if (!valid) return setError(QUICK_ERROR);
    setError("");
    requireAccount("Mở soạn tin tìm việc", () => {
      const id = saveSeekPost({
        seekerId: personId ?? "jessica",
        title: title.trim(),
        body: body.trim(),
        city: draft.city,
        experience: draft.experience || undefined,
        days: draft.days,
        skills: template.skills,
        workTypes: template.workTypes,
        payText: payText(draft.payMode, draft.payFrom, draft.payTo, draft.payUnit),
        hideFromSalonId: profile?.privacy.hideCurrentSalon ? profile.currentSalonId : undefined,
        durationDays: 30,
        method,
      });
      toast("🚀 Đã đăng — tin của bạn đã lên đầu bảng việc làm", "success");
      navigate(`${JOBS}/mine?new=${id}`);
    });
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
      <Card className="space-y-5 p-5">
        <h2 className="text-lg font-bold">{template.emoji} Màn Nhanh · {template.name}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Khu vực">
            <Select value={draft.city} onChange={(event) => set({ city: event.target.value })}>
              <option value="">Chọn khu vực</option>
              {JOB_CITIES.map((city) => <option key={city}>{city}</option>)}
            </Select>
          </Field>
          <Field label="Kinh nghiệm">
            <Select value={draft.experience}
              onChange={(event) => set({ experience: event.target.value as JobExperience | "" })}>
              <option value="">Chọn kinh nghiệm</option>
              {JOB_EXPERIENCE.map((item) => <option key={item}>{item}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Ngày làm" hint="ít nhất 1 ngày">
          <ChipGroup options={JOB_DAYS} value={draft.days} onChange={(days) => set({ days })} />
        </Field>
        <Field label="Lương">
          <div className="grid grid-cols-2 gap-2">
            <RadioCard checked={draft.payMode === "negotiable"} onClick={() => set({ payMode: "negotiable" })}>
              <span className="text-sm font-semibold">Thoả thuận</span>
            </RadioCard>
            <RadioCard checked={draft.payMode === "range"} onClick={() => set({ payMode: "range" })}>
              <span className="text-sm font-semibold">Từ – Đến</span>
            </RadioCard>
          </div>
          {draft.payMode === "range" && (
            <div className="mt-2 grid grid-cols-[1fr_1fr_110px] gap-2">
              <Input aria-label="Từ" inputMode="numeric" placeholder="Từ $" value={draft.payFrom}
                onChange={(event) => set({ payFrom: event.target.value.replace(/[^\d]/g, "") })} />
              <Input aria-label="Đến" inputMode="numeric" placeholder="Đến $" value={draft.payTo}
                onChange={(event) => set({ payTo: event.target.value.replace(/[^\d]/g, "") })} />
              <Select aria-label="Đơn vị" value={draft.payUnit}
                onChange={(event) => set({ payUnit: event.target.value as PayUnit })}>
                <option value="tuần">/tuần</option>
                <option value="ngày">/ngày</option>
                <option value="tháng">/tháng</option>
              </Select>
            </div>
          )}
        </Field>
        <Field label="Câu nhanh" hint="bấm để thêm vào bài">
          <ChipGroup options={QUICK_PHRASES} value={draft.phrases as typeof QUICK_PHRASES[number][]}
            onChange={(phrases) => set({ phrases })} />
        </Field>
      </Card>

      <Card className="space-y-3 p-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">Xem trước · sửa tay được</p>
          {manual && <span className="text-xs font-semibold text-nexoraBrand">Đã sửa tay</span>}
        </div>
        <Field label="Tiêu đề" hint={`${title.trim().length} ký tự`}>
          <Input value={title} onChange={(event) => { setManual(true); setTitle(event.target.value); }} />
        </Field>
        <Field label="Bài" hint={`${body.trim().length} ký tự`}>
          <Textarea className="min-h-44 text-sm leading-6" value={body}
            onChange={(event) => { setManual(true); setBody(event.target.value); }} />
        </Field>
        <PhoneWarning
          texts={[title, body]}
          hidePhone={profile?.privacy.hidePhone ?? true}
          onStrip={() => { setManual(true); setTitle(stripPhones(title)); setBody(stripPhones(body)); }}
        />
        <ErrorText>{error}</ErrorText>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button variant="secondary" onClick={rewrite}>
            ↺ Viết lại theo mẫu
          </Button>
          <Button variant="gradient" onClick={publish}>
            🚀 Đăng ngay
          </Button>
        </div>
      </Card>
    </div>
  );
}
