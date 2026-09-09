/**
 * Loads Playfair Display for the certificate canvas.
 *
 * The design sets the sheet in a high-contrast serif — no system font is close: Times italic has
 * far lower stroke contrast and narrower letterforms, and Georgia additionally renders numbers as
 * old-style figures. Canvas can only draw a font the document has actually loaded, so matching the
 * design means shipping the font.
 *
 * Three decisions worth keeping:
 *
 *  - **Self-hosted, not Google Fonts.** The public certificate page is reached by scanning a QR off
 *    paper. Blocking the drawing on a third-party request would put the render at the mercy of
 *    another origin's availability, and drag a third party into a page anyone can open. The files
 *    are the same woff2 subsets Google serves; Playfair Display is SIL OFL, so hosting them is
 *    allowed.
 *  - **Loaded on demand, per subset.** Nothing is registered until a certificate is drawn, so no
 *    other page in the app pays for it. `document.fonts.load(font, text)` is given the actual text,
 *    which lets the browser resolve the `unicode-range`s and fetch only the subsets that text needs
 *    — an ASCII name pulls ~38KB per style, a Vietnamese one adds ~9KB.
 *  - **Never fatal.** A failed or unsupported load resolves to `false` and the renderer falls back
 *    to its system-serif stack. A certificate in the wrong serif is a cosmetic miss; a certificate
 *    that refuses to draw is a broken page.
 *
 * A variable-font optical-size axis was tried here and reverted: canvas rendered some glyphs with
 * missing strokes when `variationSettings` pinned a non-default `opsz`, so the axis is left alone —
 * every weight below is drawn from the font's default instance.
 */
export const CERTIFICATE_FONT_FAMILY = 'Playfair Display'

/**
 * Fallbacks in order of how close they get. Times before Georgia because Georgia's old-style
 * figures make the sheet's numbers ("94 / 100") sit at uneven heights.
 */
export const CERTIFICATE_FONT_FALLBACK = '"Times New Roman", Times, Georgia, serif'

/** Variable font: one file covers every weight the sheet uses. */
const WEIGHT_RANGE = '400 900'

/**
 * Lining figures. Playfair Display defaults to *old-style* figures — the 9, 4 and 7 drop below the
 * baseline and the 0 and 1 only reach x-height — so "94 / 100" and "September 7, 2026" come out
 * visibly uneven, while the design has every digit at cap height. `lnum` switches to the lining
 * set, which was verified to change the rendered glyphs in canvas, not just the descriptor.
 *
 * A browser that ignores `featureSettings` on FontFace falls back to old-style figures: a cosmetic
 * miss on the numbers, not a broken sheet.
 */
const FEATURE_SETTINGS = '"lnum"'

/**
 * The subsets Google serves for this family, minus the ones a member name and the meta values can
 * never need (cyrillic, greek). Ranges are copied verbatim from the Google Fonts CSS so the
 * browser's subset resolution matches what the files actually contain.
 */
const SUBSETS: ReadonlyArray<{ style: 'normal' | 'italic'; subset: string; unicodeRange: string }> =
  [
    {
      style: 'normal',
      subset: 'latin',
      unicodeRange:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
    {
      style: 'normal',
      subset: 'latin-ext',
      unicodeRange:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
    {
      style: 'normal',
      subset: 'vietnamese',
      unicodeRange:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    },
    {
      style: 'italic',
      subset: 'latin',
      unicodeRange:
        'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
    },
    {
      style: 'italic',
      subset: 'latin-ext',
      unicodeRange:
        'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
    },
    {
      style: 'italic',
      subset: 'vietnamese',
      unicodeRange:
        'U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB',
    },
  ]

/** Registration is idempotent: the faces are added to the document once per page load. */
let registered = false

function register(): boolean {
  if (typeof document === 'undefined' || !document.fonts || typeof FontFace === 'undefined') {
    return false
  }
  if (registered) return true
  for (const { style, subset, unicodeRange } of SUBSETS) {
    const face = new FontFace(
      CERTIFICATE_FONT_FAMILY,
      `url(/fonts/playfair-display-${style}-${subset}.woff2) format('woff2')`,
      { style, weight: WEIGHT_RANGE, unicodeRange, featureSettings: FEATURE_SETTINGS },
    )
    document.fonts.add(face)
  }
  registered = true
  return true
}

/**
 * Ensures the family can render `text` in the given style, and reports whether it is safe to draw
 * with. Resolves `false` rather than throwing when the font is unavailable, so the caller can fall
 * back instead of failing.
 *
 * @param specs one entry per distinct style the sheet draws — the sheet uses italic for the
 *   member's name and upright for everything else, and each style is a separate file.
 */
export async function loadCertificateFont(
  specs: ReadonlyArray<{ style: 'normal' | 'italic'; weight: number; text: string }>,
): Promise<boolean> {
  if (!register()) return false
  try {
    await Promise.all(
      specs
        .filter((spec) => spec.text.trim().length > 0)
        .map((spec) =>
          document.fonts.load(
            `${spec.style} ${spec.weight} 16px "${CERTIFICATE_FONT_FAMILY}"`,
            spec.text,
          ),
        ),
    )
    // `load` resolves even when nothing matched, so the answer comes from `check`.
    return specs
      .filter((spec) => spec.text.trim().length > 0)
      .every((spec) =>
        document.fonts.check(
          `${spec.style} ${spec.weight} 16px "${CERTIFICATE_FONT_FAMILY}"`,
          spec.text,
        ),
      )
  } catch {
    return false
  }
}
