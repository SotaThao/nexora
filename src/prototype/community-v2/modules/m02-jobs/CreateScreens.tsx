import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronRight, ListChecks, Lock, MessageSquareText, Timer } from "lucide-react";
import { Badge, Button, Card } from "../../components";
import type { ScreenDefinition } from "../../store/types";
import { AI_THRESHOLD } from "./logic";
import { QuickForm } from "./QuickForm";
import { JOBS, PageHeader, RoleNotice, useJobsViewer } from "./shared";
import { EMPTY_QUICK, SEEK_TEMPLATES, type SeekTemplate } from "./templates";

const METHODS = [
  { to: "template", icon: Timer, title: "Mẫu có sẵn", badge: "~30 giây",
    text: "Chọn 1 trong 8 mẫu, điền khu vực, kinh nghiệm, ngày làm, lương — bài tự viết." },
  { to: "ai", icon: MessageSquareText, title: "Nói/gõ 1 câu", badge: "✦ AI điền giúp", ai: true,
    text: "Bấm 🎤 hoặc gõ “thợ bột 5 năm tìm full-time Houston 1000/tuần” — AI điền các ô." },
  { to: "steps", icon: ListChecks, title: "Tự điền 4 bước", badge: "Đầy đủ nhất",
    text: "Việc muốn tìm · Lương & lịch · Về bạn · Nội dung & đăng. Có “Điền nhanh” từ hồ sơ." },
];

export function MethodScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, profile } = useJobsViewer();
  if (role !== "tech") return <RoleNotice need="tech" />;
  const locked = (profile?.completion ?? 0) < AI_THRESHOLD;
  return (
    <div className="space-y-5">
      <PageHeader title={screen.title} subtitle="Thợ cá nhân đăng miễn phí. Chọn cách phù hợp với bạn." />
      <div className="grid gap-4 md:grid-cols-3">
        {METHODS.map((method) => {
          const Icon = method.icon;
          return (
            <Link key={method.to} to={`${JOBS}/new/${method.to}`} className="group block rounded-flox-cards
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/20">
              <Card className="flex h-full flex-col p-5 transition group-hover:-translate-y-0.5
                group-hover:border-nexoraBrand
                group-hover:shadow-premium">
                <span className="grid size-12 place-items-center rounded-xl bg-gradient-to-br from-nexoraElectric
                  to-nexoraViolet text-white"><Icon size={22} /></span>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">{method.title}</h2>
                  <Badge tone="brand">{method.badge}</Badge>
                </div>
                <p className="mt-2 flex-1 text-sm leading-6 text-nexoraMuted">{method.text}</p>
                {method.ai && locked && (
                  <p className="mt-3 flex gap-1.5 rounded-lg bg-nexoraWarning/10 p-2 text-xs font-semibold">
                    <Lock size={14} className="shrink-0" /> Hồ sơ mới {profile?.completion}%. Cần ≥ 60% để AI viết bài.
                  </p>
                )}
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-nexoraBrand">
                  Chọn cách này <ChevronRight size={16} />
                </span>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function TemplateScreen({ screen }: { screen: ScreenDefinition }) {
  const { role } = useJobsViewer();
  const [template, setTemplate] = useState<SeekTemplate | null>(null);
  if (role !== "tech") return <RoleNotice need="tech" />;
  return (
    <div className="space-y-5">
      <PageHeader
        title={screen.title}
        subtitle={template ? "Tiêu đề + bài tự sinh từ mẫu, sửa tay được." : "Bước 1/2 · Chọn 1 trong 8 mẫu"}
        actions={template && (
          <Button variant="secondary" onClick={() => setTemplate(null)}>
            <span className="inline-flex items-center gap-2"><ArrowLeft size={16} /> Đổi mẫu</span>
          </Button>
        )}
      />
      {template ? (
        <QuickForm template={template} initial={EMPTY_QUICK} method="template" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {SEEK_TEMPLATES.map((item) => (
            <button key={item.id} type="button" onClick={() => setTemplate(item)} className="text-left">
              <Card className="h-full p-4 transition hover:-translate-y-0.5
                hover:border-nexoraBrand hover:shadow-premium">
                <span className="text-3xl" aria-hidden="true">{item.emoji}</span>
                <p className="mt-2 font-bold">{item.name}</p>
                <p className="mt-1 text-sm text-nexoraMuted">{item.hint}</p>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
