# Voice selection card UI refresh

## Goal

Update `VoiceSelectionCard` to match the approved reference image while preserving its existing API-backed selection, draft, save, modal, accessibility, and localization behavior.

## Visual design

- Use a compact horizontal card with a pale blue surface, a light indigo border, and a 16px radius.
- Replace text initials with a decorative circular voice-wave icon on an indigo-to-violet gradient.
- Keep the selected voice name and state badge on one line when space permits.
- Show one secondary line in the form `Gender · Description`, using the API-provided localized description. Do not display the language code in this line.
- Render the state badge as a compact uppercase green pill for the active state. Existing unsaved, fallback, and default states retain distinct semantic styling.
- Add a sliders/settings icon before the localized “Change voice” button label.
- Match the existing Nexora font stack and semantic color tokens; no new font or dependency is introduced.

## Responsive behavior

On narrow screens, allow the content to wrap and keep the action button full width. The card must remain readable with long dynamic voice names and localized descriptions.

## Scope

Modify only:

- `src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.tsx`
- Voice-card styles in `src/components/dashboard/views/booking-hub.css`

No repository, API contract, query, save flow, locale copy, or modal behavior changes are included.

## Accessibility

- Keep the existing localized section `aria-label`.
- Mark decorative icons as hidden from assistive technology.
- Preserve native button semantics, disabled behavior, and visible focus styles.

## Verification

- Run TypeScript checking and the smallest relevant test suite available.
- Run the production build.
- Inspect the card in the browser at desktop and phone widths.
- Confirm dynamic API voice data still renders and “Change voice” still opens the library.
