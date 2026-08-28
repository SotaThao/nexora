# ARCHITECTURE.md

A structural map of this codebase — what actually exists, folder by folder. This complements, not replaces, the other root docs:

- [`AGENTS.md`](./AGENTS.md) — the engineering rules and conventions (read that first).
- [`CULTURE.md`](./CULTURE.md) — the US product-culture rule.
- [`DESIGN.md`](./DESIGN.md) — the visual design system (tokens, components).
- [`docs/`](./docs/README.md) — deeper product/spec documentation and historical artifacts.

## Top-Level `src/` Map

| Folder | Purpose |
|---|---|
| `app/` | Router (`AppRouter.tsx`), route guards (`RequireAuth`, `RequireOnboarded`, `RequireStaffReady`), login screen, lazy-loading helper, loading screen, demo/simulation tooling |
| `auth/` | Auth context/provider, `useAuth`, token store, auth adapter(s), signup/pending-registration helpers |
| `components/` | All UI — dashboard (owner), staff-dashboard, POS, TaxIQ, Tips, homepage/public, checkin, payout, settings, shared `ui/` primitives |
| `constants/` | Shared enum/const objects for backend status strings (e.g. `posOrderStatus.ts`, `tipStatus.ts`) — see AGENTS.md's "no hardcoded backend enum string" rule |
| `contexts/` | Cross-cutting React contexts: `LanguageContext`, `NotificationContext`, `KybGateContext`, `StaffAccountContext` |
| `data/` | Data boundary: `hooks/` (TanStack Query hooks), `repositories/` (domain/API logic), `queryKeys.ts`, `errorCodes.ts`, plus a legacy `adapters/` (see "Known Gap" below) |
| `hooks/` | Small generic UI hooks not tied to a domain (`useMediaQuery`, `usePagination`, `useIsMobileUI`, etc.) — distinct from `data/hooks/` |
| `lib/` | Low-level clients: `httpClient.ts` (main REST client), `queryClient.ts` (TanStack Query instance), `posDeviceHttpClient.ts`, `vlinkPayHttpClient.ts`, `communityChatHub.ts` |
| `locales/` | `en.json` / `vi.json` i18n string tables, consumed via `LanguageContext` |
| `types/` | Shared TS types: `domain.ts`, `api.ts`, `auth.ts`, `contexts.ts`, `forms.ts`, `hooks.ts`, `repositories.ts` |
| `utils/` | ~60 general-purpose helpers (formatters, `storage.ts`, `logger.ts`, phone/date/currency helpers, etc.) |

## Provider Bootstrap

`src/main.tsx` mounts, outermost → innermost:

```
StrictMode
  ErrorBoundary
    QueryClientProvider
      LanguageProvider
        AuthProvider
          NotificationProvider
            BrowserRouter (v7_startTransition, v7_relativeSplatPath future flags)
              SkeletonProvider
                App
```

`src/App.tsx` renders `KybGateProvider > <div className={shellClassName}> > AppRouter` — `KybGateContext` sits inside `App`, after routing/auth are available, and picks the outer shell CSS class per-path. This matches AGENTS.md's Provider Stack section; confirmed against the actual code as of this audit.

## Data Boundary In Practice

The rule (`components → data hooks → repositories → adapter`, per AGENTS.md) in a concrete example:

- **Hook**: `src/data/hooks/useMerchantStaff.ts` — owns `useQuery`/`useMutation`, builds keys via `qk` (from `queryKeys.ts`), does optimistic cache patches (`patchStaffStatusInCache`, `removeStaffLinkFromCache`) via `queryClient.setQueriesData`.
- **Repository**: `src/data/repositories/merchantStaff.ts` — imports `httpClient` directly, normalizes API DTOs (`StaffListItemApiDto`, `StaffPaymentMethodApiDto`) into domain shapes (`StaffMember`, via `normalizePaymentMethods` etc.). No React code.
- **Adapter**: `src/lib/httpClient.ts` — request/response interceptor pipeline, JWT bearer injection via `tokenStore`, single-flight 401 refresh (`runTokenRefresh`) that calls `/api/v1/authentication/refresh-token` and clears tokens + dispatches `nexora-logout` on failure.
- **Query keys**: `src/data/queryKeys.ts` exports `qk`, a registry of key-builder functions (e.g. `qk.merchantSetup()`, `qk.transactionsPaginated(filters)`) used by both hooks and manual cache patches, so invalidation stays targeted.

All of the above are `.ts`/`.tsx` — there is no `.js` left in this layer (AGENTS.md's File Map historically said `httpClient.js`; that's now fixed to `.ts` there too).

### Known Gap: Legacy `src/data/adapters/`

`src/data/adapters/` (`index.ts`, `apiAdapter.ts`, `storageAdapter.ts`) is a vestige of an earlier `VITE_DATA_SOURCE=storage|api` migration phase. `storageAdapter.ts` is still the only place raw `localStorage`/`JSON.parse` domain access is allowed by convention, but it's now nearly dead: only `src/data/repositories/pendingAccounts.ts` still imports from it. Every other repository calls `httpClient` directly, per the current API-backed architecture (AGENTS.md's "Architecture Rules" section). Don't treat `data/adapters/` as the live pattern for new code — it's a single remaining caller away from being removable, not a boundary to extend.

## Auth (`src/auth/`)

- `AuthContext.ts` — plain context object.
- `AuthProvider.tsx` — session lifecycle (`session`, `status: 'loading' | 'authenticated' | 'anonymous'`, `login`, `logout`, `refreshSession`), delegates to `authAdapter`, dedupes concurrent `getSession()` calls via a ref-held promise.
- `useAuth.ts` — thin `useContext(AuthContext)` hook; throws if used outside the provider.
- `adapters/apiAuthAdapter.ts` — the only auth adapter (API-only mode; no mock/local adapter left).
- `tokenStore.ts` — localStorage-backed (`nexora_auth_tokens` key via `utils/storage`), pub/sub `subscribe()` for token-change listeners.

## Routing

Two layers, split by concern:

- **`src/app/AppRouter.tsx`** (route tree + guards) — public/customer-facing routes (`CustomerFlow`, `DirectPaymentFlow`, `StaffDirectPaymentFlow`, registration wizards, public booking, POS self-check-in kiosk routes), the owner `DashboardOwnerShell`, and the parallel `StaffDashboard` tree. Guards: `RequireAuth`, `RequireOnboarded`, `RequireStaffReady`; lazy imports via `lazyWithRetry`. POS kiosk/self-check-in routes are deliberately outside the auth gate — paired tablets authenticate via device tokens, not user sessions.
- **`src/components/dashboard/routes/index.tsx`** (owner-dashboard route content) — the components rendered inside `DashboardOwnerShell`'s outlet (`OverviewRoute`, `StaffRoute`, TaxIQ routes, POS routes); these read shared context via `useOutletContext<LooseObject>()` rather than receiving router props directly.

## Components By Area (approximate)

| Area | Approx. files | Notes |
|---|---|---|
| `dashboard/` | 283 | Owner dashboard shell: `charts/`, `direct-payments/`, `layout/`, `modals/`, `overview/`, `routes/`, `views/` (nests `pos/`, `taxiq/`, `plans/`, `smsCampaigns/`, `qrCodes/`, `creditCheckout/`, `voiceCredits/`, ...) |
| `staff-dashboard/` | 66 | Staff-facing parallel app, incl. `views/taxiq/` staff variants |
| `homepage/` | 32 | Marketing/landing |
| `ui/` | 27 | Shared primitives (buttons, modals, skeletons, `ErrorBoundary`, `SkeletonProvider`) |
| `header-messages/` | 22 | |
| `checkin/` | 17 | |
| `tips/` | 16 | Tip system UI: `tabs/`, `hooks/useTipsData.ts`, `payouts/` |
| `public/` | 15 | Public-facing pages |
| `payout/` | 14 | |
| `customer-flow/` | 13 | |
| `staff/` | 11 | |
| `settings/`, `posDevice/` | 10 each | |

~23 large screen components still sit loose at `src/components/` root, not yet folder-organized (`Dashboard.tsx`, `StaffDetailView.tsx`, `AnalyticsView.tsx`, `SettingsView.desktop/mobile.tsx`, `CustomerFlow.tsx`, `DirectPaymentFlow.tsx`, `SetupWizard.tsx`, etc.) — informational, not a call to refactor them as part of this doc.

## Domain Modules → Folders

Per AGENTS.md's "Domain Principle: Module Independence & Shared Data" (read that section for the actual rule — this is only an orientation map):

- **POS** → `src/components/dashboard/views/pos/` (`booking/`, `modals/`, `timeclock/`, `hooks/`, `customer/`, `devices/`) + `src/data/repositories/pos*.ts` + `src/data/hooks/usePos*.ts`. Kiosk-facing pieces (device pairing, self-check-in) live separately in `src/components/posDevice/`, outside the auth gate.
- **TaxIQ** → owner side `src/components/dashboard/views/taxiq/` (Deduction Center, Income Summary, Receipt Vault, Payroll, Tax Ledger, Exceptions, Jurisdictions, 1099/Forms); staff side `src/components/staff-dashboard/views/taxiq/` (parallel Staff* views); standalone public viewers in `src/components/taxiq/` (`CpaViewer/`, `ShareLinkViewer/`, `W4Invite/`).
- **Tip system** → `src/components/tips/` (QR/NFC tipping tabs, payouts UI) + staff-side `StaffTips.tsx`/`StaffMyEarnings.tsx`, backed by `useTipsData` and `constants/tipStatus.ts`/`tipPresets.ts`.
- **Booking** (not a named 4th core module in AGENTS.md, but a real domain) — two related but distinct surfaces: POS front-desk booking (`pos/booking/`) and the separate AI-voice-driven Booking Hub (`dashboard/views/BookingHubView.tsx` + `BookingTeamCalendar/Panel`, `BookingCallLogPanel`).

## Testing

Test files are co-located with source (`src/data/repositories/*.test.ts`, `src/components/**/*.test.tsx`), matching AGENTS.md's File Map. Test infra: `src/setupTests.ts` (mocks `NotificationContext`, wraps a `LanguageProvider` + `QueryClientProvider` test-render helper), `vitest.config.ts` (unit), `vitest.e2e.config.ts` + `scripts/run-e2e.cjs` (browser e2e, run separately from co-located tests).
