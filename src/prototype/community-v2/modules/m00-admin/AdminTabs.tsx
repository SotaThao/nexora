import { useState } from "react";
import { FileText, Info, Save } from "lucide-react";
import { Badge, Button, Card, Checkbox, Input, MoneyTag, SponsoredBadge } from "../../components";
import { useShiftToast } from "../m03-shifts/ShiftToast";
import { simulate } from "../../events";
import { storeActions, useStore } from "../../store";

const PACKAGES = [
  { days: 3, price: "5" },
  { days: 7, price: "10" },
  { days: 14, price: "18" },
];

/**
 * Giá Nổi bật (doc 01 · Cấu hình). The prices are M01 data this stream must not write,
 * so edits stay admin-local display state.
 */
export function FeaturedPricesTab() {
  const toast = useShiftToast();
  const [prices, setPrices] = useState(() => PACKAGES.map((item) => item.price));
  const [businessOnly, setBusinessOnly] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const save = () => {
    const next = prices.map((value) => (Number(value) > 0 ? "" : "Giá phải là số lớn hơn 0"));
    setErrors(next);
    if (next.some(Boolean)) return;
    toast("✓ Đã lưu giá Nổi bật (giá mẫu)", "success");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">Giá Nổi bật · GIÁ MẪU</h2>
        <SponsoredBadge />
      </div>
      <p className="mt-1 text-sm text-nexoraMuted">Ghim bài lên đầu các đích đã chọn. Brian quyết giá thật.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {PACKAGES.map((item, index) => (
          <label key={item.days} className="rounded-xl border border-nexoraBorder p-4 text-sm font-semibold">
            Nổi bật {item.days} ngày
            <div className="mt-2 flex items-center gap-2">
              <span className="text-nexoraMuted">$</span>
              <Input
                inputMode="decimal"
                value={prices[index]}
                aria-invalid={Boolean(errors[index])}
                onChange={(event) => setPrices(prices.map((value, i) => (i === index ? event.target.value : value)))}
              />
            </div>
            {errors[index] && <span className="mt-1 block text-xs text-nexoraDanger">{errors[index]}</span>}
            <span className="mt-2 block text-xs font-normal text-nexoraSubtle">
              Hiện: <MoneyTag>${prices[index] || "0"}</MoneyTag>
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4">
        <Checkbox
          checked={businessOnly}
          onChange={(event) => setBusinessOnly(event.target.checked)}
          label="Chỉ tài khoản doanh nghiệp được mua Nổi bật (thợ cá nhân luôn đăng miễn phí)"
        />
      </div>
      <p className="mt-3 flex gap-2 rounded-lg bg-nexoraSurfaceMuted p-3 text-xs text-nexoraMuted">
        <Info size={14} className="mt-0.5 shrink-0" />
        Giá Nổi bật thuộc dữ liệu Bảng tin (M01). Bản mẫu chỉ lưu trên màn admin này — bước đăng bài vẫn dùng
        giá mẫu $5 / $10 / $18.
      </p>
      <Button className="mt-5" variant="gradient" onClick={save}>
        <Save size={16} className="mr-1 inline" />Lưu giá
      </Button>
    </Card>
  );
}

/** Phiên bản điều khoản — publishing fires the existing L0 action + simulate event (no terms logic here). */
export function TermsTab() {
  const toast = useShiftToast();
  const version = useStore((state) => state.termsVersion);
  const records = useStore((state) => state.consentRecords.length);
  const [important, setImportant] = useState(true);
  const published = version === "1.1";

  const publish = () => {
    storeActions.publishTerms();
    simulate("terms.v11.published");
    toast("Đã phát hành điều khoản v1.1", "success");
  };

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">Phiên bản điều khoản</h2>
        <Badge tone="brand">Hiện hành v{version}</Badge>
        <Badge tone="warning">BẢN NHÁP — CẦN LUẬT SƯ DUYỆT</Badge>
      </div>
      <ol className="mt-5 space-y-3">
        <li className="flex gap-3 rounded-xl border border-nexoraBorder p-4">
          <FileText size={18} className="mt-0.5 shrink-0 text-nexoraBrand" />
          <div>
            <p className="font-semibold">v1.0 · 15 mục <Badge tone="success">Đã phát hành</Badge></p>
            <p className="mt-1 text-sm text-nexoraMuted">Bản đầu tiên — thành viên đồng ý một lần lúc đăng ký.</p>
          </div>
        </li>
        <li className={`flex gap-3 rounded-xl border p-4 ${published ? "border-nexoraBorder" : "border-nexoraBrand"}`}>
          <FileText size={18} className="mt-0.5 shrink-0 text-nexoraBrand" />
          <div className="min-w-0">
            <p className="font-semibold">
              v1.1 · thay đổi mục 6a{" "}
              <Badge tone={published ? "success" : "neutral"}>{published ? "Đã phát hành" : "Nháp"}</Badge>
            </p>
            <p className="mt-1 text-sm text-nexoraMuted">
              6a. Không chia sẻ tin nhắn thoại/ảnh chụp cuộc gọi của người khác ra ngoài app.
            </p>
          </div>
        </li>
      </ol>
      <div className="mt-4">
        <Checkbox
          checked={important}
          disabled={published}
          onChange={(event) => setImportant(event.target.checked)}
          label="Đánh dấu thay đổi quan trọng — thành viên phải đồng ý lại ở hành động kế tiếp"
        />
      </div>
      {!important && !published && (
        <p className="mt-1 text-xs text-nexoraMuted">
          Thay đổi không quan trọng: không làm gì với thành viên. Bản mẫu chỉ trình diễn phát hành quan trọng.
        </p>
      )}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-nexoraMuted">Bản ghi đồng ý đã lưu: {records}</p>
        <Button variant="gradient" disabled={published || !important} onClick={publish}>
          {published ? "Đã phát hành v1.1" : "Phát hành v1.1 · quan trọng"}
        </Button>
      </div>
    </Card>
  );
}
