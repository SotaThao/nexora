import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Lock, Zap } from "lucide-react";
import { Button, Card, Input, Textarea, Toggle, useToast } from "../../components";
import { useStore } from "../../store";
import { saveSeekPost, updatePrivacy } from "../../store/slices/m02";
import type { ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { AI_THRESHOLD, stripPhones } from "./logic";
import { PhoneWarning } from "./PhoneWarning";
import { ErrorText, Field, JOBS, PageHeader, RoleNotice, salonName, useJobsViewer } from "./shared";
import { DurationPicker, StepAbout, StepPay, StepWork } from "./StepsFields";
import {
  EMPTY_STEPS, STEP_ERRORS, STEP_TITLES, type StepsDraft,
  aiWrite, draftPay, englishVersion, fillFromProfile, fromPost, shorten, validateStep,
} from "./stepsLogic";

function StepperBar({ step, maxStep, go }: { step: number; maxStep: number; go: (step: number) => void }) {
  return (
    <ol className="relative grid grid-cols-4">
      <span className="absolute left-[12.5%] right-[12.5%] top-5 h-[3px] rounded bg-nexoraBorder" aria-hidden="true" />
      <span className="absolute left-[12.5%] top-5 h-[3px] rounded bg-gradient-to-r from-nexoraElectric
        via-nexoraElectricMid
        to-nexoraViolet transition-all" style={{ width: `${(step / 3) * 75}%` }} aria-hidden="true" />
      {STEP_TITLES.map((label, index) => {
        const done = index < step;
        const active = index === step;
        return (
          <li key={label} className="relative grid justify-items-center gap-2 text-center">
            <button type="button" disabled={index > maxStep} onClick={() => go(index)} aria-label={label}
              className={`grid size-10 place-items-center rounded-full border-2 text-sm font-bold transition ${done
                ? "border-transparent bg-gradient-to-br from-nexoraElectric to-nexoraViolet text-white"
                : active
                  ? `scale-110 border-nexoraBrand bg-white text-nexoraBrand ring-4 ring-nexoraBrandSoft/80
                    shadow-[0_4px_12px_rgba(70,72,216,0.18)]`
                  : "border-nexoraBorder bg-white text-nexoraSubtle"}`}>
              {done ? <Check size={16} /> : index + 1}
            </button>
            <span className={`text-[11px] font-bold leading-tight sm:text-xs
              ${active ? "text-nexoraBrand" : "text-nexoraMuted"}`}>
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function StepsScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, personId, profile } = useJobsViewer();
  const [params] = useSearchParams();
  const editId = params.get("edit") ?? undefined;
  const editing = useStore((state) => state.jobPosts.find((post) => post.id === editId && post.seekerId === personId));
  const currentSalon = useStore((state) => salonName(state, profile?.currentSalonId));
  const [d, setD] = useState<StepsDraft>(() => (editing ? fromPost(editing, profile) : EMPTY_STEPS));
  const [step, setStep] = useState(0);
  const [maxStep, setMaxStep] = useState(editing ? 3 : 0);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  if (role !== "tech" || !profile) return <RoleNotice need="tech" />;

  const locked = profile.completion < AI_THRESHOLD;
  const set = (patch: Partial<StepsDraft>) => setD((current) => ({ ...current, ...patch }));
  const go = (next: number) => { setError(""); setStep(next); };
  const next = () => {
    if (!validateStep(step, d)) return setError(STEP_ERRORS[step]);
    setError("");
    if (step < 3) {
      setStep(step + 1);
      setMaxStep(Math.max(maxStep, step + 1));
      return;
    }
    requireAccount("Mở soạn tin tìm việc", () => {
      const id = saveSeekPost({
        seekerId: personId ?? "jessica",
        title: d.title.trim(),
        body: d.body.trim(),
        english: d.english || undefined,
        city: d.city,
        experience: d.experience || undefined,
        days: d.days,
        skills: d.skills,
        workTypes: d.workTypes,
        payType: d.payType || undefined,
        payText: draftPay(d),
        hideFromSalonId: d.hideCurrentSalon ? profile.currentSalonId : undefined,
        durationDays: d.duration,
        method: "steps",
      }, editing?.id);
      toast(editing ? "✓ Đã lưu thay đổi" : "🚀 Đã đăng — tin của bạn đã lên đầu bảng việc làm", "success");
      navigate(`${JOBS}/mine?new=${id}`);
    });
  };

  const Fields = [StepWork, StepPay, StepAbout][step];
  return (
    <div className="space-y-5">
      <PageHeader
        title={editing ? "Sửa tin tìm việc" : screen.title}
        subtitle={editing ? `Đang sửa: ${editing.title}` : "Tự điền 4 bước — đầy đủ nhất, sửa được mọi thông tin."}
        actions={(
          <Button variant="secondary" onClick={() => { setD(fillFromProfile(d, profile)); setError(""); }}>
            <span className="inline-flex items-center gap-2"><Zap size={16} /> Điền nhanh</span>
          </Button>
        )}
      />
      <Card className="p-5 sm:p-6">
        <StepperBar step={step} maxStep={maxStep} go={go} />
        <div className="mx-auto mt-6 max-w-3xl">
          <h2 className="text-lg font-bold">Bước {step + 1}/4 · {STEP_TITLES[step]}</h2>
          <div className="mt-4">
            {Fields ? <Fields d={d} set={set} /> : (
              <div className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={locked} onClick={() => set(aiWrite(d))}>✦ AI viết giúp</Button>
                  <Button variant="secondary" disabled={locked} onClick={() => set({ english: englishVersion(d) })}>
                    🌐 Thêm bản English
                  </Button>
                  <Button variant="secondary" disabled={locked || !d.body}
                    onClick={() => set({ body: shorten(d.body) })}>
                    ✂️ Viết ngắn lại
                  </Button>
                </div>
                {locked && (
                  <p className="flex gap-2 rounded-lg bg-nexoraWarning/10 p-3 text-sm font-semibold">
                    <Lock size={16} className="shrink-0" /> Hồ sơ mới {profile.completion}%. Cần ≥ 60% để AI viết bài.
                  </p>
                )}
                <Field label="Tiêu đề" hint={`${d.title.trim().length} ký tự · ≥ 10`}>
                  <Input value={d.title} onChange={(event) => set({ title: event.target.value })} />
                </Field>
                <Field label="Giới thiệu" hint={`${d.body.trim().length} ký tự · ≥ 30`}>
                  <Textarea className="min-h-36 text-sm leading-6" value={d.body}
                    onChange={(event) => set({ body: event.target.value })} />
                </Field>
                {d.english && (
                  <Field label="Bản English">
                    <Textarea className="min-h-24 text-sm leading-6" value={d.english}
                      onChange={(event) => set({ english: event.target.value })} />
                  </Field>
                )}
                <PhoneWarning texts={[d.title, d.body, d.english]} hidePhone={profile.privacy.hidePhone}
                  onStrip={() => set({ title: stripPhones(d.title), body: stripPhones(d.body),
                    english: stripPhones(d.english) })} />
                <Field label="Riêng tư">
                  <div className="divide-y divide-nexoraRule rounded-lg border border-nexoraBorder">
                    <Toggle checked={d.hideCurrentSalon} onChange={(hideCurrentSalon) => set({ hideCurrentSalon })}
                      label={`Ẩn với tiệm hiện tại${profile.currentSalonId ? ` (${currentSalon})` : ""}`} />
                    <Toggle checked={profile.privacy.hidePhone} label="Ẩn số điện thoại"
                      onChange={(hidePhone) => updatePrivacy(profile.personId, { hidePhone })} />
                  </div>
                </Field>
                <Field label="Thời hạn">
                  <DurationPicker d={d} set={set} />
                </Field>
              </div>
            )}
          </div>
          <div className="mt-5 space-y-3">
            <ErrorText>{error}</ErrorText>
            <div className="flex justify-between gap-3 border-t border-nexoraRule pt-4">
              <Button variant="secondary" disabled={step === 0} onClick={() => go(step - 1)}>Quay lại</Button>
              <Button variant="gradient" onClick={next}>
                {step < 3 ? "Tiếp tục" : editing ? "✓ Lưu thay đổi" : "🚀 Đăng tin"}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
