# Design: Verify Staff Registration Portal

## Context
Verification targets:
- `tests/unit/StaffRegistrationWizard.test.jsx`
- `tests/e2e/staffDashboard.test.js`

## Goals / Non-Goals
- **Goals:** Validate the staff registration steps, camera simulation, OTP timer, layout drawer/bottom navbar, and payouts toggles.
- **Non-Goals:** External banking checks.

## Decisions
We will run targeted Unit and E2E test suites covering these components.
