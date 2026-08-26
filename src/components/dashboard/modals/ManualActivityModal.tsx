import React, { useState, useEffect } from 'react'
import { X, DollarSign, Calendar, User, FileText, Check, Plus, AlertCircle } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import CustomSelect from '../../CustomSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'

export interface ManualActivityModalProps {
  open: boolean
  onClose: () => void
  onSave: (activity: {
    amount: number
    paymentMethod: string
    dateTime: string
    staffName?: string
    staffId?: string
    touchpoint?: string
    note?: string
    isManual: boolean
  }) => void
  mode?: 'payment' | 'tip'
  staffList?: Array<{ id?: string; fullName?: string; nickname?: string }>
  touchpoints?: Array<{ id?: string; name?: string }>
}

const PAYMENT_METHOD_OPTIONS = [
  { value: 'Zelle', label: 'Zelle' },
  { value: 'Venmo', label: 'Venmo' },
  { value: 'Cash App', label: 'Cash App' },
  { value: 'Apple Cash', label: 'Apple Cash' },
  { value: 'Crypto', label: 'Crypto' },
  { value: 'Other', label: 'Other' },
]

export default function ManualActivityModal({
  open,
  onClose,
  onSave,
  mode = 'payment',
  staffList = [],
  touchpoints = [],
}: ManualActivityModalProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const [amount, setAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('Zelle')
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('')
  const [note, setNote] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<{
    amount?: string
    paymentMethod?: string
    date?: string
    staff?: string
  }>({})

  // Staff options for dropdown
  const staffOptions = [
    { value: '', label: t('dashboard.activity_log.select_staff') || 'Select staff member...' },
    ...staffList.map((s) => ({
      value: s.id || s.nickname || s.fullName || '',
      label: s.nickname || s.fullName || 'Staff',
    })),
  ]

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setAmount('')
      setPaymentMethod('Zelle')
      setDate(new Date().toISOString().split('T')[0])
      setSelectedStaffId(staffList.length > 0 ? (staffList[0].id || staffList[0].nickname || '') : '')
      setSelectedTouchpoint(touchpoints.length > 0 ? (touchpoints[0].name || '') : 'Manual Entry')
      setNote('')
      setErrors({})
    }
  }, [open, staffList, touchpoints])

  // Keyboard navigation (Escape to close)
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const todayStr = new Date().toISOString().split('T')[0]

  const validate = () => {
    const newErrors: typeof errors = {}
    const parsedAmount = parseFloat(amount)

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      newErrors.amount = t('dashboard.activity_log.error_amount_invalid') || 'Amount must be greater than $0.00'
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = t('dashboard.activity_log.error_method_required') || 'Please select a payment method'
    }

    if (!date) {
      newErrors.date = t('dashboard.activity_log.error_date_required') || 'Please select a transaction date'
    } else if (date > todayStr) {
      newErrors.date = t('dashboard.activity_log.error_date_future') || 'Transaction date cannot be in the future'
    }

    if (mode === 'tip' && !selectedStaffId) {
      newErrors.staff = t('dashboard.activity_log.error_staff_required') || 'Please select the staff recipient'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!validate()) return

    const selectedStaffMember = staffList.find((s) => (s.id || s.nickname) === selectedStaffId)
    const staffDisplayName = selectedStaffMember ? (selectedStaffMember.nickname || selectedStaffMember.fullName) : selectedStaffId

    const now = new Date()
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')

    onSave({
      amount: parseFloat(amount),
      paymentMethod,
      dateTime: `${date} ${timeStr}`,
      staffName: staffDisplayName || (mode === 'tip' ? 'Staff' : '—'),
      staffId: selectedStaffId || undefined,
      touchpoint: selectedTouchpoint || 'Manual Entry',
      note: note.trim() || undefined,
      isManual: true,
    })

    showToast(
      mode === 'tip'
        ? `Tip of $${parseFloat(amount).toFixed(2)} recorded successfully`
        : `Payment of $${parseFloat(amount).toFixed(2)} recorded successfully`,
      'success'
    )
    onClose()
  }

  const isTipMode = mode === 'tip'
  const title = isTipMode ? 'Add Tip Activity' : 'Add Payment Activity'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nexoraText/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-nexoraBorder dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] max-h-[90dvh] transition-all transform scale-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-activity-modal-title"
      >
        {/* Modal Header (Fixed) */}
        <div className="flex items-center justify-between border-b border-nexoraRule dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase text-nexoraBrand tracking-wider block">
              {isTipMode ? 'Tips Ledger' : 'Payment Reports'}
            </span>
            <h2 id="manual-activity-modal-title" className="text-base font-extrabold text-nexoraText dark:text-white mt-0.5">
              {title}
            </h2>
          </div>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* Informational Banner */}
          <div className="flex items-start gap-2.5 rounded-lg bg-nexoraBrandSoft/60 dark:bg-indigo-950/40 p-3 border border-nexoraBrand/20 text-xs text-nexoraBrand dark:text-indigo-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-nexoraBrand" />
            <div>
              Transactions created here are marked with a <strong className="font-bold">Manual</strong> tag to clearly distinguish from automatic POS transactions.
            </div>
          </div>

          <form id="manual-activity-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Amount & Method Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Amount */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted dark:text-slate-400 block mb-1">
                  Amount (USD) <span className="text-nexoraDanger">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 font-bold text-sm text-nexoraMuted dark:text-slate-400 pointer-events-none">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    autoFocus
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value)
                      if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }))
                    }}
                    className={`h-11 w-full rounded-lg border pl-7 pr-3 text-sm sm:text-sm text-nexoraText dark:text-white bg-white dark:bg-slate-800 outline-none transition-colors ${
                      errors.amount
                        ? 'border-nexoraDanger focus:border-nexoraDanger'
                        : 'border-nexoraBorder dark:border-slate-700 focus:border-nexoraBrand'
                    }`}
                  />
                </div>
                {errors.amount && (
                  <p className="mt-1 text-[11px] font-semibold text-nexoraDanger">{errors.amount}</p>
                )}
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted dark:text-slate-400 block mb-1">
                  Payment Method <span className="text-nexoraDanger">*</span>
                </label>
                <CustomSelect
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value)
                    if (errors.paymentMethod) setErrors((prev) => ({ ...prev, paymentMethod: undefined }))
                  }}
                  options={PAYMENT_METHOD_OPTIONS}
                  buttonClass={`h-11 text-sm ${
                    errors.paymentMethod ? 'border-nexoraDanger' : 'border-nexoraBorder dark:border-slate-700'
                  }`}
                />
                {errors.paymentMethod && (
                  <p className="mt-1 text-[11px] font-semibold text-nexoraDanger">{errors.paymentMethod}</p>
                )}
              </div>

            </div>

            {/* Transaction Date */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted dark:text-slate-400 block mb-1">
                Transaction Date <span className="text-nexoraDanger">*</span>
              </label>
              <input
                type="date"
                max={todayStr}
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }))
                }}
                className={`h-11 w-full rounded-lg border px-3 text-sm text-nexoraText dark:text-white bg-white dark:bg-slate-800 outline-none transition-colors ${
                  errors.date
                    ? 'border-nexoraDanger focus:border-nexoraDanger'
                    : 'border-nexoraBorder dark:border-slate-700 focus:border-nexoraBrand'
                }`}
              />
              {errors.date && (
                <p className="mt-1 text-[11px] font-semibold text-nexoraDanger">{errors.date}</p>
              )}
            </div>

            {/* Staff Recipient (ONLY visible in Tip mode) */}
            {isTipMode && (
              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted dark:text-slate-400 block mb-1">
                  Staff Recipient <span className="text-nexoraDanger">*</span>
                </label>
                <CustomSelect
                  value={selectedStaffId}
                  onChange={(e) => {
                    setSelectedStaffId(e.target.value)
                    if (errors.staff) setErrors((prev) => ({ ...prev, staff: undefined }))
                  }}
                  options={staffOptions}
                  buttonClass={`h-11 text-sm ${
                    errors.staff ? 'border-nexoraDanger' : 'border-nexoraBorder dark:border-slate-700'
                  }`}
                />
                {errors.staff && (
                  <p className="mt-1 text-[11px] font-semibold text-nexoraDanger">{errors.staff}</p>
                )}
                <p className="mt-1 text-[10px] text-nexoraSubtle">
                  Assigned staff will see this tip in their payroll and personal dashboard.
                </p>
              </div>
            )}

            {/* Note / Context (Optional) */}
            <div>
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted dark:text-slate-400 block mb-1">
                Note / Description <span className="text-nexoraSubtle font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Customer paid tech directly via salon Venmo QR..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border border-nexoraBorder dark:border-slate-700 p-2.5 text-sm text-nexoraText dark:text-white bg-white dark:bg-slate-800 outline-none focus:border-nexoraBrand transition-colors resize-y"
              />
            </div>

          </form>

        </div>

        {/* Modal Footer (Fixed) */}
        <div className="flex items-center justify-end gap-2 border-t border-nexoraRule dark:border-slate-800 px-6 py-4 bg-white dark:bg-slate-900 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-nexoraBorder dark:border-slate-700 px-4 py-2 text-xs font-bold text-nexoraMuted dark:text-slate-300 hover:bg-nexoraSurfaceMuted dark:hover:bg-slate-800 transition min-h-[40px]"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark transition min-h-[40px] shadow-sm"
          >
            <Check className="h-4 w-4" />
            Save Activity
          </button>
        </div>

      </div>
    </div>
  )
}
