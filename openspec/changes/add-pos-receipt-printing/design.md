# Design — POS receipt printing via Star PassPRNT

Story: `user-story/US-047-pos-receipt-printing.md`

## Bối cảnh kỹ thuật

Repo là React 18 + Vite + React Router (SPA), **không** có Capacitor/native shell — `ios/` + `android/` là di sản đã chết (không `capacitor.config.*`, không `@capacitor/*` trong `package.json`), và `src/utils/scrollToPageTop.ts` tham chiếu một `initNativeShell` không tồn tại trong `src/`. Vì vậy Star SDK native không khả thi, và **PassPRNT là đường in duy nhất cho máy in nhiệt** ngoài hộp thoại in của OS.

## Kiến trúc

```
PosPrinterSetupView ───┐
PosOrderWorkspace ─────┼─► usePosReceiptPrint() ─► passprntTransport | browserPrintTransport
PosCompletedOrdersPanel┘         │                        │
                                 │                        └─► starpassprnt:// navigate / window.print()
                                 ▼
                    buildPosReceiptDocument() ◄── usePosReceiptSettings() (TanStack Query)
                       │              │                     │
        PosReceiptPrintDocument   posReceiptHtml     posPrinterSettingsRepository ─► src/utils/storage.ts
             (JSX renderer)      (string renderer)

PosFrontDeskView / PosPrinterSetupView ─► usePassPrntReturn()  (callback leg + copy queue)
```

Quy tắc cấu trúc quan trọng nhất: **`PosReceiptDocument` là nguồn sự thật duy nhất.** Cả preview trên màn và HTML gửi PassPRNT tiêu thụ *cùng một* document đã resolve. Đây là rủi ro số một của feature (preview đẹp nhưng giấy in thiếu dòng), nên nó được enforce bằng một test so sánh text content của hai renderer.

## Map US ↔ endpoint ↔ FE file

| AC (US-047) | Endpoint | FE file |
|---|---|---|
| AC1, AC2, AC3 auto-print + số bản | `POST .../checkout/{orderId}/complete` | `PosOrderWorkspace.tsx`, `usePosReceiptPrint.ts`, `usePassPrntReturn.ts`, `posReceiptDocument.ts` (`resolveReceiptCopies`) |
| AC4, AC5 lỗi & app chưa cài | — | `usePassPrntReturn.ts`, `passprntTransport.ts` (`parsePassPrntCallback`), locale `passprntError.*` |
| AC6 test print | — | `PosPassPrntCard.tsx`, `posPrinterSettings.ts` (`savePrinterProfile`) |
| AC7 lưu receipt settings | — | `PosReceiptSettingsCard.tsx`, `usePosPrinterSettings.ts`, `posPrinterSettings.ts`, `queryKeys.ts` |
| AC8 nội dung bill | `GET .../checkout/{orderId}`, `GET /api/v1/merchant/business` | `posReceiptDocument.ts`, `PosReceiptPrintDocument.tsx`, `posReceiptHtml.ts`, `PosReceiptPrintPreview.tsx` |
| AC9 preview khớp giấy in | — | `posReceiptHtml.test.ts` (test chống lệch) |
| AC10 re-print 1 bản | `GET .../orders/completed` | `PosCompletedOrdersPanel.tsx` |
| AC11 browser transport | — | `browserPrintTransport.ts`, `src/index.css` |

**Không endpoint mới nào.** Cấu hình máy in lưu per-device qua `src/utils/storage.ts`.

## Quyết định kiến trúc

### 1. Repository local, sync, injectable store

`posPrinterSettings.ts` theo factory + singleton của `posBookingSettings.ts`, nhưng backing store là `storage` thay vì `httpClient`.

- **Sync, không trả `Promise`.** `posBookingSettings.ts` async vì HTTP async; storage thì không, và transport (caller không phải React) cần đọc profile ngay tại thời điểm fire. Trả `Promise` ở đây là cargo-cult.
- Là **file duy nhất chạm `storage`** cho các key này và là nơi duy nhất `JSON.parse` + clamp → giữ component sạch theo data boundary của `AGENTS.md`.
- Store **injectable** (`createPosPrinterSettingsRepository(store = storage)`) để test không phụ thuộc state của jsdom storage.
- **Không** đi qua `src/data/adapters/storageAdapter.ts` — `ARCHITECTURE.md` ghi rõ đó là legacy gap, không phải boundary để mở rộng.
- Storage key theo convention repo (`pos_order_list_view_mode` trong `src/constants/posFrontDesk.ts`), **không** theo `nexora.pos.printer.*` của mockup HTML — mockup là app khác. `storage.ts` tự thêm prefix `nexora_v3_`.

### 2. TanStack Query cho một phép đọc đồng bộ

Có vẻ là nghi thức thừa, nhưng trang Printer setup và màn checkout nằm ở **hai route khác nhau** — save ở một bên phải invalidate bên kia. Đó là house rule của repo và ở đây nó thực sự load-bearing. Query key dưới namespace **`posDevice`** mới, **không có `businessId`**: đặt dưới `merchantSettings` sẽ hàm ý một business scope không tồn tại.

### 3. `back` path-only, state trong job đã persist

PassPRNT append `?passprnt_code=…&passprnt_message=…` vào `back`. Hành vi khi `back` **đã có** `?` không được tài liệu hoá → bỏ hẳn giả định không kiểm chứng được đó: `back` luôn là `${window.location.origin}/dashboard/pos` hoặc `.../dashboard/pos/printer`, không query string. Mọi state cần để resume nằm trong `PosPendingPrintJob`.

Dùng `window.location.origin`, **không** `getWebUrlOrigin()` từ `src/utils/webUrlBase.ts` — helper đó trả origin customer-facing (`VITE_VLINKPAY_WEB_URL_BASE`), là host khác với dashboard.

Việc restore dùng đúng API mà `PosFrontDeskView` đã sở hữu — `setUpdateWorkspace(...)`, vốn set `activeTabState` **và** rewrite URL qua `writePosWorkspaceToParams`, cộng effect sync `[searchParams]`. **Zero URL param mới.** `PosOrderWorkspace` chỉ nhận thêm một prop optional `receiptPrintTab?: string`.

### 4. `copies > 1` chỉ ở đường auto-print

Mọi nút Print / Re-print thủ công in đúng 1 bản, không queue. Điều này xoá cả một lớp vấn đề: modal detail của `PosCompletedOrdersPanel` là local state không có URL param nên vốn **không thể** restore sau round-trip PassPRNT. Nó cũng khớp kỳ vọng của nhân viên — bấm re-print thì ra một tờ.

### 5. Browser mode: một `window.print()` với N page-break

Không phải N lần gọi. `afterprint` không đáng tin trên iOS Safari, và N lần gọi = N hộp thoại in. Host offscheen **phải là portal ở body-level, sibling của `#root`**, vì rule sẵn có `body.printing-pos-invoice > #root { display: none }` (thứ chặn trang trắng thứ hai) sẽ ẩn nó nếu nằm trong `#root`.

### 6. Transport đặt trong `views/pos/receipt/`, không `src/lib/`

`vitest.config.ts` chỉ include `tests/unit/**`, `src/components/**`, `src/data/**` — test đặt trong `src/lib` sẽ **âm thầm không bao giờ chạy**. Không có gì ngoài `src/components` cần các module này nên không có đảo boundary. Nếu về sau muốn `src/lib/printing/` cho đối xứng với `posDeviceHttpClient.ts` thì phải thêm `src/lib/**/*.test.ts` vào vitest `include` trong cùng change.

### 7. Build document trong `onSuccess`, fire trong effect

`useCompleteOrder` invalidate order query, nên tới lúc effect chạy thì `order` có thể đang refetch. Vì vậy document được build **đồng bộ ngay trong `onSuccess`** từ `visibleLines` trong closure (snapshot đúng của line trước khi complete — Complete không đổi line) cộng `result` mang money server đã confirm. Effect chỉ *fire* intent một commit sau, khi success view và print portal đã render.

`autoPrintedOrderIdRef.current` được gán **trước mọi việc async** → StrictMode double-invoke, re-render, và double-tap Complete đều bị chặn. `startTicketAction(TicketBusySurface.Complete)` là guard thứ hai độc lập. Đây đúng là loại async-ordering mà `AGENTS.md` có mục riêng để cảnh báo.

### 8. HTML cho PassPRNT dùng px map sang dots

PassPRNT render HTML thành ảnh ở độ phân giải máy in, nên `mm` và stylesheet của app đều vô nghĩa bên trong nó. `body { width: widthDots / 8 mm }` → 576 dots = 72mm, khớp `80mm` hiện tại trừ `4mm` padding hai bên, nên preview và giấy trùng nhau về thị giác. Pattern builder copy từ `src/components/dashboard/views/plans/packageHistoryDocuments.ts` (builder `.ts` thuần + object copy đã dịch sẵn + `escapeHtml`).

`<meta name="format-detection" content="telephone=no">` giờ mới thực sự cần, vì bill bắt đầu in số điện thoại khách — không có nó iOS gạch chân thành link `tel:`.

`escapeHtml()` giữ bản copy cục bộ của đúng hàm 5-replace đã dùng ở `PublicCheckInQrPanel.tsx`. Nâng lên `src/utils/escapeHtml.ts` và rewire 2 caller cũ là **ngoài scope** (`AGENTS.md`: tránh refactor cơ hội) — ghi thành follow-up.

### 9. Size gate trước khi navigate

Nếu `encodeURIComponent(html).length` vượt budget hoặc chiều cao ước lượng vượt 8.000px → trả `{ tooLarge: true }`, **không** navigate; caller log + toast + fallback browser cho job đó. Việc này pre-empt error code 3 của PassPRNT và việc iOS cắt URL — nếu không, lỗi hiện ra dưới dạng "in ra giấy trắng" rất khó truy.

## Những gì mockup vẽ mà PassPRNT không cho làm

| Mockup | Thực tế | Thay bằng |
|---|---|---|
| "Find printer" + list Bluetooth/LAN | Discovery nằm trong app PassPRNT, web không có API | Bỏ. Text hướng dẫn chọn máy in trong PassPRNT |
| Status chip `ready/paperLow/coverOpen/connectionLost` + note mỗi status | Không có kênh status; tín hiệu duy nhất là `passprnt_code` của một job đã xong | Panel "kết quả test lần cuối": outcome + code + note + timestamp. Copy note của mockup được tái dùng làm note theo mã lỗi |
| "Installed ✓" | iOS không cho probe URL scheme | Bỏ. Không claim trạng thái cài đặt nào |
| "Change printer" / "Disconnect" | Web không sở hữu kết nối nào | Bỏ |
| Toggle "Preview as iPad App / Safari", status simulator | Chỉ là công cụ demo | Bỏ. Thay bằng radio chọn transport tường minh |
| Nút "Open PassPRNT" | `starpassprnt://` trần không kèm dữ liệu in trả error 9 | Bước 2 chỉ là hướng dẫn, không có nút — tới khi ai đó verify được path settings-only trên thiết bị thật |

Lý do bỏ từng mục phải được ghi trong comment đầu file của `PosPassPrntCard.tsx` — repo có convention "design rationale" mạnh ở đầu mỗi file POS.

## Thứ tự thực thi

Mỗi phase độc lập ship được và để cây code xanh; hai mảnh thực sự chưa chắc chắn (contract của document, rồi round-trip trên thiết bị) được kéo lên sớm nhất có thể. **Phase 1–4 không cần iPad.**

1. **Nền** — constants, repository + test, query keys, hook.
2. **Document** (rủi ro cao nhất, trước transport) — `posReceiptDocument`, `PosReceiptPrintDocument`, `posReceiptHtml` + test chống lệch. Hết phase này, preview và HTML *chứng minh được* là giống nhau.
3. **Transport** — browser trước (là fallback, không cần thiết bị), rồi PassPRNT (build URL thuần, unit-test được toàn bộ), rồi CSS.
4. **Migrate surface in hiện có sang document** — chưa có gì mới hiện ra với người dùng, nhưng bill đã có Subtotal/Sales tax/tên khách/phone và 2 block trùng lặp đã biến mất.
5. **Trang Printer setup** + route/nav + locale.
6. **Orchestration + auto-print** — `usePosReceiptPrint`, `usePassPrntReturn`, wire vào `PosOrderWorkspace` và `PosFrontDeskView`. Verify round-trip trên iPad thật ở đầu phase này.
7. **Đóng** — typecheck/test/build, cập nhật trạng thái story.

## Rủi ro

| Rủi ro | Xử lý |
|---|---|
| `back` = https URL của SPA chưa verify trên thiết bị (sample của Star chạy trên trang HTML tĩnh) | Đã giảm thiểu bằng "back path-only + state trong job persist". Verify ở đầu phase 6 trên iPad thật; nếu fail → `back` trỏ về một trang tĩnh trong `public/` rồi redirect vào SPA |
| Giới hạn độ dài URL scheme trên iOS | Size gate trước khi navigate + fallback browser; xin `receiptToken` để chuyển sang `url=` |
| Không biết PassPRNT đã cài chưa | Stale sweep 90s + nút Install rõ ràng. Không claim trạng thái cài đặt |
| Preview lệch bill in ra | Một document cho cả hai đường + test chống lệch (lệch = fail build) |
| `initStorage()` xoá mọi key `nexora_*` khi `STORAGE_PREFIX` đổi | Bump storage version reset printer profile + receipt settings. Chấp nhận — hồi phục bằng một Test print và 4 chạm — nhưng phải nói ra, không để tự phát hiện |
| In N bản = N lần rời app | Queue persist + hiện "đang in bản 2/3" để nhân viên khỏi tưởng treo |
| Nhân viên reload/bấm back giữa queue | Chỉ resume khi có `passprnt_code`; strip param `{ replace: true }`; `firedAttempts` cap 1/bản |
| Máy in không phải Star | PassPRNT chỉ hỗ trợ máy in Star. Nêu rõ trên UI; `transport: 'browser'` là đường cho mọi máy in khác |

## Trade-off

| Quyết định | Giá phải trả | Vì sao vẫn chọn |
|---|---|---|
| Một document cho cả 2 renderer | Thêm một module và một lớp gián tiếp | Hai renderer độc lập của cùng một bill *sẽ* lệch; test chống lệch biến việc lệch thành fail build |
| Persist document đã resolve trong job | Vài KB storage, một shape có version phải maintain | Bản 2 phải giống bản 1 sau khi app remount hoàn toàn, lúc query cache còn lạnh |
| `back` path-only, state trong storage | Hai surface mỗi bên phải host return hook | Xoá một giả định không kiểm chứng được về cách PassPRNT nối query callback |
| `copies > 1` chỉ ở auto-print | Re-print thủ công luôn 1 bản | Xoá cả lớp vấn đề "restore một modal không có biểu diễn URL"; khớp kỳ vọng nhân viên |
| Browser mode = 1 job N page-break | Cần portal offscreen ở body-level | `afterprint` không đáng tin trên iOS Safari, và N lần gọi = N hộp thoại |
| TanStack Query cho một lần đọc storage | Nghi thức cho một phép đọc đồng bộ | Là cách duy nhất để trang Printer và màn checkout đồng bộ, và là pattern invalidation của repo |
| Transport ở `views/pos/receipt/`, không `src/lib/` | Kém đối xứng với `posDeviceHttpClient.ts` | `vitest.config.ts` không include `src/lib/**` — test ở đó âm thầm không chạy |
| Sub-route thay vì card trong General Settings | POS children 10 → 11 | Printer là cấu hình *của thiết bị này*; trộn vào trang business-scoped mời gọi "tôi set ở laptop văn phòng, sao front desk không in" |
| Radio chọn transport tường minh, không probe | Nhân viên phải quyết định thêm một lần | iOS không cho web detect PassPRNT; auto-detect giả sẽ là một lời nói dối |
| Stepper là button + span, không `<input type="number">` | Không nhập nhanh được số | Input sẽ gọi bàn phím iOS trên POS iPad và kéo theo yêu cầu placeholder của `AGENTS.md` mà chẳng được gì; miền giá trị chỉ 0..3 |
