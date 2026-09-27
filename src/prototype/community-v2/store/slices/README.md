# Store slices

`store/types.ts` owns shared domain types and `store/seed.ts` owns shared seed data. A module adds focused actions in `slices/<module>.ts`; components consume state with `useStore` and never reach into `localStorage`.

```ts
// slices/m00.ts
export const markWelcomeSeen = () => storeActions.setWhatsNewSeen(true)
```

Use `nxc2:` keys only through the store. Keep module-specific mutations in its slice.
