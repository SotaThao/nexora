import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Avatar, Card, EmptyState, Select } from "../../components";
import { useStore } from "../../store";
import { selectProfile } from "../../store/slices/m02";
import type { DemoState, JobPost, ScreenDefinition, TechProfile } from "../../store/types";
import { InviteAction, OwnerInviteStatus } from "./invite";
import { AI_THRESHOLD, type MatchScore, matchScore } from "./logic";
import { LicenseBadge, PageHeader, POS_JOBS, RoleNotice, formatDate, techPublicName, useJobsViewer } from "./shared";

type Candidate = { profile: TechProfile; name: string; score: MatchScore };

/** Eligible = profile ≥ 60%, "Đang tìm việc" on, not hiding from this salon (privacy mode). */
export function suggest(state: DemoState, job: JobPost, salonId: string) {
  const hidden: string[] = [];
  let below = 0;
  const list: Candidate[] = [];
  state.techProfiles.forEach((raw) => {
    const profile = selectProfile(state, raw.personId);
    if (!profile || !profile.privacy.seeking) return;
    if (profile.privacy.hideCurrentSalon && profile.currentSalonId === salonId)
      return void hidden.push(profile.personId);
    if (profile.completion < AI_THRESHOLD) return void below++;
    list.push({ profile, name: techPublicName(state, profile.personId), score: matchScore(job, profile) });
  });
  list.sort((a, b) => b.score.total - a.score.total);
  return { list, hidden: hidden.length, below };
}

function ScoreBar({ score }: { score: MatchScore }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-black tracking-tight text-nexoraBrand">{score.total}%</span>
        <span className="text-xs font-semibold text-nexoraSubtle">khớp</span>
      </div>
      <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-nexoraSurfaceMuted">
        <span className="bg-nexoraElectric" style={{ width: `${score.skill}%` }} />
        <span className="bg-nexoraViolet" style={{ width: `${score.city}%` }} />
        <span className="bg-nexoraTeal" style={{ width: `${score.workType}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-nexoraMuted">
        Kỹ năng +{score.skill} · Thành phố +{score.city} · Loại việc +{score.workType}
      </p>
    </div>
  );
}

export function PosSuggestionsScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, salonId = "kayla-nails" } = useJobsViewer();
  const [params, setParams] = useSearchParams();
  const state = useStore((value) => value);
  const jobs = useMemo(
    () => state.jobPosts.filter((post) => post.kind === "hiring" && post.salonId === salonId),
    [state.jobPosts, salonId],
  );
  const job = jobs.find((post) => post.id === params.get("job")) ?? jobs[0];
  const result = useMemo(() => (job ? suggest(state, job, salonId) : null), [state, job, salonId]);
  const sent = state.invites.filter((invite) => invite.salonId === salonId);
  if (role !== "owner") return <RoleNotice need="owner" />;

  return (
    <div className="space-y-5">
      <PageHeader pos eyebrow="Tuyển thợ" title={screen.title}
        subtitle="Điểm % = 60 × kỹ năng trùng / số kỹ năng cần + 25 cùng thành phố + 15 loại việc khớp (trần 100)." />
      {!job || !result ? (
        <EmptyState title="Chưa có tin tuyển" body="Đăng tin tuyển trong POS để AI gợi ý thợ phù hợp." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
          <div className="min-w-0 space-y-4">
            <Card className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
              <label className="block text-sm font-semibold">
                Gợi ý cho tin tuyển
                <Select className="mt-1" value={job.id} onChange={(event) => setParams({ job: event.target.value })}>
                  {jobs.map((post) => <option key={post.id} value={post.id}>{post.title}</option>)}
                </Select>
              </label>
              <Link to={POS_JOBS} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-flox-buttons
                border border-nexoraBorder px-4 text-sm font-semibold"><Plus size={16} /> Tin mới</Link>
            </Card>
            <p className="rounded-lg border border-nexoraBrand/20 bg-nexoraBrandSoft/60 p-3 text-sm text-nexoraText">
              🛡️ {result.hidden ? `${result.hidden} thợ` : "Thợ"} đang làm tại tiệm của bạn
                và bật chế độ kín — nên không
              xuất hiện ở đây.
            </p>
            {result.below > 0 && (
              <p className="text-xs text-nexoraSubtle">
                {result.below} thợ có hồ sơ dưới 60% nên chưa vào AI gợi ý.
              </p>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {result.list.map(({ profile, name, score }) => (
                <Card key={profile.personId} className="flex flex-col gap-3 p-4">
                  <div className="flex items-start gap-3">
                    <Avatar name={name} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold">{name}</p>
                      <p className="text-xs text-nexoraMuted">
                        {profile.city} · {profile.experience} · {profile.workTypes.join(", ")}
                      </p>
                      <div className="mt-1"><LicenseBadge profile={profile} /></div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <span key={skill} className={`rounded-md px-2 py-1 text-xs font-semibold
                        ${score.matched.includes(skill)
                        ? "bg-nexoraBrandSoft text-nexoraBrand" : "bg-nexoraSurfaceMuted text-nexoraMuted"}`}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <ScoreBar score={score} />
                  <div className="mt-auto border-t border-nexoraRule pt-3">
                    <InviteAction techId={profile.personId} salonId={salonId} jobId={job.id} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <aside className="space-y-3 xl:sticky xl:top-24">
            <h2 className="text-sm font-black uppercase tracking-wider
              text-nexoraSubtle">Lời mời đã gửi · {sent.length}</h2>
            <Card className="divide-y divide-nexoraRule">
              {sent.map((invite) => (
                <div key={invite.id} className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold">{techPublicName(state, invite.techId)}</p>
                    <span className="shrink-0 text-xs text-nexoraSubtle">{formatDate(invite.createdAt)}</span>
                  </div>
                  <OwnerInviteStatus invite={invite} />
                </div>
              ))}
              {!sent.length && <p className="p-4 text-sm text-nexoraMuted">Chưa gửi lời mời nào.</p>}
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
