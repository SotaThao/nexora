# Design: Verify Merchant Dashboard

## Context
Verification targets:
- `tests/unit/Dashboard.test.jsx`
- `tests/unit/AnalyticsView.test.jsx`
- `tests/unit/DevicesView.test.jsx`
- `tests/unit/TipsView.test.jsx`
- `tests/e2e/merchantDashboard.test.js`

## Goals / Non-Goals
- **Goals:** Validate the layout drawer, analytics scrubber, hardware modals, savings formulas, and support tickets.
- **Non-Goals:** External databases testing.

## Decisions
We will run targeted Unit and E2E test suites covering these components.
