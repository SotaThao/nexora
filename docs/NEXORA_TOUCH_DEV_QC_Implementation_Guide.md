NEXORA TOUCH by VLINKPAY

Tài liệu triển khai cho Dev, BA, UI/UX và QC

QR First + NFC Optional | Smart Tip & Review Platform



| Mục tiêu | Xây MVP cho merchant dùng QR để nhận tip và review; NFC là gói nâng cấp. |
| --- | --- |
| Ngành áp dụng | Nail salon, restaurant, coffee shop, spa, bar, hotel service, car wash, event staff. |
| MVP ưu tiên | Merchant onboarding, staff setup, QR generator, customer tip flow, review routing, dashboard cơ bản. |
| Payment MVP | Redirect sang Cash App, Venmo, Zelle, Apple Pay/Payment Link. Chưa xử lý tiền trực tiếp trong hệ thống. |
| Tên route đề xuất | nexora.vlinkpay.com/touch/... hoặc touch.vlinkpay.com/... |



## 1. Product Strategy

NEXORA TOUCH không nên chỉ đóng khung cho nail salon. Đây là nền tảng Tip + Review + Staff Profile + Merchant Analytics, dùng QR làm cốt lõi và NFC làm premium add-on.

QR là mặc định: rẻ, dễ in, dễ scale, khách hàng quen dùng.

NFC là nâng cấp: dành cho front desk, bàn VIP, salon/restaurant cao cấp, event booth.

QR và NFC mở cùng một dynamic URL để backend tracking theo touch_point_id.

MVP không cần app mobile. Web responsive là đủ để launch nhanh.


## 2. MVP Scope - Những phần phải có



| Module | Mô tả | Priority |
| --- | --- | --- |
| Merchant Onboarding | Merchant tự tạo business, thêm staff, thêm payment, tạo QR. | Must Have |
| Customer Tip Flow | Khách scan QR/tap NFC, chọn staff, chọn tip, chọn payment, review. | Must Have |
| Staff Profile | Tên, ảnh, chức vụ, Cash App, Venmo, Zelle, QR riêng. | Must Have |
| QR Generator | Tạo QR theo table/front desk/receipt/staff. Cho download PNG/PDF. | Must Have |
| Review Routing | 4-5 sao dẫn Google/Yelp. 1-3 sao vào private feedback. | Must Have |
| Dashboard Basic | Total tips, scans, reviews, staff performance, touch point report. | Must Have |
| NFC Management | Ghi nhận NFC ID và link chung với QR. | Phase 2 |
| AI Features | AI reply review, AI feedback summary, AI performance insight. | Phase 3 |



## 3. Merchant Onboarding Wizard

Đây là flow quan trọng nhất để merchant bắt đầu dùng hệ thống. UI nên làm dạng wizard 5 bước, có progress bar rõ ràng.


### Step 1 - Business Info

Business name, logo, industry, address, phone, website, timezone.


### Step 2 - Review Links

Google review link, Yelp link, private feedback email/phone.


### Step 3 - Staff Setup

Add staff name, photo, position, payment handle, active/inactive.


### Step 4 - Touch Points

Create Table QR, Front Desk QR, Receipt QR, Staff QR, optional NFC.


### Step 5 - Download/Order

Download QR PNG/PDF, order QR stand, order NFC stand if premium.


## 4. Customer Flow

Customer opens camera and scans QR. If merchant has NFC, customer can tap NFC instead.

System opens a touch page with merchant branding and staff list.

Customer selects staff or table/server assigned to the QR.

Customer selects tip amount: preset buttons ($5, $10, $15, $20, $30, Other) or percentage for restaurants.

Customer selects payment method: Cash App, Venmo, Zelle, Apple Pay/payment link, card processor in later phase.

After payment redirect, system shows confirmation and asks for review.

4-5 stars: show Google/Yelp buttons. 1-3 stars: private feedback form to business owner.


## 5. Payment Strategy for MVP

MVP nên dùng redirect payment trước để giảm độ phức tạp pháp lý và kỹ thuật. Hệ thống không cần custody tiền trong phase đầu.



| Method | MVP Action | Data cần lưu | Ghi chú |
| --- | --- | --- | --- |
| Cash App | Open $cashtag / payment link | handle, amount, staff_id | Tracking dựa trên confirmation tự khai báo hoặc webhook nếu có. |
| Venmo | Open venmo link | username, amount, staff_id | Dễ dùng cho staff tại Mỹ. |
| Zelle | Show phone/email + copy button | phone/email, amount, staff_id | Zelle thường không có deep link chuẩn như Cash App/Venmo. |
| Apple Pay/Card | Payment link / processor | transaction_id, amount | Có thể tích hợp processor sau MVP. |



## 6. URL Structure

Business page: /touch/{business_slug}

Touch point: /touch/{business_slug}/t/{touch_point_code}

Staff page: /touch/{business_slug}/s/{staff_slug}

Review page: /touch/{business_slug}/review/{session_id}

Receipt page: /touch/receipt/{transaction_id}

Admin dashboard: /touch/admin/dashboard


## 7. Database Structure



| Table | Key Fields |
| --- | --- |
| users | id, name, email, role, status, created_at |
| businesses | id, owner_id, name, slug, logo_url, industry, address, google_review_url, yelp_url |
| staff_profiles | id, business_id, name, photo_url, position, status, cash_app, venmo, zelle |
| touch_points | id, business_id, type, code, label, url, qr_url, nfc_uid, status |
| tip_sessions | id, business_id, staff_id, touch_point_id, amount, method, status, created_at |
| reviews | id, business_id, staff_id, rating, comment, platform, routing_type, created_at |
| analytics_events | id, business_id, touch_point_id, event_type, user_agent, device_type, created_at |
| subscriptions | id, business_id, plan, status, renewal_date |
| nfc_orders | id, business_id, product_type, quantity, status, shipping_info |



## 8. Dashboard Requirements

Overview cards: total tips, transactions, average tip, total reviews, QR scans, NFC taps.

Chart: tips over time by day/week/month.

Breakdown: tips by staff, scans by touch point, review conversion.

Staff performance: rating, total tips, response rate, number of reviews.

Touch point performance: table/front desk/receipt/staff QR with scan count and tip conversion.

Export CSV/PDF report for owner.


## 9. QC Test Checklist

Merchant can complete onboarding from Step 1 to Step 5 without error.

QR generated must open correct touch point page.

Each touch point must track scan count separately.

Staff list must show only active staff.

Tip amount must calculate correctly and pass to payment redirect.

Cash App/Venmo/Zelle buttons must display correct staff payment info.

Review rating 4-5 stars must show Google/Yelp option.

Review rating 1-3 stars must show private feedback form only.

Dashboard stats must update after simulated tip/review events.

Mobile responsive: iPhone Safari, Android Chrome, desktop Chrome.


## 10. Phased Delivery Plan



| Phase | Duration | Deliverables | Exit Criteria |
| --- | --- | --- | --- |
| Phase 1 | 2-4 weeks | Onboarding, staff, QR generator, customer flow | Bitcoin Nail Bar test flow works end-to-end. |
| Phase 2 | 2-3 weeks | Dashboard, analytics, review routing, reports | Owner can view staff/touch point performance. |
| Phase 3 | 2-4 weeks | NFC UID management, order flow, premium stand tracking | NFC opens same URL and logs tap event. |
| Phase 4 | Later | AI review reply, CRM, multi-location, white-label | Ready for restaurant/salon expansion. |



## 11. Immediate Tasks for Team

BA: finalize field list and validation rules for onboarding wizard.

UI/UX: design Merchant Setup Wizard and QR Table Stand Generator in Figma.

Frontend: build responsive customer touch page and dashboard shell.

Backend: build database tables, QR dynamic URL, analytics event logging.

QC: prepare test cases for QR flow, staff selection, review routing and dashboard stats.

Ops: prepare sample QR stand design for Bitcoin Nail Bar pilot.

Recommended next build: Merchant Setup Wizard + QR Table Stand Generator
