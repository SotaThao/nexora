import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Lock, MessageCircle } from "lucide-react";
import { Button, Card, EmptyState, useToast } from "../../components";
import { useStore } from "../../store";
import { respondInvite } from "../../store/slices/m02";
import type { InterviewInvite, ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { formatPhone } from "./logic";
import { PageHeader, RoleNotice, SALON_OWNER, SalonMark, formatDate, useJobsViewer } from "./shared";

function InviteCard({ invite, phone }: { invite: InterviewInvite; phone: string }) {
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const salon = useStore((state) => state.salons.find((item) => item.id === invite.salonId));
  const job = useStore((state) => state.jobPosts.find((post) => post.id === invite.jobId));
  const owner = SALON_OWNER[invite.salonId];
  const answer = (accept: boolean) =>
    requireAccount("đồng ý/từ chối chia sẻ SĐT", () => {
      respondInvite(invite.id, accept);
      toast(accept ? "✓ Đã chia sẻ SĐT với tiệm" : "Đã từ chối lời mời", accept ? "success" : "info");
    });

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <SalonMark name={salon?.name ?? "Tiệm"} index={invite.salonId.length} />
        <div className="min-w-0 flex-1">
          <p className="font-bold leading-snug">🏪 {salon?.name ?? "Tiệm NEXORA"} · Mời bạn phỏng vấn thử tay nghề</p>
          <p className="mt-1 text-sm text-nexoraMuted">
            {salon?.city} · {formatDate(invite.createdAt)}{job ? ` · Tin: ${job.title}` : ""}
          </p>
        </div>
      </div>
      {invite.status === "pending" && (
        <>
          <p className="mt-3 flex items-center gap-2 rounded-lg bg-nexoraSurfaceMuted p-3 text-sm text-nexoraMuted">
            <Lock size={15} /> SĐT của bạn đang ẩn — tiệm chỉ thấy khi bạn đồng ý.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Button variant="gradient" onClick={() => answer(true)}>Đồng ý & chia sẻ SĐT</Button>
            <Button variant="secondary" onClick={() => answer(false)}>Từ chối</Button>
          </div>
        </>
      )}
      {invite.status === "accepted" && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-nexoraSuccess/10 px-3 py-1.5 text-sm font-bold text-nexoraSuccess">
            ✓ Đã chia sẻ SĐT · 📞 <span className="font-mono">{formatPhone(phone)}</span>
          </span>
          {owner && (
            <Link to={`/community-v2/messages/new?to=${owner}`} className="inline-flex min-h-11 items-center gap-2
              rounded-flox-buttons border border-nexoraBorder px-4 text-sm font-semibold">
              <MessageCircle size={16} /> Nhắn tiệm
            </Link>
          )}
        </div>
      )}
      {invite.status === "declined" && (
        <p className="mt-4 inline-flex rounded-full bg-nexoraSurfaceMuted px-3 py-1.5
          text-sm font-bold text-nexoraMuted">
          Đã từ chối
        </p>
      )}
    </Card>
  );
}

export function InvitesScreen({ screen }: { screen: ScreenDefinition }) {
  const { role, personId, profile } = useJobsViewer();
  const all = useStore((state) => state.invites);
  const mine = useMemo(() => all.filter((invite) => invite.techId === personId), [all, personId]);
  if (role !== "tech") return <RoleNotice need="tech" />;
  const pending = mine.filter((invite) => invite.status === "pending");
  const answered = mine.filter((invite) => invite.status !== "pending");
  const section = (title: string, list: InterviewInvite[], empty: string) => (
    <section className="space-y-3">
      <h2 className="text-sm font-black uppercase tracking-wider text-nexoraSubtle">{title} · {list.length}</h2>
      {list.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((invite) => <InviteCard key={invite.id} invite={invite} phone={profile?.phone ?? ""} />)}
        </div>
      ) : (
        <EmptyState title={empty} body="Hồ sơ đủ ≥ 60% sẽ được AI gợi ý tới các tiệm phù hợp." />
      )}
    </section>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="📩 Lời mời phỏng vấn" subtitle={`${screen.title} · ${pending.length} lời mời đang chờ bạn`} />
      {section("Chờ trả lời", pending, "Chưa có lời mời mới")}
      {section("Đã trả lời", answered, "Chưa trả lời lời mời nào")}
    </div>
  );
}
