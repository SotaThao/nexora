import { NavLink, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import { CircleDollarSign, UsersRound, type LucideIcon } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { PosReportMode } from '../../../../../constants/posReportMode'
import {
  REPORT_DATES_PARAM,
  REPORT_MODE_PARAM,
  REPORT_MONTH_PARAM,
  REPORT_WEEKS_PARAM,
} from '../../../../../constants/posFrontDesk'
import {
  isPosReportTab,
  posReportPath,
  PosReportTab,
} from '../../../../../constants/posReports'
import PosReportPanel from './PosReportPanel'
import StoreIncomeReportView from './StoreIncomeReportView'
import {
  defaultSelectionFor,
  parseIsoWeekKey,
  parseMonthKey,
  type PosReportSelection,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.reports'

type Props = {
  businessId: string
  businessTimeZone: string
}

type ReportTabDefinition = {
  id: PosReportTab
  label: string
  Icon: LucideIcon
}

function readSelection(params: URLSearchParams, businessTimeZone: string): PosReportSelection {
  const rawMode = params.get(REPORT_MODE_PARAM)
  const mode = Object.values(PosReportMode).includes(rawMode as PosReportMode)
    ? (rawMode as PosReportMode)
    : PosReportMode.Daily
  const fallback = defaultSelectionFor(mode, businessTimeZone)

  if (mode === PosReportMode.Daily) {
    const date = (params.get(REPORT_DATES_PARAM) ?? '')
      .split(',')
      .map((value) => value.trim())
      .find((value) => /^\d{4}-\d{2}-\d{2}$/.test(value))
    return date ? { ...fallback, dates: [date] } : fallback
  }

  if (mode === PosReportMode.Weekly) {
    const week = (params.get(REPORT_WEEKS_PARAM) ?? '')
      .split(',')
      .map((value) => value.trim())
      .find((value) => parseIsoWeekKey(value) !== null)
    return week ? { ...fallback, weeks: [week] } : fallback
  }

  const month = (params.get(REPORT_MONTH_PARAM) ?? '').trim()
  return parseMonthKey(month) ? { ...fallback, month } : fallback
}

export default function PosReportsView({ businessId, businessTimeZone }: Props) {
  const { t } = useTranslation()
  const { reportTab } = useParams<{ reportTab: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selection, setSelectionState] = useState<PosReportSelection>(() =>
    readSelection(searchParams, businessTimeZone),
  )

  if (!isPosReportTab(reportTab)) {
    return <Navigate to={posReportPath(PosReportTab.Technician)} replace />
  }

  const setSelection = (next: PosReportSelection) => {
    setSelectionState(next)
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      params.set(REPORT_MODE_PARAM, next.mode)
      params.delete(REPORT_DATES_PARAM)
      params.delete(REPORT_WEEKS_PARAM)
      params.delete(REPORT_MONTH_PARAM)
      if (next.mode === PosReportMode.Daily && next.dates[0]) {
        params.set(REPORT_DATES_PARAM, next.dates[0])
      }
      if (next.mode === PosReportMode.Weekly && next.weeks[0]) {
        params.set(REPORT_WEEKS_PARAM, next.weeks[0])
      }
      if (next.mode === PosReportMode.Monthly && next.month) {
        params.set(REPORT_MONTH_PARAM, next.month)
      }
      return params
    }, { replace: true })
  }

  const tabs: ReportTabDefinition[] = [
    {
      id: PosReportTab.Technician,
      label: t(`${TK}.tabs.technician`),
      Icon: UsersRound,
    },
    {
      id: PosReportTab.StoreIncome,
      label: t(`${TK}.tabs.storeIncome`),
      Icon: CircleDollarSign,
    },
  ]

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="space-y-1 px-0.5">
        <h1 className="text-xl font-extrabold leading-tight tracking-tight text-nexoraText">
          {t(`${TK}.title`)}
        </h1>
        <p className="text-xs font-medium text-nexoraMuted">{t(`${TK}.description`)}</p>
      </header>

      <nav
        className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap"
        aria-label={t(`${TK}.tabs.ariaLabel`)}
      >
        {tabs.map(({ id, label, Icon }) => (
          <NavLink
            key={id}
            to={posReportPath(id)}
            className={({ isActive }) =>
              [
                'inline-flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 rounded-lg border px-1 py-1.5 text-center text-xs font-bold leading-tight transition sm:min-h-11 sm:flex-row sm:px-3 sm:py-2',
                isActive
                  ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
                  : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender hover:bg-nexoraSurfaceMuted hover:text-nexoraText',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={[
                    'grid h-6 w-6 shrink-0 place-items-center rounded-lg sm:h-7 sm:w-7',
                    isActive
                      ? 'bg-white/15 text-white'
                      : 'bg-nexoraSurfaceMuted text-nexoraBrand',
                  ].join(' ')}
                >
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                </span>
                <span className="min-w-0 break-words">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {reportTab === PosReportTab.Technician ? (
        <PosReportPanel
          businessId={businessId}
          businessTimeZone={businessTimeZone}
          isActive
          selection={selection}
          onSelectionChange={setSelection}
        />
      ) : (
        <StoreIncomeReportView businessId={businessId} businessTimeZone={businessTimeZone} />
      )}
    </div>
  )
}
