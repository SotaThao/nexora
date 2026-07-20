/** E.164 dial codes used across phone inputs. */
export enum PhoneDialCode {
  US = '+1',
  Vietnam = '+84',
}

export const PhoneFormatSeparator = {
  /** Narrow gap between digit groups in national inputs. */
  GroupThin: '\u2009',
  /** US national segment separator. */
  UsSegment: '-',
  /** Generic placeholder separator. */
  PlaceholderDefault: ' ',
} as const

export const PhonePlaceholderSymbol = {
  Digit: 'X',
} as const

export const PhoneNationalLimits = {
  VnE164NationalMaxDigits: 9,
  VnLocalTrunkDigit: '0',
  VnLocalMinDigits: 9,
  VnLocalMaxDigits: 11,
  UsNationalMaxDigits: 10,
  VnNationalWithTrunkMaxDigits: 10,
} as const

/** Group sizes aligned with `formatNationalNumber`. */
export const PhoneNationalGroupPattern = {
  [PhoneDialCode.US]: [3, 3, 4],
  [PhoneDialCode.Vietnam]: [3, 3, 3],
} as const

export const PhoneNationalGroupPatternWithTrunk = {
  [PhoneDialCode.Vietnam]: [4, 3, 3],
} as const

export function buildPhonePlaceholderPattern(
  groupSizes: readonly number[],
  separator: string,
  symbol: string = PhonePlaceholderSymbol.Digit,
): string {
  return groupSizes.map((size) => symbol.repeat(size)).join(separator)
}

export const PhoneNationalPlaceholderPattern = {
  [PhoneDialCode.US]: buildPhonePlaceholderPattern(
    PhoneNationalGroupPattern[PhoneDialCode.US],
    PhoneFormatSeparator.UsSegment,
  ),
  [PhoneDialCode.Vietnam]: buildPhonePlaceholderPattern(
    PhoneNationalGroupPattern[PhoneDialCode.Vietnam],
    PhoneFormatSeparator.GroupThin,
  ),
} as const

export const PHONE_NATIONAL_PLACEHOLDER_DEFAULT = buildPhonePlaceholderPattern(
  PhoneNationalGroupPattern[PhoneDialCode.US],
  PhoneFormatSeparator.PlaceholderDefault,
)

export function buildPhonePlaceholderFromMaxDigits(
  maxDigits: number,
  separator: string = PhoneFormatSeparator.GroupThin,
  symbol: string = PhonePlaceholderSymbol.Digit,
): string {
  if (maxDigits <= 4) return symbol.repeat(maxDigits)

  if (maxDigits <= 7) {
    const head = Math.ceil(maxDigits / 2)
    return `${symbol.repeat(head)}${separator}${symbol.repeat(maxDigits - head)}`
  }

  const tail = Math.ceil(maxDigits / 3)
  const mid = Math.ceil((maxDigits - tail) / 2)
  const head = maxDigits - mid - tail
  return [
    symbol.repeat(head),
    symbol.repeat(mid),
    symbol.repeat(tail),
  ].join(separator)
}

export function isKnownPhoneDialCode(dialCode: string): dialCode is PhoneDialCode {
  return Object.values(PhoneDialCode).includes(dialCode as PhoneDialCode)
}
