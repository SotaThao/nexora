// "Today's shift" roster: clock status, turn order, the ticket each tech is on, beeper and the
// clock in/out actions in one table. Card mode is the same data for narrower screens.
//
// Station # from the mockup is deliberately absent — no salon-side rule for it exists yet, so
// there is nothing to store or edit against.
import { useState } from 'react'
import { AlertTriangle, Bell, LayoutGrid, List as ListIcon, LogIn, LogOut } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { storage } from '../../../../../utils/storage'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { useBeepStaff, useClockInStaff, useClockOutStaff } from '../../../../../data/hooks/usePosTimeClock'
import type { TimeClockRosterRowApiDto } from '../../../../../types/repositories'
import { formatPosDateTime, formatPosTime } from '../posDateTime'
import { EMPTY_VALUE, getInitials } from '../posDisplay'
import BeepMessageModal from './BeepMessageModal'
import { formatHours } from './timeClockDay'
import { tk } from './timeClockI18n'

// Table/Card is a separate preference from the Order List's List/Card toggle — the two tabs are
// remembered independently, so they keep their own storage keys.
enum RosterViewMode {
  Table = 'table',
  Card = 'card',
}
const ROSTER_VIEW_MODE_STORAGE_KEY = 'pos_time_clock_view_mode'

export default function TimeClockRoster({
  businessId,
  rows,
  onShiftCount,
}: {
  businessId: string
  rows: TimeClockRosterRowApiDto[]
  onShiftCount: number
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const clockIn = useClockInStaff(businessId)
  const clockOut = useClockOutStaff(businessId)
  const beep = useBeepStaff(businessId)

  const [viewMode, setViewMode] = useState<RosterViewMode>(() =>
    storage.getItem(ROSTER_VIEW_MODE_STORAGE_KEY) === RosterViewMode.Card
      ? RosterViewMode.Card
      : RosterViewMode.Table,
  )
  const handleChangeViewMode = (mode: RosterViewMode) => {
    setViewMode(mode)
    storage.setItem(ROSTER_VIEW_MODE_STORAGE_KEY, mode)
  }

  const [beepTarget, setBeepTarget] = useState<TimeClockRosterRowApiDto | null>(null)
  const [beepMessage, setBeepMessage] = useState('')

  const isBusy = clockIn.isPending || clockOut.isPending || beep.isPending

  const handleClockIn = async (row: TimeClockRosterRowApiDto) => {
    try {
      await clockIn.mutateAsync(row.businessStaffLinkId)
      showToast(t(tk('clockInSuccess'), { name: row.displayName }))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const handleClockOut = async (row: TimeClockRosterRowApiDto) => {
    // Serving a customer is not a hard block — a tech does leave mid-ticket — but it should never
    // happen by accident, so it needs an explicit yes.
    if (row.currentOrderId) {
      const confirmed = await showConfirm(
        t(tk('confirmClockOutBody'), {
          name: row.displayName,
          orderNumber: row.currentOrderNumber ?? '',
        }),
        t(tk('confirmClockOutTitle')),
      )
      if (!confirmed) return
    }

    try {
      await clockOut.mutateAsync(row.businessStaffLinkId)
      showToast(t(tk('clockOutSuccess'), { name: row.displayName }))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const openBeepModal = (row: TimeClockRosterRowApiDto) => {
    setBeepTarget(row)
    setBeepMessage('')
  }

  const closeBeepModal = () => {
    setBeepTarget(null)
    setBeepMessage('')
  }

  const handleBeep = async () => {
    if (!beepTarget || beep.isPending) return
    const row = beepTarget
    try {
      const result = await beep.mutateAsync({
        posStaffProfileId: row.posStaffProfileId,
        message: beepMessage.trim() || undefined,
      })
      closeBeepModal()
      showToast(
        result.delivered
          ? t(tk('beepSent'), { name: row.displayName })
          : t(tk('beepNotDelivered'), { name: row.displayName }),
        result.delivered ? 'success' : 'error',
      )
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const renderShiftCell = (row: TimeClockRosterRowApiDto) => (
    <div className="space-y-0.5">
      {row.isClockedIn ? (
        <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          {t(tk('inSince'), {
            time: formatPosTime(row.clockInAt, currentLanguage),
          })}
        </p>
      ) : (
        <p className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-600">
          {t(tk('notIn'))}
        </p>
      )}
      <p className="text-[11px] text-nexoraMuted">
        {t(tk('hoursToday'), { hours: formatHours(row.hoursToday) })}
      </p>
      {row.hasForgottenEntry ? (
        <p className="flex items-center gap-1 text-[11px] font-bold text-nexoraWarning">
          <AlertTriangle className="h-3 w-3" />
          {t(tk('forgotClockOut'), {
            // The point of this line is which *day* was left open, so it needs the date, not just
            // the clock time — the time alone reads as if the shift started tonight.
            date: formatPosDateTime(row.forgottenEntryClockInAt, currentLanguage, { withYear: false }),
          })}
        </p>
      ) : null}
    </div>
  )

  const renderTurnsCell = (row: TimeClockRosterRowApiDto) => (
    <span className="text-xs text-nexoraMuted">
      {t(tk('turnsValue'), { count: row.turnsToday })}
      {row.turnRank ? ` · ${t(tk('turnRank'), { rank: row.turnRank })}` : ''}
    </span>
  )

  const renderActions = (row: TimeClockRosterRowApiDto) => (
    <div className="flex justify-end gap-1.5">
      <button
        type="button"
        onClick={() => (row.isClockedIn ? handleClockOut(row) : handleClockIn(row))}
        disabled={isBusy}
        className={`flex h-9 shrink-0 items-center gap-1 rounded-lg border px-2.5 text-[11px] font-extrabold transition-colors disabled:opacity-60 ${
          row.isClockedIn
            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:bg-rose-100'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-100'
        }`}
      >
        {row.isClockedIn ? <LogOut className="h-3.5 w-3.5" /> : <LogIn className="h-3.5 w-3.5" />}
        {row.isClockedIn
          ? t(tk('clockOut'))
          : t(tk('clockIn'))}
      </button>
      <button
        type="button"
        onClick={() => openBeepModal(row)}
        disabled={isBusy}
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 text-[11px] font-extrabold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
      >
        <Bell className="h-3.5 w-3.5" />
        {t(tk('beep'))}
      </button>
    </div>
  )

  const renderAvatar = (row: TimeClockRosterRowApiDto) => (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraLavender/20 text-[11px] font-bold text-nexoraBrandDark">
        {row.photoUrl ? (
          <img src={row.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
        ) : (
          getInitials(row.displayName)
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-nexoraText">{row.displayName}</p>
        <p className="truncate text-[11px] text-nexoraMuted">{row.roleName}</p>
      </div>
    </div>
  )

  return (
     <>
    <section className="space-y-3">
 
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-nexoraText">
          {t(tk('rosterTitle'))}
        </h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-nexoraCanvas px-2.5 py-1 text-[11px] font-bold text-nexoraBrandDark">
            {t(tk('onShift'), { count: onShiftCount })}
          </span>
          <div className="flex gap-1 rounded-xl border border-nexoraBorder bg-nexoraCanvas/70 p-1">
            <button
              type="button"
              onClick={() => handleChangeViewMode(RosterViewMode.Table)}
              aria-label={t(tk('viewModeTable'))}
              className={`rounded-lg p-1.5 ${
                viewMode === RosterViewMode.Table
                  ? 'bg-white text-nexoraBrandDark shadow-sm ring-1 ring-inset ring-nexoraBorder/70'
                  : 'text-nexoraMuted hover:bg-white/80 hover:text-nexoraText'
              }`}
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => handleChangeViewMode(RosterViewMode.Card)}
              aria-label={t(tk('viewModeCard'))}
              className={`rounded-lg p-1.5 ${
                viewMode === RosterViewMode.Card
                  ? 'bg-white text-nexoraBrandDark shadow-sm ring-1 ring-inset ring-nexoraBorder/70'
                  : 'text-nexoraMuted hover:bg-white/80 hover:text-nexoraText'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg bg-nexoraCanvas p-6 text-center text-xs text-nexoraMuted">
          {t(tk('rosterEmpty'))}
        </p>
      ) : viewMode === 'card' ? (
        <div className="grid max-h-[560px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <div key={row.posStaffProfileId} className="space-y-3 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-nexoraBrand/40 hover:shadow-md">
              {renderAvatar(row)}
              {renderShiftCell(row)}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate font-semibold text-nexoraText">{row.currentCustomerName ?? EMPTY_VALUE}</span>
                {renderTurnsCell(row)}
              </div>
              {renderActions(row)}
            </div>
          ))}
        </div>
      ) : (
        <div className="max-h-[560px] overflow-x-auto overflow-y-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-[1] bg-nexoraCanvas/90">
              <tr className="uppercase tracking-wider text-nexoraMuted">
                <th className="px-4 py-3 text-xs font-black">
                  {t(tk('columnTechnician'))}
                </th>
                <th className="px-4 py-3 text-xs font-black">
                  {t(tk('columnShift'))}
                </th>
                <th className="px-4 py-3 text-xs font-black">
                  {t(tk('columnCurrentTicket'))}
                </th>
                <th className="px-4 py-3 text-xs font-black">
                  {t(tk('columnTurns'))}
                </th>
                <th className="px-4 py-3 text-xs font-black">
                  {t(tk('columnBeeper'))}
                </th>
                <th className="px-4 py-3 text-right text-xs font-black">
                  {t(tk('columnActions'))}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.posStaffProfileId}
                  className={`border-t border-nexoraBorder/70 align-top transition-colors ${
                    row.hasForgottenEntry
                      ? 'bg-amber-50/30 hover:bg-amber-50/60'
                      : row.isClockedIn
                        ? 'bg-emerald-50/20 hover:bg-emerald-50/45'
                        : 'hover:bg-violet-50/35'
                  }`}
                >
                  <td className="px-4 py-3">{renderAvatar(row)}</td>
                  <td className="px-4 py-3">{renderShiftCell(row)}</td>
                  <td className="px-4 py-3 font-semibold text-nexoraText">
                    {row.currentCustomerName ? (
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-700">{row.currentCustomerName}</span>
                    ) : (
                      EMPTY_VALUE
                    )}
                    {row.currentOrderNumber ? (
                      <span className="ml-1 font-mono text-[11px]">#{row.currentOrderNumber}</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{renderTurnsCell(row)}</td>
                  <td className="px-4 py-3 font-semibold text-nexoraText">
                    {row.lastBeepAt ? (
                      <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                        {t(tk('beepedAt'), {
                          time: formatPosTime(row.lastBeepAt, currentLanguage),
                        })}
                      </span>
                    ) : EMPTY_VALUE}
                  </td>
                  <td className="px-4 py-3">{renderActions(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    <BeepMessageModal
      open={beepTarget !== null}
      staffName={beepTarget?.displayName ?? ''}
      message={beepMessage}
      isPending={beep.isPending}
      onChangeMessage={setBeepMessage}
      onSend={handleBeep}
      onClose={closeBeepModal}
    />
    </>
  )
}
