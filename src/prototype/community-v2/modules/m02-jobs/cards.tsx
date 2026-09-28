import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import { Avatar } from "../../components";
import { useStore } from "../../store";
import type { JobPost } from "../../store/types";
import { JOBS, formatDate, salonName, techPublicName } from "./shared";
import { formatSalaryCardLabel } from "./salaryCardLabel";

const NAIL_THUMBNAILS = [
  "/assets/images/marketing/nail/nail_art_luxury.jpg",
  "/assets/images/marketing/nail/nail_glam_french.jpg",
  "/assets/images/marketing/nail/nail_rose_quartz.jpg",
  "/assets/images/marketing/nail/nail_summer_pop.jpg",
  "/assets/images/marketing/nail/nail_zen_minimalist.jpg",
  "/assets/images/marketing/nail/nail_spa_treatment.jpg",
] as const;

const cardClass = "block h-full w-full cursor-pointer rounded-flox-cards border border-nexoraBorder bg-nexoraSurface p-2.5 text-left shadow-nexora-card transition-colors hover:border-nexoraBrand hover:bg-nexoraBrandSoft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2 motion-reduce:transition-none";

const statusLabel: Record<JobPost["status"], string> = {
  active: "Đang mở",
  paused: "Tạm ẩn",
  expired: "Hết hạn",
  filled: "Đã có việc",
};

function JobCardContent({ job, name, thumbnail }: { job: JobPost; name: string; thumbnail: ReactNode }) {
  const title = job.urgent ? job.title.replace(/^\[Cần gấp\]\s*/, "") : job.title;
  const salary = formatSalaryCardLabel(job.payText);
  return (
    <>
      <div className="flex items-start gap-2.5">
        {thumbnail}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {job.urgent && (
              <span className="shrink-0 rounded-md bg-nexoraDanger px-2 py-0.5 text-xs font-extrabold text-white">
                Cần gấp
              </span>
            )}
            {salary && (
              <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md border border-nexoraSuccess/40 bg-nexoraSuccess/10 px-2 py-0.5 text-xs font-extrabold text-nexoraText" title={salary}>
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-nexoraSuccess" aria-hidden="true" />
                {salary}
              </span>
            )}
            {job.status !== "active" && (
              <span className="rounded-md bg-nexoraSurfaceMuted px-2 py-0.5 text-xs font-extrabold text-nexoraMuted">
                {statusLabel[job.status]}
              </span>
            )}
          </div>
          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug text-nexoraText">{title}</h3>
        </div>
      </div>
      <p className="mt-1 flex min-w-0 items-center gap-1 truncate text-sm text-nexoraMuted">
        <span className="min-w-0 truncate font-semibold text-nexoraBrand">{name}</span>
        <span aria-hidden="true">·</span>
        <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{job.city}</span>
        <span aria-hidden="true">·</span>
        <span className="shrink-0">đăng {formatDate(job.createdAt)}</span>
      </p>
      <p className="mt-2 min-h-[63px] line-clamp-3 text-sm leading-relaxed text-nexoraMuted">{job.body}</p>
    </>
  );
}

export function HiringCard({ job, index = 0 }: { job: JobPost; index?: number }) {
  const salon = useStore((state) => salonName(state, job.salonId));
  return (
    <Link to={`${JOBS}/${job.id}`} aria-label={`Mở chi tiết tin: ${job.title}`} className={cardClass}>
      <JobCardContent
        job={job}
        name={salon}
        thumbnail={
          <img src={NAIL_THUMBNAILS[index % NAIL_THUMBNAILS.length]} alt="" width={56} height={56}
            loading="lazy" className="h-14 w-14 shrink-0 rounded-xl object-cover" />
        }
      />
    </Link>
  );
}

export function SeekingCard({ job, onOpen }: { job: JobPost; onOpen: () => void }) {
  const name = useStore((state) => techPublicName(state, job.seekerId));
  return (
    <button type="button" onClick={onOpen} aria-label={`Mở chi tiết tin: ${job.title}`} className={cardClass}>
      <JobCardContent job={job} name={name} thumbnail={<Avatar name={name} className="size-14" />} />
    </button>
  );
}
