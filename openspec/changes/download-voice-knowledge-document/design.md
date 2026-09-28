# Technical design — US-050

## US ↔ Endpoint ↔ Frontend files

| Acceptance criterion | Endpoint | Frontend path |
|---|---|---|
| Download a visible original document | `GET /api/v1/merchant/nexora-voice/knowledge-documents/{id}/original` | `VoiceKnowledgePanel.tsx` → `useVoiceKnowledge` → `voiceKnowledge.ts` → `httpClient.getBlob` |
| Show download failure | Same endpoint | Repository rejection → panel error state → localized request-error message |

## Decisions

1. The backend derives `VoiceTenantId` through `MerchantVoiceTenantResolver`; it does not accept tenant scope from the browser.
2. The query filters by document ID, resolved tenant ID, and `DeletedAt == null` before opening private storage.
3. The response uses the stored original filename and content type plus `Cache-Control: no-store` and `X-Content-Type-Options: nosniff`.
4. Download is available for every document returned by the list endpoint, regardless of processing status, because status affects AI use rather than merchant ownership of the original.
5. The repository returns a Blob. The component creates a short-lived object URL, clicks an attachment anchor with the listed original filename, and revokes the URL.
6. Download has its own per-document busy state and does not invalidate knowledge-document cache state.

## Error handling

- A cross-tenant, deleted, or missing document returns the existing not-found behavior without revealing whether another tenant owns the identifier.
- A missing storage object also returns not found.
- Frontend download failures use the existing localized request-error message and leave the action available for retry.

## Verification

- Run repository and panel tests through Vitest.
- Run frontend typecheck and production build.
- Run backend build; the backend repository prohibits adding test projects.
- Validate this OpenSpec change with strict mode.
- Verify the network response after deployment because live Swagger cannot advertise a route before it is deployed.
