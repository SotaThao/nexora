const MONEY_RANGE_PATTERN = /\$\s*([\d,]+(?:\.\d+)?)\s*(?:-|–|—|to|đến)\s*\$?\s*([\d,]+(?:\.\d+)?)/i;
const MONEY_AMOUNT_PATTERN = /\$\s*([\d,]+(?:\.\d+)?)(\s*\+)?/;
const NON_WEEKLY_PAY_UNIT_PATTERN = /(?:\/\s*(?:hour|hr|gio|day|ngay|month|thang|year|nam)\b|\bper\s+(?:hour|day|month|year)\b|\b(?:hourly|daily|monthly|yearly|annually)\b|\bmoi\s+(?:gio|ngay|thang|nam)\b)/;

function normalizePayText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function formatSalaryCardLabel(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const normalized = normalizePayText(trimmed);
  if (NON_WEEKLY_PAY_UNIT_PATTERN.test(normalized)) return null;

  const rangeMatch = trimmed.match(MONEY_RANGE_PATTERN);
  if (rangeMatch) return `$${rangeMatch[1]}-$${rangeMatch[2]}`;

  const amountMatch = trimmed.match(MONEY_AMOUNT_PATTERN);
  if (amountMatch) return `$${amountMatch[1]}${amountMatch[2] ? "+" : ""}`;

  if (/\bnegotiable\b|\bthoa thuan\b|\bthuong luong\b/.test(normalized)) {
    return "Thương lượng";
  }

  return null;
}
