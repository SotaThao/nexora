# Design: Verify Merchant Settings & KYB

## Context
Verification targets:
- `tests/unit/SettingsView.test.jsx`

## Goals / Non-Goals
- **Goals:** Validate the profile info fields, wallet configurations, KYB status alerts, bank structure selects, and pdf download mock actions.
- **Non-Goals:** External banking api integration.

## Decisions
We will run `tests/unit/SettingsView.test.jsx` to test all scenarios.
