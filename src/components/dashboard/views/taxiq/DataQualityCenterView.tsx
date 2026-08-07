import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqEmployers } from '../../../../data/hooks/useTaxiqEmployer'
import { useCleanupTasks, useDataQuality } from '../../../../data/hooks/useDataQuality'
import type { DataQualityIssue } from '../../../../data/repositories/dataQuality'
import { SkeletonList } from '../../../ui/skeleton'
import CreateCleanupTaskModal from './modals/CreateCleanupTaskModal'
import CloseCleanupTaskModal from './modals/CloseCleanupTaskModal'

const PAGE_SIZE = 20
const CLEANUP_TASK_STATUSES = ['Open', 'Closed']

export default function DataQualityCenterView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [taskStatus, setTaskStatus] = useState('')
  const [pageNumber, setPageNumber] = useState(1)
  const [selectedIssue, setSelectedIssue] = useState<DataQualityIssue | null>(null)
  const [closingTaskId, setClosingTaskId] = useState<string | null>(null)

  const employersQuery = useTaxiqEmployers(businessId)
  const employer = employersQuery.data?.items?.[0]

  const dataQualityQuery = useDataQuality(businessId, employer?.id)
  const cleanupTasksQuery = useCleanupTasks(businessId, {
    employerId: employer?.id,
    status: taskStatus || undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
  })

  const dataQuality = dataQualityQuery.data
  const issues = dataQuality?.issues ?? []
  const tasksData = cleanupTasksQuery.data
  const tasks = tasksData?.items ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.dataQuality.title')}</h1>
        <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.dataQuality.subtitle')}</p>
      </div>

      {!employersQuery.isPending && !employer && (
        <div className="nexora-card p-4 text-xs font-semibold text-amber-700">{t('taxiq.dataQuality.noEmployer')}</div>
      )}

      <div className="nexora-card grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.dataQuality.metrics.blockingIssues')}</div>
          <div className="text-sm font-extrabold text-nexoraText">{dataQuality?.blockingIssues ?? 0}</div>
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.dataQuality.metrics.totalIssues')}</div>
          <div className="text-sm font-extrabold text-nexoraText">{issues.length}</div>
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.dataQuality.metrics.cpaReadyScore')}</div>
          <div className="text-sm font-extrabold text-nexoraText">
            {dataQuality?.isCpaReadyScoreAvailable ? dataQuality.cpaReadyScore : t('taxiq.dataQuality.metrics.notAvailable')}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-extrabold text-nexoraText">{t('taxiq.dataQuality.issuesTitle')}</h2>
        {dataQualityQuery.isPending ? (
          <div className="nexora-card p-6">
            <SkeletonList count={3} lines={2} />
          </div>
        ) : issues.length === 0 ? (
          <div className="nexora-card flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.dataQuality.noIssues')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                <tr>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.source')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.issueType')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.severity')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.owner')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.description')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.action')}</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, idx) => (
                  <tr key={`${issue.sourceRecordType}-${issue.sourceRecordId}-${idx}`} className="border-t border-nexoraRule align-top">
                    <td className="px-3 py-2 font-bold text-nexoraText">{t(`taxiq.dataQuality.source.${issue.source}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{t(`taxiq.dataQuality.issueType.${issue.issueType}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.severity.${issue.severity}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.ownerTeam.${issue.owner}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{issue.description}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setSelectedIssue(issue)}
                        className="text-[11px] font-bold text-nexoraBrand hover:underline"
                      >
                        {t('taxiq.dataQuality.createTask.button')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.dataQuality.tasksTitle')}</h2>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.dataQuality.filters.status')}</label>
            <select
              value={taskStatus}
              onChange={(e) => {
                setTaskStatus(e.target.value)
                setPageNumber(1)
              }}
              className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
            >
              <option value="">{t('taxiq.dataQuality.filters.all')}</option>
              {CLEANUP_TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`taxiq.dataQuality.taskStatus.${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {cleanupTasksQuery.isPending ? (
          <div className="nexora-card p-6">
            <SkeletonList count={3} lines={2} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="nexora-card flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.dataQuality.noTasks')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                <tr>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.issueType')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.severity')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.owner')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.dueDate')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.status')}</th>
                  <th className="px-3 py-2">{t('taxiq.dataQuality.columns.action')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((taskItem) => (
                  <tr key={taskItem.id} className="border-t border-nexoraRule align-top">
                    <td className="px-3 py-2 font-bold text-nexoraText">{t(`taxiq.dataQuality.issueType.${taskItem.issueType}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.severity.${taskItem.severity}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{t(`taxiq.exceptions.ownerTeam.${taskItem.owner}`)}</td>
                    <td className="px-3 py-2 text-nexoraText">{taskItem.dueDate ? taskItem.dueDate.slice(0, 10) : '—'}</td>
                    <td className="px-3 py-2 text-nexoraText">{t(`taxiq.dataQuality.taskStatus.${taskItem.status}`)}</td>
                    <td className="px-3 py-2">
                      {taskItem.status === 'Open' && (
                        <button
                          type="button"
                          onClick={() => setClosingTaskId(taskItem.id)}
                          className="text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          {t('taxiq.dataQuality.closeTask.button')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between border-t border-nexoraRule px-4 py-3">
              <span className="text-[11px] text-nexoraMuted">
                {t('taxiq.dataQuality.pageSummary', {
                  page: tasksData?.pageNumber ?? 1,
                  totalPages: Math.max(tasksData?.totalPages ?? 1, 1),
                  totalCount: tasksData?.totalCount ?? 0,
                })}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  disabled={!tasksData?.hasPreviousPage}
                  className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
                >
                  {t('taxiq.dataQuality.previousPage')}
                </button>
                <button
                  type="button"
                  onClick={() => setPageNumber((p) => p + 1)}
                  disabled={!tasksData?.hasNextPage}
                  className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
                >
                  {t('taxiq.dataQuality.nextPage')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <CreateCleanupTaskModal
        open={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        businessId={businessId}
        employerId={employer?.id ?? ''}
        issue={selectedIssue}
      />
      <CloseCleanupTaskModal
        open={!!closingTaskId}
        onClose={() => setClosingTaskId(null)}
        businessId={businessId}
        cleanupTaskId={closingTaskId}
      />
    </div>
  )
}
