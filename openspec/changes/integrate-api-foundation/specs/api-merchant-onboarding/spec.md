## ADDED Requirements

### Requirement: Slug Availability Check
In `api` mode, the onboarding wizard SHALL call `GET /api/v1/merchant/business/check-slug` to validate slug availability in real time.

#### Scenario: Available slug
- **WHEN** `useCheckSlug(slug)` is called with a slug that is not taken
- **THEN** the hook SHALL resolve with `{ isAvailable: true, suggestion: null }`

#### Scenario: Unavailable slug with suggestion
- **WHEN** `useCheckSlug(slug)` is called with a slug that is already taken
- **THEN** the hook SHALL resolve with `{ isAvailable: false, suggestion: "bitcoin-nail-bar-2" }` (or equivalent server suggestion)

### Requirement: Business Creation (Onboarding Step 1)
In `api` mode, the onboarding wizard step 1 SHALL call `POST /api/v1/merchant/business` to create the merchant's business profile. This automatically creates a Starter subscription with a 30-day trial.

#### Scenario: Successful business creation
- **WHEN** `useCreateBusiness(dto)` is called with valid `{ name, businessType?, address?, city?, state?, phone?, timeZone?, description?, logoUrl?, customSlug? }`
- **THEN** the hook SHALL call `POST /api/v1/merchant/business`, resolve with `{ businessId, slug }`, and invalidate the `merchantSetup` query

#### Scenario: Business already exists
- **WHEN** the create-business endpoint returns 400 with `errorCode: "BUSINESS_ALREADY_EXISTS"`
- **THEN** the hook SHALL reject with the error; the wizard SHALL not advance and SHALL display an appropriate message

#### Scenario: Invalid slug format
- **WHEN** the create-business endpoint returns 400 with `errorCode: "BUSINESS_INVALID_SLUG_FORMAT"`
- **THEN** the hook SHALL reject with the error so the slug field can display the validation message

#### Scenario: Missing business name
- **WHEN** the create-business endpoint returns 400 with `errorCode: "BUSINESS_NAME_REQUIRED"`
- **THEN** the hook SHALL reject with the field-level error so the name field can display the validation message

#### Scenario: Non-merchant caller
- **WHEN** the create-business endpoint returns 403 with `errorCode: "USER_NOT_MERCHANT"`
- **THEN** the hook SHALL reject with the error; the UI SHALL display an "account type mismatch" message and redirect the user to the sign-in screen

### Requirement: Logo Upload
In `api` mode, the onboarding wizard SHALL upload the business logo to `PUT /api/v1/merchant/business/logo` using `multipart/form-data` with field name `logo` and receive a CDN URL in response.

#### Scenario: Successful logo upload
- **WHEN** `useUploadLogo(file)` is called with a valid PNG/JPEG/WebP file
- **THEN** the hook SHALL send the file as `multipart/form-data` (field name: `logo`) via `PUT /api/v1/merchant/business/logo` using `httpClient.upload(path, formData, 'PUT')` and resolve with `{ logoUrl: "https://storage.nexora..." }`

#### Scenario: Oversized file
- **WHEN** the logo upload endpoint returns 400 with `errorCode: "IMAGE_FILE_SIZE_EXCEEDED"`
- **THEN** the hook SHALL reject with the error so the UI can display the file size limit message

#### Scenario: Unsupported file type
- **WHEN** the logo upload endpoint returns 400 with `errorCode: "IMAGE_UNSUPPORTED_FILE_TYPE"`
- **THEN** the hook SHALL reject with the error so the UI can inform the user of the accepted file types

#### Scenario: S3 upload failure
- **WHEN** the logo upload endpoint returns 400 with `errorCode: "BUSINESS_LOGO_UPLOAD_FAILED"`
- **THEN** the hook SHALL reject with the error so the UI can display a user-facing upload failure message

### Requirement: Review Links Update (Onboarding Step 2)
In `api` mode, the onboarding wizard step 2 SHALL call `PUT /api/v1/merchant/business/review-links` to save external platform review URLs.

#### Scenario: Successful review links save
- **WHEN** `useUpdateReviewLinks({ googleReviewUrl?, yelpUrl?, facebookUrl?, feedbackEmail? })` is called
- **THEN** the hook SHALL call `PUT /api/v1/merchant/business/review-links` and resolve on `200 OK`; no body is returned

### Requirement: Onboarding Completion (Onboarding Step 5)
In `api` mode, the onboarding wizard final step SHALL call `POST /api/v1/merchant/business/complete-onboarding`, which sets the business public and activates the merchant profile.

#### Scenario: Successful completion
- **WHEN** `useCompleteOnboarding()` is called after all prior steps are done
- **THEN** the hook SHALL call `POST /api/v1/merchant/business/complete-onboarding`, resolve on `200 OK`, invalidate the `merchantSetup` query, and the app SHALL transition the merchant to the dashboard view

### Requirement: Business Profile Read
In `api` mode, `getSetup()` in the merchants repository SHALL call `GET /api/v1/merchant/business` and return a domain shape compatible with what hooks/components already expect.

#### Scenario: Business found
- **WHEN** `merchantsRepository.getSetup()` is called in api mode and the merchant has a business
- **THEN** the repository SHALL call `GET /api/v1/merchant/business` and return the response mapped to the existing setup blob shape (with `staffList: []` and `touchPoints: []` until those domains are integrated)

#### Scenario: No business yet (404)
- **WHEN** `GET /api/v1/merchant/business` returns 404 with `errorCode: "BUSINESS_NOT_FOUND"`
- **THEN** `merchantsRepository.getSetup()` SHALL resolve with `null` (same as empty storage)

### Requirement: Onboarding Mode-Awareness (Storage Regression Guard)
In `storage` mode, all onboarding wizard steps SHALL continue to use the existing blob-save approach unchanged.

#### Scenario: Storage mode unchanged
- **WHEN** `VITE_DATA_SOURCE=storage` and the user completes onboarding steps
- **THEN** the wizard SHALL call the existing storage-backed hooks without any api calls; no `httpClient` calls SHALL be made
