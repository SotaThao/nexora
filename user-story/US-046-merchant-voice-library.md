# US-046 — Merchant Voice Library integration tracking

Status: Integrated; user-approved plan implemented, deployed-API verification pending.
Date: 2026-09-07. OpenSpec: openspec/changes/merchant-voice-library.

Approved requirement source: 2026-09-07 merchant voice library plan, tasks 5–6. This file tracks engineering integration; it does not introduce additional business requirements.

## API mapping
- GET /api/v1/merchant/nexora-voice/voice-options?language=<draft>: merchant JWT; grouped effective state and selectable public catalog metadata.
- GET /api/v1/merchant/nexora-voice/config: existing config plus optional voiceSelections.
- PUT /api/v1/merchant/nexora-voice/config: existing full config plus changed active-language {languageCode, voiceTtsVoiceId} entries.
- Contract source: backend implementation confirmed during this task. Live Swagger lacks the additive GET pending release.

## Verification cases
- TC-01: repository normalizes enum genders and safe URLs; old config supplies no invented assignment.
- TC-02: GET uses requested draft language; payload omits inactive choices, Auto EN-only scope excludes retained VI draft.
- TC-03: explicit/previously active group disappearance rejects save preparation; no silent dropped selection.
- TC-04: selecting/filtering stays modal-local until Use; Cancel/Escape do not commit.
- TC-05: sample preview never selects/autoplays; switching/unmount stop audio; rejected play and missing sample are accessible.
- TC-06: fixture desktop/mobile screenshots verify scrolling body, accessible footer, Unsaved card and focus restoration.

Tests: src/data/repositories/merchantVoiceOptions.test.ts; src/components/dashboard/views/voiceLibrary/VoiceLibraryModal.test.tsx.
Screenshots and command logs are retained in the coordinating workspace under .superpowers/sdd/2026-09-07-merchant-voice-library/merchant-verification; temporary browser fixture files were removed.

## Execution notes
Production build passed. Full available suite passed (33 tests; targeted feature suite 9 passing). Typecheck is blocked by existing project errors; token verification command references absent scripts/verify-tokens.cjs. Live Save/reload cannot be verified until backend deployment. Browser evidence uses fixture responses and makes no production change.
