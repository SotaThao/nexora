/**
 * Validation and transformation helpers for Manual Payment / Tip Activity
 */

export interface ValidateActivityParams {
  amount: string
  paymentMethod: string
  date: string
  mode: 'payment' | 'tip'
  selectedStaffId?: string
  todayStr?: string
}

export interface ActivityValidationResult {
  isValid: boolean
  errors: {
    amount?: string
    paymentMethod?: string
    date?: string
    staff?: string
  }
}

export function validateManualActivity({
  amount,
  paymentMethod,
  date,
  mode,
  selectedStaffId,
  todayStr = new Date().toISOString().split('T')[0],
}: ValidateActivityParams): ActivityValidationResult {
  const errors: ActivityValidationResult['errors'] = {}
  const parsedAmount = parseFloat(amount)

  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    errors.amount = 'Amount must be greater than $0.00'
  }

  if (!paymentMethod || paymentMethod.trim() === '') {
    errors.paymentMethod = 'Please select a payment method'
  }

  if (!date || date.trim() === '') {
    errors.date = 'Please select a transaction date'
  } else if (date > todayStr) {
    errors.date = 'Transaction date cannot be in the future'
  }

  if (mode === 'tip' && (!selectedStaffId || selectedStaffId.trim() === '')) {
    errors.staff = 'Please select the staff recipient'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function formatManualTransactionRecord({
  amount,
  paymentMethod,
  date,
  staffName,
  staffId,
  touchpoint = 'Manual Entry',
  note,
  prefix = 'TXN',
}: {
  amount: number
  paymentMethod: string
  date: string
  staffName?: string
  staffId?: string | null
  touchpoint?: string
  note?: string
  prefix?: 'TXN' | 'TIP'
}) {
  const now = new Date()
  const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
  const randomSuffix = Math.floor(1000 + Math.random() * 9000)

  return {
    id: `${prefix}-${randomSuffix}`,
    amount,
    paymentMethod,
    dateTime: `${date} ${timeStr}`,
    staffName: staffName || '—',
    staffId: staffId || null,
    touchpoint,
    status: 'Success',
    isManual: true,
    note: note ? note.trim() : '',
  }
}
