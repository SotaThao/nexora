import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BadgeCheck, QrCode, Search } from "lucide-react";
import { Avatar, Button, Card } from "../../components";
import { useStore } from "../../store";
import { useCommunityGate } from "../m00-foundation/gates";
import { M05Overlays } from "./toast";
import { PageHeader } from "./PageHeader";
import { ShareSheet } from "./ShareSheet";
import { KIND_LABEL, detectKind, searchPeople } from "./peopleSearch";
import { NOT_FOUND, ROLE_LABEL, nicknameOf, paths, useViewerId } from "./lib";

const HINT = "Tìm bằng @nickname, NX-####, số điện thoại, email hoặc tên.";
const TRY = ["NX-2048", "713-555-2048", "(713) 555-6604", "mai.pham@gmail.com", "@vy.hoang", "Minh"];

/** S05-06 — detection rules + privacy-respecting "not found". */
export function FindPeople() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [inviteOpen, setInviteOpen] = useState(false);
  const state = useStore((s) => s);
  const viewerId = useViewerId();
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const result = searchPeople(state, query, viewerId);
  const update = (value: string) => {
    setQuery(value);
    setParams(value ? { q: value } : {}, { replace: true });
  };
  const message = (id: string) => requireAccount("Gửi tin", () => navigate(paths.newDm(id)));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Tìm người" body={HINT} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <Card className="p-4">
            <label className={[
              "flex min-h-12 items-center gap-2 rounded-lg border border-nexoraBorder",
              "bg-nexoraSurfaceMuted px-3 focus-within:border-nexoraBrand focus-within:bg-white",
            ].join(" ")}>
              <Search size={18} className="text-nexoraSubtle" />
              <input
                autoFocus
                value={query}
                onChange={(event) => update(event.target.value)}
                placeholder="@nickname, NX-####, SĐT, email hoặc tên"
                aria-label="Tìm người"
                className="w-full bg-transparent text-base outline-none"
              />
            </label>
            {query.trim() && (
              <p className="mt-2 text-xs text-nexoraMuted">
                Nhận dạng: <b className="text-nexoraBrand">{KIND_LABEL[detectKind(query)]}</b>
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              {TRY.map((sample) => (
                <button key={sample} type="button" onClick={() => update(sample)}
                  className={[
                    "min-h-9 rounded-full border border-nexoraBorder px-3 font-mono text-xs text-nexoraMuted",
                    "hover:border-nexoraBrand hover:text-nexoraBrand",
                  ].join(" ")}>
                  {sample}
                </button>
              ))}
            </div>
          </Card>

          {result.privateMiss && (
            <Card className="p-5">
              <p className="text-sm leading-relaxed text-nexoraText">{NOT_FOUND}</p>
              <Button variant="gradient" className="mt-4" onClick={() => setInviteOpen(true)}>
                📲 Gửi link mời
              </Button>
            </Card>
          )}
          {!result.privateMiss && query.trim() && result.people.length === 0 && (
            <Card className="p-5 text-sm text-nexoraMuted">
              Không có ai khớp “{query.trim()}”.
              <Button
                variant="secondary"
                className="mt-3 w-full sm:w-auto"
                onClick={() => setInviteOpen(true)}>📲 Gửi link mời</Button>
            </Card>
          )}
          {result.people.length > 0 && (
            <Card className="divide-y divide-nexoraRule">
              {result.people.map((person) => (
                <div key={person.id} className="flex flex-wrap items-center gap-3 p-4">
                  <Avatar name={person.name} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 font-bold">
                      {person.name}
                      {person.verified && (
                        <BadgeCheck size={16} className="text-nexoraBrand" aria-label="Đã xác minh" />
                      )}
                    </p>
                    <p className="text-xs text-nexoraMuted">{ROLE_LABEL[person.role]} · {person.city}</p>
                    <p className={[
                      "font-mono text-xs text-nexoraSubtle",
                    ].join(" ")}>@{nicknameOf(state, person.id)} · {person.nxId}</p>
                  </div>
                  <Button onClick={() => message(person.id)}>Nhắn tin</Button>
                </div>
              ))}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <p className="font-bold">Cách NEXORA tìm</p>
            <ul className="mt-2 space-y-2 text-sm text-nexoraMuted">
              <li><b className="text-nexoraText">NX + số</b> → NEXORA ID, khớp chính xác</li>
              <li><b className="text-nexoraText">≥ 7 chữ số</b> → số điện thoại (so 10 số cuối)</li>
              <li><b className="text-nexoraText">Có @ và dấu chấm</b> → email</li>
              <li><b className="text-nexoraText">Còn lại</b> → tên hoặc @nickname</li>
            </ul>
            <p className="mt-3 rounded-lg bg-nexoraBrandSoft px-3 py-2 text-xs text-nexoraText">
              SĐT/email chỉ ra kết quả khi người đó cho phép. @nickname, NX-ID và QR luôn tìm được.
            </p>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <span className={[
              "grid size-11 place-items-center rounded-lg bg-nexoraSurfaceMuted",
            ].join(" ")}><QrCode size={20} /></span>
            <div className="flex-1 text-sm">
              <p className="font-semibold">📲 Mời người quen vào NEXORA</p>
              <p className="text-xs text-nexoraMuted">Gửi link, không cần họ có app.</p>
            </div>
            <Button variant="secondary" onClick={() => setInviteOpen(true)}>Mời</Button>
          </Card>
        </div>
      </div>
      <ShareSheet
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Gửi link mời"
        link="nexora.link/invite/NX-3107"
      />
      <M05Overlays />
    </div>
  );
}
