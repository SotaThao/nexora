import { Users, type LucideIcon } from 'lucide-react'
import { HeaderMessagesStaffChatCtaVariant } from './headerMessagesConstants'

interface HeaderMessagesStaffChatCtaProps {
  variant: HeaderMessagesStaffChatCtaVariant
  label: string
  onClick: () => void
  Icon?: LucideIcon
}

const CTA_CLASS: Record<HeaderMessagesStaffChatCtaVariant, string> = {
  [HeaderMessagesStaffChatCtaVariant.Empty]: 'header-messages-staff-cta',
  [HeaderMessagesStaffChatCtaVariant.Footer]: 'header-messages-staff-cta--secondary',
}

export default function HeaderMessagesStaffChatCta({
  variant,
  label,
  onClick,
  Icon = Users,
}: HeaderMessagesStaffChatCtaProps) {
  return (
    <button
      type="button"
      className={CTA_CLASS[variant]}
      onClick={onClick}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{label}</span>
    </button>
  )
}
