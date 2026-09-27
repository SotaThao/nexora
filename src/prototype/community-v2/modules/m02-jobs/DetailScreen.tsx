import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Lock, MapPin, MessageCircle, Send } from "lucide-react";
import { Avatar, Badge, Button, Card, EmptyState, MoneyTag, useToast } from "../../components";
import { getState, useStore } from "../../store";
import { applyToJob } from "../../store/slices/m02";
import type { ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { publicName } from "./logic";
import { JOBS, LicenseBadge, SALON_OWNER, SalonMark, formatDate, useJobsViewer } from "./shared";

export function DetailScreen(_: { screen: ScreenDefinition }) {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const { role, profile } = useJobsViewer();
  const job = useStore((state) => state.jobPosts.find((post) => post.id === jobId && post.kind === "hiring"));
  const salon = useStore((state) => state.salons.find((item) => item.id === job?.salonId));
  const applied = useStore((state) =>
    state.applications.some((item) => item.jobId === jobId && item.techId === state.currentPersonId),
  );
  if (!job) {
    return <EmptyState title="Không tìm thấy tin tuyển" body="Tin có thể đã được tiệm gỡ khỏi bảng việc làm." />;
  }
  const owner = SALON_OWNER[job.salonId ?? ""];
  const apply = () =>
    requireAccount("ứng tuyển", () => {
      applyToJob(job.id, getState().currentPersonId ?? "jessica");
      toast("✓ Đã gửi hồ sơ tới tiệm (SĐT vẫn ẩn)", "success");
    });
  const facts = [
    ["Kỹ năng cần", job.skills.join(", ") || "—"],
    ["Loại việc", job.workTypes.join(" · ") || "—"],
    ["Hình thức lương", job.payType ?? "—"],
    ["Thành phố", job.city],
  ];

  return (
    <div className="space-y-5">
      <button type="button" onClick={() => navigate(JOBS)}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold
          text-nexoraMuted hover:text-nexoraText">
        <ArrowLeft size={16} /> Bảng việc làm
      </button>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <Card className="overflow-hidden">
          <div className="h-28 bg-gradient-to-br from-nexoraSidebar via-nexoraBrand to-nexoraViolet sm:h-36" />
          <div className="-mt-8 space-y-4 p-5 sm:p-6">
            <div className="flex items-end gap-3">
              <span className="rounded-xl bg-white p-1 shadow-nexora-card"><SalonMark name={salon?.name ?? ""} /></span>
              <div className="min-w-0 pb-1">
                <p className="font-bold">{salon?.name}</p>
                <p className="flex items-center gap-1 text-xs text-nexoraSubtle"><MapPin size={12} /> {job.city}
                  · đăng {formatDate(job.createdAt)} · 👁 {job.views}</p>
              </div>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{job.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {job.urgent && <Badge tone="danger">🔥 Cần gấp</Badge>}
              {job.housing && <Badge tone="brand">🏠 Có chỗ ở</Badge>}
              <Badge tone="neutral">Đăng từ NEXORA POS</Badge>
            </div>
            <dl className="grid gap-2 sm:grid-cols-2">
              {facts.map(([label, value]) => (
                <div key={label} className="rounded-lg bg-nexoraSurfaceMuted p-3">
                  <dt className="text-xs text-nexoraSubtle">{label}</dt>
                  <dd className="text-sm font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-nexoraSubtle">Mức lương</p>
              <p className="mt-1 text-lg"><MoneyTag>{job.payText}</MoneyTag></p>
            </div>
            <p className="whitespace-pre-line text-sm leading-7 text-nexoraMuted">{job.body}</p>
          </div>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <Card className="space-y-4 p-5">
            {role === "owner" ? (
              <p className="text-sm text-nexoraMuted">Bạn đang xem với vai chủ tiệm —
                thợ sẽ thấy nút ứng tuyển ở đây.</p>
            ) : (
              <>
                <p className="font-bold">Ứng tuyển 1 chạm</p>
                {profile && (
                  <div className="flex items-center gap-3 rounded-lg border border-nexoraBorder p-3">
                    <Avatar name={profile.displayName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{publicName(profile, profile.displayName)}</p>
                      <p className="text-xs text-nexoraMuted">Hồ sơ {profile.completion}%
                        · {profile.skills.join(", ")}</p>
                      <LicenseBadge profile={profile} />
                    </div>
                  </div>
                )}
                {applied ? (
                  <p className="flex items-center gap-2 rounded-lg bg-nexoraSuccess/10 p-3
                    text-sm font-bold text-nexoraSuccess">
                    <CheckCircle2 size={17} /> Đã gửi hồ sơ tới tiệm
                  </p>
                ) : (
                  <Button variant="gradient" className="w-full" onClick={apply}>
                    <span className="inline-flex items-center gap-2"><Send size={16} /> Ứng tuyển bằng hồ sơ</span>
                  </Button>
                )}
                <p className="flex items-center gap-2 text-xs text-nexoraMuted">
                  <Lock size={14} /> SĐT vẫn ẩn — tiệm chỉ thấy khi bạn đồng ý sau lời mời phỏng vấn.
                </p>
              </>
            )}
            {owner ? (
              <Link to={`/community-v2/messages/new?to=${owner}`} className="flex min-h-11 items-center justify-center
                gap-2 rounded-flox-buttons border border-nexoraBorder text-sm font-semibold
                  hover:bg-nexoraSurfaceMuted">
                <MessageCircle size={16} /> Nhắn tiệm
              </Link>
            ) : (
              <div>
                <Button variant="secondary" className="w-full" disabled>
                  <span className="inline-flex items-center gap-2"><MessageCircle size={16} /> Nhắn tiệm</span>
                </Button>
                <p className="mt-1.5 text-xs
                  text-nexoraSubtle">Tiệm mẫu này chưa có tài khoản chủ trong dữ liệu demo.</p>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
