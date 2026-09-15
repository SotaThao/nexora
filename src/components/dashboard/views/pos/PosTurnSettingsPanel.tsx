// Turn rules on the Salon Information tab — a read-only summary of the numbers currently in
// force, with the same editor the Turn Board and the Bookings calendar open.
//
// Editing deliberately goes through that shared modal instead of a second inline form: the rules
// re-count every visit still open, so there must be exactly one place they can be changed.
import { useState } from 'react'
import { Edit2, Repeat } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTurnSettings } from '../../../../data/hooks/usePosTurnSettings'
import { SkeletonList } from '../../../ui/skeleton'
import WeightedTurnSettingsModal from './modals/WeightedTurnSettingsModal'
import { formatTurnTierRange } from './posTurnTiers'
import { formatTurnCredit } from './TurnGridView'

const K = 'components.dashboard.views.pos.PosTurnSettingsPanel'
const MODAL_K = 'components.dashboard.views.pos.WeightedTurnSettingsModal'

export default function PosTurnSettingsPanel({ businessId }: { businessId?: string }) {
  const { t } = useTranslation()
  const { data, isError } = useTurnSettings(businessId)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  const tiers = data?.serviceTurnTiers ?? []
  const canManage = data?.canManage ?? false
  const turnsValue = (credit: number) => t(`${K}.turnsUnit`, { turns: formatTurnCredit(credit) })

  const summaryRow = (label: string, value: string) => (
    <div className="flex flex-row items-center justify-between gap-3 border-t border-slate-50 py-1.5 first:border-t-0">
      <span className="font-bold text-nexoraMuted">{label}</span>
      <span className="font-extrabold text-nexoraText">{value}</span>
    </div>
  )

  return (
    <div className="rounded-xl border border-nexoraBorder bg-white shadow-sm p-6 relative">
      <div className="flex justify-between items-center border-b border-nexoraBorder pb-3 mb-2">
        <h4 className="text-xs font-black uppercase text-nexoraText tracking-wider flex items-center gap-2">
          <Repeat className="h-4 w-4 text-amber-500" />
          {t(`${K}.title`)}
        </h4>
        {data && canManage ? (
          <button
            type="button"
            onClick={() => setIsEditorOpen(true)}
            aria-label={t(`${K}.edit`)}
            className="text-slate-400 hover:text-nexoraBrand transition p-1 hover:bg-slate-100 rounded"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      <p className="mb-3 text-[11px] text-nexoraMuted">{t(`${K}.description`)}</p>

      {isError ? (
        <p className="text-xs font-bold text-nexoraDanger">{t(`${MODAL_K}.loadFailed`)}</p>
      ) : !data ? (
        <SkeletonList count={5} lines={1} />
      ) : (
        <div className="space-y-4 text-xs">
          <div>{summaryRow(t(`${MODAL_K}.bookingTurnCreditLabel`), turnsValue(data.bookingTurnCredit))}</div>

          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${MODAL_K}.serviceTiersLabel`)}
            </span>
            <div className="mt-1">
              {tiers.map((tier, index) =>
                <div key={tier.thresholdAmount}>
                  {summaryRow(formatTurnTierRange(tiers, index), turnsValue(tier.turnCredit))}
                </div>,
              )}
            </div>
          </div>

          {!canManage ? (
            <p className="text-[11px] font-bold text-nexoraMuted">{t(`${MODAL_K}.readOnlyNote`)}</p>
          ) : null}
        </div>
      )}

      {isEditorOpen && businessId ? (
        <WeightedTurnSettingsModal
          businessId={businessId}
          onClose={() => setIsEditorOpen(false)}
        />
      ) : null}
    </div>
  )
}
