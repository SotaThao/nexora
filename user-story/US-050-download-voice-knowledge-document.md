# US-050 · Download Voice knowledge documents

| | |
|---|---|
| **Status** | Integrated |
| **Created** | 2026-09-14 |
| **Epic / Domain** | NexoraVoice knowledge documents |
| **OpenSpec change** | `openspec/changes/download-voice-knowledge-document` |
| **Test plan** | Repository contract test and merchant-panel interaction test |

## Story

**As a** merchant,
**I want** to download an uploaded NexoraVoice knowledge document,
**so that** I can review the original file on my local computer.

## Acceptance Criteria

- **Given** an authenticated merchant has a non-deleted knowledge document
- **When** the merchant selects **Download original** on that document
- **Then** the frontend calls `GET /api/v1/merchant/nexora-voice/knowledge-documents/{id}/original`
- **And** the browser saves the response using the document's original filename and content type.

- **Given** a document is Processing, Active, Failed, Disabled, or Held for Review
- **When** it remains visible in the merchant's document list
- **Then** the original file can be downloaded.

- **Given** a document belongs to another Voice tenant or has been deleted
- **When** a merchant requests its identifier
- **Then** the API does not return the file.

- **Given** storage or the network cannot return the original
- **When** the download fails
- **Then** the merchant sees the existing localized request-error message and can retry.

## API Mapping

| Method | Endpoint | Auth | Request | Response | Source |
|---|---|---|---|---|---|
| GET | `/api/v1/merchant/nexora-voice/knowledge-documents/{id}/original` | Merchant JWT; tenant derived from current user | Route `id: guid` | Original file stream with `Content-Type` and attachment filename | Local backend contract; live verification pending deployment |

**Unresolved contract questions:** None. The route mirrors the existing admin original-file route while deriving tenant scope from merchant authentication.

## Frontend Surface

| Layer | File | Change |
|---|---|---|
| Component | `src/components/dashboard/views/VoiceKnowledgePanel.tsx` | Add per-document download action, busy state, browser save, and error handling |
| Data hook | `src/data/hooks/useVoiceKnowledge.ts` | Expose the repository action; no cache invalidation because download is read-only |
| Repository | `src/data/repositories/voiceKnowledge.ts` | Fetch the original as a `Blob` from the authenticated merchant endpoint |
| Localization | `src/locales/en.json`, `src/locales/vi.json` | Add download progress text |

## Definition of Done

- [x] Backend route enforces current merchant tenant ownership and excludes deleted documents
- [x] Repository contract test passes
- [x] Merchant-panel interaction test passes
- [x] Frontend production build passes
- [ ] Full frontend typecheck is clean; the repository currently reports 49 unrelated pre-existing errors and none reference this feature
- [x] Backend build passes without warnings
- [ ] Live API network verification completed after deployment

## Execution Notes

The design was approved on 2026-09-14. Local verification passed 50 frontend tests, the production frontend build, strict OpenSpec validation, and a backend build with zero warnings/errors. Token lint and browser E2E cannot run because their scripts are absent from this checkout. Live Swagger cannot expose this new route until the backend is deployed.
