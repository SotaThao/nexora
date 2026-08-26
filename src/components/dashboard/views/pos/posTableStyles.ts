export const POS_TABLE_HEADER_ROW_CLASS =
  'border-b border-nexoraBorder bg-nexoraCanvas/70 text-[10px] font-black normal-case tracking-wider text-nexoraMuted'

export const POS_TABLE_HEADER_CELL_CLASS =
  'whitespace-nowrap px-4 py-3 font-black normal-case'

// Sticky cells can sit on top of text from the columns scrolling underneath them. The row tint
// is intentionally translucent, so paint that tint over an opaque white layer inside the cell:
// visually it remains identical to the row, while content below can no longer bleed through.
const POS_TABLE_STICKY_OPAQUE_BACKGROUND_CLASS =
  "md:isolate md:before:pointer-events-none md:before:absolute md:before:inset-0 md:before:z-[-2] md:before:bg-white md:before:content-[''] md:after:pointer-events-none md:after:absolute md:after:inset-0 md:after:z-[-1] md:after:bg-inherit md:after:content-['']"

export const POS_TABLE_STICKY_ACTION_HEADER_CLASS =
  `w-[1%] whitespace-nowrap md:sticky md:right-0 md:z-[3] md:bg-inherit md:shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] ${POS_TABLE_STICKY_OPAQUE_BACKGROUND_CLASS}`

export const POS_TABLE_STICKY_ACTION_CELL_CLASS =
  `w-[1%] whitespace-nowrap md:sticky md:right-0 md:z-[2] md:bg-inherit md:shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] ${POS_TABLE_STICKY_OPAQUE_BACKGROUND_CLASS}`
