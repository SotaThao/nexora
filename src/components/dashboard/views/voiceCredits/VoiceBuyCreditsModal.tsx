import React from 'react'
import { PhoneIncomingIcon } from '../BookingHubIcons'
import CreditTopUpModal from '../creditCheckout/CreditTopUpModal'
import { VOICE_CREDIT_TOP_UP_CONFIG } from '../creditCheckout/constants'

type Props = {
  open: boolean
  preserveBodyLock?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function VoiceBuyCreditsModal({
  open,
  preserveBodyLock = false,
  onClose,
  onSuccess,
}: Props) {
  return (
    <CreditTopUpModal
      open={open}
      config={VOICE_CREDIT_TOP_UP_CONFIG}
      headerIcon={<PhoneIncomingIcon className="marketing-icon" />}
      preserveBodyLock={preserveBodyLock}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
