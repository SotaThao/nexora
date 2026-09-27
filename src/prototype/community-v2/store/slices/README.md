# Store slices

`store/types.ts` owns shared domain types and `store/seed.ts` owns shared seed data. A module adds focused actions in `slices/<module>.ts`; components consume state with `useStore` and never reach into `localStorage`.

For actions beyond the built-in ones (`setRole`, `setOtpEnabled`, `setWhatsNewSeen`, `publishTerms`,
`consent`, `createGuestAccount`, `resetDemo`), use the generic write seam: `getState()` to read the
current snapshot and `storeActions.update(mutator)` to publish the next one.

```ts
// store/slices/m04.ts
import { getState, storeActions } from "../index";

export function pauseProgram(id: string) {
  storeActions.update((s) => ({
    ...s,
    promotions: s.promotions.map((p) => (p.id === id ? { ...p, status: "paused" } : p)),
  }));
}
```

Use `nxc2:` keys only through the store. Keep module-specific mutations in its slice: a slice may
only change the state keys owned by its own module (`M00State`…`M05State` in `store/types/mXX.ts`)
and may freely read any other keys via `getState()`.
