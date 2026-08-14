import { useLayoutEffect, useRef, useState } from 'react'
import { AlertTriangle, ChevronDown, Info } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  VLINKPAY_COINS,
  VLINKPAY_NETWORK,
  type VlinkpayAddresses,
  type VlinkpayCoinKey,
} from './vlinkpayWallet'

const TK = 'components.dashboard.modals.PayoutSetupModal'

const GUIDE_STEPS = [
  { n: 1, titleKey: `${TK}.vlinkpayGuideStep1Title`, bodyKey: `${TK}.vlinkpayGuideStep1Body` },
  { n: 2, titleKey: `${TK}.vlinkpayGuideStep2Title`, bodyKey: `${TK}.vlinkpayGuideStep2Body` },
  { n: 3, titleKey: `${TK}.vlinkpayGuideStep3Title`, bodyKey: `${TK}.vlinkpayGuideStep3Body` },
  { n: 4, titleKey: `${TK}.vlinkpayGuideStep4Title`, bodyKey: `${TK}.vlinkpayGuideStep4Body` },
] as const

type VlinkpayWalletFieldsProps = {
  addresses: VlinkpayAddresses
  onChange: (coin: VlinkpayCoinKey, nextValue: string) => void
  guideOpen: boolean
  onToggleGuide: () => void
  disabled?: boolean
  error?: string
  placeholder?: string
}

export default function VlinkpayWalletFields({
  addresses,
  onChange,
  guideOpen,
  onToggleGuide,
  disabled = false,
  error = '',
  placeholder = '',
}: VlinkpayWalletFieldsProps) {
  const { t } = useTranslation()
  const guideBodyRef = useRef<HTMLDivElement>(null)
  const [guideHeight, setGuideHeight] = useState<number | 'auto'>(guideOpen ? 'auto' : 0)
  const [guideReady, setGuideReady] = useState(false)

  useLayoutEffect(() => {
    const el = guideBodyRef.current
    if (!el) return

    const applyHeight = () => {
      setGuideHeight(guideOpen ? el.scrollHeight : 0)
    }

    applyHeight()
    const frame = requestAnimationFrame(() => setGuideReady(true))
    const observer = new ResizeObserver(applyHeight)
    observer.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [guideOpen, t])

  return (
    <div className="space-y-3 font-sans sm:space-y-3.5">
      <div className="rounded-[10px] border border-[#f7d9c2] bg-[#fff5ee] px-3 py-2">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#f97316] sm:h-4 sm:w-4" />
          <p className="text-[10px] font-medium leading-[1.4] text-[#ea580c] sm:text-[11px] sm:leading-[1.35]">
            {t(`${TK}.vlinkpayTopWarning`)}
          </p>
        </div>
      </div>

      <section>
        <h4 className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800 sm:text-xs">
          {t(`${TK}.vlinkpayAddressSectionTitle`)}
        </h4>
        <p className="mt-0.5 text-[10px] text-slate-500 sm:text-[11px]">
          {t(`${TK}.vlinkpayAddressSectionHint`)}
        </p>
      </section>

      <div className="space-y-3 sm:space-y-4">
        {VLINKPAY_COINS.map((coin) => (
          <div key={coin.key} className="space-y-1.5">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <img
                src={coin.asset}
                alt=""
                className="h-7 w-7 shrink-0 rounded-full object-cover sm:h-8 sm:w-8"
              />
              <div className="min-w-0">
                <div className="text-xs font-extrabold leading-4 text-slate-900 sm:text-[13px]">
                  {coin.name}
                </div>
                <div className="text-[10px] font-semibold uppercase text-slate-500">
                  {coin.symbol}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-3">
              <label
                htmlFor={`vlinkpay-address-${coin.key}`}
                className="text-[10px] font-bold uppercase tracking-wide text-slate-500"
              >
                {t(`${TK}.vlinkpayWalletAddressLabel`)}
              </label>
              <span className="text-[10px] font-semibold text-slate-500">
                {t(`${TK}.vlinkpayNetworkLabel`)}
                <span className="ml-1 font-bold text-[#3657db]">{VLINKPAY_NETWORK}</span>
              </span>
            </div>

            <input
              id={`vlinkpay-address-${coin.key}`}
              type="text"
              disabled={disabled}
              value={addresses[coin.key]}
              autoComplete="off"
              spellCheck={false}
              placeholder={placeholder}
              onChange={(event) => onChange(coin.key, event.target.value)}
              className={`h-8 w-full rounded-lg border bg-white px-2.5 font-sans text-[10px] text-slate-800 outline-none transition placeholder:text-[10px] placeholder:text-slate-400 focus:border-[#3657db] focus:ring-2 focus:ring-[#3657db]/15 sm:h-9 sm:text-[11px] sm:placeholder:text-[11px] ${
                error ? 'border-rose-400' : 'border-slate-200'
              } ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
            />
          </div>
        ))}
        {error ? <p className="text-[10px] font-bold text-rose-500">{error}</p> : null}
      </div>

      <div className="overflow-hidden rounded-[8px] border border-slate-200 bg-white">
        <button
          type="button"
          onClick={onToggleGuide}
          className="flex w-full items-center justify-between gap-3 bg-slate-50 px-3 py-2 text-left sm:py-2.5"
        >
          <span className={`text-[10px] font-extrabold uppercase tracking-wide sm:text-[11px] ${guideOpen ? 'text-[#2563eb]' : 'text-slate-700'}`}>
            {t(`${TK}.vlinkpayGuideTitle`)}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-[340ms] ${
              guideOpen ? 'rotate-180 text-[#2563eb]' : 'text-slate-500'
            }`}
            style={{ transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </button>

        <div
          className="overflow-hidden"
          style={{
            height: guideHeight,
            transition: guideReady
              ? 'height 0.34s cubic-bezier(0.22, 1, 0.36, 1)'
              : 'none',
          }}
        >
          <div ref={guideBodyRef} className="space-y-2 border-t border-slate-100 px-3 py-2.5 sm:py-3">
            {GUIDE_STEPS.map((step) => (
              <div
                key={step.n}
                className="flex items-start gap-2 border-b border-slate-100 pb-2 last:border-b-0 last:pb-0"
              >
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#2563eb] text-[10px] font-bold text-white">
                  {step.n}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] font-extrabold text-slate-800 sm:text-[11px]">
                    {t(step.titleKey)}
                  </div>
                  <p className="mt-0.5 text-[10px] leading-[1.4] text-slate-500">
                    {t(step.bodyKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-2.5 text-[10px] leading-relaxed text-[#1d4ed8] sm:p-3 sm:text-[10.5px]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563eb] sm:h-4 sm:w-4" />
        <span>{t(`${TK}.vlinkpayFooterWarning`)}</span>
      </div>
    </div>
  )
}
