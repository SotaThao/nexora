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
import { buildTipItems, type TipSplitItem } from '../../../utils/tipSplit'

export type TipItem = TipSplitItem

const DEFAULT_CONSTRAINTS: TipConstraints = {
  minItemAmount: TIP_MIN_ITEM_AMOUNT,
  maxTotalAmount: TIP_MAX_TOTAL_AMOUNT,
}

/**
 * Tip state for the review screen: who served the customer, how much in total,
 * and the even split posted to POST /api/v1/tips/multi-staff.
 */
export default function useDirectPaymentTip(
  staff: PublicDirectPaymentStaff[],
  constraints: TipConstraints = DEFAULT_CONSTRAINTS,
) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [presetAmount, setPresetAmount] = useState<number | null>(null)
  const [isCustom, setIsCustom] = useState(false)
  const [customInput, setCustomInputState] = useState('')

  const staffList = staff ?? []

  const selectedStaff = useMemo(
    () => selectedStaffIds
      .map((id) => staffList.find((member) => member.id === id))
      .filter((member): member is PublicDirectPaymentStaff => Boolean(member)),
    [selectedStaffIds, staffList],
  )

  const tipTotal = useMemo(() => {
    if (!selectedStaffIds.length) return 0
    if (isCustom) return parseDirectPaymentAmountInput(customInput)
    return presetAmount ?? 0
  }, [customInput, isCustom, presetAmount, selectedStaffIds.length])

  const tipItems = useMemo(
    () => (tipTotal > 0 ? buildTipItems(selectedStaffIds, tipTotal) : []),
    [selectedStaffIds, tipTotal],
  )

  const perStaffAmount = tipItems.length ? tipItems[tipItems.length - 1].amount : 0

  const tipError: TipErrorCode | null = useMemo(() => {
    if (!selectedStaffIds.length) return null
    // Đã chọn người phục vụ thì phải chọn số tiền — nếu không, tip sẽ không được tạo.
    if (!(tipTotal > 0)) return 'required'
    if (tipTotal > constraints.maxTotalAmount) return 'max_total'
    if (perStaffAmount < constraints.minItemAmount) return 'min_item'
    return null
  }, [constraints, perStaffAmount, selectedStaffIds.length, tipTotal])

  const openPicker = useCallback(() => setIsPickerOpen(true), [])
  const closePicker = useCallback(() => setIsPickerOpen(false), [])

  /** Commit the picker selection (draft ids) and close it. */
  const selectStaff = useCallback((ids: string[]) => {
    setSelectedStaffIds(ids)
    setIsPickerOpen(false)
  }, [])

  /** "Change" on a row — drop that person, then reopen the picker to pick another. */
  const changeStaff = useCallback((staffId: string) => {
    setSelectedStaffIds((prev) => prev.filter((id) => id !== staffId))
    setIsPickerOpen(true)
  }, [])

  const removeStaff = useCallback((staffId: string) => {
    setSelectedStaffIds((prev) => prev.filter((id) => id !== staffId))
  }, [])

  const selectPreset = useCallback((amount: number) => {
    setPresetAmount(amount)
    setIsCustom(false)
    setCustomInputState('')
  }, [])

  const startCustom = useCallback(() => {
    setIsCustom(true)
    setPresetAmount(null)
  }, [])

  const setCustomInput = useCallback((raw: string) => {
    setCustomInputState(sanitizeDirectPaymentAmountInput(raw, constraints.maxTotalAmount))
  }, [constraints.maxTotalAmount])

  /** SKIP — no tip, back to the "who served you today?" prompt. */
  const skip = useCallback(() => {
    setSelectedStaffIds([])
    setPresetAmount(null)
    setIsCustom(false)
    setCustomInputState('')
    setIsPickerOpen(false)
  }, [])

  return {
    staff: staffList,
    presets: TIP_PRESET_AMOUNTS,
    constraints,
    selectedStaffIds,
    selectedStaff,
    isPickerOpen,
    isCustom,
    customInput,
    presetAmount,
    tipItems,
    tipTotal,
    perStaffAmount,
    tipError,
    openPicker,
    closePicker,
    selectStaff,
    changeStaff,
    removeStaff,
    selectPreset,
    startCustom,
    setCustomInput,
    skip,
  }
}

export type DirectPaymentTip = ReturnType<typeof useDirectPaymentTip>
