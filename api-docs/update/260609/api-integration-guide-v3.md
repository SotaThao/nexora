# NEXORA TOUCH — API Integration Guide v3

> Converted from PDF: `03. api-integration-guide-v3.pdf`

<!-- Page 1 -->

v3
Version: 3.0 | Updated: 2026-06-08
Base: Clean Architecture .NET 8 API with CQRS (MediatR) and JWT authentication
Changes from v2: Corrected all endpoint payloads, response shapes, and error codes to match
OpenAPI specification (specification.json). Updated pagination query param casing, staff search
param, staff reorder field, dashboard response structures.
## Table of Contents
## Part 1 — API Reference
## 1. Authentication
## 2. User Profile
## 3. Merchant Business — Onboarding
## 4a. Merchant Staff Management ⭐ UPDATED (spec-corrected)
## 4b. Staff Self-Setup (Public)
## 4. Touch Points & QR ⭐ UPDATED (spec-corrected)
## 5. Staff Payment Methods
## 6. Merchant Payment Methods
## 7. Customer Touch Page (Public)
## 8. Multi-Staff Tip (Public)
## 9. Public Business Payment Methods
## 10. Owner Dashboard ⭐ UPDATED (tips-chart added)
## 11. Image Upload
## 12. Notifications
## 13. Tip Transaction History (Merchant)
## 14. Staff Tip History
## Part 2 — Business Flow Sequences
Flow 1: Merchant Registration & Onboarding Wizard
Flow 2: Invite Staff — New (Luồng A)

<!-- Page 2 -->

Flow 3: Link Existing Staff (Luồng B)
Flow 4: Customer Touch Flow (Single-Staff)
Flow 4M: Customer Touch Flow (Multi-Staff)
Flow 4b: Customer Skip Tip — Review Only
Flow 5: Payment Method Management
Flow 6: Dashboard Management
Flow 7: Auto Refresh Token
Flow 8: Tip Transaction History
## Part 3 — Enums Reference
## Part 4 — Standard Error Response Format
## Base URLs
Environment
Base URL
Swagger UI
Local
https://localhost:7012
https://localhost:7012/swagger
Test (Dev)
https://nexora-dev-api.vlinkhub.com
/api/index.html?
url=/api/specification.json
Staging
(chưa cập nhật)
—
Production
(chưa cập nhật)
—
## Authentication Header
All protected endpoints require:
Authorization: Bearer <accessToken>
## Part 1 — API Reference

<!-- Page 3 -->

## 1. Authentication
**Base route:  POST /api/v1/authentication/***
**Auth:  AllowAnonymous  (all endpoints)**
### `POST /api/v1/authentication/signin`
Sign in with email and password.
> Rate limit:  SignIn  policy
**Request body:**
Field
Type
Required
Description
email
string
Yes
User email
password
string
Yes
User password
**Response  200 :**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "abc...",
  "expiresIn": 3600
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Sign-in successful
400
USER_LOGIN_INVALID_USERNAME_OR_PASSWORD
Wrong credentials
400
USER_ACCOUNT_INACTIVE
Account suspended or inactive
429
COMMON_RATE_LIMIT_EXCEEDED
Too many sign-in attempts

<!-- Page 4 -->

### `POST /api/v1/authentication/signup`
Register a new account.
> Rate limit:  SignUp  policy
**Request body:**
Field
Type
Required
Description
email
string
Yes
Valid email address
password
string
Yes
Min 8 chars
confirmEmail
string
Yes
Must match  email
type
string
Yes
"Merchant"  or  "User"
referralCode
string
No
Optional referral code
**Response  201 :**
```json
{
  "isSuccess": true,
  "email": "user@example.com",
  "userId": "guid",
  "message": "Registration successful. Please verify your email.",
  "errorCode": null
}
```
**Response codes:**
Status
ErrorCode
Description
201
—
Account created; email verification sent
400
USER_EMAIL_ALREADY_EXISTS
Email taken
400
AUTH_PASSWORDS_DO_NOT_MATCH
Passwords don't match
400
USER_FEATURE_SIGNUP_DISABLED
Signup feature toggle disabled
429
COMMON_RATE_LIMIT_EXCEEDED
Rate limited

<!-- Page 5 -->

### `POST /api/v1/authentication/refresh-token`
Exchange a refresh token for a new access token pair.
> Rate limit:  RefreshToken  policy
**Request body:**
Field
Type
Required
Description
refreshToken
string
Yes
Current refresh token
**Response  200 :**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "newRefresh...",
  "expiresIn": 3600
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
New token pair issued
400
USER_INVALID_REFRESH_TOKEN
Token invalid or expired
401
AUTH_USER_NOT_AUTHENTICATED
Not authenticated
### `POST /api/v1/authentication/forgot-password`
Request a password reset email.
> Rate limit:  ForgotPassword  policy
**Request body:**
Field
Type
Required
Description
email
string
Yes
Registered email

<!-- Page 6 -->

**Response  200 :**
```json
{
  "success": true
}
```
Always returns 200 to avoid email enumeration attacks.
### `POST /api/v1/authentication/reset-password`
Reset password using the token from the email link.
> Rate limit:  ResetPassword  policy
**Request body:**
Field
Type
Required
Description
token
string
Yes
Reset token from email
email
string
Yes
User email
newPassword
string
Yes
New password
confirmPassword
string
Yes
Must match  newPassword
**Response  200 :**
```json
{
  "success": true
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Password reset successful
400
USER_PASSWORD_RESET_TOKEN_EXPIRED
Token expired
400
AUTH_PASSWORDS_DO_NOT_MATCH
Passwords don't match

<!-- Page 7 -->

### `POST /api/v1/authentication/send-verification-email`
Re-send the email verification link.
> Rate limit:  VerificationEmail  policy
**Request body:**
Field
Type
Required
Description
email
string
Yes
Email to verify
ssoActivationToken
string
No
SSO activation token (required when verifying from
SSO flow)
**Response codes:**
Status
ErrorCode
Description
200
—
Verification email sent
404
USER_NOT_FOUND
Email not registered
400
USER_EMAIL_ALREADY_VERIFIED
Already verified
### `POST /api/v1/authentication/verify-email`
Confirm email with the token from the verification link.
> Rate limit:  VerificationEmail  policy
**Request body:**
Field
Type
Required
Description
token
string
Yes
Email verification token
email
string
Yes
User email
**Response  200 :**

<!-- Page 8 -->

```json
{
  "success": true,
  "message": "Email verified, account activated.",
  "redirectUrl": null
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Email verified, account activated
400
USER_INVALID_EMAIL_VERIFICATION_TOKEN
Token invalid
400
USER_EMAIL_VERIFICATION_TOKEN_EXPIRED
Token expired
### `POST /api/v1/authentication/passwordless-signin`
Sign in via a one-time passwordless token (e.g., magic link from VlinkPay ecosystem).
> Rate limit:  PasswordlessSignIn  policy
**Request body:**
Field
Type
Required
Description
token
string
Yes
Passwordless sign-in token
returnPath
string
No
Optional path to redirect after sign-in
**Response  200 :**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "abc...",
  "expiresIn": 3600,
  "returnPath": "/dashboard"
}
```
**Response codes:**

<!-- Page 9 -->

Status
ErrorCode
Description
200
—
Sign-in successful
400
USER_INVALID_PASSWORDLESS_TOKEN
Token invalid or expired
404
USER_NOT_FOUND
User not found
## 2. User Profile
**Base route:  /api/v1/userprofile**
**Auth:  [Authorize]  (Bearer token required for all)**
### `GET /api/v1/userprofile/me`
Get the authenticated user's profile.
**Response  200 :**

<!-- Page 10 -->

```json
{
  "id": "guid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "phoneNumber": "+1...",
  "userType": "Merchant",
  "status": "Active",
  "profileImage": {
    "url": "https://...",
    "thumbnailUrl": "https://..."
  },
  "isEmailVerified": true,
  "isPhoneVerified": false,
  "isKYCVerified": false,
  "lastLoginAt": "2026-06-08T10:00:00Z",
  "dateOfBirth": null,
  "gender": null,
  "city": "Houston",
  "state": "TX",
  "country": "US",
  "zipCode": "77001",
  "address": "123 Main St",
  "contactInfo": null,
  "referralCode": "ABC123"
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Profile returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
404
USER_NOT_FOUND
User not found

<!-- Page 11 -->

### `GET /api/v1/userprofile/verified-status`
Check if the current user's email is verified.
**Response  200 :**
```json
{
  "status": "Active",
  "profileType": "Merchant"
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Status returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
404
USER_NOT_FOUND
User not found
### `GET /api/v1/userprofile/`
Get a public profile by user ID (read-only public fields).
**Path params:  userId  — UUID**
**Response  200 :**

<!-- Page 12 -->

```json
{
  "id": "guid",
  "firstName": "John",
  "lastName": "Doe",
  "fullName": "John Doe",
  "userType": "Merchant",
  "status": "Active",
  "profileImageUrl": "https://...",
  "bio": null,
  "city": "Houston",
  "state": "TX",
  "country": "US"
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Profile returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
404
USER_NOT_FOUND
User not found
### `PUT /api/v1/userprofile/update`
Update current user's profile.
**Request body:**
Field
Type
Required
Constraints
firstName
string
Yes
Max 100 chars
lastName
string
No
Max 100 chars
phoneNumber
string
No
International format
profileImageUrl
string
No
Valid URL, max 500 chars

<!-- Page 13 -->

Field
Type
Required
Constraints
city
string
No
Max 100 chars
state
string
No
Max 100 chars
country
string
No
Max 100 chars
zipCode
string
No
Max 20 chars
address
string
No
Max 200 chars
website
string
No
Valid URL
youtube
string
No
YouTube channel URL or handle
instagram
string
No
Instagram handle or URL
facebook
string
No
Facebook URL
twitter
string
No
Twitter/X handle or URL
tiktok
string
No
TikTok handle or URL
Returns updated  UserProfileResponseDto  (same shape as GET  /me  response).
**Response codes:**
Status
ErrorCode
Description
200
—
Profile updated; returns updated
profile
400
USER_PROFILE_FIRST_NAME_REQUIRED
Missing first name
400
USER_PROFILE_PHONE_NUMBER_INVALID_FORMAT
Invalid phone
401
COMMON_UNAUTHORIZED
Missing or invalid token
404
USER_NOT_FOUND
User not found
### `POST /api/v1/userprofile/delete-account`
Request account deletion. Triggers a soft-delete workflow.

<!-- Page 14 -->

**Response:  200 OK**
## 3. Merchant Business — Onboarding
**Base route:  /api/v1/merchant**
**Auth:  [Authorize]  — must be  ProfileType.Merchant**
### `POST /api/v1/merchant/business`
Create the merchant's business profile (Step 1 of onboarding wizard).
Automatically creates a  Starter  subscription with a 30-day trial and pre-seeds all  PayoutMethodType
payment methods (inactive by default).
**Request body:**
Field
Type
Required
Constraints
name
string
Yes
3–100 chars
businessType
string
No
e.g., "Nail Salon", "Restaurant"
address
string
No
city
string
No
state
string
No
phone
string
No
timeZone
string
No
IANA timezone string
website
string
No
description
string
No
Max 300 chars
logoUrl
string
No
Pre-uploaded via  /api/v1/images/upload
customSlug
string
No
Lowercase, alphanumeric + hyphens, max 50 chars
**Response  201 :**

<!-- Page 15 -->

```json
{
  "businessId": "guid",
  "slug": "bitcoin-nail-bar"
}
```
**Response codes:**
Status
ErrorCode
Description
201
—
Business created
400
BUSINESS_ALREADY_EXISTS
Merchant already has a business
400
BUSINESS_NAME_REQUIRED
Missing name
400
BUSINESS_INVALID_SLUG_FORMAT
Slug contains invalid characters
403
USER_NOT_MERCHANT
Caller is not a Merchant profile type
401
COMMON_UNAUTHORIZED
Missing or invalid token
> Slug auto-generation: If  customSlug  is omitted, a unique slug is generated from  name
(lowercased, spaces → hyphens, special chars stripped). Collisions are resolved by appending
-2 ,  -3 , etc.
### `GET /api/v1/merchant/business`
Get the authenticated merchant's business profile.
**Response  200 :**

<!-- Page 16 -->

```json
{
  "id": "guid",
  "name": "Bitcoin Nail Bar",
  "slug": "bitcoin-nail-bar",
  "businessType": "Nail Salon",
  "address": "123 Main St",
  "city": "Houston",
  "state": "TX",
  "phone": "+17131234567",
  "logoUrl": "https://...",
  "description": "...",
  "isPublic": false,
  "onboardingStep": 1,
  "googleReviewUrl": null,
  "yelpUrl": null,
  "facebookUrl": null,
  "feedbackEmail": null,
  "subscription": {
    "plan": "Starter",
    "status": "Trialing",
    "trialEndsAt": "2026-07-05T00:00:00Z"
  }
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Business found
404
BUSINESS_NOT_FOUND
No business exists for this merchant
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `GET /api/v1/merchant/business/check-slug`
Real-time slug availability check (used during onboarding wizard typing).
**Query params:**

<!-- Page 17 -->

Param
Type
Required
Description
slug
string
No
Desired slug to check
**Response  200 :**
```json
{
  "isAvailable": false,
  "suggestion": "bitcoin-nail-bar-2"
}
```
**Response codes:**
Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
### `PUT /api/v1/merchant/business/review-links`
Update external review platform links (Step 2 of onboarding wizard). All fields are optional.
**Request body:**
Field
Type
Required
Description
googleReviewUrl
string
No
Full Google Maps review URL
yelpUrl
string
No
Yelp business page URL
facebookUrl
string
No
Facebook page URL
feedbackEmail
string
No
Email for private negative feedback notifications
**Response:  200 OK  (no body)**
> Business rule BR-OB01: At least one review link is required for the review routing feature to work
on the customer touch page. If none are set, ratings ≥4 will not redirect to external reviews.
**Response codes:**

<!-- Page 18 -->

Status
ErrorCode
Description
200
—
Updated
400
COMMON_VALIDATION_ERROR
Validation failed
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
404
BUSINESS_NOT_FOUND
Business not found
### `PUT /api/v1/merchant/business/logo`
Upload business logo. Accepts multipart form data. Logo is auto-resized to 400×400px and uploaded
to S3.
> Content-Type:  multipart/form-data
**Form fields:**
Field
Type
Required
Description
logo
file
Yes
Image file (PNG/JPEG/WebP)
**Response  200 :**
```json
{
  "logoUrl": "https://storage.nexora.vlinkpay.com/nexora/businesses/.../logo.png"
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Logo uploaded
400
BUSINESS_LOGO_UPLOAD_FAILED
Upload error
400
IMAGE_FILE_SIZE_EXCEEDED
File too large
400
IMAGE_UNSUPPORTED_FILE_TYPE
Invalid format

<!-- Page 19 -->

Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
404
BUSINESS_NOT_FOUND
Business not found
### `POST /api/v1/merchant/business/complete-onboarding`
Mark onboarding complete (Step 5). Sets  Business.IsPublic = true  and merchant's profile status to
Active .
**Request: No body.**
**Response:  200 OK**
**Response codes:**
Status
ErrorCode
Description
200
—
Onboarding complete, business is now public
404
BUSINESS_NOT_FOUND
Business not created yet
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
## 4a. Merchant Staff Management
**Base route:  /api/v1/merchant/staff**
**Auth:  [Authorize]  — business owner only**

<!-- Page 20 -->

### `POST /api/v1/merchant/staff/invite`
Invite a new staff member (Luồng A). Sends a magic-link email if  invitedEmail  is provided. Token
expires in 7 days.
**Request body:**
Field
Type
Required
Constraints
invitedName
string
Yes
Max 100 chars
invitedPhone
string
Conditional
Required if  invitedEmail  is empty
invitedEmail
string
Conditional
Required if  invitedPhone  is empty
invitedPosition
string
No
Max 100 chars
**Response  201 :**
```json
{
  "inviteId": "guid"
}
```
**Response codes:**
Status
ErrorCode
Description
201
—
Invite created, email sent
400
STAFF_PHONE_OR_EMAIL_REQUIRED
Neither phone nor email provided
400
STAFF_INVITED_NAME_REQUIRED
Name missing
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `POST /api/v1/merchant/staff/{inviteId}/resend`
Resend an existing pending invite.
**Path params:  inviteId  — UUID of the  StaffInvite**

<!-- Page 21 -->

**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Invite resent
404
STAFF_INVITE_NOT_FOUND
Invite not found
400
STAFF_INVITE_NOT_PENDING
Invite already accepted or cancelled
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `POST /api/v1/merchant/staff/{inviteId}/resend-invite`
Alternate endpoint to resend an existing pending invite (use interchangeably with  /resend ).
**Path params:  inviteId  — UUID of the  StaffInvite**
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Invite resent
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
404
STAFF_INVITE_NOT_FOUND
Invite not found
400
STAFF_INVITE_NOT_PENDING
Invite already accepted or cancelled

<!-- Page 22 -->

### `GET /api/v1/merchant/staff`
Get the paginated staff list for the authenticated merchant's business. Includes both active links and
pending invites.
**Query params:**
Param
Type
Required
Default
Description
Keyword
string
No
—
Case-insensitive search on DisplayName,
StaffCode, email, phone
PageNumber
int
No
1
Page number (1-based)
PageSize
int
No
20
Items per page
**Response  200 :**

<!-- Page 23 -->

```json
{
  "items": [
    {
      "id": "guid",
      "itemType": "link",
      "staffProfileId": "guid",
      "staffCode": "S12345678",
      "displayName": "Linh Nguyen",
      "photoUrl": "https://...",
      "position": "Nail Tech",
      "status": "Active",
      "sortOrder": 0,
      "isProfileComplete": true,
      "tipCount": 42,
      "averageRating": 4.8
    },
    {
      "id": "guid",
      "itemType": "invite",
      "staffProfileId": null,
      "staffCode": null,
      "displayName": "Maria Garcia",
      "photoUrl": null,
      "position": "Stylist",
      "status": "Pending",
      "sortOrder": 1,
      "isProfileComplete": false,
      "tipCount": 0,
      "averageRating": 0
    }
  ],
  "pageNumber": 1,
  "totalPages": 3,
  "totalCount": 42,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```
itemType  is  "link"  for accepted staff (has  staffProfileId ) or  "invite"  for pending invites
( staffProfileId  is null). Linked staff always appear before pending invites on the same page.
**Response codes:**

<!-- Page 24 -->

Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `GET /api/v1/merchant/staff/search`
Search for an existing staff profile by phone or email (used for Luồng B — link existing staff).
**Query params:**
Param
Type
Required
Description
q
string
No
Search by phone number or email
**Response  200 : Array of matching staff profiles (limited public fields — display name, position, photo).**
**Response codes:**
Status
ErrorCode
Description
200
—
Matching staff profiles returned
400
COMMON_VALIDATION_ERROR
Validation error
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `PUT /api/v1/merchant/staff/{staffLinkId}/status`
Set a staff member's link status to  Active  or  Inactive .
Inactive  hides the staff member from the customer touch page but preserves all data.
**Path params:  staffLinkId  — UUID of the  BusinessStaffLink**
**Request body:**

<!-- Page 25 -->

Field
Type
Required
Values
staffLinkId
string (UUID)
Yes
Must match the path parameter  {staffLinkId}
status
string
Yes
"Active"  |  "Inactive"
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Status updated
400
STAFF_INVALID_STATUS
Invalid status value
404
STAFF_LINK_NOT_FOUND
Link not found
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `PUT /api/v1/merchant/staff/reorder`
Update the display order of staff on the touch page (drag-and-drop).
**Request body:**
Field
Type
Required
Description
items
array
Yes
Array of  { id: UUID, sortOrder: integer }  objects in desired
order
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Order updated
400
COMMON_VALIDATION_ERROR
Validation error

<!-- Page 26 -->

Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `DELETE /api/v1/merchant/staff/`
Unlink a staff member from the business. Does not delete the staff profile or payment data.
**Path params:  staffLinkId  — UUID**
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Unlinked
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
404
STAFF_LINK_NOT_FOUND
Link not found
### `POST /api/v1/merchant/staff/link-request/`
Send a link request to an existing staff profile (Luồng B).
**Path params:  staffProfileId  — UUID of the target  StaffProfile**
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Request sent

<!-- Page 27 -->

Status
ErrorCode
Description
400
STAFF_ALREADY_LINKED_TO_BUSINESS
Staff already linked to this business
404
STAFF_PROFILE_NOT_FOUND
Staff profile not found
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
## 4b. Staff Self-Setup (Public)
**Base route:  /api/v1/staff**
**Auth: Mixed — public invite endpoints are  AllowAnonymous ;  PUT /profile  requires Bearer token**
### `GET /api/v1/staff/invite/`
Get invite metadata from a magic-link token (called when the staff member opens the invite link).
**Auth:  AllowAnonymous**
**Path params:  token  — URL-safe Base64 invite token**
**Response  200 :**
```json
{
  "invitedName": "Maria Garcia",
  "invitedPosition": "Stylist",
  "businessName": "Bitcoin Nail Bar"
}
```
**Response codes:**
Status
ErrorCode
Description
200
—
Invite found
400
STAFF_INVITE_EXPIRED
Token expired (7 days)

<!-- Page 28 -->

Status
ErrorCode
Description
400
STAFF_INVITE_ALREADY_ACCEPTED
Already accepted
410
COMMON_GONE
Token not found or permanently expired
### `POST /api/v1/staff/invite/{token}/accept`
Accept an invite and set up the staff profile. Creates a  UserProfile  (if the email/phone isn't
registered), a  StaffProfile , and pre-seeds 5 payment methods (all inactive).
**Auth:  AllowAnonymous**
**Path params:  token  — invite token from URL**
**Request body:**
Field
Type
Required
Constraints
token
string
Yes
Invite token (same as URL path parameter)
displayName
string
Yes
2–100 chars
position
string
No
Max 100 chars
bio
string
No
Max 200 chars
photoUrl
string
No
Pre-uploaded URL
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Invite accepted, profile created
400
STAFF_INVITE_EXPIRED
Token expired
400
STAFF_INVITE_ALREADY_ACCEPTED
Already accepted
400
STAFF_DISPLAY_NAME_REQUIRED
Display name missing

<!-- Page 29 -->

Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
### `PUT /api/v1/staff/profile`
Update the authenticated staff member's own profile.
**Auth:  [Authorize]  — Bearer token required**
**Request body:**
Field
Type
Required
Constraints
displayName
string
Yes
2–100 chars
position
string
No
Max 100 chars
bio
string
No
Max 200 chars
photoUrl
string
No
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Profile updated
400
STAFF_DISPLAY_NAME_REQUIRED
Missing display name
400
STAFF_DISPLAY_NAME_TOO_SHORT
Display name < 2 chars
404
STAFF_PROFILE_NOT_FOUND
No staff profile linked to this user
401
COMMON_UNAUTHORIZED
Missing or invalid token

<!-- Page 30 -->

## 5. Touch Points & QR
**Base route:  /api/v1/merchant/touchpoints**
**Auth:  [Authorize]**
### `POST /api/v1/merchant/touchpoints`
Create a new touch point. Generates a 1000×1000px QR PNG and uploads it to S3 automatically.
Starter plan limit: Maximum 3 touch points.
**Request body:**
Field
Type
Required
Constraints
name
string
Yes
2–100 chars
type
string
Yes
"Table"  |  "FrontDesk"  |  "Receipt"  |
"StaffCard"
assignedStaffProfileId
string
(UUID)
No
Required when  type = "StaffCard"
**Response  201 :**
```json
{
  "touchPointId": "guid",
  "qrImageUrl": "https://storage.nexora.vlinkpay.com/nexora/touchpoints/.../table-1.png"
}
```
> Touch point URL format:  {baseUrl}/touch/{businessSlug}/{touchPointSlug}
e.g.,  https://nexora.vlinkpay.com/touch/bitcoin-nail-bar/table-1
**Response codes:**
Status
ErrorCode
Description
201
—
Touch point created

<!-- Page 31 -->

Status
ErrorCode
Description
400
TOUCHPOINT_STARTER_LIMIT_REACHED
Starter plan limit (3) reached
400
TOUCHPOINT_NAME_REQUIRED
Missing name
400
TOUCHPOINT_INVALID_TYPE
Invalid touch point type
403
USER_NOT_MERCHANT
Not a merchant
401
COMMON_UNAUTHORIZED
Missing or invalid token
### `GET /api/v1/merchant/touchpoints`
List paginated active (non-deleted) touch points for the merchant's business.
**Query params:**
Param
Type
Required
Default
Description
PageNumber
int
No
1
Page number (1-based)
PageSize
int
No
20
Items per page
Name
string
No
—
Case-insensitive filter on touch point name
**Response  200 :**

<!-- Page 32 -->

```json
{
  "items": [
    {
      "id": "guid",
      "name": "Table 1",
      "slug": "table-1",
      "type": "Table",
      "url": "https://nexora.vlinkpay.com/touch/bitcoin-nail-bar/table-1",
      "qrImageUrl": "https://...",
      "assignedStaffProfileId": null,
      "isActive": true,
      "createdAt": "2026-06-01T12:00:00Z"
    }
  ],
  "pageNumber": 1,
  "totalPages": 2,
  "totalCount": 25,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```
> Sorted by  createdAt DESC  (newest first).
**Response codes:**
Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `GET /api/v1/merchant/touchpoints/{id}/download`
Download the QR code as PNG or PDF.
**Path params:  id  — UUID**
**Query params:**

<!-- Page 33 -->

Param
Type
Required
Values
format
string
No
"png"  |  "pdf"
**Response:**
format=png  →  image/png  — 1000×1000px
format=pdf  →  application/pdf  — A4 with QR + touch point name + Nexora branding
**Response codes:**
Status
ErrorCode
Description
200
—
File returned as download
400
TOUCHPOINT_INVALID_DOWNLOAD_FORMAT
Invalid format value
404
TOUCHPOINT_NOT_FOUND
Touch point not found
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `DELETE /api/v1/merchant/touchpoints/`
Soft-delete a touch point. Sets  DeletedAt  — preserves analytics history.
**Path params:  id  — UUID**
**Response:  204 No Content**
**Response codes:**
Status
ErrorCode
Description
204
—
Deleted
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
404
TOUCHPOINT_NOT_FOUND
Touch point not found

<!-- Page 34 -->

## 6. Staff Payment Methods
**Base route:  /api/v1/staff/payment-methods**
**Auth:  [Authorize]  — staff member only (ownership enforced)**
> Privacy rule BR-ST02: Payment account info (CashApp tag, Venmo handle, Zelle phone/email,
PayPal link) belongs exclusively to the staff member. Merchant endpoints cannot read raw
accountInfo  values.
Staff profiles are pre-seeded with 5 payment method records (inactive) upon accepting an invite.
### `GET /api/v1/staff/payment-methods`
Get the authenticated staff member's own payment methods.
**Response  200 :**
```json
[
  {
    "id": "guid",
    "type": "Zelle",
    "accountInfo": "+17131234567",
    "imageUrl": null,
    "isActive": true,
    "isConfigured": true
  },
  {
    "id": "guid",
    "type": "CashApp",
    "accountInfo": null,
    "imageUrl": null,
    "isActive": false,
    "isConfigured": false
  }
]
```
isConfigured  = true when  accountInfo  is set. A method must be both  isActive  and
isConfigured  to appear on the customer touch page.

<!-- Page 35 -->

**Response codes:**
Status
ErrorCode
Description
200
—
Payment methods returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
404
STAFF_PROFILE_NOT_FOUND
Staff profile not found
### `PUT /api/v1/staff/payment-methods/`
Update a payment method's account info and optional custom image. This is a full replace — sending
null  for a field clears it. After saving, the system recalculates  StaffProfile.IsProfileComplete
(true when at least one method has  isActive = true  and a non-empty  accountInfo ).
**Path params:  id  — UUID of the  StaffPaymentMethod**
**Request body:**
Field
Type
Required
Constraints
accountInfo
string |
null
No
Max 255 chars. Value depends on type: phone/email for
Zelle,  $tag  for CashApp,  @handle  for Venmo,
PayPal.me URL for PayPal. Sending  null  clears the
field.
imageUrl
string |
null
No
Max 500 chars. Custom QR/avatar URL. Sending  null
clears the field.
**Response  200 :**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "type": "Zelle",
  "accountInfo": "+17131234567",
  "imageUrl": null,
  "isActive": false,
  "isConfigured": true
}
```

<!-- Page 36 -->

isConfigured  is  true  when  accountInfo  is non-empty. It is computed — not a stored field.
**Response codes:**
Status
ErrorCode
Description
200
—
Updated successfully
400
STAFF_ACCOUNT_INFO_TOO_LONG
accountInfo  exceeds 255 chars
400
STAFF_IMAGE_URL_TOO_LONG
imageUrl  exceeds 500 chars
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
STAFF_PAYMENT_METHOD_ACCESS_DENIED
Attempting to update another user's method
404
STAFF_PAYMENT_METHOD_NOT_FOUND
Method not found
### `PATCH /api/v1/staff/payment-methods/{id}/toggle`
Toggle a payment method on ( isActive = true ) or off ( isActive = false ).
**Path params:  id  — UUID**
No request body.
**Response  200 : Updated  StaffPaymentMethodDto .**
> Business rule BR-ST01: A staff member must have at least one active AND configured payment
method to be visible on the customer touch page ( isProfileComplete = true ).
**Response codes:**
Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
STAFF_PAYMENT_METHOD_ACCESS_DENIED
Attempting to toggle another user's method
404
STAFF_PAYMENT_METHOD_NOT_FOUND
Method not found

<!-- Page 37 -->

## 7. Merchant Payment Methods
**Base route:  /api/v1/merchant/payment-methods**
**Auth:  [Authorize]  — merchant only**
Merchant payment methods ( BusinessPaymentMethod ) are used in the multi-staff tip flow
(Section 9). Customers tip through the business's payment method (e.g., the business's Venmo)
and the business distributes to staff. This is separate from individual staff payment methods.
All  PayoutMethodType  methods are pre-seeded on business creation (all inactive).
### `GET /api/v1/merchant/payment-methods`
Get the merchant's business payment methods.
**Response  200 :**
```json
[
  {
    "id": "guid",
    "type": "Venmo",
    "accountInfo": "@bitcoin-nail-bar",
    "imageUrl": null,
    "isActive": true,
    "isConfigured": true,
    "businessKybStatus": null
  },
  {
    "id": "guid",
    "type": "VlinkPay",
    "accountInfo": null,
    "imageUrl": null,
    "isActive": false,
    "isConfigured": false,
    "businessKybStatus": "NotStarted"
  }
]
```
VlinkPay  type requires KYC/KYB approval before it can be toggled active.

<!-- Page 38 -->

**Response codes:**
Status
ErrorCode
Description
200
—
Payment methods returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden
### `PUT /api/v1/merchant/payment-methods/`
Update a business payment method's account info and optional image. This is a full replace —
sending  null  for a field clears it.
**Path params:  id  — UUID of the  BusinessPaymentMethod**
**Request body:**
Field
Type
Required
Constraints
accountInfo
string |
null
No
Max 255 chars. Typically the business's handle or phone
for the given payment type. Sending  null  clears the
field.
imageUrl
string |
null
No
Max 500 chars. Sending  null  clears the field.
**Response  200 :**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "type": "Venmo",
  "accountInfo": "@bitcoin-nail-bar",
  "imageUrl": null,
  "isActive": false,
  "isConfigured": true,
  "businessKybStatus": null
}
```

<!-- Page 39 -->

isConfigured  is  true  when  accountInfo  is non-empty.  businessKybStatus  is non-null only
for the  VlinkPay  type.
**Response codes:**
Status
ErrorCode
Description
200
—
Updated successfully
400
BUSINESS_PAYMENT_METHOD_ACCOUNT_INFO_TOO_LONG
accountInfo  exceeds 255
chars
400
BUSINESS_PAYMENT_METHOD_IMAGE_URL_TOO_LONG
imageUrl  exceeds 500 chars
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
BUSINESS_PAYMENT_METHOD_ACCESS_DENIED
Method belongs to a different
merchant
403
USER_NOT_MERCHANT
Caller is not a Merchant profile
type
404
BUSINESS_PAYMENT_METHOD_NOT_FOUND
Method not found
### `PATCH /api/v1/merchant/payment-methods/{id}/toggle`
Toggle a business payment method on/off.
**Path params:  id  — UUID**
No request body.
**Response  200 : Updated  BusinessPaymentMethodDto .**
**Response codes:**
Status
ErrorCode
Description
200
—
Toggled
400
BUSINESS_PAYMENT_METHOD_CANNOT_TOGGLE_VLINKPAY
VlinkPay requires KYC first
400
BUSINESS_PAYMENT_METHOD_VLINKPAY_KYC_REQUIRED
KYC not approved

<!-- Page 40 -->

Status
ErrorCode
Description
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
BUSINESS_PAYMENT_METHOD_ACCESS_DENIED
Forbidden
404
BUSINESS_PAYMENT_METHOD_NOT_FOUND
Method not found
## 8. Customer Touch Page (Public)
**Base route:  /api/v1/touch**
**Auth:  AllowAnonymous  (all endpoints)**
> Rate limit:  PublicTouchPolicy
These are the guest-facing endpoints called from the customer's browser when they scan a QR code.
### `GET /api/v1/touch/{businessSlug}/`
Load the touch page data (business info, touch point info, staff list).
The  sessionId  query param is used for analytics tracking — generate a UUID on the frontend per
session.
**Path params:**
Param
Description
businessSlug
Business URL slug (e.g.,  bitcoin-nail-bar )
touchPointSlug
Touch point URL slug (e.g.,  table-1 )
**Query params:**
Param
Type
Required
Description
sessionId
string (UUID)
No
Session identifier for analytics grouping
**Response  200 :**

<!-- Page 41 -->

```json
{
  "business": {
    "name": "Bitcoin Nail Bar",
    "logoUrl": "https://...",
    "description": "Premium nail salon..."
  },
  "touchPoint": {
    "id": "guid",
    "name": "Table 1",
    "type": "Table",
    "assignedStaffProfileId": null
  },
  "staff": [
    {
      "id": "guid",
      "displayName": "Linh Nguyen",
      "photoUrl": "https://...",
      "position": "Nail Tech",
      "bio": "5 years experience",
      "availablePaymentMethods": ["CashApp", "Venmo"]
    }
  ]
}
```
> Privacy:  availablePaymentMethods  lists method type names only — raw  accountInfo  values
are never exposed.
StaffCard: When  touchPoint.type = "StaffCard" ,  staff  will contain exactly one entry (the
assigned staff member).
Inactive touch point: Returns  404  — redirected to "unavailable" page on the frontend.
**Response codes:**
Status
ErrorCode
Description
200
—
Touch page data loaded
404
TOUCHPOINT_NOT_FOUND
Slug doesn't exist or touch point is inactive

<!-- Page 42 -->

### `GET /api/v1/touch/payment-link`
Get the payment deep link (or Zelle copy info) for the selected staff, method, and amount.
Called when the customer taps "Pay" to redirect to the payment app.
**Query params:**
Param
Type
Required
Description
staffId
UUID
Yes
StaffProfile.Id
method
integer
Yes
PaymentMethod  enum value (see Enums section)
amount
decimal
Yes
Tip amount (1.00–500.00)
**Response  200 :**
```json
{
  "redirectUrl": "https://cash.app/$linh-nguyen/25.00",
  "zellePhone": null,
  "zelleEmail": null,
  "appleCashPhone": null
}
```
For Zelle:  redirectUrl  is null;  zellePhone  or  zelleEmail  is populated for the frontend to
display a copy-paste UI.
For Apple Cash:  redirectUrl  is null;  appleCashPhone  is populated.
For CashApp, Venmo, PayPal:  redirectUrl  is the deep link.
**Response codes:**
Status
ErrorCode
Description
200
—
Payment link returned
400
TIP_INVALID_PAYMENT_METHOD
Invalid method value
400
TIP_PAYMENT_METHOD_NOT_CONFIGURED
Staff hasn't set up this payment method
404
STAFF_PROFILE_NOT_FOUND
Staff not found

<!-- Page 43 -->

### `POST /api/v1/touch/tip`
Create a single-staff tip record with status  Initiated . Call this when the customer taps "Pay" (after
payment link is shown). Records the intent to tip and logs an analytics event.
**Request body:**
Field
Type
Required
Constraints
touchPointId
UUID
Yes
Active touch point
staffProfileId
UUID
No
Null if skipping staff selection
amount
decimal
Yes
1.00–500.00
paymentMethod
integer
Yes
PaymentMethod  enum value
sessionId
string
No
Session UUID for analytics
**Response  201 :**
```json
{
  "tipId": "guid"
}
```
**Response codes:**
Status
ErrorCode
Description
201
—
Tip initiated
400
TIP_AMOUNT_TOO_LOW
Amount < $1.00
400
TIP_AMOUNT_TOO_HIGH
Amount > $500.00
400
TIP_INVALID_PAYMENT_METHOD
Invalid method enum
404
TOUCHPOINT_NOT_FOUND
Touch point not found or inactive

<!-- Page 44 -->

### `POST /api/v1/touch/tip/skip`
Record that the customer chose to skip the tip (used for analytics and to create a  Skipped  tip record
before the review step).
**Request body:**
Field
Type
Required
Description
touchPointId
UUID
Yes
Active touch point
staffProfileId
UUID
No
Selected staff (if any)
sessionId
string
No
Session UUID
**Response:  201 Created  (no body)**
### `POST /api/v1/touch/tip/{tipId}/confirm`
Confirm a single-staff tip — called when the customer taps "Yes, I paid" on the confirmation screen.
Updates tip status to  Confirmed .
**Path params:  tipId  — UUID from the  POST /tip  response**
No request body.
**Response:  200 OK**
**Response codes:**
Status
ErrorCode
Description
200
—
Tip confirmed
400
TIP_ALREADY_CONFIRMED
Tip already in Confirmed state
404
TIP_NOT_FOUND
Tip not found

<!-- Page 45 -->

### `POST /api/v1/touch/review`
Submit a customer review. Rating determines routing:
4–5 stars →  RoutingType = Public  — frontend shows Google/Yelp buttons
1–3 stars →  RoutingType = Private  — private feedback collected; email sent to merchant within
5 minutes
**Request body:**
Field
Type
Required
Constraints
touchPointId
UUID
Yes
tipId
UUID
No
Link to a prior tip if applicable
staffProfileId
UUID
No
Staff being reviewed
rating
integer
Yes
1–5
comment
string
No
Max 500 chars
customerEmail
string
No
Valid email, max 200 chars (voluntary, for private
feedback reply)
customerName
string
No
Max 100 chars
**Response  201 :**
```json
{
  "reviewId": "guid"
}
```
The frontend should check  rating >= 4  locally to decide whether to show "Leave a Google/Yelp
review" buttons before calling this endpoint, as the routing type is determined server-side based on
the same threshold.
**Response codes:**
Status
ErrorCode
Description
201
—
Review created
400
REVIEW_RATING_RANGE
Rating not between 1–5

<!-- Page 46 -->

Status
ErrorCode
Description
400
REVIEW_COMMENT_MAX_LENGTH
Comment > 500 chars
400
REVIEW_CUSTOMER_EMAIL_INVALID
Invalid email format
404
TOUCHPOINT_NOT_FOUND
Touch point not found
### `POST /api/v1/touch/review/{reviewId}/track-google`
Log that the customer clicked the Google review button. Records  GoogleClickedAt  timestamp.
**Path params:  reviewId  — UUID**
No request body.
**Response:  200 OK**
### `POST /api/v1/touch/review/{reviewId}/track-yelp`
Log that the customer clicked the Yelp review button. Records  YelpClickedAt  timestamp.
**Path params:  reviewId  — UUID**
No request body.
**Response:  200 OK**
## 9. Multi-Staff Tip (Public)
**Base route:  /api/v1/tips**
**Auth:  AllowAnonymous**
> Rate limit:  PublicTouchPolicy
The multi-staff tip flow allows a customer to tip two or more staff members in a single transaction
through the business's payment method (e.g., the salon's Venmo). The business then distributes the

<!-- Page 47 -->

individual amounts to each staff member.
### `POST /api/v1/tips/multi-staff`
Create a multi-staff tip. Validates that:
At least 2 distinct staff profile IDs are provided
All staff are active at the given business
The selected  businessPaymentMethodId  is active and configured
Each individual  amount  ≥ $1.00
Total sum of all  amount  values ≤ $500.00
Uses a database transaction — rolls back entirely on any error.
**Request body:**
Field
Type
Required
Constraints
businessId
UUID
Yes
Business making the transaction
touchPointId
UUID
Yes
Active touch point
businessPaymentMethodId
UUID
Yes
Active, configured
BusinessPaymentMethod.Id
tipItems
array
Yes
Minimum 2 items; no duplicate
staffProfileId
tipItems[].staffProfileId
UUID
Yes
Must be active at the business
tipItems[].amount
decimal
Yes
≥ 1.00; total sum ≤ 500.00
Example request:

<!-- Page 48 -->

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
**Response  201 :**
```json
{
  "tipId": "guid",
  "totalAmount": 25.00,
  "paymentMethodType": "Venmo",
  "tipItems": [
    { "staffProfileId": "guid-linh", "amount": 15.00 },
    { "staffProfileId": "guid-maria", "amount": 10.00 }
  ]
}
```
**Response codes:**
Status
ErrorCode
Description
201
—
Multi-staff tip created
400
TIP_BUSINESS_PAYMENT_METHOD_REQUIRED
businessPaymentMethodId  missing or
empty
400
TIP_MINIMUM_STAFF_COUNT
Fewer than 2 staff in  tipItems
400
TIP_DUPLICATE_STAFF_PROFILE_ID
Same  staffProfileId  appears more
than once
400
TIP_AMOUNT_TOO_LOW
An individual item amount < $1.00
400
TIP_AMOUNT_TOO_HIGH
Total sum > $500.00
400
TIP_INVALID_BUSINESS_PAYMENT_METHOD
Payment method not active/configured

<!-- Page 49 -->

Status
ErrorCode
Description
400
TIP_STAFF_NOT_ACTIVE_AT_BUSINESS
One or more staff not active at this
business
404
TOUCHPOINT_NOT_FOUND
Touch point not found or inactive
### `PATCH /api/v1/tips/{id}/confirm`
Confirm a multi-staff tip (customer tapped "Yes, I paid"). Updates  Tip.Status  to  Confirmed .
**Path params:  id  — UUID of the tip**
No request body.
**Response:  200 OK**
**Response codes:**
Status
ErrorCode
Description
200
—
Confirmed
400
TIP_ALREADY_CONFIRMED
Already confirmed
404
TIP_NOT_FOUND
Tip not found
## 10. Public Business Payment Methods
**Base route:  /api/v1/public/businesses**
**Auth:  AllowAnonymous**
> Rate limit:  PublicTouchPolicy
Used during the multi-staff tip flow to display which payment methods the business has active, so the
customer can choose how to pay.

<!-- Page 50 -->

### `GET /api/v1/public/businesses/{businessId}/payment-methods`
Get all active payment methods for a business (visible to guests).
**Path params:  businessId  — UUID**
**Response  200 :**
```json
[
  {
    "id": "guid",
    "type": "Venmo",
    "accountInfo": "@bitcoin-nail-bar",
    "imageUrl": null
  }
]
```
Only methods where  IsActive = true  and  AccountInfo != null  are returned.
### `GET /api/v1/public/businesses/{businessId}/payment-methods/`
Get a single active payment method detail.
**Path params:  businessId  — UUID,  id  — UUID**
**Response  200 : Single  PublicPaymentMethodDto  (same shape as list item).**
**Response codes:**
Status
ErrorCode
Description
200
—
Found
404
BUSINESS_PAYMENT_METHOD_NOT_FOUND
Not found or inactive

<!-- Page 51 -->

## 11. Owner Dashboard
**Base route:  /api/v1/merchant/dashboard**
**Auth:  [Authorize]**
### `GET /api/v1/merchant/dashboard/overview`
Get aggregate metrics (tips, scans, reviews) for the merchant's business within a date range.
**Query params:**
Param
Type
Required
Default
dateFrom
ISO 8601 datetime
No
30 days ago
dateTo
ISO 8601 datetime
No
Now
**Response  200 :**
```json
{
  "tipsSummary": {
    "totalAmount": 1250.00,
    "totalCount": 48,
    "avgAmount": 26.04,
    "previousPeriodComparison": null
  },
  "scansSummary": {
    "totalPageViews": 312,
    "conversionRate": 0.154
  },
  "reviewsSummary": {
    "totalCount": 35,
    "avgRating": 4.6,
    "count4To5Stars": 28,
    "count1To3Stars": 7,
    "googleClickCount": 18,
    "yelpClickCount": 5
  }
}
```

<!-- Page 52 -->

### `GET /api/v1/merchant/dashboard/reviews`
Get paginated reviews for the merchant's business. Includes both public and private reviews.
**Query params:**
Param
Type
Description
pageNumber
int
Default: 1
pageSize
int
Default: 10, max 50
routingType
string
Filter:  "Public"  |  "Private"  | (all if omitted)
isResolved
bool
Filter resolved/unresolved (for private feedback inbox)
**Response  200 :**
```json
{
  "items": [
    {
      "id": "guid",
      "rating": 2,
      "comment": "Long wait time...",
      "routingType": "Private",
      "staffName": "Linh Nguyen",
      "touchPointName": "Table 1",
      "customerEmail": null,
      "customerName": null,
      "isResolved": false,
      "googleClickedAt": null,
      "yelpClickedAt": null,
      "createdAt": "2026-06-05T10:00:00Z"
    }
  ],
  "totalCount": 7,
  "pageNumber": 1,
  "totalPages": 1,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

<!-- Page 53 -->

> Privacy:  customerEmail  and  customerName  are only present when voluntarily provided by the
customer.
### `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve`
Mark a private review as resolved (feedback addressed).
**Path params:  id  — UUID**
No request body.
**Response:  204 No Content**
### `GET /api/v1/merchant/dashboard/staff`
Get staff metrics for the date range.
**Query params:  dateFrom ,  dateTo  (optional, same as overview)**
**Response  200 :**
```json
[
  {
    "staffProfileId": "guid",
    "displayName": "Linh Nguyen",
    "photoUrl": "https://...",
    "position": "Nail Tech",
    "tipCount": 30,
    "tipTotal": 750.00,
    "avgTip": 25.00,
    "avgRating": 4.9,
    "reviewCount": 12,
    "selectionCount": 95
  }
]
```

<!-- Page 54 -->

### `GET /api/v1/merchant/dashboard/touchpoints`
Get touch point metrics for the date range.
**Query params:  dateFrom ,  dateTo  (optional)**
**Response  200 :**
```json
[
  {
    "touchPointId": "guid",
    "name": "Table 1",
    "type": "Table",
    "scanCount": 150,
    "tipCount": 22,
    "tipTotal": 550.00,
    "ctr": 0.147,
    "avgRating": 4.5
  }
]
```
### `GET /api/v1/merchant/dashboard/tips-chart`
Get time-series tip data for chart visualization within a date range. Returns one data point per day, zero-
filled for days with no confirmed tips.
**Query params:**
Param
Type
Required
Description
DateFrom
ISO 8601
datetime
Yes
Start of date range (inclusive)
DateTo
ISO 8601
datetime
Yes
End of date range (inclusive); server extends to end-
of-day automatically
**Response  200 :**

<!-- Page 55 -->

```json
{
  "data": [
    {
      "date": "2026-06-01",
      "totalAmount": 250.00,
      "tipCount": 10,
      "avgAmount": 25.00
    },
    {
      "date": "2026-06-02",
      "totalAmount": 0,
      "tipCount": 0,
      "avgAmount": 0
    },
    {
      "date": "2026-06-03",
      "totalAmount": 180.00,
      "tipCount": 7,
      "avgAmount": 25.71
    }
  ]
}
```
date  format is  yyyy-MM-dd  (DateOnly). Results are sorted ascending by date.
Only tips with  Status = Confirmed  are counted.
Days with no confirmed tips are included with  totalAmount = 0 ,  tipCount = 0 ,
avgAmount = 0  (zero-fill).
avgAmount = 0  when  tipCount = 0  — no division by zero.
DateTo  is extended to end-of-day server-side — pass the calendar date directly (e.g.,
2026-06-08 ).
**Response codes:**
Status
ErrorCode
Description
200
—
Chart data returned
400
COMMON_VALIDATION_ERROR
DateFrom  or  DateTo  missing, or  DateTo  <  DateFrom
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
COMMON_FORBIDDEN
Forbidden

<!-- Page 56 -->

Status
ErrorCode
Description
404
BUSINESS_NOT_FOUND
No business for this merchant
## 12. Image Upload
⚠ Note: These endpoints are not currently included in the OpenAPI specification
( specification.json ) but are implemented in the API. The documentation below is based on
source code. Verify with Swagger UI if in doubt.
**Base route:  /api/v1/images**
### `POST /api/v1/images/upload`
Upload a single image (authenticated).
**Auth:  [Authorize]**
> Rate limit:  ImageUpload
> Content-Type:  multipart/form-data
**Form fields:**
Field
Type
Required
Constraints
file
file
Yes
PNG/JPEG/WebP; max 10 MB
**Response  200 :**
```json
{
  "fileUrl": "https://storage.nexora.vlinkpay.com/nexora/images/..."
}
```
**Response codes:**

<!-- Page 57 -->

Status
ErrorCode
Description
200
—
Uploaded
400
IMAGE_FILE_REQUIRED
No file provided
400
IMAGE_UNSUPPORTED_FILE_TYPE
Not PNG/JPEG/WebP
400
IMAGE_FILE_SIZE_EXCEEDED
> 10MB
400
IMAGE_UPLOAD_FAILED
S3 upload error
### `POST /api/v1/images/public/upload`
Upload a single image without authentication (used on the staff invite accept page).
**Auth:  AllowAnonymous**
> Rate limit:  PublicImageUpload
Same request/response as  /images/upload .
## 13. Notifications
⚠ Note: These endpoints are not currently included in the OpenAPI specification
( specification.json ) but are implemented in the API. The documentation below is based on
source code. Verify with Swagger UI if in doubt.
**Base route:  /api/v1/notifications**
**Auth:  [Authorize]**
### `GET /api/v1/notifications`
Get paginated notifications for the current user.
**Query params:  pageNumber ,  pageSize**
**Response  200 : Paginated list of notifications.**

<!-- Page 58 -->

### `GET /api/v1/notifications/unread-count`
Get the number of unread notifications.
**Response  200 :**
```json
{
  "count": 3
}
```
### `PUT /api/v1/notifications/{id}/read`
Mark a notification as read.
**Path params:  id  — UUID**
**Response:  200 OK**
### `PUT /api/v1/notifications/read-all`
Mark all notifications as read.
**Response:  200 OK**
## 14. Tip Transaction History (Merchant)
**Base route:  /api/v1/merchant/dashboard/tips**
**Auth:  [Authorize]  — merchant only**
Returns a paginated list of individual tip transactions for the authenticated merchant's business.
Supports multiple filters for searching and reconciliation.

<!-- Page 59 -->

### `GET /api/v1/merchant/dashboard/tips`
**Query params:**
Param
Type
Required
Default
Description
PageNumber
int
No
1
Page number
PageSize
int
No
20
Items per page
DateFrom
ISO 8601
datetime
No
—
Filter from date (inclusive)
DateTo
ISO 8601
datetime
No
—
Filter to end of day (inclusive)
Status
int
No
all
TipStatus  enum:  0 =Initiated,
1 =Confirmed,  2 =Skipped
PaymentMethod
int
No
all
PaymentMethod  enum (see Enums
section)
StaffProfileId
UUID
No
—
Exact staff match (single-staff and
multi-staff tips)
StaffSearch
string
No
—
Free-text search by StaffCode /
DisplayName / Email / Phone. Ignored
when  StaffProfileId  is set
TouchPointId
UUID
No
—
Filter by touch point
IsMultiStaff
bool
No
all
true  = multi-staff only,  false  =
single-staff only
StaffSearch  behavior: Case-insensitive  Contains  match against  StaffCode ,  DisplayName ,
email, and phone number for both single-staff tips (direct staff) and multi-staff tips (any  TipItem
staff).
**Response  200 :**

<!-- Page 60 -->

```json
{
  "items": [
    {
      "id": "guid",
      "amount": 25.00,
      "status": 1,
      "paymentMethod": 1,
      "isMultiStaff": true,
      "touchPointId": "guid",
      "touchPointName": "Table 1",
      "staffProfileId": null,
      "staffName": null,
      "tipItems": [
        { "staffProfileId": "guid-linh", "staffName": "Linh Nguyen", "amount": 15.00 },
        { "staffProfileId": "guid-maria", "staffName": "Maria Garcia", "amount": 10.00 }
      ],
      "createdAt": "2026-06-05T10:00:00Z",
      "confirmedAt": "2026-06-05T10:02:00Z"
    },
    {
      "id": "guid",
      "amount": 20.00,
      "status": 1,
      "paymentMethod": 0,
      "isMultiStaff": false,
      "touchPointId": "guid",
      "touchPointName": "Front Desk",
      "staffProfileId": "guid-linh",
      "staffName": "Linh Nguyen",
      "tipItems": [],
      "createdAt": "2026-06-05T09:00:00Z",
      "confirmedAt": "2026-06-05T09:01:00Z"
    }
  ],
  "totalCount": 48,
  "pageNumber": 1,
  "totalPages": 3
}
```
tipItems  is an empty array for single-staff tips;  staffProfileId / staffName  are  null  for
multi-staff tips.

<!-- Page 61 -->

confirmedAt  is  null  when  status  is  Initiated  or  Skipped .
**Response codes:**
Status
ErrorCode
Description
200
—
Tip list returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
403
USER_NOT_MERCHANT
Caller is not a Merchant profile type
404
BUSINESS_NOT_FOUND
No business exists for this merchant
## 15. Staff Tip History
**Base route:  /api/v1/staff/tips**
**Auth:  [Authorize]  — staff member only**
Returns a paginated list of tips received by the authenticated staff member. For multi-staff tips,  amount
reflects only the staff member's individual portion.
### `GET /api/v1/staff/tips`
**Query params:**
Param
Type
Required
Default
Description
PageNumber
int
No
1
Page number
PageSize
int
No
20
Items per page
DateFrom
ISO 8601
datetime
No
—
Filter from date (inclusive)
DateTo
ISO 8601
datetime
No
—
Filter to end of day (inclusive)

<!-- Page 62 -->

Param
Type
Required
Default
Description
Status
int
No
all
TipStatus  enum:  0 =Initiated,
1 =Confirmed,  2 =Skipped
**Response  200 :**
```json
{
  "items": [
    {
      "id": "guid",
      "amount": 15.00,
      "totalAmount": 25.00,
      "status": 1,
      "paymentMethod": 1,
      "isMultiStaff": true,
      "touchPointName": "Table 1",
      "businessName": "Bitcoin Nail Bar",
      "createdAt": "2026-06-05T10:00:00Z",
      "confirmedAt": "2026-06-05T10:02:00Z"
    },
    {
      "id": "guid",
      "amount": 20.00,
      "totalAmount": 20.00,
      "status": 1,
      "paymentMethod": 0,
      "isMultiStaff": false,
      "touchPointName": "Front Desk",
      "businessName": "Bitcoin Nail Bar",
      "createdAt": "2026-06-05T09:00:00Z",
      "confirmedAt": "2026-06-05T09:01:00Z"
    }
  ],
  "totalCount": 30,
  "pageNumber": 1,
  "totalPages": 2
}
```
For multi-staff tips:  amount  = this staff member's portion (from  TipItem.Amount );  totalAmount
= the full tip the customer paid.
For single-staff tips:  amount  =  totalAmount .

<!-- Page 63 -->

**Response codes:**
Status
ErrorCode
Description
200
—
Tip history returned
401
COMMON_UNAUTHORIZED
Missing or invalid token
404
STAFF_PROFILE_NOT_FOUND
No staff profile linked to this user
## Part 2 — Business Flow Sequences
Each flow below has two representations:
## 1. Sequence diagram — shows all actors and API calls in order
## 2. Step list — exact endpoints, request bodies, and responses

<!-- Page 64 -->

Flow 1: Merchant Registration & Onboarding Wizard

<!-- Page 65 -->

Storage (S3)
SendGrid
Backend API
Frontend
── Onboarding Wizard ──
Step 1 — Business Info
Creates Starter subscription
+ pre-seeds all PayoutMethodTypes
Step 2 — Review Links
Step 3 — Staff (optional)
Step 4 — Touch Points (optional)
Step 5 — Complete
Merchant
Fill signup form
### `POST /api/v1/authentication/signup`
```json
{email, password, type:"Merchant"}
```
201 {isSuccess: true, userId, email, message}
Send verification email
Click verification link
### `POST /api/v1/authentication/verify-email`
```json
{token, email}
```
200
Sign in
### `POST /api/v1/authentication/signin`
```json
{email, password}
```
200 {accessToken, refreshToken}
Type slug
### `GET /api/v1/merchant/business/check-slug?slug=...`
200 {isAvailable, suggestion?}
Upload logo (optional)
### `POST /api/v1/images/upload (multipart)`
Store resized 400×400 image
200 {fileUrl}
### `POST /api/v1/merchant/business`
```json
{name, customSlug?, logoUrl?, ...}
```
201 {businessId, slug}
### `PUT /api/v1/merchant/business/review-links`
```json
{googleReviewUrl?, yelpUrl?, feedbackEmail?}
```
200
### `POST /api/v1/merchant/staff/invite`
```json
{invitedName, invitedEmail}
```
Send magic-link (expires 7 days)
201 {inviteId}
### `POST /api/v1/merchant/touchpoints`
```json
{name:"Table 1", type:"Table"}
```
Upload QR PNG (1000×1000)
201 {touchPointId, qrImageUrl}

<!-- Page 66 -->

Storage (S3)
SendGrid
Backend API
Frontend
Business.IsPublic = true
Profile.Status = Active
### `POST /api/v1/merchant/business/complete-onboarding`
200
Merchant
Step-by-step:

<!-- Page 67 -->

## 1. POST /api/v1/authentication/signup
```json
   { email, password, confirmEmail: email, type: "Merchant", referralCode? }
```
→ 201 { isSuccess: true, userId, email, message }
## 2. POST /api/v1/authentication/verify-email
```json
   { token (from email link), email }
```
→ 200
## 3. POST /api/v1/authentication/signin
```json
   { email, password }
```
→ 200 { accessToken, refreshToken }
── ONBOARDING WIZARD ──
## 4a. GET /api/v1/merchant/business/check-slug?slug=bitcoin-nail-bar
→ 200 { isAvailable: true }          [called on each keystroke]
## 4b. POST /api/v1/images/upload           [optional logo]
FormData: { file: <image> }
→ 200 { fileUrl }
## 4c. POST /api/v1/merchant/business       [Step 1 — Business Info]
```json
    { name, businessType?, address?, city?, state?, phone?,
      timeZone?, description?, logoUrl?, customSlug? }
```
→ 201 { businessId, slug }
## 5.  PUT /api/v1/merchant/business/review-links   [Step 2]
```json
    { googleReviewUrl?, yelpUrl?, facebookUrl?, feedbackEmail? }
```
→ 200
## 6.  POST /api/v1/merchant/staff/invite   [Step 3 — optional]
```json
    { invitedName, invitedEmail, invitedPosition? }
```
→ 201 { inviteId }
## 7.  POST /api/v1/merchant/touchpoints    [Step 4 — optional]
```json
    { name: "Table 1", type: "Table" }
```
→ 201 { touchPointId, qrImageUrl }
## 8.  POST /api/v1/merchant/business/complete-onboarding   [Step 5]
→ 200
(Business is now public; merchant profile → Active)

<!-- Page 68 -->

Flow 2: Invite Staff — New (Luồng A)
SendGrid
Backend API
Staff Frontend
Merchant Frontend
SendGrid
Backend API
Staff Frontend
Merchant Frontend
Staff opens email link
opt
```json
[Upload profile photo]
```
Creates UserProfile + StaffProfile
Pre-seeds 5 payment methods (inactive)
Configure Payment Methods
Staff now visible on touch page
(isProfileComplete = true)
Merchant
Staff
Fill invite form
### `POST /api/v1/merchant/staff/invite`
```json
{invitedName, invitedEmail, invitedPosition?}
```
Send magic-link email (token, 7 days)
201 {inviteId}
"Invite sent to maria@example.com"
Open magic link /invite/{token}
### `GET /api/v1/staff/invite/{token}`
200 {invitedName, invitedPosition, businessName}
Show "Bitcoin Nail Bar invited you" page
Select photo
### `POST /api/v1/images/public/upload (multipart)`
200 {fileUrl}
Fill profile form & submit
### `POST /api/v1/staff/invite/{token}/accept`
```json
{token, displayName, position?, bio?, photoUrl?}
```
204
Sign in
### `POST /api/v1/authentication/signin`
```json
{email, password}
```
200 {accessToken, refreshToken}
### `GET /api/v1/staff/payment-methods`
200 [{id, type:"Zelle", isActive:false, isConfigured:false}, ...]
Enter Zelle phone + optional image
### `PUT /api/v1/staff/payment-methods/{id}`
```json
{accountInfo: "+17131234567", imageUrl: null}
```
200 {id, type:"Zelle", accountInfo, imageUrl, isActive:false, isConfigured:true}
Toggle Zelle ON
### `PATCH /api/v1/staff/payment-methods/{id}/toggle`
200 {isActive: true, isConfigured: true}
Merchant
Staff
Step-by-step:

<!-- Page 69 -->

MERCHANT SIDE
## 1. POST /api/v1/merchant/staff/invite
```json
   { invitedName: "Maria Garcia", invitedEmail: "maria@example.com",
     invitedPosition: "Stylist" }
```
→ 201 { inviteId }
```json
   [API sends magic-link email — expires in 7 days]
```
STAFF SIDE — opens magic link in browser
## 2. GET /api/v1/staff/invite/{token}          (AllowAnonymous)
→ 200 { invitedName, invitedPosition, businessName }
## 3. POST /api/v1/images/public/upload         [optional photo]
FormData: { file: <photo> }
→ 200 { fileUrl }
## 4. POST /api/v1/staff/invite/{token}/accept  (AllowAnonymous)
```json
   { token, displayName, position?, bio?, photoUrl? }
```
→ 204
```json
   [Creates UserProfile + StaffProfile + pre-seeds 5 payment methods, all inactive]
```
## 5. POST /api/v1/authentication/signin
```json
   { email, password }
```
→ 200 { accessToken, refreshToken }
CONFIGURE PAYMENT METHODS
## 6. GET /api/v1/staff/payment-methods
→ 200 [ { id, type: "Zelle", isActive: false, isConfigured: false }, ... ]
## 7. PUT /api/v1/staff/payment-methods/{id}
```json
   { accountInfo: "+17131234567", imageUrl: null }
```
→ 200 { id, type: "Zelle", accountInfo: "+17131234567", imageUrl: null,
isActive: false, isConfigured: true }
## 8. PATCH /api/v1/staff/payment-methods/{id}/toggle
→ 200 { isActive: true, isConfigured: true }
```json
   [Staff is now visible on the customer touch page]
```

<!-- Page 70 -->

Flow 3: Link Existing Staff (Luồng B)
Backend API
Staff Frontend
Merchant Frontend
Backend API
Staff Frontend
Merchant Frontend
BusinessStaffLink created
Status = Pending
Staff receives notification
BusinessStaffLink.Status → Active
Staff appears on touch page
Merchant
Staff
Search by phone or email
### `GET /api/v1/merchant/staff/search?q=+1713...`
200 [{staffProfileId, displayName, position}]
Show matching staff profile
Click "Send Link Request"
### `POST /api/v1/merchant/staff/link-request/{staffProfileId}`
204
View link request notification
```json
[Accept action — notification flow]
```
204
Merchant
Staff
Step-by-step:
MERCHANT SIDE
## 1. GET /api/v1/merchant/staff/search?q=+17131234567
→ 200 [ { staffProfileId, displayName, position } ]
## 2. POST /api/v1/merchant/staff/link-request/{staffProfileId}
→ 204
```json
   [Staff receives in-app notification to accept]
```
STAFF SIDE
## 3. Staff accepts link request via notification
→ BusinessStaffLink.Status → Active
```json
   [Staff becomes visible on touch page]
```

<!-- Page 71 -->

Flow 4: Customer Touch Flow (Single-Staff)
Payment App
(CashApp/Venmo/etc.)
Backend API
Browser
Payment App
(CashApp/Venmo/etc.)
Backend API
Browser
Tip.Status = Initiated
Analytics: TipInitiated logged
Tip.Status = Confirmed
rating≥4 → RoutingType=Public
rating≤3 → RoutingType=Private
(email sent to merchant)
Merchant receives email
within 5 minutes
alt
```json
[rating >= 4 (Public)]
```
```json
[rating <= 3 (Private)]
```
Customer
Scan QR code
### `GET /api/v1/touch/{businessSlug}/{touchPointSlug}`
?sessionId={uuid}
200 {business, touchPoint, staff:[{id, displayName, availablePaymentMethods}]}
Display touch page
Select staff + enter tip amount + choose payment method
### `GET /api/v1/touch/payment-link`
?staffId={guid}&method=0&amount=20.00
200 {redirectUrl:"https://cash.app/$linh/20.00"}
### `POST /api/v1/touch/tip`
```json
{touchPointId, staffProfileId, amount:20.00, paymentMethod:0, sessionId}
```
201 {tipId}
Open redirectUrl (deep link)
Complete payment ($20 to staff)
Return via back button
Tap "Yes, I paid"
### `POST /api/v1/touch/tip/{tipId}/confirm`
200
Submit review (rating 1–5)
### `POST /api/v1/touch/review`
```json
{touchPointId, tipId, staffProfileId, rating:5, comment?}
```
201 {reviewId}
Tap "Leave Google Review"
### `POST /api/v1/touch/review/{reviewId}/track-google`
200
Open Google Maps review URL
Show "Thank you for your feedback"
Customer
Step-by-step:

<!-- Page 72 -->

```json
[Customer scans QR code — browser opens touch page]
```
## 1. GET /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
→ 200 { business, touchPoint, staff: [{ id, displayName, availablePaymentMethods }] }
## 2. [Customer selects staff member and tip amount]
## 3. GET /api/v1/touch/payment-link?staffId={guid}&method=0&amount=20.00
→ 200 { redirectUrl: "https://cash.app/$linh/20.00" }
```json
   [Frontend opens redirectUrl in same tab]
```
## 4. POST /api/v1/touch/tip
```json
   { touchPointId, staffProfileId, amount: 20.00, paymentMethod: 0, sessionId }
```
→ 201 { tipId }                       [Tip.Status = Initiated]
## 5. [Customer pays in CashApp/Venmo/etc., taps back to return]
## 6. POST /api/v1/touch/tip/{tipId}/confirm
→ 200                                 [Tip.Status = Confirmed]
## 7. POST /api/v1/touch/review
```json
   { touchPointId, tipId, staffProfileId, rating: 5, comment?: "Amazing!" }
```
→ 201 { reviewId }
## 8a. [rating >= 4] POST /api/v1/touch/review/{reviewId}/track-google
→ 200   [customer clicked Google review button]
## 8b. [rating <= 3] Private feedback stored; email sent to merchant <5 min

<!-- Page 73 -->

Flow 4M: Customer Touch Flow (Multi-Staff)
Payment App
(Business Account)
Backend API
Browser
Payment App
(Business Account)
Backend API
Browser
Tip.IsMultiStaff = true
TipItems created per staff
Tip.Status = Initiated
Tip.Status = Confirmed
Customer
Scan QR code
### `GET /api/v1/touch/{businessSlug}/{touchPointSlug}`
?sessionId={uuid}
200 {business, touchPoint, staff:[...]}
Display touch page with staff list
Select multiple staff + amounts
(Linh: $15, Maria: $10)
### `GET /api/v1/public/businesses/{businessId}/payment-methods`
200 [{id, type:"Venmo", accountInfo:"@bitcoin-nail-bar"}]
Show available business payment methods
Choose Venmo, tap "Pay $25"
### `POST /api/v1/tips/multi-staff`
```json
{businessId, touchPointId,
businessPaymentMethodId,
tipItems:[{staffProfileId, amount},...]}
```
201 {tipId, totalAmount:25.00, paymentMethodType:"Venmo", tipItems:[...]}
Show "Send $25 to @bitcoin-nail-bar via Venmo"
Open Venmo, pay $25 to business
Return via back button
Tap "Yes, I paid"
### `PATCH /api/v1/tips/{tipId}/confirm`
200
Submit review
### `POST /api/v1/touch/review`
```json
{touchPointId, tipId, rating:5, comment?}
```
201 {reviewId}
Customer
Step-by-step:

<!-- Page 74 -->

```json
[Customer scans QR code — browser opens touch page]
```
## 1. GET /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
→ 200 { business, touchPoint, staff: [...] }
## 2. [Customer selects 2+ staff and allocates amounts]
## 3. GET /api/v1/public/businesses/{businessId}/payment-methods
→ 200 [ { id, type: "Venmo", accountInfo: "@bitcoin-nail-bar" } ]
## 4. POST /api/v1/tips/multi-staff
```json
   {
     businessId,
     touchPointId,
     businessPaymentMethodId: "guid",
     tipItems: [
       { staffProfileId: "guid-linh", amount: 15.00 },
       { staffProfileId: "guid-maria", amount: 10.00 }
     ]
   }
```
→ 201 { tipId, totalAmount: 25.00, paymentMethodType: "Venmo", tipItems: [...] }
## 5. [Frontend shows "Pay $25 to @bitcoin-nail-bar via Venmo"]
```json
   [Customer pays in Venmo, returns via back button]
```
## 6. PATCH /api/v1/tips/{tipId}/confirm
→ 200                                 [Tip.Status = Confirmed]
## 7. POST /api/v1/touch/review
```json
   { touchPointId, tipId, rating: 5, comment?: "Both were great!" }
```
→ 201 { reviewId }

<!-- Page 75 -->

Flow 4b: Customer Skip Tip — Review Only
Backend API
Browser
Backend API
Browser
Tip.Status = Skipped
Recorded for analytics
rating≥4 → Public routing
rating≤3 → Private routing
Customer
Scan QR code
### `GET /api/v1/touch/{businessSlug}/{touchPointSlug}`
?sessionId={uuid}
200 {business, touchPoint, staff:[...]}
Display touch page
Tap "Skip Tip"
### `POST /api/v1/touch/tip/skip`
```json
{touchPointId, staffProfileId?, sessionId}
```
201
Submit review
### `POST /api/v1/touch/review`
```json
{touchPointId, rating:4, comment?}
```
201 {reviewId}
Customer
Step-by-step:
## 1. GET /api/v1/touch/{businessSlug}/{touchPointSlug}?sessionId={uuid}
→ 200 { ... }
## 2. POST /api/v1/touch/tip/skip
```json
   { touchPointId, staffProfileId?, sessionId }
```
→ 201                                 [Tip.Status = Skipped]
## 3. POST /api/v1/touch/review
```json
   { touchPointId, rating: 4, comment?: "Great service!" }
```
→ 201 { reviewId }

<!-- Page 76 -->

Flow 5: Payment Method Management
Backend API
Merchant Frontend
Staff Frontend
Backend API
Merchant Frontend
Staff Frontend
── Staff configures own payment methods ──
Staff visible on touch page
(isProfileComplete = true)
── Merchant configures business payment methods ──
(used for multi-staff tip flow)
Business method available
for multi-staff tips
Staff
Merchant
Open payment settings
### `GET /api/v1/staff/payment-methods`
200 [{type:"Zelle", isActive:false, isConfigured:false}, ...]
Enter Zelle phone + optional image
### `PUT /api/v1/staff/payment-methods/{id}`
```json
{accountInfo:"+17131234567", imageUrl:null}
```
200 {id, type, accountInfo, imageUrl, isActive:false, isConfigured:true}
Enable Zelle
### `PATCH /api/v1/staff/payment-methods/{id}/toggle`
200 {isActive:true, isConfigured:true}
Open business payment settings
### `GET /api/v1/merchant/payment-methods`
200 [{type:"Venmo", isActive:false, isConfigured:false}, ...]
Enter Venmo handle
### `PUT /api/v1/merchant/payment-methods/{id}`
```json
{accountInfo:"@bitcoin-nail-bar"}
```
200 {isConfigured:true}
Enable Venmo
### `PATCH /api/v1/merchant/payment-methods/{id}/toggle`
200 {isActive:true}
Staff
Merchant
Step-by-step:

<!-- Page 77 -->

STAFF — Configure own payment methods
## 1. GET /api/v1/staff/payment-methods
→ 200 [ { id, type: "Zelle", isActive: false, isConfigured: false }, ... ]
## 2. PUT /api/v1/staff/payment-methods/{id}
```json
   { accountInfo: "+17131234567", imageUrl: null }
```
→ 200 { id, type: "Zelle", accountInfo: "+17131234567", imageUrl: null,
isActive: false, isConfigured: true }
## 3. PATCH /api/v1/staff/payment-methods/{id}/toggle
→ 200 { isActive: true }
MERCHANT — Configure business payment methods (for multi-staff tips)
## 4. GET /api/v1/merchant/payment-methods
→ 200 [ { id, type: "Venmo", isActive: false, isConfigured: false }, ... ]
## 5. PUT /api/v1/merchant/payment-methods/{id}
```json
   { accountInfo: "@bitcoin-nail-bar" }
```
→ 200 { isConfigured: true }
## 6. PATCH /api/v1/merchant/payment-methods/{id}/toggle
→ 200 { isActive: true }

<!-- Page 78 -->

Flow 6: Dashboard Management
Backend API
Frontend
Backend API
Frontend
Merchant
Open dashboard (select date range)
### `GET /api/v1/merchant/dashboard/overview`
?dateFrom=2026-06-01&dateTo=2026-06-05
200 {tipsSummary:{totalAmount, avgAmount}, scansSummary:{totalPageViews}, reviewsSummary:{avgRating}}
View Staff tab
### `GET /api/v1/merchant/dashboard/staff`
?dateFrom=...&dateTo=...
200 [{displayName, tipCount, tipTotal, avgRating}]
View Touch Points tab
### `GET /api/v1/merchant/dashboard/touchpoints`
200 [{name, scanCount, tipCount, ctr, avgRating}]
View Reviews (Private, unresolved)
### `GET /api/v1/merchant/dashboard/reviews`
?routingType=Private&isResolved=false
200 {items:[{rating, comment, customerEmail?}]}
Mark review as resolved
### `PUT /api/v1/merchant/dashboard/reviews/{id}/resolve`
204
Merchant
Step-by-step:
## 1. GET /api/v1/merchant/dashboard/overview?dateFrom=2026-06-01&dateTo=2026-06-05
→ 200 { tipsSummary: { totalAmount, avgAmount }, scansSummary: { totalPageViews, conve
reviewsSummary: { totalCount, avgRating, ... } }
## 2. GET /api/v1/merchant/dashboard/staff?dateFrom=...&dateTo=...
→ 200 [ { displayName, tipCount, tipTotal, avgRating, selectionCount } ]
## 3. GET /api/v1/merchant/dashboard/touchpoints?dateFrom=...&dateTo=...
→ 200 [ { name, scanCount, tipCount, ctr, avgRating } ]
## 4. GET /api/v1/merchant/dashboard/reviews?routingType=Private&isResolved=false
→ 200 { items: [ { rating, comment, customerEmail? } ] }
## 5. PUT /api/v1/merchant/dashboard/reviews/{id}/resolve
→ 204

<!-- Page 79 -->

Flow 8: Tip Transaction History
Staff Frontend
Backend API
Frontend
Staff Frontend
Backend API
Frontend
── Staff views own tip history ──
Merchant
Staff
Open "Transactions" tab (select date range)
### `GET /api/v1/merchant/dashboard/tips`
?DateFrom=2026-06-01&DateTo=2026-06-05&Status=1&PageNumber=1
200 { items:[...], totalCount:48, pageNumber:1, totalPages:3 }
Display tip list
Search by staff name/code
### `GET /api/v1/merchant/dashboard/tips`
?StaffSearch=linh&PageNumber=1
200 { items:[tips where StaffSearch matches], totalCount:12 }
Display filtered tips
Filter by payment method (CashApp)
### `GET /api/v1/merchant/dashboard/tips`
?PaymentMethod=0&PageNumber=1
200 { items:[CashApp tips], totalCount:8 }
Open "My Tips" page
### `GET /api/v1/staff/tips?Status=1&PageNumber=1`
200 { items:[...], totalCount:30 }
Display tip history with per-tip amounts
Merchant
Staff
Step-by-step:

<!-- Page 80 -->

MERCHANT — View tip transactions
## 1. GET /api/v1/merchant/dashboard/tips
?DateFrom=2026-06-01&DateTo=2026-06-05&Status=1&PageNumber=1&PageSize=20
→ 200 { items: [...], totalCount: 48, pageNumber: 1, totalPages: 3 }
## 2. [Merchant filters by staff name]
### `GET /api/v1/merchant/dashboard/tips?StaffSearch=linh&PageNumber=1`
→ 200 { items: [tips containing "linh" in DisplayName, StaffCode, Email, or Phone], ..
## 3. [Merchant filters by exact staff ID]
### `GET /api/v1/merchant/dashboard/tips?StaffProfileId={guid}&PageNumber=1`
→ 200 { items: [all tips — single and multi-staff — for that staff], ... }
## 4. [Merchant filters multi-staff tips only]
### `GET /api/v1/merchant/dashboard/tips?IsMultiStaff=true&PageNumber=1`
→ 200 { items: [multi-staff tips with populated tipItems array], ... }
STAFF — View own tip history
## 5. GET /api/v1/staff/tips?Status=1&PageNumber=1
→ 200 { items: [...], totalCount: 30 }
```json
   [Multi-staff tips show amount = staff's portion, totalAmount = full tip]
```

<!-- Page 81 -->

Flow 7: Auto Refresh Token

<!-- Page 82 -->

Backend API
Frontend
Backend API
Frontend
alt
```json
[refreshToken still valid]
```
```json
[refreshToken expired]
```
Any protected request (access token expired)
401 COMMON_UNAUTHORIZED
Read refreshToken from storage
### `POST /api/v1/authentication/refresh-token`
```json
{refreshToken}
```
200 {accessToken, refreshToken}
Store new accessToken + refreshToken
Retry original request (with new accessToken)
200 (original response)
401 USER_INVALID_REFRESH_TOKEN
Clear stored tokens
Redirect to /signin
Step-by-step:

<!-- Page 83 -->

```json
[Access token expires — 401 received from any protected endpoint]
```
## 1. POST /api/v1/authentication/refresh-token
```json
   { refreshToken: "<stored>" }
```
→ 200 { accessToken: "newToken", refreshToken: "newRefresh" }
## 2. Store new tokens; retry original request with new accessToken.
```json
[If refreshToken is also expired]
```
→ 401 USER_INVALID_REFRESH_TOKEN
→ Clear tokens; redirect to /signin
## Part 3 — Enums Reference
PaymentMethod (customer → staff payment method)
Used in  POST /api/v1/touch/tip  and  GET /api/v1/touch/payment-link .
Value
Name
Description
0
CashApp
Cash App  $cashtag
1
Venmo
Venmo handle
2
Zelle
Zelle (phone or email, no redirect)
3
PayPal
PayPal.me link
4
Other
Skipped tip (internal only)
5
AppleCash
Apple Cash (phone, no redirect)
PayoutMethodType (staff/business payment method
type)
Used in  StaffPaymentMethodDto.Type  and  BusinessPaymentMethodDto.Type .

<!-- Page 84 -->

Value
Name
1
Zelle
2
BankWire
3
PayPal
4
Venmo
5
CashApp
6
AppleCash
7
VlinkPay
TouchPointType
Value
Name
Description
0
Table
Shows all active staff
1
FrontDesk
Shows all active staff
2
Receipt
Shows all active staff
3
StaffCard
Shows only the assigned staff member
TipStatus
Value
Name
Description
0
Initiated
Customer clicked Pay; payment not confirmed
1
Confirmed
Customer confirmed payment
2
Skipped
Customer chose to skip tip

<!-- Page 85 -->

ReviewRoutingType
Value
Name
Threshold
0
Public
Rating 4–5 → show Google/Yelp buttons
1
Private
Rating 1–3 → collect private feedback + email merchant
2
Skipped
Customer skipped review
BusinessStaffLinkStatus
Value
Name
Description
0
Pending
Invite sent, not yet accepted
1
Active
Staff linked and visible on touch page
2
Inactive
Hidden from touch page, data preserved
3
Rejected
Staff declined the link request
StaffInviteStatus
Value
Name
0
Pending
1
Accepted
2
Expired
3
Cancelled
## Part 4 — Standard Error Response Format
All 4xx and 5xx responses follow this shape:

<!-- Page 86 -->

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "Bad Request",
  "status": 400,
  "errors": {
    "amount": ["TIP_AMOUNT_TOO_LOW"]
  },
  "errorCode": "COMMON_VALIDATION_ERROR"
}
```
Single-error response (e.g., 404):
```json
{
  "type": "...",
  "title": "Not Found",
  "status": 404,
  "errorCode": "BUSINESS_NOT_FOUND"
}
```
Validation error (FluentValidation):
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
Rate limit exceeded (429):
```json
{
  "status": 429,
  "errorCode": "COMMON_RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}
```

<!-- Page 87 -->

Common Error Codes
Code
HTTP Status
When
COMMON_VALIDATION_ERROR
400
FluentValidation failure
COMMON_NOT_FOUND
404
Generic not found
COMMON_UNAUTHORIZED
401
No/invalid token
COMMON_FORBIDDEN
403
Authorized but not permitted
COMMON_RATE_LIMIT_EXCEEDED
429
Rate limit hit
COMMON_INTERNAL_SERVER_ERROR
500
Unexpected server error
