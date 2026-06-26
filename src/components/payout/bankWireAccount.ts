export interface BankWireAccountDetails {
  beneficiaryName: string
  bankName: string
  routingNumber: string
  accountNumber: string
  bankAddress: string
  city: string
  state: string
  zipCode: string
  country: string
}

export const EMPTY_BANK_WIRE_ACCOUNT: BankWireAccountDetails = {
  beneficiaryName: '',
  bankName: '',
  routingNumber: '',
  accountNumber: '',
  bankAddress: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
}

const BANK_WIRE_PREFIX = 'bankwire:'

export function parseBankWireAccount(value?: string | null): BankWireAccountDetails {
  if (!value) return { ...EMPTY_BANK_WIRE_ACCOUNT }
  const raw = String(value).trim()
  if (!raw) return { ...EMPTY_BANK_WIRE_ACCOUNT }

  try {
    const parsed = JSON.parse(raw.startsWith(BANK_WIRE_PREFIX) ? raw.slice(BANK_WIRE_PREFIX.length) : raw)
    return {
      ...EMPTY_BANK_WIRE_ACCOUNT,
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
    }
  } catch {
    return {
      ...EMPTY_BANK_WIRE_ACCOUNT,
      accountNumber: raw,
    }
  }
}

export function serializeBankWireAccount(details: BankWireAccountDetails): string {
  return `${BANK_WIRE_PREFIX}${JSON.stringify(details)}`
}

export function isBankWireAccountComplete(value?: string | null): boolean {
  const details = parseBankWireAccount(value)
  return Object.values(details).every((field) => field.trim().length > 0)
}

export function getBankWireBeneficiaryName(value?: string | null): string {
  return parseBankWireAccount(value).beneficiaryName.trim()
}

export function formatBankWireAccountSummary(value?: string | null): string {
  const details = parseBankWireAccount(value)
  const bankName = details.bankName.trim()
  const routingNumber = details.routingNumber.trim()
  const accountNumber = details.accountNumber.trim()
  if (!bankName && !routingNumber && !accountNumber) return ''
  return [bankName, routingNumber, accountNumber].filter(Boolean).join(' / ')
}

/** Human-readable payout account label for list UI (bank wire → beneficiary name). */
export function formatPaymentMethodAccountDisplay(
  uiKey: string,
  accountInfo?: string | null,
): string {
  const raw = String(accountInfo || '').trim()
  if (!raw) return ''

  if (uiKey === 'bankwire' || raw.startsWith(BANK_WIRE_PREFIX)) {
    const beneficiaryName = getBankWireBeneficiaryName(raw)
    if (beneficiaryName) return beneficiaryName
    return formatBankWireAccountSummary(raw) || raw
  }

  return raw
}
