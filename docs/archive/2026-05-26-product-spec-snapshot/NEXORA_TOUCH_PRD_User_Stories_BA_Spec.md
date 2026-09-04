
# NEXORA TOUCH by VLINKPAY

BA Product Requirement Document (PRD) + User Stories

Purpose: This document gives BA, UI/UX, Dev, QC, and Product teams a clear product specification for building NEXORA TOUCH as a QR-first and NFC-optional tip & review platform.


## 1. Product Strategy

QR Code is the default activation method for every merchant.

NFC is a premium add-on for higher-end merchants, front desks, table stands, and event booths.

QR and NFC must open the same dynamic Touch Point URL.

The system must track scan/tap source by touch_point_id.

The first vertical market should be nail salons, then restaurants, cafes, spas, bars, car wash, hotel services, and event teams.


## 2. Main User Roles

VLINKPAY Admin: manages merchants, plans, subscriptions, QR/NFC templates, and support.

Merchant Owner: creates business profile, staff, touch points, QR codes, reviews, and reports.

Staff/Service Provider: manages profile, payment methods, tips, QR profile, and reviews.

Customer: scans QR or taps NFC, chooses staff, leaves tip, and submits review.


## 3. MVP Scope

Merchant Setup Wizard

Staff Management

Dynamic QR Code Generator

Touch Point Management

Customer Tip & Review Flow

Review Routing: 4–5 stars to Google/Yelp, 1–3 stars to private feedback

Basic Owner Dashboard

Basic Staff Profile

Downloadable QR assets for table stand, front desk, and receipt


## 4. Merchant Onboarding Wizard

The onboarding wizard is the first priority because it allows merchants to self-setup and launch quickly.


### Step 1 — Business Information

Business name

Business type

Logo upload

Address

Phone

Website

Timezone

Business owner contact


### Step 2 — Review Links

Google review link

Yelp review link

Facebook review link (optional)

Private feedback email/notification recipient


### Step 3 — Staff Setup

Add staff name

Upload staff photo

Set staff role/position

Add Cash App, Venmo, Zelle

Enable/disable staff from public customer flow


### Step 4 — Touch Point Setup

Create table QR

Create front desk QR

Create receipt QR

Create staff QR

Optional: assign NFC device ID later


### Step 5 — Plan Selection

Starter: QR only

Pro: QR + dashboard analytics

Premium: QR + NFC + custom branding


### Step 6 — Download / Order

Download QR PNG

Download print-ready PDF

Order NFC sticker or stand

Preview customer page


## 5. Customer Flow Requirements

Customer scans QR code or taps NFC.

System opens public Touch Page.

Customer selects staff member.

Customer selects tip amount or enters custom amount.

Customer selects payment method: Cash App, Venmo, Zelle, Apple Pay, card, or other enabled method.

Customer completes payment through redirect or processor.

System shows confirmation screen.

Customer leaves star rating and optional comment.

If rating is 4–5 stars, show Google/Yelp review buttons.

If rating is 1–3 stars, show private feedback form and notify merchant.


## 6. Payment Strategy for MVP

For MVP, the recommended approach is Redirect Payment, not fully integrated payment.

Cash App: redirect to staff Cash App link where available.

Venmo: redirect to staff Venmo link where available.

Zelle: show staff Zelle phone/email with copy button and instruction.

Apple Pay / Card: can be added later through payment processor integration.

Tip tracking in MVP can record intended tip amount and customer confirmation status.

Fully integrated payment requires more compliance, payout, refund, chargeback, and KYC considerations.


## 7. Touch Point URL Structure

Main route: nexora.vlinkpay.com/touch/{business-slug}/{touch-point-slug}

Example: nexora.vlinkpay.com/touch/bitcoin-nail-bar/table-01

Staff route: nexora.vlinkpay.com/staff/{staff-slug}

Business route: nexora.vlinkpay.com/b/{business-slug}

Every QR and NFC must map to a unique touch_point_id.


## 8. Data Model


### users

id

name

email

phone

role

status

created_at


### businesses

id

owner_user_id

name

slug

type

logo_url

address

google_review_url

yelp_review_url


### staff_profiles

id

business_id

name

slug

photo_url

position

cash_app

venmo

zelle

status


### touch_points

id

business_id

staff_id_optional

type

name

slug

url

qr_image_url

nfc_uid_optional

status


### tips

id

business_id

staff_id

touch_point_id

amount

payment_method

status

created_at


### reviews

id

business_id

staff_id

rating

comment

routing_type

platform

created_at


### analytics_events

id

business_id

touch_point_id

event_type

metadata

created_at


### subscriptions

id

business_id

plan

status

renewal_date

created_at


## 9. Owner Dashboard Requirements

Total tips by date range

Total transactions

Average tip amount

Total reviews

Review rating average

Top performing staff

Top performing touch points

QR scan count

NFC tap count

Google/Yelp conversion

Export CSV/PDF report


## 10. Staff Dashboard Requirements

View personal profile

Edit profile photo and bio

Manage payment methods

View tips received

View reviews received

View personal QR code

Share profile link


## 11. Admin Dashboard Requirements

Manage all merchants

Approve/suspend merchants

Manage subscription plans

Manage QR templates

Manage NFC orders

View global analytics

Support merchant setup

Assign custom branding


## 12. User Stories

As a merchant owner, I want to create my business profile so customers see the correct brand when scanning QR.

As a merchant owner, I want to add staff members so customers can choose who served them.

As a merchant owner, I want to generate QR codes for each table so I can track which table creates tips/reviews.

As a customer, I want to scan a QR code so I can quickly tip and review without downloading an app.

As a customer, I want to select my staff member so my tip goes to the right person.

As a staff member, I want to connect my Cash App, Venmo, and Zelle so customers can tip me directly.

As a merchant owner, I want low ratings to go to private feedback so I can resolve issues internally.

As a merchant owner, I want 4–5 star ratings to route to Google/Yelp so I can grow public reviews.

As VLINKPAY Admin, I want to manage merchant plans so the platform can monetize subscriptions.

As VLINKPAY Admin, I want to track QR/NFC performance so I can understand product adoption.


## 13. Acceptance Criteria

Merchant can complete onboarding without Dev support.

Merchant can create at least one staff profile.

Merchant can generate a working QR code.

Customer scan opens the correct Touch Page.

Customer can choose staff and tip amount.

Customer can select a payment method.

Customer can submit review.

4–5 star review displays Google/Yelp buttons.

1–3 star review displays private feedback form.

Dashboard shows scans, tips, and reviews.

System records touch_point_id for all scan/tip/review events.


## 14. Development Phases

Sprint 1: Business onboarding, staff setup, and basic profile.

Sprint 2: QR generator and customer Touch Page.

Sprint 3: Tip flow, payment redirect, and review routing.

Sprint 4: Dashboard analytics and reporting.

Sprint 5: QR print/PDF generator.

Sprint 6: NFC device management and premium hardware ordering.


## 15. QC Test Checklist

Test business signup and onboarding.

Test logo upload.

Test staff creation/edit/delete.

Test QR generation and scan.

Test table QR vs front desk QR tracking.

Test payment method selection.

Test Cash App/Venmo/Zelle redirect or display.

Test 5-star public review routing.

Test 1-star private feedback routing.

Test dashboard metrics update.

Test mobile responsive UI.

Test broken/expired touch point URLs.


## 16. Recommended Next Deliverables

Figma UI for Merchant Setup Wizard

HTML mockup for QR Table Stand Generator

API specification for Dev

Database ERD

QC test case spreadsheet

Merchant sales one-pager
