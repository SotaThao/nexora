## 1. Contract and regression coverage

- [x] 1.1 Add component tests for the approved structure and one-file drop/select upload.
- [x] 1.2 Cover status-dependent actions and retained edit/download/confirmation flows.

## 2. UI implementation

- [x] 2.1 Move the panel directly below Business FAQ.
- [x] 2.2 Implement the responsive library, dropzone, capacity, table/cards, action menu, and expanded editor.
- [x] 2.3 Add matching English and Vietnamese UI copy.

## 3. Verification

- [ ] 3.1 Run targeted and full tests, typecheck, production build, and translation parity check. Targeted tests (16/16), full tests (62/62), build, and EN/VI parity pass. Typecheck is blocked by existing repository-wide errors outside this change and reports no Voice Knowledge diagnostics.
- [x] 3.2 Validate OpenSpec and inspect desktop/mobile layouts. Strict validation passes; desktop and 375×667 live layouts were inspected, including the overflow menu and expanded editor.
- [x] 3.3 Record verified results in US-051 and this task list. Token lint is unavailable because `scripts/verify-tokens.cjs` does not exist.
