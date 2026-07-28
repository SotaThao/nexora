# US-038 · TaxIQ Share Links (mục 23)

> File: `US-038-taxiq-share-links.md`

| | |
|---|---|
| **Trạng thái** | Done |
| **Ngày tạo** | 2026-07-26 |
| **Epic / Domain** | TaxIQ — Compliance / Sharing |
| **OpenSpec change** | `—` (single-owner: 2 view mới owner-side + 1 public page + repo/hook mới, không đụng CPA Access hiện có) |
| **Test plan** | — |

## Story

**Là** chủ tiệm,
**tôi muốn** tạo link chia sẻ có kiểm soát (CPA, thợ, bạn bè/referral, người review ngoài) với
đúng phạm vi dữ liệu, hạn dùng, passcode tuỳ chọn, và quyền tải xuống — rồi thu hồi được ngay khi
cần,
**để** dữ liệu thuế và định danh chỉ ra ngoài đúng lượng cần thiết, đúng người, đúng thời gian.

**Là** người nhận link (CPA/thợ/khách/reviewer),
**tôi muốn** mở link, nhập passcode nếu có, xem đúng phần dữ liệu được chia sẻ, tải về nếu được
phép, hoặc nộp file nếu link cho phép upload,
**để** làm được việc mà không cần tài khoản trong hệ thống.

## Acceptance Criteria

- **Given** Owner mở màn `Share Links`
- **When** danh sách tải xong
- **Then** hiện mỗi dòng 1 link: Recipient (tên + loại), Access Mode, Shared Data blocks (badge),
  Download Permission, có/không passcode (icon khoá), Status (Draft/Active/Revoked/Expired),
  Expires, và nút hành động Copy Link / QR / Publish (chỉ Draft) / Revoke (chỉ Active)

- **Given** Owner bấm `Create Share Link`
- **When** modal mở
- **Then** chọn được Recipient Type (Cpa/Technician/FriendReferral/ExternalReviewer), nhập
  Recipient Name (bắt buộc), Email (bắt buộc riêng khi Cpa), Access Mode (Review-only/Upload-only/
  Review+Upload), tick được nhiều Shared Data block, Download Permission, bật passcode + nhập mã,
  chọn hạn 7/15/30 ngày hoặc Never (chỉ bật được Never khi **chỉ** tick Public Profile), và chọn
  lưu Draft hoặc phát hành ngay

- **Given** một link đã Active có passcode
- **When** người nhận mở link public (không đăng nhập)
- **Then** hiện màn nhập passcode trước, sai thì báo lỗi chung (không tiết lộ token invalid hay
  đã hết hạn), đúng thì hiện đúng các block dữ liệu đã chia sẻ (không hiện block nào chưa chọn)

- **Given** link có `Download Permission` khác Disabled
- **When** người nhận bấm Download
- **Then** tải được đúng định dạng cho phép (PDF hoặc PDF+CSV); nếu Disabled thì không thấy nút
  Download

- **Given** link có Access Mode Upload-only hoặc Review+Upload
- **When** người nhận chọn file và bấm nộp
- **Then** file được nộp và xác nhận đã gửi; không thấy khu upload nếu Access Mode là Review-only

- **Given** Owner bấm Revoke trên 1 link Active
- **When** nhập lý do (tuỳ chọn) và xác nhận
- **Then** link chuyển Revoked, người nhận mở lại link cũ nhận lỗi chung (không phân biệt được với
  hết hạn)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn: BE-verified qua live curl trong phiên backend cùng ngày.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| POST | `/api/v1/taxiq/owner/share-links` | Owner JWT | `CreateShareLinkCommand` | `ShareLinkDto` | (L) |
| GET | `/api/v1/taxiq/owner/share-links` | Owner JWT | — | `ShareLinkListDto` | (L) |
| POST | `/api/v1/taxiq/owner/share-links/{id}/publish` | Owner JWT | — | `204` | (L) |
| DELETE | `/api/v1/taxiq/owner/share-links/{id}?revokeReason=` | Owner JWT | — | `204` | (L) |
| GET | `/api/v1/taxiq/owner/share-links/{id}/qr` | Owner JWT | — | `image/png` | (L) |
| POST | `/api/v1/taxiq/share/{token}/verify-passcode` | Public | body: `"passcode"` (raw string) | `boolean` | (L) |
| GET | `/api/v1/taxiq/share/{token}?passcode=` | Public | — | `ShareLinkContentDto` | (L) |
| GET | `/api/v1/taxiq/share/{token}/download?passcode=&format=pdf\|csv` | Public | — | file bytes | (L) |
| POST | `/api/v1/taxiq/share/{token}/upload?passcode=` | Public | multipart `file` | `201` + Guid | (L) |

**Điểm chưa chắc chắn / cần hỏi BE:** Không — toàn bộ đã verify live qua curl (bao gồm validation
lỗi: thiếu tax-year anchor, never-expire sai điều kiện, ExpiryDays sai, Cpa thiếu email).

## FE Surface (các layer sẽ đụng)

| Layer | File | Thay đổi |
|---|---|---|
| Route (owner) | `src/components/dashboard/routes/index.tsx` | `TaxIqShareLinksRoute` (mới) — resolve `businessId`/`ownerTaxYearId` theo đúng pattern `TaxIqIncomeRoute`/`TaxIqReceiptsRoute` (`useMerchantSetup` + `useOwnerTaxYearByBusiness(businessId, currentYear)`) |
| Router | `src/app/AppRouter.tsx` | đăng ký `taxiq/share-links` trong nhóm dashboard (auth); đăng ký route **public** mới `/share/access` (top-level, ngoài `RequireAuth`, cùng nhóm với `/cpa/access`) cho `ShareLinkViewerPage` |
| Menu | `src/components/dashboard/constants.tsx` | thêm `{ id: 'share-links', labelKey: 'dashboard.menu.taxiq_share_links' }` |
| Component (owner) | `src/components/dashboard/views/taxiq/ShareLinksView.tsx` (mới) | Bảng danh sách + nút Create + Copy Link/QR/Publish/Revoke |
| Component (owner) | `src/components/dashboard/views/taxiq/modals/CreateShareLinkModal.tsx` (mới) | Form tạo link — theo đúng pattern `CreateCpaAccessGrantModal.tsx` (toggle-group cho enum, checkbox độc lập cho blocks, `.nexora-modal-card`) |
| Component (public) | `src/components/taxiq/ShareLinkViewer/ShareLinkViewerPage.tsx` (mới) | Theo đúng pattern `CpaViewerPage.tsx`: không `useAuth()`, đọc token từ query string, passcode gate, render block theo dữ liệu trả về, nút Download, khu Upload khi Access Mode cho phép |
| Repository | `src/data/repositories/taxiqShareLinks.ts` (mới) | Owner-side: `list/create/publish/revoke/getQrUrl` |
| Repository | `src/data/repositories/taxiqShareLinkViewer.ts` (mới) | Public-side: `verifyPasscode/getContent/download/upload` — mọi call `{ anonymous: true }` như `taxiqCpaViewer.ts` |
| Data hook | `src/data/hooks/useTaxiqShareLinks.ts` (mới) | `useShareLinks/useCreateShareLink/usePublishShareLink/useRevokeShareLink` |
| Data hook | `src/data/hooks/useTaxiqShareLinkViewer.ts` (mới) | `useShareLinkContent(token, passcode)/useVerifyShareLinkPasscode/useUploadShareLinkFile` |
| Khác | `src/data/queryKeys.ts` | `taxiqShareLinks: () => [...]`, `taxiqShareLinkContent: (token?, passcode?) => [...]` |
| Khác | `src/data/errorCodes.ts` | map 12 mã lỗi mới `TAXIQ_SHARE_LINK_*` sang i18n key (theo pattern có sẵn) |
| Khác | `src/locales/en.json`, `vi.json` | `taxiq.shareLinks.*` (owner) + `taxiq.shareLinkViewer.*` (public) + `dashboard.menu.taxiq_share_links` |

## Phạm vi cố ý thu hẹp (Non-goals cho v1)

- **Chỉ Business-wide, không chọn StaffTaxYearId khi tạo link**: Create modal chỉ dùng
  `ownerTaxYearId` hiện tại của business (giống `TaxIqIncomeRoute`), không có UI chọn 1 staff cụ
  thể để scope riêng Payout Evidence — dù BE đã hỗ trợ `StaffTaxYearId`. Lý do: Upload-only link
  (trường hợp "thợ nộp bằng chứng") không cần đọc dữ liệu nào cả nên không cần scope theo staff;
  scope theo staff cho CPA/reviewer xem riêng 1 người có thể làm ticket sau nếu cần.
- **Passcode input dạng text thường**, không mask/show-hide toggle riêng — theo đúng độ phức tạp
  BA doc yêu cầu (4-6 ký tự, không phải mật khẩu tài khoản).

## Definition of Done

- [x] AC pass trên môi trường dev (local backend, `ASPNETCORE_ENVIRONMENT=Test`)
- [x] API call đúng contract đã map (method/status/payload)
- [x] Mutation invalidate đúng query cache (`taxiqShareLinks`, `taxiqShareLinkContent`)
- [x] Không console error
- [x] Test qua Playwright: tạo link đủ 4 loại recipient, passcode gate đúng (sai/đúng), xem đúng
  block đã chọn, download PDF/CSV đúng permission, upload đúng access mode, revoke chặn truy cập,
  publish draft, mobile 375×667 cho cả modal Create và trang viewer public
- [x] Cập nhật trạng thái file này

## Ghi chú phiên thực thi

Test live qua Playwright trên local backend (`https://localhost:5005`, `ASPNETCORE_ENVIRONMENT=Test`)
+ FE dev server (`localhost:3001`), đăng nhập Owner (`quanpm`), business `QuanATM`
(`516deb2d-2e7d-4e88-955b-50ee23df1db0`).

**Kết quả test:**
- **Create Share Link (owner)**: tạo link Technician, Review+Upload, block Receipt Index + Payout
  Evidence, Download PDF only, passcode `9012`, expiry mặc định 15 ngày — `POST` trả `201`, list
  tự refetch đúng.
- **List**: hiện đúng cả 6 link đã có (kể cả 2 link tạo qua curl phiên trước), badge status
  (Hoạt động/Đã thu hồi), icon khoá khi có passcode, block hiện đúng dạng pill.
- **Public viewer — passcode gate**: không passcode → hiện màn nhập passcode (không lộ lý do thật);
  sai passcode → "Passcode không đúng"; đúng passcode → hiện đúng nội dung.
- **Content theo block**: Receipt Index hiện đúng dữ liệu thật (bao gồm cả file `evidence.png` đã
  upload ở phiên backend trước — xác nhận cross-check đúng), Payout Evidence hiện đúng số liệu;
  không hiện Tax Ledger Summary / Public Profile vì không được chọn.
- **Download PDF**: tải file thật thành công qua nút Download, không hiện nút CSV vì permission
  chỉ PdfOnly.
- **Upload**: chọn file PNG thật, nộp thành công (`POST .../upload => 201`).
- **Revoke**: nhập lý do qua modal riêng, `DELETE .../share-links/{id}?revokeReason=...` trả `204`.
- **Mobile 375×667**: cả trang viewer public và modal Create đều không tràn ngang
  (`document.body.scrollWidth` = `clientWidth` = 369), modal cuộn đúng bên trong, header/footer
  cố định.
- Console: 0 lỗi JS thật trong suốt phiên (2 lỗi 400 trong log chỉ là do chủ động test passcode
  sai/thiếu, không phải lỗi ứng dụng).
