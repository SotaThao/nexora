import { Users } from 'lucide-react'
import { HeaderMessagesStaffChatCtaVariant } from './headerMessagesConstants'

interface HeaderMessagesStaffChatCtaProps {
  variant: HeaderMessagesStaffChatCtaVariant
  label: string
  onClick: () => void
}

const CTA_CLASS: Record<HeaderMessagesStaffChatCtaVariant, string> = {
  [HeaderMessagesStaffChatCtaVariant.Empty]: 'header-messages-staff-cta',
  [HeaderMessagesStaffChatCtaVariant.Footer]: 'header-messages-staff-cta--secondary',
}

export default function HeaderMessagesStaffChatCta({
  variant,
  label,
  onClick,
}: HeaderMessagesStaffChatCtaProps) {
  return (
    <button
      type="button"
      className={CTA_CLASS[variant]}
      onClick={onClick}
    >
      <Users className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
