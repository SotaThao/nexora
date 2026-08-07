# US-022 · POS Sales Tax Rate Setting

> File: `US-022-pos-sales-tax-rate-setting.md` · 1 file = 1 story.

| | |
|---|---|
| **Trạng thái** | Integrated |
| **Ngày tạo** | 2026-07-20 |
| **Epic / Domain** | POS Merchant Ops — Checkout (Sales Tax) |
| **OpenSpec change** | `—` (mở rộng field có sẵn trên Business Info card, cùng pattern US-014, không đụng shared layer auth/httpClient) |
| **Test plan** | — (điền khi viết test) |

## Story

**Là** Business Owner (Merchant),
**tôi muốn** tự nhập thuế suất bán hàng (sales tax rate %) của salon,
**để** màn hình Checkout (POS) tính đúng dòng Sales tax trên mỗi ticket.

Nguồn: `docs/plan/tasks/pos/US-11-pos-sales-tax-rate-setting.md` (backend repo `vlink-nexora`), backend cho story này đã implement cùng session (2026-07-20): `UpdateBusinessInfoCommand.cs`, `BusinessDto.cs`.

## Acceptance Criteria

- **Given** Owner đang ở Settings → Profile (hoặc POS → General Settings) tab, card "Business Information" đang ở chế độ edit
- **When** Owner nhập thuế suất (0-100) và bấm Save
- **Then** FE gọi `PUT /api/v1/merchant/business/info` với field `salesTaxRatePercent` kèm các field hiện có; API trả 200; card hiển thị giá trị mới sau khi cache được invalidate

- **Given** Owner để trống thuế suất
- **When** Owner bấm Save
- **Then** FE gửi `salesTaxRatePercent: undefined` (không bắt buộc), lưu thành công — BE coi null là 0% khi Checkout tính thuế (không phải lỗi)

- **Given** Owner nhập giá trị ngoài khoảng 0-100 (âm hoặc >100)
- **When** Owner bấm Save
- **Then** FE validate tại client (không gọi API) và hiển thị lỗi tương ứng — BE cũng validate lại (400, error code `BUSINESS_SALES_TAX_RATE_PERCENT_INVALID`) nếu FE validate bị bỏ qua

## API Mapping (bắt buộc trước khi integrate)

> Contract build cùng session ở backend repo (`vlink-nexora/backend`) — **chưa deploy lên `test-api.nexoratouch.com`**, tag nguồn (L-local): verify bằng `dotnet build` (NSwag regenerate `specification.json`/`web-api-client.ts`), chưa verify qua live Swagger. Cần re-verify qua live Swagger sau khi backend deploy trước khi coi là (L) chính thức.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| PUT | `/api/v1/merchant/business/info` | Bearer (Merchant) | `{ name, phone?, feedbackEmail?, website?, bookingNotificationPhone?, salesTaxRatePercent? }` (field `salesTaxRatePercent` mới thêm, decimal 0-100) | `200 boolean` | L-local |
| GET | `/api/v1/merchant/business` | Bearer (Merchant) | — | `200 BusinessDto` (nay có thêm `salesTaxRatePercent`) | L-local |

**Điểm đã xác nhận qua `web-api-client.ts` vừa regenerate**: `salesTaxRatePercent` là `number | undefined` (nullable decimal), camelCase, có trên cả `UpdateBusinessInfoCommand` và `BusinessDto`.

**Còn lại cần xác nhận khi integrate:** re-check contract qua live Swagger sau khi BE deploy lên dev/test.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Component | `src/components/settings/BusinessInfoCard.tsx` | Thêm field "Sales Tax Rate (%)" vào edit mode + view mode, cạnh Booking Notification Phone |
| Data hook | `src/components/settings/hooks/useBusinessInfoForm.ts` | Thêm `salesTaxRatePercent` vào `BusinessInfo`, `businessInfo` mapping, `businessForm`, validate range 0-100, payload gửi lên mutation |
| Data hook | `src/data/hooks/useMerchantSetup.ts` | `useUpdateBusinessInfo` mutation type thêm `salesTaxRatePercent?: number` |
| Repository | `src/data/repositories/merchants.ts` | `mapBusinessApiDtoToSetup` map `res.salesTaxRatePercent`; `updateBusinessInfo(dto)` thêm field |
| Types | `src/types/repositories.ts`, `src/types/domain.ts` | Thêm `salesTaxRatePercent?: number` vào `BusinessApiDto` và `MerchantSetup['businessInfo']` |
| i18n | `src/locales/en.json`, `src/locales/vi.json` | Key mới `components.settings.tabs.ProfileTab.salesTaxRatePercent` (+ hint) và `validation.salesTaxRatePercent` |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật — cần backend deploy trước)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache (`qk.merchantSetup()`)
- [ ] Không console error
- [ ] Test theo 3 layer (skill feature-focused-tester): L1 UI / L2 data boundary / L3 flow
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

- FE code đã integrate xong (2026-07-20): tất cả layer trong FE Surface đã implement đúng như liệt kê, cộng thêm 2 file không nằm trong danh sách ban đầu vì cần sync theo state riêng của `useSettingsForm.ts` (`profile` object dùng cho view mode ở `ProfileTab.tsx`) — không phải lỗi thiếu sót, chỉ là repo có 2 nguồn hiển thị dữ liệu business info (`businessInfoForm.businessInfo` cho POS General Settings, `profile` riêng của `useSettingsForm` cho Settings > Profile).
- Verify: `npx tsc --noEmit` so sánh git-stash-baseline — 105 dòng lỗi giống hệt nhau trước/sau, chỉ khác cosmetic ("16 more" → "17 more" trong message TS2739 do object literal có thêm 1 field) ở 3 lỗi có sẵn không liên quan (thiếu `logoUrl`/`handleLogoChange`/`isUploadingLogo` ở `SettingsView.desktop.tsx`/`.mobile.tsx`). Không có lỗi mới.
- `npx vite build --mode production`: build thành công, chỉ có warning chunk-size có sẵn từ trước.
- Chưa làm được (do backend chưa deploy lên dev/test server, chỉ chạy local): AC trên môi trường dev với API thật, verify network trace, test 3-layer, mobile screenshot.
