## Why

The data-layer restructure introduced the right boundaries for a later API swap, but the app is still not safe to treat as a production runtime. Demo and simulation controls are visible in the normal login path, pending account passwords can be displayed in UI, `App.jsx` still touches domain storage keys directly, some feature hooks double-write through repositories and mutations, and CI gates are not consistently green.

This change hardens the current storage-backed runtime without implementing the real API. It keeps `storageAdapter` as the active data source, keeps `apiAdapter` and `apiAuthAdapter` as future stubs, and makes the app easier to maintain and verify before the API phase starts.

## What Changes

- Add an explicit demo-tools runtime flag (`VITE_ENABLE_DEMO_TOOLS`) and hide simulation/demo UI from production by default.
- Finish the data boundary by removing direct domain storage access from app/components/hooks outside allowed adapters and storage utilities.
- Normalize mutation ownership so feature hooks use one write path through Query mutations, repositories, and adapters.
- Align CI/developer workflow around one package manager and a pinned Node runtime.
- Fix the current style/e2e gates so branch quality can be enforced reliably.
- Split the highest-risk oversized runtime modules only where it improves ownership without changing behavior.

## Non-Goals

- Implementing real backend endpoints.
- Enabling `VITE_DATA_SOURCE=api` for production.
- Removing `src/utils/storage.js` or `src/utils/supabase.js`.
- Replacing the storage-backed demo data model.
- Redesigning user-facing screens.

## Impact

- Runtime: production-visible demo controls are removed or gated.
- Data: existing object shapes are preserved; persistence remains storage-backed.
- Tests: unit, build, lint token, e2e, and OpenSpec validation become required gates.
- Docs/config: `.env.example`, CI, and OpenSpec docs describe the production-runtime phase.
