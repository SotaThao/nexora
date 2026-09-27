import { useState } from "react";
import { CalendarClock, FileText, Flag, ShieldAlert, Sparkles } from "lucide-react";
import { Badge, Card } from "../../components";
import type { ScreenDefinition } from "../../store/types";
import { PolicyForm } from "../m03-shifts/PolicyForm";
import { RoleGate } from "../m03-shifts/ShiftShared";
import { FeaturedPricesTab, TermsTab } from "./AdminTabs";
import { KeywordsTab, ReportsTab } from "./AdminModeration";

export const ADMIN_TABS = [
  { id: "featured", label: "Giá Nổi bật", icon: Sparkles },
  { id: "policy", label: "Chính sách ca", icon: CalendarClock },
  { id: "terms", label: "Phiên bản điều khoản", icon: FileText },
  { id: "keywords", label: "Từ khoá AI", icon: ShieldAlert },
  { id: "reports", label: "Hàng đợi báo cáo", icon: Flag },
] as const;
export type AdminTabId = (typeof ADMIN_TABS)[number]["id"];

function PolicyTab() {
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold">⚙️ Chính sách (Admin NEXORA) — SỐ MẪU</h2>
        <Badge tone="warning">Số mẫu</Badge>
      </div>
      <p className="mt-1 text-sm text-nexoraMuted">
        Cọc & phí ca làm thêm. Luật sư + đối tác thanh toán duyệt số thật.
      </p>
      <div className="mt-5"><PolicyForm /></div>
    </Card>
  );
}

export function AdminView({ title, initialTab = "featured" }: { title: string; initialTab?: AdminTabId }) {
  const [tab, setTab] = useState<AdminTabId>(initialTab);
  return (
    <div className="space-y-5">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">Admin NEXORA</Badge>
          <span className="text-xs text-nexoraMuted">Bản mẫu là nút bật/tắt — bản thật phải có xác thực</span>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-nexoraText">{title}</h1>
      </header>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
        <nav
          aria-label="Mục admin"
          className="flex gap-1 overflow-x-auto border-b border-nexoraBorder lg:flex-col lg:self-start lg:rounded-xl
            lg:border lg:bg-white lg:p-2 lg:shadow-nexora-card"
        >
          {ADMIN_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 px-3 text-sm font-semibold lg:rounded-lg ${
                tab === id
                  ? "border-b-2 border-nexoraBrand text-nexoraBrand lg:border-0 lg:bg-nexoraBrandSoft"
                  : "border-b-2 border-transparent text-nexoraMuted lg:border-0 lg:hover:bg-nexoraSurfaceMuted"
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          {tab === "featured" && <FeaturedPricesTab />}
          {tab === "policy" && <PolicyTab />}
          {tab === "terms" && <TermsTab />}
          {tab === "keywords" && <KeywordsTab />}
          {tab === "reports" && <ReportsTab />}
        </div>
      </div>
    </div>
  );
}

/** S00-07 — visible only for the Admin role. */
export function AdminScreen({ screen }: { screen: ScreenDefinition }) {
  return (
    <RoleGate need="admin">
      <AdminView title={screen.title} />
    </RoleGate>
  );
}
