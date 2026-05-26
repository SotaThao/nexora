NEXORA TOUCH by VLINKPAY

Database ERD + Table Specification

QR First + NFC Optional | Smart Tip & Review Platform


## 1. Objective

This document defines the recommended database structure for NEXORA TOUCH, a QR-first and NFC-optional tip and review platform for salons, restaurants, cafes, spas, bars, hotels, event teams, and other service-based merchants.


## 2. Database Design Principles

QR and NFC must open the same dynamic URL and map to one touch_point_id.

Every customer action must be trackable by business_id, staff_id, touch_point_id, and event timestamp.

Payment collection for MVP should support redirect-based external payment apps first, while keeping the data model ready for future integrated payments.

Reviews must support routing logic: 4-5 stars to public Google/Yelp prompts; 1-3 stars to private feedback workflow.

The data model must support multi-location merchants and future franchise or enterprise accounts.


## 3. High-Level ERD Relationship Map

users (1) ---> (many) businesses
businesses (1) ---> (many) locations
businesses (1) ---> (many) staff_profiles
businesses (1) ---> (many) touch_points
locations (1) ---> (many) touch_points
staff_profiles (1) ---> (many) tips
staff_profiles (1) ---> (many) reviews
touch_points (1) ---> (many) analytics_events
touch_points (1) ---> (many) tips
touch_points (1) ---> (many) reviews
businesses (1) ---> (many) subscriptions
businesses (1) ---> (many) nfc_devices
nfc_devices (1) ---> (1) touch_points, optional assignment
businesses (1) ---> (many) qr_assets


### users

Purpose: Stores platform users including VLINKPAY admins, merchant owners, managers, and staff login accounts.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary user identifier |
| name | VARCHAR(150) |  | Yes | Full display name |
| email | VARCHAR(255) |  | Yes | Unique email |
| phone | VARCHAR(30) |  | No | Optional mobile number |
| password_hash | TEXT |  | Yes | Hashed password only |
| role | ENUM |  | Yes | admin, owner, manager, staff |
| status | ENUM |  | Yes | active, suspended, pending |
| created_at | TIMESTAMP |  | Yes | Created timestamp |
| updated_at | TIMESTAMP |  | Yes | Updated timestamp |



### businesses

Purpose: Stores merchant/business accounts such as nail salons, restaurants, cafes, or spas.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary business identifier |
| owner_user_id | UUID | FK | Yes | References users.id |
| name | VARCHAR(200) |  | Yes | Business name |
| slug | VARCHAR(200) |  | Yes | Public URL slug |
| type | ENUM |  | Yes | nail_salon, restaurant, cafe, spa, bar, hotel_service, event_team, other |
| logo_url | TEXT |  | No | Business logo asset |
| website | TEXT |  | No | Business website |
| phone | VARCHAR(30) |  | No | Business phone |
| status | ENUM |  | Yes | active, pending, suspended |
| created_at | TIMESTAMP |  | Yes | Created timestamp |



### locations

Purpose: Supports merchants with one or multiple physical locations.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary location identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| name | VARCHAR(200) |  | Yes | Location name |
| address_line1 | VARCHAR(255) |  | No | Street address |
| city | VARCHAR(100) |  | No | City |
| state | VARCHAR(80) |  | No | State |
| zip_code | VARCHAR(20) |  | No | Postal code |
| timezone | VARCHAR(80) |  | Yes | Example: America/Chicago |
| status | ENUM |  | Yes | active, inactive |



### staff_profiles

Purpose: Stores service providers who can receive tips and reviews.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary staff identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| location_id | UUID | FK | No | References locations.id |
| user_id | UUID | FK | No | Optional staff login account |
| name | VARCHAR(150) |  | Yes | Staff display name |
| slug | VARCHAR(180) |  | Yes | Public staff URL slug |
| photo_url | TEXT |  | No | Staff photo |
| position | VARCHAR(120) |  | No | Nail tech, server, stylist, etc. |
| bio | TEXT |  | No | Short public bio |
| is_public | BOOLEAN |  | Yes | Show/hide from customer flow |
| status | ENUM |  | Yes | active, inactive |



### payment_methods

Purpose: Stores staff or business payment receiving methods. Sensitive values should be encrypted where needed.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary payment method identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| staff_id | UUID | FK | No | References staff_profiles.id if staff-level |
| method_type | ENUM |  | Yes | cash_app, venmo, zelle, apple_pay, card, other |
| display_name | VARCHAR(150) |  | No | Public label |
| handle_or_value | TEXT |  | Yes | Cash App handle, Venmo handle, Zelle phone/email |
| is_default | BOOLEAN |  | Yes | Default method for staff/business |
| status | ENUM |  | Yes | active, inactive |



### review_links

Purpose: Stores public review destination links for Google, Yelp, Facebook, or internal feedback.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary review link identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| location_id | UUID | FK | No | Location-specific review link |
| platform | ENUM |  | Yes | google, yelp, facebook, internal |
| url | TEXT |  | Yes | Destination URL |
| is_active | BOOLEAN |  | Yes | Active flag |



### touch_points

Purpose: Stores QR/NFC access points such as table cards, front desk signs, receipt QR, staff QR, or event badges.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary touch point identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| location_id | UUID | FK | No | References locations.id |
| staff_id | UUID | FK | No | Optional direct staff assignment |
| type | ENUM |  | Yes | table, front_desk, receipt, staff, event, poster, other |
| name | VARCHAR(150) |  | Yes | Table 01, Front Desk, Staff Anna |
| slug | VARCHAR(180) |  | Yes | Public touch point slug |
| dynamic_url | TEXT |  | Yes | Public URL opened by QR/NFC |
| qr_image_url | TEXT |  | No | Generated QR image |
| status | ENUM |  | Yes | active, inactive, archived |



### nfc_devices

Purpose: Stores physical NFC sticker, card, or stand hardware inventory and assignment.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary NFC device identifier |
| business_id | UUID | FK | No | Assigned business |
| touch_point_id | UUID | FK | No | Assigned touch point |
| nfc_uid | VARCHAR(120) |  | No | Chip UID if captured |
| device_type | ENUM |  | Yes | sticker, card, table_stand, metal_stand, badge |
| batch_code | VARCHAR(100) |  | No | Supplier or internal batch |
| encoded_url | TEXT |  | No | URL written to chip |
| status | ENUM |  | Yes | inventory, assigned, active, lost, damaged |



### qr_assets

Purpose: Stores printable QR assets for table stand, receipt, front desk, staff card, or poster.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary asset identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| touch_point_id | UUID | FK | Yes | References touch_points.id |
| asset_type | ENUM |  | Yes | png, pdf, svg |
| template_type | ENUM |  | Yes | table_stand, receipt, front_desk, staff_card, poster |
| file_url | TEXT |  | Yes | Generated file URL |
| created_at | TIMESTAMP |  | Yes | Created timestamp |



### tip_sessions

Purpose: Tracks customer tip flow before and after external payment redirect or confirmation.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary tip session identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| staff_id | UUID | FK | Yes | Selected staff |
| touch_point_id | UUID | FK | Yes | Source QR/NFC touch point |
| amount | DECIMAL(10,2) |  | Yes | Selected tip amount |
| payment_method | ENUM |  | Yes | cash_app, venmo, zelle, apple_pay, card, other |
| status | ENUM |  | Yes | started, redirected, confirmed_by_customer, cancelled |
| customer_note | TEXT |  | No | Optional note |
| created_at | TIMESTAMP |  | Yes | Created timestamp |



### reviews

Purpose: Stores customer reviews and routing outcomes.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary review identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| staff_id | UUID | FK | No | Selected staff |
| touch_point_id | UUID | FK | Yes | Source touch point |
| tip_session_id | UUID | FK | No | Related tip session |
| rating | INT |  | Yes | 1 to 5 stars |
| comment | TEXT |  | No | Review or private feedback text |
| routing_type | ENUM |  | Yes | public_prompt, private_feedback |
| platform_selected | ENUM |  | No | google, yelp, facebook, none |
| created_at | TIMESTAMP |  | Yes | Created timestamp |



### analytics_events

Purpose: Generic event table for scan, tap, staff selection, tip started, payment click, review submitted, and redirect.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary event identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| touch_point_id | UUID | FK | No | References touch_points.id |
| staff_id | UUID | FK | No | References staff_profiles.id |
| event_type | ENUM |  | Yes | qr_scan, nfc_tap, staff_selected, tip_started, payment_clicked, review_submitted, public_review_clicked |
| source | ENUM |  | No | qr, nfc, web, admin |
| metadata | JSONB |  | No | Browser, device, amount, platform, etc. |
| ip_hash | VARCHAR(120) |  | No | Hashed IP for fraud/rate checks |
| created_at | TIMESTAMP |  | Yes | Created timestamp |



### subscriptions

Purpose: Stores merchant plan and subscription status.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary subscription identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| plan | ENUM |  | Yes | starter, pro, premium, enterprise |
| billing_status | ENUM |  | Yes | trial, active, past_due, cancelled |
| price_amount | DECIMAL(10,2) |  | No | Monthly or annual amount |
| billing_cycle | ENUM |  | No | monthly, annual |
| started_at | TIMESTAMP |  | No | Start date |
| renewal_at | TIMESTAMP |  | No | Next renewal date |



### hardware_orders

Purpose: Tracks QR/NFC stand, sticker, card, and hardware orders.



| Field | Type | Key | Required | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | PK | Yes | Primary order identifier |
| business_id | UUID | FK | Yes | References businesses.id |
| order_type | ENUM |  | Yes | qr_print, nfc_sticker, nfc_card, nfc_table_stand |
| quantity | INT |  | Yes | Quantity ordered |
| status | ENUM |  | Yes | draft, paid, processing, shipped, delivered, cancelled |
| shipping_address | TEXT |  | No | Shipping destination |
| tracking_number | VARCHAR(120) |  | No | Carrier tracking |
| created_at | TIMESTAMP |  | Yes | Created timestamp |



## 5. Recommended Indexes

users.email - unique index

businesses.slug - unique index

staff_profiles.business_id + slug - unique composite index

touch_points.business_id + slug - unique composite index

analytics_events.business_id + created_at - reporting index

analytics_events.touch_point_id + created_at - scan/tap analytics index

tip_sessions.staff_id + created_at - staff tip report index

reviews.business_id + rating + created_at - review analytics index

nfc_devices.nfc_uid - unique index when UID is available


## 6. Analytics Event Types

qr_scan - customer scanned QR code

nfc_tap - customer tapped NFC device

touch_page_view - public Touch Page loaded

staff_selected - customer selected a staff member

tip_amount_selected - customer selected tip amount

payment_method_selected - customer selected Cash App, Venmo, Zelle, Apple Pay, or card

payment_redirect_clicked - customer clicked external payment redirect

tip_confirmed_by_customer - customer confirmed the tip after redirect

review_submitted - customer submitted rating/comment

public_review_clicked - customer clicked Google/Yelp public review button

private_feedback_submitted - low rating/private feedback sent to merchant


## 7. Data Flow: QR/NFC to Dashboard

Customer scans QR or taps NFC.

System resolves dynamic_url to touch_point_id.

System creates analytics_events record: qr_scan or nfc_tap.

Customer selects staff; system logs staff_selected.

Customer starts tip flow; system creates tip_sessions record.

Customer selects payment method; system logs payment_method_selected.

Customer submits review; system creates reviews record.

Dashboard aggregates tips, reviews, scans, taps, top staff, and top touch points.


## 8. MVP Notes for Dev

Do not hard-code QR destination. Always use dynamic_url so the destination can change without reprinting QR.

Use touch_point_id as the main tracking key for table, receipt, front desk, staff, and event badges.

Do not store sensitive payment credentials in plain text. For MVP, store public handles only where possible.

Use soft-delete/status fields instead of deleting business, staff, touch point, tip, or review records.

Keep the data model ready for integrated payment processing, even if MVP uses external payment redirects.


## 9. Next Recommended Deliverable

After this Database ERD and Table Spec, the next document should be a QC Test Case Spreadsheet covering merchant onboarding, QR scan, NFC tap, staff selection, tip flow, payment redirect, review routing, and dashboard analytics.
