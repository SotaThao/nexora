## Context

`restructure-data-layer-for-api` moved most domain access behind repositories, Query hooks, and adapter stubs. That made a future API phase possible, but this branch still carries production-readiness issues:

- Demo/simulation controls are rendered in the normal login experience.
- `App.jsx` still writes/removes domain storage keys directly.
- Registration flows have double-write paths (`repository.save` plus equivalent mutation).
- Some feature hooks manually dispatch storage events.
- CI commands are split between npm and pnpm, Node is not pinned locally, and e2e is unstable on newer Node.
- Large modules remain hard to maintain.

## Decisions

### D1: Demo tools are explicit and default off

Introduce `VITE_ENABLE_DEMO_TOOLS=false` as the default. Demo/simulation UI can remain in the repo, but it must only render when explicitly enabled in development/test. Production builds must not expose quick demo login, simulated account database, pending-account password display, staff demo entry, or simulation invite toast.

### D2: Storage-backed runtime remains the only implemented runtime

This phase keeps `VITE_DATA_SOURCE=storage` as the supported runtime. `apiAdapter` and `apiAuthAdapter` remain stubs. Any work that requires endpoint paths, auth cookies, server validation, RLS, or transaction integrity belongs to the later API phase.

### D3: Data writes use one ownership path

Feature code writes through Query mutation hooks. Mutation hooks call repositories. Repositories call the selected adapter. Feature hooks must not call the same repository method and then call an equivalent mutation, and they must not dispatch storage events manually.

### D4: App shell must not know domain storage keys

`App.jsx` can coordinate routing and local view state, but clearing or saving domain state must happen through hooks/repositories. Grep gates must include `removeItem` and `sessionStorage`, not only `getItem`/`setItem`.

### D5: CI is pnpm + Node 22

Use pnpm consistently in scripts and CI. Pin Node 22 with a repo-level version file. E2E should use a stable local origin, preferring `127.0.0.1:3000` when `localhost` is polluted by browser cache/service workers.

### D6: Maintainability splits are narrow

Oversized modules are split only when the split creates a clear owner boundary. No behavior changes, no broad redesign, no API implementation.

## Risks

- Hiding demo tools can break tests that rely on them. Mitigation: e2e tests that need demo tools explicitly enable `VITE_ENABLE_DEMO_TOOLS=true`; production-runtime tests assert they are hidden by default.
- Removing direct storage writes can affect ordering. Mitigation: use mutation callbacks or `mutateAsync` to preserve observable route timing.
- Style-linter fixes can create visual drift. Mitigation: use existing Nexora tokens and verify with existing tests/smoke.
