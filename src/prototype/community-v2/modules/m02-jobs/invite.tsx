import { Mail } from "lucide-react";
import { Button, useToast } from "../../components";
import { useStore } from "../../store";
import { selectProfile, sendInvite } from "../../store/slices/m02";
import type { InterviewInvite } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { formatPhone } from "./logic";
import { techPublicName } from "./shared";

/** Owner-side label of an invite (doc 02 Luồng 3 / 4). */
export function OwnerInviteStatus({ invite }: { invite: InterviewInvite }) {
  const phone = useStore((state) => selectProfile(state, invite.techId)?.phone ?? "");
  if (invite.status === "accepted") {
    return (
      <span className="inline-flex flex-wrap items-center gap-1 rounded-full bg-nexoraSuccess/10 px-3 py-1.5 text-xs
        font-bold text-nexoraSuccess">
        ✓ Thợ đồng ý · 📞 <span className="font-mono">{formatPhone(phone)}</span>
      </span>
    );
  }
  if (invite.status === "declined") {
    return (
      <span className="inline-flex rounded-full bg-nexoraDanger/10 px-3 py-1.5 text-xs font-bold text-nexoraDanger">
        Thợ từ chối
      </span>
    );
  }
  if (invite.techHired) {
    return (
      <span className="inline-flex rounded-full bg-nexoraBrandSoft px-3 py-1.5 text-xs font-bold text-nexoraBrand">
        Thợ đã có việc
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-nexoraWarning/10 px-3 py-1.5 text-xs font-bold text-nexoraText">
      Chờ thợ duyệt · SĐT ẩn
    </span>
  );
}

/** "Mời phỏng vấn" with the two blocking rules: one invite per tech per salon, no invite when hired. */
export function InviteAction({ techId, salonId, jobId }: { techId: string; salonId: string; jobId?: string }) {
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const existing = useStore((state) =>
    state.invites.find((invite) => invite.salonId === salonId && invite.techId === techId),
  );
  const hired = useStore((state) => Boolean(selectProfile(state, techId)?.hired));
  const name = useStore((state) => techPublicName(state, techId));

  const invite = () =>
    requireAccount("mời phỏng vấn", () => {
      const result = sendInvite({ salonId, techId, jobId });
      if (result.ok) toast(`📩 Đã gửi lời mời tới ${name}`, "success");
      else if (result.reason === "hired") toast("Thợ đã có việc", "danger");
      else toast("Tiệm đã mời thợ này — mỗi tiệm chỉ mời mỗi thợ 1 lần.", "danger");
    });

  if (existing) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <OwnerInviteStatus invite={existing} />
        <Button variant="ghost" className="px-3 text-xs" onClick={invite}>
          Mời lại
        </Button>
      </div>
    );
  }
  if (hired) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-nexoraMuted">Thợ đã có việc — không mời được</span>
        <Button variant="secondary" aria-disabled="true" className="opacity-45" onClick={invite}>
          Mời phỏng vấn
        </Button>
      </div>
    );
  }
  return (
    <Button variant="gradient" className="w-full" onClick={invite}>
      <span className="inline-flex items-center justify-center gap-2">
        <Mail size={16} /> Mời phỏng vấn
      </span>
    </Button>
  );
}
