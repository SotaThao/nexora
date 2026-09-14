import { useTranslation } from '../../../../contexts/LanguageContext'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'

const PILL =
  'inline-flex h-6 w-fit max-w-full items-center justify-center whitespace-nowrap rounded-full px-2 text-[10px] font-bold leading-none'

export default function CustomerVisitTag({ isNewCustomer }: { isNewCustomer: boolean }) {
  const { t } = useTranslation()

  return (
    <span
      className={`${PILL} ${
        isNewCustomer ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-100 text-violet-800'
      }`}
    >
      {t(TK + (isNewCustomer ? 'newCustomerTag' : 'returningCustomerTag'))}
    </span>
  )
}
