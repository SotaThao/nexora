import { useMemo } from "react";
import { Lock } from "lucide-react";
import { Avatar, Badge, Card, EmptyState } from "../../components";
import { useStore } from "../../store";
import { selectProfile } from "../../store/slices/m02";
import type { ScreenDefinition } from "../../store/types";
import { InviteAction } from "./invite";
import { LicenseBadge, PageHeader, RoleNotice, formatDate, techPublicName, useJobsViewer } from "./shared";

export function PosApplicationsScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, salonId = "kayla-nails" } = useJobsViewer();
  const state = useStore((value) => value);
  const rows = useMemo(() => {
    const jobs = state.jobPosts.filter((post) => post.kind === "hiring" && post.salonId === salonId);
    return state.applications
      .filter((item) => jobs.some((job) => job.id === item.jobId))
      .map((item) => ({
        item,
        job: jobs.find((job) => job.id === item.jobId),
        profile: selectProfile(state, item.techId),
        name: techPublicName(state, item.techId),
      }));
  }, [state, salonId]);
  if (role !== "owner") return <RoleNotice need="owner" />;

  return (
    <div className="space-y-5">
      <PageHeader pos eyebrow="Tuyển thợ" title={screen.title}
        subtitle="Thợ bấm “Ứng tuyển bằng hồ sơ” trên tin tuyển của tiệm — SĐT vẫn ẩn cho tới khi thợ đồng ý." />
      <Card className="flex flex-col gap-2 border-nexoraWarning/60 bg-nexoraWarning/5 p-4 sm:flex-row sm:items-center">
        <Badge tone="warning">Đề xuất bổ sung</Badge>
        <p className="text-sm text-nexoraMuted">
          Bản mẫu chưa có màn xem đơn phía tiệm (doc 02 · Câu hỏi mở #6) — màn này là đề xuất để Brian chốt.
        </p>
      </Card>
      {rows.length ? (
        <Card className="divide-y divide-nexoraRule">
          {rows.map(({ item, job, profile, name }) => (
            <div key={item.id} className="grid gap-3 p-4
              md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_260px] md:items-center">
              <div className="flex items-center gap-3">
                <Avatar name={name} className="size-11" />
                <div className="min-w-0">
                  <p className="truncate font-bold">{name}</p>
                  <p className="text-xs text-nexoraMuted">
                    {profile ? `Hồ sơ ${profile.completion}% · ${profile.experience ?? "—"} · ${profile.city ?? ""}`
                      : "Thành viên"}
                  </p>
                  <LicenseBadge profile={profile} />
                </div>
              </div>
              <div className="min-w-0 text-sm">
                <p className="truncate font-semibold">{job?.title}</p>
                <p className="flex items-center gap-1.5 text-xs text-nexoraMuted">
                  {formatDate(item.createdAt)} · {item.status === "viewed" ? "Đã xem" : "Mới"} ·
                  <Lock size={12} /> SĐT ẩn
                </p>
              </div>
              <InviteAction techId={item.techId} salonId={salonId} jobId={item.jobId} />
            </div>
          ))}
        </Card>
      ) : (
        <EmptyState title="Chưa có đơn ứng tuyển" body="Đơn mới sẽ hiện ở đây khi thợ ứng tuyển bằng hồ sơ." />
      )}
    </div>
  );
}
