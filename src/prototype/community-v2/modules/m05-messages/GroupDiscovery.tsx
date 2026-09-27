import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, UsersRound } from "lucide-react";
import { Button, Card, SegmentedPills } from "../../components";
import { getState, useStore } from "../../store";
import { joinPublicGroup } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { M05Overlays } from "./toast";
import { PageHeader } from "./PageHeader";
import { lastOf, paths, preview, useViewerId } from "./lib";

const FILTERS = ["Tất cả", "Thành phố", "Chủ đề"];

/** S05-05 — 6 default public communities, join in one tap. */
export function GroupDiscovery() {
  const [filter, setFilter] = useState(FILTERS[0]);
  const threads = useStore((s) => s.threads);
  const viewerId = useViewerId();
  const { requireAccount } = useCommunityGate();
  const navigate = useNavigate();
  const groups = threads
    .filter((t) => t.groupType === "public")
    .filter((t) => filter === "Tất cả" || (filter === "Thành phố" ? t.filter === "city" : t.filter === "topic"));

  const join = (threadId: string) =>
    requireAccount("tham gia nhóm", () => {
      const me = getState().currentPersonId ?? viewerId ?? "jessica";
      joinPublicGroup(threadId, me);
      navigate(paths.thread(threadId));
    });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Cộng đồng công khai"
        body="Nhóm theo thành phố & chủ đề — tham gia 1 chạm, không cần duyệt."
        back={`${paths.inbox}?tab=groups`}
      />
      <SegmentedPills items={FILTERS} active={filter} onChange={setFilter} />
      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((group) => {
          const joined = viewerId ? group.participantIds.includes(viewerId) : false;
          return (
            <Card key={group.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <span className={[
                  "grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-nexoraElectric",
                  "to-nexoraViolet text-xl",
                ].join(" ")}>
                  {group.filter === "city" ? "🏙️" : "📚"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold leading-snug">{group.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-nexoraSubtle">
                    <UsersRound size={13} /> {group.memberCount?.toLocaleString("vi-VN")} thành viên ·{" "}
                    {group.filter === "city" ? "Thành phố" : "Chủ đề"}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-sm text-nexoraMuted">{group.description}</p>
              <p className="mt-3 truncate rounded-lg bg-nexoraSurfaceMuted px-3 py-2 text-xs text-nexoraMuted">
                💬 {preview(lastOf(group.messages.filter((msg) => msg.kind !== "system")))}
              </p>
              <div className="mt-4 flex gap-2 pt-1">
                {joined ? (
                  <>
                    <span className={[
                      "flex min-h-11 flex-1 items-center justify-center gap-1 rounded-flox-buttons",
                      "bg-nexoraSuccess/10 text-sm font-semibold text-nexoraSuccess",
                    ].join(" ")}>
                      <Check size={16} /> Đã tham gia
                    </span>
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() => navigate(paths.thread(group.id))}>Mở nhóm</Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onClick={() => navigate(paths.thread(group.id))}>Xem</Button>
                    <Button className="flex-1" onClick={() => join(group.id)}>Tham gia</Button>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className={[
        "mt-4 text-xs text-nexoraSubtle",
      ].join(" ")}>
        Mời thành viên bằng @nickname, NX-ID hoặc link nhóm — chưa có luồng (chờ chốt).
      </p>
      <M05Overlays />
    </div>
  );
}
