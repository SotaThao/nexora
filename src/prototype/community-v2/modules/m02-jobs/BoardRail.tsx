import { Link } from "react-router-dom";
import { ChevronRight, FileText, Mail, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "../../components";
import { useStore } from "../../store";
import { AI_THRESHOLD } from "./logic";
import { CompletionRing, JOBS, useJobsViewer } from "./shared";

function useTechCounts(personId: string | null) {
  const pending = useStore(
    (state) => state.invites.filter((invite) => invite.techId === personId && invite.status === "pending").length,
  );
  const posts = useStore(
    (state) => state.jobPosts.filter((post) => post.kind === "seeking" && post.seekerId === personId).length,
  );
  return { pending, posts };
}

function RailLink({ to, icon, title, meta }: { to: string; icon: React.ReactNode; title: string; meta: string }) {
  return (
    <Link
      to={to}
      className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 transition hover:bg-nexoraSurfaceMuted"
    >
      <span className="grid size-9 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-nexoraText">{title}</span>
        <span className="block text-xs text-nexoraMuted">{meta}</span>
      </span>
      <ChevronRight size={16} className="text-nexoraSubtle" />
    </Link>
  );
}

export function BoardRail() {
  const { role, personId, profile } = useJobsViewer();
  const { pending, posts } = useTechCounts(personId);
  if (role !== "tech") {
    return (
      <aside className="space-y-4">
        <Card className="p-5">
          <ShieldCheck className="text-nexoraBrand" />
          <p className="mt-3 font-bold">Bạn là thợ?</p>
          <p className="mt-1 text-sm text-nexoraMuted">
            Tạo Hồ sơ thợ một lần: AI viết bài, ứng tuyển 1 chạm. Ẩn với tiệm đang làm, ẩn số điện thoại —
            tiệm chỉ thấy SĐT khi bạn đồng ý.
          </p>
        </Card>
      </aside>
    );
  }
  const completion = profile?.completion ?? 0;
  return (
    <aside className="hidden space-y-4 lg:block">
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <CompletionRing value={completion} size={84} />
          <div className="min-w-0">
            <p className="font-bold">Hồ sơ thợ</p>
            <p className="text-xs text-nexoraMuted">
              {completion < AI_THRESHOLD ? `Hồ sơ mới ${completion}%. Cần ≥ 60% để AI viết bài.`
                : "✦ AI viết bài đã mở"}
            </p>
          </div>
        </div>
        <Link
          to={`${JOBS}/profile`}
          className="mt-4 flex min-h-11 items-center justify-center rounded-flox-buttons border border-nexoraBorder
            text-sm font-semibold hover:bg-nexoraSurfaceMuted"
        >
          Hoàn thiện hồ sơ
        </Link>
      </Card>
      <Card className="p-2">
        <RailLink to={`${JOBS}/invites`} icon={<Mail size={17} />} title="📩 Lời mời phỏng vấn"
          meta={pending ? `${pending} lời mời đang chờ bạn` : "Không có lời mời mới"} />
        <RailLink to={`${JOBS}/mine`} icon={<FileText size={17} />} title="Tin của tôi" meta={`${posts} tin`} />
        <RailLink to={`${JOBS}/profile`} icon={<UserRound size={17} />} title="Riêng tư"
          meta={profile?.privacy.hidePhone ? "Đang ẩn số điện thoại" : "SĐT đang hiện"} />
      </Card>
    </aside>
  );
}

export function MobileQuickLinks() {
  const { personId, profile } = useJobsViewer();
  const { pending, posts } = useTechCounts(personId);
  const items = [
    { to: `${JOBS}/profile`, value: `${profile?.completion ?? 0}%`, label: "Hồ sơ thợ" },
    { to: `${JOBS}/invites`, value: String(pending), label: "Lời mời chờ" },
    { to: `${JOBS}/mine`, value: String(posts), label: "Tin của tôi" },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 lg:hidden">
      {items.map((item) => (
        <Link key={item.to} to={item.to} className="rounded-flox-cards border border-nexoraBorder bg-white p-3
          text-center shadow-nexora-card">
          <span className="block text-lg font-black text-nexoraBrand">{item.value}</span>
          <span className="block text-xs font-semibold text-nexoraMuted">{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
