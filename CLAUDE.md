# CLAUDE.md

Guidance for Claude Code when working in this repository. Treat this as an engineering playbook, not a product brief.

## Operating Principles

- Start from the current code. Read nearby files, tests, and existing patterns before designing a change.
- Preserve observable behavior unless the task explicitly asks for a behavior change.
- Keep edits narrow. Avoid opportunistic refactors, dependency churn, or formatting-only rewrites outside the requested scope.
- Prefer boring, reversible architecture over clever abstractions.
- Make state ownership explicit. Do not create parallel sources of truth for the same domain data.
- Verify the path you changed with the smallest meaningful test first, then broaden when the blast radius is larger.
- No `console.*` in app code. Use the project logger where runtime logging is needed.
- Do not commit unless explicitly asked.

## Repo Profile

- Frontend: React 18 + Vite.
- Language: JavaScript/JSX, not TypeScript.
- Styling: Tailwind utility classes plus shared CSS.
- Server-state cache: TanStack Query.
- Current persistence mode: storage-backed adapter.
- Future persistence mode: API-backed adapter selected by environment.

Useful commands:

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm test:e2e
pnpm lint:tokens
pnpm seed:staff-demo
```

## Principal Workflow

For every task:

1. Identify the owning surface: UI component, hook, repository, adapter, auth, test, or docs.
2. Inspect the owner and its nearest callers/tests.
3. Decide whether the change is behavior, structure, or documentation.
4. Patch only the owner and required integration points.
5. Run verification proportional to risk.
6. Report changed files, verification, and any residual risk.

Verification guide:

- Docs-only change: run `npx openspec validate <change> --strict` when an OpenSpec change is involved.
- Narrow logic change: run the targeted test file plus `pnpm build`.
- Shared hook/repository/auth change: run targeted tests, `pnpm build`, and `pnpm test`.
- User-flow change: add or run browser/e2e smoke for the affected flow.

## Architecture Rules

### Data Boundary

Domain data must flow through this path:

`components -> data hooks -> repositories -> adapter`

Responsibilities:

- Components render UI and call hooks. They should not parse storage or know transport details.
- Data hooks own TanStack Query integration: query keys, loading/error state, mutations, invalidation.
- Repositories own domain operations and object-shape normalization. They should not contain React code.
- Adapters own transport details: storage today, API later.

Do not add new direct domain reads/writes from components, contexts, or feature hooks using `storage.*`, `localStorage.*`, or manual `JSON.parse` for persisted domain keys.

### Query Ownership

- TanStack Query owns cached domain data.
- Query keys come from `src/data/queryKeys.js`.
- Mutations must invalidate or update the relevant query cache.
- Cross-tab freshness belongs in the centralized storage bridge, not in scattered component listeners.

### Auth Boundary

- UI reads auth through `src/auth/useAuth.js`.
- Session lifecycle belongs in `src/auth/AuthProvider.jsx`.
- Adapter-specific behavior belongs in `src/auth/adapters/`.
- Components should not import mock auth/session helpers directly.

### Transport Switching

Environment controls the data source:

```env
VITE_DATA_SOURCE=storage
VITE_API_BASE_URL=
```

- `VITE_DATA_SOURCE=storage`: current default; repositories/auth use storage-backed adapters.
- `VITE_DATA_SOURCE=api`: future backend path; repositories/auth should switch to API adapters without component changes.
- `VITE_API_BASE_URL`: API origin for the future API path.

When preparing API migration work, keep component APIs stable and move transport-specific behavior into adapters or the HTTP client.

## Domain Workflow Notes

This repo has merchant, staff, customer, registration, notification, review, transaction, profile, and auth flows. Treat them as domain workflows with persisted object shapes, not isolated screens.

When changing one of these flows:

- Preserve stored object shapes and identifier formats.
- Check both owner and staff/customer side effects when a registration or setup action changes data.
- Keep notification side effects intact when staff/account flows create requests.
- Confirm route/view transitions after login, demo seed, onboarding completion, and staff invite flows.
- For persistence-sensitive tests, remember test setup may seed Query cache from storage before render.

## File Map

| Area | Where to look |
|------|---------------|
| App shell/routing | `src/App.jsx`, `src/app/AppRouter.jsx` |
| Auth state | `src/auth/AuthProvider.jsx`, `src/auth/useAuth.js` |
| Auth adapters | `src/auth/adapters/` |
| Data hooks | `src/data/hooks/` |
| Repositories | `src/data/repositories/` |
| Data adapters | `src/data/adapters/` |
| Query keys | `src/data/queryKeys.js` |
| Query client | `src/lib/queryClient.js` |
| HTTP client scaffold | `src/lib/httpClient.js` |
| Storage boundary | `src/utils/storage.js` |
| Storage bridge | `src/data/storageEventBridge.js` |
| Logger | `src/utils/logger.js` |
| Tests | `tests/`, `src/setupTests.js`, `vitest*.config.*` |
| OpenSpec work | `openspec/changes/` |

## Code Standards

- Match the surrounding file style and naming.
- Prefer direct, readable code over generic helpers.
- Add comments only for non-obvious intent or constraints.
- Avoid new global state unless it is the actual owner of the concern.
- Do not hide async ordering changes inside callbacks without checking caller behavior.
- Use repository APIs for non-React contexts that cannot call hooks.
- Hooks must only be called at the top level of React components or custom hooks.

## Security And Reliability

- Never commit secrets, tokens, or environment-specific credentials.
- Validate user-controlled URLs and inputs at the boundary that consumes them.
- Avoid raw HTML injection. If unavoidable, sanitize before rendering.
- Keep runtime errors observable through logger/error boundaries rather than silent failure.
- Keep build and tests green; note any command you could not run.

## Completion Checklist

Before finishing a substantive task, confirm:

- The changed path follows the existing ownership boundary.
- No unrelated user changes were reverted.
- Tests/build appropriate to the risk have run.
- Documentation or OpenSpec tasks were updated when the task changed architecture or workflow.
- Final response names changed files, verification, and any known gap.
