# L3b handoff — M03 Ca làm thêm + S00-07 Admin

## Store
- `store/types/m03.ts`: `Shift` keeps contract-1 fields `id,title,salonId,startsAt,pay`; adds `endsAt,status
  (open|full|cancelled),kind,mode,services,staffNeeded,tips,distanceMi,guarantee,policy,postedAt`.
  `ShiftApplication.status` is a code (`invited|pending|locked|working|completed|absent|techCancelled|
  salonCancelled|rejected`) with `deposit`, `policy` snapshot, `history`, `note`.
- `ShiftPolicy` = the 6 admin params + `version`. Snapshotted onto each shift (at post) and each application (at
  agreement). New deposits read `state.shiftPolicy`; existing ones keep their snapshot (không áp hồi tố).
- Extra state lives in the optional `shiftBoard` key (clock, availability, share, reliability deltas, policy
  history) because `store/seed/index.ts` (L0) only merges `shifts/shiftApplications/shiftPolicy`. The slice falls
  back to the seed board when the key is absent (fresh load / Reset demo).
- All mutations: `store/slices/m03.ts` via `storeActions.update`. Pure rules: `modules/m03-shifts/rules.ts`.

## Events / contracts
- `shift.checkin.overdue` is subscribed at module level in the slice: jumps the demo clock past the grace period
  of the current tech's next locked shift → auto no-show (Vắng mặt, deposit lost, reliability +1 vắng, toast).
  Moving "Giờ giả lập" past the grace period does the same.
- Contract 4: `/community-v2/shifts?shift=<id>` highlights + scrolls to the shift.
- `ShiftChatCard` (exported from `modules/m03-shifts/index.ts`) for M05 chat attachments.
- Terms publish (S00-07) calls L0 `storeActions.publishTerms()` + `simulate("terms.v11.published")`, same as the
  demo bar.

## Known shared-layer gaps (not fixable inside L3b paths)
- `ToastProvider` is never mounted by the shell → every `useToast()` in the app is a no-op. M03/admin use their
  own module-level toast queue (`ShiftToast.tsx`) rendered by `withShiftToasts`. Once L0 mounts the provider,
  this can switch back to `useToast`.
- Demo bar "Quá giờ check-in ca" still toasts "Chưa có màn — stream khác sẽ nối" (L0 copy; toast is a no-op now).
- Unknown paths under `/community-v2/*` render a blank page (no fallback route).
- Nổi bật prices and AI keyword lists are M01 data → admin tabs keep edits as admin-local state only.
