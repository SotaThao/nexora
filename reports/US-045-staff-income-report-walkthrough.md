# US-045 · Staff Income Report — Walkthrough

## Result

Status: **Integrated; authenticated staging payload verification pending**.

The Staff Report route now reads `summary` and the deployed object-shaped `sources` from `GET /api/v1/staff/reports/income`, supports All/Business/Independent and Daily/Weekly/Monthly/Yearly filters, isolates financial cache entries by Staff session, and renders scope-specific metrics in these orders:

- All: `Income → Pay → Tip → Other Income → Paid Amount`
- Business: `Turns → Hours → Service → Pay → Commission → Comm % → Tip → Tech Takes`
- Independent: `Income → Direct Payments → Self-Reported Income`

Development API traffic targets `https://staging-api.nexoratouch.com` per the explicit integration request.

The Report namespace exposes all 48 approved flat EN/VI keys, and the screen now reads the canonical title, scope, period, controls, metrics, loading, and error labels. Existing nested aliases remain available for compatibility. Vietnamese rendering is covered across All, Business, and Independent, including `Tiền hoa hồng`.

## Automated Coverage

| Layer | Coverage | Result |
|---|---|---|
| L1 UI | API summary/source values, scope-specific metric order/format, exact 48-key EN/VI translation contract, approved labels across All/Business/Independent, all periods, ISO week-year and valid Week 53 handling across positive/negative UTC offsets, valid daily date retention, loading/error/retry, responsive filter row | PASS |
| L2 Data | Exact endpoint/query serialization, no timezone/staff ID, object-shaped source preservation, complete response preservation, filter/session-scoped query key, cross-session cache isolation | PASS |
| L3 Flow | Authenticated `AppRouter` route with real Report component; mocked auth/repositories; source and period changes reach the repository and summary renders | PASS |
| L3 Live | Staging route without token returns `401`; no Staff token/test fixture was available to validate a `200` payload | PENDING |

## Command Results

| Command | Result |
|---|---|
| Targeted Vitest set | PASS — 4 files, 33 tests |
| `pnpm build:dev` | PASS — 3077 modules; existing chunk-size warning only |
| `pnpm build:staging` | PASS — 3077 modules; existing chunk-size warning only |
| `pnpm build` | PASS — 3077 modules; existing chunk-size warning only |
| OpenSpec strict validation | PASS — `integrate-staff-income-report-api` is valid |
| `pnpm test` | Baseline blocked — feature tests pass; 32 failures remain in 7 unrelated existing test files |
| `pnpm typecheck` | Baseline blocked — existing errors are outside the feature files |
| `pnpm lint:tokens` | Infrastructure blocked — referenced `scripts/verify-tokens.cjs` is absent |
| `pnpm test:impact` | Infrastructure blocked — referenced detector script under `.agents/` is absent |
| `pnpm test:qa` | Infrastructure blocked — package script is not defined |

The unrelated failing test files observed in the full suite are `dashboard/constants`, `ManagePlanView`, `HomePageTaxIQSection`, `ProfileTab`, `StaffPay`, `PosFrontDeskView`, and `PosOrderWorkspace`.

## Independent Review

The first independent pass found cross-session cache reuse, invalid universal Week 53 options, a date-dependent test, a missing real route flow, and a clearable daily date. These were addressed with regression tests. The recommendation to keep development pointed at test was intentionally not applied because the user explicitly requested staging for this API integration.

## Residual Verification

Before marking the story Tested/Done, sign in to staging as a Staff account with known POS and Independent data, exercise all three scopes and four periods, confirm `200` payloads and displayed totals, and capture the browser network/console evidence. No screenshot is claimed for this run because authenticated staging access was unavailable.
