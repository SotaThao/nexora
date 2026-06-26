# Feature-Focused Test Walkthrough

## Summary

Executed focused verification for the remaining OpenSpec tasks:

- 5.6: Added direct unit tests for `mockAuthAdapter` and `AuthProvider/useAuth`.
- 6.4: Added browser smoke coverage for dashboard, customer flow, staff dashboard, register, and staff invite flows.

## Executed Test Cases

| Area | Command / Check | Result |
| --- | --- | --- |
| Auth unit tests | `npx vitest run tests/unit/auth.test.jsx` | Passed: 7/7 |
| Browser smoke | `npx start-server-and-test "pnpm dev --host 127.0.0.1" http://127.0.0.1:3000 "npx vitest run --config vitest.e2e.config.js tests/e2e/dataLayerSmoke.test.js"` | Passed: 5/5 |
| Production build | `pnpm build` | Passed |
| Full unit suite | `npx vitest run` | Passed: 155/155 |

## Smoke Screenshots

- `smoke-screenshots/merchant-settings-desktop.png`
- `smoke-screenshots/customer-payment-mobile.png`
- `smoke-screenshots/staff-dashboard-desktop.png`
- `smoke-screenshots/register-account-type-desktop.png`
- `smoke-screenshots/staff-invite-mobile.png`

## Notes

- Browser smoke uses `http://127.0.0.1:3000` instead of `localhost:3000` because the local `localhost` origin had an unrelated service worker/cache serving an older `CryptoMap360` page.
- Smoke checks fail on `pageerror` and `console.error`. During implementation, this caught a real SVG runtime error in `TipsOverTimePanel`; the reveal animation progress is now clamped to prevent negative `<rect width>`.
