import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqTaxReminders } from '../../../../data/hooks/useTaxiqTaxReminders'
import type { TaxPaymentReminder } from '../../../../data/repositories/taxiqTaxReminders'
import { SkeletonList } from '../../../ui/skeleton'
import Tooltip from '../../../ui/Tooltip'
import TaxReminderStatusBadge from './shared/TaxReminderStatusBadge'
import AddTaxReminderModal from './modals/AddTaxReminderModal'
import MarkTaxReminderPaidModal from './modals/MarkTaxReminderPaidModal'
import SnoozeTaxReminderModal from './modals/SnoozeTaxReminderModal'

const MAX_SNOOZE_COUNT = 3

const KNOWN_TAX_TYPES = new Set(['SalesTax', 'FranchiseTax', 'EstimatedTax', 'PayrollTax'])

export default function TaxRemindersView({
  ownerTaxYearId,
  ownerTaxYearStatus,
}: {
  ownerTaxYearId: string
  ownerTaxYearStatus: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isLocked = ownerTaxYearStatus === 'Locked'

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [markPaidReminder, setMarkPaidReminder] = useState<TaxPaymentReminder | null>(null)
  const [snoozeReminder, setSnoozeReminder] = useState<TaxPaymentReminder | null>(null)

  const listQuery = useTaxiqTaxReminders(ownerTaxYearId)
  const items = listQuery.data ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.reminders.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.reminders.subtitle')}</p>
        </div>
        {!isLocked && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('taxiq.reminders.addButton')}
          </button>
        )}
      </div>

      {isLocked && (
        <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <span>{t('taxiq.reminders.errors.lockedMessage')}</span>
          <button
            type="button"
            onClick={() => navigate('/dashboard/taxiq/export')}
            className="self-start rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {t('taxiq.reminders.errors.lockedAction')}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.reminders.columns.taxType')}</th>
              <th className="px-4 py-3">{t('taxiq.reminders.columns.dueDate')}</th>
              <th className="px-4 py-3">{t('taxiq.reminders.columns.status')}</th>
              <th className="px-4 py-3">
                <span className="inline-flex items-center gap-1">
                  {t('taxiq.reminders.columns.snoozeCount')}
                  <Tooltip content={t('taxiq.reminders.tooltips.snoozeCount')} />
                </span>
              </th>
              <th className="px-4 py-3 text-right">{t('taxiq.reminders.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  <div className="flex flex-col items-center gap-2">
                    <span>{t('taxiq.reminders.emptyState')}</span>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => setIsAddModalOpen(true)}
                        className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
                      >
                        {t('taxiq.reminders.emptyStateCta')}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              items.map((reminder) => {
                const isSnoozeLimitReached = reminder.snoozeCount >= MAX_SNOOZE_COUNT
                const isPaid = reminder.status === 'Paid'
                return (
                  <tr key={reminder.id} className="border-t border-nexoraRule">
                    <td className="px-4 py-3 font-bold text-nexoraText">
                      <span className="inline-flex items-center gap-1">
                        {t(`taxiq.reminders.taxTypes.${reminder.taxType}`)}
                        {KNOWN_TAX_TYPES.has(reminder.taxType) && (
                          <Tooltip content={t(`taxiq.reminders.taxTypeTooltips.${reminder.taxType}`)} />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-nexoraMuted">{reminder.dueDate}</td>
                    <td className="px-4 py-3">
                      <TaxReminderStatusBadge status={reminder.status} />
                    </td>
                    <td className="px-4 py-3 text-nexoraMuted">{reminder.snoozeCount}/{MAX_SNOOZE_COUNT}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {!isPaid && !isLocked && (
                          <button
                            type="button"
                            onClick={() => setMarkPaidReminder(reminder)}
                            className="text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            {t('taxiq.reminders.actions.markPaid')}
                          </button>
                        )}
                        {!isPaid && !isLocked && (
                          <button
                            type="button"
                            onClick={() => setSnoozeReminder(reminder)}
                            disabled={isSnoozeLimitReached}
                            title={isSnoozeLimitReached ? t('taxiq.reminders.actions.snoozeLimitTooltip') : undefined}
                            className="text-[11px] font-bold text-nexoraBrand hover:underline disabled:cursor-not-allowed disabled:text-nexoraMuted disabled:no-underline"
                          >
                            {t('taxiq.reminders.actions.snooze')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {isAddModalOpen && (
        <AddTaxReminderModal
          open={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          ownerTaxYearId={ownerTaxYearId}
        />
      )}

      {markPaidReminder && (
        <MarkTaxReminderPaidModal
          open={!!markPaidReminder}
          onClose={() => setMarkPaidReminder(null)}
          ownerTaxYearId={ownerTaxYearId}
          reminderId={markPaidReminder.id}
        />
      )}

      {snoozeReminder && (
        <SnoozeTaxReminderModal
          open={!!snoozeReminder}
          onClose={() => setSnoozeReminder(null)}
          ownerTaxYearId={ownerTaxYearId}
          reminderId={snoozeReminder.id}
          snoozeCount={snoozeReminder.snoozeCount}
        />
      )}
    </div>
  )
}
