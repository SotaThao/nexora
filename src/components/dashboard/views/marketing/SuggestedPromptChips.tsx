import { SUGGESTED_PROMPTS, type SuggestedPrompt } from './constants'

export interface SuggestedPromptChipsProps {
  prompts?: SuggestedPrompt[]
  onSelectPrompt?: (prompt: string) => void
  containerId?: string
  className?: string
}

export function SuggestedPromptChips({
  prompts = SUGGESTED_PROMPTS,
  onSelectPrompt,
  containerId = 'suggested-prompts-container',
  className = '',
}: SuggestedPromptChipsProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()} id={containerId}>
      {prompts.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onSelectPrompt?.(item.prompt)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-left text-xs font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm hover:shadow-indigo-100"
        >
          # {item.label}
        </button>
      ))}
    </div>
  )
}

export default SuggestedPromptChips
