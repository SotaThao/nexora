import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Check, Loader2, RefreshCw } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
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

const TK = 'components.dashboard.views.pos.PosQuickSplitPanel'

// Auto-save fires on every keystroke, so it waits for the cashier to pause. Long enough that
// typing "255.00" is one request, short enough that walking away from the iPad mid-entry still
// leaves the split saved.
const AUTO_SAVE_DELAY_MS = 600

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

// What the server already holds, in the exact shape buildPayload produces. Seeding the auto-save
// with this is what stops merely opening the screen from firing a save: without it the first
// computed payload always looks like a change, so an untouched panel would POST an empty split and
// then claim "Saved" for work the cashier never did.
function serializeSavedAllocations(allocations: OrderPaymentAllocationApiDto[]): string {
  return JSON.stringify({
    allocations: allocations
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder)
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
  return allocations
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((allocation) => ({
      key: `split-${allocation.displayOrder}-${allocation.paymentMethodType}`,
      method: allocation.paymentMethodType as PosCheckoutPaymentMethodType,
      amountInput: allocation.amount > 0 ? allocation.amount.toFixed(2) : '',
      cashReceivedInput: allocation.cashReceived != null ? allocation.cashReceived.toFixed(2) : '',
      showCashReceived: allocation.cashReceived != null,
      autoFilled: false,
    }))
}

export default function PosQuickSplitPanel({
  amountDueCents,
  tipAmount,
  availableMethods,
  savedAllocations,
  isSaving,
  hasSavedOnce,
  onSave,
  onBack,
  disabled = false,
}: {
  amountDueCents: number
  tipAmount: number
  availableMethods: PosCheckoutPaymentMethodType[]
  savedAllocations: OrderPaymentAllocationApiDto[]
  isSaving: boolean
  hasSavedOnce: boolean
  onSave: (payload: SetOrderPaymentAllocationsPayload) => void
  onBack: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()

  const [rows, setRows] = useState<SplitRow[]>(() => {
    const restored = rowsFromAllocations(savedAllocations)
    return restored.length > 0 ? restored : [createRow(false), createRow(true)]
  })

  // Which row the tip arrived through. Held as the row key rather than an index so adding or
  // removing a payment cannot silently move the tip to a different method.
  const [tipBearerKey, setTipBearerKey] = useState<string | null>(() => {
    const restored = rowsFromAllocations(savedAllocations)
    return restored.find((_, index) => savedAllocations[index]?.tipAmount > 0)?.key
      ?? restored[0]?.key
      ?? null
  })

  const tipCents = toCents(tipAmount)

  // Recomputed on every render rather than stored: the pool of methods shrinks as rows claim them,
  // and a value captured once goes stale the moment another row takes it.
  const methodsInUse = useMemo(
    () => new Set(rows.map((row) => row.method).filter((method): method is PosCheckoutPaymentMethodType => method !== null)),
    [rows],
  )

  const allocatedCents = rows.reduce((sum, row) => sum + amountInputToCents(row.amountInput), 0)
  const outstandingCents = amountDueCents - allocatedCents

  const resolvedTipBearerKey = rows.some((row) => row.key === tipBearerKey) ? tipBearerKey : rows[0]?.key ?? null

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

  const buildPayload = useCallback((): SetOrderPaymentAllocationsPayload => ({
    allocations: rows
      .filter((row) => row.method !== null && amountInputToCents(row.amountInput) > 0)
      .map((row) => ({
        paymentMethodType: row.method as string,
        amount: fromCents(amountInputToCents(row.amountInput)),
        tipAmount: row.key === resolvedTipBearerKey ? fromCents(tipCents) : 0,
        cashReceived: row.method === PosCheckoutPaymentMethod.Cash && row.cashReceivedInput.trim() !== ''
          ? parseDirectPaymentAmountInput(row.cashReceivedInput)
          : null,
      })),
  }), [rows, resolvedTipBearerKey, tipCents])

  // Compared as text so an identical set never costs a request — an amount edited and edited back
  // is not a change worth sending, and the badge should not flicker for it.
  const lastSentRef = useRef<string>(serializeSavedAllocations(savedAllocations))
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const payload = buildPayload()
    const serialized = JSON.stringify(payload)
    if (serialized === lastSentRef.current) {
      setIsDirty(false)
      return
    }

    setIsDirty(true)
    const timer = setTimeout(() => {
      lastSentRef.current = serialized
      onSave(payload)
    }, AUTO_SAVE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [buildPayload, onSave])

  const applyFiftyFifty = () => {
    setRows((current) => {
      if (current.length < 2) return current
      // The odd cent goes to the second payment, so the two halves always add up to the exact
      // amount due rather than landing a cent short.
      const half = Math.floor(amountDueCents / 2)
      return current.map((row, index) => {
        if (index === 0) return { ...row, amountInput: centsToAmountInput(half), autoFilled: false }
        if (index === 1) return { ...row, amountInput: centsToAmountInput(amountDueCents - half), autoFilled: false }
        return { ...row, amountInput: '', autoFilled: false }
      })
    })
  }

  const applyRemaining = (key: string) => {
    setRows((current) => {
      const others = current
        .filter((row) => row.key !== key)
        .reduce((sum, row) => sum + amountInputToCents(row.amountInput), 0)
      const balance = Math.max(amountDueCents - others, 0)
      return current.map((row) => (row.key === key
        ? { ...row, amountInput: centsToAmountInput(balance), autoFilled: false }
        : row))
    })
  }

  const addMethod = () => {
    setRows((current) => [...current.map((row) => ({ ...row, autoFilled: false })), createRow(true)])
  }

  const clearSplit = () => {
    const fresh = [createRow(false), createRow(true)]
    setRows(fresh)
    setTipBearerKey(fresh[0].key)
  }

  const isBalanced = outstandingCents === 0 && allocatedCents > 0
  // "Saved" means what is on screen is what the server holds. That is true either because this
  // screen saved it or because it was already stored when the screen opened — but not when there is
  // nothing to store at all, where claiming a save would be a lie about untouched work.
  const hasPersistedSplit = hasSavedOnce || savedAllocations.length > 0
  const showSaved = hasPersistedSplit && !isDirty && !isSaving

  return (
    <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface">
      <div className="flex shrink-0 items-start gap-3 border-b border-nexoraBorder bg-nexoraCanvas/60 p-4">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraSurface text-nexoraText hover:bg-nexoraCanvas"
          aria-label={t(`${TK}.back`)}
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-tight text-nexoraText">{t(`${TK}.title`)}</h2>
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
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {rows.map((row, index) => {
          const rowCents = amountInputToCents(row.amountInput)
          const isCash = row.method === PosCheckoutPaymentMethod.Cash
          const cashReceivedCents = amountInputToCents(row.cashReceivedInput)
          const cashShort = isCash && row.cashReceivedInput.trim() !== '' && cashReceivedCents < rowCents
          const changeDueCents = cashReceivedCents - rowCents
          const methodMissing = row.method === null
          const amountMissing = !methodMissing && rowCents === 0
          const hasError = methodMissing || amountMissing || cashShort

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
                      : t(`${TK}.errorCashShort`)}
                </p>
              ) : null}
            </section>
          )
        })}

        {tipCents > 0 ? (
          <section className="rounded-2xl border border-nexoraBorder bg-nexoraCanvas/40 p-3">
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

      <div className="shrink-0 border-t border-nexoraBorder bg-nexoraCanvas/60 p-4">
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
        <div className="flex items-center justify-between gap-3">
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
        </div>
      </div>
    </div>
  )
}
