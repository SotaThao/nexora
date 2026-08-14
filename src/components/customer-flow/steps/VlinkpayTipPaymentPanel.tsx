import React, { useEffect, useMemo, useState } from 'react'
import { ArrowLeftRight, Check, CheckCircle, Copy, Loader2 } from 'lucide-react'
import {
  VLINKPAY_BRAND,
  VLINKPAY_COINS,
  VLINKPAY_NETWORK,
  VLINKPAY_WALLET_LABEL,
  firstAvailableVlinkpayCoin,
  hasAtLeastOneVlinkpayAddress,
  type VlinkpayAddresses,
  type VlinkpayCoinKey,
} from '../../payout/vlinkpayWallet'

const TK = 'components.customer_flow.steps.WalletDetails'

type PanelPhase = 'select' | 'overview'

type Props = {
  t: (key: string, params?: Record<string, string | number>) => string
  logo: React.ReactNode
  amount: number
  addresses: VlinkpayAddresses
  showToast: (message: string, type: string) => void
  /** POST /touch/tip with cryptoSymbol when asset Confirm is pressed. */
  onConfirmAsset: (cryptoSymbol: string) => Promise<boolean>
  /** Confirm tip receipt after customer sent crypto. */
  onConfirmSent: () => void
  /** Clear created tip when user goes back to change asset. */
  onChangeAsset?: () => void
  onBack: () => void
  confirmLabel: string
  paySubtitleKey?: string
  tipReady?: boolean
  isCreatingTip?: boolean
  isConfirming?: boolean
}

function highlightParts(text: string, highlights: string[]): React.ReactNode {
  if (!highlights.length) return text
  const pattern = new RegExp(
    `(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'g',
  )
  return text.split(pattern).map((part, i) =>
    highlights.includes(part) ? (
      <strong key={i} className="font-bold text-nexoraBrand">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

export default function VlinkpayTipPaymentPanel({
  t,
  logo,
  amount,
  addresses,
  showToast,
  onConfirmAsset,
  onConfirmSent,
  onChangeAsset,
  onBack,
  confirmLabel,
  paySubtitleKey = `${TK}.vlinkpayPaySubtitle`,
  tipReady = false,
  isCreatingTip = false,
  isConfirming = false,
}: Props) {
  const availableCoins = useMemo(
    () => VLINKPAY_COINS.filter((coin) => addresses[coin.key].trim()),
    [addresses],
  )
  const [phase, setPhase] = useState<PanelPhase>(tipReady ? 'overview' : 'select')
  const [selectedCoin, setSelectedCoin] = useState<VlinkpayCoinKey | null>(() =>
    firstAvailableVlinkpayCoin(addresses),
  )

  useEffect(() => {
    if (selectedCoin && addresses[selectedCoin].trim()) return
    setSelectedCoin(firstAvailableVlinkpayCoin(addresses))
  }, [addresses, selectedCoin])

  useEffect(() => {
    if (tipReady) setPhase('overview')
  }, [tipReady])

  const selectedMeta = selectedCoin
    ? (VLINKPAY_COINS.find((coin) => coin.key === selectedCoin) || null)
    : null
  const receiveAddress = selectedCoin ? addresses[selectedCoin].trim() : ''
  const amountLabel = amount.toFixed(2)
  const cryptoAmountLabel = selectedMeta
    ? `${amountLabel} ${selectedMeta.symbol}`
    : `$${amountLabel}`
  const hasAddress = hasAtLeastOneVlinkpayAddress(addresses)
  const busy = isCreatingTip || isConfirming
  const canLockAsset = Boolean(selectedMeta && receiveAddress && !busy)
  const canSendConfirm = Boolean(phase === 'overview' && tipReady && selectedMeta && receiveAddress && !busy)

  const steps = selectedMeta
    ? [
        t(`${TK}.vlinkpayStepCopyAddress`),
        t(`${TK}.vlinkpayStepOpenApp`),
        t(`${TK}.vlinkpayStepSendAmount`, {
          symbol: selectedMeta.symbol,
          amount: amountLabel,
        }),
        t(`${TK}.vlinkpayStepConfirm`, { confirm: confirmLabel }),
      ]
    : []

  const stepHighlights = selectedMeta
    ? [
        [],
        [VLINKPAY_WALLET_LABEL],
        [selectedMeta.symbol, `${amountLabel} ${selectedMeta.symbol}`],
        [confirmLabel, `'${confirmLabel}'`],
      ]
    : []

  const headerCard = (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-nexoraBorder bg-white px-3.5 py-3.5 shadow-sm sm:px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-nexoraBorder bg-white shadow-sm">
          <span className="scale-125">{logo}</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-nexoraText">{VLINKPAY_BRAND}</p>
          <p className="truncate text-[11px] text-nexoraMuted">{t(paySubtitleKey)}</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-base font-black tracking-tight text-nexoraText sm:text-lg">
          {cryptoAmountLabel}
        </p>
        <p className="text-[11px] font-semibold text-nexoraBrand">
          {t(`${TK}.vlinkpayApproxUsd`, { amount: amountLabel })}
        </p>
      </div>
    </div>
  )

  const receiveAddressCard = receiveAddress ? (
    <div className="space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">
        {t(`${TK}.vlinkpayReceiveAddress`)}
      </p>
      <div className="flex items-center gap-2 rounded-2xl border border-nexoraBorder bg-white px-3.5 py-3 shadow-sm">
        <p className="min-w-0 flex-1 break-all font-mono text-[12px] font-semibold leading-snug text-nexoraText sm:text-sm">
          {receiveAddress}
        </p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(receiveAddress)
            showToast(t('common.copied'), 'success')
          }}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-nexoraBrand/30 bg-white px-2.5 py-1.5 text-[10px] font-bold text-nexoraBrand transition hover:bg-nexoraBrandSoft"
        >
          <Copy className="h-3.5 w-3.5" />
          {t('common.copy')}
        </button>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-nexoraSubtle">
        {t(`${TK}.vlinkpayFixedNetwork`, { network: VLINKPAY_NETWORK })}
      </p>
    </div>
  ) : null

  const goBackToSelect = () => {
    if (busy) return
    onChangeAsset?.()
    setPhase('select')
  }

  if (phase === 'select') {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="space-y-3">
          {headerCard}

          <div className="rounded-2xl border border-nexoraBorder bg-white p-4 shadow-sm space-y-3 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-bold text-nexoraText">
                <ArrowLeftRight className="h-3.5 w-3.5 text-nexoraBrand" />
                {t(`${TK}.vlinkpaySelectAsset`)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-nexoraSubtle">
                {t(`${TK}.vlinkpayFixedNetwork`, { network: VLINKPAY_NETWORK })}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {VLINKPAY_COINS.map((coin) => {
                const enabled = Boolean(addresses[coin.key].trim())
                const selected = selectedCoin === coin.key
                return (
                  <button
                    key={coin.key}
                    type="button"
                    disabled={!enabled || busy}
                    onClick={() => setSelectedCoin(coin.key)}
                    className={[
                      'relative flex items-center gap-3 rounded-2xl border px-3.5 py-3.5 text-left transition',
                      selected
                        ? 'border-nexoraBrand bg-nexoraBrandSoft/40 shadow-sm'
                        : 'border-nexoraBorder bg-white hover:border-nexoraBrand/40',
                      !enabled || busy ? 'cursor-not-allowed opacity-45' : '',
                    ].join(' ')}
                  >
                    <span
                      className={[
                        'absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border',
                        selected
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder bg-white text-transparent',
                      ].join(' ')}
                    >
                      {selected ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                    </span>
                    <img src={coin.asset} alt="" className="h-9 w-9 rounded-full object-contain" />
                    <span className="min-w-0 pr-6">
                      <span className="block text-sm font-extrabold text-nexoraText">{coin.symbol}</span>
                      <span className="block text-[11px] text-nexoraMuted">{coin.name}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {!availableCoins.length ? (
              <p className="text-center text-sm text-nexoraMuted">
                {t(`${TK}.vlinkpayAddressMissing`)}
              </p>
            ) : null}
          </div>

          {receiveAddressCard}
        </div>

        <div className="space-y-3 pt-1">
          <button
            type="button"
            onClick={async () => {
              if (!canLockAsset || !selectedMeta) return
              const ok = await onConfirmAsset(selectedMeta.symbol)
              if (ok) setPhase('overview')
            }}
            disabled={!canLockAsset}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-nexoraElectric/25 transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
          >
            {isCreatingTip ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" strokeWidth={3} />}
            {t(`${TK}.vlinkpayConfirmAsset`)}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas py-3 text-xs font-extrabold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraSurfaceMuted disabled:opacity-60"
          >
            {t(`${TK}.goBack`)}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="space-y-3">
        {headerCard}

        {selectedMeta ? (
          <div className="flex items-center gap-3 rounded-2xl border border-nexoraBrand/35 bg-nexoraBrandSoft/40 px-3.5 py-3.5">
            <img src={selectedMeta.asset} alt="" className="h-10 w-10 rounded-full object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-nexoraSubtle">
                {t(`${TK}.vlinkpaySelectedAsset`)}
              </p>
              <p className="truncate text-sm font-extrabold text-nexoraText">
                {selectedMeta.symbol}
                <span className="ml-1.5 text-[11px] font-semibold text-nexoraMuted">
                  {selectedMeta.name}
                </span>
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={goBackToSelect}
              className="shrink-0 rounded-xl border border-nexoraBrand/40 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-nexoraBrand transition hover:bg-nexoraBrandSoft disabled:opacity-60"
            >
              {t(`${TK}.vlinkpayChangeAsset`)}
            </button>
          </div>
        ) : null}

        {receiveAddressCard}

        {selectedMeta && hasAddress ? (
          <ol className="space-y-2.5 rounded-2xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraCanvas text-[11px] font-black text-nexoraSubtle">
                  {i + 1}
                </span>
                <span className="pt-0.5 text-sm leading-snug text-nexoraText">
                  {highlightParts(step, stepHighlights[i] || [])}
                </span>
              </li>
            ))}
          </ol>
        ) : null}
      </div>

      <div className="space-y-3 pt-1">
        <button
          type="button"
          onClick={onConfirmSent}
          disabled={!canSendConfirm}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-4 text-sm font-extrabold uppercase tracking-wider text-white shadow-lg shadow-nexoraElectric/25 transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 disabled:active:scale-100"
        >
          {isConfirming ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
          {confirmLabel}
        </button>

        <button
          type="button"
          onClick={goBackToSelect}
          disabled={busy}
          className="w-full rounded-xl border border-nexoraBorder bg-nexoraCanvas py-3 text-xs font-extrabold uppercase tracking-wider text-nexoraMuted transition hover:bg-nexoraSurfaceMuted disabled:opacity-60"
        >
          {t(`${TK}.goBack`)}
        </button>
      </div>
    </div>
  )
}
