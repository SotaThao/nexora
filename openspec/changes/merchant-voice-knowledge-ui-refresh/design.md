# Technical design — US-051

`BookingSettingsPanel` continues to own the Salon Settings layout and renders `VoiceKnowledgePanel` immediately after Business FAQ. `VoiceKnowledgePanel` continues to own only presentation and local interaction state; `useVoiceKnowledge` and its repository retain all server-state and API behavior.

The desktop surface uses a main library card and a narrow guidance sidebar. The main card contains a header/upload trigger, reference banner, five-slot capacity, the existing character budget, a one-file dropzone, and a responsive document list. At mobile width, the sidebar stacks below the main card and document rows become cards.

File selection and drop call one shared validator before the existing `actions.upload`. Only the first dropped file is considered, preserving one-file-per-request behavior. Download remains directly visible. A controlled, keyboard-accessible overflow menu exposes only the existing actions valid for the document's current status. Edit renders as a full-width detail row/card below the selected document.

All visible copy is localized. Dates use US `MMM DD, YYYY` formatting in `America/Chicago`. Icons come from the installed `lucide-react` package. No endpoint, DTO, repository, hook, query key, or mutation invalidation changes.

Verification covers file selection/drop, validation, status-dependent menu actions, download, edit, confirmations, pagination, async states, desktop/mobile layout, translation parity, typecheck, build, and strict OpenSpec validation.
