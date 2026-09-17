import { useLayoutEffect, useRef, useState } from 'react'
import { AlertTriangle, Camera, ChevronDown, FolderOpen, Info, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import ImageFileInput from '../ui/ImageFileInput'
import {
  VLINKPAY_ADDRESS_MAX_LENGTH,
  VLINKPAY_COINS,
  VLINKPAY_NETWORK,
  VLINKPAY_ADDRESS_INPUT_CLASS,
  stripVlinkpayWalletAddressInput,
  type VlinkpayAddresses,
  type VlinkpayCoinKey,
  type VlinkpayImages,
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
  /** Per-coin QR image preview (data/blob/remote URL, or '' when none). */
  images?: VlinkpayImages
  onImagePickFile?: (coin: VlinkpayCoinKey, file: File) => void
  onImageClear?: (coin: VlinkpayCoinKey) => void
  onTakePhoto?: (coin: VlinkpayCoinKey) => void
  uploadError?: string
}

export default function VlinkpayWalletFields({
  addresses,
  onChange,
  guideOpen,
  onToggleGuide,
  disabled = false,
  error = '',
  placeholder = '',
  images,
  onImagePickFile,
  onImageClear,
  onTakePhoto,
  uploadError = '',
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
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={VLINKPAY_ADDRESS_MAX_LENGTH}
              placeholder={placeholder}
              onKeyDown={(event) => {
                if (event.key === ' ' || event.code === 'Space') event.preventDefault()
              }}
              onChange={(event) => onChange(coin.key, stripVlinkpayWalletAddressInput(event.target.value))}
              className={`${VLINKPAY_ADDRESS_INPUT_CLASS} ${
                error ? 'border-rose-400' : 'border-slate-200'
              } ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-400' : ''}`}
            />

            {images && onImagePickFile && onImageClear ? (
              <div className="pt-1">
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  {t(`${TK}.qrCodeOptional`)}
                </label>
                {images[coin.key] ? (
                  <div className="relative flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2">
                    {!disabled && (
                      <button
                        type="button"
                        onClick={() => onImageClear(coin.key)}
                        className="absolute right-1 top-1 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        aria-label={t('common.delete')}
                        title={t('common.delete')}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-slate-100 bg-white p-1">
                      <img src={images[coin.key]} alt={`${coin.symbol} QR code`} className="h-full w-full object-contain" />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-500">{coin.symbol}</span>
                  </div>
                ) : disabled ? null : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onTakePhoto?.(coin.key)}
                      className="flex flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-3 transition hover:border-nexoraBrand hover:bg-slate-50/50"
                    >
                      <Camera className="h-4 w-4 text-nexoraBrand" />
                      <span className="text-[10px] font-bold text-slate-600">{t('setup.take_photo')}</span>
                    </button>
                    <ImageFileInput
                      as="label"
                      className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-slate-200 bg-slate-50 py-3 transition hover:border-nexoraBrand hover:bg-slate-50/50"
                      onPickFile={(file) => onImagePickFile(coin.key, file)}
                      disabled={disabled}
                    >
                      <FolderOpen className="h-4 w-4 text-nexoraBrand" />
                      <span className="text-[10px] font-bold text-slate-600">{t('setup.choose_file')}</span>
                    </ImageFileInput>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        ))}
        {error ? <p className="text-[10px] font-bold text-rose-500">{error}</p> : null}
        {uploadError ? <p className="text-[10px] font-bold text-rose-500">{uploadError}</p> : null}
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
