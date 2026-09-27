import { type ReactNode, useState } from "react";
import { AlertTriangle, Ban, Flag, Plus, Save, X } from "lucide-react";
import { Badge, Button, Card, Input } from "../../components";
import { useShiftToast } from "../m03-shifts/ShiftToast";

const BLOCK = ["zelle", "cash app", "gift card", "chuyển tiền trước", "đặt cọc", "venmo", "western union"];
const WARN = ["SĐT 10 số", "số điện thoại", "gọi trực tiếp"];

function KeywordList({ title, tone, icon, words, onChange, hint }: {
  title: string;
  tone: "danger" | "warning";
  icon: ReactNode;
  words: string[];
  onChange: (next: string[]) => void;
  hint: string;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const add = () => {
    const word = draft.trim().toLowerCase();
    if (word.length < 2) return setError("Từ khoá cần ít nhất 2 ký tự");
    if (words.includes(word)) return setError("Từ khoá đã có trong danh sách");
    onChange([...words, word]);
    setDraft("");
    setError("");
  };
  return (
    <div className="rounded-xl border border-nexoraBorder p-4">
      <p className="flex items-center gap-2 font-semibold">{icon}{title} <Badge tone={tone}>{words.length}</Badge></p>
      <p className="mt-1 text-xs text-nexoraMuted">{hint}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {words.map((word) => (
          <span key={word} className={`inline-flex min-h-9 items-center gap-1 rounded-full pl-3 pr-1 text-sm ${
            tone === "danger" ? "bg-nexoraDanger/10 text-nexoraDanger" : "bg-nexoraWarning/15 text-nexoraText"}`}>
            {word}
            <button
              type="button"
              aria-label={`Xoá ${word}`}
              onClick={() => onChange(words.filter((item) => item !== word))}
              className="grid size-8 place-items-center rounded-full hover:bg-white/60"
            >
              <X size={14} />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <Input value={draft} placeholder="Thêm từ khoá" onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && add()} />
        <Button variant="secondary" aria-label={`Thêm vào ${title}`} onClick={add}><Plus size={16} /></Button>
      </div>
      {error && <p className="mt-1 text-xs text-nexoraDanger">{error}</p>}
    </div>
  );
}

/** Từ khoá AI chặn / cảnh báo (doc 01 bước 1.4). Admin-local — the M01 composer owns the live check. */
export function KeywordsTab() {
  const toast = useShiftToast();
  const [block, setBlock] = useState(BLOCK);
  const [warn, setWarn] = useState(WARN);
  return (
    <Card className="p-5">
      <h2 className="text-lg font-bold">Từ khoá AI chặn / cảnh báo</h2>
      <p className="mt-1 text-sm text-nexoraMuted">
        Áp cho bài đăng trước khi lên Bảng tin. Đa ngôn ngữ — chờ chốt (doc 01).
      </p>
      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <KeywordList title="Chặn" tone="danger" icon={<Ban size={16} className="text-nexoraDanger" />} words={block}
          onChange={setBlock} hint="⛔ AI chặn: Yêu cầu chuyển tiền / đặt cọc ngoài app — dấu hiệu lừa đảo phổ biến." />
        <KeywordList title="Cảnh báo" tone="warning" icon={<AlertTriangle size={16} className="text-nexoraWarning" />}
          words={warn} onChange={setWarn} hint="⚠️ Có số điện thoại — qua được ở lần bấm “Tiếp” thứ 2." />
      </div>
      <p className="mt-3 text-xs text-nexoraSubtle">
        Bản mẫu lưu trên màn admin; AI ở bước soạn bài (M01) dùng danh sách mẫu.
      </p>
      <Button className="mt-4" variant="gradient" onClick={() => toast("✓ Đã lưu từ khoá AI", "success")}>
        <Save size={16} className="mr-1 inline" />Lưu từ khoá
      </Button>
    </Card>
  );
}

type Report = {
  id: string;
  reason: string;
  target: string;
  count: number;
  at: string;
  status: "open" | "kept" | "removed";
};
const REPORTS: Report[] = [
  { id: "r1", reason: "Nghi ngờ lừa đảo", target: "Bài Mua bán “Sang tiệm gấp — cọc qua Zelle giữ chỗ”", count: 4,
    at: "Hôm nay · 08:40", status: "open" },
  { id: "r2", reason: "Spam / quảng cáo", target: "Bình luận lặp lại link khoá học ở 6 nhóm", count: 3,
    at: "Hôm nay · 07:15", status: "open" },
  { id: "r3", reason: "Nội dung không đúng ngành", target: "Bài trong Cộng đồng Nail Houston", count: 1,
    at: "Hôm qua · 21:02", status: "open" },
  { id: "r4", reason: "Quấy rối", target: "Tin nhắn từ người lạ tới thợ", count: 2,
    at: "Hôm qua · 18:30", status: "kept" },
];

/** Hàng đợi báo cáo — mock only: moderation is not defined yet (doc 01 · Câu hỏi mở #4). */
export function ReportsTab() {
  const toast = useShiftToast();
  const [items, setItems] = useState(REPORTS);
  const decide = (id: string, status: Report["status"]) => {
    setItems(items.map((item) => (item.id === id ? { ...item, status } : item)));
    toast(status === "removed" ? "Đã gỡ nội dung (mock)" : "Đã giữ nội dung (mock)", "info");
  };
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">Hàng đợi báo cáo</h2>
        <Badge tone="warning">Mock · chưa có luồng kiểm duyệt</Badge>
      </div>
      <ul className="mt-4 divide-y divide-nexoraRule">
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
            <Flag size={18} className="hidden shrink-0 text-nexoraDanger md:block" />
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {item.reason} <Badge tone="neutral">{item.count} báo cáo</Badge>
                {item.status !== "open" && (
                  <Badge tone={item.status === "removed" ? "danger" : "success"}>
                    {item.status === "removed" ? "Đã gỡ" : "Đã giữ"}
                  </Badge>
                )}
              </p>
              <p className="mt-1 text-sm text-nexoraMuted">{item.target}</p>
              <p className="text-xs text-nexoraSubtle">{item.at}</p>
            </div>
            {item.status === "open" && (
              <div className="grid grid-cols-2 gap-2 md:shrink-0">
                <Button variant="secondary" onClick={() => decide(item.id, "kept")}>Giữ</Button>
                <Button variant="danger" onClick={() => decide(item.id, "removed")}>Gỡ</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
