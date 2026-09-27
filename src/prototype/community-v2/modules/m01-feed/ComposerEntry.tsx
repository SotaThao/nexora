import { useNavigate } from "react-router-dom";
import { Avatar, Card } from "../../components";
import { startDraft } from "../../store/slices/m01";
import type { ComposerDraft } from "../../store/types";
import { useCommunityGate } from "../m00-foundation/gates";
import { POST_TYPES, ROUTES } from "./constants";
import { useViewer } from "./data";

type Props = { preset?: Partial<ComposerDraft>; hint?: string };

/** "{Tên} ơi, bạn đang nghĩ gì?" + 4 quick buttons. Guest → account sheet → resumes into the composer. */
export function ComposerEntry({ preset = {}, hint }: Props) {
  const navigate = useNavigate();
  const { requireAccount } = useCommunityGate();
  const { firstName, person } = useViewer();

  const open = (patch: Partial<ComposerDraft> = {}) =>
    requireAccount("Mở khung soạn bài", () => {
      startDraft({ ...preset, ...patch });
      navigate(ROUTES.composeStep1);
    });

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <Avatar name={person?.name ?? firstName} />
        <button
          type="button"
          onClick={() => open()}
          className="flex min-h-11 flex-1 items-center rounded-full border border-nexoraBorder
            bg-nexoraSurfaceMuted px-4 text-left text-sm text-nexoraSubtle hover:border-nexoraBrand/40"
        >
          {firstName} ơi, bạn đang nghĩ gì?
        </button>
      </div>
      {hint && <p className="mt-2 text-xs text-nexoraMuted">{hint}</p>}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POST_TYPES.filter((type) => !preset.type || type.id === preset.type).map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => open({ type: type.id })}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-semibold
              text-nexoraMuted hover:bg-nexoraSurfaceMuted"
          >
            <span aria-hidden="true">{type.emoji}</span> {type.label}
          </button>
        ))}
      </div>
    </Card>
  );
}
