## 1. Story and Test Contract

- [x] 1.1 Add US-045 with approved acceptance criteria, API mapping, frontend surface, and live-Swagger limitation
- [x] 1.2 Add the three-layer feature test plan and acceptance gate

## 2. Data Boundary (TDD)

- [x] 2.1 Add failing repository tests for All, Business, Independent, Daily, Weekly, Monthly, and Yearly query construction plus complete response preservation
- [x] 2.2 Add shared report enum constants and implement the typed staff income report repository until repository tests pass
- [x] 2.3 Add failing hook/query-key tests for filter-scoped fetching, then implement the query key and TanStack Query hook until tests pass

## 3. Report Screen (TDD)

- [x] 3.1 Add failing component tests for API summary rendering, nullable POS metrics, scope changes, period parameters, loading, error, and retry states
- [x] 3.2 Integrate the report hook into `StaffSalonReport`, remove preview data, add Independent scope, and map period controls until component tests pass
- [x] 3.3 Add EN/VI labels for source scope and request states and keep existing responsive filter behavior intact
- [x] 3.4 Add scope-specific metric matrices and tests: Payment/Tip/Income for All and Independent, full POS metrics for Business
- [x] 3.5 Align `sources` with the deployed object response and implement the final All, Business, and Independent metric matrices with tests
- [x] 3.6 Apply the approved EN/VI metric terminology and add a Vietnamese render regression test across all three scopes
- [x] 3.7 Add the canonical flat 48-key EN/VI report dictionary, migrate visible Report copy, and cover the exact translation contract

## 4. Verification and Closure

- [x] 4.1 Run targeted L1/L2 tests, typecheck, token lint, production build, and broader tests proportional to the shared data-boundary change
- [x] 4.2 Record test outcomes and live-API limitation in the walkthrough and US-045, then validate the OpenSpec change strictly
