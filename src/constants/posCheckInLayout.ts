/**
 * PosCheckInLayout — matches backend Nexora.Domain.Enums.Pos.PosCheckInLayout, serialized
 * as a string by the API (see SelfCheckInContextDto.checkInLayout in the live Swagger).
 *
 * A const object rather than a TS `enum` on purpose: the layout value crosses the API
 * boundary as a plain string and several call sites (settings defaults, layout fallbacks)
 * legitimately write the literal. A string enum would reject `'SinglePage'` at those sites;
 * this shape keeps `PosCheckInLayout.SinglePage` usable as a value and still lets the
 * literal assign.
 */
export const PosCheckInLayout = {
  SinglePage: 'SinglePage',
  Wizard: 'Wizard',
} as const

export type PosCheckInLayout = (typeof PosCheckInLayout)[keyof typeof PosCheckInLayout]
