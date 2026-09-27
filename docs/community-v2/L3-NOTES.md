# L3 handoff notes

- M02 implements the shared job board, tech profile and three job-post flows, interview handling,
  job detail/application, and POS hiring/suggestions/applications.
- M03 implements availability, deposit acknowledgement, fake-clock check-in, the demo-bar no-show
  event, cancellation matrix, POS posting/candidates/available staff/sharing, and policy controls.
- `S00-07` is the admin workspace; terms publishing calls the shared `simulate` event rather than
  duplicating L0 terms logic.
- UI state is intentionally local demo state; the fixed shared store has no mutation entry point for
  module slices in this base revision.
