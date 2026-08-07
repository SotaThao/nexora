# US-012 · SSN/EIN Capture & CPA Package Masking

> File: `US-012-ssn-ein-cpa-masking.md` · Tách từ review US-10 A3 Phần B / US-17-assumptions.md (repo `vlink-nexora`).

| | |
|---|---|
| **Trạng thái** | Approved |
| **Ngày tạo** | 2026-07-10 |
| **Epic / Domain** | TaxIQ — CPA Access & Data Privacy |
| **OpenSpec change** | `—` (implement theo Technical Design đã duyệt ở repo `vlink-nexora`, không mở OpenSpec riêng vì contract/entity đã chốt sẵn ở BE, không còn quyết định kiến trúc mở) |
| **Test plan** | `—` (điền khi viết TC) |

## Story

**Là** Thợ (Staff), **tôi muốn** tự nhập SSN/EIN của mình, **để** Chủ tiệm có thể phát hành 1099-NEC đúng tên khi chưa nộp W-9 đầy đủ.

**Là** Chủ tiệm (Owner), **tôi muốn** nhập EIN doanh nghiệp và xem TIN (SSN/EIN) của từng Thợ ở dạng ẩn (chỉ 4 số cuối) với tùy chọn "Reveal" khi cần, **để** vừa bảo vệ PII vừa vẫn file thuế đúng luật khi cần plaintext.

**Là** CPA, **tôi muốn** thấy TIN của Business/Staff hiển thị đúng theo `DataMode` của CPA Package (`Masked` = 4 số cuối, `FullSensitive` = đầy đủ), **để** có đủ thông tin file thuế mà không lộ PII ngoài phạm vi được cấp quyền.

## Acceptance Criteria

- **Given** Staff chưa từng nhập SSN/EIN, **When** vào trang Tax Profile và nhập SSN hợp lệ, **Then** `PUT /api/v1/taxiq/staff/tax-profile` trả 204, lần sau load lại `GET` trả `ssn` đã lưu.
- **Given** Staff nhập SSN sai định dạng, **When** submit, **Then** BE trả 400 và form hiển thị lỗi tương ứng (không tự đoán message, dùng response thật).
- **Given** Owner chưa nhập EIN doanh nghiệp, **When** nhập EIN hợp lệ ở trang Business/Owner Tax Year, **Then** `PUT /api/v1/taxiq/owner/business/{businessId}/ein` trả 204.
- **Given** Owner xem danh sách Staff trong Staff Tax Profile tab, **When** trang load, **Then** mỗi dòng gọi `GET staff-tin?reveal=false` hiển thị TIN dạng `***-**-1234` (hoặc `—` nếu Staff chưa nhập).
- **Given** Owner bấm nút "Reveal" trên 1 dòng Staff, **When** gọi lại `GET staff-tin?reveal=true`, **Then** hiển thị plaintext tạm thời (không cache lâu trong state) kèm tooltip báo đã ghi audit log.
- **Given** CPA mở link `/cpa/access?token=...` với `DataMode = Masked`, **When** package load, **Then** `businessTin`/`staffTin` hiển thị dạng che (BE đã mask sẵn, FE chỉ render).
- **Given** CPA mở link với `DataMode = FullSensitive`, **When** package load, **Then** `businessTin`/`staffTin` hiển thị đầy đủ (BE đã audit lần xem này).

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: BE mới merge, **chưa deploy lên `test-api.nexoratouch.com`**. Verify tại `https://localhost:5005/swagger` (backend đang chạy local theo yêu cầu user) — tag nguồn (L-local) thay vì (L) live test env. **Cần re-verify lại theo (L) live khi BE deploy lên test/staging** trước khi đóng story sang `Tested`.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/staff/tax-profile` | JWT (Staff) | — | `StaffTaxProfileDto { ssn?, ein? }` | L-local |
| PUT | `/api/v1/taxiq/staff/tax-profile` | JWT (Staff) | `UpsertStaffTaxProfileCommand { ssn?, ein? }` | 204 / 400 | L-local |
| PUT | `/api/v1/taxiq/owner/business/{businessId}/ein` | JWT (Owner) | `UpdateBusinessEinCommand { businessId, ein }` | 204 / 400 | L-local |
| GET | `/api/v1/taxiq/owner/staff-tin` | JWT (Owner) | query: `ownerTaxYearId`, `staffUserId`, `reveal` | `StaffTinDto { ssn?, ein? }` | L-local |
| GET | `/api/v1/taxiq/cpa-access/package` (đã có, mở rộng field) | Anonymous (token) | query: `token` | `CpaPackageDto` thêm `businessTin?`, `staffTin?`; `CpaPayoutDto` thêm `staffTin?` | L-local |

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — field/behavior đã chốt cùng lúc với BE trong session này (cùng 1 người review kỹ thuật). Rủi ro duy nhất: BE có thể đổi field khi review chính thức trước khi deploy — nếu vậy phải cập nhật lại repository normalize tương ứng.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Repository | `src/data/repositories/taxiqStaffTaxYear.ts` | thêm `getMyTaxProfile()`, `upsertMyTaxProfile(params)` |
| Repository | `src/data/repositories/taxiqOwnerPayouts.ts` | thêm `updateBusinessEin(businessId, ein)`, `getStaffTin(ownerTaxYearId, staffUserId, reveal)` |
| Repository | `src/data/repositories/taxiqCpaViewer.ts` | thêm `businessTin`/`staffTin` vào `CpaPackage`/`CpaPayout` |
| Data hook | `src/data/hooks/useTaxiqStaffTaxYear.ts` (hoặc file tương đương) | `useMyStaffTaxProfile()`, `useUpsertStaffTaxProfile()`; query key mới `qk.taxiq.staffTaxProfile` |
| Data hook | `src/data/hooks/useTaxiqOwnerPayouts.ts` | `useUpdateBusinessEin()`, `useStaffTin(ownerTaxYearId, staffUserId, reveal)` |
| Component | Trang Staff Tax Profile (cạnh W9, `src/components/staff-dashboard/views/taxiq/`) | form nhập SSN/EIN mới (useState, theo pattern `SelfReportedIncomeWizard.tsx`) |
| Component | `src/components/dashboard/views/taxiq/tabs/StaffTaxProfileTab.tsx` | thêm cột TIN masked + nút Reveal; form Owner nhập Business EIN |
| Component | `src/components/taxiq/CpaViewer/CpaViewerPage.tsx` | render `businessTin`/`staffTin` |
| i18n | `src/locales/en.json`, `vi.json` | key mới cho label SSN/EIN, lỗi format, tooltip Reveal |

## Definition of Done

- [ ] AC pass trên dev (BE local `localhost:5005`, FE `localhost:3000`)
- [ ] API call đúng contract đã map (verify bằng network tab)
- [ ] Mutation invalidate đúng query cache (`qk.taxiq.staffTaxProfile`, staff list query dùng bởi `StaffTaxProfileTab`)
- [ ] Không console error
- [ ] `pnpm build` xanh
- [ ] Re-verify contract theo (L) live khi BE deploy lên test/staging, cập nhật trạng thái sang `Tested`

## Ghi chú phiên thực thi

- Repo `vlink-nexora` (BE) đã xác nhận 4 quyết định nghiệp vụ: Owner được xem SSN/EIN plaintext (audited qua "Reveal"), audit mỗi lần reveal, SSN/EIN lưu 1 lần/Staff (không theo từng tax year), Account Number loại khỏi scope.
- Story này bắt đầu code khi BE chưa deploy lên môi trường chia sẻ — chấp nhận rủi ro theo quyết định của user (2026-07-10), cần re-verify khi BE lên test env.
