
# Sheet: QC Test Cases

| NEXORA TOUCH by VLINKPAY — QC Test Case Spreadsheet |  |  |  |  |  |  |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| QR-first + NFC-optional Smart Tip & Review Platform |  |  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |  |  |
| Test ID | Module | Priority | User Role | Scenario | Preconditions | Test Steps | Expected Result | Actual Result | Status | Severity | Notes / Owner |
| NT-QC-001 | Merchant Onboarding | High | Merchant Owner | Create new business profile | Merchant account exists | Login > Setup Wizard > enter business name, type, address, phone, website > Save | Business profile is created and visible in dashboard |  | Not Started | Major |  |
| NT-QC-002 | Merchant Onboarding | High | Merchant Owner | Upload business logo | Business profile exists | Open Business Info > upload PNG/JPG logo > Save | Logo uploads successfully and appears on customer Touch Page |  | Not Started | Major |  |
| NT-QC-003 | Merchant Onboarding | High | Merchant Owner | Add Google/Yelp review links | Business profile exists | Open Review Links > add Google and Yelp URL > Save | Links are saved and used in 4–5 star review routing |  | Not Started | Major |  |
| NT-QC-004 | Staff Management | High | Merchant Owner | Create staff profile | Business profile exists | Go to Staff > Add Staff > enter name, role, photo, payment methods > Save | Staff appears active in staff list and customer selection screen |  | Not Started | Major |  |
| NT-QC-005 | Staff Management | Medium | Merchant Owner | Disable staff profile | At least one staff exists | Go to Staff > select staff > set inactive > Save | Inactive staff is hidden from customer flow but remains in dashboard history |  | Not Started | Minor |  |
| NT-QC-006 | Staff Payment Methods | High | Staff / Merchant | Add Cash App payment method | Staff profile exists | Open staff payment methods > add Cash App handle > Save | Cash App method appears in customer payment options for selected staff |  | Not Started | Major |  |
| NT-QC-007 | Staff Payment Methods | High | Staff / Merchant | Add Venmo payment method | Staff profile exists | Open staff payment methods > add Venmo handle > Save | Venmo method appears in customer payment options for selected staff |  | Not Started | Major |  |
| NT-QC-008 | Staff Payment Methods | High | Staff / Merchant | Add Zelle payment method | Staff profile exists | Open staff payment methods > add Zelle phone/email > Save | Zelle method appears with copy instruction or redirect behavior |  | Not Started | Major |  |
| NT-QC-009 | QR Generator | Critical | Merchant Owner | Generate table QR code | Business profile exists | Go to Touch Points > Add > Table QR > name Table 01 > Generate | Unique QR and URL are created with touch_point_id |  | Not Started | Critical |  |
| NT-QC-010 | QR Generator | Critical | Customer | Scan QR opens correct Touch Page | Table QR exists | Scan QR using mobile camera | Touch Page opens correct business and touch point |  | Not Started | Critical |  |
| NT-QC-011 | QR Generator | High | Merchant Owner | Generate front desk QR | Business profile exists | Go to Touch Points > Add > Front Desk QR > Generate | Front desk QR is created and tracked separately from table QR |  | Not Started | Major |  |
| NT-QC-012 | QR Generator | High | Merchant Owner | Generate receipt QR | Business profile exists | Go to Touch Points > Add > Receipt QR > Generate | Receipt QR is created and can be downloaded for print |  | Not Started | Major |  |
| NT-QC-013 | NFC Optional | Medium | Merchant Owner | Assign NFC UID to touch point | Touch point exists; NFC UID available | Open Touch Point > Assign NFC UID > Save | NFC UID maps to same URL as QR touch point |  | Not Started | Major |  |
| NT-QC-014 | NFC Optional | Medium | Customer | Tap NFC opens same Touch Page | NFC UID assigned | Tap phone on NFC tag | Same Touch Page opens and event source records NFC |  | Not Started | Major |  |
| NT-QC-015 | Customer Flow | Critical | Customer | Customer selects staff | Touch Page opens with active staff | Scan QR > choose staff from list | Selected staff persists to tip screen |  | Not Started | Critical |  |
| NT-QC-016 | Customer Flow | Critical | Customer | Customer selects preset tip amount | Staff selected | Choose $5/$10/$15/$20 preset amount | Tip amount is highlighted and stored in session |  | Not Started | Critical |  |
| NT-QC-017 | Customer Flow | High | Customer | Customer enters custom tip amount | Staff selected | Enter custom amount > Continue | Custom amount validates and stores correctly |  | Not Started | Major |  |
| NT-QC-018 | Customer Flow | High | Customer | Reject invalid tip amount | Staff selected | Enter negative amount, 0, or non-numeric value | System blocks invalid input and shows clear error message |  | Not Started | Major |  |
| NT-QC-019 | Payment Redirect | Critical | Customer | Select Cash App payment | Staff has Cash App | Choose Cash App > Continue | Cash App redirect or instruction opens correctly |  | Not Started | Critical |  |
| NT-QC-020 | Payment Redirect | Critical | Customer | Select Venmo payment | Staff has Venmo | Choose Venmo > Continue | Venmo redirect or instruction opens correctly |  | Not Started | Critical |  |
| NT-QC-021 | Payment Redirect | Critical | Customer | Select Zelle payment | Staff has Zelle | Choose Zelle > Continue | Zelle phone/email display with copy button or instruction |  | Not Started | Critical |  |
| NT-QC-022 | Tip Tracking | High | System | Create tip session record | Customer selected staff and amount | Proceed to payment selection | Tip session is created with business_id, staff_id, touch_point_id, amount |  | Not Started | Major |  |
| NT-QC-023 | Tip Tracking | High | Customer | Confirm tip success screen | Tip session exists | Complete/confirm payment action | Thank You screen shows correct staff and amount |  | Not Started | Major |  |
| NT-QC-024 | Review Flow | Critical | Customer | Submit 5-star review | Tip success page displayed | Select 5 stars > enter comment > Submit | System shows Google/Yelp review buttons |  | Not Started | Critical |  |
| NT-QC-025 | Review Flow | Critical | Customer | Submit 1-star private feedback | Tip success page displayed | Select 1 star > submit feedback | System stores private feedback and does not show public review redirect |  | Not Started | Critical |  |
| NT-QC-026 | Review Links | High | Customer | Google review redirect | Business has Google review URL | Submit 5-star review > click Google | Google review page opens in new tab/window |  | Not Started | Major |  |
| NT-QC-027 | Review Links | High | Customer | Yelp review redirect | Business has Yelp review URL | Submit 5-star review > click Yelp | Yelp review page opens in new tab/window |  | Not Started | Major |  |
| NT-QC-028 | Dashboard | High | Merchant Owner | Dashboard overview loads metrics | Merchant has activity | Open Dashboard Overview | Total tips, transactions, average tip, reviews display correctly |  | Not Started | Major |  |
| NT-QC-029 | Dashboard | High | Merchant Owner | Filter dashboard by date range | Merchant has activity in multiple days | Choose date range in dashboard | All metrics refresh based on selected range |  | Not Started | Major |  |
| NT-QC-030 | Analytics Events | High | System | Track QR scan event | QR exists | Scan QR | analytics_events row is created with event_type='qr_scan' |  | Not Started | Major |  |
| NT-QC-031 | Analytics Events | High | System | Track NFC tap event | NFC assigned | Tap NFC | analytics_events row is created with event_type='nfc_tap' |  | Not Started | Major |  |
| NT-QC-032 | Permissions | Critical | Merchant Owner | Merchant cannot access another merchant dashboard | Two merchant accounts exist | Login as Merchant A > try Merchant B URL | Access is denied |  | Not Started | Critical |  |
| NT-QC-033 | Permissions | Critical | Staff | Staff cannot edit other staff payment methods | Two staff profiles exist | Login as Staff A > attempt Staff B edit URL | Access is denied |  | Not Started | Critical |  |
| NT-QC-034 | Admin | High | VLINKPAY Admin | Admin can view merchant list | Admin account exists | Login Admin > Merchants | Merchant list loads with plan/status |  | Not Started | Major |  |
| NT-QC-035 | Subscription | Medium | Merchant Owner | Select Starter QR plan | Merchant onboarding in progress | Select Starter plan | Plan is saved as QR-only |  | Not Started | Minor |  |
| NT-QC-036 | Subscription | Medium | Merchant Owner | Select Premium NFC plan | Merchant onboarding in progress | Select Premium plan | Plan enables NFC order/assignment module |  | Not Started | Minor |  |
| NT-QC-037 | Print Assets | High | Merchant Owner | Download QR PNG | QR touch point exists | Click Download PNG | PNG downloads and scans correctly |  | Not Started | Major |  |
| NT-QC-038 | Print Assets | High | Merchant Owner | Download table stand PDF | QR touch point exists | Click Download PDF | PDF downloads with business logo, QR, instruction text |  | Not Started | Major |  |
| NT-QC-039 | Mobile Responsive | High | Customer | Customer flow works on iPhone screen | Mobile device/browser | Scan QR and complete flow | All screens are usable without horizontal scrolling |  | Not Started | Major |  |
| NT-QC-040 | Mobile Responsive | High | Customer | Customer flow works on Android screen | Android browser | Scan QR and complete flow | All screens are usable and QR/NFC link opens correctly |  | Not Started | Major |  |
| NT-QC-041 | Error Handling | High | Customer | Invalid touch point URL | Use random/expired URL | Open URL | System shows friendly error or inactive touch point message |  | Not Started | Major |  |
| NT-QC-042 | Error Handling | High | Customer | Business has no active staff | Business exists but no active staff | Open Touch Page | System shows friendly message and merchant contact option |  | Not Started | Major |  |
| NT-QC-043 | Security | Critical | System | Rate limit repeated review submissions | Same device submits many reviews | Submit review repeatedly in short time | System limits abuse and logs suspicious activity |  | Not Started | Critical |  |
| NT-QC-044 | Performance | High | System | Touch Page loads quickly | Public URL exists | Open Touch Page on mobile network | Page loads under acceptable target and key UI is visible quickly |  | Not Started | Major |  |



# Sheet: Summary

| NEXORA TOUCH QC Summary |  |  |  |  |  |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
| Total Test Cases | 44 |  |  |  |  |
| Critical | 12 |  |  |  |  |
| Major | 29 |  |  |  |  |
| Minor | 3 |  |  |  |  |
| Core MVP Coverage | Merchant, Staff, QR, NFC, Tip, Review, Dashboard, Admin |  |  |  |  |
| Recommended First QA Cycle | NT-QC-001 to NT-QC-030 |  |  |  |  |



# Sheet: Test Data

| Sample Test Data |  |
| --- | --- |
|  |  |
| Business Name | Bitcoin Nail Bar |
| Business Type | Nail Salon |
| Touch Point | table-01 |
| Staff 1 | Anna / Nail Technician / Cash App $annanais / Venmo @annanais / Zelle (714) 555-1234 |
| Staff 2 | Lisa / Nail Technician / Cash App $lisanails / Venmo @lisanails / Zelle (714) 555-2345 |
| Google Review URL | https://example.com/google-review |
| Yelp Review URL | https://example.com/yelp-review |
| Public Touch URL | https://nexora.vlinkpay.com/touch/bitcoin-nail-bar/table-01 |

