// Pure formatting rule for the free-text "Mức trả cụ thể / Mức mong muốn" salary
// field on a DemoJob. Replaces `displayableSalary()` (CommunityJobDetail.tsx),
// which only ever showed the raw string when it happened to contain "/tuần" or
// "thương lượng" — truncating everything else in the card's badge row.
//
// Rule (docs/community-jobs-ui-improvement-plan.md "Card (D1 = 1B)"):
// - a money range ("$A - $B", separators "-"/"–"/"đến", spaces optional, the
//   second "$" optional) -> `$A-B` (unit/suffix dropped — the form's convention
//   is weekly, so no unit is shown);
// - otherwise a single "$A" (optionally followed by "+") -> `$A+`;
// - otherwise any other non-empty text -> "Thỏa thuận";
// - empty/whitespace/null/undefined -> null (no chip rendered).
export function formatSalaryChip(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? '').trim()
  if (!trimmed) return null

  const rangeMatch = trimmed.match(/\$\s?([\d,]+)\s*(?:-|–|đến)\s*\$?\s?([\d,]+)/)
  if (rangeMatch) return `$${rangeMatch[1]}-${rangeMatch[2]}`

  const singleMatch = trimmed.match(/\$\s?([\d,]+)\+?/)
  if (singleMatch) return `$${singleMatch[1]}+`

  return 'Thỏa thuận'
}
