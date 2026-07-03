import type { LucideIcon } from 'lucide-react'
import CustomSelect from '../../CustomSelect'

const TOOLBAR_BUTTON_CLASS =
  'h-9 w-full justify-between gap-1.5 whitespace-nowrap rounded-lg border-[#dde5ef] bg-white px-3 text-xs font-bold text-[#0b1220] shadow-sm hover:bg-[#f8fafc] 2xl:w-auto 2xl:justify-start'

export default function PayoutToolbarSelect({
  icon: Icon,
  label,
  value,
  onChange,
  options,
  menuMinWidth = 168,
  className = '',
  fullWidth = false,
}: {
  icon?: LucideIcon
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  menuMinWidth?: number
  className?: string
  fullWidth?: boolean
}) {
  const toolbarButtonClass = fullWidth
    ? 'h-9 w-full justify-between gap-1.5 whitespace-nowrap rounded-lg border-[#dde5ef] bg-white px-3 text-xs font-bold text-[#0b1220] shadow-sm hover:bg-[#f8fafc]'
    : TOOLBAR_BUTTON_CLASS

  return (
    <CustomSelect
      value={value}
      onChange={(e) => onChange(e.target.value)}
      options={options}
      size="sm"
      buttonLabel={label}
      leadingIcon={Icon ? <Icon className="h-3.5 w-3.5 shrink-0 text-[#687381]" strokeWidth={2} /> : null}
      menuMinWidth={menuMinWidth}
      className={`w-full min-w-0 ${fullWidth ? '' : '2xl:w-auto 2xl:shrink-0'} ${className}`.trim()}
      buttonClass={toolbarButtonClass}
    />
  )
}
