## Why
Marketing currently exposes the AI banner mock without a connected offer page or campaign preview. US-111 continues US-110 and issue #1263 with a complete mock workflow, as requested by the user.

## What Changes
- Add Marketing tabs and a session-only landing editor, preview, draft save and simulated publish.
- Keep published content separate from subsequent draft edits.
- Connect selected AI banners and published demo pages to editable mock campaign drafts.
- Identify all sample data and session resets; Social Media remains an explicit upcoming state.
- Tighten AI banner URL validation, pending states and credit checks.

## Capabilities
### New Capabilities
- `marketing-landing-mock`: compose and preview a banner-backed offer page and mock campaign within one browser session.

## Impact
The marketing UI, its repository/hooks, route entry, query keys and EN/VI locales change. No dependencies, authentication, real SMS transport or public publishing API change.

