import { Lock } from "lucide-react";
import { Avatar, Badge, MoneyTag, Sheet } from "../../components";
import { useStore } from "../../store";
import type { JobPost } from "../../store/types";
import { InviteAction } from "./invite";
import { LicenseBadge, PortfolioTile, techPublicName, useJobsViewer, useProfile } from "./shared";

export function SeekingSheet({ job, onClose }: { job: JobPost | null; onClose: () => void }) {
  const { role, salonId } = useJobsViewer();
  const name = useStore((state) => techPublicName(state, job?.seekerId));
  const profile = useProfile(job?.seekerId);
  if (!job) return null;
  const facts = [
    ["Khu vực", job.city],
    ["Kinh nghiệm", job.experience ?? profile?.experience ?? "—"],
    ["Loại việc", (job.workTypes ?? []).join(" · ") || "—"],
    ["Ngày làm", (job.days ?? []).join(", ") || "—"],
  ];
  return (
    <Sheet open onClose={onClose} title="Tin tìm việc">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={name} className="size-12" />
          <div className="min-w-0">
            <p className="font-bold">{name}</p>
            <LicenseBadge profile={profile} />
          </div>
        </div>
        <h3 className="text-lg font-bold leading-snug">{job.title}</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {facts.map(([label, value]) => (
            <div key={label} className="rounded-lg bg-nexoraSurfaceMuted p-2.5">
              <dt className="text-xs text-nexoraSubtle">{label}</dt>
              <dd className="font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-1.5">
          {(job.skills ?? []).map((skill) => <Badge key={skill} tone="neutral">{skill}</Badge>)}
        </div>
        <p className="whitespace-pre-line text-sm leading-6 text-nexoraMuted">{job.body}</p>
        {job.english && <p className="whitespace-pre-line text-sm leading-6 text-nexoraMuted">{job.english}</p>}
        {Boolean(profile?.portfolio.length) && (
          <div className="grid grid-cols-4 gap-2">
            {profile?.portfolio.slice(0, 4).map((tile, index) => (
              <PortfolioTile key={`${tile}-${index}`} index={tile} label={index === 0 ? "Ảnh bìa" : undefined} />
            ))}
          </div>
        )}
        <p className="flex items-center gap-2 rounded-lg bg-nexoraSurfaceMuted p-3 text-sm">
          <MoneyTag>{job.payText}</MoneyTag>
        </p>
        <p className="flex items-center gap-2 text-xs text-nexoraMuted">
          <Lock size={14} /> SĐT ẩn — tiệm chỉ thấy khi thợ đồng ý sau lời mời phỏng vấn.
        </p>
        {role === "owner" && salonId && job.seekerId ? (
          <InviteAction techId={job.seekerId} salonId={salonId} />
        ) : (
          <p className="text-xs text-nexoraSubtle">Chỉ chủ tiệm mới gửi được lời mời phỏng vấn.</p>
        )}
      </div>
    </Sheet>
  );
}
