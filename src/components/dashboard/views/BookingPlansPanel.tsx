import React, { useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useMyVoiceTrialRequest } from '../../../data/hooks/useMyVoiceTrialRequest'
import BookingTrialModal from './BookingTrialModal'

const TK = 'components.dashboard.views.BookingHubView.plans'

type PlanId = 'Starter' | 'Pro' | 'Elite'

const PLAN_BUTTON_LABEL_KEY: Record<PlanId, string> = {
  Starter: 'selectStarter',
  Pro: 'startTrial',
  Elite: 'selectElite',
}

function PlanFeature({ included, children }: { included: boolean; children: React.ReactNode }) {
  return (
    <div className="plan-feature">
      <span className={`plan-check ${included ? '' : 'muted'}`}>{included ? '✓' : '—'}</span>
      <span>{children}</span>
    </div>
  )
}

export default function BookingPlansPanel() {
  const { t } = useTranslation()
  const { data: myTrialRequest, isLoading: isTrialRequestLoading } = useMyVoiceTrialRequest()
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null)
  const [trialOpen, setTrialOpen] = useState(false)

  const hasExistingTrialRequest = myTrialRequest != null

  const getPlanButtonLabel = (plan: PlanId) => {
    if (plan === 'Pro' && hasExistingTrialRequest) {
      return t(`${TK}.trialRequestSubmitted`)
    }
    if (selectedPlan === plan) {
      return t(`${TK}.planSelected`, { plan })
    }
    return t(`${TK}.${PLAN_BUTTON_LABEL_KEY[plan]}`)
  }

  const isPlanButtonPrimary = (plan: PlanId) => {
    if (selectedPlan) return selectedPlan === plan
    return plan === 'Pro'
  }

  const handlePlanClick = (plan: PlanId) => {
    // Match HTML: Pro opens trial modal; Starter/Elite only toggle selection.
    if (plan === 'Pro') {
      if (hasExistingTrialRequest || isTrialRequestLoading) return
      setTrialOpen(true)
      return
    }
    setSelectedPlan(plan)
  }

  return (
    <>
      <div className="plans-stack">
        <div className="plans-hero">{t(`${TK}.hero`)}</div>

        <div className="plans-grid">
          <article
            className={`service-plan-card ${selectedPlan === 'Starter' ? 'is-selected' : ''}`}
            data-plan-card="starter"
          >
            <div className="plan-rec" aria-hidden="true" />
            <div className="service-plan-name">Starter</div>
            <div className="service-plan-price">
              $99
              <span>/mo</span>
            </div>
            <div className="service-plan-cross">$149/mo</div>
            <div className="plan-features">
              <PlanFeature included>AI Voice 24/7</PlanFeature>
              <PlanFeature included>Missed-call SMS</PlanFeature>
              <PlanFeature included>500 min · 500 SMS</PlanFeature>
              <PlanFeature included={false}>{t(`${TK}.dashboardInPro`)}</PlanFeature>
              <PlanFeature included={false}>{t(`${TK}.googleReviewInPro`)}</PlanFeature>
            </div>
            <button
              className={`plan-select-button ${isPlanButtonPrimary('Starter') ? 'is-primary' : ''}`}
              type="button"
              onClick={() => handlePlanClick('Starter')}
            >
              {getPlanButtonLabel('Starter')}
            </button>
          </article>

          <article
            className={`service-plan-card is-recommended ${selectedPlan === 'Pro' ? 'is-selected' : ''}`}
            data-plan-card="pro"
          >
            <div className="plan-rec">{t(`${TK}.recommended`)}</div>
            <div className="service-plan-name">Pro</div>
            <div className="service-plan-price">
              $199
              <span>/mo</span>
            </div>
            <div className="service-plan-cross">$299/mo</div>
            <div className="plan-features">
              <PlanFeature included>AI Voice + SMS Campaigns</PlanFeature>
              <PlanFeature included>Owner Dashboard</PlanFeature>
              <PlanFeature included>Auto Google Review</PlanFeature>
              <PlanFeature included>{t(`${TK}.landingPagesAiDesign`)}</PlanFeature>
              <PlanFeature included>1,000 min · 1,000 SMS</PlanFeature>
              <div className="plan-aio">{t(`${TK}.aioEngine`)}</div>
            </div>
            <button
              className={`plan-select-button ${isPlanButtonPrimary('Pro') ? 'is-primary' : ''}`}
              type="button"
              disabled={hasExistingTrialRequest || isTrialRequestLoading}
              onClick={() => handlePlanClick('Pro')}
            >
              {getPlanButtonLabel('Pro')}
            </button>
          </article>

          <article
            className={`service-plan-card ${selectedPlan === 'Elite' ? 'is-selected' : ''}`}
            data-plan-card="elite"
          >
            <div className="plan-rec" aria-hidden="true" />
            <div className="service-plan-name">Elite</div>
            <div className="service-plan-price">
              $349
              <span>/mo</span>
            </div>
            <div className="service-plan-cross">$499/mo</div>
            <div className="plan-features">
              <PlanFeature included>{t(`${TK}.everythingInPro`)}</PlanFeature>
              <div className="plan-aio">{t(`${TK}.aioMax`)}</div>
              <PlanFeature included>Staff Dashboard + TAX IQ</PlanFeature>
              <PlanFeature included>{t(`${TK}.eliteUsage`)}</PlanFeature>
              <PlanFeature included>{t(`${TK}.emailMarketingWinback`)}</PlanFeature>
            </div>
            <button
              className={`plan-select-button ${isPlanButtonPrimary('Elite') ? 'is-primary' : ''}`}
              type="button"
              onClick={() => handlePlanClick('Elite')}
            >
              {getPlanButtonLabel('Elite')}
            </button>
          </article>
        </div>

        <article className="roi-panel">
          <div className="card-heading">
            <h2 className="card-title">{t(`${TK}.roiTitle`)}</h2>
            <span className="card-meta">{t(`${TK}.roiMeta`)}</span>
          </div>
          <div className="roi-grid">
            <div className="roi-metric is-loss">
              <div className="roi-value">$3,200</div>
              <div className="roi-label">{t(`${TK}.lostPerMonth`)}</div>
            </div>
            <div className="roi-metric is-cost">
              <div className="roi-value">$199</div>
              <div className="roi-label">{t(`${TK}.nexoraCost`)}</div>
            </div>
            <div className="roi-metric is-gain">
              <div className="roi-value">+$2,200</div>
              <div className="roi-label">{t(`${TK}.extraRevenue`)}</div>
            </div>
          </div>
          <div className="business-sub roi-summary">
            {t(`${TK}.roiLabel`)}: <strong>16x</strong> {t(`${TK}.roiPaybackPrefix`)}{' '}
            <strong>{t(`${TK}.roiPaybackDays`)}</strong>
          </div>
        </article>

        <article className="guarantee-panel">
          <div className="card-heading">
            <h2 className="card-title">{t(`${TK}.guaranteeTitle`)}</h2>
            <span className="card-meta">{t(`${TK}.guaranteeMeta`)}</span>
          </div>
          <div className="guarantee-grid">
            <div>✓ {t(`${TK}.pilotFree`)}</div>
            <div>✓ {t(`${TK}.noCreditCard`)}</div>
            <div>✓ {t(`${TK}.setup24h`)}</div>
            <div>✓ {t(`${TK}.cancelAnytime`)}</div>
          </div>
        </article>
      </div>

      <BookingTrialModal open={trialOpen} onClose={() => setTrialOpen(false)} />
    </>
  )
}
