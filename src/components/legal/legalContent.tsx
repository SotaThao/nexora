import React from 'react'
import type { AppLanguage } from '../../types/contexts'
import enLocale from '../../locales/en.json'
import viLocale from '../../locales/vi.json'

export type LegalDocType = 'privacy' | 'terms'

export interface LegalSection {
  title: string
  body: string
  items?: string[]
  note?: string
}

const EMAIL_SPLIT_PATTERN = /([\w.+-]+@[\w-]+(?:\.[\w-]+)+)/g
const EMAIL_TEST_PATTERN = /^[\w.+-]+@[\w-]+(?:\.[\w-]+)+$/

export function getLegalSections(type: LegalDocType, currentLanguage: AppLanguage): LegalSection[] {
  const dict = currentLanguage === 'vi' ? viLocale : enLocale
  return (dict.register.legal[type]?.sections ?? []) as LegalSection[]
}

function linkifyEmails(text: string): React.ReactNode {
  const parts = text.split(EMAIL_SPLIT_PATTERN)
  if (parts.length === 1) return text
  return parts.map((part, idx) =>
    EMAIL_TEST_PATTERN.test(part) ? (
      <a
        key={idx}
        href={`mailto:${part}`}
        className="text-nexoraElectric underline decoration-nexoraElectric/40 underline-offset-2 hover:text-nexoraViolet"
      >
        {part}
      </a>
    ) : (
      <React.Fragment key={idx}>{part}</React.Fragment>
    ),
  )
}

function renderListItem(item: string): React.ReactNode {
  const colonIndex = item.indexOf(':')
  if (colonIndex === -1) return linkifyEmails(item)
  const label = item.slice(0, colonIndex + 1)
  const rest = item.slice(colonIndex + 1)
  return (
    <>
      <span className="font-bold">{label}</span>
      {linkifyEmails(rest)}
    </>
  )
}

/** Structural only — inherits font size/color from the consumer's wrapper. */
export function LegalSectionBody({ text }: { text: string }) {
  return <p className="whitespace-pre-line">{linkifyEmails(text)}</p>
}

/** Structural only — inherits font size/color from the consumer's wrapper. */
export function LegalSectionList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1.5 pl-5">
      {items.map((item, idx) => (
        <li key={idx}>{renderListItem(item)}</li>
      ))}
    </ul>
  )
}
