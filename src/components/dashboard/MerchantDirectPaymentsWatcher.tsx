import { useNavigate } from 'react-router-dom'
import { useMerchantDirectPaymentsWatch } from '../../data/hooks/useMerchantDirectPaymentsWatch'
import MerchantPaymentAckNoticeDialog from './modals/MerchantPaymentAckNoticeDialog'

export default function MerchantDirectPaymentsWatcher() {
  const navigate = useNavigate()
  const {
    ackNoticePayment,
    setAckNoticePayment,
    pendingAckCount,
    closeAckNotice,
  } = useMerchantDirectPaymentsWatch()

  const handleViewDetail = () => {
    const paymentId = ackNoticePayment?.id
    setAckNoticePayment(null)
    if (paymentId) {
      navigate(`/dashboard/reports?tab=direct_payments&paymentId=${encodeURIComponent(paymentId)}`)
    }
  }

  if (!ackNoticePayment) return null

  return (
    <MerchantPaymentAckNoticeDialog
      payment={ackNoticePayment}
      pendingCount={pendingAckCount}
      onViewDetail={handleViewDetail}
      onClose={closeAckNotice}
    />
  )
}
