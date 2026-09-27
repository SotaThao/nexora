import { useRef, useState } from "react";
import { Delete, ScanLine, UserSearch } from "lucide-react";
import { Button, Card, Sheet } from "../../../components";
import { useStore } from "../../../store";
import { lookupCustomer } from "../../../store/slices/m04";
import { formatPhone, normalizePhone } from "../logic/domain";
import { PosFrame } from "../ui/parts";
import { CheckInResult } from "./CheckInResult";

const QUICK: [string, string | null][] = [
  ["Linh · khách quen", "7135554821"],
  ["Mai · có coupon Community", "7135556604"],
  ["Trang · lâu không ghé", "7135557765"],
  ["SĐT lạ · khách mới", null],
];
const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];

export function CheckInScreen() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);
  const customer = useStore((s) => s.customers.find((c) => c.id === customerId));
  const people = useStore((s) => s.people);
  const scannable = people.filter((p) => p.phone && (p.role === "client" || p.id === "jessica"));

  const find = (raw: string) => {
    const digits = normalizePhone(raw);
    setPhone(digits);
    if (digits.length < 7) {
      setError("Nhập SĐT hợp lệ");
      setCustomerId(null);
      return;
    }
    setError(null);
    setCustomerId(lookupCustomer(digits).customer.id);
    window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  const press = (k: string) => {
    setError(null);
    if (k === "back") setPhone((p) => p.slice(0, -1));
    else if (k === "clear") setPhone("");
    else setPhone((p) => (p.length >= 10 ? p : p + k));
  };
  const next = () => {
    setCustomerId(null);
    setPhone("");
  };

  return (
    <PosFrame crumb="Check-in khách" title="Check-in khách"
      subtitle="Khách nhập SĐT hoặc thu ngân quét NEXORA ID — POS tự nhận diện và kiểm tra điều kiện ưu đãi.">
      <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-sm font-bold">Số điện thoại khách</p>
            <div className={`mt-2 flex min-h-14 items-center justify-center rounded-xl border-2 px-3 font-mono text-2xl
              font-bold tracking-wider ${
              error ? "border-nexoraDanger" : "border-nexoraBorder"}`}>
              {phone ? formatPhone(phone) : <span
                className={`text-base font-normal tracking-normal text-nexoraSubtle`}
                >(___) ___-____</span>}
            </div>
            {error && <p role="alert" className="mt-1 text-sm font-semibold text-nexoraDanger">{error}</p>}
            <div className="mt-3 grid grid-cols-3 gap-2">
              {KEYS.map((k) => (
                <button key={k} type="button" onClick={() => press(k)}
                  aria-label={k === "back" ? "Xoá 1 số" : k === "clear" ? "Xoá hết" : k}
                  className={`grid min-h-14 place-items-center rounded-xl border border-nexoraBorder bg-white
                    text-xl font-semibold hover:bg-nexoraSurfaceMuted active:bg-nexoraBrandSoft`}
                >
                  {k === "back" ? <Delete size={20} /> : k === "clear" ? <span className="text-sm">Xoá</span> : k}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button onClick={() => find(phone)}><UserSearch size={16} className="mr-1 inline" /> Check-in</Button>
              <Button variant="secondary" onClick={() => setScanOpen(true)}><ScanLine size={16}
                className={`mr-1 inline`}
                /> Quét NEXORA ID</Button>
            </div>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-bold">Thử nhanh</p>
            <div className="mt-2 grid gap-2">
              {QUICK.map(([label, number]) => (
                <Button key={label} variant="secondary" className="justify-start text-left"
                  onClick={() => find(number ?? `346555${String(Math.floor(1000 + Math.random() * 9000))}`)}>
                  {label}
                </Button>
              ))}
            </div>
          </Card>
        </div>
        <div ref={resultRef} className="scroll-mt-24">
          {customer ? (
            <CheckInResult customer={customer} onNext={next} />
          ) : (
            <Card className="grid min-h-[320px] place-items-center p-8 text-center">
              <div>
                <p className="text-4xl">📱</p>
                <p className="mt-3 font-bold">Chờ khách check-in</p>
                <p className="mt-1 max-w-sm text-sm text-nexoraMuted">
                  Nhập SĐT hoặc bấm một nút thử nhanh. POS gom mọi coupon trong ví khách + chương trình kênh POS,
                  kiểm tra điều kiện và tự chọn ưu đãi đủ điều kiện đầu tiên.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
      <Sheet open={scanOpen} onClose={() => setScanOpen(false)} title="Quét NEXORA ID">
        <p className="mb-3 text-sm text-nexoraMuted">Bản mẫu: chọn thẻ NEXORA ID khách đưa ra để mô phỏng quét.</p>
        <div className="grid gap-2">
          {scannable.map((p) => (
            <Button key={p.id} variant="secondary" className="justify-start text-left"
              onClick={() => { setScanOpen(false); find(p.phone); }}>
              {p.nxId} · {p.name}
            </Button>
          ))}
        </div>
      </Sheet>
    </PosFrame>
  );
}
