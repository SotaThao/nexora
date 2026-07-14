# US-014 · POS Salon Details — Booking Notification Phone & Business Hours

> File: `US-014-pos-salon-details-business-hours.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-14 |
| **Epic / Domain** | POS Owner Setup — Setup Salon Details |
| **OpenSpec change** | `—` (mở rộng field có sẵn trên Business Info card + 1 card mới cùng pattern, không đụng shared layer auth/httpClient) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** thêm số điện thoại nhận thông báo đặt lịch (booking notification phone) và thiết lập giờ mở cửa theo từng ngày trong tuần cho salon,
**để** không bỏ lỡ thông báo đặt lịch và để hệ thống dùng giờ này làm mặc định khi thiết lập lịch làm việc cho từng thợ sau này.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Salon Details" (Ticket 2 trong kế hoạch kỹ thuật POS Owner Setup).

## Acceptance Criteria

- **Given** Owner đang ở Settings → Profile tab, card "Business Information" đang ở chế độ edit
- **When** Owner nhập số điện thoại thông báo đặt lịch và bấm Save
- **Then** FE gọi `PUT /api/v1/merchant/business/info` với field `bookingNotificationPhone` kèm các field hiện có (name/phone/feedbackEmail/website); API trả 200; card hiển thị giá trị mới sau khi cache được invalidate

- **Given** Owner mở card/section "Business Hours" mới trong Settings, lần đầu chưa có dữ liệu
- **When** section này load
- **Then** FE gọi `GET /api/v1/merchant/settings/business-hours`; hiển thị 7 dòng (Chủ Nhật→Thứ Bảy), ngày chưa có dữ liệu mặc định hiển thị "Closed"

- **Given** Owner bật "Open" cho một ngày và nhập giờ mở/đóng cửa (đảm bảo đóng cửa sau giờ mở), hoặc đánh dấu ngày đó "Closed"
- **When** Owner bấm Save
- **Then** FE gọi `PUT /api/v1/merchant/settings/business-hours` với đủ 7 ngày; API trả 200 (`true`); UI cập nhật lại theo response mới nhất

- **Given** Owner bật "Open" nhưng bỏ trống giờ mở hoặc giờ đóng ≤ giờ mở
- **When** Owner bấm Save
- **Then** FE validate tại client (không gọi API) và hiển thị lỗi tương ứng — BE cũng validate lại (400, error code `POS_OPERATING_HOUR_INVALID_TIME_RANGE`) nếu FE validate bị bỏ qua

## API Mapping (bắt buộc trước khi integrate)

> Contract này được build cùng lúc trong session này ở backend repo (`vlink-nexora/backend`) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn là (L-local): đã verify bằng `dotnet build` (NSwag tự regenerate `wwwroot/api/specification.json` + `web-api-client.ts`), chưa verify qua live Swagger server. Cần re-verify qua live Swagger sau khi backend deploy lên dev/test trước khi coi là (L) chính thức.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| PUT | `/api/v1/merchant/business/info` | Bearer (Merchant) | `{ name, phone?, feedbackEmail?, website?, bookingNotificationPhone? }` (field `bookingNotificationPhone` mới thêm, maxLength 50) | `200 boolean` | L-local |
| GET | `/api/v1/merchant/business` | Bearer (Merchant) | — | `200 BusinessDto` (nay có thêm `bookingNotificationPhone`) | L-local |
| GET | `/api/v1/merchant/settings/business-hours` | Bearer (Merchant) | — | `200 PosBusinessOperatingHourDto[]` — 7 phần tử `{ dayOfWeek, isOpen, openTime, closeTime }`, ngày chưa set trả `isOpen:false, openTime:null, closeTime:null` | L-local |
| PUT | `/api/v1/merchant/settings/business-hours` | Bearer (Merchant) | `{ days: [{ dayOfWeek, isOpen, openTime?, closeTime? }] }` — không trùng `dayOfWeek`, nếu `isOpen=true` bắt buộc `closeTime > openTime` (400 nếu sai, error code `POS_OPERATING_HOUR_DUPLICATE_DAY` / `POS_OPERATING_HOUR_INVALID_TIME_RANGE`) | `200 boolean` | L-local |

**Điểm đã xác nhận qua `specification.json` vừa regenerate (local build, chưa phải live Swagger):**
- `dayOfWeek`: string enum `"Sunday"|"Monday"|...|"Saturday"` (không phải số 0-6).
- `openTime`/`closeTime`: string, `format: "time"` (tương ứng `TimeOnly`, dạng `"HH:mm:ss"`), nullable.
- `bookingNotificationPhone`: string, nullable, camelCase — có trên cả `UpdateBusinessInfoCommand` request và `BusinessDto` response.
- `UpdateBusinessHoursCommand` request body: `{ "days": PosBusinessOperatingHourEntry[] }` — không phải mảng trần ở root.

**Còn lại cần xác nhận khi integrate:** endpoint thật sự go-live ở domain nào (dev vs test) khi FE integrate — dùng `VITE_API_BASE_URL` hiện tại, không hardcode. Re-verify lại qua live Swagger sau khi BE deploy (contract có thể lệch nếu BE đổi trước khi deploy).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/settings/tabs/ProfileTab.tsx` | Thêm field "Booking Notification Phone" vào card Business Information (edit + view mode); thêm card/section mới "Business Hours" (7 dòng ngày, toggle Open/Closed + input giờ) |
| Component | `src/components/settings/hooks/useSettingsForm.ts` | Thêm state `bookingNotificationPhone` vào `businessForm`; thêm state cho business-hours form (7 ngày) + validate function kiểu `validateBusinessHours` |
| Data hook | `src/data/hooks/useMerchantSetup.ts` (hoặc file mới `useBusinessHours.ts`) | `useBusinessHours()` (query), `useUpdateBusinessHours()` (mutation) — query key `qk.merchantBusinessHours()`; `useUpdateBusinessInfo()` không đổi shape, chỉ thêm field vào payload |
| Repository | `src/data/repositories/merchants.ts` | `updateBusinessInfo(dto)` thêm field `bookingNotificationPhone`; thêm `getBusinessHours()` / `updateBusinessHours(days)` gọi `GET/PUT /api/v1/merchant/settings/business-hours` |
| Types | `src/types/repositories.ts`, `src/types/domain.ts` | Thêm `bookingNotificationPhone` vào `BusinessApiDto`; thêm `BusinessHourApiDto`/`BusinessHourEntry` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Key mới dưới `components.settings.tabs.ProfileTab.*` (bookingNotificationPhone, businessHours.*, validation.*) |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantSetup()`, `qk.merchantBusinessHours()`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Amendment (2026-07-14, sau khi review) — POS sidebar group

TL yêu cầu: Business Hours **chuyển hẳn ra khỏi** Settings > Profile, sống trong 1 group sidebar mới "POS" (mirror pattern của "Tax IQ" — `children` trong `MENU_ITEMS`, real nested routes `/dashboard/pos/*`, không phải `?tab=`). Đồng thời card "Business Information" (name/phone/email/website/bookingNotificationPhone) được **tái sử dụng** (không duplicate logic) ở cả Settings > Profile (giữ nguyên) và POS > General Settings (mới).

Thay đổi so với FE Surface ban đầu:
- `ProfileTab.tsx` không còn card Business Hours; card Business Information được extract thành `src/components/settings/BusinessInfoCard.tsx` (props-driven, dùng lại ở cả 2 nơi).
- State/logic của Business Information tách thành `src/components/settings/hooks/useBusinessInfoForm.ts` (self-contained: tự gọi `useMerchantSetup`/`useUpdateBusinessInfo`/`useVerifiedStatus` nội bộ qua param `setupData`/`verificationStatus`); `useSettingsForm.ts` giờ delegate qua hook này thay vì tự giữ state, tránh 2 nguồn logic song song.
- Business Hours state/logic chuyển hẳn sang `src/components/dashboard/views/pos/hooks/useBusinessHoursForm.ts` — không còn trong `useSettingsForm.ts`.
- 2 view mới: `src/components/dashboard/views/pos/PosGeneralSettingsView.tsx` (route `/dashboard/pos`, mirror "onboarding" của taxiq — không có segment riêng) và `PosBusinessHoursView.tsx` (route `/dashboard/pos/business-hours`).
- Sidebar: `constants.tsx` thêm `pos` entry (icon `Store`) + `POS_SUBMENU` export; `DashboardSidebar.tsx` thêm `isPosExpanded`/`activePosSubTab` + submenu render, mirror hệt pattern `taxiq`.
- i18n: `dashboard.menu.pos`, `dashboard.menu.pos_settings`, `dashboard.menu.pos_business_hours`, `components.dashboard.views.pos.{PosGeneralSettingsView,PosBusinessHoursView}.description`.
- Chưa tạo OpenSpec change riêng cho phần navigation này (đổi ≥3 file, đúng ra cần theo CLAUDE.md) — quyết định bỏ qua ceremony vì đây không phải API-integration mới (tái dùng contract US-014 sẵn có), rủi ro thấp, và TL đang trực tiếp review real-time. Ghi nhận đây là deviation có chủ đích, không phải bỏ sót.
- Verify: `npx tsc --noEmit` (diff 0 dòng lỗi mới so với baseline) + `npx vite build` build thành công.

**Lưu ý cho các ticket POS sau (Categories/Services/Products/Roles/Staff)**: thêm sub-item mới vào `POS_SUBMENU` (trong `constants.tsx`) + 1 route wrapper trong `routes/index.tsx` + 1 `<Route path="pos/...">` trong `AppRouter.tsx` — không cần đụng lại `DashboardSidebar.tsx` (logic submenu đã generic hoá qua `POS_SUBMENU.map(...)`).

## Ghi chú phiên thực thi

- Backend cho story này được implement cùng session (2026-07-14) tại `vlink-nexora/backend` — xem `UpdateBusinessInfoCommand.cs`, `BusinessDto.cs`, `Features/Pos/BusinessHours/{Commands/UpdateBusinessHours,Queries/GetBusinessHours}`, `MerchantSettingsController.cs`. Migration đã áp dụng vào DB dev local, chưa deploy lên môi trường dev/test server.
- Chưa verify contract qua live Swagger (`test-api.nexoratouch.com`) vì BE chưa deploy — sẽ cần re-check `web-api-client.ts`/spec sau khi deploy trước khi đánh dấu Tested.
- **FE code đã integrate xong (2026-07-14)**: tất cả layer trong FE Surface đã implement đúng như liệt kê. Verify đã chạy được:
  - `npx tsc --noEmit`: so sánh trước/sau bằng git stash — 123 lỗi TS giống hệt nhau trước và sau (toàn bộ là lỗi có sẵn trong repo, không có lỗi mới phát sinh từ thay đổi của story này).
  - `npx vite build --mode production`: build thành công, không lỗi.
  - `node scripts/verify-tokens.cjs`: script này không tồn tại trong checkout hiện tại (path trong CLAUDE.md có thể đã lỗi thời) — bỏ qua bước này.
- **Chưa làm được** (do backend chưa deploy lên dev/test server, chỉ chạy local): AC trên môi trường dev với API thật, verify network trace, test 3-layer (feature-focused-tester). Cần một phiên riêng để deploy BE rồi chạy lại các bước này trước khi chuyển status sang Tested/Done.
- 1 dòng thời gian mở cửa/đóng cửa dùng `<input type="time">` (HH:mm) ở FE, convert sang "HH:mm:ss" khi gửi API và ngược lại khi hiển thị — xem `toApiTime`/`fromApiTime` trong `useSettingsForm.ts`.
