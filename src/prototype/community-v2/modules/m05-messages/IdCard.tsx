import { useState } from "react";
import { BadgeCheck, UserPlus } from "lucide-react";
import { Avatar, Button, Card, EmptyState, Input, QrPlaceholder } from "../../components";
import { useStore } from "../../store";
import { setNickname } from "../../store/slices/m05";
import { useCommunityGate } from "../m00-foundation/gates";
import { M05Overlays, useToast } from "./toast";
import { PageHeader } from "./PageHeader";
import { ShareSheet } from "./ShareSheet";
import { ROLE_LABEL, nicknameOf, paths, personOf, useViewerId } from "./lib";

const RESERVED = ["nexora", "admin", "support"];

export function nicknameError(value: string, taken: string[]) {
  if (!/^[a-z0-9.]{3,20}$/.test(value)) return "Nickname 3–20 ký tự: chữ thường, số, dấu chấm.";
  if (taken.includes(value) || RESERVED.includes(value)) {
    return `@${value} đã có người dùng — thử tên khác.`;
  }
  return "";
}

/** S05-13 — NEXORA ID card + share sheet + change nickname. */
export function IdCard() {
  const state = useStore((s) => s);
  const viewerId = useViewerId();
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const [share, setShare] = useState<"id" | "invite" | null>(null);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const person = personOf(state.people, viewerId ?? undefined);

  if (!person) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader title="Thẻ NEXORA ID" />
        <EmptyState
          title="Chưa có NEXORA ID"
          body="Tạo tài khoản miễn phí để có mã NX-####, @nickname và QR."
        />
        <Button
          variant="gradient"
          className="mt-4 w-full"
          onClick={() => requireAccount("tạo NEXORA ID", () => undefined)}>
          Tạo tài khoản
        </Button>
      </div>
    );
  }

  const nickname = nicknameOf(state, person.id);
  const link = `nexora.link/@${nickname}`;
  const taken = state.people.filter((p) => p.id !== person.id).map((p) => nicknameOf(state, p.id));
  const save = () => {
    const next = value.trim();
    const problem = nicknameError(next, taken);
    setError(problem);
    if (problem) return;
    setNickname(person.id, next);
    setEditing(false);
    toast(`Đã đổi nickname thành @${next}`, "success");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Thẻ NEXORA ID"
        body="Luôn tìm được bằng @nickname, NX-ID hoặc QR."
        back={`${paths.inbox}?tab=privacy`}
      />
      <div className="grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-nexoraElectric to-nexoraViolet" />
          <div className="-mt-12 px-6 pb-6 text-center">
            <Avatar name={person.name} className="mx-auto size-24 !text-2xl ring-4 ring-white" />
            <h3 className="mt-3 text-xl font-bold">{person.name}</h3>
            <p className="text-sm text-nexoraMuted">{ROLE_LABEL[person.role]} · {person.city}</p>
            {person.verified && (
              <p className={[
                "mt-1 inline-flex items-center gap-1 text-sm font-semibold text-nexoraBrand",
              ].join(" ")}><BadgeCheck size={16} /> Xác minh</p>
            )}
            <p className="mt-2 font-mono text-nexoraBrand">@{nickname}</p>
            <p className="font-mono text-sm text-nexoraMuted">NEXORA ID · {person.nxId}</p>
            <div className="mt-4 flex justify-center text-nexoraText"><QrPlaceholder /></div>
            <p className="mt-3 font-mono text-sm text-nexoraBrand">{link}</p>
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="grid gap-2 p-4 sm:grid-cols-2">
            <Button
              variant="gradient"
              className="flex items-center justify-center gap-2"
              onClick={() => setShare("id")}>
              🔗 Chia sẻ ID
            </Button>
            <Button
              variant="secondary"
              className="flex items-center justify-center gap-2"
              onClick={() => { setEditing(true); setValue(nickname); setError(""); }}>
              ✏️ Đổi nickname
            </Button>
          </Card>
          {editing && (
            <Card className="p-4">
              <label className="block text-sm font-semibold" htmlFor="m05-nickname">Nickname mới</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="font-mono text-nexoraMuted">@</span>
                <Input id="m05-nickname" value={value} autoFocus aria-invalid={Boolean(error)}
                  onChange={(event) => { setValue(event.target.value); setError(""); }}
                  onKeyDown={(event) => event.key === "Enter" && save()}
                  className={error ? "border-nexoraDanger" : ""} />
              </div>
              {error && <p className="mt-2 text-sm text-nexoraDanger" role="alert">{error}</p>}
              <p className={[
                "mt-2 text-xs text-nexoraSubtle",
              ].join(" ")}>
                3–20 ký tự: chữ thường, số, dấu chấm. Thử “vy.hoang” để xem lỗi trùng.
              </p>
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setEditing(false)}>Huỷ</Button>
                <Button onClick={save}>Lưu nickname</Button>
              </div>
            </Card>
          )}
          <Card className="flex flex-wrap items-center gap-3 p-4">
            <span className={[
              "grid size-11 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand",
            ].join(" ")}><UserPlus size={19} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">📲 Mời người quen vào NEXORA</p>
              <p className="text-xs text-nexoraMuted">Gửi link, không cần họ có app.</p>
            </div>
            <Button variant="secondary" onClick={() => setShare("invite")}>Gửi link mời</Button>
          </Card>
        </div>
      </div>
      <ShareSheet
        open={share !== null}
        onClose={() => setShare(null)}
        title={share === "invite" ? "Mời người quen" : "Chia sẻ NEXORA ID"}
        link={share === "invite" ? `nexora.link/invite/${person.nxId}` : link} />
      <M05Overlays />
    </div>
  );
}
