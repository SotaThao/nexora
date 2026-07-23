import { Link } from 'react-router-dom'

type DemoOption = {
  id: string
  label: string
}

type DemoStateBarProps = {
  value: string
  options: DemoOption[]
  onChange: (value: string) => void
  crossLinkLabel: string
  crossLinkTo: string
}

const motionClass =
  'motion-safe:transition-colors motion-safe:duration-200 motion-reduce:transition-none'

export default function DemoStateBar({
  value,
  options,
  onChange,
  crossLinkLabel,
  crossLinkTo,
}: DemoStateBarProps) {
  return (
    <div className="fixed inset-x-0 top-0 z-[120] h-[52px] bg-[#101322] text-white shadow-lg">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-2 px-2 sm:px-3">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5 sm:gap-2">
          <span className="shrink-0 text-[9px] font-semibold text-white/65 sm:text-[11px]">
            <span className="sm:hidden">DEMO ·</span>
            <span className="hidden sm:inline">DEMO · Trạng thái:</span>
          </span>
          {options.map((option) => {
            const active = value === option.id
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(option.id)}
                className={
                  'min-h-11 min-w-0 rounded-full px-2.5 text-[9px] font-extrabold sm:px-4 sm:text-[11px] ' +
                  motionClass +
                  (active ? ' bg-white text-[#101322]' : ' bg-white/10 text-white hover:bg-white/15')
                }
              >
                <span className="block truncate">{option.label}</span>
              </button>
            )
          })}
        </div>
        <Link
          to={crossLinkTo}
          className={'inline-flex min-h-11 shrink-0 items-center rounded-lg px-1.5 text-[9px] font-bold text-brandCyan hover:text-white sm:px-2 sm:text-[11px] ' + motionClass}
        >
          {crossLinkLabel}
        </Link>
      </div>
    </div>
  )
}
