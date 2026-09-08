## Why

POS đã in được bill nhưng chỉ ở mức mở hộp thoại in của OS: `PosReceiptPrintPreview.tsx` render bill rồi gọi `window.print()`, print CSS 80mm thật đã có trong `src/index.css`, và có 3 entry point (preview trước thanh toán, sau thanh toán, re-print từ Completed). Xem `user-story/US-047-pos-receipt-printing.md`.

Năm khoảng trống, xếp theo mức nghiêm trọng:

1. **Bill thiếu Subtotal và Sales tax** — chỉ in Tip / Discount / Total. Đây là vấn đề *tính hợp lệ của hoá đơn*. Key locale `summarySubtotal`/`summarySalesTax` đã tồn tại nhưng không được render; `OrderDetailDto.salesTaxAmount` đã có sẵn từ BE.
2. **Chip "Print" ở checkout không in gì cả** — `receiptChoice === 'print'` chỉ được dùng làm nhãn trên màn success.
3. **Không có trang Printer setup** — không route, không cấu hình, không test print. Chỉ còn key locale chết `receiptPrintComingSoon` mà không code nào tham chiếu.
4. **Không có số bản in, không chọn được nội dung in.**
5. **Mỗi bill phải qua dialog OS** — trên iPad là AirPrint, 3-4 chạm mỗi lần thanh toán.

Đường in đã chốt là **Star PassPRNT URL scheme** (`window.print()` giữ làm fallback), vì repo không có Capacitor/native shell nào để chạy Star SDK — `ios/`+`android/` là di sản đã chết và `src/utils/scrollToPageTop.ts` tham chiếu một `initNativeShell` không tồn tại trong `src/`.

## What Changes

- **Constants** `src/constants/posPrinter.ts` (mới): mọi literal PassPRNT — path, `PassPrntCode` (0/3/4/5/6/7/8/9/14/16), `cut`/`drawer`/`popup`, `RECEIPT_PAPER_WIDTH_DOTS` (576 = cuộn 80mm, 406 = cuộn 58mm — **dots, không phải mm**), bounds số bản 0..3, size gate, `PASSPRNT_JOB_STALE_MS`, 3 storage key, defaults.
- **Persist per-device** `src/data/repositories/posPrinterSettings.ts` (mới) + `usePosPrinterSettings.ts` + 2 query key dưới namespace `posDevice` (không `businessId`): `PosPrinterProfile` (transport, khổ giấy, kết quả test lần cuối), `PosReceiptSettings` (`printProducts`, `sortServices`, `cardCopies`, `otherCopies`), `PosPendingPrintJob` (print queue). Repository là **file duy nhất chạm `storage`** cho các key này và là nơi duy nhất `JSON.parse` + clamp.
- **Một nguồn sự thật cho bill**: `views/pos/receipt/posReceiptDocument.ts` (`buildPosReceiptDocument` + `resolveReceiptCopies`) nuôi **cả hai** renderer — `PosReceiptPrintDocument.tsx` (JSX, cho preview) và `posReceiptHtml.ts` (string HTML5 tự chứa, cho PassPRNT). Thay thế 2 block build group đang trùng lặp trong `PosOrderWorkspace.tsx` và `PosCompletedOrdersPanel.tsx` — đây là tiền đề để các toggle settings có ý nghĩa, không phải refactor cơ hội.
- **Hai transport** `views/pos/receipt/`: `passprntTransport.ts` (build URL + size gate + parse callback) và `browserPrintTransport.ts` (`printDomWithBodyClass`, rút từ 2 chỗ trùng nguyên văn). Đặt trong `views/` chứ không `src/lib/` vì `vitest.config.ts` không include `src/lib/**` → test ở đó sẽ âm thầm không chạy.
- **Print queue qua reload**: `usePosReceiptPrint.ts` + `usePassPrntReturn.ts`. PassPRNT không in được N bản trong một lần gọi, và mỗi lần in là một lần rời web app rồi callback về → queue persist, mỗi callback thành công thì in bản kế tiếp; dedupe theo `jobId`, strip callback param `{ replace: true }`, `firedAttempts` cap 1/bản, **không bao giờ auto-retry**.
- **Trang Printer setup** `/dashboard/pos/printer`: `PosPrinterSetupView` + `PosPassPrntCard` (radio transport, 3 bước Install/Open/Test print, panel kết quả test lần cuối) + `PosReceiptSettingsCard` (2 toggle + 2 stepper + Save) + `PosCopiesStepper`. Thêm child `printer` vào POS menu, `PosPrinterSetupRoute`, route trong `AppRouter`.
- **Auto-print**: `PosOrderWorkspace` build document đồng bộ trong `onSuccess` của `handleComplete` (vì `useCompleteOrder` invalidate order query nên effect chạy sau có thể gặp `order` đang refetch), rồi một effect fire một commit sau với ref-guard gán trước mọi async. Số bản theo payment method: `Card` → `cardCopies`, còn lại → `otherCopies`; `0` → không in.
- **Bill bổ sung**: Subtotal, Sales tax, tên khách, số điện thoại khách (qua `formatCustomerPhone` từ `customerPhoneE164`). `PosReceiptPrintPreview` gọn từ 15 prop xuống `{ open, onClose, doc, onPrint }`.
- **i18n** en+vi: `dashboard.menu.pos_printer` + namespace `components.dashboard.views.pos.printer.*` (kèm một message cho mỗi `passprnt_code`); **xoá** `receiptPrintComingSoon`. Zero key mới cho bill — 4 key cần dùng đã tồn tại.

## Impact

- **Capability**: `pos-receipt-printing` (mới).
- **API**: **không endpoint mới nào.** Dùng `GET .../checkout/{orderId}` (`OrderDetailDto`), `POST .../checkout/{orderId}/complete` (`CompleteOrderResultDto`), `GET /api/v1/merchant/business` (`BusinessDto`) — FE đã gọi sẵn cả ba. Cấu hình máy in lưu per-device, không qua API.
- **Files changed**: xem bảng FE Surface trong US-047 (constants 1 mới; types 3 interface; repository 1 mới; query keys 2; hook 1 mới; document/renderer/transport/orchestration 7 mới dưới `views/pos/receipt/`; UI 4 mới dưới `views/pos/printer/`; 4 component POS sửa; route/nav 3 sửa; `index.css`; 2 locale).
- **Behavior**: mọi đường in hiện tại vẫn hoạt động — transport mặc định là `browser`, tức hành vi không đổi tới khi người dùng chủ động chọn PassPRNT trong Printer setup. Bill có thêm 4 dòng nội dung ngay sau Phase 4, trước khi có bất kỳ UI mới nào. `receiptChoice = 'print'` lần đầu tiên thực sự in.
- **Không block BE.** 4 câu hỏi BE trong US-047 (`receiptToken` để dùng `url=`; receipt settings có nên per-business; sales tax khi bill có products vì `servicesNet` cho thấy products không bị tính thuế; có in `salesTaxRatePercent` không) đều là cải tiến về sau, không cản v1.
