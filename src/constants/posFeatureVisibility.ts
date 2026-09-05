/**
 * POS surfaces hidden for this go-live. Hidden, not deleted: every endpoint, hook, modal and view
 * behind these flags stays wired, so flipping one back to `true` restores the feature.
 */

/** Add-ons: the "+ Add-On" button on a ticket service line and the add-on editor in Edit Service. */
export const SHOW_SERVICE_ADD_ONS = false

/** POS > Products sidebar/drawer entry. The route and PosProductsView are untouched. */
export const SHOW_POS_PRODUCTS_MENU = false
