import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Briefcase, Inbox, Plus, Sparkles, Store } from "lucide-react";
import { Button, Card, EmptyState } from "../../components";
import { useStore } from "../../store";
import { selectProfile } from "../../store/slices/m02";
import type { DemoState, JobPost } from "../../store/types";
import { ALL_AREAS, BoardFilters, CardGridSkeleton, filterBoard, JOB_CARD_GRID_STYLE, useFakeLoading } from "./boardParts";
import { SeekingCard } from "./cards";
import { SeekingSheet } from "./SeekingSheet";
import { PageHeader, POS_JOBS, salonName, useJobsViewer } from "./shared";

/** Privacy mode: techs hiding from this salon never appear to its owner. */
export function visibleToSalon(state: DemoState, post: JobPost, salonId: string) {
  if (post.hideFromSalonId === salonId) return false;
  const profile = selectProfile(state, post.seekerId);
  return !(profile?.privacy.hideCurrentSalon && profile.currentSalonId === salonId);
}

function Kpi({ label, value, to }: { label: string; value: number; to: string }) {
  return (
    <Link to={to} className="rounded-flox-cards border border-white/15 bg-white/10 p-4 transition hover:bg-white/15">
      <p className="text-[11px] font-black uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-black tracking-tight">{value}</p>
    </Link>
  );
}

export function OwnerBoard() {
  const navigate = useNavigate();
  const { salonId = "kayla-nails" } = useJobsViewer();
  const loading = useFakeLoading();
  const state = useStore((value) => value);
  const [kind, setKind] = useState<string>("Tìm việc");
  const [area, setArea] = useState(ALL_AREAS);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<JobPost | null>(null);

  const mine = state.jobPosts.filter((post) => post.kind === "hiring" && post.salonId === salonId);
  const waiting = state.invites.filter((invite) => invite.salonId === salonId && invite.status === "pending").length;
  const applications = state.applications.filter((item) => mine.some((post) => post.id === item.jobId)).length;
  const seekers = useMemo(() => {
    const visible = state.jobPosts.filter(
      (post) => post.kind === "seeking" && post.status === "active" && visibleToSalon(state, post, salonId),
    );
    return filterBoard(state, visible, "Tìm việc", area, query);
  }, [state, salonId, area, query]);

  return (
    <div className="space-y-6">
      <PageHeader title="Việc làm" subtitle="Chủ tiệm tuyển thợ từ POS — tin tự lên bảng việc làm Community." />
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-nexoraSidebar
        via-nexoraBrand to-nexoraViolet
        p-5 text-white shadow-premium sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/75">
              <span className="rounded bg-white px-1.5 py-0.5 text-[10px] text-nexoraSidebar">POS</span>
              {salonName(state, salonId)}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight">Tuyển thợ từ POS</h2>
            <p className="mt-1 text-sm text-white/80">
              Đăng tin tuyển, xem AI gợi ý thợ phù hợp và mời phỏng vấn. SĐT thợ chỉ hiện khi thợ đồng ý.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button className="bg-white !text-nexoraBrand hover:bg-nexoraBrandSoft"
                onClick={() => navigate(POS_JOBS)}>
                <span className="inline-flex items-center gap-2"><Plus size={16} /> Đăng tin tuyển</span>
              </Button>
              <Button className="border border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate(`${POS_JOBS}/suggestions`)}>
                <span className="inline-flex items-center gap-2"><Sparkles size={16} /> AI gợi ý thợ</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-[420px]">
            <Kpi label="Tin đang tuyển" value={mine.filter((post) => post.status === "active").length} to={POS_JOBS} />
            <Kpi label="Chờ thợ duyệt" value={waiting} to={`${POS_JOBS}/suggestions`} />
            <Kpi label="Đơn ứng tuyển" value={applications} to={`${POS_JOBS}/applications`} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-4">
          <div>
            <h2 className="text-lg font-bold">Thợ đang tìm việc</h2>
            <p className="text-sm text-nexoraMuted">Thợ bật chế độ kín với tiệm của bạn không xuất hiện ở đây.</p>
          </div>
          <BoardFilters {...{ kind, setKind, area, setArea, query, setQuery }} kinds={["Tìm việc"]} />
          {loading ? (
            <CardGridSkeleton />
          ) : seekers.length ? (
            <div className="grid gap-4" style={JOB_CARD_GRID_STYLE}>
              {seekers.map((post) => (
                <SeekingCard key={post.id} job={post} onOpen={() => setOpen(post)} />
              ))}
            </div>
          ) : (
            <EmptyState title="Chưa có thợ phù hợp" body="Thử đổi khu vực hoặc từ khoá tìm kiếm." />
          )}
        </div>
        <aside className="space-y-3">
          <h2 className="flex items-center gap-2 text-lg font-bold"><Store size={18} /> Tin tuyển của tiệm</h2>
          {mine.map((post) => (
            <Card key={post.id} className="p-4">
              <p className="font-bold leading-snug">{post.title}</p>
              <p className="mt-1 text-xs text-nexoraMuted">👁 {post.views} lượt xem · {post.payText}</p>
              <div className="mt-3 flex gap-2">
                <Link to={`${POS_JOBS}/suggestions?job=${post.id}`} className="inline-flex min-h-11 flex-1 items-center
                  justify-center gap-1 rounded-flox-buttons bg-nexoraBrandSoft text-sm font-semibold text-nexoraBrand">
                  <Sparkles size={15} /> Gợi ý thợ
                </Link>
                <Link to={`${POS_JOBS}/applications`} className="inline-flex min-h-11 flex-1 items-center
                  justify-center gap-1 rounded-flox-buttons border border-nexoraBorder text-sm font-semibold">
                  <Inbox size={15} /> Đơn
                </Link>
              </div>
            </Card>
          ))}
          {!mine.length && (
            <Card className="p-4 text-sm text-nexoraMuted">
              <Briefcase className="mb-2 text-nexoraBrand" size={18} /> Chưa có tin tuyển nào.
            </Card>
          )}
        </aside>
      </div>
      <SeekingSheet job={open} onClose={() => setOpen(null)} />
    </div>
  );
}
