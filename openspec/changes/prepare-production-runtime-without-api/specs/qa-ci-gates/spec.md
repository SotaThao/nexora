## ADDED Requirements

### Requirement: CI uses one package manager and pinned Node

The project SHALL use a single package-manager workflow for CI and documented local verification. Node SHALL be pinned to version 22 for local parity with CI.

#### Scenario: CI install and test commands are consistent
- **WHEN** CI runs
- **THEN** it installs dependencies with pnpm
- **AND** it runs build, unit tests, token lint, and e2e through pnpm-compatible commands

### Requirement: Verification gates pass before completion

Before this change is complete, the required gates SHALL pass: production build, full Vitest suite, design-token lint, e2e tests, and OpenSpec validation for this change plus the data-layer change.

#### Scenario: Final branch verification
- **WHEN** final verification is run
- **THEN** `pnpm build`, `npx vitest run`, `pnpm lint:tokens`, `pnpm test:e2e`, and both OpenSpec validates pass

### Requirement: E2E uses a stable local origin

E2E tests SHALL use a stable origin that is not affected by stale `localhost` service workers or browser caches.

#### Scenario: E2E starts against 127.0.0.1
- **WHEN** the official e2e command runs
- **THEN** it starts Vite on `127.0.0.1:3000`
- **AND** tests navigate to `http://127.0.0.1:3000`
