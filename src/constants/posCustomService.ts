/**
 * Custom (off-menu) service line — mirrors the limits enforced by
 * AddOrderCustomServiceLineCommandValidator / UpdateOrderServiceLineCommandValidator on the backend.
 *
 * The price is typed by a person rather than taken from the menu, which is why it is the one line on
 * a ticket with a cap: it stops a mistyped 30000 going out as $30,000 instead of $30.00. A comped
 * service is a real price plus a 100% discount, never $0 — the discount path forces a bearer and a
 * reason, so a technician's deduction is never unexplained.
 */
export const MAX_CUSTOM_SERVICE_NAME_LENGTH = 200
export const MAX_CUSTOM_SERVICE_PRICE = 10_000
export const MAX_SERVICE_LINE_NOTE_LENGTH = 500
