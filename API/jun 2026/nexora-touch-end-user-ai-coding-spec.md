# NEXORA TOUCH - End-user & AI Coding Spec

> Source: `02. api-integration-guide-v2.pdf` - API Integration Guide v2.0, updated 2026-06-05.  
> Purpose: Convert the API guide into a product-readable and coding-agent-friendly implementation brief.

---

## 1. Product Summary

**NEXORA TOUCH** is a QR-based tipping and review platform for service businesses such as nail salons, restaurants, front desks, tables, receipts, and staff cards.

The core experience:

1. Merchant signs up and completes business onboarding.
2. Merchant invites staff or links existing staff.
3. Staff completes profile and activates at least one payment method.
4. Merchant creates QR touch points.
5. Customer scans QR, selects staff, tips, confirms payment, then leaves a review.
6. Merchant tracks tips, scans, reviews, staff performance, and private feedback in the dashboard.

---

## 2. Core Actors

| Actor | Description | Main Goals |
|---|---|---|
| Merchant / Business Owner | Registered business user with `profileType = Merchant`. | Set up business, invite staff, manage QR touch points, configure business payment methods, view dashboard. |
| Staff | Service provider linked to a business. | Complete profile, configure personal payment methods, receive tips/reviews. |
| Customer / Guest | No account required. Opens public touch page by scanning QR. | Select staff, tip, confirm payment, leave review. |
| AI Coding Agent | Developer assistant reading this spec. | Generate frontend screens, API service layer, DTOs, guards, validation, and error handling. |

---

## 3. System Rules That Must Not Be Missed

### Authentication

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

Public guest endpoints use `AllowAnonymous` and usually have rate limit policy `PublicTouchPolicy`.

### Privacy

- Staff payment `accountInfo` belongs only to staff.
- Merchant endpoints must not read raw staff payment account info.
- Customer touch page only receives method names like `CashApp`, `Venmo`, `Zelle`; it must not receive raw staff account info.
- Business payment methods are separate from staff payment methods and are used for multi-staff tips.

### Visibility Rules

A staff member should appear on the customer touch page only when:

```text
BusinessStaffLink.Status = Active
AND StaffProfile.IsProfileComplete = true
AND at least one staff payment method is active and configured
```

A payment method is visible only when:

```text
isActive = true
AND accountInfo is not empty
```

### Review Routing

| Rating | Routing | Frontend Behavior |
|---|---|---|
| 4-5 stars | Public | Show Google/Yelp review buttons if links exist. |
| 1-3 stars | Private | Collect private feedback and optionally customer email/name. |

### Tip Limits

| Rule | Limit |
|---|---|
| Single staff tip min | `$1.00` |
| Single staff tip max | `$500.00` |
| Multi-staff min staff count | `2 distinct staff` |
| Multi-staff total max | `$500.00` |
| Each multi-staff item min | `$1.00` |

---

## 4. Main User-facing Screens

### 4.1 Merchant Authentication

**Screens**

- Sign In
- Sign Up
- Verify Email
- Forgot Password
- Reset Password

**Core API**

| Action | Method | Endpoint |
|---|---:|---|
| Sign in | POST | `/api/v1/authentication/signin` |
| Sign up | POST | `/api/v1/authentication/signup` |
| Refresh token | POST | `/api/v1/authentication/refresh-token` |
| Forgot password | POST | `/api/v1/authentication/forgot-password` |
| Reset password | POST | `/api/v1/authentication/reset-password` |
| Send verification email | POST | `/api/v1/authentication/send-verification-email` |
| Verify email | POST | `/api/v1/authentication/verify-email` |
| Passwordless sign in | POST | `/api/v1/authentication/passwordless-signin` |

**Frontend requirements**

- Store `accessToken`, `refreshToken`, `tokenType`, `expiresIn` after login.
- On protected API `401`, attempt refresh token once, then retry original request.
- If refresh token fails, clear tokens and redirect to Sign In.
- Show clear error messages for wrong credentials, inactive account, rate limit, expired verification token.

---

### 4.2 Merchant Onboarding Wizard

**Goal**: Let merchant create a public business profile and generate the first touch setup.

**Recommended steps**

| Step | Screen | Description |
|---:|---|---|
| 1 | Business Info | Business name, type, address, phone, timezone, logo, custom slug. |
| 2 | Review Links | Google review URL, Yelp URL, Facebook URL, private feedback email. |
| 3 | Staff | Invite staff by name + email/phone. Optional but recommended. |
| 4 | Touch Points | Create QR for table, front desk, receipt, or staff card. |
| 5 | Complete | Make business public and activate merchant profile. |

**Core API sequence**

```http
POST /api/v1/authentication/signup
POST /api/v1/authentication/verify-email
POST /api/v1/authentication/signin
GET  /api/v1/merchant/business/check-slug?slug=bitcoin-nail-bar
POST /api/v1/images/upload
POST /api/v1/merchant/business
PUT  /api/v1/merchant/business/review-links
POST /api/v1/merchant/staff/invite
POST /api/v1/merchant/touchpoints
POST /api/v1/merchant/business/complete-onboarding
```

**Business rules**

- Business creation automatically creates a Starter subscription with a 30-day trial.
- Business creation pre-seeds all business payout method types as inactive.
- `customSlug` must be lowercase, alphanumeric plus hyphens, max 50 chars.
- If no custom slug is provided, generate slug from business name and append `-2`, `-3`, etc. on collision.
- At least one review link is required if public review routing should work.
- Completing onboarding sets `Business.IsPublic = true` and merchant profile status to `Active`.

---

### 4.3 Merchant Staff Management

**Screens**

- Staff List
- Invite Staff
- Pending Invites
- Search Existing Staff
- Staff Status / Reorder / Unlink

**Core API**

| Action | Method | Endpoint |
|---|---:|---|
| Invite staff | POST | `/api/v1/merchant/staff/invite` |
| Resend invite | POST | `/api/v1/merchant/staff/{inviteId}/resend` |
| List staff + invites | GET | `/api/v1/merchant/staff` |
| Search existing staff | GET | `/api/v1/merchant/staff/search` |
| Update staff status | PUT | `/api/v1/merchant/staff/{staffLinkId}/status` |
| Reorder staff | PUT | `/api/v1/merchant/staff/reorder` |
| Unlink staff | DELETE | `/api/v1/merchant/staff/{staffLinkId}` |
| Link existing staff | POST | `/api/v1/merchant/staff/link-request/{staffProfileId}` |

**UI behavior**

- Staff list must show both accepted staff and pending invites.
- Use `itemType = link` for accepted staff and `itemType = invite` for pending invites.
- `Inactive` staff are hidden from customer touch page but their data remains.
- Reorder should support drag-and-drop and send `orderedLinkIds`.
- Pending invite can be resent if still pending.

---

### 4.4 Staff Self-Setup

**Goal**: Staff opens magic link, accepts invite, creates profile, and enables payment method.

**Screens**

- Invite Landing Page
- Staff Profile Setup
- Upload Photo
- Payment Method Settings
- Profile Completion State

**Flow**

```http
GET  /api/v1/staff/invite/{token}
POST /api/v1/images/public/upload
POST /api/v1/staff/invite/{token}/accept
POST /api/v1/authentication/signin
GET  /api/v1/staff/payment-methods
PUT  /api/v1/staff/payment-methods/{id}
PATCH /api/v1/staff/payment-methods/{id}/toggle
```

**Important rules**

- Invite token expires after 7 days.
- Accepting invite creates `UserProfile`, `StaffProfile`, and 5 inactive staff payment methods.
- Staff becomes visible on customer touch page only after at least one payment method is active and configured.
- The token is read from URL path; do not include token in body.

---

### 4.5 Touch Points & QR

**Goal**: Merchant creates customer-facing QR codes.

**Touch point types**

| Type | Purpose |
|---|---|
| `Table` | Shows all active staff. |
| `FrontDesk` | Shows all active staff. |
| `Receipt` | Shows all active staff. |
| `StaffCard` | Shows only assigned staff. |

**Core API**

| Action | Method | Endpoint |
|---|---:|---|
| Create touch point | POST | `/api/v1/merchant/touchpoints` |
| List touch points | GET | `/api/v1/merchant/touchpoints` |
| Download QR | GET | `/api/v1/merchant/touchpoints/{id}/download?format=png|pdf` |
| Delete touch point | DELETE | `/api/v1/merchant/touchpoints/{id}` |

**Business rules**

- Creating touch point automatically generates a 1000x1000 PNG QR and uploads it to S3.
- Starter plan limit: maximum 3 touch points.
- Touch point URL format:

```text
{baseUrl}/touch/{businessSlug}/{touchPointSlug}
```

Example:

```text
https://nexora.vlinkpay.com/touch/bitcoin-nail-bar/table-1
```

---

### 4.6 Customer Touch Page - Single Staff Tip

**Goal**: Customer scans QR, selects staff, pays tip through staff payment method, confirms payment, and reviews.

**Public flow**

```http
GET  /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
GET  /api/v1/touch/payment-link?staffId={id}&method={enum}&amount={amount}
POST /api/v1/touch/tip
POST /api/v1/touch/tip/{tipId}/confirm
POST /api/v1/touch/review
POST /api/v1/touch/review/{reviewId}/track-google
POST /api/v1/touch/review/{reviewId}/track-yelp
```

**Screen states**

1. Loading touch page
2. Business header + staff list
3. Staff detail + amount selector
4. Payment method selection
5. Payment redirect / copy instruction
6. Confirmation: "Yes, I paid"
7. Review screen
8. Public review buttons or private feedback form
9. Thank-you screen

**Payment method behavior**

| Method | Behavior |
|---|---|
| CashApp | Open deep link. |
| Venmo | Open deep link. |
| PayPal | Open PayPal.me link. |
| Zelle | No redirect. Show copy-paste phone/email UI. |
| Apple Cash | No redirect. Show phone copy UI. |

---

### 4.7 Customer Touch Page - Multi-Staff Tip

**Goal**: Customer tips 2+ staff in one transaction through the business payment method.

**Public flow**

```http
GET  /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
GET  /api/v1/public/businesses/{businessId}/payment-methods
POST /api/v1/tips/multi-staff
PATCH /api/v1/tips/{tipId}/confirm
POST /api/v1/touch/review
```

**Business rules**

- Customer must select at least 2 distinct staff members.
- Each item amount must be at least `$1.00`.
- Total amount must not exceed `$500.00`.
- Business payment method must be active and configured.
- Backend uses transaction rollback if any validation fails.

**Example request**

```json
{
  "businessId": "guid",
  "touchPointId": "guid",
  "businessPaymentMethodId": "guid",
  "tipItems": [
    { "staffProfileId": "guid-linh", "amount": 15.00 },
    { "staffProfileId": "guid-maria", "amount": 10.00 }
  ]
}
```

---

### 4.8 Customer Skip Tip - Review Only

**Goal**: Customer skips tip but still leaves a review.

**Flow**

```http
GET  /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
POST /api/v1/touch/tip/skip
POST /api/v1/touch/review
```

**Behavior**

- Creates a skipped tip record for analytics.
- Review still routes based on rating.

---

### 4.9 Payment Method Management

#### Staff payment methods

Used when customers tip a specific staff member directly.

```http
GET   /api/v1/staff/payment-methods
PUT   /api/v1/staff/payment-methods/{id}
PATCH /api/v1/staff/payment-methods/{id}/toggle
```

**Supported values**

- Zelle
- BankWire
- PayPal
- Venmo
- CashApp
- AppleCash
- VlinkPay

#### Business payment methods

Used for multi-staff tip where customer pays the business, then business distributes to staff.

```http
GET   /api/v1/merchant/payment-methods
PUT   /api/v1/merchant/payment-methods/{id}
PATCH /api/v1/merchant/payment-methods/{id}/toggle
```

**Special rule**

- `VlinkPay` method requires KYC/KYB approval before it can be toggled active.

---

### 4.10 Merchant Dashboard

**Screens / tabs**

- Overview
- Staff Performance
- Touch Point Performance
- Reviews / Private Feedback Inbox

**Core API**

| Action | Method | Endpoint |
|---|---:|---|
| Overview metrics | GET | `/api/v1/merchant/dashboard/overview` |
| Reviews list | GET | `/api/v1/merchant/dashboard/reviews` |
| Resolve review | PUT | `/api/v1/merchant/dashboard/reviews/{id}/resolve` |
| Staff metrics | GET | `/api/v1/merchant/dashboard/staff` |
| Touch point metrics | GET | `/api/v1/merchant/dashboard/touchpoints` |

**Dashboard metrics**

- Total tip amount
- Tip count
- Average tip amount
- Total scans
- Conversion rate
- Total reviews
- Average rating
- Public review count
- Private review count
- Google click count
- Yelp click count

---

### 4.11 Image Upload

| Use Case | Method | Endpoint | Auth |
|---|---:|---|---|
| Authenticated upload | POST | `/api/v1/images/upload` | Bearer token |
| Public staff invite upload | POST | `/api/v1/images/public/upload` | Anonymous |

**Constraints**

- `multipart/form-data`
- Field name: `file`
- Accepted: PNG, JPEG, WebP
- Max size: 10 MB

---

### 4.12 Notifications

**Core API**

| Action | Method | Endpoint |
|---|---:|---|
| List notifications | GET | `/api/v1/notifications` |
| Unread count | GET | `/api/v1/notifications/unread-count` |
| Mark one read | PUT | `/api/v1/notifications/{id}/read` |
| Mark all read | PUT | `/api/v1/notifications/read-all` |

---

## 5. DTO Cheat Sheet

### Auth response

```ts
export interface AuthTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
}
```

### Business

```ts
export interface BusinessDto {
  id: string;
  name: string;
  slug: string;
  businessType?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  logoUrl?: string | null;
  description?: string | null;
  isPublic: boolean;
  onboardingStep: number;
  googleReviewUrl?: string | null;
  yelpUrl?: string | null;
  facebookUrl?: string | null;
  feedbackEmail?: string | null;
  subscription?: {
    plan: string;
    status: string;
    trialEndsAt?: string | null;
  };
}
```

### Staff list item

```ts
export interface MerchantStaffItemDto {
  id: string;
  itemType: 'link' | 'invite';
  staffProfileId?: string | null;
  displayName: string;
  photoUrl?: string | null;
  position?: string | null;
  status: 'Pending' | 'Active' | 'Inactive' | 'Rejected' | 'Accepted' | 'Expired' | 'Cancelled';
  sortOrder: number;
  isProfileComplete: boolean;
  tipCount: number;
  averageRating: number;
}
```

### Touch page

```ts
export interface TouchPageDto {
  business: {
    name: string;
    logoUrl?: string | null;
    description?: string | null;
  };
  touchPoint: {
    id: string;
    name: string;
    type: 'Table' | 'FrontDesk' | 'Receipt' | 'StaffCard';
    assignedStaffProfileId?: string | null;
  };
  staff: TouchStaffDto[];
}

export interface TouchStaffDto {
  id: string;
  displayName: string;
  photoUrl?: string | null;
  position?: string | null;
  bio?: string | null;
  availablePaymentMethods: string[];
}
```

### Payment method

```ts
export interface PaymentMethodDto {
  id: string;
  type: 'Zelle' | 'BankWire' | 'PayPal' | 'Venmo' | 'CashApp' | 'AppleCash' | 'VlinkPay';
  accountInfo?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  isConfigured: boolean;
  businessKybStatus?: string | null;
}
```

### Standard error

```ts
export interface ApiErrorResponse {
  type?: string;
  title?: string;
  status: number;
  errorCode: string;
  errors?: Record<string, string[]>;
  retryAfter?: number;
}
```

---

## 6. Enums

### PaymentMethod

| Value | Name | Description |
|---:|---|---|
| 0 | CashApp | Cash App cashtag |
| 1 | Venmo | Venmo handle |
| 2 | Zelle | Phone or email, no redirect |
| 3 | PayPal | PayPal.me link |
| 4 | Other | Skipped tip, internal only |
| 5 | AppleCash | Phone, no redirect |

### PayoutMethodType

| Value | Name |
|---:|---|
| 1 | Zelle |
| 2 | BankWire |
| 3 | PayPal |
| 4 | Venmo |
| 5 | CashApp |
| 6 | AppleCash |
| 7 | VlinkPay |

### TouchPointType

| Value | Name | Description |
|---:|---|---|
| 0 | Table | Shows all active staff |
| 1 | FrontDesk | Shows all active staff |
| 2 | Receipt | Shows all active staff |
| 3 | StaffCard | Shows assigned staff only |

### TipStatus

| Value | Name | Description |
|---:|---|---|
| 0 | Initiated | Customer clicked Pay; payment not confirmed |
| 1 | Confirmed | Customer confirmed payment |
| 2 | Skipped | Customer skipped tip |

### ReviewRoutingType

| Value | Name | Threshold |
|---:|---|---|
| 0 | Public | Rating 4-5 |
| 1 | Private | Rating 1-3 |
| 2 | Skipped | Customer skipped review |

### BusinessStaffLinkStatus

| Value | Name | Description |
|---:|---|---|
| 0 | Pending | Invite/link request sent |
| 1 | Active | Staff linked and visible |
| 2 | Inactive | Hidden, data preserved |
| 3 | Rejected | Staff declined link request |

### StaffInviteStatus

| Value | Name |
|---:|---|
| 0 | Pending |
| 1 | Accepted |
| 2 | Expired |
| 3 | Cancelled |

---

## 7. API Endpoint Map for Coding Agent

| Module | Method | Endpoint | Auth | Primary UI |
|---|---:|---|---|---|
| Authentication | POST | `/api/v1/authentication/signin` | Public | Sign In |
| Authentication | POST | `/api/v1/authentication/signup` | Public | Sign Up |
| Authentication | POST | `/api/v1/authentication/refresh-token` | Public | Token Interceptor |
| Authentication | POST | `/api/v1/authentication/forgot-password` | Public | Forgot Password |
| Authentication | POST | `/api/v1/authentication/reset-password` | Public | Reset Password |
| Authentication | POST | `/api/v1/authentication/send-verification-email` | Public | Verify Email |
| Authentication | POST | `/api/v1/authentication/verify-email` | Public | Verify Email |
| User Profile | GET | `/api/v1/userprofile/me` | Bearer | Account/Profile |
| User Profile | GET | `/api/v1/userprofile/verified-status` | Bearer | Account/Profile |
| User Profile | PUT | `/api/v1/userprofile/update` | Bearer | Edit Profile |
| Merchant Business | POST | `/api/v1/merchant/business` | Merchant | Onboarding Step 1 |
| Merchant Business | GET | `/api/v1/merchant/business` | Merchant | Business Settings |
| Merchant Business | GET | `/api/v1/merchant/business/check-slug` | Merchant | Slug Input |
| Merchant Business | PUT | `/api/v1/merchant/business/review-links` | Merchant | Onboarding Step 2 |
| Merchant Business | PUT | `/api/v1/merchant/business/logo` | Merchant | Logo Upload |
| Merchant Business | POST | `/api/v1/merchant/business/complete-onboarding` | Merchant | Final Onboarding |
| Staff Management | POST | `/api/v1/merchant/staff/invite` | Owner | Staff Invite |
| Staff Management | GET | `/api/v1/merchant/staff` | Owner | Staff List |
| Staff Management | GET | `/api/v1/merchant/staff/search` | Owner | Link Existing Staff |
| Staff Setup | GET | `/api/v1/staff/invite/{token}` | Public | Invite Landing |
| Staff Setup | POST | `/api/v1/staff/invite/{token}/accept` | Public | Accept Invite |
| Staff Setup | PUT | `/api/v1/staff/profile` | Staff | Staff Profile |
| Touch Points | POST | `/api/v1/merchant/touchpoints` | Merchant | Create QR |
| Touch Points | GET | `/api/v1/merchant/touchpoints` | Merchant | QR List |
| Touch Points | GET | `/api/v1/merchant/touchpoints/{id}/download` | Merchant | Download QR |
| Staff Payment | GET | `/api/v1/staff/payment-methods` | Staff | Staff Payment Settings |
| Staff Payment | PUT | `/api/v1/staff/payment-methods/{id}` | Staff | Edit Payment Method |
| Staff Payment | PATCH | `/api/v1/staff/payment-methods/{id}/toggle` | Staff | Toggle Payment Method |
| Merchant Payment | GET | `/api/v1/merchant/payment-methods` | Merchant | Business Payment Settings |
| Merchant Payment | PUT | `/api/v1/merchant/payment-methods/{id}` | Merchant | Edit Business Payment |
| Merchant Payment | PATCH | `/api/v1/merchant/payment-methods/{id}/toggle` | Merchant | Toggle Business Payment |
| Customer Touch | GET | `/api/v1/touch/{businessSlug}/{touchPointSlug}` | Public | Touch Page |
| Customer Touch | GET | `/api/v1/touch/payment-link` | Public | Payment Redirect |
| Customer Touch | POST | `/api/v1/touch/tip` | Public | Single Tip |
| Customer Touch | POST | `/api/v1/touch/tip/skip` | Public | Skip Tip |
| Customer Touch | POST | `/api/v1/touch/tip/{tipId}/confirm` | Public | Confirm Tip |
| Customer Touch | POST | `/api/v1/touch/review` | Public | Submit Review |
| Multi Staff Tip | POST | `/api/v1/tips/multi-staff` | Public | Multi Staff Tip |
| Multi Staff Tip | PATCH | `/api/v1/tips/{id}/confirm` | Public | Confirm Multi Tip |
| Public Business | GET | `/api/v1/public/businesses/{businessId}/payment-methods` | Public | Multi Tip Payment Method |
| Dashboard | GET | `/api/v1/merchant/dashboard/overview` | Merchant | Dashboard Overview |
| Dashboard | GET | `/api/v1/merchant/dashboard/reviews` | Merchant | Review Inbox |
| Dashboard | PUT | `/api/v1/merchant/dashboard/reviews/{id}/resolve` | Merchant | Resolve Feedback |
| Dashboard | GET | `/api/v1/merchant/dashboard/staff` | Merchant | Staff Analytics |
| Dashboard | GET | `/api/v1/merchant/dashboard/touchpoints` | Merchant | QR Analytics |
| Images | POST | `/api/v1/images/upload` | Bearer | Auth Image Upload |
| Images | POST | `/api/v1/images/public/upload` | Public | Staff Invite Upload |
| Notifications | GET | `/api/v1/notifications` | Bearer | Notification Center |
| Notifications | GET | `/api/v1/notifications/unread-count` | Bearer | Header Badge |
| Notifications | PUT | `/api/v1/notifications/{id}/read` | Bearer | Mark Read |
| Notifications | PUT | `/api/v1/notifications/read-all` | Bearer | Mark All Read |

---

## 8. Recommended Frontend Architecture

```text
src/
  app/
    core/
      api/
        api-client.ts
        auth.interceptor.ts
        error.interceptor.ts
      guards/
        auth.guard.ts
        merchant.guard.ts
      models/
        auth.models.ts
        business.models.ts
        staff.models.ts
        touch.models.ts
        payment.models.ts
        dashboard.models.ts
        error.models.ts
    features/
      auth/
      merchant-onboarding/
      merchant-staff/
      merchant-touchpoints/
      merchant-payment-methods/
      merchant-dashboard/
      staff-invite/
      staff-profile/
      staff-payment-methods/
      public-touch/
      notifications/
```

### Service layer naming

| Service | Responsibility |
|---|---|
| `AuthService` | Sign in, sign up, refresh token, verify email, password reset. |
| `UserProfileService` | Current profile, verified status, profile update. |
| `MerchantBusinessService` | Create/read business, slug check, review links, logo, complete onboarding. |
| `MerchantStaffService` | Invite, list, search, link, status, reorder, unlink. |
| `StaffSetupService` | Get invite token metadata, accept invite, update profile. |
| `TouchPointService` | Create/list/download/delete QR touch points. |
| `StaffPaymentMethodService` | Staff method list/update/toggle. |
| `MerchantPaymentMethodService` | Business method list/update/toggle. |
| `PublicTouchService` | Customer touch page, payment link, tip, skip, review. |
| `MultiStaffTipService` | Create and confirm multi-staff tip. |
| `DashboardService` | Overview, staff, touchpoint, reviews. |
| `ImageUploadService` | Auth and public image upload. |
| `NotificationService` | List, unread count, mark read. |

---

## 9. Error Handling Rules

All `4xx` and `5xx` errors use a standard response shape.

### Single error

```json
{
  "type": "...",
  "title": "Not Found",
  "status": 404,
  "errorCode": "BUSINESS_NOT_FOUND"
}
```

### Validation error

```json
{
  "status": 400,
  "errorCode": "COMMON_VALIDATION_ERROR",
  "errors": {
    "name": ["BUSINESS_NAME_REQUIRED"],
    "amount": ["TIP_AMOUNT_TOO_LOW", "TIP_AMOUNT_TOO_HIGH"]
  }
}
```

### Rate limit

```json
{
  "status": 429,
  "errorCode": "COMMON_RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

### Common error codes

| Code | HTTP | Meaning |
|---|---:|---|
| `COMMON_VALIDATION_ERROR` | 400 | Validation failed. |
| `COMMON_NOT_FOUND` | 404 | Generic not found. |
| `COMMON_UNAUTHORIZED` | 401 | Missing or invalid token. |
| `COMMON_FORBIDDEN` | 403 | No permission. |
| `COMMON_RATE_LIMIT_EXCEEDED` | 429 | Too many requests. |
| `COMMON_INTERNAL_SERVER_ERROR` | 500 | Unexpected server error. |

---

## 10. Acceptance Criteria for AI Coding Agent

### Authentication

- User can sign up, verify email, sign in, and refresh token automatically.
- Expired access token triggers refresh-token flow exactly once.
- Expired refresh token redirects to Sign In.

### Merchant onboarding

- Merchant can create business profile with slug validation.
- Logo upload supports PNG/JPEG/WebP up to 10 MB.
- Merchant can add review links.
- Merchant can invite staff and create QR touch points.
- Completing onboarding makes business public.

### Staff setup

- Staff can open invite token and see business invite info.
- Staff can upload photo and accept invite.
- Staff can configure and toggle payment method.
- Staff does not appear publicly until at least one method is active and configured.

### Customer touch

- Customer can load touch page anonymously from QR.
- Staff list never exposes raw payment account info.
- Single-staff tip supports deep links and copy-only methods.
- Multi-staff tip requires at least two staff and uses business payment methods.
- Customer can skip tip and still review.
- Review routes to public/private experience by rating.

### Dashboard

- Merchant can view overview, staff metrics, QR metrics, and reviews.
- Merchant can filter private unresolved reviews and mark them resolved.

---

## 11. Suggested Route Map

```text
/auth/sign-in
/auth/sign-up
/auth/verify-email
/auth/forgot-password
/auth/reset-password

/merchant/onboarding
/merchant/business
/merchant/staff
/merchant/touchpoints
/merchant/payment-methods
/merchant/dashboard
/merchant/notifications

/staff/invite/:token
/staff/profile
/staff/payment-methods

/touch/:businessSlug/:touchPointSlug
/touch/:businessSlug/:touchPointSlug/pay
/touch/:businessSlug/:touchPointSlug/confirm
/touch/:businessSlug/:touchPointSlug/review
```

---

## 12. Copywriting Notes for End-user UI

Use simple wording. Avoid API terms in customer-facing screens.

| Technical Term | End-user Copy |
|---|---|
| Touch Point | QR Code / Location |
| BusinessPaymentMethod | Business payment account |
| StaffPaymentMethod | Staff payment account |
| Confirm Tip | I paid |
| Skip Tip | Skip tip |
| ReviewRoutingType.Public | Share a public review |
| ReviewRoutingType.Private | Send private feedback |
| isConfigured | Account added |
| isActive | Enabled |
| StaffCard | Staff QR card |

---

## 13. Implementation Warnings

- Do not call protected merchant endpoints before token is available.
- Do not assume customer touch page has staff; it may return one staff for `StaffCard` or empty if no staff are active/configured.
- Do not show Google/Yelp buttons if no review links are configured.
- Do not toggle `VlinkPay` payment method active unless KYC/KYB is approved.
- Do not show raw staff payment `accountInfo` to merchant or customer except through `/touch/payment-link` behavior.
- For Zelle and Apple Cash, build copy UI instead of redirecting.
- For multi-staff tips, use business payment methods, not staff payment methods.
- For touch point delete, treat as soft delete; analytics history remains.

---

## 14. Minimal MVP Build Order

1. Auth + token refresh
2. Merchant onboarding business info
3. Staff invite + staff setup
4. Staff payment methods
5. Touch point QR creation/list/download
6. Public customer touch page - single-staff tip
7. Review submission + public/private routing
8. Merchant dashboard overview
9. Multi-staff tip
10. Notifications

