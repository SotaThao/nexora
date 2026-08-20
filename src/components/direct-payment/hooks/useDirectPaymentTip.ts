import { useCallback, useMemo, useState } from 'react'

import {
  TIP_MAX_TOTAL_AMOUNT,
  TIP_MIN_ITEM_AMOUNT,
  TIP_PRESET_AMOUNTS,
  type TipErrorCode,
} from '../../../constants/tipPresets'
import type { PublicDirectPaymentStaff, TipConstraints } from '../../../types/domain'
import {
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../utils/currencyInput'

export interface TipItem {
  staffProfileId: string
  amount: number
}

/** Per-staff tip choice: a preset chip, or a typed custom amount. */
interface TipEntry {
  preset: number | null
  isCustom: boolean
  customInput: string
}

const EMPTY_ENTRY: TipEntry = { preset: null, isCustom: false, customInput: '' }

const DEFAULT_CONSTRAINTS: TipConstraints = {
  minItemAmount: TIP_MIN_ITEM_AMOUNT,
  maxTotalAmount: TIP_MAX_TOTAL_AMOUNT,
}

function entryAmount(entry: TipEntry | undefined): number {
  if (!entry) return 0
  if (entry.isCustom) return parseDirectPaymentAmountInput(entry.customInput)
  return entry.preset ?? 0
}

/**
 * Tip state for the review screen: who served the customer and how much EACH of
 * them gets. Every recipient carries their own amount — the tip total is just
 * the sum, and it is posted per staff member to POST /api/v1/tips/multi-staff.
 */
export default function useDirectPaymentTip(
  staff: PublicDirectPaymentStaff[],
  constraints: TipConstraints = DEFAULT_CONSTRAINTS,
) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [entries, setEntries] = useState<Record<string, TipEntry>>({})

  const staffList = staff ?? []

  const selectedStaff = useMemo(
    () => selectedStaffIds
      .map((id) => staffList.find((member) => member.id === id))
      .filter((member): member is PublicDirectPaymentStaff => Boolean(member)),
    [selectedStaffIds, staffList],
  )

  /** Amounts in selection order — the row order the customer sees. */
  const amounts = useMemo(
    () => selectedStaffIds.map((id) => ({ id, amount: entryAmount(entries[id]) })),
    [entries, selectedStaffIds],
  )

  const tipItems: TipItem[] = useMemo(
    () => amounts
      .filter((row) => row.amount > 0)
      .map((row) => ({ staffProfileId: row.id, amount: row.amount })),
    [amounts],
  )

  const tipTotal = useMemo(
    () => Math.round(amounts.reduce((sum, row) => sum + row.amount, 0) * 100) / 100,
    [amounts],
  )

  const tipError: TipErrorCode | null = useMemo(() => {
    if (!selectedStaffIds.length) return null
    // Everyone picked must carry an amount, otherwise their tip is silently dropped.
    if (amounts.some((row) => !(row.amount > 0))) return 'required'
    if (tipTotal > constraints.maxTotalAmount) return 'max_total'
    if (amounts.some((row) => row.amount < constraints.minItemAmount)) return 'min_item'
    return null
  }, [amounts, constraints, selectedStaffIds.length, tipTotal])

  const openPicker = useCallback(() => setIsPickerOpen(true), [])

  /** Close without committing — the current selection stays exactly as it was. */
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  /**
   * Commit the picker selection and close it. What is ticked in the picker IS the
   * selection — no row is ever dropped behind the customer's back. Amounts of
   * people who stay selected are kept.
   */
  const selectStaff = useCallback((ids: string[]) => {
    setSelectedStaffIds(ids)
    setEntries((prev) => {
      const next: Record<string, TipEntry> = {}
      ids.forEach((id) => {
        if (prev[id]) next[id] = prev[id]
      })
      return next
    })
    setIsPickerOpen(false)
  }, [])

  const removeStaff = useCallback((staffId: string) => {
    setSelectedStaffIds((prev) => prev.filter((id) => id !== staffId))
    setEntries((prev) => {
      const { [staffId]: _dropped, ...rest } = prev
      return rest
    })
  }, [])

  const getEntry = useCallback(
    (staffId: string): TipEntry => entries[staffId] ?? EMPTY_ENTRY,
    [entries,
    ],
  )

  /** Amount this staff member receives right now (0 when nothing picked yet). */
  const getStaffAmount = useCallback(
    (staffId: string) => entryAmount(entries[staffId]),
    [entries],
  )

  const selectPreset = useCallback((staffId: string, amount: number) => {
    setEntries((prev) => ({
      ...prev,
      [staffId]: { preset: amount, isCustom: false, customInput: '' },
    }))
  }, [])

  const startCustom = useCallback((staffId: string) => {
    setEntries((prev) => ({
      ...prev,
      [staffId]: { preset: null, isCustom: true, customInput: prev[staffId]?.customInput ?? '' },
    }))
  }, [])

  const setCustomInput = useCallback((staffId: string, raw: string) => {
    const sanitized = sanitizeDirectPaymentAmountInput(raw, constraints.maxTotalAmount)
    setEntries((prev) => ({
      ...prev,
      [staffId]: { preset: null, isCustom: true, customInput: sanitized },
    }))
  }, [constraints.maxTotalAmount])

  /** SKIP — no tip, back to the "who served you today?" prompt. */
  const skip = useCallback(() => {
    setSelectedStaffIds([])
    setEntries({})
    setIsPickerOpen(false)
  }, [])

  return {
    staff: staffList,
    presets: TIP_PRESET_AMOUNTS,
    constraints,
    selectedStaffIds,
    selectedStaff,
    isPickerOpen,
    tipItems,
    tipTotal,
    tipError,
    getEntry,
    getStaffAmount,
    openPicker,
    closePicker,
    selectStaff,
    removeStaff,
    selectPreset,
    startCustom,
    setCustomInput,
    skip,
  }
}

export type DirectPaymentTip = ReturnType<typeof useDirectPaymentTip>
