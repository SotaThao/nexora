import { useState } from "react";
import { ChevronDown, ChevronUp, RotateCcw, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Sheet, Toggle, useToast } from "../../components";
import { simulate } from "../../events";
import { storeActions, useStore } from "../../store";

const roles = [
  ["guest", "Khách chưa ĐK"],
  ["tech", "Jessica · thợ"],
  ["owner", "Kayla · chủ tiệm"],
  ["client", "Linh · khách"],
  ["admin", "Admin"],
] as const;

const scenarios = [
  ["K1 · Lấy coupon", "/community-v2/deals/nearby"],
  ["K2 · Tạo chương trình", "/community-v2/pos/promotions/new"],
  ["K3 · Check-in POS", "/community-v2/pos/check-in"],
  ["K4 · Đăng bài", "/community-v2/feed"],
  ["K5 · Hồ sơ thợ", "/community-v2/jobs/profile"],
  ["K6 · Đăng ca", "/community-v2/pos/shifts/new"],
  ["K7 · Tin nhắn", "/community-v2/messages/find"],
  ["K8 · Điều khoản", "/community-v2/admin"],
] as const;

type ControlsProps = { onDone?: () => void };

function Controls({ onDone }: ControlsProps) {
  const role = useStore((state) => state.role);
  const otpEnabled = useStore((state) => state.otpEnabled);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const reset = () => {
    storeActions.resetDemo();
    navigate("/community-v2/feed");
    toast("Đã khôi phục dữ liệu demo");
    onDone?.();
  };

  const simulateEvent = (event: "terms" | "call" | "shift") => {
    if (event === "terms") {
      storeActions.publishTerms();
      simulate("terms.v11.published");
      toast("Đã phát hành điều khoản v1.1");
    } else {
      simulate(event === "call" ? "call.incoming" : "shift.checkin.overdue");
      toast("Chưa có màn — stream khác sẽ nối");
    }
    onDone?.();
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[10px] font-bold tracking-[0.16em] text-white/60">
        DEMO
      </span>
      <div className="flex max-w-full overflow-x-auto rounded-md bg-white/10 p-0.5">
        {roles.map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => storeActions.setRole(value)}
            className={`min-h-7 shrink-0 rounded px-2 text-[11px] font-semibold ${
              role === value
                ? "bg-white text-nexoraSidebar"
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      <details className="relative">
        <summary className="flex min-h-7 cursor-pointer items-center gap-1 rounded px-2 text-[11px] font-semibold text-white/80 hover:bg-white/10">
          Kịch bản <ChevronDown size={13} />
        </summary>
        <div className="absolute left-0 z-[60] mt-1 w-52 rounded-lg bg-nexoraSurface p-1 shadow-premium">
          {scenarios.map(([label, path]) => (
            <button
              key={path}
              className="min-h-9 w-full rounded px-2 text-left text-xs text-nexoraText hover:bg-nexoraSurfaceMuted"
              onClick={() => {
                navigate(path);
                onDone?.();
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </details>
      <details className="relative">
        <summary className="flex min-h-7 cursor-pointer items-center gap-1 rounded px-2 text-[11px] font-semibold text-white/80 hover:bg-white/10">
          Mô phỏng <ChevronDown size={13} />
        </summary>
        <div className="absolute left-0 z-[60] mt-1 w-72 rounded-lg bg-nexoraSurface p-1 shadow-premium">
          <button className="demo-menu" onClick={() => simulateEvent("terms")}>Phát hành điều khoản v1.1 (quan trọng)</button>
          <button className="demo-menu" onClick={() => simulateEvent("call")}>Có cuộc gọi đến</button>
          <button className="demo-menu" onClick={() => simulateEvent("shift")}>Quá giờ check-in ca</button>
        </div>
      </details>
      <button
        type="button"
        className="min-h-7 rounded px-2 text-[11px] font-semibold text-white/80 hover:bg-white/10"
        onClick={reset}
      >
        <RotateCcw size={13} className="mr-1 inline" /> Reset
      </button>
      <button
        type="button"
        aria-label="Cài đặt demo"
        className="grid size-7 place-items-center rounded text-white/80 hover:bg-white/10"
        onClick={() => setSettingsOpen(true)}
      >
        <Settings2 size={14} />
      </button>
      <Sheet open={settingsOpen} onClose={() => setSettingsOpen(false)} title="Cài đặt demo">
        <Toggle
          label="Bật OTP (chờ Brian chốt)"
          checked={otpEnabled}
          onChange={storeActions.setOtpEnabled}
        />
      </Sheet>
    </div>
  );
}

export function DemoBar() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024);
  const mobile = window.innerWidth < 1024;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        data-testid="community-demo-pill"
        className="fixed right-3 top-2 z-50 h-8 rounded-full bg-nexoraSidebar px-3 text-xs font-bold text-white shadow-nexora-card lg:top-1"
      >
        Demo
      </button>
    );
  }

  if (!mobile) {
    return (
      <div data-testid="community-demo-bar" className="relative z-50 flex h-10 items-center bg-nexoraSidebar px-3">
        <Controls />
        <button
          type="button"
          aria-label="Thu gọn demo"
          onClick={() => setCollapsed(true)}
          className="ml-auto grid size-7 place-items-center rounded text-white/70 hover:bg-white/10"
        >
          <ChevronUp size={15} />
        </button>
      </div>
    );
  }

  return <Sheet open onClose={() => setCollapsed(true)} title="DEMO"><div className="-m-5 bg-nexoraSidebar p-5"><Controls onDone={() => setCollapsed(true)} /></div></Sheet>;
}
