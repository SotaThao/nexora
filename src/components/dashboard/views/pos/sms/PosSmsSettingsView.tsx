import { useState } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { usePosSmsSettings } from '../../../../../data/hooks/usePosSmsSettings'
import { getErrorMessage } from '../../../../../data/errorCodes'
import {
  PosSmsSettingsSubTab,
  PosSmsTemplateType,
} from '../../../../../constants/posSmsSettings'
import type { PosSmsMessageSettingsApiDto } from '../../../../../types/posSms'
import PosSmsLinkSettingsPanel from './PosSmsLinkSettingsPanel'
import PosSmsMessagePanel from './PosSmsMessagePanel'

const K = 'components.dashboard.views.pos.PosSmsSettings'

type Props = {
  businessId: string
}

const SUB_TABS: { id: PosSmsSettingsSubTab; labelKey: string }[] = [
  { id: PosSmsSettingsSubTab.Welcome, labelKey: 'welcome' },
  { id: PosSmsSettingsSubTab.AfterCheckout, labelKey: 'afterCheckout' },
  { id: PosSmsSettingsSubTab.Link, labelKey: 'link' },
]

const savedStateKey = (message: PosSmsMessageSettingsApiDto) =>
  `${message.enabled}|${message.sendMode}|${message.body}`

export default function PosSmsSettingsView({ businessId }: Props) {
  const { t } = useTranslation()
  const [subTab, setSubTab] = useState<PosSmsSettingsSubTab>(PosSmsSettingsSubTab.Welcome)
  const { data: settings, isLoading, error } = usePosSmsSettings(businessId)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-xs font-semibold text-nexoraMuted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {t(`${K}.loading`)}
      </div>
    )
  }

  if (error || !settings) {
    return (
      <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
        {error ? getErrorMessage(error, t) : t(`${K}.loadFailed`)}
      </p>
    )
  }

  const aiHubWarning = !settings.aiHub.active
    ? t(`${K}.aiHub.inactive`)
    : settings.aiHub.smsCreditRemaining <= 0
      ? t(`${K}.aiHub.noCredit`)
      : null

  return (
    <div className="flex flex-col gap-4">
      {aiHubWarning ? (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{aiHubWarning}</span>
        </div>
      ) : null}

      <div role="tablist" aria-label={t(`${K}.tabs.ariaLabel`)} className="flex flex-wrap gap-1 border-b border-nexoraBorder">
        {SUB_TABS.map(({ id, labelKey }) => {
          const isActive = subTab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setSubTab(id)}
              className={`-mb-px min-h-10 border-b-2 px-3 text-xs font-bold transition ${
                isActive ? 'border-nexoraBrand text-nexoraBrand' : 'border-transparent text-nexoraMuted hover:text-nexoraText'
              }`}
            >
              {t(`${K}.tabs.${labelKey}`)}
            </button>
          )
        })}
      </div>

      {subTab === PosSmsSettingsSubTab.Welcome ? (
        <PosSmsMessagePanel
          key={savedStateKey(settings.welcome)}
          businessId={businessId}
          type={PosSmsTemplateType.Welcome}
          settings={settings.welcome}
          salonName={settings.salonName}
          estimateValues={settings.estimateValues}
          visitLinkTtlDays={settings.visitLinkTtlDays}
          defaultTestPhone={settings.defaultTestPhone}
        />
      ) : null}
      {subTab === PosSmsSettingsSubTab.AfterCheckout ? (
        <PosSmsMessagePanel
          key={savedStateKey(settings.afterCheckout)}
          businessId={businessId}
          type={PosSmsTemplateType.AfterCheckout}
          settings={settings.afterCheckout}
          salonName={settings.salonName}
          estimateValues={settings.estimateValues}
          visitLinkTtlDays={settings.visitLinkTtlDays}
          defaultTestPhone={settings.defaultTestPhone}
        />
      ) : null}
      {subTab === PosSmsSettingsSubTab.Link ? (
        <PosSmsLinkSettingsPanel
          key={settings.visitLinkTtlDays}
          businessId={businessId}
          visitLinkTtlDays={settings.visitLinkTtlDays}
          options={settings.visitLinkTtlDayOptions}
        />
      ) : null}
    </div>
  )
}
