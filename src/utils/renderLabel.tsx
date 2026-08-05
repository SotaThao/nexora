import React, { type ReactNode } from 'react'

/** Renders label text, turning `*` into a red required marker. */
export function renderLabel(text: ReactNode): ReactNode {
  if (typeof text !== 'string') return text
  if (text.includes('*')) {
    const parts = text.split('*')
    return (
      <>
        {parts.map((part, idx) => (
          <React.Fragment key={idx}>
            {part}
            {idx < parts.length - 1 && (
              <span className="text-red-500 font-bold ml-0.5">*</span>
            )}
          </React.Fragment>
        ))}
      </>
    )
  }
  return text
}
