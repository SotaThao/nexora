# US-047 · In bill POS qua Star PassPRNT + trang Printer setup

> File: `US-047-pos-receipt-printing.md` · 1 file = 1 story. ID tăng dần, duy nhất toàn repo.

| | |
|---|---|
| **Trạng thái** | Integrated (chưa Tested — cần iPad thật) |
| **Ngày tạo** | 2026-09-04 |
| **Epic / Domain** | POS Checkout — Receipt Printing |
| **OpenSpec change** | `openspec/changes/add-pos-receipt-printing` |
| **Test plan** | (điền khi viết test) |

## Story

**Là** Front Desk / Owner của salon,
**tôi muốn** bill in ra máy in nhiệt ngay khi bấm Complete, đúng số bản đã cấu hình, và có một trang để cài đặt/kiểm tra máy in,
**để** không phải qua hộp thoại in của iPad mỗi lần thanh toán, và bill đưa khách là hoá đơn hợp lệ (có subtotal, sales tax, tên khách).

## Hiện trạng (đã verify trong code)

POS **đã in được bill** nhưng chỉ ở mức mở hộp thoại in của OS:

- `src/components/dashboard/views/pos/PosReceiptPrintPreview.tsx` render bill rồi gọi `window.print()`; print CSS thật đã có trong `src/index.css` (`@page pos-invoice { size: 80mm auto }`, ẩn `#root` khi in để không ra trang trắng thứ hai).
- Ba entry point: preview trước thanh toán (`PosOrderWorkspace.tsx`), sau thanh toán (`PosCheckoutSuccessView` → `onReprint`), và re-print từ `PosCompletedOrdersPanel.tsx`.

Năm khoảng trống, xếp theo mức nghiêm trọng:

1. **Bill thiếu Subtotal và Sales tax** — chỉ in Tip / Discount / Total. Đây là vấn đề *tính hợp lệ của hoá đơn*, không phải thiếu tính năng. Key locale `summarySubtotal` và `summarySalesTax` đã tồn tại trong `src/locales/en.json` + `vi.json` nhưng không được render; `OrderDetailDto.salesTaxAmount` đã có sẵn từ BE.
2. **Chip "Print" ở bước checkout không in gì cả** — `receiptChoice === 'print'` chỉ được dùng làm nhãn trên màn success; `setPrintPreviewOpen(true)` chỉ chạy khi bấm tay.
3. **Không có trang Printer setup** — không route, không cấu hình, không test print. Chỉ còn lại key locale chết `receiptPrintComingSoon` ("Coming soon — needs a paired receipt printer") từ một kế hoạch máy in bị hoãn, không code nào tham chiếu.
4. **Không có số bản in, không chọn được nội dung in** (products / thứ tự services).
5. **Mỗi bill phải qua dialog OS** — trên iPad là AirPrint, 3-4 chạm mỗi lần thanh toán.

## Phạm vi đã chốt

| Hạng mục | Chọn | Hệ quả |
|---|---|---|
| Đường in | **Star PassPRNT** (URL scheme); `window.print()` giữ làm fallback | Không làm Star native SDK (repo không có Capacitor/native shell), không auto-detect runtime. Transport là **lựa chọn tường minh** của người dùng (`passprnt` \| `browser`) |
| Lưu cấu hình | **Local per-device** qua `src/utils/storage.ts` | Không endpoint mới; máy in gắn với từng iPad |
| Vị trí UI | **Sub-route `/dashboard/pos/printer`** trong sidebar POS | Không sửa `PosGeneralSettingsView.tsx` |
| Bổ sung bill | **Subtotal + Sales tax + tên khách + số điện thoại** | Không logo, không QR Google review → HTML gửi PassPRNT thuần text, nhỏ gọn |

Tham chiếu UI: mockup `pos-phase-1.html?tab=printer` (render bởi `assets/pos-printer-settings.js`).

## Spec PassPRNT (đã verify với tài liệu chính thức, không đoán)

Nguồn: Star PassPRNT Users Manual — Data Specifications (iOS), và sample web chính thức `star-micronics/star-passprnt-sdk-web` (`Sample/starpassprntsdk.html`).

- **Không có npm package.** Repo "SDK for Web" của Star chỉ là một file HTML mẫu → tự build URL, không thêm dependency.
- Kích hoạt: `location.href = 'starpassprnt://v1/print/nopreview?' + params`
- `back` — **bắt buộc**, nhận **http/https URL của web app**; sample dùng `encodeURIComponent(window.location.href)`. PassPRNT quay lại kèm `?passprnt_code=<n>&passprnt_message=<text>`; `0` = SUCCESS.
- Mã lỗi cần map: `3` data quá dài · `4` không kết nối được máy in · `5`/`7` máy in offline · `6` timeout gửi · `8` port exception · `9` không có dữ liệu in · `14` format không hỗ trợ · `16` tải remote thất bại.
- `html` — RFC3986-encoded, HTML5, giới hạn 8.000 pixels (~1m giấy).
- `size` — **đơn vị DOTS, không phải mm.** Range 120–832, default 576. 203 dpi = 8 dots/mm → **576 dots = 72mm in được trên cuộn 80mm**; 406 dots = cuộn 58mm.
- `cut`: `partial`|`full`|`tearbar`|`nocut` · `drawer`: `off`|`ahead`|`after` · `popup`: `enable`|`disable` · `timeout`: giây (mobile default 20).
- `url=` (in từ URL remote) **không dùng được hiện tại**: bill chứa dữ liệu khách và không có `receiptToken` nào được BE trả về (xem mục cần hỏi BE #1).

### Bốn hệ quả bắt buộc thiết kế theo

1. **In = điều hướng rời web app.** Callback load lại URL → React remount. Repo đã có sẵn đúng cơ chế: `posWorkspaceUrl.ts` + `setUpdateWorkspace` của `PosFrontDeskView` + effect sync `[searchParams]`. **Không cần URL param mới.**
2. **Không in được N bản trong một lần gọi** → print queue persist qua reload; mỗi callback thành công thì in bản kế tiếp.
3. **HTML cho PassPRNT ≠ print CSS hiện tại.** PassPRNT render HTML thành ảnh ở độ phân giải máy in → layout tính bằng **px map sang dots** (sample của Star dùng `<table>`, `font-size: 30px`, `<hr style="width:500px">` trong khổ 576 dots). `mm`, Tailwind và `index.css` đều không tồn tại bên trong PassPRNT.
4. **iOS không cho probe app đã cài.** Không list được máy in, không đọc được trạng thái máy in, không biết PassPRNT có mặt hay không.

## Acceptance Criteria

### AC1 — Auto-print sau khi Complete (happy case)

- **Given** đang ở màn checkout của một order Ready, đã chọn payment method `Card`, receipt option = **Print**, và `cardCopies = 2` trong Printer setup
- **When** bấm **Complete**
- **Then** FE gọi `POST /api/v1/merchant/pos/{businessId}/checkout/{orderId}/complete` → `200`; màn success render; app điều hướng sang `starpassprnt://v1/print/nopreview?...&size=576&back=<origin>/dashboard/pos`; PassPRNT in bản 1 rồi quay lại app với `?passprnt_code=0`; app tự in bản 2; sau bản cuối hiện toast thành công và quay về đúng màn success của `orderId` đó

### AC2 — Số bản theo payment method

- **Given** `cardCopies = 1`, `otherCopies = 0`
- **When** Complete với payment method `Cash` và receipt option = Print
- **Then** **không** in gì cả; màn success vẫn render bình thường với nhãn receipt = Print

### AC3 — Receipt option khác Print

- **Given** receipt option = **Send SMS** hoặc **No Receipt**
- **When** Complete
- **Then** không có điều hướng PassPRNT nào; hành vi giữ nguyên như hiện tại (`receiptPhone` chỉ gửi khi chọn SMS)

### AC4 — PassPRNT trả lỗi

- **Given** đang in, máy in bị tắt giữa job
- **When** PassPRNT quay lại với `?passprnt_code=4`
- **Then** print queue bị clear (**không auto-retry**), toast hiện message tương ứng mã 4, `logger.error` được ghi, và preview bill mở ra để nhân viên in tay bằng `window.print()`

### AC5 — PassPRNT chưa được cài

- **Given** thiết bị chưa cài app PassPRNT
- **When** bấm Test print và không có callback nào quay về sau `PASSPRNT_JOB_STALE_MS` (90s)
- **Then** ở lần mount tiếp theo, job cũ bị clear và toast nhắc kiểm tra việc cài PassPRNT

### AC6 — Test print từ trang Printer setup

- **Given** đang ở `/dashboard/pos/printer`, transport = PassPRNT
- **When** bấm **Test print**
- **Then** điều hướng PassPRNT với `back = <origin>/dashboard/pos/printer`; sau callback `passprnt_code=0`, panel "kết quả test lần cuối" hiện thành công + timestamp; `lastTestAt`/`lastTestCode` được lưu per-device

### AC7 — Lưu receipt settings

- **Given** đang ở trang Printer setup
- **When** đổi bất kỳ trong 4 mục (`printProducts`, `sortServices`, `cardCopies`, `otherCopies`) → badge chuyển "Unsaved changes" → bấm **Save settings**
- **Then** giá trị được lưu per-device, badge về "All changes saved", toast thành công; reload trang giữ đúng giá trị; màn checkout đọc được giá trị mới mà không cần reload

### AC8 — Nội dung bill

- **Given** một order đã thanh toán có services + add-on + discount + tip + sales tax
- **When** mở preview bill hoặc in ra giấy
- **Then** bill hiện theo thứ tự: Ticket # → tên/địa chỉ/điện thoại salon → ngày giờ → **Customer: tên khách** → **số điện thoại khách đã format** → các dòng dịch vụ nhóm theo thợ (kèm add-on, badge discount) → **Subtotal** → Discount → Order discount (nếu > 0) → **Sales tax** → Tip → **Total** → Paid with `<method>` → Thank you. Và `Subtotal + Sales tax + Tip − Discount = Total`

### AC9 — Preview trên màn khớp bill in ra

- **Given** bất kỳ order nào
- **When** so sánh nội dung text của preview trên màn với HTML gửi cho PassPRNT
- **Then** hai bên **giống nhau về toàn bộ nội dung text** (được enforce bằng test tự động, không phải kiểm tay)

### AC10 — Re-print thủ công

- **Given** một order đã hoàn tất trong tab Completed
- **When** bấm **Re-print receipt**
- **Then** in đúng **1 bản** (không theo `cardCopies`/`otherCopies`), không tạo print queue

### AC11 — Transport = Browser

- **Given** transport = **Browser print dialog** (mặc định cho thiết bị không phải iPad có máy in Star)
- **When** in với `copies = 2`
- **Then** một lần `window.print()` duy nhất, tài liệu chứa 2 bản ngăn nhau bằng page-break (không phải 2 hộp thoại in)

## API Mapping (bắt buộc trước khi integrate)

> Nguồn contract: Swagger live `https://test-api.nexoratouch.com/api/` — đối chiếu `API/update/<mới nhất>/api-integration-guide-v4.md`. Ghi tag nguồn: (S) spec / (L) đã verify live.

**Không có endpoint mới nào.** Toàn bộ story dùng dữ liệu FE đã gọi sẵn:

| Method | Endpoint | Auth | Request | Response (field story này dùng) | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}` | Bearer | — | `200 OrderDetailDto` — `orderNumber`, `customerName`, `customerPhone`, `customerPhoneE164`, `serviceLines[{serviceName, technicianName, unitPrice, quantity, lineTotal, discountType, discountValue, discountAmount, lineTotalAfterDiscount, addOns[{addOnName, lineTotal, discountAmount, lineTotalAfterDiscount}]}]`, `productLines[]`, `servicesSubtotal`, `productsSubtotal`, `tipAmount`, `discountAmount`, `orderDiscountAmount`, `appliedPromotionName`, `servicesNet`, `salesTaxAmount`, `total`, `paymentMethodType`, `completedAt` | S |
| POST | `/api/v1/merchant/pos/{businessId}/checkout/{orderId}/complete` | Bearer | `{ paymentMethodType, receiptEmail?, receiptPhone? }` | `200 CompleteOrderResultDto` — `orderId`, `servicesSubtotal`, `productsSubtotal`, `tipAmount`, `discountAmount`, `orderDiscountAmount`, `salesTaxAmount`, `totalAmount`, `status`, `completedAt` | S |
| GET | `/api/v1/merchant/business` | Bearer | — | `200 BusinessDto` — `name`, `address`, `city`, `state`, `phone`, `timeZone`, `salesTaxRatePercent` | S |

Cấu hình máy in + receipt settings **không** đi qua API — lưu per-device trong `src/utils/storage.ts` (xem mục cần hỏi BE #2).

**Điểm chưa chắc chắn / cần hỏi BE:**

1. **`receiptToken` chưa được expose ở đâu cả.** Đã re-verify với spec live: chuỗi `receiptToken` **chỉ** xuất hiện làm path param của `/api/v1/public/receipt/{receiptToken}` (trả `ReceiptDto` với `salonName`, `ticketNumber`, `serviceLines` + `addOns`, `productLines`, subtotals, `salesTaxAmount`, `appliedPromotionName`, `total`, `paymentMethodType`); **không DTO nào trả token đó ra**, và không có `receiptUrl`. Hỏi: thêm `receiptToken` (hoặc URL receipt đầy đủ) vào `CompleteOrderResultDto` và vào order/completed-order detail. Có nó thì mở được **`url=` của PassPRNT** — đưa PassPRNT một URL thay vì blob HTML ~8.000 ký tự, xoá hẳn giới hạn độ dài URL scheme, và re-print được từ mọi thiết bị. **Không block v1**: `html=` chạy được hôm nay. **Không** thử `url=` trước khi có token — bill chứa dữ liệu khách và không có gì để authorize.
2. **Receipt settings là business policy hay device policy?** `printProducts` / `sortServices` / số bản in có thể coi là per-business (owner muốn bill giống nhau ở cả hai trạm), nhưng hiện không có endpoint nào. Hỏi: có kế hoạch `GET/PUT /api/v1/merchant/pos/{businessId}/receipt-settings` không? **Không block v1**: làm device-local trước, và `posPrinterSettings.ts` là seam duy nhất — đổi sang server chỉ sửa repository + hook, zero component churn. Ghi nhận đây là **divergence đã biết**, đừng build report dựa trên nó.
3. **Sales tax khi bill có products.** `src/types/repositories.ts` ghi rõ `servicesNet` = "servicesSubtotal less both discounts — **the figure sales tax is charged on**", tức products **không** bị tính thuế. Cần confirm trước khi in dòng Sales tax cạnh một products subtotal, không thì giấy không cộng đúng. Hiện còn tiềm ẩn (products đang bị ẩn trong checkout) — và `printProducts` chính là toggle làm nó lộ ra.
4. **Có in `salesTaxRatePercent` trên bill không?** `BusinessDto` có sẵn field này và `BusinessInfoCard` đã cho sửa. Confirm xem bill có nên hiện rate (vd "Sales tax (8.25%)") — kỳ vọng thường thấy của khách Mỹ. Rẻ để thêm khi có câu trả lời; tạm bỏ khỏi v1.

**Không phải câu hỏi BE nhưng cần người chốt:** bước 2 của card PassPRNT ("Open PassPRNT và chọn máy in") chỉ là hướng dẫn chứ không có nút, vì `starpassprnt://` trần không kèm dữ liệu in sẽ trả error 9. Cần confirm trên thiết bị thật xem Star có path settings-only nào không; nếu có thì bước 2 được thêm nút.

## FE Surface (các layer sẽ đụng)

> Theo data boundary: components → data hooks → repositories → adapter.

| Layer | File | Thay đổi |
|---|---|---|
| Constants | `src/constants/posPrinter.ts` (mới) | `PosPrintTransport`, `PASSPRNT_PRINT_PATH`, `PASSPRNT_APP_STORE_URL`, `PassPrntCode` (0/3/4/5/6/7/8/9/14/16), `PassPrntCut`, `PassPrntDrawer`, `PassPrntPopup`, `RECEIPT_PAPER_WIDTH_DOTS` (576/406), `RECEIPT_COPIES_MIN/MAX` (0/3), `PASSPRNT_MAX_ENCODED_HTML_LENGTH`, `PASSPRNT_MAX_RECEIPT_HEIGHT_PX`, `PASSPRNT_JOB_STALE_MS`, 3 storage key, `DEFAULT_POS_RECEIPT_SETTINGS` |
| Types | `src/types/repositories.ts` | `PosPrinterProfile`, `PosReceiptSettings`, `PosPendingPrintJob` (không hậu tố `ApiDto` — không phải DTO của BE) |
| Repository | `src/data/repositories/posPrinterSettings.ts` (mới) | Factory + singleton theo `posBookingSettings.ts`, nhưng backing store là `storage` thay vì `httpClient`. **File duy nhất chạm `storage` cho các key này và là nơi duy nhất `JSON.parse` + clamp.** Sync (không `Promise`) vì storage không async và transport cần đọc profile ngay lúc fire |
| Query keys | `src/data/queryKeys.ts` | `posPrinterProfile: () => ['posDevice','printerProfile']`, `posReceiptSettings: () => ['posDevice','receiptSettings']` — namespace `posDevice` mới, **không** `businessId` |
| Data hook | `src/data/hooks/usePosPrinterSettings.ts` (mới) | `usePosPrinterProfile` / `useSavePosPrinterProfile` / `usePosReceiptSettings` / `useSavePosReceiptSettings`. `staleTime: Infinity`, `retry: false`. Dùng Query chứ không `useState` vì trang Printer và màn checkout ở 2 route khác nhau — save một bên phải invalidate bên kia |
| Document | `views/pos/receipt/posReceiptDocument.ts` (mới) | `buildPosReceiptDocument()` + `resolveReceiptCopies()`. **Nguồn sự thật duy nhất** cho cả preview và HTML. Thay thế 2 block trùng lặp đang có trong `PosOrderWorkspace.tsx` và `PosCompletedOrdersPanel.tsx` — tiền đề để các toggle settings có ý nghĩa |
| Renderer JSX | `views/pos/receipt/PosReceiptPrintDocument.tsx` (mới) | Renderer thuần over `doc.rows`/`doc.totals`, dùng lại nguyên các class `.pos-receipt-*` |
| Renderer HTML | `views/pos/receipt/posReceiptHtml.ts` (mới) | `buildPosReceiptHtml(doc, { widthDots })` + `estimatePosReceiptHeightPx()`. Document HTML5 tự chứa, CSS inline, px map sang dots, `escapeHtml` mọi interpolation, `<meta name="format-detection" content="telephone=no">` |
| Transport | `views/pos/receipt/printTransport.ts`, `passprntTransport.ts`, `browserPrintTransport.ts` (mới) | `buildPassPrntUrl` (kèm size gate trả `{ tooLarge: true }`), `parsePassPrntCallback`, `firePassPrnt`, `printDomWithBodyClass`. Đặt trong `views/` **không** `src/lib/` vì `vitest.config.ts` chỉ include `tests/unit/**`, `src/components/**`, `src/data/**` |
| Orchestration | `views/pos/receipt/usePosReceiptPrint.ts`, `usePassPrntReturn.ts` (mới) | Fire + print queue persist + callback leg + dedupe + stale sweep |
| Component | `views/pos/printer/PosPrinterSetupView.tsx`, `PosPassPrntCard.tsx`, `PosReceiptSettingsCard.tsx`, `PosCopiesStepper.tsx` (mới) | Trang Printer setup: card kết nối (radio transport + 3 bước + panel last-test) và card receipt settings (2 toggle + 2 stepper + Save). Card shell theo `PosCheckInSettingsPanel.tsx` |
| Component | `views/pos/PosReceiptPrintPreview.tsx` | Props 15 → `{ open, onClose, doc, onPrint }`; body dùng `PosReceiptPrintDocument`; block print inline → transport |
| Component | `views/pos/PosOrderWorkspace.tsx` | Auto-print trong `onSuccess` của `handleComplete` (build document **đồng bộ tại đây** vì `useCompleteOrder` invalidate order query); effect fire một commit sau với `autoPrintedOrderIdRef` gán trước mọi async; xoá block build group inline; prop mới `receiptPrintTab?: string` |
| Component | `views/pos/PosFrontDeskView.tsx` | `usePassPrntReturn({ surface:'frontDesk', onRestore })` + truyền `receiptPrintTab={activeTab}` tại 2 call site |
| Component | `views/pos/PosCompletedOrdersPanel.tsx` | Dùng `buildPosReceiptDocument`; re-print luôn 1 bản |
| Route/nav | `components/dashboard/constants.tsx`, `routes/index.tsx`, `src/app/AppRouter.tsx` | Child `printer` trong POS (sau `devices`), `PosPrinterSetupRoute`, route `pos/printer`. Không gate KYB (device config, không phải salon identity) |
| Styles | `src/index.css` | Trong block `@media print` sẵn có: `.pos-receipt-print-offscreen`, `.pos-receipt-print-extra`, `.pos-receipt-print--page-break`. Host offscreen **phải** portal ở body-level (sibling của `#root`) vì `body.printing-pos-invoice > #root { display:none }` |
| i18n | `src/locales/en.json`, `vi.json` | `dashboard.menu.pos_printer` + namespace `components.dashboard.views.pos.printer.*` (kèm một message cho mỗi `passprnt_code`). **Xoá** key chết `receiptPrintComingSoon`. **Zero key mới cho bill** — `summarySubtotal`, `summarySalesTax`, `printPreviewCustomer`, `printPreviewPhone` đều đã tồn tại |

## Giới hạn đã chấp nhận (không phải bug)

- **`printProducts` hiện inert.** Tab Products đang bị ẩn trong checkout (`PosOrderWorkspace.tsx` — "Nothing sells products anywhere while it is hidden"), nên toggle này đúng nhưng chưa có tác dụng tới khi bán lẻ quay lại. Có để sẵn theo mockup.
- **`copies > 1` chỉ xảy ra ở đường auto-print.** Mọi nút Print / Re-print thủ công in đúng 1 bản. Điều này né được việc modal detail của `PosCompletedOrdersPanel` là local state không có URL param nên vốn không restore được sau round-trip PassPRNT.
- **`initStorage()` xoá mọi key `nexora_*`/`vlinkpay_*` khi `STORAGE_PREFIX` đổi**, nên bump storage version sẽ reset printer profile + receipt settings. Hồi phục bằng một Test print và 4 chạm.
- **PassPRNT chỉ hỗ trợ máy in Star.** Máy in khác dùng `transport: 'browser'`.
- **Những gì mockup vẽ mà PassPRNT không cho làm** (đã bỏ, có ghi lý do trong comment đầu file): danh sách discovery máy in Bluetooth/LAN; status chip `ready/paperLow/coverOpen/connectionLost` + note theo status; "Installed ✓"; "Change printer" / "Disconnect"; toggle "Preview as iPad App / Safari"; status simulator. Discovery và trạng thái máy in nằm trong app PassPRNT, web không có API; tín hiệu duy nhất web nhận được là `passprnt_code` của một job đã xong → thay bằng panel "kết quả test lần cuối".

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật)
- [ ] API call đúng contract đã map (method/status/payload — verify bằng network)
- [ ] Mutation invalidate đúng query cache
- [ ] Không console error
- [ ] Test theo 3 layer: L1 UI / L2 data boundary / L3 flow — bao gồm **test chống lệch** giữa preview và HTML PassPRNT
- [ ] `pnpm typecheck` không phát sinh lỗi mới trong file bị sửa (baseline repo đang đỏ 72 lỗi)
- [ ] `pnpm test` + `pnpm build` xanh
- [ ] Modal/trang test ở viewport 375×667 theo mục "Mobile-Responsive Modals & Dialogs" của AGENTS.md
- [ ] **Verify trên thiết bị thật**: iPad Safari + app PassPRNT + máy in Star — Test print, checkout 2 bản, và một lần lỗi có chủ ý (tắt máy in giữa job)
- [ ] Cập nhật trạng thái file này + link TC

## Rủi ro

| Rủi ro | Xử lý |
|---|---|
| `back` = https URL của SPA chưa verify trên thiết bị (sample của Star chạy trên trang HTML tĩnh) | Giảm thiểu bằng "`back` path-only, mọi state restore nằm trong job đã persist". Verify sớm trên iPad thật; nếu fail → `back` trỏ về một trang tĩnh trong `public/` rồi redirect vào SPA |
| Giới hạn độ dài URL scheme trên iOS | Size gate trước khi navigate → vượt thì fallback `window.print()` + toast; xin `receiptToken` để chuyển sang `url=` |
| Không biết PassPRNT đã cài chưa | Stale sweep 90s + nút Install rõ ràng. Không claim trạng thái cài đặt nào |
| Preview lệch bill in ra | Một `PosReceiptDocument` cho cả hai đường + test chống lệch (fail build khi lệch) |
| In N bản = N lần rời app | Queue persist + hiện "đang in bản 2/3" để nhân viên khỏi tưởng treo |
| Nhân viên reload/bấm back giữa queue | Chỉ resume khi có `passprnt_code` trong URL; strip param với `{ replace: true }`; `firedAttempts` cap 1/bản |

## Ghi chú phiên thực thi

**Phiên 2026-09-05 — implement Phase 1-7 (trừ verify trên thiết bị thật).**

Đã build: constants + repository per-device + hook, `PosReceiptDocument` dùng chung cho cả
preview và HTML PassPRNT, hai transport, print queue qua reload, trang `/dashboard/pos/printer`,
auto-print sau Complete, và bill có thêm Subtotal / Sales tax / tên khách / số điện thoại.

**Deviation so với plan:**

- `PosReceiptDocument` và các type liên quan đặt ở `src/types/domain.ts`, không phải cạnh builder
  trong `views/pos/receipt/`. Lý do: repository lưu document cùng print job, mà repository import
  ngược lên `components/` là vi phạm data boundary của AGENTS.md.
- Thêm `orderDiscountAmount` vào `CompleteOrderResultApiDto`. Field này **có** trên Swagger live
  nhưng thiếu trong type FE, nên bill in thẳng từ response Complete không hiện được promotion và
  tổng không cộng đúng.

**Ba bug bị test bắt trong lúc làm, đều đã sửa:**

1. `clampReceiptCopies` dùng `Number(value)` nên `null` thành `0` — một giá trị hỏng trong storage
   sẽ âm thầm thành "không in bản nào" thay vì rơi về mặc định.
2. `PosReceiptSettingsCard` seed form từ query trong `useEffect`; vì card render ngay với giá trị
   mặc định trong lúc đọc storage, một thao tác trong khoảng đó bị effect ghi đè và mất luôn.
   Đã thêm cờ "đã chạm vào form".
3. HTML gửi PassPRNT tách badge giảm giá bằng khoảng trắng còn JSX dùng margin — test chống lệch
   bắt được ngay lần chạy đầu. Đã đổi HTML sang margin để nội dung text hai bên giống hệt.

**Kết quả kiểm tra:** `pnpm typecheck` 72 lỗi = đúng baseline, không lỗi mới trong file đã sửa.
243 test pass; 7 test file fail đều là OneQR (thiếu `src/data/repositories/publicOneQr.ts` trên
branch này) — baseline có sẵn, không liên quan. `vite build` xanh.

**Lưu ý môi trường:** `node_modules/pdfjs-dist` không được hoist dù `.npmrc` có
`public-hoist-pattern[]=pdfjs-dist`, làm build fail ở `react-pdf`. `pnpm install --force` không
dựng lại link; đã tạo symlink thủ công trong `node_modules` để build chạy. Không ảnh hưởng repo.

**Rà soát liên kết với luồng in bill cũ (cùng phiên) — phát hiện 3 lỗi tích hợp, đã sửa:**

1. `printSurface` của `usePosReceiptPrint` không được render ở `PosOrderWorkspace`. Print CSS ẩn
   `#root`, nên auto-print trên transport browser (mặc định) sẽ **in ra giấy trắng**. Đã render ở
   cả hai nhánh return, và ở `PosCompletedOrdersPanel`.
2. Nút Print thủ công bỏ qua transport đã chọn: chọn PassPRNT xong bấm "Print receipt" vẫn ra hộp
   thoại trình duyệt, tức auto-print đi máy in Star còn nút bên cạnh làm việc khác. Đã truyền
   `onPrint` cho cả hai call site (chỉ khi transport là PassPRNT — trên browser modal tự in DOM của
   nó, đi qua hook sẽ render receipt hai lần và in cả hai).
3. Hook xoá portal ngay sau `window.print()`. Chỗ này chạy được khi lời gọi block, nhưng iOS Safari
   không block đáng tin và cũng không fire `afterprint` đáng tin — receipt bị unmount sớm một tick
   sẽ in ra trang trắng mà không có dấu hiệu gì trong app. Đã giữ DOM tới khi `afterprint` về, kèm
   timer dự phòng 3s.

Kèm theo: `PosPrintRestoreState` nới ra để mang `mode` và cho phép thiếu `orderId`; handler
`onRestore` ở `PosFrontDeskView` trước đó hardcode `mode: "success"` và sẽ dựng workspace rỗng khi
restore từ re-print (vốn không có order). Thêm `printSurfaceLinking.test.tsx` khoá cả ba lỗi.
**Danh sách máy in và reconnect (rà soát cùng phiên):**

- **Không có UI danh sách máy in đã kết nối, và không làm được.** Việc dò tìm/ghép nối nằm trong app
  PassPRNT; web không có API đọc danh sách máy in Bluetooth/LAN, cũng không biết máy nào đang được
  chọn. Panel "kết quả test lần cuối" là thứ thay thế — tín hiệu duy nhất web nhận được là mã kết
  quả của một lần in đã chạy.
- **Không có cơ chế reconnect riêng, và về bản chất không cần.** Mỗi lần gọi PassPRNT là nó tự mở
  kết nối tới máy in, nên "reconnect" chính là "in lại"; web app không giữ kết nối nào.
- **Không auto-retry khi lỗi** (có chủ ý): máy in tắt hoặc hết giấy sẽ fail y hệt lần sau, retry
  vòng lặp trên phần cứng tệ hơn là báo cho nhân viên.
- **Đã bổ sung đường thoát (task 6.5):** receipt print lỗi → `onPrintFailed` đưa job về surface →
  preview tự mở cho đúng order đó, và nút Print trong đó dùng `window.print()` thay vì PassPRNT vừa
  lỗi. Chỉ lần in đó fallback — transport của thiết bị giữ nguyên, vì salon vẫn muốn máy in Star cho
  lần sau. Test print lỗi thì không mở preview (màn setup đã báo trong panel last-test).
**Chưa verify (cần thiết bị thật, không thay được bằng test):** `back` = https URL của SPA có quay
về đúng route không; round-trip in nhiều bản; wording bước 2 của card PassPRNT so với UI thật;
khổ giấy 80mm in ra; hành vi khi tắt máy in giữa job. Xem task 4.6 / 5.11 / 6.1 / 8.4-8.6.
