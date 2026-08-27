// StaffBeepAlert — the tech's side of the beep, mounted in the staff shell so it reaches them on
// whatever screen they were last on. A beep is an interrupt: making the tech navigate to the
// notifications page to answer would defeat the point, and the notification feed is deliberately
// left as history-only so there is no second entry point needing shared state.
//
// Closing is deliberately weaker than replying: the X hides the sheet on this device only and
// sends nothing, so the front desk still sees the tech as not having answered. The three replies
// remain the real dismissal — "can't come" is the decline path. The sheet can also be minimised to
// a floating bell. Both states are keyed by beepId:nudgeCount, so the front desk ringing again
// always brings the call back.
//
// Sound is deliberately absent: browsers block un-gestured audio, so a chime would fail silently on
// the first beep — the worst possible time. The push notification already carries a sound for when
// the app is backgrounded, which is where it actually helps. Vibration is best-effort only and is
// not implemented at all in iOS Safari, so the visual sheet has to carry the signal.
import { useEffect, useMemo, useRef, useState } from 'react'
import { BellRing, Check, Clock, Minus, X, XCircle } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../../data/errorCodes'
import { useRespondToBeep, useStaffActiveBeeps } from '../../data/hooks/useStaffBeeps'
import {
  POS_BEEP_DELAY_MINUTES_FALLBACK,
  POS_BEEP_NOTE_MAX_LENGTH,
  PosStaffBeepResponse,
  PosStaffBeepStatus,
  isDelayLapsed,
} from '../../constants/posStaffBeep'
import type { ActiveStaffBeepApiDto } from '../../types/repositories'
import { parseApiDateTime } from '../dashboard/utils'
import { useElapsedLabel } from '../../hooks/useElapsedLabel'

const VIBRATE_PATTERN = [200, 100, 200]

// StaffBottomNav is h-[68px] at z-30. Sitting above it but not over it keeps navigation tappable —
// an urgent interrupt should not trap the tech on the current screen. The bottom offset itself is
// `.staff-beep-dock` in index.css (see the comment there — it cannot be a Tailwind arbitrary value).
const SHEET_POSITION =
  'staff-beep-dock fixed inset-x-3 z-40 lg:inset-x-auto lg:right-6 lg:w-[22rem]'

// Minimised is a right-hand floating button, not a full-width bar: minimising means "let me work",
// so it gives the row back to the screen underneath and keeps only the bell. Same dock as the
// sheet, so it clears StaffBottomNav and the home indicator and stays put while the page scrolls.
const MINIMIZED_POSITION = 'staff-beep-dock fixed right-4 z-40 lg:right-6'

const PRIMARY_BUTTON =
  'flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-extrabold text-white transition disabled:opacity-60'

// 44pt targets, not the compact chip variant — these are primary controls used one-handed.
const CHIP_BUTTON =
  'flex h-11 flex-1 items-center justify-center rounded-xl border border-nexoraBorder bg-white text-sm font-extrabold text-nexoraText transition hover:border-nexoraBrand hover:text-nexoraBrandDark disabled:opacity-60'

type Branch = 'none' | 'busy' | 'decline'

// Identity of one *ring*, not one call: the front desk nudging bumps nudgeCount, which is what
// makes a dismissed or minimised call resurface.
const beepKey = (beep: ActiveStaffBeepApiDto) => `${beep.beepId}:${beep.nudgeCount}`

export default function StaffBeepAlert() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const elapsedLabel = useElapsedLabel()
  const { data } = useStaffActiveBeeps()
  const respond = useRespondToBeep()

  const [minimized, setMinimized] = useState(false)
  const [branch, setBranch] = useState<Branch>('none')
  const [note, setNote] = useState('')
  // Dismissed by key, not a single "hidden" flag: the tech closing one call must not hide the next
  // one, and a nudge (which bumps nudgeCount, so a new key) has to bring that same call back.
  const [dismissedKeys, setDismissedKeys] = useState<string[]>([])
  const seenBeepKeysRef = useRef<Set<string>>(new Set())

  const beeps = data?.beeps ?? []
  const delayChoices = data?.allowedDelayMinutes?.length
    ? data.allowedDelayMinutes
    : POS_BEEP_DELAY_MINUTES_FALLBACK

  const visibleBeeps = useMemo(
    () => beeps.filter((b) => !dismissedKeys.includes(beepKey(b))),
    [beeps, dismissedKeys],
  )

  // Oldest unanswered first, then anything else still open. Showing one at a time with a "+N more"
  // counter beats a carousel for a case that is almost always N=1.
  const current = useMemo<ActiveStaffBeepApiDto | undefined>(() => {
    const unanswered = visibleBeeps.filter((b) => b.status === PosStaffBeepStatus.Sent)
    const pool = unanswered.length > 0 ? unanswered : visibleBeeps
    return [...pool].sort(
      (a, b) => new Date(a.beepedAt).getTime() - new Date(b.beepedAt).getTime(),
    )[0]
  }, [visibleBeeps])

  // A new call, or the front desk ringing the same one again, re-expands the sheet and buzzes once.
  const currentKey = current ? beepKey(current) : null

  useEffect(() => {
    if (!currentKey) return
    if (seenBeepKeysRef.current.has(currentKey)) return

    seenBeepKeysRef.current.add(currentKey)
    setMinimized(false)
    setBranch('none')
    setNote('')

    try {
      navigator.vibrate?.(VIBRATE_PATTERN)
    } catch {
      // Unsupported (notably iOS Safari) or blocked — the sheet is the real signal.
    }
  }, [currentKey])

  if (!current) return null

  const respondedAt = parseApiDateTime(current.respondedAt)
  const delayLapsed = isDelayLapsed(current.status, respondedAt, current.delayMinutes)
  const othersCount = visibleBeeps.length - 1

  // Local only — nothing is sent, so the front desk still shows this tech as not having answered.
  // That is the point: the sheet is in the way, not the call. Deliberately not persisted either;
  // a reload should bring an unanswered call back rather than lose it.
  const handleDismiss = () => setDismissedKeys((keys) => [...keys, beepKey(current)])

  // The bell only swings while a call is genuinely unanswered. Once the tech has replied the sheet
  // can still be open (Busy/On my way), and a bell still ringing there would be a lie.
  // Animation only — each call site keeps its own size, so the two never fight over h-*/w-*.
  const bellSwing = current.status === PosStaffBeepStatus.Sent ? 'animate-beep-bell' : ''

  const send = async (
    response: PosStaffBeepResponse,
    delayMinutes?: number,
  ) => {
    if (respond.isPending) return
    const trimmedNote = note.trim()

    try {
      await respond.mutateAsync({
        beepId: current.beepId,
        response,
        delayMinutes,
        note: trimmedNote ? trimmedNote : undefined,
      })

      setBranch('none')
      setNote('')

      if (response === PosStaffBeepResponse.OnMyWay) showToast(t('staff_dashboard.beep.sentOnMyWay'))
      else if (response === PosStaffBeepResponse.Busy)
        showToast(t('staff_dashboard.beep.sentBusy', { minutes: delayMinutes ?? 0 }))
      else showToast(t('staff_dashboard.beep.sentDeclined'))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        // The label is gone from the surface, so it has to survive as the accessible name — and as
        // a tooltip for anyone who does not recognise a bare bell.
        aria-label={t('staff_dashboard.beep.minimizedLabel', { count: visibleBeeps.length })}
        title={t('staff_dashboard.beep.minimizedLabel', { count: visibleBeeps.length })}
        // h-14: a 56px circle, comfortably past the 44pt target for something tapped one-handed
        // mid-service.
        // No `relative` here even though the badge below is absolute: `fixed` already establishes
        // the containing block, and Tailwind emits `.relative` after `.fixed`, so having both would
        // silently win for relative and drop the button back into the page flow.
        className={`${MINIMIZED_POSITION} grid h-14 w-14 place-items-center rounded-full border-2 border-amber-400 bg-amber-50 text-amber-700 shadow-lg transition hover:bg-amber-100`}
      >
        <BellRing className={`h-6 w-6 ${bellSwing}`} />

        {/* One beep is already implied by the button existing; the count only earns pixels when
            there is a queue. */}
        {visibleBeeps.length > 1 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-amber-600 px-1 text-[11px] font-extrabold text-white">
            {visibleBeeps.length}
          </span>
        ) : null}
      </button>
    )
  }

  return (
    <div
      role="dialog"
      aria-labelledby="staff-beep-alert-title"
      // max-h + inner scroll + pinned actions: on a phone the note textarea opens the keyboard, and
      // the reply buttons must stay reachable rather than being pushed off-screen.
      className={`${SHEET_POSITION} flex max-h-[85dvh] flex-col rounded-2xl border-2 border-amber-400 bg-white p-4 shadow-2xl`}
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <h2
            id="staff-beep-alert-title"
            className="flex items-center gap-2 text-sm font-extrabold text-nexoraText"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <BellRing className={`h-4 w-4 ${bellSwing}`} />
            </span>
            {t('staff_dashboard.beep.title')}
          </h2>
          <p className="mt-1 truncate text-[11px] font-bold text-nexoraMuted">
            {t('staff_dashboard.beep.titleFrom', { business: current.businessName })}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setMinimized(true)}
            aria-label={t('staff_dashboard.beep.minimize')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-nexoraMuted transition hover:bg-slate-100 hover:text-nexoraText"
          >
            <Minus className="h-4 w-4" />
          </button>

          {/* Second, not first, and no colour: closing tells the front desk nothing, so it should
              read as the lesser option next to Minimise and well away from the reply buttons. */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('staff_dashboard.beep.dismiss')}
            title={t('staff_dashboard.beep.dismiss')}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-nexoraMuted transition hover:bg-slate-100 hover:text-nexoraText"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
        <p className="text-sm font-bold text-nexoraText">
          {current.message?.trim() || t('staff_dashboard.beep.noMessage')}
        </p>
        <p className="text-[11px] text-nexoraSubtle">
          {t('staff_dashboard.beep.sentAgo', { ago: elapsedLabel(current.beepedAt) })}
        </p>

        {current.nudgeCount > 0 ? (
          <p className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-700">
            {t('staff_dashboard.beep.nudged', { count: current.nudgeCount })}
          </p>
        ) : null}

        {delayLapsed ? (
          <p className="text-[11px] font-bold text-rose-600">
            {t('staff_dashboard.beep.overdue', { minutes: current.delayMinutes ?? 0 })}
          </p>
        ) : null}

        {branch === 'decline' ? (
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
              {t('staff_dashboard.beep.cantComeNoteLabel')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={POS_BEEP_NOTE_MAX_LENGTH}
              rows={3}
              placeholder={t('staff_dashboard.beep.cantComeNotePlaceholder')}
              className="w-full rounded-xl border border-nexoraBorder bg-white px-3 py-2 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
        ) : null}

        {othersCount > 0 ? (
          <p className="text-[11px] font-bold text-nexoraMuted">
            {t('staff_dashboard.beep.moreCount', { count: othersCount })}
          </p>
        ) : null}
      </div>

      <div className="mt-3 shrink-0 space-y-2">
        {branch === 'none' ? (
          <>
            <button
              type="button"
              onClick={() => send(PosStaffBeepResponse.OnMyWay)}
              disabled={respond.isPending}
              className={`${PRIMARY_BUTTON} bg-emerald-600 hover:bg-emerald-700`}
            >
              <Check className="h-4 w-4" />
              {t('staff_dashboard.beep.onMyWay')}
            </button>

            <button
              type="button"
              onClick={() => setBranch('busy')}
              disabled={respond.isPending}
              className={`${PRIMARY_BUTTON} bg-amber-500 hover:bg-amber-600`}
            >
              <Clock className="h-4 w-4" />
              {t('staff_dashboard.beep.busy')}
            </button>

            <button
              type="button"
              onClick={() => setBranch('decline')}
              disabled={respond.isPending}
              className={`${PRIMARY_BUTTON} bg-rose-600 hover:bg-rose-700`}
            >
              <XCircle className="h-4 w-4" />
              {t('staff_dashboard.beep.cantCome')}
            </button>
          </>
        ) : null}

        {branch === 'busy' ? (
          <>
            <p className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
              {t('staff_dashboard.beep.busyPick')}
            </p>
            {/* Chips sit at the bottom of the sheet, where the thumb already is: tapping one sends,
                so the whole Busy reply is two taps. */}
            <div className="flex gap-2">
              {delayChoices.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => send(PosStaffBeepResponse.Busy, minutes)}
                  disabled={respond.isPending}
                  className={CHIP_BUTTON}
                >
                  {t('staff_dashboard.beep.busyMinutes', { minutes })}
                </button>
              ))}
            </div>
          </>
        ) : null}

        {branch === 'decline' ? (
          <button
            type="button"
            onClick={() => send(PosStaffBeepResponse.CantCome)}
            disabled={respond.isPending}
            className={`${PRIMARY_BUTTON} bg-rose-600 hover:bg-rose-700`}
          >
            {respond.isPending
              ? t('staff_dashboard.beep.sending')
              : t('staff_dashboard.beep.cantComeSend')}
          </button>
        ) : null}

        {branch !== 'none' ? (
          <button
            type="button"
            onClick={() => {
              setBranch('none')
              setNote('')
            }}
            disabled={respond.isPending}
            className="h-11 w-full rounded-xl text-xs font-bold text-nexoraMuted transition hover:text-nexoraText disabled:opacity-60"
          >
            {t('staff_dashboard.beep.back')}
          </button>
        ) : null}
      </div>
    </div>
  )
}
