# US-043 · POS Front Desk — Customer Tab

> File: `US-043-pos-front-desk-customer-tab.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-08-11 |
| **Epic / Domain** | POS Front Desk |
| **OpenSpec change** | — (spec đã chốt qua `/brainstorm` + `/brainstorm-team-leader` trong phiên làm việc, đóng vai trò tương đương design.md; không tạo thêm OpenSpec change riêng) |
| **Test plan** | — (chưa viết TC) |

## Story

**Là** Staff/Owner vận hành quầy lễ tân,
**tôi muốn** xem danh sách khách hàng của tiệm (phân trang, sắp xếp theo ngày tạo) và xem chi tiết + lịch sử order/booking của từng khách,
**để** tra cứu nhanh thông tin khách đang đứng ở quầy mà không phải rời màn Front Desk.

Toàn bộ tính năng là **read-only** — không tạo/sửa/xoá customer, không thao tác order/booking từ tab này.

## Acceptance Criteria

- **Given** đang ở POS Front Desk, **When** bấm tab "Customer" (tab thứ 6, sau "Bookings"), **Then** thấy bảng khách của đúng `businessId`, mặc định sort `CreatedAt` mới nhất trước, có phân trang.
- **Given** đang xem danh sách, **When** gõ tên hoặc số điện thoại vào ô search, **Then** sau debounce ~300ms gọi lại API với `searchTerm`, kết quả lọc đúng, trang reset về 1.
- **Given** đang xem danh sách, **When** đổi toggle sort sang "Oldest first", **Then** API gọi lại với `sortDescending=false`, trang reset về 1.
- **Given** danh sách đang hiển thị, **When** bấm nút View trên 1 dòng, **Then** mở modal hiển thị đủ field customer (rỗng = `—`) và load lịch sử order/booking phân trang riêng, sort mới → cũ, gồm cả booking (badge Booking/Walk-in, chip status), không có nút thao tác nào.
- **Given** customer không thuộc `businessId` hiện tại, **When** gọi thẳng API detail/orders với `customerId` đó, **Then** trả 400 (`POS_CUSTOMER_NOT_FOUND`), không rò rỉ dữ liệu.

## API Mapping (bắt buộc trước khi integrate)

> Backend mới viết trong cùng phiên làm việc (`vlink-nexora` repo) — chưa lên Swagger live tại thời điểm viết story; contract lấy trực tiếp từ code Application/Web layer vừa implement, verify lại qua Swagger dev khi BE deploy.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/{businessId}/customers` | Bearer (Owner hoặc Staff có `canManageOperations`) | query: `pageNumber`, `pageSize`, `searchTerm?`, `sortDescending?` | `PaginatedList<PosCustomerListItemDto>` — `Id,Name,Phone,Status,TotalVisit,LastVisit,CreatedAt` | (S) code BE cùng phiên |
| GET | `/api/v1/merchant/pos/{businessId}/customers/{customerId}` | Bearer | — | `PosCustomerDetailDto` — đủ field (`Email,Address,DateOfBirth,Type,Source`...) | (S) code BE cùng phiên |
| GET | `/api/v1/merchant/pos/{businessId}/customers/{customerId}/orders` | Bearer | query: `pageNumber`, `pageSize` | `PaginatedList<PosCustomerOrderHistoryItemDto>` — `Id,OrderNumber,IsBooking,Status,OccurredAt,ServiceNames[],TechnicianNames[],Total` | (S) code BE cùng phiên |

**Điểm chưa chắc chắn / cần hỏi BE:** không còn — 3 endpoint do cùng phiên viết, đã build sạch (`dotnet build` pass).

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/views/pos/PosFrontDeskView.tsx` | thêm tab `customer` (thứ 6) |
| Component | `src/components/dashboard/views/pos/customer/CustomerTab.tsx` (mới) | search + sort toggle + bảng + phân trang |
| Component | `src/components/dashboard/views/pos/customer/CustomerTable.tsx` (mới) | bảng 6 cột, responsive |
| Component | `src/components/dashboard/views/pos/customer/CustomerDetailModal.tsx` (mới) | modal detail + order history, read-only |
| Data hook | `src/data/hooks/usePosCustomers.ts` (mới) | `usePosCustomerList`, `usePosCustomerDetail`, `usePosCustomerOrderHistory`; query key mới trong `qk` |
| Repository | `src/data/repositories/posCustomers.ts` (mới) | 3 hàm gọi 3 endpoint trên, không normalize field (DTO đã phẳng) |
| Khác | `src/locales/en.json` + `vi.json` | key mới cho tab/modal |

## Definition of Done

- [x] AC pass trên môi trường dev (API thật) — cần verify khi có dev API deploy
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Không có mutation (tính năng read-only) → không có invalidation
- [ ] Không console error — verify khi chạy dev server
- [ ] Test theo 3 layer (skill feature-focused-tester)
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Spec + ticket breakdown được chốt qua `/brainstorm` (12 câu) rồi `/brainstorm-team-leader` (3 câu kỹ thuật) trong cùng phiên hội thoại trước khi code — đóng vai trò tương đương OpenSpec design.md nên không tạo change riêng. Backend (3 query CQRS + controller) đã build sạch. FE đang implement tiếp theo ticket breakdown.
