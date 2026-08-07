import { useMemo, useState } from 'react'
import { Loader2, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqEmployers, useTaxiqEmployerRegistrations } from '../../../../data/hooks/useTaxiqEmployer'
import { usePayrollRuns } from '../../../../data/hooks/usePayrollRuns'
import { useTaxLedger, useVerifyTaxLedgerEntry } from '../../../../data/hooks/useTaxLedger'
import type { TaxLedgerListEntry } from '../../../../data/repositories/taxLedger'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import { formatCurrency } from '../../utils'

const PAGE_SIZE = 20
const TYPE_FILTERS = [
  'FederalIncomeTax',
  'SocialSecurity',
  'Medicare',
  'AdditionalMedicare',
  'StateIncomeTax',
  'SutaEmployerTax',
  'SupplementalWithholding',
]

function truncateHash(hash: string): string {
  return hash.length > 14 ? `${hash.slice(0, 10)}…${hash.slice(-4)}` : hash
}

function VerifyBadge({ result }: { result?: string | null }) {
  const { t } = useTranslation()
  if (!result) return null
  const isVerified = result === 'Verified'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
      }`}
    >
      {isVerified ? t('taxiq.taxLedger.verifyResult.verified') : t('taxiq.taxLedger.verifyResult.mismatch')}
    </span>
  )
}

function VerifyButton({ entry, businessId }: { entry: TaxLedgerListEntry; businessId: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const verifyEntry = useVerifyTaxLedgerEntry(businessId)

  const handleVerify = async () => {
    if (verifyEntry.isPending) return
    try {
      const result = await verifyEntry.mutateAsync(entry.id)
      showToast(
        result.result === 'Verified'
          ? t('taxiq.taxLedger.verifyResult.verifiedToast')
          : t('taxiq.taxLedger.verifyResult.mismatchToast'),
        result.result === 'Verified' ? 'success' : 'error',
      )
    } catch (err) {
      const fallback = t('taxiq.taxLedger.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      showToast(message, 'error')
    }
  }

  return (
    <button
      type="button"
      onClick={handleVerify}
      disabled={verifyEntry.isPending}
      className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline disabled:opacity-60"
    >
      {verifyEntry.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
      {t('taxiq.taxLedger.verifyButton')}
    </button>
  )
}

export default function TaxLedgerView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [jurisdiction, setJurisdiction] = useState('')
  const [type, setType] = useState('')
  const [payrollRunId, setPayrollRunId] = useState('')
  const [pageNumber, setPageNumber] = useState(1)

  const employersQuery = useTaxiqEmployers(businessId)
  const employer = employersQuery.data?.items?.[0]

  const registrationsQuery = useTaxiqEmployerRegistrations(employer?.id)
  const runsQuery = usePayrollRuns(businessId, { employerId: employer?.id, pageSize: 100 })

  const ledgerQuery = useTaxLedger(businessId, {
    employerId: employer?.id,
    jurisdiction: jurisdiction || undefined,
    type: type || undefined,
    payrollRunId: payrollRunId || undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
  })

  const data = ledgerQuery.data
  const rows = data?.items ?? []

  // Doc mục 16: "ba chỉ số ở đầu màn hình chỉ tính trên phần đang hiển thị theo bộ lọc" —
  // computed from the current page's rows, same scope as what the table itself shows.
  const metrics = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          taxable: acc.taxable + row.taxableAmount,
          employeeTax: acc.employeeTax + row.employeeAmount,
          employerTax: acc.employerTax + row.employerAmount,
        }),
        { taxable: 0, employeeTax: 0, employerTax: 0 },
      ),
    [rows],
  )

  const resetToFirstPage = () => setPageNumber(1)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.taxLedger.title')}</h1>
        <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.taxLedger.subtitle')}</p>
      </div>

      {!employersQuery.isPending && !employer && (
        <div className="nexora-card p-4 text-xs font-semibold text-amber-700">{t('taxiq.taxLedger.noEmployer')}</div>
      )}

      <div className="nexora-card grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        <div>
          <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.taxLedger.metrics.taxableWages')}</div>
          <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(metrics.taxable)}</div>
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.taxLedger.metrics.employeeTax')}</div>
          <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(metrics.employeeTax)}</div>
        </div>
        <div>
          <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.taxLedger.metrics.employerTax')}</div>
          <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(metrics.employerTax)}</div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxLedger.filters.jurisdiction')}</label>
          <select
            value={jurisdiction}
            onChange={(e) => {
              setJurisdiction(e.target.value)
              resetToFirstPage()
            }}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          >
            <option value="">{t('taxiq.taxLedger.filters.all')}</option>
            {(registrationsQuery.data ?? []).map((r) => (
              <option key={r.jurisdiction} value={r.jurisdiction}>
                {r.jurisdiction}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxLedger.filters.type')}</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value)
              resetToFirstPage()
            }}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          >
            <option value="">{t('taxiq.taxLedger.filters.all')}</option>
            {TYPE_FILTERS.map((tp) => (
              <option key={tp} value={tp}>
                {t(`taxiq.taxLedger.types.${tp}`)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxLedger.filters.run')}</label>
          <select
            value={payrollRunId}
            onChange={(e) => {
              setPayrollRunId(e.target.value)
              resetToFirstPage()
            }}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs"
          >
            <option value="">{t('taxiq.taxLedger.filters.all')}</option>
            {(runsQuery.data?.items ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.runCode}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ledgerQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : rows.length === 0 ? (
        <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.taxLedger.emptyState')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[1000px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.entry')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.run')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.employee')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.jurisdiction')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.type')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.taxable')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.employeeTax')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.employerTax')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.hash')}</th>
                <th className="px-3 py-2">{t('taxiq.taxLedger.columns.action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-nexoraRule align-top">
                  <td className="px-3 py-2 font-bold text-nexoraText">{row.entryCode}</td>
                  <td className="px-3 py-2 text-nexoraText">{row.runCode}</td>
                  <td className="px-3 py-2 text-nexoraText">{row.employeeName}</td>
                  <td className="px-3 py-2 text-nexoraText">{row.jurisdiction}</td>
                  <td className="px-3 py-2 text-nexoraText">{t(`taxiq.taxLedger.types.${row.type}`)}</td>
                  <td className="px-3 py-2 text-nexoraText">{formatCurrency(row.taxableAmount)}</td>
                  <td className="px-3 py-2 text-nexoraText">{formatCurrency(row.employeeAmount)}</td>
                  <td className="px-3 py-2 text-nexoraText">{formatCurrency(row.employerAmount)}</td>
                  <td className="px-3 py-2 font-mono text-[11px] text-nexoraMuted" title={row.hashValue}>
                    {truncateHash(row.hashValue)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      <VerifyButton entry={row} businessId={businessId} />
                      <VerifyBadge result={row.lastVerificationResult} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between border-t border-nexoraRule px-4 py-3">
            <span className="text-[11px] text-nexoraMuted">
              {t('taxiq.taxLedger.pageSummary', {
                page: data?.pageNumber ?? 1,
                totalPages: Math.max(data?.totalPages ?? 1, 1),
                totalCount: data?.totalCount ?? 0,
              })}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                disabled={!data?.hasPreviousPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('taxiq.taxLedger.previousPage')}
              </button>
              <button
                type="button"
                onClick={() => setPageNumber((p) => p + 1)}
                disabled={!data?.hasNextPage}
                className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[11px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-40"
              >
                {t('taxiq.taxLedger.nextPage')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
