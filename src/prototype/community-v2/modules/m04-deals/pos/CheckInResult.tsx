import { useEffect, useState } from "react";
import { Avatar, Badge, Button, Card, Input } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import type { Customer } from "../../../store/types";
import { checkout, renameCustomer } from "../../../store/slices/m04";
import { formatPhone, money, offerHeadline, savingsFor } from "../logic/domain";
import { gatherOffers, visitFacts, type Offer } from "../logic/eligibility";
import { useNow } from "../ui/hooks";
import { SampleTag } from "../ui/parts";

type Done = { name: string; title?: string; saved: number; bill: number };

function OfferRow({ o, selected, onPick }: { o: Offer; selected: boolean; onPick: () => void }) {
  return (
    <button type="button" onClick={onPick} aria-pressed={selected}
      className={`flex w-full gap-3 rounded-xl border p-3 text-left transition ${
        selected ? "border-nexoraBrand bg-nexoraBrandSoft/60 ring-2 ring-nexoraBrand/15"
          : o.eligible
            ? "border-nexoraBorder bg-white hover:border-nexoraBrand"
            : "border-nexoraBorder bg-nexoraSurfaceMuted"}`}>
      <span className={`mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2 ${
        selected ? "border-nexoraBrand" : "border-nexoraBorder"}`}>
        {selected && <span className="size-2.5 rounded-full bg-nexoraBrand" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-bold">{o.promotion.emoji} {o.promotion.title}</span>
          <span className="text-sm font-bold text-nexoraBrand">{offerHeadline(o.promotion)}</span>
        </span>
        <span className="mt-1 block text-xs text-nexoraMuted">
          Nguồn: <span className={o.coupon ? "font-mono" : ""}>{o.source}</span>
        </span>
        {o.eligible ? (
          <span
            className={`mt-1 block text-sm font-semibold text-nexoraSuccess`}
            >✓ Đủ điều kiện — POS đã kiểm tra: {o.checked}</span>
        ) : (
          <span className="mt-1 block text-sm font-semibold text-nexoraDanger">⛔ {o.reasons.join(" · ")}</span>
        )}
      </span>
    </button>
  );
}

/** S04-11 right side: recognised client, every offer with the POS check, bill → savings → record. */
export function CheckInResult({ customer, onNext }: { customer: Customer; onNext: () => void }) {
  const toast = useToast();
  const now = useNow(30_000);
  const state = useStore((s) => s);
  const offers = gatherOffers(state, customer, now);
  const person = state.people.find((p) => p.phone === customer.phone);
  const facts = visitFacts(customer, now);
  const [selected, setSelected] = useState<string | null>(null);
  const [bill, setBill] = useState("");
  const [billError, setBillError] = useState<string | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const [name, setName] = useState(customer.name);

  useEffect(() => {
    setSelected(gatherOffers(state, customer).find((o) => o.eligible)?.key ?? null);
    setDone(null);
    setBill("");
    setName(customer.name);
    // Auto-select the first eligible offer only when a new client is looked up.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.id]);

  const current = offers.find((o) => o.key === selected);
  const amount = Number(bill) || 0;
  const saved = current ? savingsFor(current.promotion, amount) : 0;
  const zeroNote = current && (current.promotion.offerType === "bxgy" || current.promotion.offerType === "free");

  const pick = (o: Offer) => {
    if (!o.eligible) {
      toast("Ưu đãi này không đủ điều kiện", "danger");
      return;
    }
    setSelected(o.key === selected ? null : o.key);
  };
  const record = (useOffer: boolean) => {
    if (!(amount > 0)) {
      setBillError("Nhập tổng hoá đơn");
      return;
    }
    if (name !== customer.name) renameCustomer(customer.id, name.trim());
    const result = checkout(customer.id, useOffer ? selected : null, amount);
    if ("error" in result && result.error) {
      toast(result.error, "danger");
      return;
    }
    const title = useOffer ? result.title : undefined;
    const applied = `✓ Đã áp dụng ${title} — khách tiết kiệm ${money(result.saved)}`;
    toast(title ? applied : "✓ Đã ghi lượt ghé — không dùng ưu đãi", "success");
    setDone({ name: name.trim() || "Khách mới", title, saved: result.saved ?? 0, bill: amount });
  };

  if (done) {
    return (
      <Card className="p-6 text-center">
        <p className="text-4xl">✅</p>
        <p className="mt-2 text-lg font-bold">Đã ghi nhận · {done.name}</p>
        <p className="mt-1 text-sm text-nexoraMuted">
          Hoá đơn {money(done.bill)} ·{" "}
          {done.title ? `${done.title} · tiết kiệm ${money(done.saved)}` : "không dùng ưu đãi"}{" "}
          <SampleTag />
        </p>
        <p className="mt-1 text-xs text-nexoraMuted">Lượt ghé +1 · đã ghi lịch sử & báo cáo.</p>
        <Button className="mt-4" onClick={onNext}>Khách tiếp theo</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="flex items-start gap-3 p-4">
        <Avatar name={customer.name || "Khách mới"} />
        <div className="min-w-0 flex-1">
          {facts.count === 0 ? (
            <>
              <p className="font-bold">🆕 Khách mới — SĐT chưa có trong POS</p>
              <Input
                className={`mt-2`}
                value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên khách (tuỳ chọn)" />
            </>
          ) : (
            <p
              className={`font-bold`}
              >{customer.name} · Khách quen · {facts.count} lần · ghé cách đây {facts.daysSinceLast} ngày</p>
          )}
          <p className="mt-1 text-sm text-nexoraMuted">
            {formatPhone(customer.phone)}
            {person && <> · <Badge tone="brand">{person.nxId}</Badge> tài khoản Community ghép theo SĐT</>}
          </p>
        </div>
      </Card>

      <div>
        <p className="mb-2 text-sm font-bold">Ưu đãi cho khách ({offers.length}) · đủ điều kiện xếp trước</p>
        <div className="space-y-2">
          {offers.map((o) => <OfferRow key={o.key} o={o} selected={o.key === selected} onPick={() => pick(o)} />)}
          {!offers.length && <p
            className={`rounded-xl bg-nexoraSurfaceMuted p-4 text-sm text-nexoraMuted`}
            >Không có ưu đãi nào cho khách này.</p>}
        </div>
      </div>

      <Card className="p-4">
        <label htmlFor="bill" className="text-sm font-bold">Tổng hoá đơn ($)</label>
        <Input id="bill" type="number" inputMode="decimal" className="mt-2 text-lg" value={bill} placeholder="VD: 65"
          onChange={(e) => { setBill(e.target.value); setBillError(null); }} />
        {billError && <p role="alert" className="mt-1 text-sm font-semibold text-nexoraDanger">{billError}</p>}
        {current && (
          <div
            className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-nexoraSuccess/10 p-3
              text-sm`}
          >
            <span>Khách tiết kiệm <b
              className={`text-lg`}
              >{money(saved)}</b> · còn trả <b>{money(Math.max(0, amount - saved))}</b></span>
            <SampleTag />
            {zeroNote && <span
              className={`w-full text-xs text-nexoraMuted`}
              >Mua X tặng Y / Miễn phí — thu ngân áp trên dịch vụ, giảm $0 trên hoá đơn.</span>}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Button variant="gradient"
            className={`flex-1`}
            disabled={!current} onClick={() => record(true)}>✓ Tính tiền & ghi nhận</Button>
          <Button variant="secondary" className="flex-1" onClick={() => record(false)}>Không dùng ưu đãi</Button>
        </div>
      </Card>
    </div>
  );
}
