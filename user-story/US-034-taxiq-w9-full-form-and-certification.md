# US-034 · TaxIQ W-9 Full Form + Self-Certification

> File: `US-034-taxiq-w9-full-form-and-certification.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (chưa smoke test qua browser — không có backend local chạy trong phiên này) |
| **Ngày tạo** | 2026-07-23 |
| **Epic / Domain** | Tax IQ — Staff Tax Profile (Owner + Staff side) |
| **OpenSpec change** | — (mở rộng field trên layer data đã có từ US-017; không tạo shared layer mới) |
| **Test plan** | Điền khi viết test |

## Story

**Là** Thợ (Staff, 1099 Contractor),
**tôi muốn** điền đầy đủ các trường còn thiếu của form W-9 thật (địa chỉ tách City/State/ZIP, phân loại
LLC con C/S/P, mô tả khi chọn "Other", có bị backup withholding hay không) và tự certify (ký xác nhận)
sau khi đã upload file đã ký,
**để** dữ liệu W-9 đủ để salon lập Form 1099-NEC, và có bằng chứng thời điểm tôi xác nhận thông tin là
đúng — khớp với mẫu W-9 thật (Part I + Part II).

**Là** Business Owner (Chủ tiệm),
**tôi muốn** xem đầy đủ dữ liệu W-9 mở rộng của từng Thợ 1099 (địa chỉ đầy đủ, phân loại LLC con, trạng
thái certify),
**để** biết chắc hồ sơ đã hoàn chỉnh và đã được thợ tự xác nhận, không chỉ có tên/địa chỉ rút gọn.

Bối cảnh: BE đã hoàn tất trong phiên trước (đối chiếu form W-9 thật tại
`taxiq-nexora-touch.vercel.app/html/pages/w9-form.html`, gap analysis + implement qua 3 lượt):

- `TaxClassification` enum thêm `TrustEstate`, `Other`.
- `W9Record` (BE) thêm: `City`, `State`, `ZipCode` (tách khỏi `Address` — `Address` vẫn giữ nguyên là dòng
  street, không rename), `LlcTaxClassificationType?` (`C`/`S`/`P`, bắt buộc khi `TaxClassification ==
  LLC`), `OtherClassificationDescription?` (bắt buộc khi `TaxClassification == Other`),
  `IsSubjectToBackupWithholding` (bool), `CertificationAccepted` (bool), `CertifiedAt` (DateTime?).
- Certify là **command riêng** `CertifyW9RecordCommand` (mirror `VerifyStaffTinCommand` — không gộp vào
  `UpsertW9RecordCommand`), chặn nếu thiếu field bắt buộc hoặc chưa upload file đã ký (lỗi
  `TAXIQ_W9_NOT_READY_FOR_CERTIFICATION`). Bất kỳ thay đổi nội dung nào (Legal Name/Address/City/State/
  Zip/TaxClassification/Llc.../Other.../IsSubjectToBackupWithholding) sau khi đã certify sẽ tự động revert
  `certificationAccepted=false`, `certifiedAt=null` — Staff phải certify lại.
- Không đổi: Exemptions (Exempt payee code, FATCA code), Account number(s) — chủ động bỏ qua theo quyết
  định sản phẩm (không áp dụng thực tế cho 1099 cá nhân).

## Acceptance Criteria

### Staff side — form W-9 đầy đủ + certify

- **Given** Staff mở `StaffTaxProfileCard.tsx`
- **When** trang render
- **Then** section W-9 có thêm: City/State/ZIP (3 field bắt buộc, thay cho 1 dòng Address duy nhất trước
  đây — Address dòng street vẫn giữ), dropdown Tax Classification có thêm "Trust/Estate" và "Other",
  checkbox "Subject to backup withholding"

- **Given** Staff chọn Tax Classification = "LLC"
- **When** render lại
- **Then** hiện thêm dropdown bắt buộc "LLC tax classification" (C/S/P)

- **Given** Staff chọn Tax Classification = "Other"
- **When** render lại
- **Then** hiện thêm ô text bắt buộc "Describe your classification"

- **Given** Staff đã lưu đủ Legal Name/Address/City/State/Zip + (Llc hoặc Other nếu áp dụng) + đã upload
  file đã ký
- **When** bấm nút "Certify"
- **Then** gọi `POST /api/v1/taxiq/staff/tax-profile/w9/certify`; thành công hiển thị badge "Certified on
  {{date}}"; nếu thiếu điều kiện, BE trả `TAXIQ_W9_NOT_READY_FOR_CERTIFICATION` → toast lỗi tương ứng

- **Given** W-9 đã certify, Staff sửa lại Legal Name hoặc Address rồi Save
- **When** reload
- **Then** badge certify biến mất / chuyển về "Not certified yet" (BE tự revert) — FE chỉ cần hiển thị lại
  đúng theo `certificationAccepted`/`certifiedAt` mới nhất từ response, không cần logic revert phía FE

### Owner side — xem dữ liệu mở rộng

- **Given** Owner mở `StaffTaxProfileTab.tsx`, xem cột chứa dữ liệu W-9 của 1 Thợ 1099
- **When** đã Reveal hoặc xem masked (W9 luôn plaintext, không phụ thuộc Reveal — giữ nguyên hành vi US-017)
- **Then** thấy thêm City/State/ZIP, LLC sub-classification hoặc Other description (nếu có), trạng thái
  certify (Certified on {{date}} / Not certified) và cờ "Subject to backup withholding" nếu true

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE đã implement + build sạch trong phiên trước (local, chưa deploy `test-api.nexoratouch.com`) —
> `StaffTaxYearController.cs`, `UpsertW9RecordCommand.cs`, `CertifyW9RecordCommand.cs` (mới),
> `GetMyStaffTaxProfileQuery.cs` (Staff); `GetStaffTinQuery.cs`, `StaffTinDto.cs` (Owner). Xác nhận field
> name qua `web-api-client.ts` đã regenerate (NSwag) trong cùng phiên. Tag: (L) local backend.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/taxiq/staff/tax-profile` | Bearer (Staff) | — | `w9Record` thêm `city, state, zipCode, llcTaxClassificationType?, otherClassificationDescription?, isSubjectToBackupWithholding, certificationAccepted, certifiedAt?` | (L) |
| PUT | `/api/v1/taxiq/staff/tax-profile/w9` | Bearer (Staff) | thêm `city, state, zipCode, llcTaxClassificationType?, otherClassificationDescription?, isSubjectToBackupWithholding` vào body cũ | `204` | (L) |
| POST | `/api/v1/taxiq/staff/tax-profile/w9/certify` | Bearer (Staff) | — (không body) | `204`, hoặc `400` + `TAXIQ_W9_NOT_READY_FOR_CERTIFICATION` | (L) |
| GET | `/api/v1/taxiq/owner/staff-tin?...` | Bearer (Owner) | — | thêm `w9City?, w9State?, w9ZipCode?, w9LlcTaxClassificationType?, w9OtherClassificationDescription?, w9IsSubjectToBackupWithholding, w9CertificationAccepted, w9CertifiedAt?` | (L) |

`taxClassification` enum thêm: `'TrustEstate' | 'Other'` (giữ nguyên 6 giá trị cũ).
`llcTaxClassificationType` enum: `'C' | 'S' | 'P'` (chỉ có nghĩa khi `taxClassification === 'LLC'`).

Error code mới: `TAXIQ_W9_NOT_READY_FOR_CERTIFICATION` — cần thêm vào `errorCodes.ts` + 2 locale file.

**Điểm chưa chắc chắn / cần hỏi BE:** Không còn — cùng người thực hiện cả BE lẫn story này trong cùng
phiên, đã build + xác nhận qua `web-api-client.ts` regenerate.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `StaffTaxProfileCard.tsx` | Thêm field City/State/Zip, dropdown LLC sub-class (khi LLC), ô Other description (khi Other), checkbox backup withholding, nút "Certify" (mirror style nút Verify ở `StaffTaxProfileTab.tsx`) + hiển thị trạng thái certify |
| Component | `StaffTaxProfileTab.tsx` (Owner) — `StaffTinCell` | Hiển thị thêm City/State/Zip, LLC sub-class/Other description, trạng thái certify, cờ backup withholding |
| Data hook | `useTaxiqStaffTaxYear.ts` | Thêm `useCertifyW9Record()` (invalidate `qk.taxiqStaffTaxProfile()`) |
| Repository | `taxiqStaffTaxYear.ts` | Mở rộng `W9RecordApiDto`/`W9Record`/`UpsertW9RecordParams`; thêm `certifyW9Record()` |
| Repository | `taxiqOwnerPayouts.ts` | Mở rộng `StaffTinApiDto`/`StaffTin` với field W9 mới |
| Khác | `errorCodes.ts` | Thêm `TAXIQ_W9_NOT_READY_FOR_CERTIFICATION` |
| Khác | `locales/en.json`, `locales/vi.json` | Thêm label City/State/Zip/LLC sub-class/Other description/backup withholding/Certify button/certified notice; thêm `taxClassifications.trustEstate`/`.other`; namespace mới `llcTaxClassifications.c/s/p`; error message mới |

## Definition of Done

- [x] Code integrate xong theo API Mapping ở trên
- [ ] AC pass trên môi trường dev (API thật) — chưa chạy được, không có backend local trong phiên này
- [ ] API call đúng contract đã map (verify bằng network) — chưa verify
- [ ] Mutation invalidate đúng query cache — đã wire `invalidateQueries(qk.taxiqStaffTaxProfile())`, chưa verify runtime
- [x] `npx tsc --noEmit` sạch trong các file đã sửa (lỗi còn lại trong output là pre-existing, không liên quan — đã grep xác nhận không đụng file nào trong US này)
- [x] `vite build --mode development` thành công
- [ ] Không console error — chưa verify qua browser thật
- [ ] Test theo 3 layer (skill feature-focused-tester)
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

**2026-07-23**: Implement toàn bộ theo FE Surface ở trên, cùng phiên với BE (US-017 tương tự pattern).
Chưa có backend local chạy để smoke test qua Playwright — rủi ro còn lại: chưa xác nhận runtime behavior
của nút Certify khi thiếu điều kiện (message lỗi hiển thị đúng chưa), và chưa xác nhận UI re-render đúng
khi `certificationAccepted` bị BE tự revert sau khi Save W-9 info.
