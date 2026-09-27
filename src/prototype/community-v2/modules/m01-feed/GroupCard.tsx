import { Check, ShoppingBag, UsersRound } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card } from "../../components";
import type { Group } from "../../store/types";
import { ROUTES } from "./constants";
import { isMember, useViewer } from "./data";
import { useJoinToggle } from "./useJoinToggle";

export function GroupIcon({ group, size = "size-12" }: { group: Group; size?: string }) {
  const market = group.kind === "market";
  return (
    <span
      className={`grid ${size} shrink-0 place-items-center rounded-xl ${
        market ? "bg-nexoraViolet/10 text-nexoraViolet" : "bg-nexoraBrandSoft text-nexoraBrand"
      }`}
    >
      {market ? <ShoppingBag size={22} /> : <UsersRound size={22} />}
    </span>
  );
}

export function JoinButton({ group, className = "" }: { group: Group; className?: string }) {
  const { key } = useViewer();
  const toggle = useJoinToggle();
  const joined = isMember(group, key);
  return (
    <Button
      variant={joined ? "secondary" : "primary"}
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
      onClick={() => toggle(group)}
      aria-pressed={joined}
    >
      {joined ? <>Đã tham gia <Check size={16} /></> : "Tham gia"}
    </Button>
  );
}

export function GroupCard({ group }: { group: Group }) {
  return (
    <Card className="flex h-full flex-col p-4">
      <Link to={ROUTES.group(group.id)} className="flex items-start gap-3">
        <GroupIcon group={group} />
        <div className="min-w-0">
          <h3 className="font-bold text-nexoraText">{group.name}</h3>
          <p className="text-xs text-nexoraSubtle">
            {group.industry} · {group.members.toLocaleString("vi-VN")} thành viên
          </p>
        </div>
      </Link>
      <p className="mt-3 text-sm text-nexoraMuted">{group.description}</p>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {group.rules.map((rule) => (
          <li key={rule} className="rounded-full bg-nexoraSurfaceMuted px-2.5 py-1 text-xs font-medium
            text-nexoraMuted">
            {rule}
          </li>
        ))}
      </ul>
      <div className="mt-auto flex gap-2 pt-4">
        <JoinButton group={group} className="flex-1" />
        <Link
          to={ROUTES.group(group.id)}
          className="inline-flex min-h-11 items-center rounded-flox-buttons px-3 text-sm font-semibold
            text-nexoraBrand hover:bg-nexoraBrandSoft"
        >
          Xem nhóm
        </Link>
      </div>
    </Card>
  );
}
