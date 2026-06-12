import React from 'react'

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode
  className?: string
  contentClassName?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function SecondaryButton({
  children,
  className = '',
  contentClassName = '',
  type = 'button',
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 w-full rounded-lg bg-gradient-to-r from-nexoraElectric to-nexoraViolet p-px transition-opacity hover:opacity-90 ${className}`}
      {...props}
    >
      <span className={`flex min-h-10 w-full items-center justify-center rounded-[7px] bg-white px-4 py-2 text-xs font-bold ${contentClassName}`}>
        <span className="bg-gradient-to-r from-nexoraElectric to-nexoraViolet bg-clip-text text-transparent">
          {children}
        </span>
      </span>
    </button>
  )
}
