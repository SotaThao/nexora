# US-048 · Xem chứng chỉ NEXORA TOUCH (trang public + My Certifications)

> File: `US-048-certificate-public-page.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (chưa Tested — **BE chưa deploy**, xem "Ghi chú phiên thực thi") |
| **Ngày tạo** | 2026-09-08 |
| **Epic / Domain** | Certifications — trang public xem chứng chỉ + My Certifications |
| **OpenSpec change** | `—` (feature độc lập, không sửa shared layer nào) |
| **Test plan** | (điền khi viết TC) |

## Story

**Là** người quét mã QR trên một chứng chỉ NEXORA TOUCH đã in (hoặc người được đưa link chứng chỉ),
**tôi muốn** mở `/certificate/{mã}` và thấy đúng nội dung chứng chỉ đó,
**để** chủ salon có thể chứng minh trình độ với khách bằng một đường link thay vì một tờ giấy.

## Phạm vi

Đây là hạng mục cuối của tính năng Certifications. Backend và Admin Portal (`vlink-nexora/frontend`) **đã implement xong**; phần này là mảnh còn thiếu được tài liệu kỹ thuật đánh dấu *"Public verify page (`vlink-nexora-fe`) — chưa bắt đầu"*.

**Chốt phạm vi (2026-09-08)**: trang này là **trang xem chứng chỉ**, không phải công cụ xác minh. Có mã đúng trong URL thì hiện chứng chỉ — hết. Không banner phán quyết, không ô nhập mã tay, không route `/certificate` trống, không header "Certificate verification".

**Chốt lần 2 (cùng ngày)**: cả trang public **và** My Certifications đều render chứng chỉ bằng **canvas trên ảnh mẫu**. Bản dựng bằng CSS (`CertificateDocument.tsx`) đã bị xoá — hai cách render đã bắt đầu lệch nhau (ảnh mẫu mới ghi "OF ACHIEVEMENT", bản CSS ghi "of certification"), giờ chỉ còn một nguồn sự thật.

| # | Yêu cầu từ tài liệu | Trạng thái |
|---|---|---|
| 1 | Route `/certificate/:certificateId` **ngoài** `RequireAuth` | ✅ |
| 2 | Đọc `certificateId` từ `useParams`, gọi `GET /api/v1/public/certifications/{certificateId}` | ✅ |
| 3 | Render 4 trạng thái khác biệt rõ ràng | ✅ nhưng **đã giảm mức**: chứng chỉ tốt thì hiện trơn, không thêm gì. Thu hồi / hết hạn thì có stamp + **một dòng** nêu ngày. Không tìm thấy thì không render chứng chỉ nào |
| 4 | 404 phải hiểu là "không có chứng chỉ với mã này", không phải error toast | ✅ (interceptor của repo không toast 404 — đã verify `httpClient.ts` chỉ xử lý riêng 401) |
| 5 | ~~Ô nhập mã tay~~ | ❌ **bỏ theo yêu cầu** — thuộc luồng verify, không phải xem chứng chỉ |
| 6 | Base URL khớp `SystemOptions.FrontEndUrl` để QR sinh ở backend resolve đúng | ✅ path `/certificate/{certificateId}` đúng theo `CertificateVerificationLink.Build` |

### Vì sao vẫn giữ dấu thu hồi / hết hạn

Đây là **thông tin của chính chứng chỉ** (`status` là một field của nó), không phải chrome verify do trang thêm vào. Nếu bỏ hẳn, một chứng chỉ đã bị thu hồi sẽ render y như chứng chỉ còn hiệu lực — và cái link đó trở thành bằng chứng cho một điều không còn đúng. Mức can thiệp đã hạ xuống tối thiểu: stamp trên document + một dòng nêu ngày, bỏ toàn bộ ngôn ngữ phán quyết kiểu "Genuine and valid".

## UI khớp mẫu in 1:1

Vì chứng chỉ **chính là ảnh mẫu** cộng 5 giá trị vẽ lên, không còn chỗ nào lệch: khung, chữ ký, seal có vòng nguyệt quế, dòng lề, thanh footer đều là artwork thật. Ba thứ trước đây phải bỏ hoặc thay thế khi dựng bằng CSS (QR, ảnh chữ ký, laurel của seal) giờ có sẵn trong ảnh.

Đánh đổi: chứng chỉ là **ảnh của chữ** — không select/copy/search được, screen reader không đọc được, và mất hẳn nếu vẽ lỗi. Bù lại bằng `CertificateFacts` (khối chữ thật ngay dưới canvas) + `role="img"` với `aria-label` mang tên/chương trình/mã.

### Cột `EXAM SCORE` — đã render, nhưng BE chưa có field

Cột `EXAM SCORE` ("94 / 100") của mẫu in **đã được implement** theo yêu cầu, đứng đầu hàng meta đúng như mẫu. Nhưng:

- **Backend chưa có field điểm thi nào.** `Certificate` entity không có cột score, `CertificateVerificationDto` không có field score. Đã dò lại toàn bộ `components.schemas` của Swagger live: mọi field khớp `score|exam|grade` đều thuộc TaxIQ readiness (`ownerCpaScore`, `staffTaxScore`, `cpaReadyScore`…), **không liên quan**.
- FE đọc `examScore` (+ `examScoreMax` tuỳ chọn) dạng **optional**. **Không bao giờ bịa số** để lấp layout — không có `0 / 100` giả.
- Hệ quả hôm nay: **cột này vô hình** cho tới khi BE thêm field. Không có gì hỏng, nhưng cũng chưa thấy được trên môi trường thật.
- Trên canvas, ô EXAM SCORE **luôn có nhãn** (nhãn in cứng trong ảnh) nên khi thiếu điểm thì vẽ `—`, không để trống. Ở khối `CertificateFacts` ngoài canvas thì ngược lại: bỏ hẳn dòng đó, vì ngoài artwork một dòng rỗng chỉ là rác.
- **Tên field là FE tự đặt, cần BE chốt** — xem "cần hỏi BE" #5.

Ngoài ra **không load webfont**: mặt chữ display fallback về Georgia (mọi OS đích đều có) để không thêm request mạng vào một trang public.

## Bổ sung: "My Certifications" (menu tài khoản) + chứng chỉ render bằng canvas

Yêu cầu 2026-09-08: thêm mục **My Certifications** vào menu tài khoản/avatar (không đặt trong POS, Tips hay TaxIQ vì chứng chỉ gắn với cá nhân), và dùng ảnh mẫu chứng chỉ (bản PNG thiết kế được gửi kèm trong phiên) làm nền canvas rồi vẽ **id, ngày, họ tên, QR, điểm thi** vào.

| Hạng mục | Chốt |
|---|---|
| Vị trí menu (merchant) | Dropdown avatar ở `DashboardHeader.desktop.tsx` + `.mobile.tsx`, ngay trên "Sign out". **Không** là `DASHBOARD_MENU_ID` → không bao giờ xuất hiện ở sidebar |
| Vị trí menu (staff) | Dropdown avatar ở `StaffHeader.desktop.tsx`, và khối account của `StaffSidebar.tsx` (nơi menu account của staff sống trên mobile). Route `/staff/certifications` |
| Dùng chung | Một screen `src/components/certificate/MyCertificationsView.tsx` cho **cả hai** dashboard — chứng chỉ cấp cho `RecipientUserProfileId`, và cả merchant lẫn staff đều là người có `UserProfile` |
| Route | `/dashboard/certifications` (`MY_CERTIFICATIONS_PATH` trong `dashboard/constants.tsx`), trong `RequireAuth`, **không** gate KYB/verification vì nó là dữ liệu cá nhân |
| Cách render | Canvas: ảnh mẫu làm nền + vẽ 5 slot, **dùng cho cả trang public**. Ảnh mẫu là nguồn sự thật của layout → đổi thiết kế là đổi ảnh, không sửa code |
| Asset (ảnh) | `public/images/certificate-template.webp` — **119 KB**, re-encode từ bản PNG thiết kế (1373 KB, ~11.5×). Repo không có pipeline tối ưu ảnh và AGENTS.md đặt ngưỡng ~150 KB, nên PNG gốc **không được commit**: nó đã bị xoá khỏi `public/images/` sau khi tạo bản WebP. Muốn dựng lại thì lấy PNG thiết kế rồi re-encode |
| Asset (font) | `public/fonts/playfair-display-{normal,italic}-{latin,latin-ext,vietnamese}.woff2` — 6 file, 137 KB, load theo yêu cầu và theo subset nên không tải hết cùng lúc |
| Toạ độ | **Đo từ chính ảnh**, không ước lượng: ô QR tìm bằng cách quét hình chữ nhật trắng (`1257,839` `128×123`), 3 cột meta tìm bằng cách quét 3 cụm nhãn (tâm `x=343 / 690 / 1034`, nhãn ở `y=799..808`), khe tên là khoảng trống `y=427..572`. Lưu dạng **phân số** của ảnh nên vẫn đúng nếu ảnh được xuất lại ở độ phân giải khác |
| QR | Sinh **local** bằng package `qrcode` đã có trong repo, không gọi ảnh QR từ service ngoài — ảnh ngoài sẽ taint canvas và làm `toBlob` (nút Download) throw |
| Độ phân giải | Vẽ ở **2×** ảnh mẫu (2854×2204), CSS thu nhỏ lại. 1× cho QR ~113px — mỏng khi in |
| Tải về | Nút **Download certificate** → PNG (~2–4 MB ở 2×), có ở cả hai trang |
| Thu hồi / hết hạn | Vẽ **lên canvas**: ảnh xám hoá (`ctx.filter`) + stamp REVOKED/EXPIRED in hoa, đặt lệch xuống khối mô tả để không che tên. Vẽ lên canvas chứ không overlay CSS vì **ảnh tải về cũng phải mang dấu** — một bản PNG của chứng chỉ đã thu hồi mà trông nguyên vẹn chính là thứ cần tránh |

### Vì sao không đặt trong POS / Tips / TaxIQ

Ba module đó đều scope theo salon (businessId). Chứng chỉ scope theo `RecipientUserProfileId` — một con người. Đặt nó dưới POS nghĩa là một người có 2 salon sẽ thấy chứng chỉ của mình lặp 2 lần, hoặc mất khi họ rời salon.

## Acceptance Criteria

- **Given** một chứng chỉ đã cấp và còn hiệu lực
  **When** mở `/certificate/NXT-CS-2026-0001`
  **Then** `GET /api/v1/public/certifications/NXT-CS-2026-0001` → 200; chứng chỉ render đầy đủ màu và **không có gì thêm** — không banner, không stamp, không ô nhập mã, không nút nào

- **Given** chứng chỉ đã hết hạn (`status: "Expired"` — BE tự compute từ `ExpiryDate`, không cần job)
  **When** mở trang
  **Then** một dòng vàng "This certificate expired on {ngày}."; chứng chỉ bị giảm bão hoà + stamp **EXPIRED** chéo, **nhưng vẫn hiện đầy đủ** (người đó có đạt chứng chỉ thật)

- **Given** chứng chỉ đã bị thu hồi
  **When** mở trang
  **Then** một dòng đỏ nêu ngày thu hồi; chứng chỉ **grayscale** + stamp **REVOKED** chéo. **Không** hiện `revokeReason` (admin-only, không có trong DTO public). `revokedAt` null thì dùng câu không có ngày, không in ngày rỗng

- **Given** mã không tồn tại, **hoặc** chứng chỉ vẫn ở `Draft` (BE filter draft ra cùng một NotFound)
  **When** mở trang
  **Then** **không render chứng chỉ nào**; card "No certificate with this ID" nêu lại mã đã tra

- **Given** mở `/certificate/nxt-cs-2026-0001` (chữ thường)
  **When** trang load
  **Then** gọi API với `NXT-CS-2026-0001` — một chứng chỉ một cache entry, không đốt 2 trong 10 lượt/phút

- **Given** đã gọi quá 10 lượt/phút (rate limit `CertificationVerifyPublicPolicy`)
  **When** gọi tiếp
  **Then** 429 → màn **riêng biệt** "Too many checks from this connection", nói rõ *đây không phải kết quả về bản thân chứng chỉ*. Dùng `Retry-After` khi server có gửi

- **Given** mất mạng / không tới được server (`httpClient` trả `status: 0`)
  **When** mở trang
  **Then** màn **riêng biệt** "Could not reach the verification service" — tuyệt đối không báo "không tìm thấy chứng chỉ"

- **Given** `certificationDate: "2026-09-07"` và người xem ở múi giờ âm (US)
  **When** trang render
  **Then** hiện **Sep 07, 2026**, không phải Sep 06

## API Mapping

> Nguồn contract: **`certifications-technical.md`** — mô tả code backend đã implement thật (entity, DTO, controller, rate-limit policy), không phải thiết kế dự kiến. Tag: (D) doc kỹ thuật BE / (L) verify live.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/public/certifications/{certificateId}` | **AllowAnonymous** (`{ anonymous: true }`) | — | 200 `CertificateVerificationDto` · 404 không tìm thấy / draft · 429 rate limit | (D) |

`CertificateVerificationDto` → `CertificateVerificationApiDto` (`src/types/repositories.ts`):
`certificateId`, `memberName`, `programCode`, `programName`, `programDescription`, `certificationDate` (**DateOnly**), `expiryDate` (**DateOnly**, null = không hết hạn), `status` (= `EffectiveStatus`), `revokedAt` (**instant UTC**).

FE thêm hai field **chưa có trên BE**, optional, chỉ render khi có: `examScore?: number | null`, `examScoreMax?: number | null`.

**Không** có trong DTO (cố tình, BE lọc server-side): `recipientEmail`, `recipientUserProfileId`, `notes`, `revokeReason`.

**Điểm chưa chắc chắn / cần hỏi BE:**

1. **Endpoint chưa deploy ở đâu cả** → chưa verify được một request thật nào. Xem "Ghi chú phiên thực thi".
2. **`Retry-After` có được gửi kèm 429 không?** FE đã xử lý cả hai nhánh (có thì hiện số giây, không thì dùng câu chung), nên không chặn — nhưng cần biết để chốt copy.
3. **NotFound trả 404 hay 400?** Bảng route trong doc khai `200 / 400 / 429`, nhưng checklist kiểm thử của chính doc lại nói "chờ 404". FE hiện gộp **mọi** lỗi không phải 429/network vào một màn "không tìm thấy" (đúng chủ ý bảo mật của BE: draft và mã bịa không phân biệt được), nên cả hai mã đều ra đúng màn. Vẫn nên chốt để viết TC.
4. **`SystemOptions.FrontEndUrl` mỗi môi trường trỏ đúng domain của repo này chưa?** QR sinh ở backend; nếu lệch, chứng chỉ đã in sẽ trỏ vào nơi không có trang này.
5. **Endpoint list chứng chỉ của tôi — BE chưa có.** Tài liệu kỹ thuật xếp *"Màn hình 'chứng chỉ của tôi' cho member — `RecipientUserProfileId` đã có sẵn để query, chưa có UI"* vào mục **Ngoài phạm vi**. Các endpoint `api/v1/Admin/certifications` gate bằng Admin policy nên member không gọi được, và endpoint public thì cần biết mã trước. FE đề xuất `GET /api/v1/certifications/me` trả về danh sách `CertificateVerificationDto`. Repository **chấp nhận cả 3 shape** (array trần, `{items}` kiểu `PaginatedList`, `{data}`) vì chưa chốt. Cần BE xác nhận: path, shape, và có phân trang không.
6. **Điểm thi — BE cần thêm field, và cần chốt shape.** Mẫu in có cột "94 / 100" nhưng BE hiện không lưu điểm ở đâu cả. FE đã render sẵn theo contract **tự đặt** dưới đây; nếu BE chọn tên/kiểu khác thì sửa đúng 2 chỗ (`CertificateVerificationApiDto` + `normalizeCertificate`):
   - `examScore: number?` — điểm đạt được, **`0` là giá trị hợp lệ** (FE đã xử lý riêng để `0` không bị coi là "không có điểm").
   - `examScoreMax: number?` — mẫu số. FE fallback về `CERTIFICATE_EXAM_SCORE_MAX_DEFAULT = 100` khi thiếu; nếu chương trình nào thang điểm khác 100 thì **BE phải gửi**, không thì FE báo sai (46/50 sẽ thành 46/100).
   - Cần xác nhận thêm: điểm thuộc `Certificate` (mỗi chứng chỉ một điểm) hay `CertificationProgram` (điểm sàn của chương trình)? Và điểm có được coi là dữ liệu công khai không — nếu là dữ liệu riêng của thành viên thì **không nên** trả ra endpoint public, và cột này phải bỏ khỏi trang verify.

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/app/AppRouter.tsx` | Lazy import + `/certificate` và `/certificate/:certificateId`, đặt ngoài `RequireAuth` |
| Component | `src/components/public/certificate/CertificatePage.tsx` | Trang public: phân loại kết quả (tốt / hết hạn / thu hồi / không tìm thấy / rate limit / mất mạng), rồi dùng đúng 3 component canvas dùng chung |

| Data hook | `src/data/hooks/usePublicCertificate.ts` | `retry: false` (404 vẫn là 404, và retry đốt quota 10 lượt/phút); `staleTime: 5 phút` |
| Repository | `src/data/repositories/publicCertificate.ts` | `verifyCertificate()` + normalize DTO (chỉ ở đây) |
| Query keys | `src/data/queryKeys.ts` | `publicCertificate(certificateId)` — key theo mã đã uppercase |
| Constants | `src/constants/certificate.ts` | `CertificateStatus` mirror enum BE (không hardcode string status), `CERTIFICATE_EXAM_SCORE_MAX_DEFAULT = 100` |
| Types | `src/types/repositories.ts` | `CertificateVerificationApiDto` |
| Component | `src/components/certificate/MyCertificationsView.tsx` | Trang My Certifications (dùng chung merchant + staff): picker khi có nhiều chứng chỉ, canvas, facts, link chia sẻ |
| Component | `src/components/certificate/CertificateFacts.tsx` | Khối chữ thật dưới canvas — canvas là ảnh của chữ nên đây là bản đọc/copy/screen-reader được |
| Component | `src/components/certificate/CertificateStatusNote.tsx` | Một dòng nêu ngày thu hồi / hết hạn (stamp không mang được ngày) |
| Component | `src/components/certificate/CertificateCanvasPreview.tsx` | Vẽ canvas trong effect (có AbortController), `role="img"` + `aria-label` mang đủ dữ kiện vì canvas là ảnh của chữ, nút Download |
| Render | `src/components/certificate/certificateCanvas.ts` | Toạ độ đo từ ảnh mẫu, fit cỡ chữ cho tên dài, QR sinh local, export blob |
| Data hook | `src/data/hooks/useMyCertificates.ts` | `retry: false` (endpoint chưa deploy), `staleTime` 5 phút |
| Repository | `src/data/repositories/myCertificates.ts` | `listMyCertificates()` + chịu được 3 shape payload |
| Route | `src/components/dashboard/routes/index.tsx`, `src/app/AppRouter.tsx` | `MyCertificationsRoute` + route `certifications` |
| Menu | `DashboardHeader.desktop.tsx`, `DashboardHeader.mobile.tsx` | Mục My Certifications trong dropdown avatar (merchant) |
| Menu | `StaffHeader.desktop.tsx`, `StaffSidebar.tsx` | Mục My Certifications trong menu account của staff |
| Xoá | ~~`CertificateDocument.tsx`~~ | Bản dựng bằng CSS — thay bằng canvas, 22 locale key mồ côi đã xoá khỏi cả hai file |
| Constants | `src/components/dashboard/constants.tsx` | `MY_CERTIFICATIONS_PATH` / `_SEGMENT` |
| Asset | `public/images/certificate-template.webp` | Ảnh mẫu đã nén 119 KB |
| Locales | `src/locales/en.json`, `vi.json` | `public.certificate.*` — 8 key (chỉ còn loading + 3 màn lỗi) · `certifications.*` — 21 key. EN/VI parity (15 key của luồng verify đã xoá khỏi cả hai file) |

### Chữ và ngày trên chứng chỉ — `formatCertificateDate` + Playfair Display

Hai thứ phải khớp mẫu in, cùng nằm trong `certificateCanvas.ts`:

- **Font: Playfair Display, ship kèm app** (`src/components/certificate/certificateFont.ts`). Không font hệ thống nào đủ gần: mẫu là serif contrast cao kiểu Didone, còn Times italic contrast thấp và hẹp hơn hẳn. Canvas chỉ vẽ được font mà document đã load thật, nên muốn khớp mẫu là phải ship font.
  - **Đã thử Bodoni Moda và revert.** Người dùng xác nhận trực tiếp mẫu dùng Bodoni Moda, và đã implement đủ (self-host, 2 font cho coverage tiếng Việt, `opsz` axis ghim qua `variationSettings` để giữ hairline ở cỡ chữ nhỏ). Nhưng canvas render ra **một số glyph bị mất nét** khi `variationSettings` ghim `opsz` khác giá trị mặc định — lỗi này chỉ lộ ra khi xem ảnh thật, không bắt được bằng test tự động (jsdom không có canvas 2D context). Người dùng báo lỗi bằng ảnh chụp, nên **revert về Playfair Display** — bản đã chạy ổn định trước đó — thay vì cố sửa tiếp một trục font-variation có rủi ro render cao. Toàn bộ 4 file `bodoni-moda-*.woff2` trong `public/fonts/` đã xoá.
  - **Self-host, không gọi Google Fonts.** Trang public được mở bằng cách quét QR trên giấy; chặn việc vẽ sau một request tới origin khác là đặt bản render vào tay bên thứ ba, và kéo bên thứ ba vào một trang ai cũng mở được. File là đúng các woff2 subset Google phục vụ; Playfair Display là SIL OFL nên self-host hợp lệ.
  - **Load theo yêu cầu, theo subset.** Không đăng ký gì cho tới khi có chứng chỉ được vẽ, nên không trang nào khác phải trả giá. `document.fonts.load(font, text)` được truyền đúng chuỗi cần vẽ để browser tự chọn subset theo `unicode-range`: tên ASCII kéo ~38 KB mỗi style, tên tiếng Việt thêm ~9 KB. Tổng 6 file trong `public/fonts/` là 137 KB nhưng không bao giờ tải hết cùng lúc.
  - **Lining figures phải bật bằng tay.** Playfair Display **mặc định dùng old-style figures** — 9, 4, 7 thò xuống baseline, 0 và 1 chỉ cao bằng x-height — nên "94 / 100" và "September 7, 2026" ra gồ ghề, còn mẫu thì mọi chữ số cao bằng nhau. Bật `featureSettings: '"lnum"'` trên FontFace; đã verify trong Chrome là canvas thật sự đổi glyph (bề rộng "90" đổi 74.28px → 78.06px), không chỉ nhận descriptor.
  - **Không bao giờ làm vỡ render.** Load thất bại hoặc browser không hỗ trợ thì trả `false` và renderer rơi về stack serif hệ thống (`"Times New Roman", Times, Georgia, serif` — Times trước Georgia vì Georgia cũng là old-style figures). Chứng chỉ sai serif là lỗi thẩm mỹ; chứng chỉ không vẽ ra được là trang hỏng. Có test cho nhánh này (jsdom không có `FontFace`).
  - **Weight**: tên 500, hàng meta và stamp 700 — chọn bằng cách render 400/500/600/700 rồi crop đúng dải tên trên sheet để so với mẫu. Nếu designer chốt khác thì sửa một chỗ: `TEMPLATE.weights`.

- **Ngày**: `formatCertificateDate()` cho ra **"September 7, 2026"** — tên tháng đầy đủ, ngày không pad 0, đúng như mẫu. **Luôn tiếng Anh** bất kể ngôn ngữ app, vì nhãn trên artwork được in bằng tiếng Anh ("CERTIFICATION DATE"): một ngày tiếng Việt nằm dưới nhãn tiếng Anh sẽ đọc như lỗi, không như bản dịch — cùng lý do trang receipt public là English-only.
- Ghim **UTC** cả lúc parse và lúc format. `new Date("2026-09-07")` là UTC midnight, render bằng getter local sẽ ra ngày 6 ở mọi múi giờ âm — tức toàn bộ thị trường US. Trên ngày cấp chứng chỉ, lệch một ngày là lỗi người dùng đối chiếu được với tờ giấy trong tay. Có test ghim `TZ=America/Los_Angeles` để chặn.
- **Cùng một formatter ở mọi nơi** ngày in trên chứng chỉ xuất hiện: canvas, `CertificateFacts`, và dòng "expired on" — nếu không, cùng một field sẽ hiện hai định dạng cạnh nhau trên cùng một trang. Riêng *ngày thu hồi* vẫn localize theo múi giờ người xem: đó là một thời điểm trong hệ thống, không phải ngày in trên giấy.

Không còn sửa gì trong `src/utils/localDate.ts`: hàm `formatApiDateOnly` từng thêm ở đây đã bị bỏ khi mọi ngày của chứng chỉ chuyển sang `formatCertificateDate`, nên shared util về nguyên bản.

`formatDateOnly` cũ **không bị sửa** (nhiều caller khác đang dùng, ngoài scope) — nhưng nó có cùng lỗi này với mọi giá trị DateOnly, đáng mở ticket riêng.

## Definition of Done

- [x] Route đặt đúng ngoài `RequireAuth`, chunk tách riêng (`CertificatePage-*.js` trong build output)
- [x] Đi đúng data boundary: component → hook → repository → httpClient; normalize chỉ ở repository
- [x] Không hardcode enum status của BE (dùng `src/constants/certificate.ts`)
- [x] Locale EN/VI đủ và parity (8/8 + 21/21, không key thừa, không key thiếu — reconcile bằng script quét key thật trong code)
- [x] `pnpm build` pass · `pnpm typecheck` không thêm lỗi mới (49 lỗi, đúng baseline)
- [x] Không console error; không overflow ngang ở 1440px và 375px (verify bằng Chrome thật, 11 lần render)
- [x] Test: 4 test `certificateFont` (degradation khi không có Font Loading API + thứ tự fallback) + 14 test `certificateCanvas` (URL, điểm, tên file, `formatCertificateDate` có ghim TZ âm) + 10 test repository `myCertificates` (3 shape payload + bẫy `0`) + 8 test repository `publicCertificate` + 18 test component trang public = **54 pass**
- [ ] **AC pass trên API thật** — chặn: endpoint chưa deploy
- [ ] Cập nhật trạng thái file này + link TC

## Ghi chú phiên thực thi

**2026-09-08 — FE xong, chưa verify được với BE thật.**

- **Endpoint chưa tồn tại ở bất kỳ đâu.** Đã dò Swagger live `test-api` (675 path): **0 path** khớp `certif` ngoài `/api/v1/taxiq/staff/tax-profile/w9/certify` (không liên quan), **0 schema** nào tên `*Certificate*`. Không có BE local nào chạy (`localhost:5005`, `:5000` đều down). Khớp với chính tài liệu kỹ thuật: *"migration `AddCertifications` chưa được apply lên bất kỳ database nào"* và *"chưa có request nào chạy thật"*.
- Vì contract được mô tả từ **code BE đã implement** (entity + DTO + controller + policy) chứ không phải đoán, FE đi trước là hợp lý. Nhưng **toàn bộ luồng chưa được gọi một lần nào** — đây là hạng mục kiểm thử đầu tiên khi BE có môi trường.
- **Verify bằng cách nào**: chạy dev server rồi dùng Chrome + Playwright route-mock, fulfill response theo đúng DTO trong tài liệu, chụp 11 màn (5 case × 2 viewport + màn nhập mã). Kết quả: 0 console error của app, 0 overflow ngang, 4 trạng thái phân biệt rõ. Đây là kiểm thử **rendering**, không phải kiểm thử **contract**.
- **Hai test file mới sẽ không vào repo nếu `git add` thường**: `.gitignore` dòng 57–62 ignore `*.test.*` (và dòng 29 ignore `tests/`). Cả repo hiện chỉ có **4** test file được track. Phải `git add -f` khi commit, nếu không test bị bỏ âm thầm.
- **Baseline test đỏ sẵn**: `pnpm test` → 18 fail / 416 pass, tập trung ở 5 file (POS receipt + OneQR). Đã verify bằng `git stash`: đúng 18 fail đó cũng xảy ra trên tree sạch → không do story này.
- **Bổ sung cùng ngày — cột điểm thi.** Được yêu cầu thêm sau khi trang đã xong. Đã dò lại Swagger để chắc chắn: không có field điểm nào cho `Certificate`. Nên FE render **có điều kiện** theo contract tự đặt (`examScore`, `examScoreMax`) — chạy được ngay khi BE bắt đầu gửi, và hôm nay thì cột đó không xuất hiện. Đã verify layout 4 ô bằng Chrome ở 1440px (một dòng, có gạch dọc) và 820px (lưới 2×2, không gạch). Ưu tiên hỏi BE: xem "cần hỏi BE" #5, gồm cả câu hỏi **điểm thi có nên là dữ liệu công khai hay không**.
- **Thu gọn phạm vi cùng ngày — bỏ luồng verify.** Yêu cầu chốt lại: có id đúng thì show chứng chỉ, không cần verify. Đã xoá `CertificateLookupForm.tsx`, route `/certificate` trống, banner phán quyết, header trang, `CERTIFICATE_ID_MAX_LENGTH`, và 15 locale key thành mồ côi. `CertificateVerifyPage.tsx` → `CertificatePage.tsx`. Giữ lại stamp + một dòng ngày cho chứng chỉ thu hồi/hết hạn — lý do ở mục "Vì sao vẫn giữ dấu thu hồi / hết hạn" phía trên; **nếu bạn muốn bỏ luôn thì xoá `CertificateStatusNote` khỏi hai trang và nhánh `stamp` trong `certificateCanvas.ts`.**
- **Bổ sung cùng ngày — My Certifications + canvas.** Menu vào dropdown avatar (desktop + mobile), route `/dashboard/certifications`. Chứng chỉ được vẽ lên ảnh mẫu bằng canvas thay vì dựng bằng CSS → khớp brand tuyệt đối và tải về được thành PNG.
  - **Verify canvas bằng Chrome thật** (trang cần đăng nhập nên import module trực tiếp qua Vite dev): 3 case (đủ điểm / không điểm / tên rất dài 36 ký tự) đều vẽ đúng slot, tên dài tự thu nhỏ và không tràn khung, 0 page error, export blob thành công.
  - **QR đã decode lại bằng `jsqr`** (reader có sẵn trong repo) ở cả scale 1× và 2× → đọc ra đúng `https://nexoratouch.com/certificate/NXT-CS-2026-0001`. Tức là QR không chỉ trông giống QR mà quét được thật và trỏ đúng địa chỉ backend sinh ra.
  - **Không unit-test được phần vẽ**: jsdom không có canvas 2D context. Test chỉ phủ các helper thuần (`buildCertificateUrl`, `formatExamScore`, `certificateFileName`); phần vẽ dựa vào verify trên browser ở trên.
  - **PNG thiết kế gốc (1373 KB) đã xoá theo yêu cầu**, chỉ giữ bản WebP 119 KB mà code thực sự dùng. Repo ship raster byte-for-byte nên một file 1.4 MB không dùng tới sẽ nằm trong bundle mãi.
  
- **Gộp về một cách render + mở cho staff (cùng ngày).** Trang public chuyển sang canvas, `CertificateDocument.tsx` (bản CSS) bị xoá cùng 22 locale key mồ côi. My Certifications thêm cho staff (`/staff/certifications`), dùng lại đúng một screen.
  - Stamp thu hồi/hết hạn giờ vẽ **lên canvas** (xám hoá + chữ in hoa), đã verify bằng Chrome: ảnh tải về mang đúng dấu. Stamp đặt lệch xuống khối mô tả để không che tên người được cấp.
  - **Test trang public phải mock `CertificateCanvasPreview`**: jsdom không có canvas 2D context nên component thật chỉ trả về màn render-failed. Test giờ assert (a) status truyền vào canvas qua data attribute, (b) nội dung ở khối `CertificateFacts` — đúng chỗ người dùng thật đọc được nếu canvas lỗi.
  - Chunk trang public giảm còn **3.21 kB** (từ 12.18 kB) vì phần nặng đã chuyển sang module canvas dùng chung.
- **Chưa làm** (theo mục "Ngoài phạm vi" của tài liệu, không phải thiếu sót): render file chứng chỉ PDF/PNG, màn "chứng chỉ của tôi" cho member, cấp hàng loạt, notification khi issue/revoke, nhắc hạn.
