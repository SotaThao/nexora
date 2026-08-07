# US-031 · TaxIQ/POS Pay Engine (mục 13 Payroll doc)

> File: `US-031-taxiq-pos-pay-engine.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-23 |
| **Epic / Domain** | TaxIQ — Payroll / POS Staff Profile |
| **OpenSpec change** | `—` (single-owner scope: 1 route + 1 view + 1 modal + repository/hook extension) |
| **Test plan** | — |

## Story

**Là** Owner,
**tôi muốn** cấu hình cách trả lương cho từng thợ (công thức Hourly/Commission/Hybrid/Tiered,
overtime, 2 loại bonus, pay schedule, payout destination, 4 công tắc proof/blocking) và xem
Ready-To-Pay Gate,
**để** biết chính xác thợ nào đã đủ điều kiện trả lương trước khi dùng Weekly Payroll/Quick Pay.

## Acceptance Criteria

- **Given** Owner mở màn `Pay Engine`
- **When** danh sách tải xong
- **Then** mỗi dòng hiện thợ, contract type, pay formula (nếu đã cấu hình), pay schedule, trạng
  thái payout method, và cờ tổng "Ready" — nút `Configure Rule` mở modal Employee Payment Setup

- **Given** Owner mở modal Configure Rule cho một thợ đã có POS profile
- **When** chọn công thức Hybrid, nhập hourly rate + commission%, bật 2 loại bonus, chọn pay
  schedule, giữ nguyên 4 toggle mặc định, bấm Save
- **Then** gọi `PUT .../pay-rule` (200), modal đóng, danh sách refetch với formula/schedule mới

- **Given** Owner nhập Primary/Backup payout method + destination, bấm Save
- **When** submit thành công
- **Then** gọi `PUT .../payout-destination` (200), Ready-To-Pay Gate cập nhật `payoutMethodReady`

- **Given** thợ chưa có POS profile (chưa qua bước Worker Profile)
- **When** Owner bấm Configure Rule
- **Then** hiện thông báo lỗi dịch từ `POS_STAFF_PAY_RULE_PROFILE_NOT_SET_UP`, không cho submit

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong session backend cùng ngày (13/13 test case pass) — xem
> `docs/plan/tasks/taxiq/be-tasks/test-cases/US-23-taxiq-pos-pay-engine-test.md` (repo `vlink-nexora`).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/staff-profiles/pay-rules` | Owner JWT | — | `{items: PayRuleListItemDto[]}` | (L) |
| GET | `/api/v1/merchant/pos/staff-profiles/{id}/pay-rule` | Owner JWT | — | `PayRuleDetailDto` + `readyToPayGate` | (L) |
| PUT | `/api/v1/merchant/pos/staff-profiles/{id}/pay-rule` | Owner JWT | formula fields + toggles | `200 true` / `400` | (L) |
| PUT | `/api/v1/merchant/pos/staff-profiles/{id}/payout-destination` | Owner JWT | primary/backup method+destination | `200 true` / `400` | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — toàn bộ contract xác nhận qua curl thật.

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/components/dashboard/routes/index.tsx` | `TaxIqPayEngineRoute` (mới) — chỉ cần `businessId`, giống mẫu `TaxIqEmployersRoute` (Pay Engine keyed theo BusinessStaffLink, không theo OwnerTaxYear) |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/pay-engine` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'pay-engine', labelKey: 'dashboard.menu.taxiq_pay_engine' }` |
| Component | `src/components/dashboard/views/taxiq/PayEngineView.tsx` (mới) | Bảng danh sách + nút Configure Rule |
| Component | `src/components/dashboard/views/taxiq/modals/EmployeePaymentSetupModal.tsx` (mới) | Form 5 khối (Worker+Tax Readiness đọc, Pay Formula, Payout Method, Proof+Blocking, Ready-To-Pay Gate) |
| Repository | `src/data/repositories/posStaffProfile.ts` | Thêm types (`PayFormula`, `PaySchedule`, `PayoutMethod`, `TieredRateEntry`, `PayRuleDetail`, `PayRuleListItem`) + `listPayRules`/`getPayRule`/`upsertPayRule`/`upsertPayoutDestination` |
| Data hook | `src/data/hooks/usePosStaffProfile.ts` | `usePayRuleList`, `usePayRule`, `useUpsertPayRule`, `useUpsertPayoutDestination` |
| Khác | `src/data/queryKeys.ts` | `merchantPosPayRuleList`, `merchantPosPayRule` |
| Khác | `src/data/errorCodes.ts` | 7 mã lỗi Pay Engine mới |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.payEngine.*` mới, `dashboard.menu.taxiq_pay_engine`, `errors.pos_staff_pay_rule_*`/`errors.pos_staff_payout_destination_*` |

## Definition of Done

- [x] AC pass trên môi trường dev (local backend)
- [x] API call đúng contract đã map (method/status/payload — verify bằng network)
- [x] Mutation invalidate đúng query cache
- [x] Không console error
- [x] Test theo 3 layer (skill feature-focused-tester)
- [x] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`) + FE dev server
(`localhost:3002`), đăng nhập Owner (`quanpm`).

Kết quả:
- Bảng danh sách tải đúng 5 thợ, hiện `contractType`/`payFormula`/`paySchedule`/2 badge Ready
  đúng theo dữ liệu backend đã seed qua curl session trước.
- **Bug tìm thấy & fix ngay**: `Trump` có `payStructureType=WeeklySalary` (giá trị từ POS
  quick-setup cũ, không thuộc 4 công thức Pay Engine) hiện ra raw key
  `taxiq.payEngine.payFormulas.WeeklySalary` thay vì text dịch — vì namespace i18n chỉ khai báo
  4 công thức Pay Engine, quên rằng cột list có thể trả về `WeeklySalary`/`AgreedAmount` từ
  command cũ. Fix: thêm 2 key còn thiếu vào `en.json`/`vi.json`.
- Mở modal Employee Payment Setup cho Chloe: hydrate đúng toàn bộ state đã lưu qua curl (Commission
  45%, Sales Threshold Bonus 1200/5%, payout Check "Payable to Chloe M."). Chuyển công thức sang
  Hybrid: form hiện đúng Hourly Rate (giá trị cũ 15 còn sót từ lần test Hourly trước — đúng thiết
  kế, không phải bug, vì mỗi command chỉ quản lý field của công thức đang chọn). Bật KPI Bonus,
  nhập target/percent, bấm Lưu.
- Network trace xác nhận đúng 2 mutation tuần tự: `PUT .../pay-rule` (200) rồi `PUT
  .../payout-destination` (200, vì Primary Destination đã có sẵn), cả hai đều tự động refetch
  `GET .../pay-rule` và `GET .../pay-rules`. Bảng danh sách cập nhật ngay "Hybrid", badge Payout
  Method "Sẵn sàng", badge tổng "Chưa sẵn sàng" (đúng vì TinStatus vẫn Missing — chưa đủ điều kiện
  Worker Classification).
- Test luồng lỗi: mở Configure Rule cho "Jane FE Test" (chưa có PosStaffProfile), nhập Commission
  40%, bấm Lưu → nhận đúng lỗi dịch tiếng Việt "Hoàn tất bước Worker Profile (vai trò POS và tips)
  cho thợ này trước.", modal không đóng, không crash.
- Resize 375×667: modal cuộn đúng bên trong (`nexora-modal-card`), header/footer cố định, form 1
  cột — không tràn ngang.
- Console: 0 lỗi JS thật (chỉ có network-log entry bình thường của trình duyệt cho response 400 ở
  test lỗi, không phải unhandled exception).
