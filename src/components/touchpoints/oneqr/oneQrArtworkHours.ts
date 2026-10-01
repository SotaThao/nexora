import type { CheckInPrintDocument, PrintAssets } from '../../dashboard/views/pos/checkinPrint/checkInPrintTypes'

function compactHoursGroup(group: string): string {
  const match = /^(.+?) \((\d{1,2}(?::\d{2})?) (AM|PM) - (\d{1,2}(?::\d{2})?) (AM|PM)\)$/.exec(group)
  if (!match) return group
  const [, days, open, openPeriod, close, closePeriod] = match
  // A shared period still applies to both times; overnight/mixed periods remain explicit.
  const start = openPeriod === closePeriod ? open : `${open}${openPeriod}`
  return `${days} ${start}–${close}${closePeriod}`
}

function balancedHoursLines(groups: string[], count: number, measure: (text: string) => number): string[] {
  let best: string[] = []
  let bestWidth = Infinity
  const visit = (start: number, remaining: number, lines: string[]) => {
    if (remaining === 1) {
      const candidate = [...lines, groups.slice(start).join(' · ')]
      const width = Math.max(...candidate.map(measure))
      if (width < bestWidth) { best = candidate; bestWidth = width }
      return
    }
    for (let end = start + 1; end <= groups.length - remaining + 1; end++) {
      visit(end, remaining - 1, [...lines, groups.slice(start, end).join(' · ')])
    }
  }
  visit(0, count, [])
  return best
}

/** Keep hours in the clear bottom center; long weekly schedules use balanced readable lines. */
export function withOneQrArtworkHours(document: CheckInPrintDocument, assets: PrintAssets, hours: string, color = '#152238'): CheckInPrintDocument {
  const text = hours.toUpperCase()
  const maxWidth = document.widthPt * .64
  const measure = (value: string, size: number) => assets.measureText('inter', value, size)
  let lines = [text]
  let fontSize = 10
  if (measure(text, fontSize) > maxWidth) {
    const groups = text.split(/\s*·\s*/).map(compactHoursGroup)
    const compact = groups.join(' · ')
    fontSize = 12
    lines = [compact]
    if (measure(compact, fontSize) > maxWidth) {
      for (const count of [2, 3]) {
        if (groups.length < count) continue
        const candidate = balancedHoursLines(groups, count, value => measure(value, 12))
        const width = Math.max(...candidate.map(value => measure(value, 12)))
        const fittedSize = Math.min(12, 12 * maxWidth / width)
        lines = candidate
        fontSize = count === 3 ? Math.min(10, fittedSize) : fittedSize
        if (fittedSize >= 10) break
      }
    }
    // Preserve arbitrary legacy text as well; normal EN/VI seven-day schedules fit at 10–12pt.
    fontSize = Math.min(fontSize, ...lines.map(value => 12 * maxWidth / measure(value, 12)))
  }
  const firstBaseline = document.heightPt - (lines.length === 3 ? 18 : 16)
  const lineHeight = lines.length === 3 ? 8 : 12
  return {
    ...document,
    nodes: [
      ...document.nodes,
      { kind: 'text', runs: lines.map((line, index) => ({
        text: line,
        x: (document.widthPt - measure(line, fontSize)) / 2,
        baselineY: firstBaseline + index * lineHeight,
        fontId: 'inter', fontSize, color,
      })) },
    ],
  }
}
