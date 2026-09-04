// The vocabulary the check-in page speaks, independent of who is standing at it.
//
// Both surfaces — the customer's tablet and the front desk's tab — render the same components
// against these shapes. Anything asymmetric between the two APIs is flattened in the source hooks
// (see sources/), never here and never in a layout.

export interface CheckInService {
  id: string
  name: string
  price: number
  durationMinutes: number
  description: string | null
  photoUrl: string | null
  categories: { id: string; name: string }[]
}

export interface CheckInTechnician {
  posStaffProfileId: string
  displayName: string
  photoUrl: string | null
  // Services this person is assigned to. A technician chosen up front is auto-assigned to a
  // service only when it appears here; anything else stays unassigned for the front desk.
  serviceIds: string[]
  isBusy: boolean
}

// Today's appointment for the number that was typed, if there is one.
export interface CheckInBookingPrefill {
  bookingId: string
  // Already-formatted salon wall clock. A label rather than an instant because the two surfaces
  // disagree about what their `scheduledAt` means — the kiosk's is resolved server-side, the front
  // desk's needs the source-aware conversion in bookingFormatters — and that is exactly the kind
  // of knowledge a source hook is for.
  scheduledTimeLabel: string
  customerName: string
  items: { posServiceId: string; posStaffProfileId: string | null }[]
}

export interface CheckInItemPayload {
  posServiceId: string
  // null is "Anyone" and stays null — a person on the floor decides.
  posStaffProfileId: string | null
  note: string | null
}

export interface CheckInSubmitResult {
  orderNumber: string
}

export interface CheckInOrderSubmit {
  customerName: string
  customerPhone: string
  items: CheckInItemPayload[]
}

export interface CheckInBookingSubmit {
  bookingId: string
  customerName: string
  items: CheckInItemPayload[]
}

// Everything the page needs, already resolved. A source hook takes the phone number currently on
// screen (undefined before one has been entered) and answers with this.
export interface CheckInSourceResult {
  catalog: CheckInService[]
  isCatalogLoading: boolean

  technicians: CheckInTechnician[]
  isTechniciansLoading: boolean

  // The three phone-driven lookups. None of them blocks the others, and an unreachable one is not
  // a dead end — `areLookupsSettled` flips once every one of them has answered or failed.
  customerName: string | null
  booking: CheckInBookingPrefill | null
  activeVisitOrderNumber: string | null
  areLookupsSettled: boolean

  submitOrder: (payload: CheckInOrderSubmit) => Promise<CheckInSubmitResult>
  submitBooking: (payload: CheckInBookingSubmit) => Promise<CheckInSubmitResult>
  isSubmitting: boolean
}

export type CheckInSourceHook = (phone?: string) => CheckInSourceResult
