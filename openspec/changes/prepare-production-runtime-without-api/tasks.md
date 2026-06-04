## 1. OpenSpec foundation

- [x] 1.1 Create the `prepare-production-runtime-without-api` change with proposal, design, tasks, and spec deltas
- [x] 1.2 Validate the new change with `npx openspec validate prepare-production-runtime-without-api --strict`

## 2. Production runtime without demo tools

- [x] 2.1 Add `VITE_ENABLE_DEMO_TOOLS=false` to `.env.example` and document that demo tools are opt-in
- [x] 2.2 Gate Simulation Panel, quick demo dashboard entry, simulated account database/password display, staff demo button, and simulation invite toast behind explicit demo-tools mode
- [x] 2.3 Add or update tests proving production/default runtime hides demo tools while demo mode can still exercise existing smoke flows

## 3. Data boundary hardening

- [x] 3.1 Remove direct domain `localStorage`/`sessionStorage` access from `App.jsx`
- [x] 3.2 Add repository/hook reset methods needed by the app shell
- [x] 3.3 Remove manual `window.dispatchEvent(new Event('storage'))` calls from feature hooks
- [x] 3.4 Normalize registration and staff-registration writes to one mutation ownership path
- [x] 3.5 Run the expanded domain-storage grep gate and confirm it returns empty

## 4. QA and CI gates

- [x] 4.1 Pin Node 22 for local and CI use
- [x] 4.2 Align CI and docs on pnpm-only install/test commands
- [x] 4.3 Fix official e2e command to run on a stable local origin
- [x] 4.4 Fix `pnpm lint:tokens` violations introduced or touched by this branch

## 5. Maintainability

- [x] 5.1 Split at least one highest-risk oversized module where ownership becomes clearer, without behavior changes
- [x] 5.2 Preserve existing public component/hook behavior and add targeted tests when a split changes import boundaries

## 6. Final verification

- [x] 6.1 `pnpm build` passes
- [x] 6.2 `npx vitest run` passes
- [x] 6.3 `pnpm lint:tokens` passes
- [x] 6.4 `pnpm test:e2e` passes
- [x] 6.5 `npx openspec validate prepare-production-runtime-without-api --strict` passes
- [x] 6.6 `npx openspec validate restructure-data-layer-for-api --strict` passes
