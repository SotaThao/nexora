import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Briefcase, Clock3, MapPin, Search } from "lucide-react";
import { Avatar, Badge, Card, MoneyTag } from "../../components";
import { useStore } from "../../store";
import type { JobPost } from "../../store/types";
import { JOBS, LicenseBadge, useProfile, SalonMark, salonName, techPublicName } from "./shared";

function SkillChips({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span key={skill} className="rounded-md bg-nexoraSurfaceMuted px-2 py-1 text-xs font-semibold text-nexoraMuted">
          {skill}
        </span>
      ))}
    </div>
  );
}

function KindLabel({ kind }: { kind: JobPost["kind"] }) {
  const hiring = kind === "hiring";
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider
      ${hiring ? "text-nexoraBrand" : "text-nexoraTealAlt"}`}>
      {hiring ? <Briefcase size={13} /> : <Search size={13} />}
      {hiring ? "Tuyển thợ" : "Tìm việc"}
    </span>
  );
}

export function HiringCard({ job, index = 0 }: { job: JobPost; index?: number }) {
  const salon = useStore((state) => salonName(state, job.salonId));
  return (
    <Link to={`${JOBS}/${job.id}`} className="block h-full rounded-flox-cards focus-visible:outline-none
      focus-visible:ring-2 focus-visible:ring-nexoraBrand/20">
      <Card className="flex h-full flex-col p-4 transition hover:-translate-y-0.5 hover:shadow-premium">
        <div className="flex items-start gap-3">
          <SalonMark name={salon} index={index} />
          <div className="min-w-0 flex-1">
            <KindLabel kind="hiring" />
            <p className="truncate text-sm font-bold text-nexoraText">{salon}</p>
            <p className="flex items-center gap-1 text-xs text-nexoraSubtle">
              <MapPin size={12} /> {job.city}
            </p>
          </div>
        </div>
        <h3 className="mt-3 font-bold leading-snug text-nexoraText">{job.title}</h3>
        {(job.urgent || job.housing) && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {job.urgent && <Badge tone="danger">🔥 Cần gấp</Badge>}
            {job.housing && <Badge tone="brand">🏠 Có chỗ ở</Badge>}
          </div>
        )}
        <div className="mt-3">
          <SkillChips skills={job.skills ?? []} />
        </div>
        <div className="mt-auto pt-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-nexoraRule pt-3 text-sm">
            <MoneyTag>{job.payText}</MoneyTag>
            <span className="text-xs font-semibold text-nexoraMuted">{(job.workTypes ?? []).join(" · ")}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export function SeekingCard({ job, action, onOpen }: { job: JobPost; action?: ReactNode; onOpen?: () => void }) {
  const name = useStore((state) => techPublicName(state, job.seekerId));
  const profile = useProfile(job.seekerId);
  return (
    <Card className="flex h-full flex-col p-4">
      <button type="button" onClick={onOpen} className="text-left focus-visible:outline-none">
        <div className="flex items-start gap-3">
          <Avatar name={name} className="size-11" />
          <div className="min-w-0 flex-1">
            <KindLabel kind="seeking" />
            <p className="truncate text-sm font-bold text-nexoraText">{name}</p>
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-nexoraSubtle">
              <span className="inline-flex items-center gap-1"><MapPin size={12} /> {job.city}</span>
              {job.experience && <span className="inline-flex items-center
                gap-1"><Clock3 size={12} /> {job.experience}</span>}
            </p>
          </div>
        </div>
        <div className="mt-2">
          <LicenseBadge profile={profile} />
        </div>
        <h3 className="mt-2 font-bold leading-snug text-nexoraText">{job.title}</h3>
        <div className="mt-3">
          <SkillChips skills={job.skills ?? []} />
        </div>
      </button>
      <div className="mt-auto pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-nexoraRule pt-3 text-sm">
          <MoneyTag>{job.payText}</MoneyTag>
          <span className="text-xs font-semibold text-nexoraMuted">{(job.workTypes ?? []).join(" · ")}</span>
        </div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </Card>
  );
}
