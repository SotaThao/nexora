# Technical design — US-046

| Flow | Endpoint | Frontend owner |
|---|---|---|
| Catalog and effective state | GET /api/v1/merchant/nexora-voice/voice-options?language=en-US, vi-VN, or auto | merchantVoice repository → useMerchantVoiceOptions → VoiceSelectionCard/VoiceLibraryModal |
| Saved selection hydration | GET /api/v1/merchant/nexora-voice/config | useMerchantVoiceConfig → BookingSettingsPanel |
| Persist active changed choices | PUT /api/v1/merchant/nexora-voice/config | BookingSettingsPanel → useUpdateMerchantVoiceConfig → merchantVoice repository |

The source implementation supplied by the backend task confirms camelCase fields, enum selection-state strings, and VoiceGender values 0 Unspecified, 1 Female, 2 Male, 3 Neutral. Live Swagger does not expose voice-options yet; rollout verification must follow backend deployment.

Server cache owns saved state; Salon Settings owns changed drafts keyed by language; modal owns pending radio choice; useVoiceSamplePlayer owns one HTMLAudioElement. Apply only changes draft. Save refreshes catalog for active draft candidates, uses last-known offered groups to distinguish an intentionally inactive draft from a disappeared group, validates catalog IDs, and sends only applicable changed selections. Failed writes retain draft and refresh options. Successful config writes clear only matching submitted drafts, independently of the separate booking-SMS save.

Options keys include account, business when available, and requested draft language, with gcTime zero so the observer's old account cache is discarded on account change/unmount. Config mutation invalidates every options variant and config.

Config hydration skips dirty form revisions and repeated translation-driven effects. Actual edit handlers mark dirty; modal search/radio/filter events do not. A save revision prevents incoming reads from overwriting edits made during the request.

Native dialog provides focus containment and keyboard navigation; close/unmount explicitly restores connected opener focus. Modal header/footer remain outside the scrolling body. Samples use public URLs directly without JWT, preload none, rejected-play handling, generation fencing, and cleanup. Opening the library cancels greeting speech; greeting preview explicitly identifies device voice.

The applicable language-group snapshot is captured on language-mode entry and explicit confirmation, and survives background catalog disappearance until an intentional mode switch. A missing previously applicable Auto group therefore cannot silently drop its draft. The options request is session-enabled even when unrelated merchant setup fails; the backend resolves tenant scope from authentication.
