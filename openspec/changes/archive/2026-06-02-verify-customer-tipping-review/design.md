# Design: Verify Customer Tipping & Review Flow

## Context
Verification targets:
- `tests/unit/CustomerFlow.test.jsx`
- `tests/e2e/dashboard.test.js` (Flow 2, 3, 4, 5, 6)

## Goals / Non-Goals
- **Goals:** Validate the screen transitions, clipboard copying, stars logic, and disabled states.
- **Non-Goals:** External banking checks.

## Decisions
We will run targeted Unit and E2E test suites covering the customer flows.
