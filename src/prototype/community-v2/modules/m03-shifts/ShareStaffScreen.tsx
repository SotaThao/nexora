import { useNavigate } from "react-router-dom";
import { Handshake, Info } from "lucide-react";
import { Avatar, Badge, Button, Card, Select, Toggle } from "../../components";
import { useShiftToast } from "./ShiftToast";
import { useCommunityGate } from "../m00-foundation/gates";
import { useStore } from "../../store";
import { selectBoard, setShare } from "../../store/slices/m03";
import type { Person, ScreenDefinition, StaffShare } from "../../store/types";
import { OWNER_SALON_ID, RoleGate, SHIFT_PATHS, ShiftNav, ShiftPageHeader } from "./ShiftShared";

const DAYS = ["Hôm nay", "Ngày mai", "Thứ 7", "Chủ nhật"];

function StaffRow({ person, share }: { person: Person; share: StaffShare }) {
  const toast = useShiftToast();
  const { requireAccount } = useCommunityGate();
  const turn = (shared: boolean) => {
    setShare(person.id, { shared });
    if (shared) toast(`${person.name} hiện với tiệm gần đây (${share.day})`, "success");
    else toast(`${person.name} không còn hiện với tiệm khác`, "info");
  };
  const pickDay = (day: string) => {
    setShare(person.id, { day });
    if (share.shared) toast(`${person.name} hiện với tiệm gần đây (${day})`, "success");
  };
  const ask = () =>
    requireAccount("hỏi thợ", () => {
      setShare(person.id, { asked: true });
      toast(`Đã gửi yêu cầu — ${person.name} tự bật "Đồng ý chia sẻ" trong app`, "info");
    });

  return (
    <li className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 gap-3">
        <Avatar name={person.name} />
        <div className="min-w-0">
          <p className="font-semibold text-nexoraText">{person.name}</p>
          <p className="truncate text-xs text-nexoraMuted">
            {person.skills?.join(" · ")} · {person.experienceYears} năm
          </p>
          <div className="mt-1">
            {share.consent
              ? <Badge tone="success">✓ Đã đồng ý chia sẻ</Badge>
              : <Badge tone="neutral">Chưa đồng ý chia sẻ</Badge>}
          </div>
        </div>
      </div>
      {share.consent ? (
        <div className="grid gap-2 sm:grid-cols-[160px_220px] md:shrink-0">
          <Select
            aria-label={`Ngày chia sẻ ${person.name}`}
            value={share.day}
            onChange={(event) => pickDay(event.target.value)}
          >
            {DAYS.map((day) => <option key={day}>{day}</option>)}
          </Select>
          <div className={`rounded-lg ${share.shared ? "bg-nexoraSuccess/10" : "bg-nexoraSurfaceMuted"}`}>
            <Toggle checked={share.shared} onChange={turn} label={share.shared ? "Đang chia sẻ" : "Chia sẻ"} />
          </div>
        </div>
      ) : (
        <Button variant="secondary" className="md:shrink-0" onClick={ask}>
          {share.asked ? "Hỏi lại thợ" : "Hỏi thợ"}
        </Button>
      )}
    </li>
  );
}

function ShareStaffView({ title }: { title: string }) {
  const board = useStore(selectBoard);
  const people = useStore((state) => state.people);
  const salons = useStore((state) => state.salons);
  const navigate = useNavigate();
  const entries = Object.entries(board.share);
  const staff = entries.filter(([, share]) => share.homeSalonId === OWNER_SALON_ID);
  const incoming = entries.filter(([, share]) => share.homeSalonId !== OWNER_SALON_ID && share.shared);
  const find = (id: string) => people.find((item) => item.id === id);

  return (
    <div className="space-y-5">
      <ShiftPageHeader pos title={title} subtitle="Cho thợ rảnh của tiệm hiện với tiệm gần đây vào ngày dư người" />
      <ShiftNav pos />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="p-5">
          <p className="flex items-center gap-2 font-bold"><Handshake size={18} className="text-nexoraBrand" />
            🤝 Chia sẻ thợ dư cho tiệm khác</p>
          <p className="mt-1 text-sm text-nexoraMuted">
            Chỉ thợ đã tự bật “Đồng ý chia sẻ” mới bật được. Thợ chưa đồng ý chỉ có nút “Hỏi thợ”.
          </p>
          <ul className="mt-2 divide-y divide-nexoraRule">
            {staff.map(([id, share]) => {
              const person = find(id);
              return person ? <StaffRow key={id} person={person} share={share} /> : null;
            })}
          </ul>
        </Card>
        <div className="space-y-4">
          <Card className="p-4">
            <p className="flex items-center gap-2 text-sm font-bold">
              <Info size={16} className="text-nexoraBrand" /> Nguyên tắc
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-nexoraMuted">
              <li>Chủ tiệm không “cho mượn” thay thợ — thợ tự quyết.</li>
              <li>Không có dòng tiền giữa hai tiệm trong bản mẫu.</li>
              <li>Tiệm khác thấy thợ với nhãn “Chia sẻ từ &lt;tiệm&gt;”.</li>
            </ul>
          </Card>
          <Card className="p-4">
            <p className="text-sm font-bold">Tiệm khác đang chia sẻ · {incoming.length}</p>
            <ul className="mt-2 space-y-2">
              {incoming.map(([id, share]) => (
                <li key={id} className="flex items-center gap-2 text-sm">
                  <Avatar name={find(id)?.name ?? id} className="size-8 text-xs" />
                  <span className="min-w-0 flex-1 truncate">
                    <b>{find(id)?.name}</b> · {salons.find((item) => item.id === share.homeSalonId)?.name} · {share.day}
                  </span>
                </li>
              ))}
            </ul>
            <Button className="mt-3 w-full" variant="secondary" onClick={() => navigate(SHIFT_PATHS.available)}>
              Xem thợ rảnh gần tiệm
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}

export function ShareStaffScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <RoleGate need="owner">
      <ShareStaffView title={screen.title} />
    </RoleGate>
  );
}
