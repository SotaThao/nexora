# Design: Verify Authentication & Login

## Context
Verification targets:
- `tests/e2e/dashboard.test.js` (Flow 1: Quick SSO Login to Dashboard)
- `tests/unit/Dashboard.test.jsx` (sidebar profile card displays owner credentials)

## Goals / Non-Goals
- **Goals:** Validate login flow routing, SSO presets, Simulation Panel, and credentials display.
- **Non-Goals:** Real database/session testing.

## Decisions
We will run targeted E2E and Unit test cases to verify the `authentication-login` spec without executing the full E2E test suite.
