# Voice Selection Card UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the API-backed selected-voice card to match the approved reference without changing selection or save behavior.

**Architecture:** Keep `VoiceSelectionCard` as the data/rendering owner. Change only its presentational markup and the existing voice-card CSS rules; continue deriving all text and state from the current hook, API data, and localization keys.

**Tech Stack:** React 18, TypeScript, lucide-react, CSS, Vitest, Testing Library.

---

## File map

- Create `src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.test.tsx`: focused rendering and interaction regression test.
- Modify `src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.tsx`: icon markup and compact content hierarchy.
- Modify `src/components/dashboard/views/booking-hub.css`: approved card palette, typography, spacing, badges, button, and responsive behavior.

### Task 1: Lock the card content and interaction contract

**Files:**
- Create: `src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.test.tsx`

- [ ] **Step 1: Add a focused test fixture**

Mock `useMerchantVoiceOptions` with one assigned `en-US` voice named `Carina`, gender `Female`, and description `Soft, empathetic, and soothing.` Mock `useTranslation` so keys resolve to `Active`, `Female`, `Change voice`, and `Voice for en-US`.

- [ ] **Step 2: Assert the approved content hierarchy**

Render the card and assert:

```tsx
expect(screen.getByText('Carina')).toBeInTheDocument()
expect(screen.getByText('Active')).toBeInTheDocument()
expect(screen.getByText('Female')).toBeInTheDocument()
expect(screen.getByText('Soft, empathetic, and soothing.')).toBeInTheDocument()
expect(screen.queryByText('en-US')).not.toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Change voice' })).toBeEnabled()
```

- [ ] **Step 3: Preserve the existing open behavior**

Click `Change voice` and assert the supplied `onOpen` callback runs once. Keep the modal mocked or avoid depending on its internals so the test remains scoped to this card.

- [ ] **Step 4: Run the test and confirm the hierarchy assertion fails before implementation**

Run:

```bash
pnpm vitest run src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.test.tsx
```

Expected: failure because the current card renders `en-US · Female` and the old content structure.

### Task 2: Implement the approved visual structure

**Files:**
- Modify: `src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.tsx:1-44`
- Modify: `src/components/dashboard/views/booking-hub.css:15210-15220,15245-15247`

- [ ] **Step 1: Add the action icon**

Import `SlidersHorizontal` from `lucide-react` and render it before the localized button label with `aria-hidden="true"`.

- [ ] **Step 2: Replace initials with the voice-wave emblem**

Remove the `voiceInitials` import and render a decorative, `aria-hidden` inline SVG inside `.voice-library-avatar`. Use a centered waveform made from rounded vertical strokes so the icon remains deterministic and does not require another package.

- [ ] **Step 3: Restructure dynamic text without changing its source**

Keep the API-derived `voice`, localized `description`, and state logic. Render:

```tsx
<div className="voice-library-heading">
  <span className="voice-library-name">{voice?.displayName || t(`${VOICE_TK}.systemVoice`)}</span>
  <span className={`voice-library-badge is-${state}`}>{t(`${VOICE_TK}.${state}`)}</span>
</div>
<div className="voice-library-meta">
  {voice && <span className="voice-library-gender">{t(`${VOICE_TK}.gender.${voice.gender}`)}</span>}
  {voice && description && <span className="voice-library-meta-separator" aria-hidden="true">·</span>}
  {description && <p className="voice-library-description">{description}</p>}
</div>
```

Do not render `item.languageCode` as visible card text. Keep it in the section’s localized `aria-label`.

- [ ] **Step 4: Apply the reference styling**

Update the existing selectors to provide:

- compact 74–76px desktop card height through `padding: 14px 12px`
- `12px` content gap and `44px` avatar
- pale blue card background and light indigo border using existing Nexora CSS variables/color mixing
- indigo-violet circular avatar with white waveform
- `14px/700` voice name
- compact uppercase active badge with pale green fill and green text
- `12px` muted metadata on one line
- `44px` bordered action button, indigo icon/text, and visible hover/focus states
- ellipsis/wrapping safeguards for long API content

- [ ] **Step 5: Keep mobile behavior usable**

At `max-width: 600px`, allow the card to wrap, preserve readable metadata wrapping, and keep the action button at `width: 100%`.

- [ ] **Step 6: Run the focused test**

Run:

```bash
pnpm vitest run src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.test.tsx
```

Expected: all tests pass.

### Task 3: Verify quality and visual fidelity

**Files:**
- Verify: `src/components/dashboard/views/voiceLibrary/VoiceSelectionCard.tsx`
- Verify: `src/components/dashboard/views/booking-hub.css`

- [ ] **Step 1: Check diagnostics**

Run IDE lint diagnostics for both modified source files and fix only newly introduced issues.

- [ ] **Step 2: Run static and token checks**

Run:

```bash
pnpm typecheck
pnpm lint:tokens
```

Expected: both commands exit successfully.

- [ ] **Step 3: Run the production build**

Run:

```bash
pnpm build
```

Expected: Vite production build succeeds.

- [ ] **Step 4: Inspect the live desktop card**

Open the existing development server, navigate to AI Hub settings, and confirm the card matches the reference for border, surface, avatar, typography, active badge, metadata line, and icon button. Confirm `Change voice` still opens the existing modal.

- [ ] **Step 5: Inspect responsive behavior**

Resize to `375 × 667` and confirm no horizontal overflow or clipped dynamic text and that the button becomes full width.

No commit is part of this plan unless the user explicitly requests one.
