# US-023 · POS Front Desk — Check-in Queue & Waitlist (shared Owner/Staff screen)

> File: `US-023-pos-front-desk-checkin-waitlist.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-20 |
| **Epic / Domain** | POS Merchant Ops — Front Desk (Check-in queue / Turn Board / Checkout) |
| **OpenSpec change** | `—` (≥3 file nhưng tái sử dụng 100% pattern POS đã có — Owner routes/PosCategoriesView style — quyết định bỏ qua ceremony, giống deviation đã ghi ở US-014) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Chủ salon (Owner) hoặc Lễ tân/Quản lý ca (Staff có quyền `Operations`),
**tôi muốn** check-in khách vào hàng đợi, xem danh sách đang chờ theo thứ tự tới trước, và gỡ khách bỏ về,
**để** không bỏ sót khách và biết ai đang chờ lâu nhất.

Nguồn: `docs/plan/tasks/pos/US-12-pos-checkin-waitlist.md` (backend repo `vlink-nexora`), backend implement cùng session 2026-07-20.

**Quyết định thiết kế đã chốt với TL**: Owner và Staff dùng **chung 1 component màn hình** (`PosFrontDeskView`, nhận `businessId` qua prop). Không tách UI riêng theo 2 dashboard shell (`Dashboard` Owner vs `StaffDashboard` Staff). Với Staff, nếu không có quyền `Operations` cho business đó, điểm truy cập (menu/link) tự ẩn — không hiện màn hình rồi báo lỗi.

## Acceptance Criteria

- **Given** Owner mở POS > Front Desk từ sidebar
- **When** màn hình load
- **Then** FE gọi `GET /api/v1/merchant/pos/{businessId}/access` (luôn `canManageOperations: true` cho Owner) rồi `GET .../tickets/waitlist`; hiện tab `Check-in queue` mặc định, 2 tab `Turn Board`/`Checkout` hiện "Coming soon" (chưa có backend, thuộc US-13/14)

- **Given** Owner điền tên khách (+ email/phone/dịch vụ tuỳ chọn) và bấm Check-in
- **When** submit
- **Then** FE gọi `POST /api/v1/merchant/pos/{businessId}/tickets`; 201 → thêm vào bảng waitlist ngay (invalidate query), hiện đúng `ticketNumber` do BE sinh

- **Given** Owner bấm Cancel trên 1 dòng trong waitlist
- **When** confirm
- **Then** FE gọi `POST /api/v1/merchant/pos/{businessId}/tickets/{ticketId}/cancel`; 200 → dòng biến mất khỏi waitlist

- **Given** Staff mở "My Salons" ở StaffDashboard, danh sách salon đã link
- **When** salon đó Active VÀ Staff có quyền `Operations` cho salon đó (`GET .../access` trả `true`)
- **Then** bấm vào card salon điều hướng tới `/staff/salons/{businessId}/front-desk` (cùng component `PosFrontDeskView`) thay vì trang tip QR như hiện tại

- **Given** Staff mở "My Salons", salon Active nhưng KHÔNG có quyền `Operations`
- **When** bấm vào card salon
- **Then** giữ hành vi cũ (điều hướng `/staff/qr?tab=tipping`) — không đổi gì cho case này

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở backend repo — chưa deploy, tag (L-local).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/{businessId}/access` | Bearer (Owner hoặc Staff) | — | `200 { canManageOperations: boolean }` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/tickets` | Bearer | `{ customerName, customerEmail?, customerPhone?, posServiceIds? }` | `201 Guid` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/tickets/{ticketId}/cancel` | Bearer | — | `200 boolean` | L-local |
| GET | `/api/v1/merchant/pos/{businessId}/tickets/waitlist` | Bearer | — | `200 [{ id, ticketNumber, customerName, checkedInAt, waitMinutes, serviceNames[] }]` | L-local |

**Còn lại cần xác nhận khi integrate:** re-verify qua live Swagger sau khi BE deploy.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Types | `src/types/repositories.ts` | `PosAccessApiDto`, `PosTicketApiDto` (waitlist item), `CheckInTicketPayload` |
| Repository | `src/data/repositories/posAccess.ts` (mới) | `getMyPosAccess(businessId)` |
| Repository | `src/data/repositories/posTickets.ts` (mới) | `checkInTicket`, `cancelTicket`, `getWaitlist` — tất cả nhận `businessId` |
| Data hook | `src/data/hooks/usePosAccess.ts` (mới) | `usePosAccess(businessId)` |
| Data hook | `src/data/hooks/usePosTickets.ts` (mới) | `useWaitlist`, `useCheckInTicket`, `useCancelTicket` |
| Query keys | `src/data/queryKeys.ts` | `merchantPosAccess(businessId)`, `merchantPosWaitlist(businessId)` |
| Component (shared) | `src/components/dashboard/views/pos/PosFrontDeskView.tsx` (mới) | 3 tab (Check-in queue functional, Turn Board/Checkout coming-soon), form check-in + bảng waitlist + cancel; ẩn hết nếu `canManageOperations === false` |
| Owner nav/route | `src/components/dashboard/constants.tsx`, `routes/index.tsx`, `app/AppRouter.tsx` | Thêm submenu `board` (Front Desk) vào `POS_SUBMENU`, route `pos/board` |
| Staff route | `src/app/AppRouter.tsx` | Route mới `salons/:businessId/front-desk` → `StaffFrontDeskRoute` (đọc `businessId` từ `useParams`, render `PosFrontDeskView`) |
| Staff nav | `src/components/staff-dashboard/views/StaffMySalons.tsx` | `onOpen` kiểm tra `usePosAccess(business.businessId)` — điều hướng front-desk nếu có quyền, else giữ hành vi cũ |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Key mới `components.dashboard.views.pos.PosFrontDeskView.*`, `dashboard.menu.pos_board` |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`merchantPosWaitlist`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **Backend bổ sung cùng phiên (không có trong US-12 gốc)**: cần 1 endpoint mới `GET /api/v1/merchant/pos/{businessId}/access` (`PosAccessController.cs`, `GetMyPosAccessQuery`) trả `{ canManageOperations }` để FE biết trước có nên hiện màn hình/điểm truy cập hay không, thay vì chỉ dựa vào lỗi 403. Thêm `IPosOperationsAccessService.HasOperationsAccessAsync()` (non-throwing) song song với `AuthorizeBusinessAccessAsync()` đã có.
- **Không đưa chọn dịch vụ vào form check-in** (khác với FE Surface dự kiến ban đầu ngầm định theo BA doc "Dịch vụ yêu cầu") — `usePosServices()` hiện chỉ `enabled` cho `isOwner` (endpoint `GET /api/v1/merchant/pos/services` vẫn Owner-only ở backend), nên Staff không gọi được để hiện picker dịch vụ. Cắt giảm phạm vi: form check-in chỉ có tên/email/phone; chọn dịch vụ để lại cho lúc Checkout (`+ Add Service`, US-14) — tránh phải sửa luôn `PosServicesController` thành Owner-hoặc-Staff trong ticket này.
- **Tích hợp StaffDashboard**: sửa `StaffMySalons.tsx`'s `SalonCard` — gọi `usePosAccess(business.businessId)` (chỉ khi `linkStatus` Active) ngay trong card (không thể gọi hook trong `.map()` ở component cha, phải đưa vào từng `SalonCard` instance). Nếu `canManageOperations` true → bấm card điều hướng `/staff/salons/{businessId}/front-desk`; ngược lại giữ hành vi cũ (trang tip QR).
- Route mới: Owner `pos/board` (label "Front Desk", tự động render qua `POS_SUBMENU.map()` có sẵn — không cần sửa `DashboardSidebar.tsx`); Staff `salons/:businessId/front-desk` → `StaffFrontDesk.tsx` (wrapper đọc `useParams` rồi render `PosFrontDeskView` — cùng file component, không duplicate).
- Verify: `npx tsc --noEmit` (git-stash baseline diff, 105 dòng giống hệt nhau, chỉ khác line-number shift + "16 more"→"17 more" cosmetic ở các lỗi có sẵn không liên quan) + `npx vite build --mode production` (thành công, chỉ warning chunk-size có sẵn).
- Chưa làm được (backend chưa deploy lên dev/test server): AC trên môi trường dev với API thật, verify network trace, test 3-layer, mobile screenshot, click-through thật trên browser (chỉ verify qua build/typecheck).
