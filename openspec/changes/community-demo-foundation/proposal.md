## Why

The Community demo needs a durable data contract before UI work begins. The demo mirrors the Community product specification in Supabase today, while preserving a repository boundary that a future Nexora backend can implement without changing components.

## What Changes

- Add a transport-agnostic Community repository and DTO contract, shared enum registry, cache keys, and Supabase client/error boundary.
- Add versioned Supabase SQL migrations for the Community schema, RLS, privileged RPCs, Realtime, profile provisioning, and notification producers.
- Document the required Supabase dashboard state that cannot be represented in SQL migrations.

## Scope

This change is foundation only: schema, security, repository interfaces, and reproducibility documentation. It does not add Community screens, route wiring, hooks, or a Supabase repository implementation.

## Impact

The Community demo becomes a living backend-contract proposal. Supabase is the demo transport, not a public component dependency; future real-backend adapters satisfy the same repository interfaces.
