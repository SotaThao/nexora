import { toggleJoin } from "../../store/slices/m01";
import type { Group } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { COPY } from "./constants";
import { isMember, useViewer } from "./data";
import { useToast } from "./toast";

/** Join needs an account (guest → sheet → auto-resume); leaving does not (doc 01 · Vai trò). */
export function useJoinToggle() {
  const toast = useToast();
  const { requireAccount } = useCommunityGate();
  const { key } = useViewer();

  return (group: Group) => {
    const run = () => {
      const joined = toggleJoin(group.id);
      toast(joined ? COPY.toastJoin(group.name) : COPY.toastLeave, "success");
    };
    if (isMember(group, key)) run();
    else requireAccount("tham gia nhóm", run);
  };
}
