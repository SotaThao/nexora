import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, Sparkles } from "lucide-react";
import { Button, Card, Toggle, useToast } from "../../components";
import { useStore } from "../../store";
import { updatePrivacy, updateProfile } from "../../store/slices/m02";
import type { ScreenDefinition, TechProfile } from "../../store/types";
import { AI_THRESHOLD, completionBreakdown } from "./logic";
import { PROFILE_STEPS, StepBasic, StepPortfolio, StepSkills, StepWishes } from "./ProfileSteps";
import { CompletionRing, JOBS, LicenseBadge, PageHeader, RoleNotice, salonName, useJobsViewer } from "./shared";

function StepTabs({ step, setStep }: { step: number; setStep: (step: number) => void }) {
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {PROFILE_STEPS.map((label, index) => {
        const active = index === step;
        const done = index < step;
        return (
          <li key={label}>
            <button type="button" onClick={() => setStep(index)} className="w-full text-left">
              <span className={`block h-1.5 rounded-full ${index <= step
                ? "bg-gradient-to-r from-nexoraElectric via-nexoraElectricMid to-nexoraViolet" : "bg-nexoraBorder"}`} />
              <span className={`mt-2 flex min-h-9 items-start gap-1.5 text-xs font-bold sm:text-sm
                ${active ? "text-nexoraBrand" : "text-nexoraMuted"}`}>
                <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] ${done || active
                  ? "bg-nexoraBrand text-white" : "bg-nexoraSurfaceMuted text-nexoraSubtle"}`}>
                  {done ? <Check size={11} /> : index + 1}
                </span>
                <span className="leading-tight">{label}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function CompletionCard({ profile }: { profile: TechProfile }) {
  const locked = profile.completion < AI_THRESHOLD;
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <CompletionRing value={profile.completion} />
        <div className="min-w-0 space-y-2">
          <p className="font-bold">Hồ sơ hoàn thiện</p>
          <LicenseBadge profile={profile} />
          {locked ? (
            <p className="flex gap-1.5 text-sm font-semibold text-nexoraText">
              <Lock size={15} className="mt-0.5 shrink-0 text-nexoraWarning" />
              Hồ sơ mới {profile.completion}%. Cần ≥ 60% để AI viết bài.
            </p>
          ) : (
            <p className="flex gap-1.5 text-sm font-semibold text-nexoraSuccess">
              <Sparkles size={15} className="mt-0.5 shrink-0" /> Đã mở khoá AI viết bài & AI gợi ý thợ
            </p>
          )}
        </div>
      </div>
      <ul className="mt-4 space-y-1.5 border-t border-nexoraRule pt-3 text-sm">
        {completionBreakdown(profile).map((item) => (
          <li key={item.label} className="flex items-center justify-between gap-2">
            <span className={item.points ? "text-nexoraText" : "text-nexoraSubtle"}>
              {item.points ? "✓" : "○"} {item.label}
            </span>
            <span className={`font-mono text-xs ${item.points ? "text-nexoraSuccess" : "text-nexoraSubtle"}`}>
              +{item.points}/{item.max}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function PrivacyCard({ profile }: { profile: TechProfile }) {
  const salon = useStore((state) => salonName(state, profile.currentSalonId));
  const set = (patch: Partial<TechProfile["privacy"]>) => updatePrivacy(profile.personId, patch);
  return (
    <Card className="p-4">
      <p className="px-3 font-bold">Riêng tư</p>
      <p className="px-3 text-xs text-nexoraMuted">Tiệm chỉ thấy SĐT khi bạn đồng ý sau lời mời phỏng vấn.</p>
      <div className="mt-2 divide-y divide-nexoraRule">
        <Toggle checked={profile.privacy.seeking} onChange={(seeking) => set({ seeking })} label="Đang tìm việc" />
        <div>
          <Toggle checked={profile.privacy.hideCurrentSalon} onChange={(hideCurrentSalon) => set({ hideCurrentSalon })}
            label="Ẩn với tiệm hiện tại" />
          {profile.currentSalonId && (
            <p className="px-3 pb-2 text-xs text-nexoraSubtle">Tiệm hiện tại (theo Staff ID/POS): {salon}</p>
          )}
        </div>
        <Toggle checked={profile.privacy.hidePhone} onChange={(hidePhone) => set({ hidePhone })}
          label="Ẩn số điện thoại" />
        <Toggle checked={profile.privacy.firstNameOnly} onChange={(firstNameOnly) => set({ firstNameOnly })}
          label="Ẩn họ, chỉ hiện tên" />
      </div>
    </Card>
  );
}

export function ProfileScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, profile } = useJobsViewer();
  const [step, setStep] = useState(0);
  const toast = useToast();
  const navigate = useNavigate();
  if (role !== "tech" || !profile) return <RoleNotice need="tech" />;

  const set = (patch: Partial<TechProfile>) => updateProfile(profile.personId, patch);
  const Step = [StepBasic, StepSkills, StepPortfolio, StepWishes][step];
  const last = step === PROFILE_STEPS.length - 1;

  return (
    <div className="space-y-5">
      <PageHeader
        title={screen.title}
        subtitle="Tạo một lần — dùng để AI viết bài, ứng tuyển 1 chạm và để AI gợi ý bạn cho tiệm."
        actions={<Button variant="secondary" onClick={() => navigate(`${JOBS}/new`)}>＋ Đăng tin tìm việc</Button>}
      />
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_1fr] lg:items-start">
        <div className="lg:col-start-2 lg:row-start-1">
          <CompletionCard profile={profile} />
        </div>
        <Card className="p-5 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <StepTabs step={step} setStep={setStep} />
          <h2 className="mt-5 text-lg font-bold">Bước {step + 1}/4 · {PROFILE_STEPS[step]}</h2>
          <div className="mt-4">
            <Step profile={profile} set={set} />
          </div>
          <div className="mt-6 flex justify-between gap-3 border-t border-nexoraRule pt-4">
            <Button variant="secondary" disabled={step === 0} onClick={() => setStep(step - 1)}>Quay lại</Button>
            <Button
              variant="gradient"
              onClick={() => (last ? toast("✓ Đã lưu hồ sơ thợ", "success") : setStep(step + 1))}
            >
              {last ? "Lưu hồ sơ" : "Tiếp tục"}
            </Button>
          </div>
        </Card>
        <div className="lg:col-start-2 lg:row-start-2">
          <PrivacyCard profile={profile} />
        </div>
      </div>
    </div>
  );
}
