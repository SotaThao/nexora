NEXORA TOUCH by VLINKPAY

Merchant Onboarding + QR/NFC Tip & Review Platform

Tài liệu triển khai cho BA, UI/UX, Dev, QC và Product Owner



| Product Name | NEXORA TOUCH by VLINKPAY |
| --- | --- |
| Positioning | QR-first Smart Tip & Review Platform. NFC is premium optional add-on. |
| Target Users | Nail salons, restaurants, cafes, spas, bars, hotels, service teams, event staff. |
| MVP Goal | Merchant can onboard, add staff, generate QR touch points, receive tips, collect reviews, and view dashboard. |



# 1. Tổng quan sản phẩm

NEXORA TOUCH là module merchant action layer trong hệ sinh thái NEXORA by VLINKPAY. Sản phẩm giúp merchant tạo QR code hoặc NFC touch point để khách tip cho nhân viên, gửi đánh giá, và chuyển khách hài lòng sang Google/Yelp review.

QR Code là phương án chính để triển khai đại trà vì rẻ, dễ in, dễ scan và dễ scale.

NFC là option cao cấp cho bảng để bàn, front desk, staff badge hoặc merchant VIP.

Cùng một URL động được dùng cho cả QR và NFC để tracking theo touch point.

MVP tập trung vào onboarding merchant, staff profile, QR generator, customer tip flow, review routing và dashboard.


# 2. Product architecture



| Layer | Mô tả | Ghi chú triển khai |
| --- | --- | --- |
| NEXORA ID | Digital identity profile cho cá nhân, staff và business. | Dùng chung user/account system. |
| NEXORA TOUCH | Tip + review + merchant dashboard. | Module riêng cho merchant service businesses. |
| QR Touch Point | QR code in trên table stand, receipt, front desk hoặc staff card. | Default option trong mọi plan. |
| NFC Touch Point | NFC chip/sticker/stand mở cùng URL với QR. | Premium add-on sau MVP. |
| Dashboard | Owner xem tips, reviews, staff performance và touch point analytics. | Cần basic dashboard ngay trong MVP. |



# 3. MVP scope - Phiên bản launch đầu tiên



| Module | MVP Requirement | Priority |
| --- | --- | --- |
| Merchant Onboarding | Wizard 5 bước: business info, review links, add staff, create touch points, download QR. | P0 |
| Staff Management | Add/edit staff, photo, role, payment app handles, active/inactive. | P0 |
| QR Generator | Generate dynamic QR by business, staff, table, front desk, receipt. | P0 |
| Customer Tip Flow | Scan QR, choose staff, choose tip, choose payment method, confirmation. | P0 |
| Review Routing | 4-5 stars route to Google/Yelp. 1-3 stars route to private feedback. | P0 |
| Owner Dashboard | Total tips, total scans, reviews, top staff, touch point performance. | P1 |
| NFC Ordering | Optional premium module, can be Phase 2. | P2 |



# 4. Merchant Setup Wizard

Đây là flow quan trọng nhất để merchant có thể tự setup và bắt đầu dùng NEXORA TOUCH mà không cần đội support làm thủ công.



| Step | Màn hình | Input chính | Output |
| --- | --- | --- | --- |
| 1 | Create Business | Business name, industry, address, phone, website, logo. | Business profile created. |
| 2 | Review Links | Google review link, Yelp link, private feedback email. | Review routing configured. |
| 3 | Add Staff | Name, photo, role, Cash App, Venmo, Zelle, phone/email. | Staff profiles created. |
| 4 | Create Touch Points | Table QR, Front Desk QR, Receipt QR, Staff QR. | Dynamic URLs + QR images generated. |
| 5 | Download / Order | Download PNG/PDF, order NFC add-on if needed. | Merchant can print or order hardware. |



# 5. Customer Flow

Customer scans QR code or taps NFC stand.

System opens touch page for a specific business, table, staff or front desk.

Customer selects staff or confirms pre-selected staff.

Customer selects tip amount or enters custom amount.

Customer chooses payment method: Cash App, Venmo, Zelle, Apple Pay or card depending on MVP availability.

Payment app opens or payment redirect is triggered.

Customer returns to confirmation page.

Customer leaves rating and review.

If rating is 4-5 stars: show Google/Yelp buttons.

If rating is 1-3 stars: show private feedback form and notify owner.


# 6. Payment Strategy

Giai đoạn MVP nên dùng Redirect Payment để launch nhanh và giảm phức tạp compliance. Integrated Payment nên để Phase 2 hoặc Phase 3 sau khi product-market fit rõ.



| Option | Mô tả | Ưu điểm | Khuyến nghị |
| --- | --- | --- | --- |
| Redirect Payment | Click Cash App, Venmo, Zelle mở app hoặc link thanh toán bên ngoài. | Nhanh, đơn giản, ít rủi ro, dễ test thị trường. | MVP nên dùng trước. |
| Integrated Payment | Thanh toán trực tiếp trong hệ thống hoặc qua processor. | Tracking tốt hơn, UX liền mạch hơn. | Làm sau khi có merchant dùng thật. |
| Apple Pay/Card | Có thể dùng Stripe/Square processor nếu cần. | Professional và quen thuộc với khách Mỹ. | Phase 2 nếu muốn thu phí platform. |



# 7. QR/NFC Touch Point logic

QR và NFC đều mở cùng một dynamic URL. Backend tracking bằng touch_point_id.



| Touch Point Type | URL Example | Use Case |
| --- | --- | --- |
| Business Main | nexora.vlinkpay.com/touch/bitcoin-nail-bar | General business tip/review page. |
| Table QR | nexora.vlinkpay.com/touch/bitcoin-nail-bar/table-01 | Restaurant/nail table stand. |
| Front Desk | nexora.vlinkpay.com/touch/bitcoin-nail-bar/front-desk | Counter/front desk. |
| Staff QR | nexora.vlinkpay.com/touch/staff/anna | Staff-specific tip page. |
| Receipt QR | nexora.vlinkpay.com/touch/receipt/tx-12345 | Printed or emailed receipt. |
| NFC Stand | Same URL as table/front desk QR | Premium tap experience. |



# 8. Owner Dashboard requirements



| Dashboard Widget | Data displayed | Priority |
| --- | --- | --- |
| Total Tips | Total amount, by day/week/month, growth percentage. | P0 |
| Total Scans | QR/NFC scans by touch point. | P0 |
| Top Staff | Staff ranking by tips and reviews. | P1 |
| Review Conversion | Ratings, Google/Yelp clicks, private feedback count. | P1 |
| Touch Point Performance | Table/front desk/receipt/staff QR scan count. | P1 |
| Export Report | CSV/PDF export for owner. | P2 |
| Multi-location | Compare branches and locations. | P2 |



# 9. Staff profile requirements

Staff can have a public profile with photo, role, short bio and service category.

Staff can connect payment handles: Cash App, Venmo, Zelle, and optional Apple Pay/card routing.

Staff has personal QR link for tip and review.

Owner can enable or disable staff visibility.

Staff can see tip history and rating summary if merchant allows staff login.

Staff profile can later connect with NEXORA ID for portfolio and contact sharing.


# 10. Database proposal



| Table | Key Fields | Purpose |
| --- | --- | --- |
| users | id, name, email, phone, role, status | Account login for owner, staff, admin. |
| businesses | id, owner_id, name, industry, address, logo_url, status | Merchant/business profile. |
| locations | id, business_id, name, address, timezone | Multi-location support. |
| staff_profiles | id, business_id, user_id, name, role, photo_url, status | Staff records. |
| payment_methods | id, staff_id, type, handle, status | Cash App, Venmo, Zelle, etc. |
| touch_points | id, business_id, location_id, staff_id, type, slug, url | QR/NFC tracking entity. |
| qr_assets | id, touch_point_id, png_url, pdf_url, created_at | Generated QR files. |
| tips | id, business_id, staff_id, touch_point_id, amount, method, status | Tip tracking. |
| reviews | id, business_id, staff_id, rating, comment, route_type | Review and private feedback. |
| analytics_events | id, touch_point_id, event_type, device, timestamp | Scans, clicks, conversions. |
| subscriptions | id, business_id, plan, status, billing_period | Plans and billing. |
| hardware_orders | id, business_id, item_type, qty, status | NFC/stand orders. |



# 11. API endpoints - đề xuất cho Dev



| API | Method | Purpose |
| --- | --- | --- |
| /api/businesses | POST | Create business profile. |
| /api/businesses/{id} | GET/PATCH | Read/update business info. |
| /api/businesses/{id}/staff | GET/POST | List or create staff. |
| /api/staff/{id} | PATCH/DELETE | Update or disable staff. |
| /api/touch-points | POST | Create table/front desk/staff/receipt QR. |
| /api/touch/{slug} | GET | Resolve public touch page. |
| /api/tips | POST | Create tip intent or log redirect payment. |
| /api/reviews | POST | Submit review or private feedback. |
| /api/dashboard/{business_id} | GET | Return dashboard analytics. |
| /api/qr/{touch_point_id} | POST | Generate PNG/PDF QR asset. |



# 12. UI screens cần thiết kế



| Screen | User | Description |
| --- | --- | --- |
| Landing Page | Public | Explain QR-first + NFC optional value proposition. |
| Merchant Signup | Owner | Create account and business. |
| Setup Wizard | Owner | 5-step onboarding flow. |
| Add Staff | Owner | Create staff profile and payment handles. |
| Generate QR | Owner | Create and download QR touch point. |
| Customer Touch Page | Customer | Tip and review mobile page. |
| Payment Redirect Page | Customer | Choose Cash App/Venmo/Zelle/Apple Pay. |
| Review Page | Customer | Star rating and Google/Yelp/private feedback routing. |
| Owner Dashboard | Owner | Tips, scans, reviews, staff performance. |
| Staff Profile | Staff/Customer | Staff tip page and public profile. |
| Hardware Order Page | Owner | Order NFC sticker/stand/card. |
| Admin Panel | VLINKPAY Admin | Manage merchants, plans and hardware orders. |



# 13. Business rules

Each touch point must have a unique slug and trackable ID.

QR can be regenerated without changing the public URL if possible.

NFC chip should store the same URL as the QR code.

Owner can enable or disable any touch point.

Owner can require customer to select staff or pre-lock a touch point to one staff.

If rating is 4 or 5 stars, system shows Google/Yelp review buttons.

If rating is 1 to 3 stars, system shows private feedback form and does not push customer to public review.

Payment method availability depends on staff configuration and merchant plan.

NFC should be treated as premium hardware option, not required for MVP.


# 14. Pricing packages - đề xuất



| Plan | Includes | Target |
| --- | --- | --- |
| Starter - QR Only | Business profile, staff, QR touch points, basic dashboard. | Small salons, cafes, solo service providers. |
| Pro - QR + Analytics | Everything in Starter plus review analytics, staff performance, export. | Active salons/restaurants. |
| Premium - QR + NFC | Pro plus NFC sticker/stand, custom design, advanced tracking. | Premium merchants and front desk usage. |
| Enterprise | Multi-location, custom branding, admin controls, white-label. | Chains, events, franchises. |



# 15. Roadmap triển khai



| Phase | Scope | Deliverable |
| --- | --- | --- |
| Phase 1 | Merchant onboarding, staff, QR generator, customer tip/review flow. | MVP launch for Bitcoin Nail Bar and selected merchants. |
| Phase 2 | Dashboard analytics, review routing, PDF/PNG QR stand generator. | Merchant-ready dashboard and printable assets. |
| Phase 3 | NFC sticker/stand order workflow and hardware tracking. | Premium NFC add-on. |
| Phase 4 | Staff login, CRM, follow-up, AI review summary. | Retention and intelligence layer. |
| Phase 5 | Multi-location, franchise/enterprise admin, white-label. | Scale to restaurant/salon chains. |



# 16. Acceptance Criteria cho QC

Merchant can complete setup wizard without support.

Merchant can add at least one staff profile with payment methods.

System can generate a QR code for business, table and staff.

Customer can scan QR, select staff, choose tip amount and payment method.

System records scan event, tip event and review event.

4-5 star review shows Google/Yelp buttons.

1-3 star review opens private feedback flow.

Owner dashboard shows total tips, total scans and total reviews.

QR and NFC share the same touch point URL logic.

Mobile customer page is responsive and easy to use on iPhone/Android.


# 17. Product Owner note

Ưu tiên đầu tiên không phải là NFC hardware. Ưu tiên đúng là QR dynamic URL + merchant onboarding + customer tip/review flow. Khi merchant đã dùng được bằng QR, NFC sẽ trở thành premium upsell rất tự nhiên.
