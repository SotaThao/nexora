import { useState } from "react";
import { Bell, Heart, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, EmptyState, Input } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { followKeyword, keywordsOf, notificationsOf, unfollowKeyword, wishlistOf } from "../../../store/slices/m04";
import { fmtDateTime } from "../logic/domain";
import { DealCard } from "../ui/DealCard";
import { dealPath, useSalonName } from "../ui/hooks";
import { DealsNav, MemberGate, PageTitle } from "../ui/parts";

export function WishlistScreen() {
  const navigate = useNavigate();
  const toast = useToast();
  const salonName = useSalonName();
  const state = useStore((s) => s);
  const promotions = state.promotions;
  const savedIds = wishlistOf(state, state.currentPersonId);
  const keywords = keywordsOf(state, state.currentPersonId);
  const notifications = notificationsOf(state, state.currentPersonId);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const saved = savedIds.map((id) => promotions.find((p) => p.id === id)).filter(Boolean);
  const titleOf = (id: string) => promotions.find((p) => p.id === id);

  const follow = () => {
    const result = followKeyword(draft);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(null);
    setDraft("");
    const kw = draft.trim().toLowerCase();
    toast(
      result.match
        ? `🔔 Deal mới khớp “${kw}”: ${result.match.title} · ${salonName(result.match.salonId)}`
        : `＋ Đã theo dõi “${kw}” — có deal mới sẽ báo bạn`,
      "success",
    );
  };

  return (
    <div>
      <DealsNav />
      <PageTitle
        title="♡ Wish list & theo dõi từ khoá"
        subtitle="Lưu deal để quay lại sau; theo dõi từ khoá để được báo khi có deal mới."
      />
      <MemberGate what="Wish list">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section>
            <h2
              className={`mb-3 flex items-center gap-2 font-bold`}
              ><Heart size={18} className="text-nexoraDanger" /> Deal đã lưu ({saved.length})</h2>
            {saved.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {saved.map((p) => <DealCard key={p.id} promotion={p} />)}
              </div>
            ) : (
              <EmptyState title="Chưa lưu deal nào" body="Bấm ♡ trên một deal để lưu vào đây." />
            )}
          </section>
          <div className="space-y-4">
            <Card className="p-5">
              <h2 className="font-bold">Theo dõi từ khoá</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {keywords.map((kw) => (
                  <span key={kw}
                    className={`inline-flex min-h-9 items-center gap-1 rounded-full bg-nexoraBrandSoft pl-3 text-sm
                      font-semibold text-nexoraBrand`}
                  >
                    {kw}
                    <button type="button" aria-label={`Bỏ theo dõi ${kw}`} onClick={() => unfollowKeyword(kw)}
                      className="grid size-9 place-items-center rounded-full hover:bg-white/60">
                      <X size={14} />
                    </button>
                  </span>
                ))}
                {!keywords.length && <p className="text-sm text-nexoraMuted">Chưa theo dõi từ khoá nào.</p>}
              </div>
              <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); follow(); }}>
                <Input value={draft} onChange={(e) => { setDraft(e.target.value); setError(null); }}
                  placeholder="VD: gel-x, pedicure, mi" aria-label="Từ khoá" />
                <Button type="submit" className="shrink-0">＋ Theo dõi</Button>
              </form>
              {error && <p role="alert" className="mt-2 text-sm font-semibold text-nexoraDanger">{error}</p>}
            </Card>
            <Card className="p-5">
              <h2
                className={`flex items-center gap-2 font-bold`}
                ><Bell size={18} className="text-nexoraBrand" /> Thông báo deal</h2>
              <ul className="mt-2 divide-y divide-nexoraRule">
                {notifications.map((n) => {
                  const p = titleOf(n.promotionId);
                  if (!p) return null;
                  return (
                    <li key={n.id}>
                      <button type="button" onClick={() => navigate(dealPath(`/${p.id}`))}
                        className="w-full py-3 text-left text-sm hover:text-nexoraBrand">
                        <span
                          className={`font-semibold`}
                          >🔔 Deal mới khớp “{n.keyword}”: {p.title} · {salonName(p.salonId)}</span>
                        <span className="mt-0.5 block text-xs text-nexoraSubtle">{fmtDateTime(n.at)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!notifications.length && <p
                className={`mt-2 text-sm text-nexoraMuted`}
                >Chưa có thông báo — theo dõi từ khoá để nhận.</p>}
            </Card>
          </div>
        </div>
      </MemberGate>
    </div>
  );
}
