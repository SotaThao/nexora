## Context
US-110 supplies an uncommitted AI banner port. US-111 extends it in the same isolated worktree. The user explicitly confirmed mock data; API integration is outside this change.

## Goals
Provide banner → landing → campaign interaction with useful validation and visible demo semantics.

## Decisions
- One in-memory repository owns landing records, published snapshots and campaign drafts. Components call data hooks; TanStack Query uses centralized keys.
- The editor owns transient form state. Saving a draft never silently changes its published snapshot.
- Publishing is simulated and labelled accordingly. Preview is local; no fabricated public URL or delivery success.
- Campaign samples are labelled, editable and draft-only. Real SMS workflows remain unchanged.
- Render customer-facing strings as React text, validate CTA inputs, and avoid invented countdown scarcity.
- Use existing NEXORA tokens and local banner assets, with a one-column mobile editor.
- Source Claude work remains preserved; continuation has its own branch.

## Mapping
US-111 covers the Marketing route in `src/components/dashboard/routes/index.tsx`, UI under `src/components/dashboard/views/marketing/`, repository and hooks under `src/data/`, centralized `src/data/queryKeys.ts`, and both locale files. Mock operations have no mapped HTTP endpoints.

## Verification
Focused repository tests cover validation, snapshot isolation and campaign references. Browser smoke uses real UI actions at desktop, both tablet orientations and mobile. Compare full typecheck output to the inherited baseline and run a production build.

## Future integration
Persistence, tenant isolation, canonical public URLs, asset ownership, expiry enforcement and campaign delivery require an independently verified backend contract.

