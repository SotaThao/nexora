# US-049 · Danh mục Thu nhập / Chi trả (Income & Payout Categories)

> File: `US-049-income-payout-categories.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (chưa Tested — BE nay đã chạy **local** (`https://localhost:5005`), chưa deploy `test-api`; contract đã verify lại theo code BE thật, xem "Ghi chú phiên thực thi") |
| **Ngày tạo** | 2026-09-10 |
| **Epic / Domain** | Tip system / Payments & Payouts — Merchant + Staff self-defined transaction categories |
| **OpenSpec change** | `openspec/changes/integrate-income-payout-categories` |
| **Test plan** | (điền khi viết TC) |

## Story

**Là** Staff hoặc Merchant (Chủ Tiệm),
**tôi muốn** gắn một danh mục tự đặt tên (Rent, Salary, Tip, Bonus, Commission, Other, hoặc tự tạo) vào từng khoản tiền tôi đã nhận/trả,
**để** tôi theo dõi và xem thống kê thu nhập theo từng mục đích, thay vì chỉ thấy tổng số tiền chung chung.

**Nguồn yêu cầu**: GitHub issue #584 (BA/PO requirement), UI tham khảo #648 (AI-generated mockup, không phải spec bắt buộc). Tài liệu chi tiết (business/technical/tickets) nằm ở repo sibling `vlink-nexora`, `docs/business/income-payout-categories/` — cùng branch `feature/584-category`.

## Phạm vi

Backend (entity + CQRS + controller, repo `vlink-nexora`) và Frontend Merchant Portal (`vlink-nexora/frontend`, nếu có) **không thuộc phạm vi story này**. Story này chỉ bao phủ **Ticket 3, 4, 5, 6, 7** của bản ticket breakdown — toàn bộ phần FE trong `vlink-nexora-fe`:

- Ticket 3: Merchant gắn category vào Customer Payments (DirectPayment).
- Ticket 4: Merchant "Income by category" panel + màn Category Management + route/menu.
- Ticket 5: Staff Category Management (CRUD danh mục cá nhân).
- Ticket 6: Staff gắn category vào Tip / StaffDirectPayment / Payout.
- Ticket 7: Staff "Income by category" panel trên My Earnings > Overview.

Ticket 1 (entity/migration) và Ticket 2 (Merchant CRUD command/query/controller) là backend-only, nằm ở repo `vlink-nexora`.

**Quyết định kiến trúc đã chốt** (khác suy diễn ban đầu của mockup #648):
1. Mỗi giao dịch chỉ có 1 chủ sở hữu category — Merchant và Staff không cùng gắn category độc lập lên cùng 1 giao dịch.
2. Payout (Payroll) do **Staff** tự gắn (vì đó là tiền Staff nhận được), nhất quán với Tip/StaffDirectPayment.
3. Merchant **không** thấy/sửa được category của Tip — "Income by category" phía Merchant chỉ phản ánh Customer Payments do chính Merchant gắn.

**Bỏ qua một prototype cũ**: branch remote `origin/feat/584_income-payout-categories` (chưa merge) từng thử làm tính năng này bằng `localStorage` thuần, không qua repository/hook/queryKeys — vi phạm Data Boundary (AGENTS.md). Đã xác nhận với user: bỏ hẳn, không tái sử dụng.

## Acceptance Criteria

- **Given** Merchant mở chi tiết 1 Customer Payment
  **When** chọn 1 category có sẵn từ dropdown
  **Then** gọi `PUT /api/v1/merchant/payments/{id}/category`, dropdown cập nhật ngay category mới, không cần bước xác nhận riêng

- **Given** Merchant chọn "+ Create new" trong dropdown category
  **When** nhập tên và bấm "Save category"
  **Then** gọi `POST /api/v1/merchant/transaction-categories` tạo category mới, sau đó gọi ngay `PUT .../payments/{id}/category` để gắn vào giao dịch đang xem — 1 luồng liền mạch

- **Given** Staff mở chi tiết 1 Tip / StaffDirectPayment / Payout đã nhận
  **When** chọn category có sẵn hoặc tạo mới
  **Then** gọi đúng endpoint tương ứng (`PUT .../staff/tips/{id}/category`, `.../staff/payments/{id}/category`, `.../staff/payouts/{id}/category`)

- **Given** Merchant xem 1 giao dịch Tip (audience='staff' component tái sử dụng cho merchant qua prop `audience`)
  **When** modal render
  **Then** **không** hiện block Category — Merchant không có quyền xem/sửa category của Tip

- **Given** Staff/Merchant xoá 1 category đang được dùng ở nhiều giao dịch
  **When** xác nhận xoá
  **Then** gọi `DELETE .../transaction-categories/{id}`; các giao dịch liên quan tự động fallback về "Uncategorized" ở phía BE — FE chỉ cần invalidate cache, không cần xử lý gì thêm

- **Given** Staff/Merchant vào màn "Income by category"
  **When** đổi kỳ lọc (All time/Week/Month/Year) và giá trị kỳ cụ thể
  **Then** gọi lại `GET .../transaction-categories/stats?period=&year=&month=&week=` với tham số mới

## API Mapping

> **Cập nhật 2026-09-10**: contract dưới đây đã được **verify lại trực tiếp từ code BE thật** (repo sibling `vlink-nexora`, branch `feature/584-category`, nay chạy local tại `https://localhost:5005` — xác nhận bằng `curl` thấy 401 thay vì 404 trên mọi route, và bằng cách đọc thẳng `MerchantTransactionCategoriesController.cs`/`StaffTransactionCategoriesController.cs`/`GetIncomeByCategoryStatsQuery.cs`/`web-api-client.ts` đã generate). **Khác so với đề xuất ban đầu của FE** ở 3 điểm — xem "Ghi chú phiên thực thi": (1) `period`/`periodValue` sai — BE dùng `period` (string enum) + `year`/`month`/`week` (int riêng lẻ); (2) item stats field tên `amount` chứ không phải `totalAmount`; (3) Create/Update trả về `Guid`/`bool`, không phải full DTO. Tag: (L) verified live (local).

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/transaction-categories` | Owner | — | `TransactionCategoryDto[]` | (L) |
| POST | `/api/v1/merchant/transaction-categories` | Owner | `{ name }` | 201 `Guid` (chỉ id) | (L) |
| PUT | `/api/v1/merchant/transaction-categories/{id}` | Owner | `{ name }` | 200 `bool` | (L) |
| DELETE | `/api/v1/merchant/transaction-categories/{id}` | Owner | — | 200 `bool` | (L) |
| GET | `/api/v1/merchant/transaction-categories/stats` | Owner | `?period=AllTime\|Week\|Month\|Year&year=&month=&week=` | `IncomeByCategoryStatsDto` | (L) |
| PUT | `/api/v1/merchant/payments/{id}/category` | Owner | `{ categoryId }` | 200 `bool` | (L) |
| GET/POST/PUT/DELETE | `/api/v1/staff/transaction-categories[/{id}]` | Staff | tương tự Merchant | tương tự Merchant | (L) |
| GET | `/api/v1/staff/transaction-categories/stats` | Staff | tương tự Merchant | `IncomeByCategoryStatsDto` | (L) |
| PUT | `/api/v1/staff/tips/{id}/category` | Staff | `{ categoryId }` | 200 `bool` | (L) |
| PUT | `/api/v1/staff/payments/{id}/category` | Staff | `{ categoryId }` | 200 `bool` | (L) |
| PUT | `/api/v1/staff/payouts/{id}/category` | Staff | `{ categoryId }` | 200 `bool` | (L) |

`TransactionCategoryDto`: `{ id, name, displayOrder }`. `IncomeByCategoryStatsDto`: `{ period, from, to, totalAmount, items: [{ categoryId, categoryName, amount, transactionCount }] }` — `categoryId: null` = "Uncategorized" (giá trị ảo, không phải row thật). `period` là string enum (`"AllTime"|"Week"|"Month"|"Year"`), `year`/`month`/`week` là int rời — không có tham số `periodValue` gộp.

**Điểm còn lại (không chặn Tested, chỉ để lưu ý):**

1. Đã verify chỉ với BE **local** — chưa deploy `test-api.nexoratouch.com`, nên vẫn cần smoke test lại 1 lần trên môi trường dev share khi BE deploy lên đó.
2. `DisplayOrder` của category vừa tạo không có trong response (`create` chỉ trả `id`) — FE để cache tự refetch qua `invalidateQueries` thay vì tự suy đoán `displayOrder` phía client.

## FE Surface

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Types | `src/types/domain.ts` | `TransactionCategory`, `IncomeByCategoryStat(s)`; thêm `categoryId?`/`categoryName?` vào `TransactionRecord`, `MerchantPaymentRecord`, `StaffPaymentRecord`, `StaffTipItem`, `PayoutRecord`, `StaffPayoutDetailRecord` |
| Types (wire) | `src/types/repositories.ts` | `TransactionCategoryApiDto`, `IncomeByCategoryStat(s)ApiDto`; `categoryId?`/`categoryName?` vào `TipApiDto` |
| Constants | `src/constants/incomeCategoryPeriod.ts` | `IncomeCategoryPeriod` (`all/week/month/year`) + `buildPeriodValueOptions()` (last 12 kỳ, client-side — không có BE "available periods" endpoint) |
| Repository | `src/data/repositories/transactionCategories.ts` | mới — `createTransactionCategoriesRepository(client, basePath)`, 2 instance (merchant/staff): `list/create/update/remove/getIncomeStats`; `list`/`getIncomeStats` fallback rỗng khi 404 (giống `myCertificates.ts`) |
| Repository | `src/data/repositories/merchantPayments.ts`, `staffPayments.ts` | thêm `setCategory(paymentId, categoryId)`; normalizer đọc `categoryId`/`categoryName` |
| Repository | `src/data/repositories/staffSelf.ts` | thêm `setTipCategory(tipId, categoryId)` (Tip thuộc `/api/v1/staff/tips`, **không phải** `transactions.ts` — đó là Merchant's `dashboard/tips`) |
| Repository | `src/data/repositories/payouts.ts` | thêm `setCategory(payoutId, categoryId)` vào factory **staff** only (Merchant không set category lên Payout) |
| Query keys | `src/data/queryKeys.ts` | `merchantTransactionCategories`, `merchantIncomeByCategoryStats`, `staffTransactionCategories`, `staffIncomeByCategoryStats` |
| Data hook | `src/data/hooks/useTransactionCategories.ts` | mới — CRUD + stats hooks cho cả 2 scope, invalidate on success |
| Data hook | `src/data/hooks/useMerchantPayments.ts`, `useStaffPayments.ts` | `useSetMerchantPaymentCategory`, `useSetStaffPaymentCategory` |
| Data hook | `src/data/hooks/useStaffSelf.ts` | `useSetTipCategory` |
| Data hook | `src/data/hooks/useStaffPayouts.ts` | `useSetStaffPayoutCategory` |
| Component | `src/components/dashboard/categories/CategorySelect.tsx` | mới — native `<select>` dùng chung (không có combobox lib trong repo) |
| Component | `src/components/dashboard/categories/AddEditCategoryModal.tsx` | mới — modal tạo/sửa dùng chung |
| Component | `src/components/dashboard/charts/IncomeByCategoryPanel.tsx` | mới — panel dùng chung 4 nơi (Merchant Overview/Category Management, Staff Earnings Overview/Category Management) |
| Component | `src/components/dashboard/modals/MerchantPaymentDetailModal.tsx` | thêm block Category |
| Component | `src/components/dashboard/modals/TransactionDetailModal.tsx` | thêm block Category **chỉ khi `audience === 'staff'`** |
| Component | `src/components/staff-dashboard/modals/StaffPaymentDetailModal.tsx` | thêm block Category |
| Component | `src/components/staff-dashboard/views/StaffPayouts.tsx` (`StaffPayoutDetailModal` inline) | thêm row Category trong `<dl>` |
| Component | `src/components/dashboard/views/CategoryManagementView.tsx` | mới — màn quản lý category Merchant |
| Component | `src/components/staff-dashboard/views/StaffCategoryManagement.tsx` | mới — màn quản lý category Staff |
| Component | `src/components/tips/tabs/TipsOverviewTab.tsx` | thêm `IncomeByCategoryPanel` + nút "Manage categories" |
| Component | `src/components/staff-dashboard/views/StaffMyEarnings.tsx` | thêm `IncomeByCategoryPanel` trong tab Overview, tách biệt rõ với breakdown-by-source hiện có |
| Route/menu | `src/components/dashboard/constants.tsx` | `DASHBOARD_MENU_ID.categoryManagement`, entry trong `PAYMENTS_PAYOUTS_SUBMENU`, mở rộng `isPaymentsPayoutsRouteActive` |
| Route | `src/components/dashboard/PaymentsPayoutsHeader.tsx` | `navigate()` chỉ append `?tab=` khi `item.params?.tab` có giá trị (entry mới không có tab) |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `CategoryManagementRoute` (dashboard), `StaffCategoryManagement` lazy route `/staff/categories` |
| Locales | `src/locales/en.json`, `vi.json` | namespace top-level phẳng mới `transaction_categories.*` (27 key), theo đúng convention `staff_earnings`/`staff_payouts` |

## Definition of Done

- [x] Đi đúng data boundary: component → hook → repository → httpClient; normalize chỉ ở repository
- [x] Category assignment nằm ở repository của **entity sở hữu** (Payment/Tip/Payout), không gộp vào `transactionCategories.ts`
- [x] Locale EN/VI parity (`transaction_categories` — 27/27 key, JSON valid, không trùng key top-level)
- [ ] `pnpm typecheck` không thêm lỗi mới so với baseline (verify ở bước sau)
- [ ] `pnpm build` pass (verify ở bước sau)
- [ ] Test thủ công 4 modal + 2 màn Category Management + 2 panel Overview, cả desktop lẫn 375px
- [ ] **AC pass trên API thật** — chặn: endpoint chưa deploy (xem "cần hỏi BE")
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

**2026-09-10 — FE xong toàn bộ 5 ticket (3/4/5/6/7), chưa verify được với BE thật.**

- **Không có bất kỳ endpoint nào tồn tại** — đã dò Swagger live `test-api.nexoratouch.com` (grep `categor`), không có path nào khớp `transaction-categor`; `localhost:5005` không phản hồi. Repo `vlink-nexora` (backend) trên cùng branch `feature/584-category` mới có `TransactionCategory.cs` (entity draft) + sửa dở `Payment.cs` — chưa có Application/Web layer.
- Vì contract được lấy nguyên văn từ tài liệu kỹ thuật (cùng dẫn dắt việc code BE song song) chứ không phải đoán mò, quyết định đi trước BE theo đúng pattern đã có ở Certifications/POS reports trong repo này.
- **Phát hiện quan trọng khi implement**: kế hoạch ban đầu định đặt `setTipCategory` vào `src/data/repositories/transactions.ts` — sai, vì file đó là repository **Merchant** (`GET /api/v1/merchant/dashboard/tips`). Endpoint gắn category cho Tip là của **Staff** (`PUT /api/v1/staff/tips/{id}/category`), thuộc về `staffSelf.ts` (nơi đã có `getTips`/`confirmTipsReceipt` cho `/api/v1/staff/tips`). Đã sửa đúng chỗ trước khi hoàn tất — không có row category nào bị gắn nhầm ở phía Merchant tips repository (không có field category nào được thêm vào đó cả, tránh dữ liệu chết).
- **`AddEditCategoryModal`** dùng chung cho cả luồng "+ Create new" inline trong `CategorySelect` (tự động gắn category vừa tạo vào giao dịch đang xem) lẫn 2 màn Category Management — đúng theo ticket 3 bước 4.
- **`IncomeByCategoryPanel`** tự fetch dữ liệu qua hook riêng (không đi qua `useTipsData`/prop-drilling của `TipsView.tsx`) — tránh phải sửa chuỗi truyền prop hiện có, giữ thay đổi hẹp đúng nguyên tắc AGENTS.md.
- **`PaymentsPayoutsHeader.tsx`**: entry "Category Management" không có `params.tab` (là 1 route riêng, không phải tab trong Tips/Reports) — đã sửa `navigate()` thành có điều kiện; 6 tab cũ vẫn giữ nguyên hành vi (luôn có `params.tab`).
- Chưa chạy `pnpm typecheck`/`pnpm build`/test thủ công — sẽ verify ở bước tiếp theo của phiên làm việc.

**2026-09-10 (tiếp) — verify lại contract với BE local, sửa 2 bug thật + restyle panel theo mẫu UI.**

- User báo "Overview không có data về amount" kèm ảnh mẫu HTML (không phải data thật) để tham khảo layout. Khi kiểm tra phát hiện: (1) dev server đang chạy port 3000, (2) `.env.development` trỏ `VITE_API_BASE_URL=https://localhost:5005` (không phải `test-api` như bảng trong AGENTS.md — file thật đã override), (3) `https://localhost:5005/api/v1/merchant/transaction-categories/category` trả **401** (không phải 404) — nghĩa là **backend đã được code đầy đủ ở local** từ lúc bắt đầu phiên tới giờ (khác hẳn tình trạng "chỉ có entity draft" lúc research ban đầu).
- Đọc thẳng source BE (`vlink-nexora/backend/src/...TransactionCategories/...`, `.../Web/wwwroot/api/web-api-client.ts` đã generate) để lấy contract thật, phát hiện 2 chỗ sai so với đề xuất ban đầu của FE:
  1. **Bug thật gây "mất data amount"**: `IncomeByCategoryItemDto.Amount` — FE đang đọc field `totalAmount` (không tồn tại) thay vì `amount`, nên mọi category luôn hiện `$0.00` dù BE trả đúng số. Đã sửa `IncomeByCategoryStat.totalAmount` → `.amount` (+ thêm `transactionCount`) xuyên suốt type/repository.
  2. **Sai tham số kỳ lọc**: BE dùng `period` (string enum `AllTime|Week|Month|Year`) + `year`/`month`/`week` (int rời), không phải `period=all&periodValue=`. Đã viết lại `src/constants/incomeCategoryPeriod.ts` (giá trị enum đổi thành PascalCase khớp BE, `buildPeriodValueOptions` trả về `{year?, month?, week?}` thay vì 1 string).
  3. Create/Update category trả về `Guid`/`bool` (không phải full DTO) — đã sửa `transactionCategories.ts`/`useTransactionCategories.ts` cho khớp; không ảnh hưởng 4 điểm gọi `category.id` (đều chỉ dùng `.id`, đã kiểm tra bằng grep).
- **Restyle `IncomeByCategoryPanel.tsx` theo ảnh mẫu user gửi**: đổi từ prop-driven (`stats`/`period`/`onPeriodChange`...) sang **tự fetch qua prop `scope: 'merchant'|'staff'`** — đơn giản hoá 4 nơi gọi (`TipsOverviewTab`, `StaffMyEarnings`, `CategoryManagementView`, `StaffCategoryManagement`) chỉ còn `<IncomeByCategoryPanel scope="..." onManageCategories={...} />`. UI: lưới 2 cột (1 cột trên mobile), chấm màu + tên bên trái/số tiền bên phải (bỏ %), thanh progress mỏng cùng màu chấm, subtitle dưới tiêu đề, nút "Manage categories" nền `bg-nexoraBrand` đặc thay vì viền.
- `pnpm typecheck` (diff chuẩn hoá theo baseline 49 lỗi, không phân biệt số dòng): **0 lỗi mới** cả trước và sau đợt sửa này. `pnpm build`: pass sạch cả 2 lần.
- Đã cập nhật bảng API Mapping ở trên từ "(P) proposed" → "(L) verified live (local)".
