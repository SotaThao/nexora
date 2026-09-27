# Community v2 — L0 handoff

L0 owns the following shared runtime resources. Later streams should import and extend them; do not create competing copies.

- `store/types.ts` owns all shared domain types. `store/seed/index.ts` merges the complete fixed demo seed from M00–M05.
- `store/index.ts` is the dependency-free React external store. It persists under `nxc2:state`; call `storeActions.resetDemo()` to restore the seed. Add a module action in `store/slices/<module>.ts` and use `useStore(selector)` in UI.
- `routes.tsx` owns the 65-item `SCREENS` registry and route mapping. A stream replaces only its own placeholder element/module implementation; it must not make a parallel registry.
- `useCommunityGate()` exposes `requireAccount(actionId, run)` and `requireConsent(actionId, run)`. They preserve the action, collect account/consent, then replay `run` after roughly 400 ms. Use this for every gated action.
- `ToastProvider`/`useToast()` are the single toast API. `events.ts` owns `simulate()` and the event names `terms.v11.published`, `call.incoming`, and `shift.checkin.overdue`; subscribers use `subscribeSimulation`.
- All shared UI primitives are in `components/index.tsx`. Reuse `Button`, `Sheet`, `Modal`, `Card`, `Badge`, fields, `Avatar`, `MoneyTag`, `SponsoredBadge`, `StatusTimeline`, QR and image placeholders. They use Nexora Tailwind tokens only.

## Final ownership

| Stream | Owns | May edit |
|---|---|---|
| L1 | M01 + M05 | `modules/m01-feed/**`, `modules/m05-messages/**`, `store/types/m01.ts`, `store/types/m05.ts`, `store/seed/m01.ts`, `store/seed/m05.ts`, matching slices |
| L2 | M04 | `modules/m04-deals/**`, `store/types/m04.ts`, `store/seed/m04.ts`, matching slice |
| L3 | M02 + M03 + S00-07 admin | `modules/m02-jobs/**`, `modules/m03-shifts/**`, `modules/m00-admin/**`, `store/types/m02.ts`, `store/types/m03.ts`, `store/seed/m02.ts`, `store/seed/m03.ts`, matching slices |

Everything else is read-only for streams. A stream that needs a shared-file change must stop and report it. The prototype is intentionally mock-only: no backend/API/auth integration belongs here.
