# Proposal: Verify Customer Tipping & Review Flow

## Why
We need to verify the customer tipping and review flow functions correctly across all views, including selecting providers, specifying custom/preset amounts, payment wallet displays, sentiment threshold gating, and writing logs to local storage.

## What Changes
We will run both unit tests and E2E tests for the customer flow.

## Capabilities
- `verify-customer-tipping-review`: Verifies staff selection, custom tip amounts, wallet selection, reference note, reviews rating stars, sentiment tag chips, and external routing.

## Impact
No direct application code modifications are required for this verification change.
