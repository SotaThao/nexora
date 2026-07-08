import { createPortal } from 'react-dom'
import { AlertCircle, CheckCircle2, Download } from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useTranslation } from '../contexts/LanguageContext'
import type { CapgoUpdateUiState } from './useCapgoUpdateUI'

interface CapgoUpdateOverlayProps {
  state: CapgoUpdateUiState
  onDismiss: () => void
}

export default function CapgoUpdateOverlay({ state, onDismiss }: CapgoUpdateOverlayProps) {
  const { t } = useTranslation()

  if (state.phase === 'hidden' || typeof document === 'undefined') {
    return null
  }

  const platform = Capacitor.getPlatform()
  const restartHint =
    platform === 'ios' ? t('capgo_update.restart_ios') : t('capgo_update.restart_android')

  const title =
    state.phase === 'ready'
      ? t('capgo_update.title_ready')
      : state.phase === 'failed'
        ? t('capgo_update.title_failed')
        : t('capgo_update.title_downloading')

  const subtitle =
    state.phase === 'ready'
      ? t('capgo_update.subtitle_ready', { version: state.version || '—' })
      : state.phase === 'failed'
        ? t('capgo_update.retry_hint')
        : t('capgo_update.subtitle_downloading', { version: state.version || '—' })

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm modal-overlay-safe"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capgo-update-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl">
        <div className="bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-6 py-5 text-white">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              {state.phase === 'ready' ? (
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              ) : state.phase === 'failed' ? (
                <AlertCircle className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Download className="h-6 w-6" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <h2 id="capgo-update-title" className="text-lg font-black tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-sm font-medium text-white/85">{subtitle}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          {state.phase === 'downloading' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                <span>{t('capgo_update.progress_label')}</span>
                <span>{t('capgo_update.percent_value', { percent: state.percent })}</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-nexoraElectric to-nexoraViolet transition-[width] duration-300 ease-out"
                  style={{ width: `${state.percent}%` }}
                />
              </div>
              <p className="text-xs font-medium text-slate-500">{t('capgo_update.keep_open')}</p>
            </div>
          ) : null}

          {state.phase === 'ready' ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-sm leading-relaxed text-emerald-900">
              <p className="font-extrabold uppercase tracking-wide text-emerald-800">
                {t('capgo_update.restart_title')}
              </p>
              <p className="mt-2 font-medium">{restartHint}</p>
            </div>
          ) : null}

          {state.phase === 'failed' ? (
            <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-medium leading-relaxed text-amber-900">
              {t('capgo_update.retry_hint')}
            </div>
          ) : null}

          {state.phase !== 'downloading' ? (
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet px-4 py-3 text-sm font-extrabold text-white transition hover:opacity-90"
            >
              {state.phase === 'ready' ? t('capgo_update.got_it') : t('capgo_update.close')}
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
