import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Tabs } from "../../components";
import { useStore } from "../../store";
import type { ScreenDefinition } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { ROUTES } from "./constants";
import { isMember, useViewer } from "./data";
import { GroupCard } from "./GroupCard";
import { PageTitle } from "./ui";

const TABS = ["Nhóm ngành", "Chợ"];

export function GroupsScreen(_: { screen: ScreenDefinition }) {
  const [tab, setTab] = useState(TABS[0]);
  const groups = useStore((s) => s.groups);
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const { key } = useViewer();
  const kind = tab === "Chợ" ? "market" : "community";
  const list = groups.filter((group) => group.kind === kind);
  const joinedCount = groups.filter((group) => group.kind !== "feed" && isMember(group, key)).length;

  return (
    <div className="mx-auto max-w-6xl">
      <PageTitle
        title="Nhóm & Chợ"
        subtitle={`Tham gia tự do, không cần duyệt. Bạn đang ở ${joinedCount} nhóm.`}
        action={
          <Button
            variant="gradient"
            className="inline-flex items-center gap-1.5"
            onClick={() => requireAccount("tạo nhóm", () => navigate(ROUTES.newGroup))}
          >
            <Plus size={17} /> Tạo nhóm
          </Button>
        }
      />
      <Tabs items={TABS} active={tab} onChange={setTab} />
      <p className="mt-4 text-sm text-nexoraMuted">
        {kind === "market"
          ? "🛍️ Chợ mua bán — bắt buộc ghi giá. Giao dịch trực tiếp giữa thành viên."
          : "👥 Cộng đồng ngành — khoe mẫu, mẹo nghề, hỏi đáp. Không mua bán."}
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((group) => <GroupCard key={group.id} group={group} />)}
      </div>
    </div>
  );
}
