/**
 * Tip presets + bounds for the customer-facing tip pickers.
 *
 * The preset is the tip TOTAL: it is split evenly across every staff member the
 * customer picked, so the per-person share must still clear the minimum.
 * Server-side bounds (touch page / payment page `tipConstraints`) win when the
 * API sends them — see `toTipConstraints`.
 */

export const TIP_PRESET_AMOUNTS = [5, 10, 15, 20] as const

/** Minimum a single staff member may receive after the even split. */
export const TIP_MIN_ITEM_AMOUNT = 1

/** Maximum tip total accepted on one payment. */
export const TIP_MAX_TOTAL_AMOUNT = 500

/** `required` = staff đã chọn nhưng chưa chọn số tiền típ → chặn submit. */
export type TipErrorCode = 'required' | 'min_item' | 'max_total'
