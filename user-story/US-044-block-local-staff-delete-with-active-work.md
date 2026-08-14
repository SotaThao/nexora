# US-044 · Chặn xoá local staff khi còn order/booking chưa đóng

| | |
|---|---|
| **Trạng thái** | Tested |
| **Ngày tạo** | 2026-08-13 |
| **Epic / Domain** | Staff Management (Merchant) |
| **OpenSpec change** | — (fix nhỏ, 1 owner: staff management) |
| **Test plan** | (chưa viết) |

## Story

**Là** Business Owner,
**tôi muốn** hệ thống chặn không cho xoá một local staff khi họ vẫn đang được gán vào order/booking chưa kết thúc, và chỉ rõ những mục nào đang chặn,
**để** tôi xử lý dứt điểm các mục đó trước, tránh tình trạng order/booking cũ mất tên kỹ thuật viên sau khi xoá.

## Bối cảnh kỹ thuật

`StaffProfile` có global query filter `DeletedAt == null`. Xoá staff là **soft delete**, trong khi mọi `PosOrderItem` trỏ tới họ vẫn được giữ nguyên (FK `Restrict` cố tình bảo toàn lịch sử order). Hệ quả: sau khi xoá, tên kỹ thuật viên trên các record đó bị blank (hoặc hiện `(Deleted staff)` sau bản vá cùng ngày). Chặn ở bước xoá là cách xử lý gốc.

## Acceptance Criteria

- **Given** local staff không được gán vào order/booking nào ở trạng thái Waiting/InService/Pending/Confirmed
- **When** Owner bấm xoá và xác nhận
- **Then** `DELETE /api/v1/merchant/local-staff/{id}` trả `204`, toast success, danh sách staff refresh

- **Given** local staff còn ≥1 order/booking ở một trong 4 trạng thái trên (không phân biệt ngày giờ — mục quá hạn vẫn tính là đang mở)
- **When** Owner bấm xoá và xác nhận
- **Then** API trả `400` `LOCAL_STAFF_HAS_ACTIVE_WORK`, **không** hiện toast lỗi, mà mở `StaffActiveWorkModal`; modal gọi `GET .../active-work` và liệt kê từng mục (mã order hoặc nhãn Booking, tên khách, trạng thái, thời điểm); staff **không** bị xoá

- **Given** modal đang mở và Owner đã xử lý xong các mục ở tab khác
- **When** Owner đóng modal và bấm xoá lại
- **Then** xoá thành công (BE kiểm tra lại tại thời điểm xoá, không tin cache của modal)

- **Given** lỗi `LOCAL_STAFF_HAS_ACTIVE_WORK` phát sinh từ nơi khác không có modal
- **Then** fallback về toast dùng key `errors.local_staff_has_active_work`

## API Mapping

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/local-staff/{staffProfileId}/active-work` | Bearer (Merchant) | — | `200` `LocalStaffActiveWorkItemDto[]` | (S) mới thêm ở BE cùng phiên |
| DELETE | `/api/v1/merchant/local-staff/{staffProfileId}` | Bearer (Merchant) | — | `204` / `400` `LOCAL_STAFF_HAS_ACTIVE_WORK` | (S) |

`LocalStaffActiveWorkItemDto`: `orderId`, `orderNumber`, `customerName`, `status` (PosOrderStatus), `isBooking`, `scheduledAt` (chỉ khi `isBooking`), `source` (PosBookingSource, chỉ khi `isBooking`), `checkedInAt`.

**Điểm cần lưu ý:** `scheduledAt` có ngữ nghĩa tách đôi theo `source` (Voice = UTC thật, Staff/Public = naive wall-clock) — đó là lý do BE phải trả kèm `source`; FE đọc qua `formatBookingWallClock(iso, source)`, còn `checkedInAt` là UTC thật nên đi qua `formatPosDateTime`.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/dashboard/modals/StaffActiveWorkModal.tsx` | **Mới** — dialog liệt kê, read-only |
| Component | `src/components/Dashboard.tsx` | Mount modal theo `activeWorkBlocker` |
| Feature hook | `src/components/dashboard/hooks/useStaffManagement.ts` | `onError` của delete bắt error code → mở modal thay vì toast; expose `activeWorkBlocker`/`setActiveWorkBlocker` |
| Data hook | `src/data/hooks/useLocalStaff.ts` | `useLocalStaffActiveWork` — query key `qk.localStaffActiveWork(staffProfileId)`, `enabled` khi có id; không mutation nên không invalidate |
| Repository | `src/data/repositories/localStaff.ts` | `getActiveWork` + `normalizeLocalStaffActiveWork` (nơi duy nhất chạm literal status thô, cast sang `PosOrderStatus`) |
| Query keys | `src/data/queryKeys.ts` | `localStaffActiveWork` — prefix `merchantStaff` để invalidate chung |
| Types | `src/types/repositories.ts` | `LocalStaffActiveWorkItem` |
| Error codes | `src/data/errorCodes.ts` | export `LOCAL_STAFF_HAS_ACTIVE_WORK` + map i18n fallback |
| i18n | `src/locales/en.json`, `vi.json` | `errors.local_staff_has_active_work`, `components.dashboard.modals.StaffActiveWorkModal.*` |

## Definition of Done

- [x] Không phát sinh lỗi typecheck mới (baseline 58 lỗi pre-existing, sau thay đổi vẫn 58)
- [x] `pnpm build` pass (sau khi sửa alias vite, xem ghi chú)
- [x] `pnpm test` pass (18/18)
- [x] AC pass trên backend local (Playwright, 2026-08-13) — xem "Kết quả test live"
- [x] API call đúng contract (verify bằng network trace)
- [x] Không console error ngoài chính cái `400` mong đợi từ DELETE
- [ ] Test 3 layer (vitest) — **chưa viết**

## Kết quả test live (Playwright, backend local `https://localhost:5005`, DB `nexora-staging`)

Fixture: business "Quân PM", local staff **Helen** (1 order `A001` `InService`) và **Kim Nguyen** (0 mục đang mở).

| Nhánh | Kết quả |
|---|---|
| Xoá Helen (có việc đang mở) | `DELETE` → `400`, tiếp theo `GET .../active-work` → `200`. Modal "Cannot delete Helen" liệt kê `#A001` / In Service / thời điểm. DB: `DeletedAt` vẫn NULL, link vẫn `Active` → không ghi dở dang |
| Xoá Kim Nguyen (không có việc mở) | `DELETE` → `204`, không modal, dòng biến mất khỏi bảng, không console error mới |
| Response body | `{"orderId":"...","orderNumber":"A001","customerName":"","status":"InService","isBooking":false,"scheduledAt":null,"source":null,"checkedInAt":"2026-08-13T02:41:52.747533Z"}` — `checkedInAt` có hậu tố `Z` đúng như `SpecifyKind(Utc)` |
| Mobile 375×667 | Card fit trong viewport, `max-height` 600.3px (=90dvh), flex column, body có scroller riêng, trang không scroll ngang |
| Mobile ép 375×240 | Card vẫn fit (top 12 / bottom 228), body tràn và tự scroll bên trong (`scrollHeight` 69 > `clientHeight` 2), nút Close vẫn nằm trong viewport |
| Tiếng Việt | "Không thể xoá Helen" + mô tả render đúng từ `vi.json` |
| Nhánh booking (2 booking chèn thêm cho Helen) | Modal liệt kê đủ 3 mục: `#A001 / In Service`, `Booking / Confirmed / Test Staff Booking · Aug 20, 2026 2:30 PM`, `Booking / Pending / Test Voice Booking · Aug 21, 2026 4:15 PM` |
| Mobile 375×400 với 3 mục (tràn thật) | Card fit viewport (cao 360), list tràn và tự scroll (`scrollHeight` 223 > `clientHeight` 146), header/footer ghim trong viewport, không scroll ngang |

### Chứng minh vì sao BE phải trả kèm `Source`

| Booking | `scheduledAt` API trả | UTC thật | Hiển thị | Đường đọc |
|---|---|---|---|---|
| B900 `Source=Staff` | `2026-08-20T21:30:00+07:00` | 14:30 | 2:30 PM | UTC getters (naive wall-clock) |
| B901 `Source=Voice` | `2026-08-21T16:15:00+07:00` | 09:15 | 4:15 PM | quy đổi sang local (UTC+7) |

Hai nhánh rẽ khác nhau thật. Nếu bỏ `Source` (mọi booking rơi vào đường Staff/UTC-getter), B901 sẽ hiện "9:15 AM" — lệch 7 tiếng so với giờ AI Hub hiển thị cho cùng cuộc hẹn.

**Bug phát hiện & đã sửa trong lúc test:** order có `CustomerName` rỗng làm dòng meta render thành `· Aug 13, 2026 09:41 AM` (thừa dấu phân cách đầu dòng). Đổi sang `[customerName, when].filter(Boolean).join(' · ')`, verify lại đã hết.

**Sự cố khi test — đã ghi lại để không lặp:** giữa phiên tôi xoá `.env.development.local` (file override trỏ FE về backend local) như bước dọn dẹp, nhưng chưa test xong. Vite theo dõi file env nên reload và quay về `.env.development` (đang trỏ `staging-api.nexoratouch.com`). Thao tác xoá staff tiếp theo vì thế bắn `DELETE` lên **staging** và trả `204` (staging chưa deploy guard) → soft-delete staff `14e583c0-...` trên môi trường dùng chung. Chỉ đúng 1 request ghi chạm staging, 20 request còn lại đều là `GET`. Cần restore thủ công trên DB staging: `UPDATE "StaffProfiles" SET "DeletedAt"=NULL WHERE "Id"='14e583c0-a29b-4a3c-8d86-b25e0afafc96'` + `UPDATE "BusinessStaffLinks" SET "Status"='Active' WHERE "StaffProfileId"='14e583c0-...' AND "BusinessId"='c1642c6b-...'`. **Bài học: chỉ gỡ env override sau khi kết thúc hoàn toàn, và verify URL trong network trace trước mỗi thao tác ghi.**

**Không tạo được staff tạm để test happy path** vì business đã chạm giới hạn 5 staff của gói Lite (`STAFF_LIMIT_REACHED`) — nên đã xoá Kim Nguyen rồi khôi phục nguyên trạng bằng SQL (`DeletedAt=NULL`, link `Status='Active'`). Đã verify DB về đúng trạng thái ban đầu (20 local staff active, cả Helen lẫn Kim Nguyen nguyên vẹn).

## Ghi chú phiên thực thi

- **`pnpm build` đã hỏng sẵn từ trước, không liên quan story này — đã sửa trong cùng phiên.** Rollup không resolve được `@/components/CountryCodeSelect` import từ `src/components/dashboard/views/pos/customer/customerFormatters.ts` (US-043). Nguyên nhân gốc: alias `@/*` chỉ khai báo trong `tsconfig.json`, `vite.config.ts` không có — nên `tsc` pass còn `vite build` fail. Đã verify là pre-existing bằng cách stash toàn bộ thay đổi của story này rồi build lại (fail y hệt). Fix: thêm entry `@/` vào `resolve.alias` trong `vite.config.ts` — sửa ở gốc thay vì đổi 1 import thành đường dẫn tương đối, để alias đã ghi trong CLAUDE.md/tsconfig hoạt động thật và không tái diễn.
- `pnpm lint:tokens` và `pnpm test:e2e` **không chạy được**: cả thư mục `scripts/` không tồn tại (`verify-tokens.cjs`, `run-e2e.cjs` chưa từng có trong git history) — pre-existing, ngoài phạm vi story này.
- BE kiểm tra lại danh sách chặn ngay trong `DeleteLocalStaffCommand` (dùng chung `LocalStaffActiveWorkResolver` với endpoint GET), nên không có khe TOCTOU giữa lúc modal fetch và lúc bấm xoá lại.
- Quyết định sản phẩm đã chốt: mục quá hạn nhưng chưa đóng (Pending/Confirmed mà `ScheduledAt` đã qua) **vẫn tính là đang mở** và vẫn chặn — data rác kiểu đó chính là thứ nên được dọn.
