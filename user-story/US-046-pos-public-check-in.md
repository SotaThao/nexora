# US-046 · POS Public Check-In (khách tự check-in trên điện thoại của khách)

| | |
|---|---|
| **Trạng thái** | Integrated (FE) — **chờ BE deploy để chuyển sang Tested** |
| **Ngày tạo** | 2026-09-01 |
| **Epic / Domain** | POS · Check-in (bề mặt thứ ba, sau Front desk và Kiosk) |
| **OpenSpec change** | — (thiết kế đã chốt ở `POS-Public-Check-In-Technical.md`, không dựng change riêng) |
| **Test plan** | `src/data/repositories/publicCheckIn.test.ts` · `src/components/public/checkin/PublicCheckInPage.test.tsx` |

## Story

**Là** khách hàng (anonymous, không đăng nhập),
**tôi muốn** quét QR dán ở cửa tiệm rồi tự nhập số điện thoại — tên — dịch vụ — thợ ngay trên điện thoại của mình,
**để** lấy được số thứ tự mà không phải xếp hàng chờ quầy lễ tân, và tiệm không phải mua thêm thiết bị nào.

## Acceptance Criteria

- **Given** `PublicCheckInEnabled = false` (mặc định), **when** khách mở `/checkin/{slug}`, **then** trang hiện đúng một thông báo "Check-in is not available" — không phân biệt được với slug không tồn tại (anti-enumeration, §6/§13).
- **Given** tính năng đã bật, **when** khách nhập đủ 10 số, **then** FE gọi `GET customer-lookup` + `active-visit` + `booking` (3 request, đều `anonymous`), rồi mới hiện trang single-page.
- **Given** số điện thoại chưa có lượt nào đang mở, **when** khách nhập tên, chọn dịch vụ và bấm *Check in*, **then** `POST /orders` được gọi với `customerName` + `customerPhone` + `items[]`, **không** kèm `allowDuplicatePhone`; màn cảm ơn hiện `orderNumber` và link trang trạng thái.
- **Given** số điện thoại đã có lượt `Waiting`/`InService` hôm nay, **when** khách nhập xong số, **then** hiện màn chặn 2 nút; *That's me* → hiện lại số thứ tự cũ (không tạo đơn), *Check in another guest* → về form và lần submit sau gửi `allowDuplicatePhone: true`.
- **Given** khách có booking hôm nay trong cửa sổ convert (`canCheckInNow = true`), **when** submit, **then** gọi `POST /bookings/check-in` (**không** `POST /orders`) — không sinh đơn thứ hai; dịch vụ/thợ của booking được prefill sẵn.
- **Given** booking ngoài cửa sổ (`canCheckInNow = false`), **when** khách vào trang, **then** hiện giờ hẹn + giờ mở check-in, nút submit bị disable — không cho tạo đơn nào.
- **Given** đã check-in xong, **when** khách mở `/checkin/status/{receiptToken}`, **then** trang hiện `orderNumber` + vị trí hàng chờ, tự refresh 15 giây, và không lộ dịch vụ/giá/thợ.

## API Mapping

> ⚠️ **Endpoint vẫn chưa lên Swagger.** Verify lại 2026-09-01 (sau bản doc cập nhật): `https://test-api.nexoratouch.com/api/specification.json` và `https://localhost:5005/api/specification.json` đều **không có** path nào chứa `/api/v1/checkin/`. Shape dưới đây theo `POS-Public-Check-In-Technical.md` §6 (bản cập nhật, đã có bảng "Chốt cho FE") + DTO kiosk `SelfCheckIn*` đang có thật trên Swagger. Tag (D) = design doc, (K) = khớp DTO kiosk đã verify live.

| Method | Endpoint | Auth | Request | Response | Nguồn |
|---|---|---|---|---|---|
| GET | `/api/v1/checkin/{businessSlug}` | Anonymous | — | `businessName`, `logoUrl`, `businessAddress`, `businessPhone`, `layout`, `services[]` (phẳng, kèm `categories[]`), `technicians[]` (`posStaffProfileId` + `serviceIds` + `isBusy`) | (D) + (K) `SelfCheckInContextDto`/`ServiceDto`/`TechnicianDto` |
| GET | `/api/v1/checkin/{businessSlug}/customer-lookup?phone=` | Anonymous | query `phone` | `{ displayName }` \| null — **chỉ** `displayName`, không kèm `serviceLines` như DTO của booking | (D) `GetPublicCheckInCustomerLookupQuery` |
| GET | `/api/v1/checkin/{businessSlug}/active-visit?phone=` | Anonymous | query `phone` | `{ orderNumber, receiptToken }` \| null | (D) |
| GET | `/api/v1/checkin/{businessSlug}/booking?phone=` | Anonymous | query `phone` | `bookingId`, `scheduledAt`, `customerName`, `items[]`, `canCheckInNow`, `earliestCheckInAt` | (K) + 2 field mới của (D) |
| POST | `/api/v1/checkin/{businessSlug}/orders` | Anonymous | `customerName` (**bắt buộc**), `customerPhone`, `items[]` (được phép rỗng), `allowDuplicatePhone?` | `orderId`, `orderNumber`, `receiptToken` | (D) |
| POST | `/api/v1/checkin/{businessSlug}/bookings/check-in` | Anonymous | `bookingId`, `customerName`, `items[]` | như trên | (D) |
| GET | `/api/v1/checkin/status/{receiptToken}` | Anonymous | — | `orderNumber`, `status`, `peopleAhead`, `businessName` | (D) |

**Các điểm từng treo — doc bản cập nhật §6 "Chốt cho FE" đã trả lời hết:**

| Câu hỏi | Chốt | FE đã theo |
|---|---|---|
| `active-visit` có `receiptToken`? | **Có** | `PublicCheckInActiveVisitApiDto.receiptToken`; nút *That's me* nối thẳng sang `/checkin/status/{token}` |
| Tên field id của thợ | `posStaffProfileId` | đúng từ đầu (theo DTO kiosk) |
| `layout` serialize | String (`"SinglePage"`), `JsonStringEnumConverter` | `layout: PosCheckInLayout` (enum string) |
| Đơn trống dịch vụ | Được nhận, có chủ ý | FE cho submit khi chưa chọn dịch vụ, kèm dòng gợi ý |
| `customerName` | **Bắt buộc** ở public | FE chặn ở client trước khi gọi API |
| Rate limit | `429` + `errorCode = COMMON_RATE_LIMIT_EXCEEDED` + `Retry-After` | mã này **đã có sẵn** trong `errorCodes.ts` + cả 2 locale → `getErrorMessage` tự dịch, không cần thêm gì |

## FE Surface

| Layer | File | Thay đổi |
|---|---|---|
| Route | `src/app/AppRouter.tsx` | thêm `/checkin/:businessSlug` và `/checkin/status/:receiptToken`, lazy, đặt cạnh route booking public |
| Component | `src/components/public/checkin/PublicCheckInPage.tsx` | mount `CheckInSurface` dùng chung + shell riêng của bề mặt public (header tiệm, link hàng chờ). Vòng 5 |
| Component | `src/components/public/checkin/PublicCheckInStatusPage.tsx` | trang trạng thái theo `receiptToken`, poll 15s |
| Source hook | `src/components/checkin/sources/usePublicCheckInSource.ts` | source thứ ba của module check-in, cạnh kiosk và front desk. Vòng 5 |
| Module dùng chung | `src/components/checkin/{types.ts,useCheckInSession.ts,CheckInSurface.tsx}` | 5 điểm mở rộng optional (`receiptToken`, `doneSlot`, `onCancelled(token)`, `checkInBlockedMessage`, `allowDuplicatePhone`). Vòng 5 |
| Helper | `src/components/public/checkin/publicCheckInUtils.ts` | chỉ còn `formatBookingWallClockTime` (wall-clock qua UTC getters) |
| Data hook | `src/data/hooks/usePublicCheckIn.ts` | query key `qk.publicCheckInPage/...CustomerLookup/...ActiveVisit/...Booking/...Status`; không invalidate (bề mặt anonymous, không có cache dùng chung), status page dùng `refetchInterval` 15s |
| Repository | `src/data/repositories/publicCheckIn.ts` | encode slug, `anonymous: true`, chuẩn hoá lookup rỗng → `null` |
| Types | `src/types/repositories.ts` | 12 interface `PublicCheckIn*` |
| Constants | `src/constants/posCheckInLayout.ts` | `PosCheckInLayout` dạng const object + union type (không hardcode string enum của BE, và literal vẫn gán được — xem vòng 5) |
| Error codes | `src/data/errorCodes.ts` | `POS_BOOKING_CHECK_IN_TOO_EARLY` / `..._TOO_LATE`. `COMMON_RATE_LIMIT_EXCEEDED` **đã có sẵn**, không thêm |
| Component (merchant) | `src/components/dashboard/views/pos/PublicCheckInQrPanel.tsx` | QR + link + tải PNG + in poster A4, render trong `PosGeneralSettingsView` cạnh `PosBookingSettingsPanel` |
| i18n | `src/locales/en.json`, `vi.json` | 19 key `public.checkIn.*` (vòng 5 xoá 34 key đã chuyển sang `components.checkin.*`) + `components.checkin.CheckInSurface.blockedBack` + 12 key `...PublicCheckInQrPanel.*` + 2 key `errors.*` |

## Definition of Done

- [ ] AC pass trên môi trường dev (API thật) — **blocked: BE chưa deploy endpoint**
- [ ] API call đúng contract đã map (verify bằng network trace)
- [x] Không có mutation nào cần invalidate cache dùng chung (bề mặt anonymous — đã rà)
- [x] Không console error / không `console.*` trong code mới
- [x] Test L2 data boundary: `publicCheckIn.test.ts` (8 test) · L1/L3 UI+flow: `PublicCheckInPage.test.tsx` (8 test) · merchant QR: `PublicCheckInQrPanel.test.tsx` (8 test)
- [ ] Chụp màn hình ở 375×667 — **chưa làm được vì chưa có API để render trang thật**. Sau vòng 5 rủi ro layout thấp hẳn: phần thân trang là `CheckInSurface` đã chạy trên kiosk và front desk
- [ ] Cập nhật trạng thái file này + link TC sau khi test trên dev

## Ghi chú phiên thực thi

- **Doc sai 1 điểm:** `POS-Public-Check-In-Technical.md` §9 ghi "repo không có alias `@/`". Thực tế `vite.config.ts` **có** map `@/` → `src/`. Dù vậy code mới vẫn dùng relative import cho khớp các file public lân cận (`PublicBookingPage.tsx`, `ManageBookingPage.tsx` đều relative).
- **Tái dùng `PhoneCheckInStep`** (`src/components/dashboard/views/pos/`) thay vì copy: chính comment đầu file của nó nói được thiết kế để "drop vào màn self-checkin chưa dựng" mà không sửa. Nó không đọc state nào của POS workspace nên không vi phạm ràng buộc "không đụng luồng đang chạy".
- **Số điện thoại gửi lên ở dạng national đã format** (`555-123-4567`), khớp đúng cái `PosOrderWorkspace.tsx:655` đang gửi cho check-in của merchant — không tự đổi sang E.164.
- **Booking ngoài cửa sổ thì chặn hẳn**, không cho fallback tạo đơn walk-in: tránh việc cùng một khách vừa có booking vừa có đơn vãng lai trong hàng chờ. Khớp doc §12 mục 6.
- **Layout `Wizard`**: đọc `layout` từ API nhưng Phase 1 render `SinglePage` cho mọi giá trị (doc §9) — enum có sẵn ở `src/constants/posCheckInLayout.ts` để ticket sau rẽ nhánh.

### Vòng 2 — sau bản doc cập nhật (2026-09-01)

Doc bổ sung bảng "Chốt cho FE" (§6) trả lời cả 6 câu hỏi treo. Ba thay đổi thực sự chạm code:

1. **`active-visit` trả thêm `receiptToken`** → `PublicCheckInActiveVisitApiDto` thêm field; state của trang giữ nguyên cả DTO thay vì chỉ `orderNumber`; nút *That's me* giờ dẫn được sang `/checkin/status/{receiptToken}`. Có test mới khẳng định link đó tồn tại — đây là điểm dễ âm thầm hỏng lại nhất.
2. **Page info trả thêm `businessPhone`** → thêm vào DTO và hiển thị dưới địa chỉ ở header, dạng `tel:` (khách đang cầm điện thoại, bấm gọi được luôn).
3. **Rate limit** dùng `COMMON_RATE_LIMIT_EXCEEDED` — mã này đã nằm sẵn trong `errorCodes.ts` và cả hai locale, nên `getErrorMessage(err, t)` ở trang này tự ra copy đúng. Không phải sửa gì.

Không chạm code: `services[]` phẳng kèm `categories[]` (FE gom sẵn từ vòng 1 — giống hệt public booking page), `posStaffProfileId`, `layout` dạng string, đơn trống dịch vụ được nhận, `customerName` bắt buộc — tất cả đã khớp từ vòng 1. Việc BE gộp helper dùng chung (§10) không đổi request/response nào.

**Doc còn 2 chỗ vênh, nhờ team xác nhận:**

- §12 mục 9 vẫn viết "bắn 5 request submit → request **thứ 4** trở đi bị rate limit", trong khi bảng §8.1 (bản mới) đặt submit ở **10 / 10 phút / IP**. Con số 4 là dấu vết của thiết kế cũ (3/10 phút/phone) đã bị bỏ. Không ảnh hưởng FE, nhưng ai chạy checklist theo mục 9 sẽ báo sai.
- §9 vẫn ghi "repo không có alias `@/`" — sai, xem ghi chú vòng 1.

### Vòng 3 — UI QR phía merchant (2026-09-01)

Doc chốt "QR in ra dán cố định" (§3 quyết định 2) nhưng cả doc lẫn hai vòng trước **không có chỗ nào để Owner lấy được cái QR đó** — đúng cùng lỗ hổng mà `BookingLinkShare` từng vá cho trang booking public ("trước đây không có cách nào tìm URL này ngoài nhờ dev tra DB"). Thêm `PublicCheckInQrPanel`:

- Render trong `PosGeneralSettingsView`, ngay dưới `PosBookingSettingsPanel` — cùng chỗ Owner đã quen tìm link công khai.
- QR trỏ `{getWebUrlOrigin()}/checkin/{slug}`, preview ở `QR_IMAGE_SIZES.panel`, **tải/in ở `QR_IMAGE_SIZES.print` (1000px)** — in ở kích thước preview thì scan không ra, có test giữ điều này.
- In poster A4 mở cửa sổ mới; tên tiệm được escape thủ công vì chuỗi HTML đó nằm ngoài JSX (có test XSS). Không tái dùng `buildQrPosterHtml` của `qrCodes/` vì hàm đó hardcode tên/điện thoại tiệm mock.
- **Cảnh báo `PublicCheckInEnabled` mặc định `false`**: chưa màn hình FE nào sở hữu cờ này (`/checkin-settings` có trên Swagger nhưng repo chưa dùng), nên Owner có thể in một QR trả 404. Panel nói thẳng điều đó thay vì giả vờ có toggle. **Nếu team muốn toggle thật, đó là ticket riêng** — cần đọc/ghi `checkin-settings`, không nhét âm thầm vào pass này.
- Layout theo đúng quy ước mobile của CLAUDE.md: `flex-col sm:flex-row` cho khối QR, `grid-cols-1 sm:grid-cols-2` cho hàng nút. Vẫn **chưa chụp được màn hình 375×667** vì panel nằm sau đăng nhập dashboard.

### Vòng 4 — rà lỗi "Please assign a technician to every service before starting service"

Message này là mã `NO_STAFF_ASSIGNED_TO_START_SERVICE`, do `StartOrderServiceCommand` ném ra và front desk hiện thành toast (`PosFrontDeskView.handleStartService`). **Nó không xuất hiện trên trang public** — trang public không gọi start-service.

**Đơn public có dòng chưa gán thợ là đúng thiết kế**, không phải lỗi: doc §8.1 lớp 3 dùng chính chỗ chặn này làm rào chống đơn rác ("đơn rác dừng ở hàng chờ, không vào Turn Board"). Khách chọn *Thợ nào cũng được*, hoặc dịch vụ không có thợ nào gắn, thì nhân viên quầy phải gán thợ trước khi bấm Start Service. Đó là quy trình, không phải bug.

**Nhưng rà kỹ thì tìm ra một bug thật, đã sửa:** khi prefill từ booking, FE tra `item.posStaffProfileId` trong `data.technicians` rồi **gán lại bằng kết quả tra**. Thợ nào không có trong danh sách trả về của trang check-in (nghỉ lịch, bị ẩn, inactive…) thì id bị nuốt mất → booking khách **đã chọn thợ** vẫn convert thành đơn chưa gán thợ, và quầy ăn đúng câu lỗi trên cho một lượt lẽ ra không được phép dính. Sửa: giữ nguyên `item.posStaffProfileId`, chỉ dùng kết quả tra để lấy tên hiển thị. Test hồi quy `keeps the booked technician even when they are not in the page technician list` — đã kiểm chứng test này **fail** nếu revert đúng 1 dòng sửa.

Kèm theo: `<select>` chọn thợ giờ tự thêm một option cho thợ đã gán mà không nằm trong dropdown (key mới `public.checkIn.bookedTechnician`). Trước đó `<select>` không tìm được option khớp nên rơi về ô rỗng, hiển thị "Thợ nào cũng được" trong khi state vẫn giữ thợ — khách dễ "sửa" nhầm thành chưa gán.

**Chỗ này đã hết ý nghĩa sau vòng 5** (trang public không còn tự dựng dòng dịch vụ nữa), nhưng giữ lại để không ai tưởng là bỏ sót: prefill đang **bỏ hẳn** dòng booking nào có `posServiceId` không nằm trong catalog trang check-in trả về, không báo gì. Bỏ đi thì an toàn hơn gửi lên (doc §10 nói `CheckInLineValidator` giờ lọc `ServiceStatus.Active`, gửi service đã tắt sẽ 400 cả lượt check-in), nhưng khách không hề biết dịch vụ mình đặt vừa biến mất. Nên hiện thông báo hay không là quyết định sản phẩm.

### Vòng 5 — đồng bộ với luồng check-in của owner (2026-09-01)

**Tiền đề của doc §9 đã sai từ lúc nào không rõ.** Doc dựng trang public độc lập với lý do "module `src/components/checkin/` không có trong repo — đã grep, 0 kết quả". Nhánh hiện tại (`79e0bd5a`) **có đủ module đó**: `CheckInSurface`, `useCheckInSession`, `TechnicianPickerGrid`, `ServiceCatalogSection`, `SelectedServicesSummary`, hai layout SinglePage/Wizard, và hai source hook (`useKioskCheckInSource`, `usePosCheckInSource`). Kiosk và front desk đã chạy trên đó.

Vì vậy trang public được **dựng lại trên chính `CheckInSurface`**, thêm source thứ ba `createPublicCheckInSource(businessSlug)`. Khách trên điện thoại giờ được hỏi **đúng bộ câu hỏi** như khách ở kiosk và ở quầy — trong đó có lưới chọn thợ (`TechnicianPickerGrid`: avatar, badge bận/rảnh, ô tìm theo tên khi >6 người, "Anyone"), chọn thợ chung một lần rồi ghi đè theo từng dòng, thay cho `<select>` tự chế của vòng trước.

**Xoá vì đã thừa:** `public/checkin/ActiveVisitInterstitial.tsx`, `public/checkin/ThankYouScreen.tsx`, và phần gom nhóm/tính tổng trong `publicCheckInUtils.ts` (chỉ còn lại `formatBookingWallClockTime`). 34 key `public.checkIn.*` bị xoá theo — nội dung đó giờ nằm ở `components.checkin.*`, giữ lại là tạo ra hai bản dịch cho cùng một câu.

**Mở rộng module dùng chung — 5 điểm, tất cả optional, hai bề mặt cũ không đổi hành vi:**

| Điểm | Vì sao |
|---|---|
| `CheckInSubmitResult.receiptToken?` | trang trạng thái là thứ chỉ khách ở xa mới cần |
| `onCheckedIn(orderNumber, result)` | để trang public đọc được token đó |
| `CheckInSurface.doneSlot?` | chỗ đặt nút "Xem vị trí trong hàng chờ" |
| `onCancelled(activeVisitReceiptToken?)` | *That's me* trên màn chặn dẫn thẳng sang trang trạng thái |
| `CheckInSourceResult.checkInBlockedMessage?` + `CheckInOrderSubmit.allowDuplicatePhone?` | hai luật **chỉ** bề mặt public có: cửa sổ convert booking (§8.3) và cờ nhóm khách chung số (§8.2) |

`checkInBlockedMessage` và `allowDuplicatePhone` là chỗ duy nhất phải chạm vào `useCheckInSession`. Kiosk/front desk không set nên đi đúng nhánh cũ.

**Một sửa lỗi ngoài lề, do merge nhánh gây ra:** nhánh mới có sẵn `PosCheckInLayout` dạng union `'SinglePage' | 'Wizard'` trong `types/repositories.ts`; khi merge, file `constants/posCheckInLayout.ts` (TS `enum`) của vòng 1 thắng và làm **7 call site fail typecheck** (`PosCheckInSettingsPanel`, `PosCheckInTab`, `SelfCheckInPage`) vì string literal không gán được vào enum. Đổi thành const object + union type — vẫn dùng được `PosCheckInLayout.SinglePage` như giá trị, mà literal vẫn gán được. Baseline typecheck của nhánh này là **73 lỗi**, code trong pass này đóng góp 0.

**Test:** `PublicCheckInPage.test.tsx` viết lại (8 test) — chỉ kiểm phần riêng của bề mặt public (404, lưới chọn thợ có xuất hiện, thợ đã chọn được gửi lên, link hàng chờ, *That's me* điều hướng, `allowDuplicatePhone`, convert booking giữ thợ đã đặt, chặn ngoài cửa sổ). Không kiểm lại `CheckInSurface` — đó là trang dùng chung.

**Vẫn còn hở, cần team quyết:**

- **`smsConsent` của module dùng chung mặc định tick sẵn và bắt buộc mới submit được.** Trên trang public đây là khách tự bấm trên điện thoại của họ, tick sẵn kiểu này đúng cái mà `docs/business/sms-consent/sms-consent-technical.md` cảnh báo là không hợp lệ theo TCPA và không khớp thứ Twilio A2P muốn thấy. Comment trong `CustomerIdentityCard` ghi rõ đây là quyết định sản phẩm đã cân nhắc — nhưng nó được cân nhắc cho kiosk/quầy, chưa ai cân nhắc cho bề mặt public. Doc §1 lại ghi SMS ngoài phạm vi đợt này.
- **`PosCheckInSettingsPanel` chưa có ô bật/tắt `PublicCheckInEnabled` và chọn `PublicCheckInLayout`**, dù DTO đã có 2 field. `PublicCheckInQrPanel` hiện chỉ *cảnh báo* khi cờ đang tắt. Cần một ticket nhỏ để Owner tự bật được.
