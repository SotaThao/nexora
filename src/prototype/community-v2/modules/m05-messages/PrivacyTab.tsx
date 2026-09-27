import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Ban, ChevronRight, Contact, Search, ShieldCheck } from "lucide-react";
import { Avatar } from "../../components";
import { useStore } from "../../store";
import { nicknameOf, paths, personOf, useViewerId } from "./lib";

function Row({ to, icon, title, body }: { to: string; icon: ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className="flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 hover:bg-nexoraSurfaceMuted">
      <span className="grid size-9 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-nexoraSubtle">{body}</span>
      </span>
      <ChevronRight size={17} className="text-nexoraSubtle" />
    </Link>
  );
}

export function PrivacyTab() {
  const viewerId = useViewerId();
  const state = useStore((s) => s);
  const person = personOf(state.people, viewerId ?? undefined);
  if (!viewerId || !person) {
    return <p className={[
      "p-4 text-center text-sm text-nexoraMuted",
    ].join(" ")}>Tạo tài khoản để có NEXORA ID và cài đặt riêng tư.</p>;
  }
  return (
    <div className="space-y-2">
      <Link to={paths.id} className={[
        "block rounded-xl bg-gradient-to-br from-nexoraElectric to-nexoraViolet p-4 text-white",
      ].join(" ")}>
        <div className="flex items-center gap-3">
          <Avatar name={person.name} className="size-12 ring-2 ring-white/50" />
          <div className="min-w-0">
            <p className="truncate font-bold">{person.name}</p>
            <p className="font-mono text-xs text-white/80">NEXORA ID · {person.nxId}</p>
            <p className="font-mono text-xs text-white/80">@{nicknameOf(state, person.id)}</p>
          </div>
        </div>
      </Link>
      <Row
        to={paths.privacy}
        icon={<ShieldCheck size={17} />}
        title="Riêng tư"
        body={`SĐT: ${state.privacy.phoneSearch} · Người lạ: ${state.privacy.strangers}`}
      />
      <Row to={paths.id} icon={<Contact size={17} />} title="Thẻ NEXORA ID"
        body="QR, link, đổi nickname, chia sẻ" />
      <Row
        to={`${paths.privacy}#blocked`}
        icon={<Ban size={17} />}
        title="Đã chặn"
        body={`${state.blockedUserIds.length} người`}
      />
      <Row
        to={paths.find}
        icon={<Search size={17} />}
        title="Tìm người"
        body="@nickname, NX-####, SĐT, email hoặc tên"
      />
    </div>
  );
}
