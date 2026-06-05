## 1. Test Execution

- [ ] 1.1 Run Dashboard, Analytics, Devices, and Tips unit tests: `npx vitest run tests/unit/Dashboard.test.jsx tests/unit/AnalyticsView.test.jsx tests/unit/DevicesView.test.jsx tests/unit/TipsView.test.jsx`
- [ ] 1.2 Run Merchant Dashboard E2E tests: `npx start-server-and-test dev http://localhost:3000 "npx vitest run --config vitest.e2e.config.js tests/e2e/merchantDashboard.test.js"`
