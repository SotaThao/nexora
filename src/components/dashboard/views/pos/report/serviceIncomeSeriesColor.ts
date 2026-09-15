/**
 * Deterministic bar colour for the Service Income charts, derived from the row's own display name.
 *
 * Why name-seeded rather than a fixed palette indexed by rank: the two charts sort independently
 * (net revenue vs completed count), so a rank-indexed palette gives one service two different
 * colours — and past the palette's length it gives some rows no colour at all. Seeding off the name
 * means a service keeps one colour in both charts, across period changes, and however many rows the
 * salon has.
 *
 * The hash picks only the hue. Lightness and chroma are pinned to the band that reads correctly on
 * the light card surface (OKLCH L 0.52-0.70, C >= 0.10), so a generated colour can never come out
 * near-white, near-black, or washed to grey the way a raw `hash % 0xFFFFFF` does.
 *
 * Honest limit: hue is a circle. Around 8-10 colours on screen at once is where a reader stops being
 * able to tell two of them apart, and a salon with 121 services puts adjacent hues ~3 degrees apart.
 * Colour here is a stable handle for one row, not a legend the reader decodes — identity is carried
 * by the name and value printed on every bar.
 */

/** FNV-1a. Small, stable across runs, and spreads similar strings ("... — Long" / "... — Short"). */
function hashString(value: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Three lightness steps, so two names that land on neighbouring hues still separate a little. */
const LIGHTNESS_STEPS = [0.55, 0.64, 0.7] as const
const BASE_CHROMA = 0.15

function gammaEncode(channel: number): number {
  return channel <= 0.0031308
    ? 12.92 * channel
    : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055
}

/** OKLab -> linear sRGB (Ottosson's matrices). */
function oklabToLinearSrgb(lightness: number, aAxis: number, bAxis: number) {
  const l = (lightness + 0.3963377774 * aAxis + 0.2158037573 * bAxis) ** 3
  const m = (lightness - 0.1055613458 * aAxis - 0.0638541728 * bAxis) ** 3
  const s = (lightness - 0.0894841775 * aAxis - 1.291485548 * bAxis) ** 3
  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

function toHex(channel: number): string {
  return Math.round(Math.min(1, Math.max(0, channel)) * 255)
    .toString(16)
    .padStart(2, '0')
}

/**
 * Converts one OKLCH triple to a hex string, walking chroma down until the colour actually fits in
 * sRGB. Clamping out-of-gamut channels instead would silently distort the hue.
 */
function oklchToHex(lightness: number, chroma: number, hueRadians: number): string {
  let fitted = chroma
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const { r, g, b } = oklabToLinearSrgb(
      lightness,
      fitted * Math.cos(hueRadians),
      fitted * Math.sin(hueRadians),
    )
    const inGamut = [r, g, b].every((channel) => channel >= -0.0005 && channel <= 1.0005)
    if (inGamut || fitted <= 0.02) {
      return `#${toHex(gammaEncode(r))}${toHex(gammaEncode(g))}${toHex(gammaEncode(b))}`
    }
    fitted *= 0.9
  }
  return '#7a8296'
}

/** Hue in tenths of a degree; the lightness step reads a different slice of the hash so hue and
 *  lightness don't move together and strand a third of the wheel on one step. */
function seededColor(hash: number, hueOffsetDegrees: number, lightnessOffset: number): string {
  const hue = ((hash % 3600) / 10 + hueOffsetDegrees) % 360
  const lightness =
    LIGHTNESS_STEPS[((hash >>> 9) + lightnessOffset) % LIGHTNESS_STEPS.length]
  return oklchToHex(lightness, BASE_CHROMA, (hue * Math.PI) / 180)
}

/** The colour a name maps to before any de-duplication. */
export function serviceIncomeSeriesColor(seed: string): string {
  return seededColor(hashString(seed), 0, 0)
}

/**
 * Builds the label -> colour map for one report.
 *
 * Seeding alone is not quite enough to promise distinct colours: two different hues 0.1 degrees
 * apart round to the same 8-bit hex, so a 121-row salon still produced ~5 duplicate pairs in
 * testing. So a label whose seeded colour is already taken walks the hue wheel in 7.5 degree steps
 * (then across the lightness steps) until it finds a free one.
 *
 * Call this ONCE per report over the server's row order and hand the result to both charts — that
 * is what keeps a service the same colour in the revenue chart and the count chart, which sort
 * differently. Deriving it per chart would defeat the point.
 */
export function buildServiceIncomeColorMap(labels: Iterable<string>): Map<string, string> {
  const byLabel = new Map<string, string>()
  const taken = new Set<string>()

  for (const label of labels) {
    if (byLabel.has(label)) continue
    const hash = hashString(label)

    let color = seededColor(hash, 0, 0)
    // 48 hue steps x the lightness steps covers the whole wheel on every step before giving up.
    outer: for (let hueStep = 0; hueStep < 48; hueStep += 1) {
      for (let lightnessStep = 0; lightnessStep < LIGHTNESS_STEPS.length; lightnessStep += 1) {
        const candidate = seededColor(hash, hueStep * 7.5, lightnessStep)
        if (!taken.has(candidate)) {
          color = candidate
          break outer
        }
      }
    }

    taken.add(color)
    byLabel.set(label, color)
  }

  return byLabel
}
