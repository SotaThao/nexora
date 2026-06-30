import { useNavigate } from 'react-router-dom'
import { useStaffDirectPaymentsWatch } from '../../data/hooks/useStaffDirectPaymentsWatch'
import StaffPaymentAckNoticeDialog from './modals/StaffPaymentAckNoticeDialog'

export default function StaffDirectPaymentsWatcher() {
  const navigate = useNavigate()
  const {
    ackNoticePayment,
    setAckNoticePayment,
    pendingAckCount,
    closeAckNotice,
  } = useStaffDirectPaymentsWatch()

  const handleViewDetail = () => {
    const paymentId = ackNoticePayment?.id
    setAckNoticePayment(null)
    if (paymentId) {
      navigate(`/staff/payments/${encodeURIComponent(paymentId)}`)
    }
  }

  if (!ackNoticePayment) return null

  return (
    <StaffPaymentAckNoticeDialog
      payment={ackNoticePayment}
      pendingCount={pendingAckCount}
      onViewDetail={handleViewDetail}
      onClose={closeAckNotice}
    />
  )
}
