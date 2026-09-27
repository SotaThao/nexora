import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { ArrowRight, FileText, LockKeyhole } from "lucide-react";
import { Badge, Button, Card, EmptyState, PlaceholderImage, Skeleton, StatusTimeline, useToast } from "./components";
import { type CommunityRole, type ScreenDefinition } from "./store/types";
import { CommunityShell } from "./modules/m00-foundation/shell";
import { useCommunityGate } from "./modules/m00-foundation/gates";
import { screens as adminScreens } from "./modules/m00-admin";
import { screens as feedScreens } from "./modules/m01-feed";
import { screens as jobScreens } from "./modules/m02-jobs";
import { screens as shiftScreens } from "./modules/m03-shifts";
import { screens as dealScreens } from "./modules/m04-deals";
import { screens as messageScreens } from "./modules/m05-messages";

const all: CommunityRole[] = ["guest", "tech", "owner", "client", "admin"];
const member: CommunityRole[] = ["tech", "owner", "client", "admin"];
const tech: CommunityRole[] = ["tech"]; const owner: CommunityRole[] = ["owner"]; const admin: CommunityRole[] = ["admin"];
const screen = (id: string, title: string, module: string, path: string, roles: CommunityRole[], status: string): ScreenDefinition => ({ id, title, module, path, roles, status });
const registry = { ...adminScreens, ...feedScreens, ...jobScreens, ...shiftScreens, ...dealScreens, ...messageScreens };

export const SCREENS: ScreenDefinition[] = [
  screen("S00-01", "Shell Community", "M00", "/community-v2/shell", all, "Theo từng vai (mục ẩn/hiện theo bảng menu doc 00)"),
  screen("S00-02", "Tạo tài khoản NEXORA · miễn phí", "M00", "/community-v2/account", ["guest"], "Nút tắt khi chưa tick · 3 lỗi validate · SĐT này đã đăng ký → đăng nhập · thành công + toast + chạy tiếp hành động"),
  screen("S00-03", "Xác minh OTP", "M00", "/community-v2/account/otp", ["guest"], "Nhãn Chờ Brian chốt có OTP không"),
  screen("S00-04", "Điều khoản đầy đủ", "M00", "/community-v2/terms", member, "Nút khoá tới khi cuộn hết · bản v1.1 có hộp Thay đổi so với v1.0 (mục 6a)"),
  screen("S00-05", "Điều khoản đã cập nhật (v1.1)", "M00", "/community-v2/terms/updated", member, "Vẫn xem được; bấm hành động → S00-04"),
  screen("S00-06", "Có gì mới trong Community", "M00", "/community-v2/whats-new", all, "—"),
  screen("S00-07", "Chế độ admin", "M00", "/community-v2/admin", admin, "Lưu → toast"),
  screen("S01-01", "Bảng tin", "M01", "/community-v2/feed", all, "Guest bấm ♡ → S00-02 · báo cáo → bài ẩn + toast · desktop 3 cột (menu · feed · rail nhóm gợi ý/deal gần bạn)"),
  screen("S01-02", "Soạn bài · Bước 1", "M01", "/community-v2/feed/new", member, "3 lỗi validate · AI chặn · AI cảnh báo SĐT (qua ở lần 2)"),
  screen("S01-03", "Soạn bài · Bước 2 — Đăng ở đâu", "M01", "/community-v2/feed/new/destinations", member, "4 lỗi luật đích (quá 3 / mua bán vào cộng đồng / bài thường vào chợ / 0 nơi)"),
  screen("S01-04", "Soạn bài · Bước 3 — Miễn phí / Nổi bật", "M01", "/community-v2/feed/new/featured", member, "Thợ chọn Nổi bật → khoá + câu doc 01 · doanh nghiệp → sheet thanh toán mock → toast"),
  screen("S01-05", "Nhóm & Chợ", "M01", "/community-v2/groups", all, "Tham gia/rời + toast · guest → S00-02"),
  screen("S01-06", "Chi tiết nhóm", "M01", "/community-v2/groups/:groupId", all, "Nhóm Chợ hiện ô giá"),
  screen("S01-07", "Tạo nhóm", "M01", "/community-v2/groups/new", member, "Lỗi tên <3 · chọn Thu phí → thông báo Pro"),
  screen("S01-08", "Rao vặt", "M01", "/community-v2/market", all, "Rỗng theo bộ lọc"),
  screen("S01-09", "Chi tiết bài Mua bán", "M01", "/community-v2/market/:itemId", all, "Guest mở được chat, gửi thì → S00-02"),
  screen("S01-10", "Thanh toán Nổi bật", "M01", "/community-v2/feed/featured/payment", owner, "Thất bại → giữ bản nháp + lỗi"),
  screen("S02-01", "Bảng việc làm", "M02", "/community-v2/jobs", all, "Chủ tiệm thấy CTA Tuyển thợ từ POS thay vì bảng thợ"),
  screen("S02-02", "Hồ sơ thợ", "M02", "/community-v2/jobs/profile", tech, "<60% → hint khoá AI · đủ → mở khoá"),
  screen("S02-03", "Đăng tin tìm việc — chọn cách", "M02", "/community-v2/jobs/new", tech, "—"),
  screen("S02-04", "Cách A · Mẫu + màn Nhanh", "M02", "/community-v2/jobs/new/template", tech, "Lỗi gộp · cảnh báo SĐT + Xoá số khỏi bài"),
  screen("S02-05", "Cách B · Nói/gõ 1 câu", "M02", "/community-v2/jobs/new/ai", tech, "<6 ký tự · Chưa nhận ra nhiều…"),
  screen("S02-06", "Cách C · 4 bước", "M02", "/community-v2/jobs/new/steps", tech, "Lỗi từng bước đúng câu doc 02"),
  screen("S02-07", "Tin của tôi", "M02", "/community-v2/jobs/mine", tech, "Hết hạn → Gia hạn 30 ngày"),
  screen("S02-08", "Lời mời phỏng vấn", "M02", "/community-v2/jobs/invites", tech, "Sau đồng ý: nhãn đã chia sẻ"),
  screen("S02-09", "Chi tiết tin tuyển + ứng tuyển", "M02", "/community-v2/jobs/:jobId", tech, "Toast doc 02"),
  screen("S02-10", "POS · Tuyển thợ", "M02", "/community-v2/pos/jobs", owner, "Toast doc 02"),
  screen("S02-11", "POS · AI gợi ý thợ + lời mời", "M02", "/community-v2/pos/jobs/suggestions", owner, "Mời 2 lần bị chặn · thợ Đã có việc không mời được"),
  screen("S02-12", "POS · Đơn ứng tuyển", "M02", "/community-v2/pos/jobs/applications", owner, "Nhãn Đề xuất bổ sung"),
  screen("S03-01", "Ca gần bạn", "M03", "/community-v2/shifts", tech, "Tắt sẵn sàng → trạng thái rỗng giải thích"),
  screen("S03-02", "Nhận ca / Ứng tuyển", "M03", "/community-v2/shifts/:shiftId/apply", tech, "Nút khoá tới khi tick · nhận ngay → Đã chốt · ứng tuyển → Chờ duyệt"),
  screen("S03-03", "Ca của tôi", "M03", "/community-v2/shifts/mine", tech, "Ngoài cửa sổ → disabled + câu giải thích · check-in thành công · mô phỏng quá giờ → Vắng mặt + mất cọc"),
  screen("S03-04", "Huỷ ca", "M03", "/community-v2/shifts/:shiftId/cancel", ["tech", "owner"], "4 ô ma trận"),
  screen("S03-05", "POS · Đăng ca", "M03", "/community-v2/pos/shifts/new", owner, "Lỗi thiếu trường · xác nhận tạm giữ → toast"),
  screen("S03-06", "POS · Chi tiết ca & ứng viên", "M03", "/community-v2/pos/shifts/:shiftId", owner, "✕ → hoàn cọc · Xong ca → toast trả tiền"),
  screen("S03-07", "POS · Thợ rảnh gần tiệm", "M03", "/community-v2/pos/shifts/available", owner, "—"),
  screen("S03-08", "POS · Chia sẻ thợ dư", "M03", "/community-v2/pos/shifts/share", owner, "Toast doc 03"),
  screen("S03-09", "Chính sách ca", "M03", "/community-v2/admin/shifts", admin, "Lỗi ngoài khoảng"),
  screen("S04-01", "Deal gần bạn", "M04", "/community-v2/deals/nearby", all, "còn ≤3 ngày đỏ · desktop: map trái, list phải"),
  screen("S04-02", "Coupon theo ngành", "M04", "/community-v2/deals/categories", all, "Rỗng theo ngành"),
  screen("S04-03", "Chi tiết deal", "M04", "/community-v2/deals/:dealId", all, "Guest → S00-02 → tự lấy tiếp · 4 lỗi (đã có mã → mở ví / hết hạn / vượt giới hạn / hết lượt)"),
  screen("S04-04", "Đã lấy coupon!", "M04", "/community-v2/deals/:dealId/claimed", member, "—"),
  screen("S04-05", "Ví coupon", "M04", "/community-v2/deals/wallet", member, "Rỗng"),
  screen("S04-06", "Mã coupon", "M04", "/community-v2/deals/coupon/:couponId", member, "Hết hạn giữ → trạng thái trả lượt"),
  screen("S04-07", "Wish list & theo dõi từ khoá", "M04", "/community-v2/deals/wishlist", member, "—"),
  screen("S04-08", "Trang public coupon", "M04", "/community-v2/c/:couponId", all, "Desktop: card giữa màn"),
  screen("S04-09", "POS · Chương trình", "M04", "/community-v2/pos/promotions", owner, "Toast dừng / gỡ Community (câu doc 04)"),
  screen("S04-10", "POS · Tạo chương trình", "M04", "/community-v2/pos/promotions/new", owner, "4 lỗi validate · giữ lượt ≥ hạn → cảnh báo · bấm POS → câu POS luôn bật… · tài khoản thợ → khoá quảng cáo"),
  screen("S04-11", "POS · Check-in khách", "M04", "/community-v2/pos/check-in", owner, "Đủ 8 lý do từ chối trình diễn được · toast ✓ Đã áp dụng…"),
  screen("S04-12", "POS · Quầy redeem bằng ví", "M04", "/community-v2/pos/redeem", owner, "7 lý do từ chối đúng thứ tự · thành công"),
  screen("S04-13", "POS · Báo cáo", "M04", "/community-v2/pos/promotions/report", owner, "Nhãn dữ liệu mẫu"),
  screen("S04-14", "POS · QR tại quầy", "M04", "/community-v2/pos/promotions/:promotionId/qr", owner, "—"),
  screen("S05-01", "Hộp thư", "M05", "/community-v2/messages", all, "Desktop: 2 cột (list + phòng chat), mobile: điều hướng"),
  screen("S05-02", "Phòng chat DM", "M05", "/community-v2/messages/:threadId", member, "Cảnh báo lừa đảo dưới tin đến · guest gửi → S00-02 → tin tự gửi"),
  screen("S05-03", "Phòng lời mời nhắn tin", "M05", "/community-v2/messages/requests/:threadId", member, "2 kết quả + toast"),
  screen("S05-04", "Nhóm tiệm", "M05", "/community-v2/messages/salon", ["tech", "owner"], "—"),
  screen("S05-05", "Cộng đồng công khai", "M05", "/community-v2/messages/community", all, "—"),
  screen("S05-06", "Tìm người", "M05", "/community-v2/messages/find", member, "—"),
  screen("S05-07", "Đang gọi / trong cuộc gọi thoại", "M05", "/community-v2/calls/:callId", member, "Thu nhỏ thành pill vẫn nhắn tin được"),
  screen("S05-08", "Cuộc gọi video", "M05", "/community-v2/calls/:callId/video", member, "—"),
  screen("S05-09", "Cuộc gọi đến", "M05", "/community-v2/calls/incoming", member, "Từ chối → cuộc nhỡ trong chat + tab Cuộc gọi"),
  screen("S05-10", "Lịch sử cuộc gọi", "M05", "/community-v2/calls", member, "—"),
  screen("S05-11", "Gọi nhóm", "M05", "/community-v2/calls/group/:callId", member, "—"),
  screen("S05-12", "Riêng tư", "M05", "/community-v2/privacy", member, "Tắt cảnh báo lừa đảo → toast"),
  screen("S05-13", "Thẻ NEXORA ID", "M05", "/community-v2/id", member, "2 lỗi nickname")
];

export function PlaceholderScreen({ id, title, module, status }: Pick<ScreenDefinition, "id" | "title" | "module" | "status">) { const location = useLocation(); return <div className="mx-auto max-w-4xl space-y-5"><div><div className="flex flex-wrap items-center gap-2"><Badge tone="brand">{id}</Badge><Badge tone="neutral">{module}</Badge>{location.pathname.includes("/pos/") && <Badge tone="warning">POS</Badge>}</div><h2 className="mt-3 text-2xl font-bold text-nexoraText">{title}</h2><p className="mt-1 text-nexoraMuted">Màn hình đã được đăng ký để các stream song song thay thế an toàn.</p></div><div className="grid gap-5 md:grid-cols-[1.2fr_.8fr]"><Card className="overflow-hidden"><PlaceholderImage label={`${module} · đang xây dựng`} /><div className="p-5"><p className="text-sm font-bold">Trạng thái cần có</p><p className="mt-2 text-sm leading-6 text-nexoraMuted">{status}</p></div></Card><div className="space-y-4"><Card className="p-4"><p className="text-sm font-bold">Chuẩn bị cho stream sở hữu</p><StatusTimeline statuses={["Route đã sẵn sàng", "Dữ liệu seed đã có", "Thay placeholder bằng module riêng"]} /></Card><Skeleton className="h-24" /></div></div></div>; }
function FeedPlaceholder() { return <div className="mx-auto max-w-5xl"><PlaceholderScreen {...SCREENS.find((screen) => screen.id === "S01-01")!} /></div>; }
function GateDemo() { const { requireAccount } = useCommunityGate(); const toast = useToast(); const actions = ["Mở khung soạn bài", "thích bài", "tham gia nhóm", "tạo nhóm", "Mở soạn tin tìm việc", "Đăng tin tuyển", "ứng tuyển", "mời phỏng vấn", "đồng ý/từ chối chia sẻ SĐT", "Đăng ca", "nhận ca/ứng tuyển", "hỏi thợ", "mời vào ca", "Lấy coupon", "phát hành coupon", "Gửi tin", "gửi ghi âm", "gọi thoại/video", "gọi nhóm", "gọi lại", "tham gia nhóm", "chấp nhận lời mời nhắn tin", "tham gia cuộc gọi đang diễn ra"]; return <div className="mx-auto max-w-4xl"><Card className="p-5"><div className="flex items-center gap-3"><LockKeyhole className="text-nexoraBrand" /><div><h2 className="text-xl font-bold">Demo cổng tài khoản</h2><p className="text-sm text-nexoraMuted">Mỗi nút dùng requireAccount(actionId, run).</p></div></div><div className="mt-5 grid gap-2 sm:grid-cols-2">{actions.map((action, index) => <Button key={`${action}-${index}`} variant="secondary" className="justify-between text-left" onClick={() => requireAccount(action, () => toast(`Đã tiếp tục: ${action}`, "success"))}>{action}<ArrowRight size={16} /></Button>)}</div></Card></div>; }
function FoundationRoute({ screen }: { screen: ScreenDefinition }) {
  const { requireAccount, openTerms } = useCommunityGate();
  const toast = useToast();

  if (screen.id === "S00-01") {
    return <PlaceholderScreen {...screen} />;
  }

  if (screen.id === "S00-04" || screen.id === "S00-05") {
    return (
      <Card className="mx-auto max-w-2xl p-6">
        <FileText className="text-nexoraBrand" />
        <h2 className="mt-3 text-xl font-bold">{screen.title}</h2>
        <p className="mt-2 text-nexoraMuted">
          Mở điều khoản tương tác, cuộn hết và chọn đủ các xác nhận.
        </p>
        <Button className="mt-4" variant="gradient" onClick={openTerms}>
          Mở điều khoản
        </Button>
      </Card>
    );
  }

  if (screen.id === "S00-02" || screen.id === "S00-03") {
    return (
      <Card className="mx-auto max-w-2xl p-6">
        <h2 className="text-xl font-bold">{screen.title}</h2>
        <p className="mt-2 text-nexoraMuted">Đây là biến thể trong cổng tài khoản.</p>
        <Button
          className="mt-4"
          variant="gradient"
          onClick={() => requireAccount("foundation-preview", () => toast("Bạn đã là thành viên"))}
        >
          Mở bản xem trước
        </Button>
      </Card>
    );
  }

  return <PlaceholderScreen {...screen} />;
}

function renderScreen(definition: ScreenDefinition) {
  const Registered = registry[definition.id];
  if (Registered) {
    return <Registered screen={definition} />;
  }
  if (definition.id === "S01-01") {
    return <FeedPlaceholder />;
  }
  if (definition.module === "M00") {
    return <FoundationRoute screen={definition} />;
  }
  return <PlaceholderScreen {...definition} />;
}

function routePath(definition: ScreenDefinition) {
  const relative = definition.path.replace("/community-v2/", "");
  // Routes without a `:param` segment get a trailing `/*` so a registered
  // screen can own its own nested sub-paths (e.g. messages/new?to=<id>).
  return relative.includes(":") ? relative : `${relative}/*`;
}

export default function CommunityV2Routes() {
  return (
    <Routes>
      <Route element={<CommunityShell />}>
        <Route index element={<Navigate to="feed" replace />} />
        <Route path="demo/gate" element={<GateDemo />} />
        {SCREENS.map((definition) => (
          <Route key={definition.id} path={routePath(definition)} element={renderScreen(definition)} />
        ))}
        <Route
          path="learning"
          element={<EmptyState title="Học tập" body="Giữ nguyên module hiện có trong app" />}
        />
        <Route
          path="events"
          element={<EmptyState title="Sự kiện" body="Giữ nguyên module hiện có trong app" />}
        />
      </Route>
    </Routes>
  );
}
