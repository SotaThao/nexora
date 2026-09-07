import { useTranslation } from '../../../../contexts/LanguageContext'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'

export default function CustomerVisitTag({ isNewCustomer }: { isNewCustomer: boolean }) {
  const { t } = useTranslation()

  return isNewCustomer ? (
    <span className="mt-1 inline-flex w-fit rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
      {t(TK + 'newCustomerTag')}
    </span>
  ) : (
    <span className="mt-1 inline-flex w-fit rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-800">
      {t(TK + 'returningCustomerTag')}
    </span>
  )
}
