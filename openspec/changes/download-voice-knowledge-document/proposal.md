## Why

Merchants can upload, review, edit, regenerate, enable, disable, and delete NexoraVoice knowledge documents, but the merchant dashboard cannot retrieve the original file. This prevents owners from checking the exact source they supplied after upload.

## What Changes

- Add an authenticated merchant endpoint that streams a non-deleted document only when it belongs to the merchant's resolved Voice tenant.
- Add a repository operation that downloads the response as a Blob.
- Add a localized **Download original** action to every visible document card, including progress and failure feedback.
- Preserve private storage: the UI receives file bytes through the authorized API and never receives a reusable object-storage URL.

## Impact

- **Capability:** `merchant-voice-knowledge-download`.
- **Backend:** merchant Voice controller and knowledge-document query handler.
- **Frontend:** knowledge repository, merchant panel, tests, and EN/VI localization.
- **Data model:** no schema or migration changes.
