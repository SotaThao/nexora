import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Handshake, MessageCircle } from "lucide-react";
import { Avatar, Badge, Button, Card, Modal, RadioCard } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useCommunityGate } from "../m00-foundation/gates";
import { useStore } from "../../store";
import { inviteToShift, selectBoard } from "../../store/slices/m03";
import type { Person, ScreenDefinition } from "../../store/types";
import { money, shiftWhen } from "./format";
import { isPast, ms, reliabilityOf, seatedCount } from "./rules";
import { KindBadge, OWNER_SALON_ID, ReliabilityLine, RoleGate, SHIFT_PATHS, ShiftNav, ShiftPageHeader }
  from "./ShiftShared";

function InviteModal({ tech, onClose }: { tech: Person | undefined; onClose: () => void }) {
  const board = useStore(selectBoard);
  const shifts = useStore((state) => state.shifts);
  const apps = useStore((state) => state.shiftApplications);
  const [picked, setPicked] = useState<string | null>(null);
  const { requireAccount } = useCommunityGate();
  const toast = useShiftToast();
  const navigate = useNavigate();
  if (!tech) return null;
  const options = shifts
    .filter((item) => item.salonId === OWNER_SALON_ID && item.status === "open" && !isPast(item, board.clock))
    .sort((a, b) => ms(a.startsAt) - ms(b.startsAt));
  const chosen = picked ?? options[0]?.id ?? null;
  const taken = (shiftId: string) => apps.some((item) => item.shiftId === shiftId && item.techId === tech.id);

  const send = () =>
    requireAccount("mời vào ca", () => {
      const shift = options.find((item) => item.id === chosen);
      if (!shift) return;
      if (!inviteToShift(shift.id, tech.id)) return toast(`${tech.name} đã có trong ca này`, "danger");
      toast(`📩 Đã mời ${tech.name} vào ca “${shift.title}” — chờ thợ nhận`, "success");
      onClose();
    });

  return (
    <Modal open onClose={onClose} title={`Mời ${tech.name} vào ca`}>
      {options.length === 0 ? (
        <div className="space-y-4 text-sm text-nexoraMuted">
          <p>Tiệm chưa có ca nào đang tuyển.</p>
          <Button variant="gradient" onClick={() => navigate(SHIFT_PATHS.post)}>Đăng ca mới</Button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-nexoraMuted">
            Chọn ca để gửi lời mời. Thợ nhận lời mời sẽ đặt cọc theo chế độ của ca.
          </p>
          {options.map((shift) => {
            const already = taken(shift.id);
            return (
              <RadioCard key={shift.id} checked={chosen === shift.id} onClick={() => !already && setPicked(shift.id)}>
                <span className={`block ${already ? "opacity-50" : ""}`}>
                  <span className="flex flex-wrap items-center gap-2">
                    <KindBadge kind={shift.kind} />
                    {already && <Badge tone="neutral">Đã có trong ca</Badge>}
                  </span>
                  <span className="mt-1 block text-sm font-semibold">{shift.title}</span>
                  <span className="block text-xs text-nexoraMuted">
                    {shiftWhen(shift, board.clock)} · {money(shift.pay)}/thợ · còn{" "}
                    {shift.staffNeeded - seatedCount(shift.id, apps)} chỗ
                  </span>
                </span>
              </RadioCard>
            );
          })}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button variant="secondary" onClick={onClose}>Để sau</Button>
            <Button variant="gradient" disabled={!chosen || taken(chosen)} onClick={send}>Gửi lời mời</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function AvailableTechsView({ title }: { title: string }) {
  const board = useStore(selectBoard);
  const people = useStore((state) => state.people);
  const salons = useStore((state) => state.salons);
  const navigate = useNavigate();
  const [inviteId, setInviteId] = useState<string | null>(null);

  const techs = people.filter((person) => {
    if (person.role !== "tech") return false;
    const share = board.share[person.id];
    if (share?.homeSalonId === OWNER_SALON_ID) return false;
    return board.availability[person.id]?.ready || share?.shared;
  });

  return (
    <div className="space-y-5">
      <ShiftPageHeader
        pos
        title={title}
        subtitle="Thợ đang bật “Sẵn sàng làm thêm” gần tiệm và thợ tiệm khác chia sẻ"
      />
      <ShiftNav pos />
      <p className="text-sm text-nexoraMuted">
        <b className="text-nexoraText">{techs.length} thợ</b> đang rảnh gần tiệm
      </p>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {techs.map((person) => {
          const share = board.share[person.id];
          const from = share?.shared ? salons.find((item) => item.id === share.homeSalonId) : undefined;
          const availability = board.availability[person.id];
          return (
            <Card key={person.id} className="flex flex-col p-4">
              <div className="flex gap-3">
                <Avatar name={person.name} className="size-12" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 font-bold text-nexoraText">
                    {person.name}
                    {person.license && (
                      <BadgeCheck size={16} className="text-nexoraBrand" aria-label="License xác minh" />
                    )}
                  </p>
                  <p className="text-xs text-nexoraMuted">
                    {person.city} · {person.experienceYears} năm · {person.license}
                  </p>
                </div>
              </div>
              {from && (
                <p
                  className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-nexoraBrandSoft px-3 py-1
                    text-xs font-semibold text-nexoraBrand"
                >
                  <Handshake size={14} /> Chia sẻ từ {from.name} · {share?.day}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {person.skills?.map((skill) => (
                  <span key={skill} className="rounded-md bg-nexoraSurfaceMuted px-2 py-1 text-xs text-nexoraMuted">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="mt-3">
                <ReliabilityLine value={reliabilityOf(person, board.reliability[person.id])} />
              </div>
              {availability?.ready && (
                <p className="mt-2 text-xs text-nexoraSubtle">
                  🟢 Rảnh {availability.days.join(", ") || "linh hoạt"} · đi xa tối đa {availability.radius} mi
                </p>
              )}
              <div className="mt-auto grid grid-cols-[auto_1fr] gap-2 pt-4">
                <Button variant="secondary" aria-label={`Nhắn ${person.name}`}
                  onClick={() => navigate(`/community-v2/messages/new?to=${person.id}`)}>
                  <MessageCircle size={16} />
                </Button>
                <Button variant="gradient" onClick={() => setInviteId(person.id)}>Mời vào ca</Button>
              </div>
            </Card>
          );
        })}
      </div>
      <InviteModal
        key={inviteId ?? "none"}
        tech={people.find((item) => item.id === inviteId)}
        onClose={() => setInviteId(null)}
      />
    </div>
  );
}

export function AvailableTechsScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <RoleGate need="owner">
      <AvailableTechsView title={screen.title} />
    </RoleGate>
  );
}
