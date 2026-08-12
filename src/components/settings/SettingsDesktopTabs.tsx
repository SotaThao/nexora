import type { KeyboardEvent, ReactNode } from 'react'

export type SettingsDesktopTabItem = {
  key: string
  label: string
}

type SettingsDesktopTabsProps = {
  tabs: readonly SettingsDesktopTabItem[]
  activeTab: string
  onTabChange: (tab: string) => void
  ariaLabel: string
  children: ReactNode
}

export default function SettingsDesktopTabs({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel,
  children,
}: SettingsDesktopTabsProps) {
  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const direction = event.key === 'ArrowRight' ? 1 : -1
    const nextIndex = (index + direction + tabs.length) % tabs.length
    const nextTab = tabs[nextIndex]
    onTabChange(nextTab.key)
    document.getElementById(`settings-tab-${nextTab.key}`)?.focus()
  }

  return (
    <section className="mx-auto max-w-6xl space-y-4">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label={ariaLabel}
      >
        {tabs.map((item, index) => {
          const isActive = item.key === activeTab
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              id={`settings-tab-${item.key}`}
              aria-controls="settings-active-panel"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(item.key)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={[
                'inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-xs font-black leading-tight transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand focus-visible:ring-offset-2',
                isActive
                  ? 'border-transparent bg-nexoraBrand text-white shadow-nexora-soft'
                  : 'border-nexoraBorder bg-nexoraSurface text-nexoraMuted hover:border-nexoraLavender hover:text-nexoraText',
              ].join(' ')}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <section
        id="settings-active-panel"
        role="tabpanel"
        aria-labelledby={`settings-tab-${activeTab}`}
        tabIndex={0}
        className="overflow-hidden rounded-lg"
      >
        {children}
      </section>
    </section>
  )
}
