import type { PropsWithChildren, ReactNode } from "react";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, Button, Card, MoneyTag, Stepper } from "../../../components";
import { useStore } from "../../../store";
import type { ComposerDraft } from "../../../store/types";
import { useCommunityGate } from "../../m00-foundation/gates";
import { BOOST_PLANS, COPY, ROUTES } from "../constants";
import { formatPrice, groupName, splitMarketBody, useDraft, useViewer } from "../data";
import { Disclaimer, PhotoGrid, TypeBadge } from "../ui";

const STEPS = ["Nội dung", "Đăng ở đâu", "Miễn phí / Nổi bật"];

function PreviewCard({ draft }: { draft: ComposerDraft }) {
  const { person, firstName, role } = useViewer();
  const groups = useStore((s) => s.groups);
  const market = draft.type === "market";
  const { title, rest } = market ? splitMarketBody(draft.body) : { title: "", rest: draft.body };
  const featured = draft.plan === "featured";
  const price = BOOST_PLANS.find((plan) => plan.days === draft.boostDays)?.price ?? 0;

  return (
    <Card className="overflow-hidden">
      <p className="border-b border-nexoraRule px-4 py-2.5 text-xs font-bold uppercase tracking-wider
        text-nexoraSubtle">
        Xem trước bài đăng
      </p>
      {featured && <p className="bg-nexoraWarning/15 px-4 py-2 text-xs font-bold">{COPY.featuredBadge}</p>}
      <div className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar name={person?.name ?? firstName} />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {role === "admin" ? "NEXORA Community" : person?.name ?? firstName}
            </p>
            <p className="text-xs text-nexoraSubtle">Vừa xong</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <TypeBadge type={draft.type} />
          {draft.destinations.map((id) => (
            <span key={id} className="rounded-full border border-nexoraBorder px-2.5 py-0.5 text-xs text-nexoraMuted">
              {groupName(groups, id)}
            </span>
          ))}
        </div>
        {title && <p className="font-bold">{title}</p>}
        <p className="whitespace-pre-line break-words text-sm leading-6 text-nexoraText">
          {rest || <span className="text-nexoraSubtle">Nội dung bài sẽ hiện ở đây…</span>}
        </p>
        <PhotoGrid images={draft.images} />
        {market && (
          <>
            <p className="text-lg font-bold">
              <MoneyTag>{draft.price ? formatPrice(Number(draft.price)) : "$—"}</MoneyTag>
            </p>
            <p className="text-xs text-nexoraMuted">{draft.category} · {draft.area}</p>
            <Disclaimer />
          </>
        )}
        {featured && (
          <p className="text-xs text-nexoraMuted">
            Nổi bật {draft.boostDays} ngày · <MoneyTag>${price}</MoneyTag>
          </p>
        )}
      </div>
    </Card>
  );
}

type LayoutProps = PropsWithChildren<{ step: 1 | 2 | 3; title: string; subtitle: string; footer: ReactNode }>;

export function ComposerLayout({ step, title, subtitle, footer, children }: LayoutProps) {
  const navigate = useNavigate();
  const draft = useDraft();
  const { isGuest } = useViewer();
  const { requireAccount } = useCommunityGate();

  if (isGuest) {
    return (
      <Card className="mx-auto max-w-lg p-6 text-center">
        <LockKeyhole className="mx-auto text-nexoraBrand" />
        <h2 className="mt-3 text-xl font-bold">Cần tài khoản để đăng bài</h2>
        <p className="mt-2 text-sm text-nexoraMuted">Tạo tài khoản NEXORA miễn phí — xong sẽ mở lại khung soạn bài.</p>
        <Button
          variant="gradient"
          className="mt-5 w-full"
          onClick={() => requireAccount("Mở khung soạn bài", () => navigate(ROUTES.composeStep1))}
        >
          Tạo tài khoản & soạn bài
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => navigate(ROUTES.feed)}
          className="mb-3 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-nexoraMuted
            hover:text-nexoraText"
        >
          <ArrowLeft size={17} /> Bảng tin
        </button>
        <Card className="p-4 sm:p-6">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold text-nexoraSubtle">
            <span>Bước {step}/3</span>
            <span className="hidden sm:inline">
              {STEPS.map((label, index) => `${index + 1}. ${label}`).join("   ·   ")}
            </span>
          </div>
          <Stepper step={step} total={3} />
          <h2 className="mt-5 text-xl font-bold text-nexoraText sm:text-2xl">{title}</h2>
          <p className="mt-1 text-sm text-nexoraMuted">{subtitle}</p>
          <div className="mt-5 space-y-5">{children}</div>
          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-nexoraRule pt-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        </Card>
      </div>
      <aside className="min-w-0">
        <div className="xl:sticky xl:top-24">
          <PreviewCard draft={draft} />
        </div>
      </aside>
    </div>
  );
}
