import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button, EmptyState } from "../../components";
import { useStore } from "../../store";
import type { JobPost, ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { BoardRail, MobileQuickLinks } from "./BoardRail";
import { OwnerBoard } from "./BoardOwner";
import { ALL_AREAS, BoardFilters, CardGridSkeleton, filterBoard, JOB_CARD_GRID_STYLE, useFakeLoading } from "./boardParts";
import { HiringCard, SeekingCard } from "./cards";
import { SeekingSheet } from "./SeekingSheet";
import { JOBS, PageHeader, useJobsViewer } from "./shared";

export function JobBoardScreen({ screen }: { screen: ScreenDefinition }) {
  const { role } = useJobsViewer();
  if (role === "owner") return <OwnerBoard />;
  return <TechBoard screen={screen} />;
}

function TechBoard({ screen }: { screen: ScreenDefinition }) {
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const { role } = useJobsViewer();
  const loading = useFakeLoading();
  const state = useStore((value) => value);
  const [kind, setKind] = useState<string>("Tất cả");
  const [area, setArea] = useState(ALL_AREAS);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<JobPost | null>(null);

  const posts = useMemo(() => {
    const visible = (state.jobPosts ?? []).filter((post) => post.status === "active");
    const sorted = [...visible].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return filterBoard(state, sorted, kind, area, query);
  }, [state, kind, area, query]);

  const canPost = role === "tech" || role === "guest";
  const post = () => requireAccount("Mở soạn tin tìm việc", () => navigate(`${JOBS}/new`));

  return (
    <div className="space-y-5">
      <PageHeader
        title={screen.title}
        subtitle="Một bảng chung: tiệm đăng tin tuyển từ POS, thợ đăng tin tìm việc — cả hai phía cùng thấy."
        actions={canPost && (
          <Button variant="gradient" onClick={post}>
            <span className="inline-flex items-center gap-2"><Plus size={17} /> Đăng tin tìm việc</span>
          </Button>
        )}
      />
      {role === "tech" && <MobileQuickLinks />}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-4">
          <BoardFilters {...{ kind, setKind, area, setArea, query, setQuery }} />
          <p className="text-sm text-nexoraMuted">{loading ? "Đang tải…" : `${posts.length} tin phù hợp`}</p>
          {loading ? (
            <CardGridSkeleton />
          ) : posts.length ? (
            <div className="grid gap-4" style={JOB_CARD_GRID_STYLE}>
              {posts.map((item, index) =>
                item.kind === "hiring" ? (
                  <HiringCard key={item.id} job={item} index={index} />
                ) : (
                  <SeekingCard key={item.id} job={item} onOpen={() => setOpen(item)} />
                ),
              )}
            </div>
          ) : (
            <EmptyState title="Chưa có tin phù hợp" body="Thử đổi bộ lọc, khu vực hoặc từ khoá tìm kiếm." />
          )}
        </div>
        <BoardRail />
      </div>
      <SeekingSheet job={open} onClose={() => setOpen(null)} />
    </div>
  );
}
