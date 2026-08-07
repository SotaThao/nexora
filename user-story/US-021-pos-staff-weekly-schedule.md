# US-021 · POS Staff Weekly Schedule (Owner Setup)

> File: `US-021-pos-staff-weekly-schedule.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-16 |
| **Epic / Domain** | POS Owner Setup — Setup Staff |
| **OpenSpec change** | `—` (thêm 1 section mới vào màn `PosStaffProfileView.tsx` đã có sẵn từ US-019/US-020, tách 1 component trình bày dùng chung mới (`WeeklyScheduleEditor.tsx`), không đụng shared layer auth/httpClient/context — cùng precedent OpenSpec-skip đã dùng ở US-014..US-020, dù thay đổi chạm ≥3 file) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** thiết lập lịch làm việc hàng tuần cho từng thợ — mặc định lấy theo giờ mở cửa salon — ngay trong màn hồ sơ POS của thợ đó,
**để** việc đặt lịch sau này phản ánh đúng thời gian thợ thực sự có mặt.

Nguồn: `docs/business/pos/POS-Owner-Setup-Business.md`, workflow "Setup Staff" (bước 7), Rule 6; ticket kỹ thuật `vlink-nexora/docs/plan/tasks/pos/US-09-pos-staff-weekly-schedule.md` (backend Tasks 9.1–9.2 đã implement xong ở `vlink-nexora/backend`, phiên trước cùng ngày).

**Quyết định thiết kế quan trọng đã có sẵn ở ticket BE**: lịch làm việc của thợ là **bản copy một lần** (seed-on-first-read) từ `PosBusinessOperatingHour` tại thời điểm lần đầu Owner mở màn lịch của thợ đó — **không phải tham chiếu sống**. Đổi giờ mở cửa salon sau đó không tự động đổi lịch thợ đã có. FE không cần tự làm gì đặc biệt cho phần seed này — chỉ cần gọi `GET` và hiển thị đúng những gì BE trả về (BE tự seed ngầm ở lần gọi đầu).

## Acceptance Criteria

- **Given** Owner đã chọn 1 staff trong picker của `PosStaffProfileView` và staff đó **đã từng lưu** POS profile (Role/Pay/Tips) ít nhất 1 lần (`profile.posRoleId` khác null — cùng điều kiện `hasSavedProfile` đã dùng cho section Service Assignment ở US-020)
- **When** section "Weekly Schedule" (thứ 4, dưới "Service Assignment") load
- **Then** FE gọi `GET /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/weekly-schedule`; hiển thị 7 dòng ngày (Sunday→Saturday theo `dayOfWeek` 0-6) với toggle Working/Day Off + giờ bắt đầu/kết thúc, khớp đúng response (kể cả lần đầu — BE tự seed từ business hours, FE chỉ hiển thị)

- **Given** staff đã chọn **chưa từng lưu** POS profile (`profile.posRoleId == null`)
- **When** Owner cuộn tới section "Weekly Schedule"
- **Then** section này hiển thị **disabled** kèm chú thích "Lưu Role, Pay & Tips trước" — không gọi `GET`/`PUT` weekly-schedule, cùng nguyên tắc "FE tự chặn UI trước" đã áp dụng ở US-020 cho Service Assignment

- **Given** Owner đang ở chế độ xem/sửa lịch, 1 ngày đang bật "Working"
- **When** Owner tắt toggle thành "Day Off"
- **Then** input giờ bắt đầu/kết thúc của ngày đó bị ẩn (thay bằng nhãn "Day Off"); giá trị giờ cũ vẫn giữ trong state FE cho tới khi Save (để không mất dữ liệu nếu Owner bật lại Working ngay sau đó), nhưng khi Save thì gửi `startTime`/`endTime` = `null` cho ngày đó

- **Given** Owner để 1 ngày ở "Working" nhưng bỏ trống giờ bắt đầu hoặc kết thúc, hoặc đặt giờ kết thúc ≤ giờ bắt đầu
- **When** Owner bấm "Save Schedule"
- **Then** FE validate client-side trước (Rule 6, giống `useBusinessHoursForm` của US-014): hiển thị lỗi ngay dưới dòng ngày đó (`required`/`invalidRange`), **không gọi API** cho tới khi tất cả ngày hợp lệ

- **Given** toàn bộ 7 ngày hợp lệ
- **When** Owner bấm "Save Schedule"
- **Then** FE gọi `PUT /api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/weekly-schedule` với `{ days: [...] }` — luôn gửi đủ 7 ngày (không gửi thiếu, vì BE sync theo đúng danh sách gửi lên và sẽ xoá ngày không có trong payload); API trả `200 true`; cache `merchantPosStaffWeeklySchedule(businessStaffLinkId)` invalidate; toast thành công

- **Given** API trả lỗi khi Save (`POS_STAFF_SCHEDULE_DUPLICATE_DAY`, `POS_STAFF_SCHEDULE_INVALID_TIME_RANGE` — về lý thuyết không nên xảy ra vì FE đã validate trước, nhưng vẫn xử lý phòng hờ; hoặc `POS_STAFF_LINK_NOT_ACTIVE`/`POS_STAFF_PROFILE_NOT_FOUND` nếu trạng thái đổi giữa lúc màn đang mở)
- **When** lỗi trả về
- **Then** FE hiển thị toast lỗi tương ứng, form giữ nguyên trạng thái đang chỉnh (không tự reset về server state)

- **Given** Owner đổi sang staff khác trong picker
- **When** picker đổi `selectedLinkId`
- **Then** lịch hiển thị đổi theo đúng staff mới (query key theo `businessStaffLinkId`); lỗi validate cũ của staff trước được xoá, không rò rỉ sang staff mới

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng phiên trước ở `vlink-nexora/backend` (đã `dotnet build` xong) — **chưa deploy lên `test-api.nexoratouch.com`**, nên tag nguồn (L-local), giống US-014..US-020. Cần re-verify qua live Swagger sau khi BE deploy trước khi chuyển story sang Tested/Done.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/weekly-schedule` | Bearer (Merchant/Owner) | — | `200 [{ dayOfWeek: number (0-6), isDayOff: boolean, startTime: string\|null ("HH:mm:ss"), endTime: string\|null }]` — luôn đủ 7 dòng, BE tự seed từ `PosBusinessOperatingHour` ở lần gọi đầu nếu chưa có dữ liệu; `400` nếu link không Active (`POS_STAFF_LINK_NOT_ACTIVE`); `404`/`400` nếu chưa có `PosStaffProfile` (`POS_STAFF_PROFILE_NOT_FOUND` — FE phải tự chặn trước bằng AC #2) | L-local |
| PUT | `/api/v1/merchant/pos/staff-profiles/{businessStaffLinkId}/weekly-schedule` | Bearer | `{ days: [{ dayOfWeek, isDayOff, startTime, endTime }] }` — luôn là danh sách đầy đủ 7 ngày, thay thế toàn bộ (ngày không gửi sẽ bị xoá khỏi DB, giống hành vi `UpdateBusinessHoursCommand`) | `200 boolean`; `400`: trùng ngày (`POS_STAFF_SCHEDULE_DUPLICATE_DAY`), khung giờ không hợp lệ (`POS_STAFF_SCHEDULE_INVALID_TIME_RANGE`), chưa có `PosStaffProfile` (`POS_STAFF_PROFILE_NOT_FOUND`), link không Active (`POS_STAFF_LINK_NOT_ACTIVE`) | L-local |

**Điểm đã xác nhận (chốt cùng phiên BE, cùng ngày):**
- Seed-on-first-read (copy 1 lần từ business hours) là hành vi tự động của BE, xảy ra ngay trong `GET` — FE không cần gọi API riêng để "khởi tạo" lịch.
- Seed-on-first-read **không** ghi `AuditLog`; chỉ `PUT` (Owner chủ động sửa) mới ghi audit — không ảnh hưởng FE, chỉ ghi chú để hiểu tại sao `GET` đầu tiên không tạo audit trail nhìn thấy được ở đâu khác.
- `dayOfWeek` là số nguyên `System.DayOfWeek` (0=Sunday..6=Saturday) — **khác** US-014 (Business Hours) dùng chuỗi tên ngày ("Sunday".."Saturday"). Đây là lý do component dùng chung (`WeeklyScheduleEditor`) nhận `dayOfWeek: number`, không tái dùng kiểu string-day của US-014.

**Còn lại cần xác nhận khi integrate:** re-verify contract qua live Swagger sau khi BE deploy lên dev/test server.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component (mới) | `src/components/dashboard/views/pos/WeeklyScheduleEditor.tsx` | Component trình bày dùng chung "7 dòng ngày + toggle Working/Off + input giờ", tổng quát hoá từ UI đã xây trong `PosBusinessHoursView.tsx` (US-02) nhưng tham số hoá field names (`isWorking`/`startTime`/`endTime`, `dayOfWeek: number`) để không cần đụng tới màn Business Hours đang chạy tốt. **Quyết định đã chốt (AskUserQuestion)**: chỉ tạo component mới dùng cho Weekly Schedule, KHÔNG refactor `PosBusinessHoursView.tsx` sang dùng chung trong story này — tránh regression 1 màn đã Integrated/tested; chấp nhận trùng lặp code tối thiểu (JSX render + `toApiTime`/`fromApiTime` 2 dòng) cho tới khi có phiên dọn dẹp riêng |
| Component (sửa) | `src/components/dashboard/views/pos/PosStaffProfileView.tsx` | Thêm section thứ 4 "Weekly Schedule" (cùng `nexora-card`, dưới "Service Assignment"), disabled khi `!hasSavedProfile` (tái dùng biến đã có từ US-020) kèm chú thích. State cục bộ: `scheduleForm: WeeklyScheduleEditorDay[]` (sync qua `useEffect` từ `useStaffWeeklySchedule`, sort theo `dayOfWeek`), `scheduleErrors: Record<number,string>` (reset khi đổi `selectedLinkId`), validate Rule 6 trước khi gọi `useUpdateStaffWeeklySchedule().mutateAsync` |
| Data hook | `src/data/hooks/usePosStaffProfile.ts` (sửa, thêm 2 hook) | `useStaffWeeklySchedule(businessStaffLinkId)` (query, key `qk.merchantPosStaffWeeklySchedule(businessStaffLinkId)`, `enabled: isOwner && !!businessStaffLinkId`, `placeholderData: keepPreviousData` — cùng lý do jank-fix đã áp dụng cho `useStaffPosProfile`/`useStaffServiceAssignments`), `useUpdateStaffWeeklySchedule()` (mutation, invalidate `qk.merchantPosStaffWeeklySchedule(businessStaffLinkId)`) |
| Repository | `src/data/repositories/posStaffProfile.ts` (sửa, thêm 2 hàm) | `getStaffWeeklySchedule(businessStaffLinkId): Promise<StaffWeeklyScheduleDayApiDto[]>` (GET), `saveStaffWeeklySchedule(businessStaffLinkId, days): Promise<boolean>` (PUT `{ days }`) |
| Type | `src/types/repositories.ts` | Thêm `StaffWeeklyScheduleDayApiDto { dayOfWeek: number; isDayOff: boolean; startTime?: string \| null; endTime?: string \| null }` |
| Query key | `src/data/queryKeys.ts` | Thêm `merchantPosStaffWeeklySchedule: (businessStaffLinkId?: string) => ['merchantSettings', 'posStaffWeeklySchedule', businessStaffLinkId ?? '']`, đặt ngay sau `merchantPosStaffServiceAssignments` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Thêm vào `components.dashboard.views.pos.PosStaffProfileView.*`: `weeklyScheduleTitle`, `weeklyScheduleDisabledNotice`, `dayOffLabel`, `saveSchedule`, `scheduleSavedSuccess`; thêm `errors.pos_staff_schedule_duplicate_day`, `errors.pos_staff_schedule_invalid_time_range`. Tên ngày trong tuần và message lỗi Rule 6 (`required`/`invalidRange`) **tái dùng nguyên** namespace đã có của US-014 (`components.settings.tabs.ProfileTab.businessHours.days.*`, `components.settings.tabs.ProfileTab.validation.*`) — không tạo key trùng lặp cho cùng ý nghĩa |
| Error mapping | `src/data/errorCodes.ts` | Map `POS_STAFF_SCHEDULE_DUPLICATE_DAY` → `errors.pos_staff_schedule_duplicate_day`, `POS_STAFF_SCHEDULE_INVALID_TIME_RANGE` → `errors.pos_staff_schedule_invalid_time_range` |

**Quyết định đã chốt (xác nhận 2026-07-16, qua AskUserQuestion):**
1. **Không refactor `PosBusinessHoursView.tsx`** sang dùng `WeeklyScheduleEditor` trong story này — chỉ tạo component mới và áp dụng cho Weekly Schedule, giữ nguyên màn Business Hours đã test xong (US-014), tránh regression. Trùng lặp code (JSX day-row, `toApiTime`/`fromApiTime`) là đánh đổi chấp nhận được, có thể dọn ở phiên riêng sau.
2. **Section 4 disable theo cùng điều kiện `hasSavedProfile`** đã dùng cho Service Assignment (US-020) — không phải điều kiện riêng — vì ticket BE liệt kê `PosStaffProfile` là dependency chung cho cả 2 tính năng (services + schedule đều cần profile tồn tại trước).

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước, hiện chỉ chạy local)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantPosStaffWeeklySchedule(businessStaffLinkId)`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- **FE code đã integrate xong (2026-07-16)**: tất cả layer trong FE Surface đã implement đúng như liệt kê:
  - `src/types/repositories.ts`: thêm `StaffWeeklyScheduleDayApiDto`.
  - `src/data/repositories/posStaffProfile.ts` (sửa): thêm `getStaffWeeklySchedule`, `saveStaffWeeklySchedule`.
  - `src/data/hooks/usePosStaffProfile.ts` (sửa): thêm `useStaffWeeklySchedule()` (`placeholderData: keepPreviousData`), `useUpdateStaffWeeklySchedule()`.
  - `src/data/queryKeys.ts`: thêm `merchantPosStaffWeeklySchedule(businessStaffLinkId)`.
  - `src/data/errorCodes.ts`: map `POS_STAFF_SCHEDULE_DUPLICATE_DAY`, `POS_STAFF_SCHEDULE_INVALID_TIME_RANGE`.
  - `src/components/dashboard/views/pos/WeeklyScheduleEditor.tsx` (mới): component trình bày dùng chung, chỉ dùng cho Weekly Schedule trong story này.
  - `src/components/dashboard/views/pos/PosStaffProfileView.tsx` (sửa): thêm section thứ 4 "Weekly Schedule" — disabled khi `!hasSavedProfile`, sync state từ query, validate Rule 6 client-side trước khi Save, dùng `WeeklyScheduleEditor`.
  - i18n: `components.dashboard.views.pos.PosStaffProfileView.*` (5 key mới), `errors.pos_staff_schedule_duplicate_day`, `errors.pos_staff_schedule_invalid_time_range` — cả `en.json` và `vi.json`.
- **Quyết định khi code thực tế** (khớp với 2 câu hỏi đã chốt qua AskUserQuestion trước khi code): không đụng `PosBusinessHoursView.tsx`; disable Weekly Schedule theo cùng `hasSavedProfile` với Service Assignment.
- Verify đã chạy: `npx tsc --noEmit` (diff 0 dòng so với baseline qua `git stash -u`, 66 lỗi pre-existing không đổi) + `npx vite build --mode production` (thành công, chỉ có warning chunk-size >900kB đã tồn tại từ trước).
- **Chưa làm được** (backend mới chỉ build local, chưa deploy lên dev/test server): AC pass trên môi trường dev với API thật, verify network trace, test 3-layer (feature-focused-tester), thao tác thử trên trình duyệt thật (chưa chạy `pnpm dev`), screenshot mobile 375px. Cần một phiên riêng sau khi backend deploy để hoàn tất các mục DoD còn lại và re-verify contract qua live Swagger trước khi chuyển status sang Tested/Done.
