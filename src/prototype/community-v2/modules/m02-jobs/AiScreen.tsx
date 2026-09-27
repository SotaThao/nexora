import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Mic, Pencil, X } from "lucide-react";
import { Button, Card, Sheet, Textarea } from "../../components";
import type { JobExperience, ScreenDefinition } from "../../store/types";
import { JOB_CITIES, JOB_EXPERIENCE } from "../../store/types";
import { AI_THRESHOLD } from "./logic";
import { type Parsed, parseSentence } from "./parse";
import { QuickForm } from "./QuickForm";
import { ErrorText, PageHeader, RoleNotice, useJobsViewer } from "./shared";
import { SEEK_TEMPLATES, payText } from "./templates";

const SAMPLE = "thợ bột 5 năm tìm full-time Houston 1000/tuần, giao tiếp tiếng Anh được";
type EditField = "template" | "experience" | "city" | null;

function Recorder({ onDone }: { onDone: (text: string) => void }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearInterval(timer.current), []);
  const start = () => {
    let ticks = 0;
    setSeconds(0);
    timer.current = window.setInterval(() => {
      ticks += 1;
      if (ticks > 3) {
        window.clearInterval(timer.current);
        setSeconds(null);
        onDone(SAMPLE);
        return;
      }
      setSeconds(ticks);
    }, 700);
  };
  const recording = seconds !== null;
  return (
    <div className="flex items-center gap-4">
      <button type="button" onClick={start} disabled={recording} aria-label="Nói bằng giọng"
        className="relative grid size-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-nexoraElectric
          to-nexoraViolet text-white shadow-premium">
        {recording && <span className="absolute inset-0 animate-ping rounded-full bg-nexoraViolet/40" />}
        <Mic size={26} className="relative" />
      </button>
      <div className="min-w-0">
        <p className="font-bold">{recording ? "Đang nghe…" : "🎤 Bấm để nói"}</p>
        <p className="text-sm text-nexoraMuted">
          {recording ? `0:0${seconds} · giả lập ghi âm` : "Hoặc gõ 1 câu vào ô bên dưới."}
        </p>
        {recording && (
          <div className="mt-2 flex h-6 items-end gap-1" aria-hidden="true">
            {[3, 5, 2, 6, 4, 6, 3, 5].map((height, index) => (
              <span key={index} className="w-1.5 animate-pulse rounded-full bg-nexoraBrand"
                style={{ height: `${height * 4}px`, animationDelay: `${index * 90}ms` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChipButton({ label, onEdit, onRemove }: { label: string; onEdit?: () => void; onRemove?: () => void }) {
  return (
    <span className="inline-flex min-h-11 items-center gap-1 rounded-full border border-nexoraLavender bg-white pl-3
      pr-1 text-sm font-semibold text-nexoraText">
      {label}
      {onEdit && (
        <button type="button" aria-label={`Sửa ${label}`} onClick={onEdit}
          className="grid size-9 place-items-center rounded-full text-nexoraBrand hover:bg-nexoraBrandSoft">
          <Pencil size={14} />
        </button>
      )}
      {onRemove && (
        <button type="button" aria-label={`Bỏ ${label}`} onClick={onRemove}
          className="grid size-9 place-items-center rounded-full text-nexoraSubtle hover:bg-nexoraSurfaceMuted">
          <X size={14} />
        </button>
      )}
    </span>
  );
}

export function AiScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, profile } = useJobsViewer();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [editing, setEditing] = useState<EditField>(null);

  const template = useMemo(() => {
    if (!parsed) return null;
    const base = SEEK_TEMPLATES.find((item) => item.id === parsed.templateId) ?? SEEK_TEMPLATES[0];
    return {
      ...base,
      skills: parsed.skills.length ? parsed.skills : base.skills,
      workTypes: parsed.workType ? [parsed.workType] : base.workTypes,
    };
  }, [parsed]);

  if (role !== "tech") return <RoleNotice need="tech" />;
  const locked = (profile?.completion ?? 0) < AI_THRESHOLD;

  const run = () => {
    if (text.trim().length < 6) {
      setParsed(null);
      return setError("Hãy nói hoặc gõ ít nhất vài chữ về việc bạn muốn tìm.");
    }
    setError("");
    setParsed(parseSentence(text));
  };
  const patch = (next: Partial<Parsed>) => setParsed((current) => (current ? { ...current, ...next } : current));
  const patchDraft = (next: Partial<Parsed["draft"]>) =>
    setParsed((current) => (current ? { ...current, draft: { ...current.draft, ...next } } : current));

  return (
    <div className="space-y-5">
      <PageHeader title={screen.title}
        subtitle="AI trích mẫu gần nhất, kỹ năng, kinh nghiệm, loại việc, thành phố, lương." />
      <Card className="space-y-4 p-5">
        <Recorder onDone={(sample) => { setText(sample); setError(""); }} />
        <Textarea className="min-h-24" value={text} placeholder={`Ví dụ: “${SAMPLE}”`}
          onChange={(event) => setText(event.target.value)} />
        <ErrorText>{error}</ErrorText>
        {locked ? (
          <p className="flex gap-2 rounded-lg bg-nexoraWarning/10 p-3 text-sm font-semibold">
            <Lock size={16} className="shrink-0" /> Hồ sơ mới {profile?.completion}%. Cần ≥ 60% để AI viết bài.
          </p>
        ) : (
          <Button variant="gradient" onClick={run}>✦ AI điền giúp</Button>
        )}
        {parsed && template && (
          <div className="space-y-3 rounded-xl bg-nexoraBrandSoft p-4">
            <p className="font-bold text-nexoraBrand">✦ AI hiểu là: …</p>
            {parsed.recognized < 2 && (
              <p className="text-sm font-semibold text-nexoraText">Chưa nhận ra nhiều — đã chọn mẫu gần nhất.</p>
            )}
            <div className="flex flex-wrap gap-2">
              <ChipButton label={`${template.emoji} ${template.name}`} onEdit={() => setEditing("template")} />
              {parsed.skills.map((skill) => (
                <ChipButton key={skill} label={skill}
                  onRemove={() => patch({ skills: parsed.skills.filter((item) => item !== skill) })} />
              ))}
              <ChipButton label={parsed.draft.experience || "Kinh nghiệm: ?"} onEdit={() => setEditing("experience")} />
              {parsed.workType && <ChipButton label={parsed.workType}
                onRemove={() => patch({ workType: undefined })} />}
              <ChipButton label={parsed.draft.city || "Khu vực: ?"} onEdit={() => setEditing("city")} />
              {parsed.draft.payFrom && (
                <ChipButton label={payText("range", parsed.draft.payFrom, "", parsed.draft.payUnit)}
                  onRemove={() => patchDraft({ payMode: "negotiable", payFrom: "" })} />
              )}
              {parsed.payType && <ChipButton label={parsed.payType} onRemove={() => patch({ payType: undefined })} />}
              {parsed.english && (
                <ChipButton label="Tiếng Anh" onRemove={() => {
                  patch({ english: false });
                  patchDraft({ phrases: parsed.draft.phrases.filter((item) => item !== "Giao tiếp tiếng Anh được") });
                }} />
              )}
              {parsed.travel && <ChipButton label="Đi bang khác" onRemove={() => patch({ travel: false })} />}
            </div>
            <p className="text-xs text-nexoraMuted">Bấm ✎ để sửa, × để bỏ — các ô bên dưới đã được điền sẵn.</p>
          </div>
        )}
      </Card>
      {parsed && template && <QuickForm template={template} initial={parsed.draft} method="ai" />}
      <EditSheet field={editing} parsed={parsed} onClose={() => setEditing(null)}
        onPick={(value) => {
          if (editing === "template") patch({ templateId: value });
          if (editing === "experience") patchDraft({ experience: value as JobExperience });
          if (editing === "city") patchDraft({ city: value });
          setEditing(null);
        }} />
    </div>
  );
}

function EditSheet({ field, parsed, onClose, onPick }: {
  field: EditField;
  parsed: Parsed | null;
  onClose: () => void;
  onPick: (value: string) => void;
}) {
  if (!field || !parsed) return null;
  const options = field === "template"
    ? SEEK_TEMPLATES.map((item) => ({ value: item.id, label: `${item.emoji} ${item.name}` }))
    : (field === "experience" ? JOB_EXPERIENCE : JOB_CITIES).map((item) => ({ value: item, label: item }));
  const current = field === "template" ? parsed.templateId : field === "experience" ? parsed.draft.experience
    : parsed.draft.city;
  const title = field === "template" ? "Sửa mẫu" : field === "experience" ? "Sửa kinh nghiệm" : "Sửa khu vực";
  return (
    <Sheet open onClose={onClose} title={title}>
      <div className="grid gap-2">
        {options.map((option) => (
          <Button key={option.value} variant={option.value === current ? "primary" : "secondary"}
            className="justify-start text-left" onClick={() => onPick(option.value)}>
            {option.label}
          </Button>
        ))}
      </div>
    </Sheet>
  );
}
