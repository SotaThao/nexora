import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import { Copy, Loader2, Save, Upload, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  ALL_PAYOUT_TYPE_FLAGS,
  MAX_PAYOUT_EVIDENCE_URLS,
  MERCHANT_CREATE_PAYOUT_METHOD_TYPES,
  PayoutMethodType,
  PayoutType,
  hasPayoutType,
  isPayoutTypesMaskValid,
  togglePayoutType,
  normalizePayoutMethodType,
  type PayoutMethodTypeValue,
} from '../../../data/payoutConstants'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useCreateMerchantPayout,
  useUpdateMerchantPayout,
} from '../../../data/hooks/useMerchantPayouts'
import { imagesRepository } from '../../../data/repositories/images'
import type { PayoutRecord, UnpaidTipDebtRecord, StaffMember } from '../../../types/domain'
import { getApiErrorCode } from '../../../types/domain'
import { formatCurrency } from '../../dashboard/utils'
import CustomSelect from '../../CustomSelect'
import { payoutMethodToUiKey, getStaffAvailablePayoutMethods, isStaffPayoutMethodAvailable, resolvePayoutStaffProfileId, sortPayoutMethodsCashLast } from '../../../utils/payoutDisplay'
import { formatLocalDateIso } from '../../../utils/localDate'

const PAYOUT_AMOUNT_MAX = 999_999.99

const MAX_EVIDENCE_FILES = 3
const EVIDENCE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.svg'])
const METHOD_I18N: Record<string, string> = {
  [PayoutMethodType.Cash]: 'dashboard.tips.payouts_manager.method_cash',
  [PayoutMethodType.BankTransfer]: 'dashboard.tips.payouts_manager.method_bank',
  [PayoutMethodType.Zelle]: 'dashboard.tips.payouts_manager.method_zelle',
  [PayoutMethodType.CashApp]: 'dashboard.tips.payouts_manager.method_cashapp',
  [PayoutMethodType.Venmo]: 'dashboard.tips.payouts_manager.method_venmo',
  [PayoutMethodType.Other]: 'dashboard.tips.payouts_manager.method_other',
}

const TYPE_I18N: Record<number, string> = {
  [PayoutType.Tip]: 'dashboard.tips.payouts_manager.type_tip',
  [PayoutType.Salary]: 'dashboard.tips.payouts_manager.type_salary',
  [PayoutType.Bonus]: 'dashboard.tips.payouts_manager.type_bonus',
  [PayoutType.Other]: 'dashboard.tips.payouts_manager.type_other',
}

const CREATE_PAYOUT_TYPE_FLAGS = [PayoutType.Tip] as const

function defaultPeriodDates() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return { periodStart: formatLocalDateIso(start), periodEnd: formatLocalDateIso(end) }
}

function resolveStaffAccount(staff: StaffMember | null, method: string): string {
  if (!staff) return ''
  const uiKey = payoutMethodToUiKey(method)
  const configs = staff.payoutConfigs as Record<string, { enabled?: boolean; value?: string }> | undefined
  const accounts = staff.paymentAccounts as Record<string, string> | undefined
  return accounts?.[uiKey]?.trim() || configs?.[uiKey]?.value?.trim() || ''
}

function isEvidenceImageFile(file: File): boolean {
  if (file.type?.startsWith('image/')) return true
  const name = file.name?.toLowerCase() ?? ''
  const dot = name.lastIndexOf('.')
  if (dot < 0) return false
  return EVIDENCE_IMAGE_EXTENSIONS.has(name.slice(dot))
}

function validatePayoutAmount(display: string, t: (key: string) => string): string | null {
  const trimmed = display.trim()
  if (!trimmed) {
    return t('dashboard.tips.payouts_manager.amount_required')
  }
  const parsed = parseDirectPaymentAmountInput(display)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return t(getErrorI18nKey('PAYOUT_AMOUNT_MUST_BE_POSITIVE'))
  }
  return null
}

function validatePayoutPeriod(periodStart: string, periodEnd: string, t: (key: string) => string): string | null {
  if (!periodStart || !periodEnd) return null
  if (periodStart > periodEnd) {
    return t(getErrorI18nKey('PAYOUT_PERIOD_START_BEFORE_END'))
  }
  return null
}

export default function CreatePayoutModal({
  isOpen,
  onClose,
  staffList,
  unpaidDebts,
  initialStaffProfileId,
  editingPayout = null,
}: {
  isOpen: boolean
  onClose: () => void
  staffList: StaffMember[]
  unpaidDebts: UnpaidTipDebtRecord[]
  initialStaffProfileId?: string | null
  editingPayout?: PayoutRecord | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createMutation = useCreateMerchantPayout()
  const updateMutation = useUpdateMerchantPayout()
  const isEditing = Boolean(editingPayout)

  const eligibleStaff = useMemo(
    () => staffList.filter((s) => s.staffProfileId && (s.isActive || s.status === 'Active')),
    [staffList],
  )

  const staffSelectOptions = useMemo(() => {
    const options = eligibleStaff.map((staff) => ({
      value: staff.staffProfileId as string,
      label: `${(staff.displayName || staff.fullName || staff.nickname) as string}${staff.staffCode ? ` (${staff.staffCode})` : ''}`,
    }))

    if (editingPayout) {
      const resolvedStaffProfileId = resolvePayoutStaffProfileId(editingPayout, staffList)
      if (
        resolvedStaffProfileId
        && !options.some((option) => option.value === resolvedStaffProfileId)
      ) {
        options.unshift({
          value: resolvedStaffProfileId,
          label: `${editingPayout.staffDisplayName}${editingPayout.staffCode ? ` (${editingPayout.staffCode})` : ''}`,
        })
      }
    }

    return options
  }, [eligibleStaff, editingPayout, staffList])

  const payoutMethodOptions = useMemo(() => {
    const methods = [...MERCHANT_CREATE_PAYOUT_METHOD_TYPES]
    if (editingPayout) {
      const method = normalizePayoutMethodType(editingPayout.payoutMethodType)
      if (!methods.includes(method)) {
        methods.push(method)
      }
    }
    return sortPayoutMethodsCashLast(methods)
  }, [editingPayout])

  const debtByStaffId = useMemo(() => {
    const map = new Map<string, UnpaidTipDebtRecord>()
    unpaidDebts.forEach((row) => map.set(row.staffProfileId, row))
    return map
  }, [unpaidDebts])

  const [staffProfileId, setStaffProfileId] = useState('')
  const [payoutMethodType, setPayoutMethodType] = useState<string>(PayoutMethodType.Zelle)
  const [amount, setAmount] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [periodError, setPeriodError] = useState<string | null>(null)
  const [payoutTypesMask, setPayoutTypesMask] = useState(PayoutType.Tip)
  const [periodStart, setPeriodStart] = useState(defaultPeriodDates().periodStart)
  const [periodEnd, setPeriodEnd] = useState(defaultPeriodDates().periodEnd)
  const [notes, setNotes] = useState('')
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([])
  const [evidencePreviews, setEvidencePreviews] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const selectedStaff =
    staffList.find((s) => s.staffProfileId === staffProfileId)
    ?? eligibleStaff.find((s) => s.staffProfileId === staffProfileId)
    ?? null
  const availablePayoutMethods = useMemo(
    () => getStaffAvailablePayoutMethods(selectedStaff),
    [selectedStaff],
  )
  const unpaidDebt = staffProfileId ? debtByStaffId.get(staffProfileId) : null
  const staffAccount =
    isEditing && editingPayout?.staffPaymentAccountInfo?.trim()
      ? editingPayout.staffPaymentAccountInfo.trim()
      : resolveStaffAccount(selectedStaff, payoutMethodType)
  const isSaving = createMutation.isPending || updateMutation.isPending || isUploading
  const maxEvidenceCount = Math.min(MAX_EVIDENCE_FILES, MAX_PAYOUT_EVIDENCE_URLS)
  const canAddEvidence = evidenceUrls.length < maxEvidenceCount && !isUploading

  useEffect(() => {
    if (!isOpen) return
    if (editingPayout) {
      setStaffProfileId(resolvePayoutStaffProfileId(editingPayout, staffList))
      setPayoutMethodType(normalizePayoutMethodType(editingPayout.payoutMethodType))
      setAmount(formatUsdInputAmount(editingPayout.amount))
      setAmountError(null)
      setPeriodError(null)
      setPayoutTypesMask(editingPayout.payoutTypes || PayoutType.Tip)
      setPeriodStart(editingPayout.periodStart)
      setPeriodEnd(editingPayout.periodEnd)
      setNotes(editingPayout.notes ?? '')
      setEvidenceUrls(editingPayout.evidenceUrls ?? [])
      setEvidencePreviews(editingPayout.evidenceUrls ?? [])
      setEvidenceError(null)
      setIsDragOver(false)
      return
    }
    const defaults = defaultPeriodDates()
    const preferredStaffProfileId =
      initialStaffProfileId
      && eligibleStaff.some((staff) => staff.staffProfileId === initialStaffProfileId)
        ? initialStaffProfileId
        : eligibleStaff[0]?.staffProfileId ?? ''
    setStaffProfileId(preferredStaffProfileId)
    setPayoutMethodType(PayoutMethodType.Zelle)
    setAmount('')
    setAmountError(null)
    setPeriodError(null)
    setPayoutTypesMask(PayoutType.Tip)
    setPeriodStart(defaults.periodStart)
    setPeriodEnd(defaults.periodEnd)
    setNotes('')
    setEvidenceUrls([])
    setEvidencePreviews([])
    setEvidenceError(null)
    setIsDragOver(false)
  }, [isOpen, editingPayout, staffList, eligibleStaff, initialStaffProfileId])

  useEffect(() => {
    if (!isOpen || isEditing || !eligibleStaff.length) return
    setStaffProfileId((current) => current || (eligibleStaff[0]?.staffProfileId ?? ''))
  }, [isOpen, isEditing, eligibleStaff])

  useEffect(() => {
    if (!isOpen || isEditing || !selectedStaff) return
    setPayoutMethodType((current) => {
      if (isStaffPayoutMethodAvailable(selectedStaff, current as PayoutMethodTypeValue)) {
        return current
      }
      return availablePayoutMethods[0] ?? PayoutMethodType.Zelle
    })
  }, [isOpen, isEditing, selectedStaff, availablePayoutMethods])

  useEffect(() => {
    if (isOpen) return
    setEvidencePreviews((prev) => {
      prev.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
      return prev
    })
  }, [isOpen])

  if (!isOpen) return null

  const payoutTypeOptions = isEditing ? ALL_PAYOUT_TYPE_FLAGS : CREATE_PAYOUT_TYPE_FLAGS

  const isPayoutMethodSelectable = (method: string) => {
    if (isEditing && normalizePayoutMethodType(editingPayout?.payoutMethodType) === method) {
      return true
    }
    return isStaffPayoutMethodAvailable(selectedStaff, method as PayoutMethodTypeValue)
  }

  const resolvedPayoutTypes = isEditing ? payoutTypesMask : PayoutType.Tip

  const handleCopyAccount = async () => {
    if (!staffAccount) return
    try {
      await navigator.clipboard.writeText(staffAccount)
      showToast(t('dashboard.tips.payouts_manager.account_copied'), 'success')
    } catch {
      showToast(t('errors.unknown_error'), 'error')
    }
  }

  const reportEvidenceInvalid = () => {
    const message = t('dashboard.tips.payouts_manager.evidence_image_only')
    setEvidenceError(message)
    showToast(message, 'error')
  }

  const handleFiles = async (files: FileList | File[]) => {
    const picked = Array.from(files)
    if (!picked.length) return

    const validFiles = picked.filter(isEvidenceImageFile)
    const hasInvalidFiles = validFiles.length < picked.length

    if (!validFiles.length) {
      reportEvidenceInvalid()
      return
    }

    if (hasInvalidFiles) {
      reportEvidenceInvalid()
    } else {
      setEvidenceError(null)
    }

    const remaining = maxEvidenceCount - evidenceUrls.length
    if (remaining <= 0) {
      showToast(t('dashboard.tips.payouts_manager.evidence_max', { max: MAX_EVIDENCE_FILES }), 'error')
      return
    }
    setIsUploading(true)
    try {
      const uploads = validFiles.slice(0, remaining)
      const urls: string[] = []
      const previews: string[] = []
      for (const file of uploads) {
        const url = await imagesRepository.uploadAndGetUrl(file)
        urls.push(url)
        previews.push(URL.createObjectURL(file))
      }
      setEvidenceUrls((prev) => [...prev, ...urls])
      setEvidencePreviews((prev) => [...prev, ...previews])
      if (!hasInvalidFiles) {
        setEvidenceError(null)
      }
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    } finally {
      setIsUploading(false)
    }
  }

  const openFilePicker = () => {
    if (!canAddEvidence) return
    setEvidenceError(null)
    fileInputRef.current?.click()
  }

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!canAddEvidence) return
    setIsDragOver(true)
  }

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!event.currentTarget.contains(event.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
    if (!canAddEvidence) return
    if (event.dataTransfer.files?.length) {
      void handleFiles(event.dataTransfer.files)
    }
  }

  const handleAmountChange = (raw: string) => {
    setAmount(sanitizeDirectPaymentAmountInput(raw, PAYOUT_AMOUNT_MAX))
    if (amountError) setAmountError(null)
  }

  const handleAmountBlur = () => {
    if (!amount.trim()) return
    setAmountError(validatePayoutAmount(amount, t))
  }

  const handlePeriodStartChange = (value: string) => {
    setPeriodStart(value)
    setPeriodError(validatePayoutPeriod(value, periodEnd, t))
  }

  const handlePeriodEndChange = (value: string) => {
    setPeriodEnd(value)
    setPeriodError(validatePayoutPeriod(periodStart, value, t))
  }

  const removeEvidence = (index: number) => {
    setEvidencePreviews((prev) => {
      const url = prev[index]
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url)
      return prev.filter((_, i) => i !== index)
    })
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    const parsedAmount = parseDirectPaymentAmountInput(amount)
    const nextAmountError = validatePayoutAmount(amount, t)
    const nextPeriodError = validatePayoutPeriod(periodStart, periodEnd, t)
    if (nextAmountError) {
      setAmountError(nextAmountError)
    }
    if (nextPeriodError) {
      setPeriodError(nextPeriodError)
    }

    if (!staffProfileId || nextAmountError || nextPeriodError) {
      if (!staffProfileId) {
        showToast(t('dashboard.tips.payouts_manager.validation_required'), 'error')
      }
      return
    }
    if (!isPayoutTypesMaskValid(resolvedPayoutTypes)) {
      showToast(t(getErrorI18nKey('PAYOUT_TYPES_REQUIRED')), 'error')
      return
    }

    const payload = {
      staffProfileId,
      payoutMethodType,
      amount: parsedAmount,
      payoutTypes: resolvedPayoutTypes,
      periodStart,
      periodEnd,
      evidenceUrls,
      notes: notes.trim() || null,
    }

    try {
      if (isEditing && editingPayout) {
        await updateMutation.mutateAsync({
          payoutId: editingPayout.id,
          payload: {
            payoutMethodType: payload.payoutMethodType,
            payoutTypes: payload.payoutTypes,
            periodStart: payload.periodStart,
            periodEnd: payload.periodEnd,
            evidenceUrls: payload.evidenceUrls,
            notes: payload.notes,
          },
        })
        showToast(t('dashboard.tips.payouts_manager.update_success'), 'success')
      } else {
        await createMutation.mutateAsync(payload)
        showToast(t('dashboard.tips.payouts_manager.create_success'), 'success')
      }
      onClose()
    } catch (err) {
      const code = getApiErrorCode(err)
      if (code === 'PAYOUT_AMOUNT_MUST_BE_POSITIVE') {
        setAmountError(t(getErrorI18nKey(code)))
        return
      }
      if (code === 'PAYOUT_PERIOD_START_BEFORE_END') {
        setPeriodError(t(getErrorI18nKey(code)))
        return
      }
      showToast(t(getErrorI18nKey(code)), 'error')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-nexoraBorder bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-nexoraBorder px-5 py-4">
          <div>
            <h3 className="text-base font-black text-inkBlue">
              {isEditing
                ? t('dashboard.tips.payouts_manager.edit_title')
                : t('dashboard.tips.payouts_manager.create_title')}
            </h3>
            <p className="mt-1 text-xs text-mutedGrey">{t('dashboard.tips.payouts_manager.create_sub')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-nexoraBorder p-2 text-mutedGrey hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.field_staff')} *
                </label>
                <CustomSelect
                  value={staffProfileId}
                  disabled={isEditing}
                  onChange={(e) => setStaffProfileId(e.target.value)}
                  options={staffSelectOptions}
                  placeholder={t('dashboard.tips.payouts_manager.staff_placeholder')}
                />
              </div>

              {selectedStaff && (staffAccount || unpaidDebt) ? (
                <div className="flex items-center justify-between rounded-lg border border-nexoraBrand/20 bg-nexoraBrand/5 px-3 py-2.5">
                  <div>
                    {staffAccount ? (
                      <>
                        <p className="text-[11px] font-semibold text-nexoraBrand">
                          {t('dashboard.tips.payouts_manager.staff_account', { method: payoutMethodType })}
                        </p>
                        <p className="text-sm font-black text-inkBlue">{staffAccount}</p>
                      </>
                    ) : null}
                    {unpaidDebt ? (
                      <p className="mt-1 text-[11px] text-mutedGrey">
                        {t('dashboard.tips.payouts_manager.unpaid_tip_hint')}{' '}
                        <strong className="text-nexoraBrand">{formatCurrency(unpaidDebt.balance)}</strong>
                      </p>
                    ) : null}
                  </div>
                  {staffAccount ? (
                    <button type="button" onClick={handleCopyAccount} className="rounded-lg border border-nexoraBorder px-2 py-1 text-[11px] font-bold">
                      <Copy className="mr-1 inline h-3 w-3" />
                      {t('common.copy')}
                    </button>
                  ) : null}
                </div>
              ) : null}

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.field_method')} *
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {payoutMethodOptions.map((method) => {
                    const selectable = isPayoutMethodSelectable(method)
                    return (
                    <button
                      key={method}
                      type="button"
                      disabled={!selectable}
                      onClick={() => selectable && setPayoutMethodType(method)}
                      className={`rounded-xl border px-2 py-2 text-center text-[11px] font-bold transition ${
                        payoutMethodType === method
                          ? 'border-nexoraBrand bg-nexoraBrand/10 text-nexoraBrand'
                          : selectable
                            ? 'border-nexoraBorder hover:border-nexoraBrand/40'
                            : 'cursor-not-allowed border-nexoraBorder/60 bg-slate-50 text-mutedGrey opacity-60'
                      }`}
                    >
                      {t(METHOD_I18N[method] ?? method)}
                    </button>
                    )
                  })}
                </div>
                {!staffProfileId ? (
                  <p className="mt-1.5 text-xs text-mutedGrey">
                    {t('dashboard.tips.payouts_manager.method_select_staff_first')}
                  </p>
                ) : availablePayoutMethods.length === 0 ? (
                  <p className="mt-1.5 text-xs font-semibold text-amber-700">
                    {t('dashboard.tips.payouts_manager.method_staff_none')}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.field_amount')} *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-mutedGrey">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isEditing}
                    className={`h-10 w-full rounded-lg border bg-white pl-7 pr-3 text-sm font-semibold tabular-nums disabled:bg-slate-50 ${
                      amountError
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                        : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20'
                    } outline-none`}
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    onBlur={handleAmountBlur}
                    placeholder="0.00"
                    aria-invalid={Boolean(amountError)}
                    aria-describedby={amountError ? 'payout-amount-error' : undefined}
                  />
                </div>
                {amountError ? (
                  <p id="payout-amount-error" className="mt-1.5 text-xs font-semibold text-red-600">
                    {amountError}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.field_types')} *
                </label>
                <div className="flex flex-wrap gap-2">
                  {payoutTypeOptions.map((flag) => {
                    const selected = hasPayoutType(payoutTypesMask, flag)
                    const selectable = isEditing
                    return (
                      <button
                        key={flag}
                        type="button"
                        disabled={!selectable}
                        onClick={() => selectable && setPayoutTypesMask((mask) => togglePayoutType(mask, flag))}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                          selected
                            ? 'border-nexoraBrand bg-nexoraBrand/10 text-nexoraBrand'
                            : selectable
                              ? 'border-nexoraBorder'
                              : 'cursor-default border-nexoraBorder'
                        }`}
                      >
                        {t(TYPE_I18N[flag])}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.field_period')} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    className={`h-10 rounded-lg border bg-white px-3 text-sm outline-none ${
                      periodError
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                        : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20'
                    }`}
                    value={periodStart}
                    onChange={(e) => handlePeriodStartChange(e.target.value)}
                    aria-invalid={Boolean(periodError)}
                    aria-describedby={periodError ? 'payout-period-error' : undefined}
                  />
                  <input
                    type="date"
                    className={`h-10 rounded-lg border bg-white px-3 text-sm outline-none ${
                      periodError
                        ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200'
                        : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20'
                    }`}
                    value={periodEnd}
                    onChange={(e) => handlePeriodEndChange(e.target.value)}
                    aria-invalid={Boolean(periodError)}
                    aria-describedby={periodError ? 'payout-period-error' : undefined}
                  />
                </div>
                {periodError ? (
                  <p id="payout-period-error" className="mt-1.5 text-xs font-semibold text-red-600">
                    {periodError}
                  </p>
                ) : null}
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.field_notes')}
                </label>
                <textarea
                  className="min-h-[80px] w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('dashboard.tips.payouts_manager.notes_placeholder')}
                />
              </div>
            </div>

            <div className="space-y-4">
              <p className="border-b border-nexoraBorder pb-2 text-[11px] font-black uppercase tracking-wide text-mutedGrey">
                {t('dashboard.tips.payouts_manager.evidence_title')}
              </p>
              <div
                role="button"
                tabIndex={canAddEvidence ? 0 : -1}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (!canAddEvidence) return
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openFilePicker()
                  }
                }}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                  canAddEvidence ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                } ${
                  evidenceError
                    ? 'border-red-400 bg-red-50'
                    : isDragOver
                      ? 'border-nexoraBrand bg-nexoraBrand/10'
                      : 'border-nexoraBorder bg-slate-50 hover:border-nexoraBrand/50'
                }`}
              >
                <Upload className={`mb-2 h-8 w-8 ${isDragOver ? 'text-nexoraBrand' : 'text-mutedGrey'}`} />
                <p className="text-sm font-bold text-inkBlue">{t('dashboard.tips.payouts_manager.evidence_drop')}</p>
                <p className="mt-1 text-[11px] text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.evidence_hint', { max: MAX_EVIDENCE_FILES })}
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={!canAddEvidence}
                  onChange={(e) => {
                    if (e.target.files) void handleFiles(e.target.files)
                    e.target.value = ''
                  }}
                />
              </div>
              {evidenceError ? (
                <p className="text-xs font-semibold text-red-600">{evidenceError}</p>
              ) : null}

              {evidencePreviews.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {evidencePreviews.map((src, index) => (
                    <div key={`${src}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-lg border border-nexoraBorder">
                      <img src={src} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] text-blue-800">
                {t('dashboard.tips.payouts_manager.evidence_privacy')}
              </div>

              {!isEditing ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                  {t('dashboard.tips.payouts_manager.create_pending_note')}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-nexoraBorder px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-sm font-bold">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEditing ? t('common.save') : t('dashboard.tips.payouts_manager.save_payout')}
          </button>
        </div>
      </div>
    </div>
  )
}
