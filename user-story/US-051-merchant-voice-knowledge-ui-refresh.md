# US-051 · Merchant Voice Knowledge UI refresh

| | |
|---|---|
| **Status** | Implemented |
| **Created** | 2026-09-15 |
| **Epic / Domain** | NexoraVoice knowledge documents |
| **OpenSpec change** | `openspec/changes/merchant-voice-knowledge-ui-refresh` |
| **Test plan** | Component interaction tests and desktop/mobile browser smoke |

## Story

**As a** merchant,
**I want** the Voice Knowledge document library to match the Salon Settings design,
**so that** I can upload and manage reference files from a clear, familiar workspace below the FAQ field.

## Acceptance Criteria

- The Knowledge files section appears directly below Business FAQ in Salon Settings.
- The section presents the reference banner, five-slot capacity, knowledge-character budget, one-file upload dropzone, uploaded-files table, and upload guidance shown in the approved mockup.
- Choosing or dropping one TXT, DOCX, or PDF runs the existing upload validation and API action; invalid files and exhausted capacity remain blocked.
- Every current document status, warning, download, edit, regenerate, status-change, delete, pagination, locked, loading, empty, and error flow remains available.
- Download stays visible on each row. Other valid actions are exposed from an accessible overflow menu; editing expands immediately below the selected row.
- Desktop uses the mockup's content/sidebar layout. Mobile uses stacked controls and document cards without horizontal clipping.

## API Mapping

No API contract changes. The existing authenticated merchant knowledge-document list, upload, download, content, status, regenerate, delete, and unanswered-question endpoints remain unchanged.

## FE Surface

| Layer | File | Change |
|---|---|---|
| Component | `src/components/dashboard/views/BookingSettingsPanel.tsx` | Move the existing panel below Business FAQ |
| Component | `src/components/dashboard/views/VoiceKnowledgePanel.tsx` | Replace visual structure and add one-file drag/drop plus action menu |
| Localization | `src/locales/en.json`, `src/locales/vi.json` | Add the approved UI and guidance copy |

## Definition of Done

- [x] Component interaction tests pass
- [x] Production build passes
- [x] Full unit suite passes
- [x] Typecheck result is recorded
- [x] Desktop and 375×667 layouts are visually inspected
- [x] OpenSpec validates in strict mode

## Execution Notes

The user approved the UI-only implementation plan on 2026-09-15. Existing repository and hook contracts are intentionally unchanged.

## Verification Results

| Check | Result |
|---|---|
| Voice Knowledge interaction tests | Pass — 16/16 |
| `pnpm typecheck` | Blocked by existing repository-wide errors outside this change; no Voice Knowledge diagnostics were reported |
| `pnpm build` | Pass |
| EN/VI Voice Knowledge key parity | Pass — 99/99 keys |
| Strict OpenSpec validation | Pass |
| Desktop live smoke | Pass — full-width library with main table and guidance rail |
| 375×667 live smoke | Pass — no horizontal overflow; cards, menu, and editor remain usable |
| Token lint | Unavailable — `scripts/verify-tokens.cjs` is absent |
| Full `pnpm test` | Pass — 62/62; restored the two News Library suites and aligned the embedded country selector with its full-height contract |

The live console also reports the existing Community Chat SignalR reconnect error during development reloads. No Voice Knowledge console error was observed.
