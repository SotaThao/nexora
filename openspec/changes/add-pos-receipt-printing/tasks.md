## 1. Nền — constants, persist, hook (không cần iPad)

- [ ] 1.1 `src/constants/posPrinter.ts`: `PosPrintTransport`, `PASSPRNT_PRINT_PATH`, `PASSPRNT_APP_STORE_URL`, `PASSPRNT_CODE_PARAM`/`PASSPRNT_MESSAGE_PARAM`, `PassPrntCode` (0/3/4/5/6/7/8/9/14/16), `PassPrntCut`, `PassPrntDrawer`, `PassPrntPopup`
- [ ] 1.2 Cùng file: `RECEIPT_PAPER_WIDTH_DOTS` (`Roll80mm: 576`, `Roll58mm: 406` — comment rõ **dots, không phải mm**), `PASSPRNT_TIMEOUT_SECONDS`, `RECEIPT_COPIES_MIN/MAX`, `PASSPRNT_MAX_ENCODED_HTML_LENGTH`, `PASSPRNT_MAX_RECEIPT_HEIGHT_PX`, `PASSPRNT_JOB_STALE_MS`, 3 storage key, `DEFAULT_POS_RECEIPT_SETTINGS`
- [ ] 1.3 `src/types/repositories.ts`: `PosPrinterProfile`, `PosReceiptSettings`, `PosPendingPrintJob`, `PosPrintRestoreState`
- [ ] 1.4 `src/data/repositories/posPrinterSettings.ts`: factory `createPosPrinterSettingsRepository(store = storage)` + singleton; 7 method (`getPrinterProfile`, `savePrinterProfile`, `getReceiptSettings`, `saveReceiptSettings`, `getPendingPrintJob`, `savePendingPrintJob`, `clearPendingPrintJob`); sync (không `Promise`); clamp copies 0..3, coerce boolean, transport lạ → `Browser`, JSON hỏng → default + `logger.error`
- [ ] 1.5 `src/data/repositories/posPrinterSettings.test.ts` (L2): default khi store rỗng · clamp cả hai đầu · transport lạ → browser · JSON hỏng → default **và** `logger.error` được gọi (spy logger, không `console`) · save→get round trip · `clearPendingPrintJob` chỉ xoá key của nó
- [ ] 1.6 `src/data/queryKeys.ts`: `posPrinterProfile: () => ['posDevice','printerProfile']`, `posReceiptSettings: () => ['posDevice','receiptSettings']`
- [ ] 1.7 `src/data/hooks/usePosPrinterSettings.ts`: 2 `useQuery` (`staleTime: Infinity`, `retry: false`) + 2 `useMutation` invalidate đúng key
- [ ] 1.8 Verify: `pnpm vitest run src/data/repositories/posPrinterSettings.test.ts`

## 2. Receipt document — nguồn sự thật duy nhất (rủi ro cao nhất, làm trước transport)

- [ ] 2.1 `views/pos/receipt/posReceiptDocument.ts`: type `PosReceiptRow`, `PosReceiptTotalRow`, `PosReceiptLabels`, `PosReceiptDocument` (version 1, fully resolved + serializable)
- [ ] 2.2 Cùng file: `buildPosReceiptDocument(input, settings, labels, locale)` — nhận `order` + `confirmed?` (money từ `CompleteOrderResultDto`, thắng số liệu live của order)
- [ ] 2.3 Cùng file: honor `printProducts: false` → bỏ group products **và** loại `productsSubtotal` khỏi Subtotal
- [ ] 2.4 Cùng file: honor `sortServices: true` → stable sort group theo `label.localeCompare`, line theo tên; đảm bảo idempotent
- [ ] 2.5 Cùng file: thứ tự totals Subtotal → Discount → Order discount (khi > 0) → Sales tax → Tip → Total (emphasis)
- [ ] 2.6 Cùng file: `resolveReceiptCopies(paymentMethodType, settings)` — `Card` → `cardCopies`, còn lại → `otherCopies`
- [ ] 2.7 `views/pos/receipt/posReceiptDocument.test.ts` (L2): 2.3 · 2.4 idempotent qua 2 lần gọi · `confirmed` override order · 2.6 cho `Card`/`Cash`/`GiftCard`/`SplitPay` · thứ tự totals
- [ ] 2.8 `views/pos/receipt/PosReceiptPrintDocument.tsx`: renderer JSX thuần `({ doc, className })`, đi qua `doc.rows`/`doc.totals`, dùng lại nguyên class `.pos-receipt-*`
- [ ] 2.9 `views/pos/receipt/posReceiptHtml.ts`: `buildPosReceiptHtml(doc, { widthDots })` — HTML5 tự chứa, CSS inline, `body { width: widthDots/8 mm }`, `<meta name="format-detection" content="telephone=no">`, `escapeHtml` cục bộ mọi interpolation, không nhúng ảnh
- [ ] 2.10 Cùng file: `estimatePosReceiptHeightPx(doc)`
- [ ] 2.11 `views/pos/receipt/posReceiptHtml.test.ts` (L2) — **test chống lệch**: render `PosReceiptPrintDocument` lấy `textContent`, build HTML parse bằng `DOMParser` lấy `body.textContent`, normalize whitespace, assert bằng nhau
- [ ] 2.12 Cùng test file: `escapeHtml` vô hiệu `<script>` trong tên khách · có meta `format-detection` · `body` width = `widthDots/8` mm · `estimatePosReceiptHeightPx` tăng theo số dòng

## 3. Transport

- [ ] 3.1 `views/pos/receipt/printTransport.ts`: type `PrintOutcome` (`completed` | `handedOff` | `failed`)
- [ ] 3.2 `views/pos/receipt/browserPrintTransport.ts`: `printDomWithBodyClass(bodyClass)` — rút từ block trùng nguyên văn trong `PosReceiptPrintPreview.tsx` và `report/PosReportDetailModal.tsx`; giữ nguyên semantics (add class → `afterprint` one-shot → `window.print()` → remove; `catch` chạy cleanup)
- [ ] 3.3 `views/pos/receipt/browserPrintTransport.test.ts` (L2): add rồi remove body class · register và remove `afterprint` · cleanup khi `window.print` throw · gọi lần 2 không để lại listener cũ
- [ ] 3.4 `views/pos/receipt/passprntTransport.ts`: `buildPassPrntUrl({ html, backUrl, widthDots, cut, drawer })` → `{ url } | { tooLarge, encodedLength }`; param `back`/`html`/`size`/`cut`/`popup=disable`/`timeout`, tất cả `encodeURIComponent`
- [ ] 3.5 Cùng file: `parsePassPrntCallback(search)`, `stripPassPrntCallbackParams(params)`, `firePassPrnt(url)`, `getPassPrntErrorI18nKey(code)`
- [ ] 3.6 Cùng file: `back` **path-only, không query string**, build từ `window.location.origin` (**không** `getWebUrlOrigin()` — helper đó trả origin customer-facing, host khác dashboard)
- [ ] 3.7 `views/pos/receipt/passprntTransport.test.ts` (L2): path `starpassprnt://v1/print/nopreview` · `size=576` · `cut=partial` · `popup=disable` · `timeout=20` · `back` không query và decode ra đúng path · `html` round-trip qua `decodeURIComponent` · HTML quá ngưỡng → `{ tooLarge: true }` và **không** navigate · `parsePassPrntCallback` map `0`→ok, `4`→failed, thiếu param → `null`
- [ ] 3.8 `src/index.css` (trong block `@media print` sẵn có): `.pos-receipt-print-offscreen`, `.pos-receipt-print-extra`, `.pos-receipt-print--page-break`. Kiểm lại tương tác với `body.printing-pos-invoice > #root { display: none }`

## 4. Migrate surface in hiện có sang document (bill có thêm nội dung, chưa có UI mới)

- [ ] 4.1 `views/pos/PosReceiptPrintPreview.tsx`: props 15 → `{ open, onClose, doc, onPrint }`; body dùng `PosReceiptPrintDocument`; block print inline → `printDomWithBodyClass`; render `copies` bản với page-break class cho mọi bản trừ bản cuối
- [ ] 4.2 Cùng file: render **Customer + phone** trong header và **Subtotal + Sales tax** trong totals. Phone qua `formatCustomerPhone(order.customerPhone, order.customerPhoneE164)` — **không** render `customerPhone` một mình
- [ ] 4.3 `views/pos/PosReceiptPrintPreview.test.tsx` (L1): Subtotal/Sales tax/tên khách/phone render từ doc · `copies: 2` render 2 node `[data-testid="pos-receipt-print"]`, node đầu có class page-break · nút Print đi qua transport chứ không `window.print()` trần
- [ ] 4.4 `views/pos/PosOrderWorkspace.tsx`: xoá `printableServiceGroups`/`printableProductLines`/`printableReceiptGroups`/`printableReceipt`, thay bằng `useMemo` over `buildPosReceiptDocument`
- [ ] 4.5 `views/pos/PosCompletedOrdersPanel.tsx`: xoá block build group trùng lặp, dùng `buildPosReceiptDocument`; re-print luôn 1 bản
- [ ] 4.6 Verify thủ công: Chrome desktop print-to-PDF khổ 80mm → 2 bản = 2 trang mỗi trang rộng 80mm, **không có trang trắng cuối**; `Subtotal + Sales tax + Tip − Discount = Total`

## 5. Trang Printer setup

- [ ] 5.1 `views/pos/printer/PosCopiesStepper.tsx`: `−`/value/`+`, clamp 0..3, touch target 44px, `role="group"` + `aria-live="polite"`. **Cố ý dùng button + `<span>`, không `<input type="number">`** (bàn phím iOS)
- [ ] 5.2 `views/pos/printer/PosReceiptSettingsCard.tsx`: 2 `ToggleSwitch` (từ `src/components/ui/ToggleSwitch.tsx`) + 2 stepper + nút Save + badge `Unsaved changes`/`All changes saved` (shallow compare form vs query data). Card shell theo `PosCheckInSettingsPanel.tsx`
- [ ] 5.3 `views/pos/printer/PosReceiptSettingsCard.test.tsx` (L1): stepper clamp `−`@0 và `+`@3 · "Unsaved changes" xuất hiện khi toggle đầu và mất sau save · save gọi mutation với đúng payload · toggle có `role="switch"` + `aria-checked` · **không có `<input>`** trong stepper
- [ ] 5.4 `views/pos/printer/PosPassPrntCard.tsx`: radio transport (PassPRNT / Browser print dialog) → `PosPrinterProfile.transport`; 3 bước (1 Install → link App Store `target="_blank" rel="noreferrer"`; 2 Open PassPRNT — **chỉ hướng dẫn, không nút**; 3 Verify printing → nút Test print); panel kết quả test lần cuối
- [ ] 5.5 Cùng file: comment đầu file ghi rõ **lý do bỏ** discovery list / status chip / "Installed ✓" / Change printer / Disconnect / toggle runtime — theo convention "design rationale" của repo
- [ ] 5.6 `views/pos/printer/PosPassPrntCard.test.tsx` (L1): chọn Browser persist `transport:'browser'` và ẩn 3 bước · link App Store đúng URL + `rel="noreferrer"` · `lastTestCode:'0'` → success + timestamp, `'4'` → note `passprntError.4`, `null` → dòng chưa test · Test print fire `location.assign` với `back` kết thúc `/dashboard/pos/printer`
- [ ] 5.7 `views/pos/printer/PosPrinterSetupView.tsx`: shell `space-y-6`, h1 + description theo `PosGeneralSettingsView.tsx`; host `usePassPrntReturn({ surface: 'printerSetup' })`
- [ ] 5.8 `src/components/dashboard/constants.tsx`: thêm `{ id: 'printer', labelKey: 'dashboard.menu.pos_printer' }` vào `children` của POS, **sau `devices`**
- [ ] 5.9 `src/components/dashboard/routes/index.tsx`: `PosPrinterSetupRoute()` — không gate `verificationStatus`/KYB
- [ ] 5.10 `src/app/AppRouter.tsx`: `<Route path={`${DASHBOARD_MENU_ID.pos}/printer`} … />` trong block `PosOnboardingLayout`
- [ ] 5.11 Verify thủ công: screenshot `/dashboard/pos/printer` ở 375×667 và 1024×768; đổi settings → reload → giữ đúng giá trị

## 6. Orchestration + auto-print

- [ ] 6.1 **Verify trên iPad thật trước khi build tiếp**: `back` = https URL của SPA có quay về đúng route không (sample của Star chạy trên trang HTML tĩnh). Nếu fail → `back` trỏ về trang tĩnh trong `public/` rồi redirect vào SPA; ghi kết quả vào "Ghi chú phiên thực thi" của US-047
- [ ] 6.2 `views/pos/receipt/usePosReceiptPrint.ts`: `{ isPrinting, transport, printSurface, printReceipt(doc, { copies, restore }), testPrint() }`. PassPRNT: build HTML → size gate → persist job → `firePassPrnt`. Browser: set pending → effect thấy portal đã mount → `printDomWithBodyClass` → clear on `afterprint`
- [ ] 6.3 `views/pos/receipt/usePassPrntReturn.ts`: on mount / `[searchParams]` — parse callback; null → stale sweep (`PASSPRNT_JOB_STALE_MS`) → clear + toast; dedupe theo `jobId` bằng `useRef` **trước mọi await**; strip param `{ replace: true }`
- [ ] 6.4 Cùng file: `code === Success` → `copiesDone += 1`; còn bản → `onRestore` rồi frame sau fire bản kế tiếp + toast "đang in bản n/N"; hết → clear + toast thành công + `onRestore`; `kind === 'testPrint'` → `savePrinterProfile({ lastTestAt, lastTestCode })`
- [ ] 6.5 Cùng file: `code !== Success` → clear job (**không auto-retry**) + toast `passprntError.<code>` + `logger.error` + `onRestore` + set fallback doc để mở preview
- [ ] 6.6 Cùng file: guard chống lặp — `firedAttempts` cap 1/bản · queue chỉ tiến từ return handler (không timer, không polling) · một job slot, job mới ghi đè sau `logger.warn` + toast
- [ ] 6.7 `views/pos/PosOrderWorkspace.tsx`: thêm `usePosReceiptSettings()`, `usePosReceiptPrint()`, `autoPrintedOrderIdRef`, prop optional `receiptPrintTab?: string`
- [ ] 6.8 Cùng file: trong `onSuccess` của `handleComplete` — build document **đồng bộ tại đây** (vì `useCompleteOrder` invalidate order query) từ `visibleLines` trong closure + `result`, rồi `setAutoPrintIntent({ orderId, copies, doc })`; `copies < 1` → return
- [ ] 6.9 Cùng file: effect fire intent một commit sau; `autoPrintedOrderIdRef.current` gán **trước mọi việc async**; render `{printSurface}`
- [ ] 6.10 `views/pos/PosFrontDeskView.tsx`: `usePassPrntReturn({ surface:'frontDesk', onRestore })` dùng `setUpdateWorkspace(...)` sẵn có; truyền `receiptPrintTab={activeTab}` tại 2 call site của `PosOrderWorkspace`
- [ ] 6.11 `views/pos/PosOrderWorkspace.autoPrint.test.tsx` (L3): `Card` + `cardCopies=2` → `printReceipt` gọi 1 lần với `copies:2`, **sau khi** `completedPayment` set, money bằng response `CompleteOrder` · `Cash` + `otherCopies=0` → không gọi · double-tap Complete → đúng 1 lần · `sms`/`none` → không in · transport fail → toast + `logger.error` + success view vẫn render
- [ ] 6.12 Test L3 callback: `?passprnt_code=0` với job 2 bản → bản 2 fire 1 lần, param bị strip, workspace restore đúng `orderId` · `?passprnt_code=4` → job cleared, không re-fire, toast lỗi · job cũ hơn `PASSPRNT_JOB_STALE_MS` không có code → cleared + toast · re-print từ completed → `copies:1`, không persist job

## 7. i18n

- [ ] 7.1 `src/locales/en.json` + `vi.json`: `dashboard.menu.pos_printer`
- [ ] 7.2 Cả 2 file: namespace `components.dashboard.views.pos.printer.*` — title/description trang; card 1 (title, badge method, radio, 3 step label + hint, nút Install/Test print, panel last-test, toast "PassPRNT chưa cài"); card 2 (4 nhãn + hint theo mockup, nhãn khổ giấy 80mm/58mm, cut, badge dirty/saved); toast thành công/thất bại
- [ ] 7.3 Cả 2 file: một message cho **mỗi** `passprnt_code` cần xử lý (`passprntError.3/4/5/6/7/8/9/14/16` + fallback)
- [ ] 7.4 Cả 2 file: **xoá** key chết `receiptPrintComingSoon`
- [ ] 7.5 Đối chiếu số key `en`/`vi` bằng script Node tạm trong scratchpad (`pnpm lint:tokens` hỏng sẵn vì `scripts/verify-tokens.cjs` bị gitignore)

## 8. Đóng

- [ ] 8.1 `pnpm typecheck` — không phát sinh lỗi mới trong file bị sửa (baseline repo đỏ 72 lỗi)
- [ ] 8.2 `pnpm test`
- [ ] 8.3 `pnpm build`
- [ ] 8.4 **Verify trên iPad Safari + app PassPRNT + máy in Star thật**: Test print → confirm quay về `/dashboard/pos/printer?passprnt_code=0`; confirm wording bước 2 khớp UI thật của app
- [ ] 8.5 Checkout thật trên dev API, `Card` + `cardCopies=2` → hai bill giống nhau, mỗi bill cắt một lần, tổng in ra bằng response `CompleteOrder`
- [ ] 8.6 Lỗi có chủ ý: tắt máy in giữa job → note code 4 đúng, không retry storm, fallback browser hoạt động
- [ ] 8.7 Cập nhật trạng thái `user-story/US-047-pos-receipt-printing.md` + link TC; ghi deviation vào "Ghi chú phiên thực thi"
- [ ] 8.8 Gửi BE 4 câu hỏi trong US-047 (`receiptToken` cho `url=`; receipt settings per-business?; sales tax khi bill có products — `servicesNet` cho thấy products không bị tính thuế; có in `salesTaxRatePercent`?)
