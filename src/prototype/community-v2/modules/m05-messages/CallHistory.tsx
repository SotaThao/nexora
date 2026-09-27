import { Link } from "react-router-dom";
import { Info, UsersRound } from "lucide-react";
import { Card } from "../../components";
import { useStore } from "../../store";
import { CallList } from "./CallList";
import { M05Overlays } from "./toast";
import { PageHeader } from "./PageHeader";
import { paths, useViewerId } from "./lib";

/** S05-10 — history: outgoing / incoming / missed (red), duration, Gọi lại. */
export function CallHistory() {
  const viewerId = useViewerId();
  const threads = useStore((s) => s.threads);
  const privacyCalls = useStore((s) => s.privacy.calls);
  const live = threads.filter(
    (t) => t.groupCall && t.groupCall.participantIds.length > 0 && viewerId && t.participantIds.includes(viewerId),
  );
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Cuộc gọi" body="Gọi thoại & video có phụ đề AI Việt ⇄ Anh." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className="overflow-hidden">
          <p className="border-b border-nexoraBorder px-4 py-3 text-sm font-bold">Lịch sử cuộc gọi</p>
          <CallList />
        </Card>
        <div className="space-y-4">
          {live.map((t) => (
            <Card key={t.id} className="border-nexoraSuccess/40 p-4">
              <p className={[
                "text-xs font-bold text-nexoraSuccess",
              ].join(" ")}>● ĐANG GỌI · {t.groupCall?.participantIds.length} người đang tham gia</p>
              <p className="mt-1 flex items-center gap-2 font-semibold"><UsersRound size={16} />{t.name}</p>
              <Link
                to={paths.groupCall(t.groupCall?.callId ?? "")}
                className={[
                  "mt-3 flex min-h-11 items-center justify-center rounded-flox-buttons bg-nexoraSuccess",
                  "text-sm font-semibold text-white",
                ].join(" ")}
              >
                Tham gia
              </Link>
            </Card>
          ))}
          <Card className="p-4">
            <p className={[
              "flex items-center gap-2 text-sm font-bold",
            ].join(" ")}><Info size={16} className="text-nexoraBrand" />Ai được gọi cho bạn</p>
            <p className={[
              "mt-1 text-sm text-nexoraMuted",
            ].join(" ")}>
              Hiện tại: <b>{privacyCalls}</b>.
              Đặt “Không ai” thì mọi cuộc gọi đến thành cuộc nhỡ.
            </p>
            <Link to={paths.privacy} className={[
              "mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-nexoraBrand",
            ].join(" ")}>Đổi trong Riêng tư →</Link>
          </Card>
        </div>
      </div>
      <M05Overlays />
    </div>
  );
}
