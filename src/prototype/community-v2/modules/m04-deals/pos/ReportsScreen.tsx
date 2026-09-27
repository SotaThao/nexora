import { Badge, Card, EmptyState } from "../../../components";
import { useStore } from "../../../store";
import type { ChannelStat } from "../../../store/types";
import {
  CHANNELS, CHANNEL_LABEL, POS_SALON_ID, claimedTotal, fmtDateTime, isToday, money, usedTotal,
} from "../logic/domain";
import { useNow } from "../ui/hooks";
import { PosFrame, SampleTag } from "../ui/parts";

const pct = (s: ChannelStat) => (s.claimed ? Math.round((s.used / s.claimed) * 100) : 0);

function StatCell({ s }: { s: ChannelStat }) {
  if (!s.claimed && !s.used) return <span className="text-nexoraSubtle">—</span>;
  return (
    <span className="block">
      <span
        className={`font-semibold`}
        >{s.claimed} → {s.used}</span> <span className="text-xs text-nexoraMuted">({pct(s)}%)</span>
      <span className="mt-1 block h-1.5 w-20 overflow-hidden rounded-full bg-nexoraSurfaceMuted">
        <span className="block h-full rounded-full bg-nexoraBrand" style={{ width: `${pct(s)}%` }} />
      </span>
    </span>
  );
}

export function ReportsScreen() {
  const now = useNow(60_000);
  const state = useStore((s) => s);
  const programs = state.promotions.filter((p) => p.salonId === POS_SALON_ID);
  const history = state.redeemHistory.filter((r) => programs.some((p) => p.id === r.promotionId));
  const checkinsToday = state.customers.reduce((n, c) => n + c.visits.filter((v) => isToday(v.at, now)).length, 0);
  const usedToday = history.filter((r) => isToday(r.at, now));
  const savedToday = usedToday.reduce((n, r) => n + r.saved, 0);
  const title = (id: string) => programs.find((p) => p.id === id)?.title ?? id;

  const kpis: [string, string, boolean][] = [
    ["Check-in hôm nay", String(checkinsToday), false],
    ["Coupon dùng hôm nay", String(usedToday.length), false],
    ["Khách tiết kiệm hôm nay", money(savedToday), true],
  ];

  return (
    <PosFrame crumb="Báo cáo" title="Báo cáo khuyến mãi"
      subtitle={<span
        className={`inline-flex flex-wrap items-center gap-2`}
        >Theo chương trình · theo kênh <Badge tone="warning">dữ liệu mẫu</Badge></span>}>
      <div className="grid gap-3 sm:grid-cols-3">
        {kpis.map(([label, value, isMoney]) => (
          <Card key={label} className="p-5">
            <p className="text-sm font-semibold text-nexoraMuted">{label}</p>
            <p className="mt-1 flex items-baseline gap-2 text-3xl font-bold">{value} {isMoney && <SampleTag />}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 p-5">
        <h2 className="font-bold">Chương trình × kênh · lấy → dùng (%)</h2>
        <div className="mt-3 hidden lg:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-nexoraBorder text-xs uppercase tracking-wider text-nexoraSubtle">
              <tr>
                <th className="py-2 pr-3">Chương trình</th>
                {CHANNELS.map((c) => <th key={c} className="py-2 pr-3">{CHANNEL_LABEL[c]}</th>)}
                <th className="py-2">Tổng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nexoraRule">
              {programs.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 pr-3 font-semibold">{p.emoji} {p.title}</td>
                  {CHANNELS.map((c) => <td key={c} className="py-3 pr-3"><StatCell s={p.stats[c]} /></td>)}
                  <td className="py-3"><StatCell s={{ claimed: claimedTotal(p), used: usedTotal(p) }} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 space-y-3 lg:hidden">
          {programs.map((p) => (
            <div key={p.id} className="rounded-xl border border-nexoraBorder p-3">
              <p className="font-semibold">{p.emoji} {p.title}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {CHANNELS.map((c) => (
                  <div key={c}>
                    <p className="text-xs text-nexoraSubtle">{CHANNEL_LABEL[c]}</p>
                    <StatCell s={p.stats[c]} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <h2 className="font-bold">Lịch sử redeem</h2>
        {history.length ? (
          <ul className="mt-2 divide-y divide-nexoraRule">
            {history.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span className="min-w-0">
                  <b>{r.customerName}</b> · {title(r.promotionId)}
                  <span className="block text-xs text-nexoraMuted">
                    {fmtDateTime(r.at)} · {r.method}{r.code ? ` · ${r.code}` : ""} · kênh {CHANNEL_LABEL[r.channel]}
                  </span>
                </span>
                <span
                  className={`font-semibold`}
                  >
                    −{money(r.saved)} <span className="text-xs font-normal text-nexoraMuted">/ {money(r.bill)}</span>
                  </span>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Chưa có lượt redeem" body="Lượt dùng ưu đãi ở Check-in và Quầy redeem sẽ hiện ở đây." />
        )}
      </Card>
    </PosFrame>
  );
}
