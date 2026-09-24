import React from 'react'
import { Link } from 'react-router-dom'
import { LayoutGrid } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { buildOneQrPath } from '../../constants/oneQr'

const VARIANT_CLASSNAME = {
  default: 'w-full py-3.5 bg-gradient-to-r from-nexoraBrand to-indigo-600 hover:opacity-95 active:scale-[0.98] transition-all text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 inline-flex items-center justify-center gap-2',
  public: 'flex h-14 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#4d6fff] to-[#7c5cff] text-base font-bold text-white hover:opacity-90',
}

export default function BackToOneQrMenuButton({
  businessSlug,
  className = '',
  variant = 'default',
}: {
  businessSlug?: string | null
  className?: string
  variant?: keyof typeof VARIANT_CLASSNAME
}) {
  const { t } = useTranslation()

  if (!businessSlug) return null

  return (
    <Link
      to={buildOneQrPath(businessSlug)}
      className={`${VARIANT_CLASSNAME[variant]} ${className}`}
    >
      <LayoutGrid className="h-4 w-4" />
      <span>{t('oneqr.backToMenuButton')}</span>
    </Link>
  )
}
