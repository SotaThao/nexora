import { useState } from "react";
import { Plus } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, EmptyState, Sheet } from "../../../components";
import { useStore } from "../../../store";
import type { Coupon, Promotion } from "../../../store/types";
import {
  AUDIENCE_LABEL, CHANNELS, CHANNEL_LABEL, COLOR_GRADIENT, POS_SALON_ID, PROGRAM_STATE_LABEL, claimedTotal,
  fmtDateTime, money, offerHeadline, perPersonText, programState, publicLink, remainingSlots, usedTotal,
  type ProgramState,
} from "../logic/domain";
import { posPath, useNow } from "../ui/hooks";
import { ChannelChips, Fact, PosFrame, ProgramStateBadge, SampleTag } from "../ui/parts";
import { ProgramActions } from "./ProgramActions";

type Filter = "all" | ProgramState;

function ProgramPanel({ p, coupons }: { p: Promotion; coupons: Coupon[] }) {
  const state = programState(p, coupons);
  return (
    <div className="space-y-4">
      <div className={`rounded-xl bg-gradient-to-br p-4 text-white ${COLOR_GRADIENT[p.color]}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-2xl font-extrabold">{offerHeadline(p)}</p>
            <p className="font-semibold">{p.title}</p>
          </div>
          <span className="text-3xl">{p.emoji}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <ProgramStateBadge state={state} />
        {p.sponsored && <Badge tone="warning">⭐ Được tài trợ</Badge>}
        <ChannelChips channels={p.channels} />
      </div>
      <ProgramActions p={p} coupons={coupons} compact />
      <dl>
        <Fact label="Áp dụng cho">{AUDIENCE_LABEL[p.audience]}</Fact>
        <Fact label="Điều kiện">{p.condition}</Fact>
        <Fact label="Hết hạn">{fmtDateTime(p.expiresAt)}</Fact>
        <Fact label="Lượt">còn {remainingSlots(p, coupons)} / {p.totalSlots}</Fact>
        <Fact label="Giữ lượt">{p.holdDays === null ? "Tới khi hết hạn" : `${p.holdDays} ngày`}</Fact>
        <Fact label="Mỗi khách">{perPersonText(p)}</Fact>
        <Fact label="Link">{publicLink(p.id)}</Fact>
        {p.ads && (
          <Fact label="Quảng cáo">
            {money(p.ads.budgetPerDay)}/ngày × {p.ads.days} ngày · {p.ads.radiusMi} mi <SampleTag>GIÁ MẪU</SampleTag>
          </Fact>
        )}
      </dl>
      <div>
        <p className="mb-2 text-sm font-bold">Theo kênh · lấy → dùng</p>
        <div className="grid grid-cols-2 gap-2">
          {CHANNELS.filter((c) => p.channels.includes(c) || p.stats[c].claimed).map((c) => (
            <div key={c} className="rounded-lg bg-nexoraSurfaceMuted p-3">
              <p className="text-xs font-semibold text-nexoraMuted">{CHANNEL_LABEL[c]}</p>
              <p className="font-bold">{p.stats[c].claimed} → {p.stats[c].used}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProgramsScreen() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const now = useNow(30_000);
  const all = useStore((s) => s.promotions);
  const promotions = all.filter((p) => p.salonId === POS_SALON_ID);
  const coupons = useStore((s) => s.coupons);
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const newId = params.get("id");
  const selectedId = newId ?? promotions[0]?.id;
  const selected = promotions.find((p) => p.id === selectedId);
  const withState = promotions.map((p) => ({ p, state: programState(p, coupons, now) }));
  const shown = withState.filter((x) => filter === "all" || x.state === filter);
  const count = (s: ProgramState) => withState.filter((x) => x.state === s).length;
  const select = (id: string) => {
    setParams({ id }, { replace: true });
    if (window.innerWidth < 1024) setSheetOpen(true);
  };
  const filters: [Filter, string][] = [
    ["all", `Tất cả (${promotions.length})`],
    ...(["active", "paused", "expired", "sold-out"] as ProgramState[]).map(
      (s): [Filter, string] => [s, `${PROGRAM_STATE_LABEL[s]} (${count(s)})`],
    ),
  ];

  return (
    <PosFrame crumb="Chương trình" title="Chương trình khuyến mãi"
      subtitle="Một bản gốc cho mọi kênh: POS · Community · SMS · QR."
      actions={<Button variant="gradient" onClick={() => navigate(posPath("/promotions/new"))}><Plus size={16}
        className={`mr-1 inline`}
        /> Tạo chương trình</Button>}>
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Đang chạy", count("active")], ["Tạm dừng", count("paused")],
          ["Coupon đã lấy", promotions.reduce((s, p) => s + claimedTotal(p), 0)],
          ["Đã dùng", promotions.reduce((s, p) => s + usedTotal(p), 0)]].map(([label, value]) => (
          <Card key={label} className="p-4">
            <p className="text-xs font-semibold text-nexoraMuted">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </Card>
        ))}
      </div>
      <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
        {filters.map(([f, label]) => (
          <button key={f} type="button" onClick={() => setFilter(f)}
            className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ${
              filter === f ? "bg-nexoraSidebar text-white" : "border border-nexoraBorder bg-white text-nexoraMuted"}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="space-y-3">
          {shown.map(({ p, state }) => (
            <Card key={p.id}
              className={`p-0 ${p.id === selectedId ? "lg:border-nexoraBrand lg:ring-2 lg:ring-nexoraBrand/15" : ""}`}>
              <div role="button" tabIndex={0} onClick={() => select(p.id)}
                onKeyDown={(e) => e.key === "Enter" && select(p.id)}
                className="flex cursor-pointer gap-3 p-4">
                <span className={`grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-2xl ${
                  COLOR_GRADIENT[p.color]}`}>
                  {p.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-bold">{p.title}</p>
                    {p.id === newId && <Badge tone="brand">Mới</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-nexoraMuted">
                    <b className="text-nexoraBrand">{offerHeadline(p)}</b> · {AUDIENCE_LABEL[p.audience]}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <ProgramStateBadge state={state} />
                    {p.sponsored && <Badge tone="warning">⭐ Được tài trợ</Badge>}
                    <ChannelChips channels={p.channels} />
                  </div>
                  <p className="mt-2 text-xs text-nexoraMuted">
                    Lấy <b
                      className={`text-nexoraText`}
                      >{claimedTotal(p)}</b> · Dùng <b className="text-nexoraText">{usedTotal(p)}</b>
                    {" "}· còn {remainingSlots(p, coupons, now)}/{p.totalSlots} lượt
                    {" "}· hết hạn {fmtDateTime(p.expiresAt)}
                  </p>
                </div>
              </div>
              <div className="border-t border-nexoraRule px-4 py-3">
                <ProgramActions p={p} coupons={coupons} compact />
              </div>
            </Card>
          ))}
          {!shown.length && <EmptyState title="Không có chương trình" body="Không có chương trình ở trạng thái này." />}
        </div>
        <div className="hidden lg:block">
          <Card className="sticky top-24 p-5">{selected ? <ProgramPanel p={selected} coupons={coupons} /> : null}</Card>
        </div>
      </div>
      <Sheet open={sheetOpen && Boolean(selected)} onClose={() => setSheetOpen(false)} title="Chi tiết chương trình">
        {selected && <ProgramPanel p={selected} coupons={coupons} />}
      </Sheet>
    </PosFrame>
  );
}
