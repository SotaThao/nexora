// CustomerHeaderBar — POS iPad redesign, Ticket 2 (re-scoped for the phone-first 2-step
// Check-in flow). Sits above the Order Workspace's 2-column layout (Create mode only), as
// Check-in Step 2 — phone itself is no longer collected here, it's already confirmed by
// PhoneCheckInStep (Step 1); this bar only shows it as a fixed chip with a "Change" link
// back to Step 1, plus the Name/Email inputs. Collapses to a compact chip on blur once
// Name is filled (tap to reopen and edit) — blur-triggered, not reactive on every keystroke.
// While editing, the confirmed phone number triggers a "returning customer" lookup and
// offers a one-tap "Use last visit" prefill of that customer's most recent service/
// technician pairs.
import { useState } from 'react'
import { Check, Phone, User } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useCustomerLookupByPhone } from '../../../../data/hooks/usePosOrders'
import type { CustomerLookupServiceLineApiDto } from '../../../../types/repositories'

export default function CustomerHeaderBar({
  businessId,
  customerName,
  customerPhone,
  customerEmail,
  onChangeName,
  onChangeEmail,
  onChangePhoneNumber,
  onApplyLastVisit,
}: {
  businessId: string
  customerName: string
  customerPhone: string
  customerEmail: string
  onChangeName: (value: string) => void
  onChangeEmail: (value: string) => void
  onChangePhoneNumber: () => void
  onApplyLastVisit: (serviceLines: CustomerLookupServiceLineApiDto[]) => void
}) {
  const { t } = useTranslation()
  // Name is optional (a walk-in may decline to give one) — collapsing to the compact chip
  // only makes sense once there's a name to show in it, so an empty Name just leaves the
  // bar expanded rather than collapsing to a nameless chip.
  const isFilled = Boolean(customerName.trim())
  const [collapsed, setCollapsed] = useState(false)
  const { data: lookup } = useCustomerLookupByPhone(businessId, customerPhone)

  // Collapse on blur (leaving Name), not reactively on every keystroke — see
  // feedback_ui_jank_verification-adjacent history: a render-time effect keyed on isFilled
  // collapsed the bar mid-entry in an earlier version of this component.
  const handleFieldBlur = () => {
    if (isFilled) setCollapsed(true)
  }

  if (collapsed && isFilled) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="flex w-full items-center gap-2 rounded-xl border border-posFdBorder bg-posFdSurface px-4 py-2.5 text-left hover:border-posFdAccent"
      >
        <User className="h-4 w-4 shrink-0 text-posFdAccentDark" />
        <span className="truncate text-sm font-bold text-posFdText">{customerName}</span>
        <span className="shrink-0 text-xs text-nexoraMuted">· {customerPhone}</span>
      </button>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-posFdBorder bg-posFdSurface p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosFrontDeskView.customerPhone')}
          </label>
          <div className="mt-1 flex h-11 items-center justify-between rounded-lg border border-posFdBorder bg-posFdCanvas px-3 text-sm text-posFdText">
            <span className="flex items-center gap-1.5 truncate">
              <Phone className="h-3.5 w-3.5 shrink-0 text-posFdAccentDark" />
              {customerPhone}
            </span>
            <button
              type="button"
              onClick={onChangePhoneNumber}
              className="shrink-0 text-[10px] font-bold uppercase text-posFdAccentDark hover:underline"
            >
              {t('components.dashboard.views.pos.CustomerHeaderBar.changeNumber')}
            </button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosFrontDeskView.customerName')}
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => onChangeName(e.target.value)}
            onBlur={handleFieldBlur}
            placeholder={t('components.dashboard.views.pos.CustomerHeaderBar.namePlaceholder')}
            className="mt-1 h-11 w-full rounded-lg border border-posFdBorder bg-white px-3 text-sm text-posFdText outline-none focus:border-posFdAccent"
          />
        </div>
        <div>
          <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
            {t('components.dashboard.views.pos.PosFrontDeskView.customerEmail')}
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => onChangeEmail(e.target.value)}
            placeholder={t('components.dashboard.views.pos.CustomerHeaderBar.emailPlaceholder')}
            className="mt-1 h-11 w-full rounded-lg border border-posFdBorder bg-white px-3 text-sm text-posFdText outline-none focus:border-posFdAccent"
          />
        </div>
      </div>

      {lookup ? (
        <div className="flex items-center justify-between gap-3 rounded-lg bg-posFdCanvas px-3 py-2">
          <p className="min-w-0 truncate text-[11px] font-semibold text-posFdText">
            {t('components.dashboard.views.pos.CustomerHeaderBar.returningCustomer', {
              name: lookup.customerName,
              summary:
                lookup.serviceLines.length > 0
                  ? lookup.serviceLines
                      .map((l) => (l.technicianName ? `${l.technicianName} (${l.serviceName})` : l.serviceName))
                      .join(', ')
                  : t('components.dashboard.views.pos.CustomerHeaderBar.noServicesLastVisit'),
            })}
          </p>
          {lookup.serviceLines.length > 0 ? (
            <button
              type="button"
              onClick={() => onApplyLastVisit(lookup.serviceLines)}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-posFdAccent px-2.5 py-1 text-[10px] font-bold text-posFdAccentDark hover:bg-posFdAccent hover:text-white"
            >
              <Check className="h-3 w-3" />
              {t('components.dashboard.views.pos.CustomerHeaderBar.useLastVisit')}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
