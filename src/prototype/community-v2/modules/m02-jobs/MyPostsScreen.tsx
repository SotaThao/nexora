import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button, Card, EmptyState, Sheet, useToast } from "../../components";
import { useStore } from "../../store";
import { deleteSeekPost, markHired, renewSeekPost, setSeekStatus } from "../../store/slices/m02";
import type { JobPost, ScreenDefinition } from "../../store/types";
import { JOBS, PageHeader, RoleNotice, StatusBadge, salonName, useJobsViewer } from "./shared";

type Confirm = { kind: "hired" | "delete"; post: JobPost } | null;

const CONFIRM_TEXT = {
  hired: "Bài sẽ gỡ khỏi bảng việc làm và các lời mời đang chờ sẽ được báo là bạn đã có việc.",
  delete: "Bài và lời mời liên quan sẽ bị xoá, không khôi phục được.",
};

function PostCard({ post, fresh, onConfirm }: { post: JobPost; fresh: boolean; onConfirm: (c: Confirm) => void }) {
  const navigate = useNavigate();
  const toast = useToast();
  const hiddenFrom = useStore((state) => (post.hideFromSalonId ? salonName(state, post.hideFromSalonId) : ""));
  const invites = useStore((state) => state.invites.filter((invite) => invite.seekPostId === post.id).length);
  const { status } = post;
  return (
    <Card className={`p-5 ${fresh ? "border-nexoraBrand ring-1 ring-nexoraBrand" : ""}`}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={status} />
        {fresh && <span className="text-xs font-bold text-nexoraBrand">Mới đăng</span>}
        {post.edited && <span className="text-xs font-semibold text-nexoraSubtle">vừa sửa</span>}
        {hiddenFrom && (
          <span className="rounded-full bg-nexoraSidebar/5 px-2.5 py-1 text-xs font-semibold text-nexoraText">
            🔒 Ẩn với {hiddenFrom}
          </span>
        )}
      </div>
      <h2 className="mt-3 font-bold leading-snug">{post.title}</h2>
      <p className="mt-1 line-clamp-2 text-sm text-nexoraMuted">{post.body}</p>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-nexoraMuted">
        <span>👁 {post.views}</span>
        <span>📩 {invites}</span>
        <span>💾 {post.saves}</span>
        <span className={status === "expired" ? "text-nexoraDanger" : ""}>
          {status === "expired" ? "Đã hết hạn" : status === "filled" ? "Đã gỡ khỏi bảng" : `còn ${post.daysLeft} ngày`}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 border-t border-nexoraRule pt-4">
        {status === "expired" && (
          <Button variant="gradient" onClick={() => { renewSeekPost(post.id);
            toast("↻ Đã gia hạn 30 ngày", "success"); }}>
            ↻ Gia hạn 30 ngày
          </Button>
        )}
        {status !== "filled" && (
          <Button variant="secondary" onClick={() => navigate(`${JOBS}/new/steps?edit=${post.id}`)}>✏️ Sửa</Button>
        )}
        {status === "active" && (
          <Button variant="secondary" onClick={() => { setSeekStatus(post.id, "paused"); toast("Đã tạm ẩn bài"); }}>
            ⏸ Tạm ẩn
          </Button>
        )}
        {status === "paused" && (
          <Button variant="secondary" onClick={() => { setSeekStatus(post.id, "active"); toast("Bài đã hiện lại"); }}>
            ▶ Hiện lại
          </Button>
        )}
        {status !== "filled" && (
          <Button variant="secondary" onClick={() => onConfirm({ kind: "hired", post })}>🎉 Đã có việc</Button>
        )}
        <Button variant="ghost" className="text-nexoraDanger" onClick={() => onConfirm({ kind: "delete", post })}>
          🗑 Xoá
        </Button>
      </div>
    </Card>
  );
}

export function MyPostsScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, personId } = useJobsViewer();
  const [params] = useSearchParams();
  const toast = useToast();
  const allPosts = useStore((state) => state.jobPosts);
  const posts = useMemo(
    () => allPosts.filter((post) => post.kind === "seeking" && post.seekerId === personId),
    [allPosts, personId],
  );
  const [confirm, setConfirm] = useState<Confirm>(null);
  if (role !== "tech" || !personId) return <RoleNotice need="tech" />;

  const run = () => {
    if (!confirm) return;
    if (confirm.kind === "hired") {
      markHired(confirm.post.id);
      toast("🎉 Đã đánh dấu có việc", "success");
    } else {
      deleteSeekPost(confirm.post.id);
      toast("Đã xoá bài");
    }
    setConfirm(null);
  };
  const views = posts.reduce((sum, post) => sum + post.views, 0);
  const active = posts.filter((post) => post.status === "active").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title={screen.title}
        subtitle={`${posts.length} tin · ${active} đang hiển thị · ${views} lượt xem`}
        actions={(
          <>
            <Link to={`${JOBS}/invites`} className="inline-flex min-h-11 items-center rounded-flox-buttons border
              border-nexoraBorder bg-white px-4 text-sm font-semibold">📩 Lời mời phỏng vấn</Link>
            <Link to={`${JOBS}/new`} className="inline-flex min-h-11 items-center gap-2 rounded-flox-buttons
              bg-gradient-to-r
              from-nexoraElectric to-nexoraViolet px-4 text-sm font-semibold
                text-white"><Plus size={16} /> Đăng tin</Link>
          </>
        )}
      />
      {posts.length ? (
        <div className="grid gap-4 xl:grid-cols-2">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} fresh={params.get("new") === post.id} onConfirm={setConfirm} />
          ))}
        </div>
      ) : (
        <EmptyState title="Bạn chưa có tin tìm việc" body="Bấm “＋ Đăng tin” — chỉ mất khoảng 30 giây với mẫu có sẵn." />
      )}
      <Sheet open={Boolean(confirm)} onClose={() => setConfirm(null)}
        title={confirm?.kind === "hired" ? "🎉 Đã có việc?" : "🗑 Xoá bài?"}>
        {confirm && (
          <div className="space-y-4">
            <p className="font-semibold">{confirm.post.title}</p>
            <p className="text-sm text-nexoraMuted">{CONFIRM_TEXT[confirm.kind]}</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setConfirm(null)}>Huỷ</Button>
              <Button variant={confirm.kind === "delete" ? "danger" : "gradient"} onClick={run}>
                {confirm.kind === "delete" ? "Xoá bài" : "Xác nhận"}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
