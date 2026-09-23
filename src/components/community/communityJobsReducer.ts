// Pure state reducer for CommunityJobsPanel (see
// docs/community-jobs-layout-redesign-plan.md "State Model" + "Selection invariants").
//
// Deliberately has no React import and no DemoJob import: `jobs` (the actual array)
// stays owned by the component, same as today's `setJobs`. Actions that need to
// decide "is the current selection still visible?" take the component's current
// ordered list of visible job ids as a third argument (`visibleJobIds`) rather than
// importing DemoJob — keeping this reducer trivially unit-testable in isolation.
// `JOB_LOCATIONS` (a plain string array, not `DemoJob`) is the one exception: it
// keeps DEFAULT_LOCATION_FILTER from silently desyncing with the real "all
// locations" sentinel if that list is ever reordered.

import { JOB_LOCATIONS } from './communityDemoContent'

export type PostKind = 'seeking' | 'hiring'
export type ViewTab = 'browse' | 'mine'
export type StatusFilter = 'all' | 'open'

export type PanelState = {
  query: string
  kindFilter: 'all' | PostKind
  locationFilter: string
  statusFilter: StatusFilter
  viewTab: ViewTab
  pageNumber: number
  selectedJobId: string | null
  deleteConfirmId: string | null
  chatExpanded: boolean
}

export type PanelAction =
  | { type: 'SET_QUERY'; query: string }
  | { type: 'SET_KIND_FILTER'; kind: 'all' | PostKind }
  | { type: 'SET_LOCATION_FILTER'; location: string }
  | { type: 'SET_STATUS_FILTER'; status: StatusFilter }
  | { type: 'SET_VIEW_TAB'; tab: ViewTab }
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SELECT_JOB'; jobId: string | null }
  | { type: 'REQUEST_DELETE'; jobId: string }
  | { type: 'CANCEL_DELETE' }
  | { type: 'CONFIRM_DELETE' }
  | { type: 'TOGGLE_CHAT' }
  | { type: 'RESET_FILTERS' }
  | { type: 'CLEAR_ALL_FILTERS' }

export const DEFAULT_LOCATION_FILTER = JOB_LOCATIONS[0]

export function createInitialPanelState(): PanelState {
  return {
    query: '',
    kindFilter: 'all',
    locationFilter: DEFAULT_LOCATION_FILTER,
    statusFilter: 'all',
    viewTab: 'browse',
    pageNumber: 1,
    selectedJobId: null,
    deleteConfirmId: null,
    chatExpanded: false,
  }
}

// Re-clamp rule shared by the filter-changing actions: if there WAS a selection
// and it's still in the (already filtered/paginated) visible set, leave it
// untouched; if there WAS a selection and it dropped out, clear it to `null`. If
// there was NO selection (`null`), it stays `null` — `null` is trivially "not in"
// any visible set, so without this explicit check every filter/page/tab change
// would incorrectly auto-select something even when the user never selected
// anything (Blocker 1 fix: this was hijacking the whole screen into
// JobDetailView on every keystroke in search).
//
// The dropped-out fallback used to be `visibleJobIds[0]` ("re-clamp to the first
// visible item"), a Variant-A (persistent split-view) leftover. Under this
// full-width-at-every-width UI there is no legitimate case for "the selection
// became invalid, so silently show a DIFFERENT job's detail instead" — that
// branch only ever fired via the stale-selection bug (see JobDetailView's
// consumer: selecting a job, then changing a filter/status that drops it out of
// view, then touching any other filter used to reopen an unrelated job).
// `null` is the only fallback with a legitimate use case here (round-3 fix).
function clampSelection(state: PanelState, visibleJobIds: string[]): PanelState {
  if (state.selectedJobId === null) {
    return state
  }
  if (visibleJobIds.includes(state.selectedJobId)) {
    return state
  }
  return { ...state, selectedJobId: null }
}

export function communityJobsReducer(
  state: PanelState,
  action: PanelAction,
  visibleJobIds: string[] = [],
): PanelState {
  switch (action.type) {
    case 'SET_QUERY':
      return clampSelection({ ...state, query: action.query }, visibleJobIds)

    case 'SET_KIND_FILTER':
      return clampSelection({ ...state, kindFilter: action.kind }, visibleJobIds)

    case 'SET_LOCATION_FILTER':
      return clampSelection({ ...state, locationFilter: action.location }, visibleJobIds)

    case 'SET_STATUS_FILTER':
      return clampSelection({ ...state, statusFilter: action.status }, visibleJobIds)

    case 'SET_VIEW_TAB':
      // Also clears any pending delete confirmation — switching tabs while a
      // confirm bar is armed must not leave it silently armed for whatever job
      // ends up re-clamped into view (P2 fix).
      return clampSelection({ ...state, viewTab: action.tab, pageNumber: 1, deleteConfirmId: null }, visibleJobIds)

    case 'SET_PAGE':
      // Changing pages always clears any selection now — same reasoning as
      // clampSelection above: there is no more "first item of the new page" to
      // legitimately jump to once every job detail is a full-width view, and
      // paging away from the page you were viewing a detail on should just
      // return you to browsing, not silently swap in a different job's detail
      // (round-3 fix; this used to read `visibleJobIds[0]`).
      return { ...state, pageNumber: action.page, selectedJobId: null }

    case 'SELECT_JOB':
      // Also clears any pending delete confirmation and collapses chat on job switch (P2 fix)
      return { ...state, selectedJobId: action.jobId, deleteConfirmId: null, chatExpanded: false }

    case 'REQUEST_DELETE':
      return { ...state, deleteConfirmId: action.jobId }

    case 'CANCEL_DELETE':
      return { ...state, deleteConfirmId: null }

    case 'CONFIRM_DELETE': {
      const deletedId = state.deleteConfirmId
      if (!deletedId || deletedId !== state.selectedJobId) {
        // Either nothing was pending, or the deleted job wasn't the selected one —
        // selection is unaffected per the invariants table.
        return { ...state, deleteConfirmId: null }
      }
      const index = visibleJobIds.indexOf(deletedId)
      const remainingCount = visibleJobIds.filter((id) => id !== deletedId).length
      let nextSelectedJobId: string | null = null
      if (remainingCount > 0 && index !== -1) {
        nextSelectedJobId = index < visibleJobIds.length - 1
          ? visibleJobIds[index + 1]
          : visibleJobIds[index - 1] ?? null
      }
      return { ...state, deleteConfirmId: null, selectedJobId: nextSelectedJobId }
    }

    case 'TOGGLE_CHAT':
      return { ...state, chatExpanded: !state.chatExpanded }

    case 'RESET_FILTERS':
      // Narrow reset used by submitDraft after creating a new post: clears
      // search/kind/location/status and returns to page 1, but does NOT touch
      // viewTab — posting from "Bài của tôi" must keep you on "Bài của tôi"
      // (P2 fix; an earlier version of this action wrongly also reset viewTab to
      // 'browse', which kicked posters back to the public feed right after they
      // posted from their own tab). Selection is handled separately by the
      // caller (e.g. dispatching SELECT_JOB for the newly created post).
      return {
        ...state,
        query: '',
        kindFilter: 'all',
        locationFilter: DEFAULT_LOCATION_FILTER,
        statusFilter: 'all',
        pageNumber: 1,
      }

    case 'CLEAR_ALL_FILTERS':
      // Full reset used by the empty-state "Xoá bộ lọc" action: everything
      // RESET_FILTERS clears, PLUS viewTab back to 'browse' — clearing filters
      // when you're stuck looking at an empty list is explicitly about getting
      // back to a browsable state, unlike the post-create case above (P1/P2 fix
      // split: one action was serving two callers with different needs).
      return {
        ...state,
        query: '',
        kindFilter: 'all',
        locationFilter: DEFAULT_LOCATION_FILTER,
        statusFilter: 'all',
        viewTab: 'browse',
        pageNumber: 1,
      }

    default:
      return state
  }
}
