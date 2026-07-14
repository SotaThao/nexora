import { Loader2 } from 'lucide-react'

type ToggleSwitchSize = 'sm' | 'md'

type ToggleSwitchProps = {
  checked: boolean
  onChange: () => void
  activeColor?: string
  inactiveColor?: string
  title?: string
  ariaLabel?: string
  disabled?: boolean
  loading?: boolean
  size?: ToggleSwitchSize
}

const ON_CLASS_BY_COLOR: Record<string, string> = {
  'bg-emerald-500': 'toggle-switch--on-emerald',
  'bg-blue-500': 'toggle-switch--on-blue',
  'bg-nexoraBrand': 'toggle-switch--on-brand',
  'bg-amber-600': 'toggle-switch--on-amber',
  'bg-nexoraWarning': 'toggle-switch--on-warning',
}

const OFF_CLASS_BY_COLOR: Record<string, string> = {
  'bg-slate-300': 'toggle-switch--off',
  'bg-nexoraBorder': 'toggle-switch--off-muted',
  'bg-slate-200': 'toggle-switch--off-slate',
}

export default function ToggleSwitch({
  checked,
  onChange,
  activeColor = 'bg-emerald-500',
  inactiveColor = 'bg-slate-300',
  title,
  ariaLabel,
  disabled = false,
  loading = false,
  size = 'sm',
}: ToggleSwitchProps) {
  const onClass = ON_CLASS_BY_COLOR[activeColor] ?? 'toggle-switch--on-emerald'
  const offClass = OFF_CLASS_BY_COLOR[inactiveColor] ?? 'toggle-switch--off'
  const sizeClass = size === 'md' ? 'toggle-switch--md' : ''
  const stateClass = checked ? onClass : offClass

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      onClick={onChange}
      title={title}
      className={`toggle-switch ${sizeClass} ${stateClass} ${loading ? 'toggle-switch--loading' : ''}`}
    >
      {loading ? (
        <span className="toggle-switch__spinner" aria-hidden="true">
          <Loader2 className="toggle-switch__spinner-icon animate-spin" />
        </span>
      ) : (
        <span aria-hidden="true" className="toggle-switch__knob" />
      )}
    </button>
  )
}
