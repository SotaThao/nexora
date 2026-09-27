import { useState } from "react";
import { CreditCard, LockKeyhole, Wallet } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, MoneyTag } from "../../../components";
import { publishDraft, updateDraft } from "../../../store/slices/m01";
import type { ScreenDefinition } from "../../../store/types";
import { BOOST_PLANS, COPY, ROUTES } from "../constants";
import { useDraft, useViewer } from "../data";
import { Notice } from "../ui";
import { ComposerLayout } from "./ComposerLayout";
import { PaymentSheet } from "./PaymentSheet";
import { useToast } from "../toast";

const card = (active: boolean) =>
  `w-full rounded-xl border p-4 text-left transition ${
    active
      ? "border-nexoraBrand bg-nexoraBrandSoft ring-2 ring-nexoraBrand/15"
      : "border-nexoraBorder bg-white hover:border-nexoraBrand/40"
  }`;

export function StepFeatured({ paymentOpen = false }: { screen: ScreenDefinition; paymentOpen?: boolean }) {
  const navigate = useNavigate();
  const toast = useToast();
  const draft = useDraft();
  const { isBusiness } = useViewer();
  const [error, setError] = useState<string | null>(null);
  // Guard only on entry: after publishing, the cleared draft must not bounce the user back to step 1.
  const [enteredValid] = useState(() => draft.step1Passed && draft.destinations.length > 0);
  if (!enteredValid) return <Navigate to={ROUTES.composeStep1} replace />;

  const featured = draft.plan === "featured" && isBusiness;
  const plan = BOOST_PLANS.find((item) => item.days === draft.boostDays) ?? BOOST_PLANS[1];

  const chooseFeatured = () => {
    if (!isBusiness) {
      updateDraft({ plan: "free" });
      return setError(COPY.featuredLocked);
    }
    setError(null);
    updateDraft({ plan: "featured" });
  };

  const submit = () => {
    if (featured) return navigate(ROUTES.payment);
    // Leave the step route first so its "no draft" guard never fires after publishDraft() clears the draft.
    navigate(ROUTES.feed);
    window.setTimeout(() => {
      const result = publishDraft();
      if (result) toast(COPY.toastFree(result.places), "success");
    }, 0);
  };

  return (
    <ComposerLayout
      step={3}
      title="Miễn phí hay Nổi bật?"
      subtitle="Đăng miễn phí cho mọi thành viên. Tài khoản doanh nghiệp có thể ghim bài lên đầu."
      footer={
        <>
          <Button variant="secondary" onClick={() => navigate(ROUTES.composeStep2)}>← Quay lại</Button>
          <Button variant="gradient" className="sm:min-w-44" onClick={submit}>
            {featured ? `🚀 Đăng bài · thanh toán $${plan.price}` : "🚀 Đăng bài"}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 lg:grid-cols-2">
        <button
          type="button"
          className={card(!featured)}
          onClick={() => { setError(null); updateDraft({ plan: "free" }); }}
        >
          <span className="block text-base font-bold">🆓 Miễn phí</span>
          <span className="mt-1 block text-sm text-nexoraMuted">
            Hiện theo thời gian ở {draft.destinations.length} nơi đã chọn.
          </span>
        </button>
        <button type="button" className={card(featured)} onClick={chooseFeatured}>
          <span className="flex items-center justify-between gap-2 text-base font-bold">
            ⭐ Nổi bật
            {!isBusiness && (
              <span className="inline-flex items-center gap-1 rounded-full bg-nexoraSurfaceMuted px-2 py-0.5
                text-xs font-semibold text-nexoraMuted">
                <LockKeyhole size={12} /> Doanh nghiệp
              </span>
            )}
          </span>
          <span className="mt-1 block text-sm text-nexoraMuted">
            Ghim đầu mọi nơi đã chọn, gắn nhãn “⭐ Được tài trợ”. 3/7/14 ngày.
          </span>
        </button>
      </div>

      {error && <Notice tone="warning">{error}</Notice>}

      {featured && (
        <>
          <div>
            <p className="text-sm font-semibold">Thời gian Nổi bật</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {BOOST_PLANS.map((item) => (
                <button
                  key={item.days}
                  type="button"
                  aria-pressed={draft.boostDays === item.days}
                  onClick={() => updateDraft({ boostDays: item.days })}
                  className={`${card(draft.boostDays === item.days)} text-center`}
                >
                  <span className="block text-base font-bold">{item.days} ngày</span>
                  <MoneyTag>${item.price}</MoneyTag>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">Thanh toán bằng</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                className={card(draft.payMethod === "wallet")}
                onClick={() => updateDraft({ payMethod: "wallet" })}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Wallet size={18} className="text-nexoraBrand" /> Ví NEXORA
                </span>
              </button>
              <button
                type="button"
                className={card(draft.payMethod === "card")}
                onClick={() => updateDraft({ payMethod: "card" })}
              >
                <span className="flex items-center gap-2 font-semibold">
                  <CreditCard size={18} className="text-nexoraBrand" /> Thẻ
                </span>
              </button>
            </div>
          </div>
        </>
      )}
      <PaymentSheet open={paymentOpen} onClose={() => navigate(ROUTES.composeStep3)} />
    </ComposerLayout>
  );
}

/** S01-10 — step 3 with the mock payment sheet open. */
export function FeaturedPaymentScreen({ screen }: { screen: ScreenDefinition }) {
  return <StepFeatured screen={screen} paymentOpen />;
}
