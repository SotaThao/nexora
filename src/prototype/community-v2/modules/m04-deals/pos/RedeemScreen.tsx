import { useState } from "react";
import { ScanLine, Search } from "lucide-react";
import { Button, Card, Checkbox, Input, Sheet } from "../../../components";
import { useToast } from "../ui/toast";
import { useStore } from "../../../store";
import { checkWalletCode, redeemWallet, type WalletCheck } from "../../../store/slices/m04";
import { pinFor, secondsLeftInWindow } from "../logic/dynamicCode";
import {
  AUDIENCE_LABEL, POS_SALON_ID, couponState, fmtDateTime, money, offerHeadline, savingsFor,
} from "../logic/domain";
import { useNow } from "../ui/hooks";
import { PosFrame, SampleTag } from "../ui/parts";

/** Rows for the presenter — one per rejection of doc 04 flow 4, in order. */
const TRIALS: [string, string, "pin" | "wrong" | ""][] = [
  ["NX-ZZ99-0000", "Mã không tồn tại", ""],
  ["NX-LT01-3MZQ", "Mã của tiệm khác (Lotus Spa)", "pin"],
  ["NX-KN01-7Q2D", "Mã đã dùng", "pin"],
  ["NX-KN05-Y4NM", "Chương trình tạm dừng", "pin"],
  ["NX-KN06-B8RE", "Chương trình hết hạn", "pin"],
  ["NX-KN01-H6XC", "Quá hạn giữ lượt", "pin"],
  ["NX-KN02-2L9Q", "PIN sai", "wrong"],
];

export function RedeemScreen() {
  const toast = useToast();
  const now = useNow(1000);
  const state = useStore((s) => s);
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [check, setCheck] = useState<WalletCheck | null>(null);
  const [confirmedNew, setConfirmedNew] = useState(false);
  const [bill, setBill] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const byId = new Map(state.promotions.map((p) => [p.id, p]));
  const live = state.coupons.filter((c) => {
    const p = byId.get(c.promotionId);
    return p && p.salonId === POS_SALON_ID && couponState(c, p, now) === "active" && p.status === "active";
  });
  const ownerName = (ownerId: string) =>
    state.people.find((p) => p.id === ownerId)?.name ?? `Khách ${ownerId.replace("phone:", "")}`;

  const run = (c = code, p = pin) => {
    setSuccess(null);
    setConfirmedNew(false);
    setCheck(checkWalletCode(c, p));
  };
  const fill = (c: string, mode: "pin" | "wrong" | "") => {
    const p = mode === "pin" ? pinFor(c) : mode === "wrong" ? "000000" : "123456";
    setCode(c);
    setPin(p);
    run(c, p);
  };
  const confirm = () => {
    const result = redeemWallet(code, pin, Number(bill) || 0);
    if (result.error) {
      setCheck({ ok: false, message: result.error });
      return;
    }
    toast("✓ Redeem thành công", "success");
    setSuccess(`${code.toUpperCase()} · khách tiết kiệm ${money(result.saved)}`);
    setCheck(null);
    setCode("");
    setPin("");
    setBill("");
  };
  const needNew = check?.ok && check.promotion.audience === "new";

  return (
    <PosFrame crumb="Quầy redeem" title="Quầy redeem bằng ví"
      subtitle="Dùng khi khách không check-in: quét QR hoặc nhập mã + PIN động (đổi mỗi 30 giây).">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4">
          <Card className="p-5">
            <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); run(); }}>
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <div>
                  <label htmlFor="r-code" className="mb-1.5 block text-sm font-semibold">Mã coupon</label>
                  <Input id="r-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="NX-KN02-XXXX" className="font-mono uppercase tracking-wider" />
                </div>
                <div>
                  <label htmlFor="r-pin" className="mb-1.5 block text-sm font-semibold">PIN động</label>
                  <Input id="r-pin" value={pin} inputMode="numeric" maxLength={6} placeholder="6 số"
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      className={`font-mono tracking-[0.3em]`}
                    />
                </div>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit"
                  className={`flex-1`}
                  ><Search size={16} className="mr-1 inline" /> 🔍 Kiểm tra coupon</Button>
                <Button type="button" variant="secondary" onClick={() => setScanOpen(true)}>
                  <ScanLine size={16} className="mr-1 inline" /> Quét QR
                </Button>
              </div>
            </form>
          </Card>

          {success && (
            <Card className="border-nexoraSuccess/40 p-5">
              <p className="font-bold text-nexoraSuccess">✓ Redeem thành công</p>
              <p className="mt-1 text-sm text-nexoraMuted">{success} · đã ghi vào POS & báo cáo.</p>
            </Card>
          )}
          {check && check.ok === false && (
            <Card className="border-nexoraDanger/40 bg-nexoraDanger/5 p-5">
              <p role="alert" className="font-semibold text-nexoraDanger">⛔ {check.message}</p>
            </Card>
          )}
          {check?.ok && (
            <Card className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-nexoraSuccess">✓ Mã hợp lệ · PIN khớp</p>
                <p
                  className={`mt-1 text-lg font-bold`}
                  >{check.promotion.emoji} {check.promotion.title} · {offerHeadline(check.promotion)}</p>
                <p className="text-sm text-nexoraMuted">
                  {ownerName(check.coupon.ownerId)} · lấy từ {check.coupon.source}
                  {" "}· giữ tới {fmtDateTime(check.coupon.holdUntil)}
                </p>
                <p
                  className={`text-sm text-nexoraMuted`}
                  >Áp dụng cho: {AUDIENCE_LABEL[check.promotion.audience]} · {check.promotion.condition}</p>
              </div>
              {needNew && (
                <div className="rounded-lg bg-nexoraWarning/10 p-3">
                  <Checkbox checked={confirmedNew} onChange={(e) => setConfirmedNew(e.target.checked)}
                    label="Đã xác nhận: khách mới lần đầu" />
                  <p className="text-xs text-nexoraMuted">Fallback khi redeem bằng ví không có hồ sơ khách.</p>
                </div>
              )}
              <div>
                <label htmlFor="r-bill" className="mb-1.5 block text-sm font-semibold">Tổng hoá đơn ($)</label>
                <Input id="r-bill" type="number" inputMode="decimal" value={bill}
                  onChange={(e) => setBill(e.target.value)}
                  placeholder="VD: 60" className="max-w-[220px]" />
                <p className="mt-2 flex items-center gap-2 text-sm">
                  Khách tiết kiệm <b>{money(savingsFor(check.promotion, Number(bill) || 0))}</b> <SampleTag />
                </p>
              </div>
              <Button variant="gradient"
                className={`w-full sm:w-auto`}
                disabled={needNew && !confirmedNew} onClick={confirm}>
                ✓ Xác nhận dùng & ghi vào POS
              </Button>
            </Card>
          )}
        </div>

        <Card className="h-fit p-5">
          <p className="font-bold">Bảng thử cho buổi trình bày</p>
          <p className="mt-0.5 text-xs text-nexoraMuted">
            7 lý do từ chối theo đúng thứ tự · PIN chấp nhận cửa sổ hiện tại + cửa sổ trước
            {" "}(đổi sau {secondsLeftInWindow(now)}s).
          </p>
          <ul className="mt-3 divide-y divide-nexoraRule">
            {TRIALS.map(([c, label, mode], i) => (
              <li key={c} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 text-sm">
                  <span className="text-nexoraSubtle">{i + 1}.</span> {label}
                  <span className="block font-mono text-xs text-nexoraMuted">{c}</span>
                </span>
                <Button variant="secondary"
                  className={`!min-h-11 shrink-0 !px-3 text-xs`}
                  onClick={() => fill(c, mode)}>Thử</Button>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-bold">Mã còn hiệu lực · PIN trên ví khách</p>
          <ul className="mt-1 divide-y divide-nexoraRule">
            {live.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-2 py-2">
                <span className="min-w-0 text-sm">
                  {ownerName(c.ownerId)}
                  <span className="block font-mono text-xs text-nexoraMuted">{c.code} · PIN {pinFor(c.code)}</span>
                </span>
                <Button variant="secondary"
                  className={`!min-h-11 shrink-0 !px-3 text-xs`}
                  onClick={() => fill(c.code, "pin")}>Dùng</Button>
              </li>
            ))}
            {!live.length && <li className="py-2 text-sm text-nexoraMuted">Không còn mã hợp lệ.</li>}
          </ul>
        </Card>
      </div>
      <Sheet open={scanOpen} onClose={() => setScanOpen(false)} title="Quét QR ví khách">
        <p
          className={`mb-3 text-sm text-nexoraMuted`}
          >Bản mẫu: chọn mã khách đang mở trên Ví coupon — QR chứa mã + PIN của cửa sổ hiện tại.</p>
        <div className="grid gap-2">
          {live.map((c) => (
            <Button key={c.id} variant="secondary" className="text-left font-mono"
              onClick={() => { setScanOpen(false); fill(c.code, "pin"); }}>
              {c.code} · {ownerName(c.ownerId)}
            </Button>
          ))}
        </div>
      </Sheet>
    </PosFrame>
  );
}
