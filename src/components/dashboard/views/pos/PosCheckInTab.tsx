// The front desk's Check-in tab: CheckInSurface wired to the merchant data source.
//
// It replaces the Create mode that used to live inside PosOrderWorkspace. That mode was a second
// implementation of the customer kiosk's questions, and keeping the two matching by hand failed
// three times — so the questions now come from one component and only the data source differs.
//
// What was lost with that mode, deliberately: the Products tab, the email field, and selling
// products to someone who never checks in. Adding products to an order that already exists is
// unaffected — that is checkout, and it still lives in PosOrderWorkspace.
import { useMemo } from 'react'
import CheckInSurface from '../../../checkin/CheckInSurface'
import createPosCheckInSource from '../../../checkin/sources/usePosCheckInSource'
import { useCheckInSettings } from '../../../../data/hooks/usePosCheckIn'

export default function PosCheckInTab({
  businessId,
  businessName,
  onCheckedIn,
  onFinished,
}: {
  businessId: string
  businessName?: string
  onCheckedIn?: () => void
  // Only after a completed check-in. Cancel deliberately has no callback: it clears the draft and
  // leaves the operator on the keypad, ready for the next guest.
  onFinished?: () => void
}) {
  const { data: settings } = useCheckInSettings(businessId)
  const useSource = useMemo(() => createPosCheckInSource(businessId), [businessId])

  return (
    <CheckInSurface
      useSource={useSource}
      layout={settings?.frontDeskCheckInLayout ?? 'SinglePage'}
      businessName={businessName ?? ''}
      // No countdown here: the number on the thank-you screen is what the operator reads out, and
      // a screen that clears itself mid-sentence is worse than one extra tap.
      autoReturnSeconds={null}
      onCheckedIn={onCheckedIn}
      onFinished={onFinished}
      compactTechnicianCards
    />
  )
}
