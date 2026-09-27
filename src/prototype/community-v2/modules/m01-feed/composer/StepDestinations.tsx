import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button } from "../../../components";
import { useStore } from "../../../store";
import { updateDraft } from "../../../store/slices/m01";
import type { Group, ScreenDefinition } from "../../../store/types";
import { COPY, MAX_DESTINATIONS, ROUTES } from "../constants";
import { groupName, isMember, useDraft, useViewer } from "../data";
import { Notice } from "../ui";
import { ComposerLayout } from "./ComposerLayout";
import { suggestDestinations, toggleDestination } from "./rules";

function DestinationRow({ group, selected, onToggle }: { group: Group; selected: boolean; onToggle: () => void }) {
  const { key } = useViewer();
  const autoJoin = !isMember(group, key);
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      onClick={onToggle}
      className={`flex min-h-14 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
        selected ? "border-nexoraBrand bg-nexoraBrandSoft" : "border-nexoraBorder bg-white hover:border-nexoraBrand/40"
      }`}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-md border ${
          selected ? "border-nexoraBrand bg-nexoraBrand text-white" : "border-nexoraBorder"
        }`}
      >
        {selected && <Check size={15} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-nexoraText">{group.name}</span>
        <span className="block text-xs text-nexoraSubtle">{group.members.toLocaleString("vi-VN")} thành viên</span>
      </span>
      {autoJoin && (
        <span className="shrink-0 rounded-full bg-nexoraSurfaceMuted px-2 py-0.5 text-right text-xs
          font-medium text-nexoraMuted">
          {COPY.autoJoin}
        </span>
      )}
    </button>
  );
}

const SECTIONS: { kind: Group["kind"]; title: string; note: string }[] = [
  { kind: "feed", title: "Bảng tin", note: "Mọi thành viên đều thấy" },
  { kind: "community", title: "Cộng đồng ngành", note: "Không mua bán" },
  { kind: "market", title: "Chợ theo ngành", note: "Chỉ bài mua bán — bắt buộc ghi giá" },
];

export function StepDestinations(_: { screen: ScreenDefinition }) {
  const navigate = useNavigate();
  const draft = useDraft();
  const groups = useStore((s) => s.groups);
  const [error, setError] = useState<string | null>(null);
  const [enteredValid] = useState(() => draft.step1Passed);
  if (!enteredValid) return <Navigate to={ROUTES.composeStep1} replace />;

  const suggestion = suggestDestinations(draft);
  const onToggle = (group: Group) => {
    const result = toggleDestination(draft, group);
    if (result.error) return setError(result.error);
    setError(null);
    updateDraft({ destinations: result.next, destinationsTouched: true });
  };
  const next = () => {
    if (!draft.destinations.length) return setError(COPY.errNoDest);
    navigate(ROUTES.composeStep3);
  };

  return (
    <ComposerLayout
      step={2}
      title="Đăng ở đâu?"
      subtitle={
        `Đăng một lần, hiện tối đa ${MAX_DESTINATIONS} nơi. `
        + `Đã chọn ${draft.destinations.length}/${MAX_DESTINATIONS}.`
      }
      footer={
        <>
          <Button variant="secondary" onClick={() => navigate(ROUTES.composeStep1)}>← Quay lại</Button>
          <Button variant="gradient" className="sm:min-w-40" onClick={next}>Tiếp →</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 rounded-xl border border-nexoraBrand/25 bg-nexoraBrandSoft/60 p-4
        sm:flex-row sm:items-center">
        <Sparkles className="shrink-0 text-nexoraBrand" size={20} />
        <p className="flex-1 text-sm text-nexoraText">
          <b>AI gợi ý:</b> {suggestion.map((id) => groupName(groups, id)).join(" + ")}
        </p>
        <Button
          variant="secondary"
          className="shrink-0"
          onClick={() => { setError(null); updateDraft({ destinations: suggestion, destinationsTouched: true }); }}
        >
          Dùng gợi ý
        </Button>
      </div>

      {error && <Notice tone="danger">{error}</Notice>}

      {SECTIONS.map((section) => (
        <section key={section.kind}>
          <h3 className="text-sm font-bold text-nexoraText">
            {section.title} <span className="font-normal text-nexoraSubtle">· {section.note}</span>
          </h3>
          <div className="mt-2 grid gap-2 lg:grid-cols-2">
            {groups.filter((group) => group.kind === section.kind).map((group) => (
              <DestinationRow
                key={group.id}
                group={group}
                selected={draft.destinations.includes(group.id)}
                onToggle={() => onToggle(group)}
              />
            ))}
          </div>
        </section>
      ))}
    </ComposerLayout>
  );
}
