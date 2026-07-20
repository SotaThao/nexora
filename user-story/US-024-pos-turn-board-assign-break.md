# US-024 · POS Front Desk — Turn Board: Assign & Break (shared Owner/Staff screen)

> File: `US-024-pos-turn-board-assign-break.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-20 |
| **Epic / Domain** | POS Merchant Ops — Front Desk (Check-in queue / Turn Board / Checkout) |
| **OpenSpec change** | `—` (tái sử dụng 100% pattern `PosFrontDeskView`/data-boundary đã có từ US-023 — cùng lý do bỏ qua ceremony) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Chủ salon (Owner) hoặc Lễ tân/Quản lý ca (Staff có quyền `Operations`),
**tôi muốn** thấy ngay thợ nào đang trống trên Turn Board để gán khách (từ Waitlist hoặc chọn đúng trạm), và cho thợ vào/ra giờ nghỉ,
**để** không phải hỏi miệng ai đang rảnh, và kiểm soát được lúc nào thợ nghỉ.

Nguồn: `docs/plan/tasks/pos/US-13-pos-turn-board-assign-break.md` (backend repo `vlink-nexora`), backend implement cùng session 2026-07-20.

**Quyết định thiết kế giữ nguyên từ US-023**: Owner và Staff dùng chung `PosFrontDeskView` (nhận `businessId` qua prop). Turn Board là tab thứ 2 trong cùng component, thay thế `ComingSoonPanel` cũ.

**Cắt giảm phạm vi có chủ đích (khác BA doc):**
- **Không có thanh tiến độ ca theo %** (BA doc mô tả "10:05 → 11:20, 75%") — `GetTurnBoardQuery` (BE) không trả thời lượng dịch vụ dự kiến, chỉ có `assignedAt`, nên FE không có dữ liệu để tính %. Hiển thị thay thế: "Serving since HH:MM" (giờ bắt đầu thực), không suy diễn con số phần trăm không có nguồn.
- **Nút `Checkout` trên trạm `InService` hiển thị nhưng disabled** (tooltip "Checkout is coming soon") — backend Checkout (US-14) chưa tồn tại. Theo đúng nguyên tắc "hiện locked UI, không ẩn tính năng" của CLAUDE.md (áp dụng tương tự cho tính năng chưa build, không chỉ gói cước).
- **Nút Start/End break** đặt ở trạm `Empty`/`Break` (không có trong mô tả CTA chính của BA doc nhưng bắt buộc phải có UI nào đó để kích hoạt — suy luận hợp lý vì AC yêu cầu "cho thợ vào/ra giờ nghỉ").

## Acceptance Criteria

- **Given** Owner/Staff (có quyền `Operations`) mở tab `Turn Board`
- **When** tab load
- **Then** FE gọi `GET /api/v1/merchant/pos/{businessId}/turn-board` (poll 15s); hiện 1 card/trạm, sắp xếp theo `displayName`; card `Empty` có picker chọn khách đang chờ + nút `+ Assign Guest`, card `InService` hiện tên khách/dịch vụ chính/giờ bắt đầu + nút `Checkout` (disabled), card `Break` hiện badge "On break" + nút `End break`

- **Given** trạm đang `Empty` và có ít nhất 1 khách trong Waitlist
- **When** chọn 1 khách trong picker rồi bấm `+ Assign Guest`
- **Then** FE gọi `POST /api/v1/merchant/pos/{businessId}/tickets/{ticketId}/assign` với `{ posStaffProfileId }`; 200 → invalidate cả `merchantPosWaitlist` và `merchantPosTurnBoard`, trạm chuyển `InService`, khách biến mất khỏi Waitlist

- **Given** đang ở tab `Check-in queue`, 1 dòng Waitlist
- **When** bấm nút `Assign` trên dòng đó (không chọn trạm cụ thể)
- **Then** FE gọi `POST .../tickets/{ticketId}/assign` với `{ posStaffProfileId: undefined }` (BE tự chọn trạm `Empty` đầu tiên); 200 → cùng hiệu ứng invalidate như trên

- **Given** trạm đang `Empty`
- **When** bấm `Start break`
- **Then** FE gọi `PUT .../turn-board/{posStaffProfileId}/break-status` với `{ isBreak: true }`; 200 → invalidate `merchantPosTurnBoard`, card chuyển badge "On break"

- **Given** trạm đang `Break`
- **When** bấm `End break`
- **Then** FE gọi `PUT .../break-status` với `{ isBreak: false }`; 200 → trạm về `Empty`

- **Given** action Assign/Break trả lỗi 400 (`STATION_NOT_EMPTY`/`TICKET_NOT_WAITING_FOR_ASSIGN`/`STAFF_ALREADY_IN_BREAK`/`STAFF_NOT_IN_BREAK`)
- **When** lỗi xảy ra (vd. 2 lễ tân bấm Assign cùng lúc vào cùng 1 trạm)
- **Then** hiện toast lỗi (fallback `errors.unknown_error` vì 4 code mới này chưa có trong `errorCodeToI18nKey` — xem Ghi chú phiên thực thi), không đổi UI local tới khi data thật refetch

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở backend repo — chưa deploy, tag (L-local).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/{businessId}/turn-board` | Bearer (Owner hoặc Staff có `Operations`) | — | `200 [{ posStaffProfileId, displayName, photoUrl?, currentStatus, currentTicketId?, currentCustomerName?, currentPrimaryServiceName?, assignedAt? }]` | L-local |
| POST | `/api/v1/merchant/pos/{businessId}/tickets/{ticketId}/assign` | Bearer | `{ posStaffProfileId?: string }` | `200 boolean` | L-local |
| PUT | `/api/v1/merchant/pos/{businessId}/turn-board/{posStaffProfileId}/break-status` | Bearer | `{ isBreak: boolean }` | `200 boolean` | L-local |

**Còn lại cần xác nhận khi integrate:** re-verify qua live Swagger sau khi BE deploy. `currentStatus` là string enum (`"Empty"`/`"InService"`/`"Break"`) từ `PosStationStatus.ToString()` — không phải số.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Types | `src/types/repositories.ts` | `TurnBoardStationApiDto` (mới) |
| Repository | `src/data/repositories/posTurnBoard.ts` (mới) | `getTurnBoard`, `setStaffBreakStatus` |
| Repository | `src/data/repositories/posTickets.ts` | thêm `assignTicketToStation(businessId, ticketId, posStaffProfileId?)` |
| Data hook | `src/data/hooks/usePosTurnBoard.ts` (mới) | `useTurnBoard` (poll 15s), `useSetStaffBreakStatus` — invalidate `merchantPosTurnBoard` |
| Data hook | `src/data/hooks/usePosTickets.ts` | thêm `useAssignTicketToStation` — invalidate cả `merchantPosWaitlist` + `merchantPosTurnBoard` |
| Query keys | `src/data/queryKeys.ts` | `merchantPosTurnBoard(businessId)` |
| Component (shared) | `src/components/dashboard/views/pos/PosFrontDeskView.tsx` | Thay `ComingSoonPanel` của tab `turnboard` bằng board thật; thêm nút `Assign` vào mỗi dòng Waitlist |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm key mới dưới `components.dashboard.views.pos.PosFrontDeskView.*`, xoá `turnBoardComingSoon` (không còn dùng) |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`merchantPosWaitlist`, `merchantPosTurnBoard`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **4 error code mới của US-13 (`STATION_NOT_EMPTY`, `TICKET_NOT_WAITING_FOR_ASSIGN`, `STAFF_ALREADY_IN_BREAK`, `STAFF_NOT_IN_BREAK`) không được thêm vào `errorCodeToI18nKey`** — nhất quán với việc US-023 cũng không map các `POS_TICKET_*` code (fallback `errors.unknown_error`). Nếu sau này cần thông báo lỗi rõ ràng hơn cho 2 ticket này, phải bổ sung cả 2 file cùng lúc (backend đã đặt tên code không có prefix `POS_`, khác với phần còn lại của `DomainErrorCode.Pos`).
- **Không dựng thanh tiến độ % ca làm việc** như BA doc mô tả — API không trả thời lượng dịch vụ dự kiến (`PosService.DurationMinutes` không có trong `TurnBoardStationDto`). Hiển thị "Serving since HH:MM" thay thế; nếu sau này cần đúng UI progress-bar, phải bổ sung field ở BE trước (ngoài phạm vi ticket này).
- **Nút `Checkout` trên card `InService` render disabled** (chưa có US-14) thay vì ẩn hẳn — theo tinh thần "locked UI, không ẩn tính năng" áp dụng tương tự nguyên tắc gói cước trong CLAUDE.md.
- Verify: `npx tsc --noEmit` — 105 dòng lỗi, giống hệt baseline trước khi sửa (đối chiếu US-023, không có lỗi mới từ các file đã đụng) + `npx vite build --mode production` — build thành công, chỉ warning chunk-size có sẵn không liên quan.
- Chưa làm được (backend chưa deploy lên dev/test server): AC trên môi trường dev với API thật, verify network trace, test 3-layer, click-through thật trên browser. Riêng US-024 còn chưa xác nhận: hành vi picker chọn khách trên card `Empty` khi Waitlist có nhiều khách (mới verify qua đọc code, chưa qua browser thật).
