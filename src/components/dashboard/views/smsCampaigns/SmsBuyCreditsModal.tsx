import React from 'react'
import { WalletCardsIcon } from '../BookingHubIcons'
import CreditTopUpModal from '../creditCheckout/CreditTopUpModal'
import { SMS_CREDIT_TOP_UP_CONFIG } from '../creditCheckout/constants'

type Props = {
  open: boolean
  preserveBodyLock?: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function SmsBuyCreditsModal({
  open,
  preserveBodyLock = false,
  onClose,
  onSuccess,
}: Props) {
  return (
    <CreditTopUpModal
      open={open}
      config={SMS_CREDIT_TOP_UP_CONFIG}
      headerIcon={<WalletCardsIcon className="marketing-icon" />}
      preserveBodyLock={preserveBodyLock}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  )
}
