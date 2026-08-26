import React from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { formatCurrency } from '../../../utils'
import type { PosReportRow } from '../../../../../data/repositories/posReport'

const TK = 'components.dashboard.views.pos.report'

type Props = {
  rows: PosReportRow[]
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

export default function PosReportTable({ rows }: Props) {
  const { t } = useTranslation()

  return (
    <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-nexoraSurface">
      <table className="w-full min-w-[980px] text-left text-xs">
        <thead className="bg-nexoraCanvas uppercase tracking-wide text-nexoraMuted">
          <tr>
            <th className="px-4 py-3 text-xs font-black">{t(`${TK}.columns.tech`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.turns`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.hours`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.serviceAmount`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black" title={t(`${TK}.columns.commissionPercentHint`)}>
              {t(`${TK}.columns.commissionPercent`)}
            </th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.commission`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.tip`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black" title={t(`${TK}.columns.discountHint`)}>
              {t(`${TK}.columns.discount`)}
            </th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.techTakes`)}</th>
            <th className="px-4 py-3 text-right text-xs font-black">{t(`${TK}.columns.weeklyGuarantee`)}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hasActivity = row.turns > 0 || row.hours > 0 || row.serviceAmount > 0
            return (
              <tr
                key={row.posStaffProfileId}
                className="border-t border-nexoraBorder/70 transition-colors even:bg-violet-50/15 hover:bg-violet-50/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraBrand text-[11px] font-black text-white">
                      {initialsOf(row.displayName)}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-nexoraText">{row.displayName}</div>
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-nexoraMuted">
                          {t(`${TK}.payStructure.${row.payStructureType.toLowerCase()}`, {}) || row.payStructureType}
                        </span>
                        {row.isInactive ? (
                          <span className="rounded-full bg-nexoraCanvas px-1.5 py-0.5 text-[10px] font-bold text-nexoraMuted">
                            {t(`${TK}.inactive`)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {hasActivity || row.turns > 0 ? row.turns : '0'}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {row.hours.toFixed(1)}h
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-semibold text-nexoraText">
                  {formatCurrency(row.serviceAmount)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {row.commissionPercent == null
                    ? <span className="text-nexoraMuted">—</span>
                    : `${row.isCommissionPercentEstimated ? '~' : ''}${row.commissionPercent}%`}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {formatCurrency(row.commission)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {formatCurrency(row.tips)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {row.discount > 0
                    ? <span className="text-nexoraDanger">−{formatCurrency(row.discount)}</span>
                    : formatCurrency(0)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums font-bold text-nexoraText">
                  {formatCurrency(row.techTakes)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-nexoraText">
                  {row.weeklyGuarantee == null
                    ? <span className="text-nexoraMuted">—</span>
                    : formatCurrency(row.weeklyGuarantee)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
