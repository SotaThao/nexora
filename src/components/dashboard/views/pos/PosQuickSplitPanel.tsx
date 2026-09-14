import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Loader2, RefreshCw, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS,
  PosCheckoutPaymentMethod,
  type PosCheckoutPaymentMethodType,
} from '../../../../constants/posCheckoutPaymentMethod'
import {
  formatUsdAmount,
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../../utils/currencyInput'
import type { OrderPaymentAllocationApiDto, SetOrderPaymentAllocationsPayload } from '../../../../types/repositories'
import { allocationBillCents } from './posPaymentAllocations'

const TK = 'components.dashboard.views.pos.PosQuickSplitPanel'

// Every amount is compared and divided in whole cents. Working in dollars and flooring is what
// makes a 50/50 land a cent short of the amount due, which then blocks checkout with a message
// the cashier cannot act on.
function toCents(amount: number): number {
  return Math.round(amount * 100)
}

function fromCents(cents: number): number {
  return cents / 100
}

function amountInputToCents(value: string): number {
  const parsed = parseDirectPaymentAmountInput(value)
  return Number.isFinite(parsed) && parsed > 0 ? toCents(parsed) : 0
}

function centsToAmountInput(cents: number): string {
  return cents > 0 ? fromCents(cents).toFixed(2) : ''
}

interface SplitRow {
  key: string
  method: PosCheckoutPaymentMethodType | null
  amountInput: string
  cashReceivedInput: string
  showCashReceived: boolean
  /** True while this row is following the outstanding balance instead of a typed-in figure. */
  autoFilled: boolean
}

function createRow(autoFilled: boolean): SplitRow {
  return {
    key: `split-${Math.random().toString(36).slice(2, 10)}`,
    method: null,
    amountInput: '',
    cashReceivedInput: '',
    showCashReceived: false,
    autoFilled,
  }
}

// Every reader of the saved split has to agree on both order and row identity, or the tip bearer
// restored below lands on a different payment than the one that carried it.
function sortedAllocations(allocations: OrderPaymentAllocationApiDto[]): OrderPaymentAllocationApiDto[] {
  return allocations.slice().sort((a, b) => a.displayOrder - b.displayOrder)
}

function allocationRowKey(allocation: OrderPaymentAllocationApiDto): string {
  return `split-${allocation.displayOrder}-${allocation.paymentMethodType}`
}

// What the server already holds, in the exact shape buildPayload produces. Comparing against this
// is how the panel knows whether the split on screen has been stored, so an untouched panel
// offers nothing to save and never claims a save for work nobody did.
function serializeSavedAllocations(allocations: OrderPaymentAllocationApiDto[]): string {
  return JSON.stringify({
    allocations: sortedAllocations(allocations)
      .map((allocation) => ({
        paymentMethodType: allocation.paymentMethodType,
        amount: allocation.amount,
        tipAmount: allocation.tipAmount,
        cashReceived: allocation.cashReceived ?? null,
      })),
  })
}

// The saved split is the source of truth when the screen is reopened — the draft lives on the
// order, not in this component, so a closed screen loses nothing.
function rowsFromAllocations(allocations: OrderPaymentAllocationApiDto[]): SplitRow[] {
  return sortedAllocations(allocations)
    .map((allocation) => {
      // Exact cash is stored as CashReceived == Amount, so only a real overpayment reopens the
      // field. Opening it for every cash portion would show change due of $0.00 and hide the
      // button that explains what the field is for.
      const gaveMore = allocation.cashReceived != null && allocation.cashReceived > allocation.amount
      // Stripped back to the bill. The tip a saved portion carried is stored on it, so the
      // charged figure never has to be guessed apart — and the tip the order carries *now* is
      // what gets put back on, which is what makes an edited tip land by itself.
      const billCents = allocationBillCents(allocation)
      return {
        key: allocationRowKey(allocation),
        method: allocation.paymentMethodType as PosCheckoutPaymentMethodType,
        amountInput: centsToAmountInput(billCents),
        cashReceivedInput: gaveMore ? (allocation.cashReceived as number).toFixed(2) : '',
        showCashReceived: gaveMore,
        autoFilled: false,
      }
    })
}

export default function PosQuickSplitPanel({
  amountDueCents,
  tipAmount,
  availableMethods,
  savedAllocations,
  isSaving,
  onSave,
  onBack,
  disabled = false,
}: {
  amountDueCents: number
  tipAmount: number
  availableMethods: PosCheckoutPaymentMethodType[]
  savedAllocations: OrderPaymentAllocationApiDto[]
  isSaving: boolean
  onSave: (payload: SetOrderPaymentAllocationsPayload) => void
  onBack: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const [rows, setRows] = useState<SplitRow[]>(() => {
    const restored = rowsFromAllocations(savedAllocations)
    return restored.length > 0 ? restored : [createRow(false), createRow(true)]
  })

  // Which row the tip arrived through. Held as the row key rather than an index so adding or
  // removing a payment cannot silently move the tip to a different method.
  const [tipBearerKey, setTipBearerKey] = useState<string | null>(() => {
    const sorted = sortedAllocations(savedAllocations)
    const bearer = sorted.find((allocation) => allocation.tipAmount > 0) ?? sorted[0]
    return bearer ? allocationRowKey(bearer) : null
  })

  const tipCents = toCents(tipAmount)

  // The tip is part of what one method collects, not a line of its own: Total already includes it,
  // and the backend rejects a portion carrying more tip than its own amount. So moving the tip
  // between methods has to move the money too, and nothing in an amount field says which part of
  // it is tip — hence tracking the row holding it. Starts empty because the rows above were
  // restored as bills; the effect below puts the tip on straight away.
  const tipHolderRef = useRef<{ key: string | null; cents: number }>({ key: null, cents: 0 })

  // Recomputed on every render rather than stored: the pool of methods shrinks as rows claim them,
  // and a value captured once goes stale the moment another row takes it.
  const methodsInUse = useMemo(
    () => new Set(rows.map((row) => row.method).filter((method): method is PosCheckoutPaymentMethodType => method !== null)),
    [rows],
  )

  const allocatedCents = rows.reduce((sum, row) => sum + amountInputToCents(row.amountInput), 0)
  const outstandingCents = amountDueCents - allocatedCents

  const resolvedTipBearerKey = rows.some((row) => row.key === tipBearerKey) ? tipBearerKey : rows[0]?.key ?? null
  // A method-less row cannot be credited with the tip — it is dropped from the payload — so the
  // money waits instead of parking somewhere that will not be saved.
  const canBearTip = rows.some((row) => row.key === resolvedTipBearerKey && row.method !== null)

  // Adds the tip to the chosen payment and takes it off the previous one, so picking a target is
  // all the cashier does — no retyping an amount the tip changed. Deliberately not dependent on
  // `rows`: reading the amounts inside the updater keeps this out of the render loop a `rows`
  // dependency would create.
  useEffect(() => {
    const holder = tipHolderRef.current
    const targetKey = tipCents > 0 && canBearTip ? resolvedTipBearerKey : null
    const targetCents = targetKey === null ? 0 : tipCents
    if (holder.key === targetKey && holder.cents === targetCents) return

    tipHolderRef.current = { key: targetKey, cents: targetCents }
    setRows((current) => {
      let moved = false
      const next = current.map((row) => {
        const delta = (row.key === targetKey ? targetCents : 0) - (row.key === holder.key ? holder.cents : 0)
        if (delta === 0) return row
        moved = true
        return { ...row, amountInput: centsToAmountInput(Math.max(amountInputToCents(row.amountInput) + delta, 0)) }
      })
      return moved ? next : current
    })
  }, [resolvedTipBearerKey, canBearTip, tipCents])

  const updateRow = useCallback((key: string, patch: Partial<SplitRow>) => {
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)))
  }, [])

  // A typed figure in one row moves the balance, so any row still following it has to move too.
  // Only rows the cashier has not touched are rewritten — an explicit amount is never overwritten.
  useEffect(() => {
    setRows((current) => {
      const followers = current.filter((row) => row.autoFilled)
      if (followers.length !== 1) return current

      const fixedCents = current
        .filter((row) => !row.autoFilled)
        .reduce((sum, row) => sum + amountInputToCents(row.amountInput), 0)
      const balanceCents = Math.max(amountDueCents - fixedCents, 0)
      const target = centsToAmountInput(balanceCents)

      // Returning the same array when nothing moved is what ends this effect. `.map()` allocates a
      // fresh array even when every row is unchanged, and a new identity re-triggers the effect
      // through its own `rows` dependency — an unbounded render loop, not a wasted render.
      if (!current.some((row) => row.autoFilled && row.amountInput !== target)) return current

      return current.map((row) => (row.autoFilled && row.amountInput !== target
        ? { ...row, amountInput: target }
        : row))
    })
  }, [amountDueCents, rows])

  // A row with no method, or a zero amount, is an unfinished line rather than a portion — it is
  // left out so a half-typed split still saves the parts that are real.
  const payload = useMemo((): SetOrderPaymentAllocationsPayload => ({
    allocations: rows
      .filter((row) => row.method !== null && amountInputToCents(row.amountInput) > 0)
      .map((row) => ({
        paymentMethodType: row.method as string,
        amount: fromCents(amountInputToCents(row.amountInput)),
        tipAmount: row.key === resolvedTipBearerKey ? fromCents(tipCents) : 0,
        cashReceived: row.method !== PosCheckoutPaymentMethod.Cash
          ? null
          : row.cashReceivedInput.trim() !== ''
            ? parseDirectPaymentAmountInput(row.cashReceivedInput)
            : fromCents(amountInputToCents(row.amountInput)),
      })),
  }), [rows, resolvedTipBearerKey, tipCents])

  // Compared as text so an amount edited and edited back is not a change worth sending. Read from
  // the prop on every render rather than remembered: a rejected save leaves savedAllocations
  // untouched, so the panel stays dirty instead of reporting a save that never landed.
  const isDirty = JSON.stringify(payload) !== serializeSavedAllocations(savedAllocations)

  // SetOrderPaymentAllocations rejects a portion carrying more tip than its own amount — the one
  // row-level problem the server will not take. Anything else unfinished is simply left out of
  // the payload, so it does not have to block the save.
  const carriesMoreTipThanAmount = (row: SplitRow) => row.key === resolvedTipBearerKey
    && amountInputToCents(row.amountInput) > 0
    && amountInputToCents(row.amountInput) < tipCents

  // What of a row's amount is tip, so the split buttons below can work on the bill alone.
  const heldTipCentsOf = (row: SplitRow) => (row.key === tipHolderRef.current.key ? tipHolderRef.current.cents : 0)

  const applyFiftyFifty = () => {
    setRows((current) => {
      if (current.length < 2) return current
      // Halves the bill, not the tip: a $10 cash tip cannot arrive half on a card. The tip stays
      // on the row already holding it, so the two halves plus that tip still equal the total.
      // The odd cent goes to the second payment so the pair never lands a cent short.
      const billCents = Math.max(amountDueCents - tipCents, 0)
      const half = Math.floor(billCents / 2)
      return current.map((row, index) => {
        const bill = index === 0 ? half : index === 1 ? billCents - half : 0
        return {
          ...row,
          amountInput: centsToAmountInput(bill + heldTipCentsOf(row)),
          autoFilled: false,
        }
      })
    })
  }

  const applyRemaining = (key: string) => {
    setRows((current) => {
      // Measured on the bill, so filling the balance never hands the tip to a row that is not
      // the one carrying it.
      const otherBills = current
        .filter((row) => row.key !== key)
        .reduce((sum, row) => sum + amountInputToCents(row.amountInput) - heldTipCentsOf(row), 0)
      const billCents = Math.max(amountDueCents - tipCents, 0)
      return current.map((row) => (row.key === key
        ? {
          ...row,
          amountInput: centsToAmountInput(Math.max(billCents - otherBills, 0) + heldTipCentsOf(row)),
          autoFilled: false,
        }
        : row))
    })
  }

  const addMethod = () => {
    setRows((current) => [...current.map((row) => ({ ...row, autoFilled: false })), createRow(true)])
  }

  const clearSplit = () => {
    const fresh = [createRow(false), createRow(true)]
    tipHolderRef.current = { key: null, cents: 0 }
    setRows(fresh)
    setTipBearerKey(fresh[0].key)
  }

  const hasStartedSplit = rows.some((row) => row.method !== null)

  const isBalanced = outstandingCents === 0 && allocatedCents > 0
  // "Saved" means what is on screen is what the server holds — not merely that a request once
  // succeeded, and never when there is nothing stored at all.
  const showSaved = savedAllocations.length > 0 && !isDirty && !isSaving

  const findSaveBlockMessage = (): string | null => {
    const tipRow = rows.find(carriesMoreTipThanAmount)
    if (tipRow) return t(`${TK}.errorTipExceedsAmount`, { amount: formatUsdAmount(tipAmount) })

    const cashShortRow = rows.find((row) => row.method === PosCheckoutPaymentMethod.Cash
      && row.cashReceivedInput.trim() !== ''
      && amountInputToCents(row.cashReceivedInput) < amountInputToCents(row.amountInput))
    if (cashShortRow) return t(`${TK}.errorCashShort`)

    const unattributedRow = rows.find((row) => row.method === null && amountInputToCents(row.amountInput) > 0)
    if (unattributedRow) return t(`${TK}.errorChooseMethod`)

    const amountlessRow = rows.find((row) => row.method !== null && amountInputToCents(row.amountInput) === 0)
    if (amountlessRow) return t(`${TK}.errorAmountRequired`)

    if (payload.allocations.length === 0) return t(`${TK}.errorChooseMethod`)

    if (!isBalanced) {
      return outstandingCents > 0
        ? t(`${TK}.short`, { amount: formatUsdAmount(fromCents(outstandingCents)) })
        : t(`${TK}.over`, { amount: formatUsdAmount(fromCents(-outstandingCents)) })
    }

    return null
  }

  const handleSave = () => {
    if (disabled || isSaving) return

    const blockMessage = findSaveBlockMessage()
    if (blockMessage) {
      showToast(blockMessage, 'error')
      return
    }

    if (!isDirty) return

    onSave(payload)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onBack])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm"
      onClick={onBack}
    >
      {/* Wider than a form dialog on purpose: the extra width is what lets the payment cards sit
          side by side instead of stacking, which is what removes the scrolling. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-quick-split-title"
        className="nexora-modal-card max-w-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-start gap-3 border-b border-nexoraBorder pb-4">
          <div className="min-w-0 flex-1">
            <h2
              id="pos-quick-split-title"
              className="text-2xl font-bold leading-tight text-nexoraText"
            >
              {t(`${TK}.title`)}
            </h2>
            <p className="text-sm font-medium text-nexoraMuted">{t(`${TK}.subtitle`)}</p>
          </div>
          <span
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-nexoraLavender/25 px-3 py-1 text-[11px] font-bold text-nexoraBrand"
            aria-live="polite"
          >
            {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {showSaved ? <Check className="h-3 w-3" /> : null}
            {isSaving ? t(`${TK}.saving`) : showSaved ? t(`${TK}.saved`) : t(`${TK}.unsaved`)}
          </span>
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurface text-nexoraText hover:bg-nexoraCanvas"
            aria-label={t(`${TK}.close`)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* One column on a phone, two from `sm` up. The side-by-side pair is what fits the whole
            split on screen at once on the iPad this runs on, instead of a scroll per payment. */}
        <div className="grid flex-1 content-start gap-3 overflow-y-auto py-4 sm:grid-cols-2">
          {rows.map((row, index) => {
            const rowCents = amountInputToCents(row.amountInput)
            const isCash = row.method === PosCheckoutPaymentMethod.Cash
            const cashReceivedCents = amountInputToCents(row.cashReceivedInput)
            const cashShort = isCash && row.cashReceivedInput.trim() !== '' && cashReceivedCents < rowCents
            const changeDueCents = cashReceivedCents - rowCents
            const methodMissing = row.method === null
            const amountMissing = !methodMissing && rowCents === 0
            const tipExceedsAmount = carriesMoreTipThanAmount(row)
            const hasError = hasStartedSplit && (methodMissing || amountMissing || cashShort || tipExceedsAmount)

            return (
              <section
                key={row.key}
                className={`rounded-2xl border p-3 ${hasError ? 'border-nexoraDanger/60 bg-red-50/40' : 'border-nexoraBorder bg-nexoraSurface'}`}
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nexoraLavender/30 text-[11px] font-black text-nexoraBrand">
                    {index + 1}
                  </span>
                  <h3 className="text-sm font-bold text-nexoraText">
                    {t(`${TK}.paymentLabel`, { number: index + 1 })}
                  </h3>
                  {row.autoFilled ? (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-nexoraCanvas px-2.5 py-1 text-[10px] font-bold text-nexoraMuted">
                      <RefreshCw className="h-3 w-3" />
                      {t(`${TK}.autoFilled`)}
                    </span>
                  ) : null}
                </div>

                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                  {t(`${TK}.paymentMethod`)}
                </p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {availableMethods.map((method) => {
                    const takenElsewhere = method !== row.method && methodsInUse.has(method)
                    const isSelected = method === row.method
                    return (
                      <button
                        key={method}
                        type="button"
                        onClick={() => updateRow(row.key, { method, autoFilled: row.autoFilled })}
                        disabled={disabled || takenElsewhere}
                        aria-pressed={isSelected}
                        className={`flex h-11 min-w-[84px] flex-col items-center justify-center rounded-lg border px-3.5 py-2 text-xs font-bold transition-colors ${
                          isSelected
                            ? 'border-nexoraBrand bg-nexoraLavender/20 text-nexoraBrand'
                            : takenElsewhere
                              ? 'border-nexoraBorder bg-nexoraCanvas text-nexoraMuted/60'
                              : 'border-nexoraBorder bg-nexoraSurface text-nexoraText hover:bg-nexoraCanvas'
                        }`}
                      >
                        <span>{t(POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS[method])}</span>
                        {takenElsewhere ? (
                          <span className="text-[10px] font-semibold text-nexoraMuted/70">{t(`${TK}.inUse`)}</span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <label
                  htmlFor={`${row.key}-amount`}
                  className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted"
                >
                  {t(`${TK}.amount`)}
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="relative block min-w-0 flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-nexoraMuted">$</span>
                    <input
                      id={`${row.key}-amount`}
                      type="text"
                      inputMode="decimal"
                      value={row.amountInput}
                      onChange={(event) => updateRow(row.key, {
                        amountInput: sanitizeDirectPaymentAmountInput(event.target.value, Number.MAX_SAFE_INTEGER),
                        autoFilled: false,
                      })}
                      disabled={disabled}
                      placeholder={t(`${TK}.amountPlaceholder`)}
                      className="h-11 w-full rounded-lg border border-nexoraBorder bg-white pl-7 pr-3 text-sm font-bold text-nexoraText outline-none focus:border-nexoraBrand disabled:opacity-60"
                    />
                  </span>
                  {index === 0 ? (
                    <button
                      type="button"
                      onClick={applyFiftyFifty}
                      disabled={disabled || rows.length < 2}
                      className="h-11 shrink-0 rounded-lg border border-nexoraBrand px-3.5 text-xs font-bold text-nexoraBrand hover:bg-nexoraLavender/15 disabled:opacity-60"
                    >
                      {t(`${TK}.fiftyFifty`)}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => applyRemaining(row.key)}
                    disabled={disabled}
                    className="h-11 shrink-0 rounded-lg border border-nexoraBrand px-3.5 text-xs font-bold text-nexoraBrand hover:bg-nexoraLavender/15 disabled:opacity-60"
                  >
                    {t(`${TK}.remaining`)}
                  </button>
                </div>

                {row.autoFilled ? (
                  <p className="mt-1.5 text-[11px] font-medium text-nexoraMuted">{t(`${TK}.updatesAutomatically`)}</p>
                ) : null}

                {isCash ? (
                  <div className="mt-3">
                    {row.showCashReceived ? (
                      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-nexoraBorder/70 bg-nexoraCanvas/40 p-3">
                        <label
                          htmlFor={`${row.key}-cash-received`}
                          className="shrink-0 text-[10px] font-semibold text-nexoraMuted"
                        >
                          {t(`${TK}.cashReceived`)}
                        </label>
                        <span className="relative block w-[120px] min-w-0 shrink">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-nexoraMuted">$</span>
                          <input
                            id={`${row.key}-cash-received`}
                            type="text"
                            inputMode="decimal"
                            value={row.cashReceivedInput}
                            onChange={(event) => updateRow(row.key, {
                              cashReceivedInput: sanitizeDirectPaymentAmountInput(
                                event.target.value,
                                Number.MAX_SAFE_INTEGER,
                              ),
                            })}
                            disabled={disabled}
                            placeholder={t(`${TK}.amountPlaceholder`)}
                            className="h-11 w-full rounded-lg border border-nexoraBorder bg-white pl-7 pr-3 text-sm font-bold text-nexoraText outline-none focus:border-nexoraBrand disabled:opacity-60"
                          />
                        </span>
                        {row.cashReceivedInput.trim() !== '' && !cashShort ? (
                          <span className="ml-auto flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1" aria-live="polite">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                              {t(`${TK}.changeDue`)}
                            </span>
                            <strong className="text-sm font-black text-emerald-700">
                              {formatUsdAmount(fromCents(Math.max(changeDueCents, 0)))}
                            </strong>
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => updateRow(row.key, { showCashReceived: true })}
                        disabled={disabled}
                        className="h-11 rounded-lg border border-nexoraBrand px-3.5 text-xs font-bold text-nexoraBrand hover:bg-nexoraLavender/15 disabled:opacity-60"
                      >
                        {t(`${TK}.customerGaveMore`)}
                      </button>
                    )}
                  </div>
                ) : null}

                {hasError ? (
                  <p className="mt-2 text-xs font-bold text-nexoraDanger" aria-live="polite">
                    {methodMissing
                      ? t(`${TK}.errorChooseMethod`)
                      : amountMissing
                        ? t(`${TK}.errorAmountRequired`)
                        : tipExceedsAmount
                          ? t(`${TK}.errorTipExceedsAmount`, { amount: formatUsdAmount(tipAmount) })
                          : t(`${TK}.errorCashShort`)}
                  </p>
                ) : null}
              </section>
            )
          })}

          {tipCents > 0 ? (
            <section className="rounded-2xl border border-nexoraBorder bg-nexoraCanvas/40 p-3 sm:col-span-2">
              <p className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t(`${TK}.tipAttribution`, { amount: formatUsdAmount(tipAmount) })}
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-nexoraMuted">{t(`${TK}.tipAttributionHelp`)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {rows.map((row, index) => (
                  <button
                    key={`${row.key}-tip`}
                    type="button"
                    onClick={() => setTipBearerKey(row.key)}
                    disabled={disabled || row.method === null}
                    aria-pressed={row.key === resolvedTipBearerKey}
                    className={`h-11 rounded-full border px-3.5 py-2 text-xs font-bold disabled:opacity-60 ${
                      row.key === resolvedTipBearerKey
                        ? 'border-nexoraBrand bg-nexoraBrand text-white'
                        : 'border-nexoraBorder bg-nexoraSurface text-nexoraText hover:bg-nexoraCanvas'
                    }`}
                  >
                    {row.method
                      ? t(POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS[row.method])
                      : t(`${TK}.paymentLabel`, { number: index + 1 })}
                  </button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-nexoraBorder pt-4">
          <div
            className={`mb-3 flex items-center justify-between rounded-xl px-3 py-2 text-sm font-bold ${
              isBalanced ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-nexoraDanger'
            }`}
            aria-live="polite"
          >
            <span>{t(`${TK}.amountDue`)}</span>
            <span className="tabular-nums">{formatUsdAmount(fromCents(amountDueCents))}</span>
          </div>
          {!isBalanced ? (
            <p className="mb-3 text-xs font-bold text-nexoraDanger" aria-live="polite">
              {outstandingCents > 0
                ? t(`${TK}.short`, { amount: formatUsdAmount(fromCents(outstandingCents)) })
                : t(`${TK}.over`, { amount: formatUsdAmount(fromCents(-outstandingCents)) })}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addMethod}
              disabled={disabled || availableMethods.length <= rows.length}
              className="h-11 rounded-lg border border-nexoraBrand px-3.5 text-xs font-bold text-nexoraBrand hover:bg-nexoraLavender/15 disabled:opacity-60"
            >
              {t(`${TK}.addMethod`)}
            </button>
            <button
              type="button"
              onClick={clearSplit}
              disabled={disabled}
              className="h-11 rounded-lg px-3.5 text-xs font-bold text-nexoraDanger hover:bg-red-50 disabled:opacity-60"
            >
              {t(`${TK}.clearSplit`)}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={disabled || isSaving}
              className="ml-auto flex h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-5 text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t(`${TK}.saveSplit`)}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
