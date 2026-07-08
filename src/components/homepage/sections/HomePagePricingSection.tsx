/** Homepage section component */
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import { useTranslation } from '../../../contexts/LanguageContext'
import { homepageTranslations, type HomePageTranslationKey } from '../i18n/homepageTranslations'

type TextCell = { type: 'text'; key: HomePageTranslationKey }
type BoolCell = { type: 'bool'; value: boolean }
type CmpCell = TextCell | BoolCell

const PLAN_COLUMN_KEYS: HomePageTranslationKey[] = [
  'pr-cmp-col-lite',
  'pr-cmp-col-starter',
  'pr-cmp-col-pro',
  'pr-cmp-col-enterprise',
]

const PRICING_COMPARISON_ROWS: { labelKey: HomePageTranslationKey; cells: CmpCell[] }[] = [
  {
    labelKey: 'pr-cmp-monthly',
    cells: [
      { type: 'text', key: 'pr-cmp-free-price' },
      { type: 'text', key: 'pr-cmp-starter-price' },
      { type: 'text', key: 'pr-cmp-pro-price' },
      { type: 'text', key: 'pr-cmp-custom' },
    ],
  },
  {
    labelKey: 'pr-cmp-staff',
    cells: [
      { type: 'text', key: 'pr-cmp-staff-free' },
      { type: 'text', key: 'pr-cmp-unlimited' },
      { type: 'text', key: 'pr-cmp-unlimited' },
      { type: 'text', key: 'pr-cmp-unlimited' },
    ],
  },
  {
    labelKey: 'pr-cmp-kyb',
    cells: [
      { type: 'text', key: 'pr-cmp-required' },
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: false },
    ],
  },
  {
    labelKey: 'pr-cmp-qr',
    cells: [
      { type: 'text', key: 'pr-cmp-qr-basic' },
      { type: 'text', key: 'pr-cmp-qr-branded' },
      { type: 'text', key: 'pr-cmp-qr-branded' },
      { type: 'text', key: 'pr-cmp-qr-premium' },
    ],
  },
  {
    labelKey: 'pr-cmp-tips',
    cells: [
      { type: 'bool', value: true },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-reviews',
    cells: [
      { type: 'bool', value: false },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-staff-accts',
    cells: [
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-rewards',
    cells: [
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-coop',
    cells: [
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: true },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-multiloc',
    cells: [
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-pos',
    cells: [
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: false },
      { type: 'bool', value: true },
    ],
  },
  {
    labelKey: 'pr-cmp-support',
    cells: [
      { type: 'text', key: 'pr-cmp-support-email' },
      { type: 'text', key: 'pr-cmp-support-email' },
      { type: 'text', key: 'pr-cmp-support-priority' },
      { type: 'text', key: 'pr-cmp-support-247' },
    ],
  },
]

function ComparisonCell({ cell, t }: { cell: CmpCell; t: (key: HomePageTranslationKey) => string }) {
  if (cell.type === 'text') {
    return <span className="text-xs sm:text-sm font-semibold text-slate-700">{t(cell.key)}</span>
  }

  if (cell.value) {
    return <span className="text-green font-bold text-base" aria-label="Included">✓</span>
  }

  return <span className="text-slate-300 font-bold text-base" aria-label="Not included">—</span>
}

export default function HomePagePricingSection() {
  const { planCta } = useHomePageBridge()
  const { currentLanguage } = useTranslation()
  const lang = currentLanguage === 'vi' ? 'vi' : 'en'
  const t = (key: HomePageTranslationKey) =>
    homepageTranslations[lang][key] ?? homepageTranslations.en[key]

  return (
    <section className="py-16 sm:py-24 bg-white ds-section" id="pricing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold text-purple uppercase tracking-widest" data-i18n="pr-eyebrow">
            {t('pr-eyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-navy tracking-tight" data-i18n="pr-title">
            {t('pr-title')}
          </h2>
          <p className="text-slate-500 text-sm sm:text-base" data-i18n="pr-desc">
            {t('pr-desc')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 xl:gap-8 items-stretch">
          <div className="bg-gradient-to-b from-slate-50 to-white border border-slate-200/80 rounded-[32px] p-6 flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden ds-surface ds-pricing-card">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-green/5 rounded-full blur-xl" />
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div className="ds-content-card">
                  <h3 className="text-xl font-extrabold text-navy" data-i18n="plan-free-title">Lite Pack (Free)</h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-normal" data-i18n="plan-free-desc">For salons with 5 staff or fewer. Requires a quick business identity check.</p>
                </div>
                <span className="bg-green/10 text-green text-xs font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Free</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-navy">$0</span>
                <span className="text-xs text-slate-500 font-bold">/ <span data-i18n="calc-mo">mo</span></span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 font-semibold border-t border-slate-200/80 pt-6">
                <li className="flex items-center gap-2 text-green"><span className="font-bold">✓</span> <span data-i18n="plan-free-feat-1">Up to 5 active specialists</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-free-feat-2">Quick business identity check</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-free-feat-3">Basic tabletop Smart QR</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-free-feat-4">Direct peer-to-peer tip routing</span></li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-green hover:bg-green/95 text-white font-extrabold py-3 rounded-full text-xs tracking-wide transition-all shadow-md shadow-green/10 ds-control ds-button" data-i18n="btn-plan-free" onClick={planCta}>Sign Up Free (Identity Check Required)</button>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-[32px] p-6 flex flex-col justify-between hover:shadow-xl transition-all ds-surface ds-pricing-card">
            <div className="space-y-6">
              <div className="ds-content-card">
                <h3 className="text-xl font-extrabold text-navy" data-i18n="plan-1-title">Starter Pack</h3>
                <p className="text-xs text-slate-500 mt-1" data-i18n="plan-1-desc">Perfect for micro booths &amp; independent practitioners</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-navy">$29</span>
                <span className="text-xs text-slate-500 font-bold">/ <span data-i18n="calc-mo">mo</span></span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 font-semibold border-t border-slate-200/80 pt-6">
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-1-feat-1">Branded tabletop QR placements</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-1-feat-2">Instant peer tip direct routing</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-1-feat-3">Google review automated channels</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-1-feat-4">Basic monthly transactional reviews</span></li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-extrabold py-3 rounded-full text-xs tracking-wide transition-all ds-control ds-button" data-i18n="btn-plan-start" onClick={planCta}>Get Started Now</button>
          </div>

          <div className="bg-gradient-to-b from-indigo-50/50 to-white border-2 border-purple rounded-[32px] p-6 flex flex-col justify-between hover:shadow-2xl transition-all relative transform lg:-translate-y-4 ds-pricing-card">
            <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-purple text-white text-xs font-black tracking-widest uppercase py-1.5 px-4 rounded-full shadow-md text-center w-[85%]" data-i18n="plan-pro-badge">RECOMMENDED FOR SALONS</div>
            <div className="space-y-6 pt-3 lg:pt-0">
              <div className="ds-content-card">
                <h3 className="text-xl font-extrabold text-navy" data-i18n="plan-2-title">Professional Pro</h3>
                <p className="text-xs text-slate-500 mt-1" data-i18n="plan-2-desc">Brilliant choice for growing teams &amp; local boutique hubs</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-navy">$79</span>
                <span className="text-xs text-slate-500 font-bold">/ <span data-i18n="calc-mo">mo</span></span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 font-semibold border-t border-slate-200/80 pt-6">
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-2-feat-1">Includes every Starter plan feature</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-2-feat-2">Custom technician roster logins</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-2-feat-3">Automatic direct tip processing pipelines</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-2-feat-4">Adjustable B2B rewards rules panel</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-2-feat-5">Client profile classification tool</span></li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-purple hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-full text-xs tracking-wide shadow-lg shadow-purple/20 transition-all hover:scale-[1.01] ds-control ds-button" data-i18n="btn-plan-pro" onClick={planCta}>Select Pro Tier</button>
          </div>

          <div className="bg-slate-50 border border-slate-200/60 rounded-[32px] p-6 flex flex-col justify-between hover:shadow-xl transition-all ds-surface ds-pricing-card">
            <div className="space-y-6">
              <div className="ds-content-card">
                <h3 className="text-xl font-extrabold text-navy" data-i18n="plan-3-title">Enterprise Group</h3>
                <p className="text-xs text-slate-500 mt-1" data-i18n="plan-3-desc">Tailored for prominent multi-location boutique franchises</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-black text-navy" data-i18n="plan-3-price">Custom Scale</span>
                <span className="text-xs text-slate-500 font-bold">/ <span data-i18n="plan-3-price-sub">tailored quote</span></span>
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 font-semibold border-t border-slate-200/80 pt-6">
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-3-feat-1">Full multi-location organizational dashboards</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-3-feat-2">Direct API checkout point-of-sale syncs</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-3-feat-3">Premium solid brass NFC station plaques</span></li>
                <li className="flex items-center gap-2"><span className="text-purple">✓</span> <span data-i18n="plan-3-feat-4">24/7 dedicated enterprise success managers</span></li>
              </ul>
            </div>
            <button className="w-full mt-8 bg-navy hover:bg-slate-800 text-white font-extrabold py-3 rounded-full text-xs tracking-wide transition-all ds-control ds-button" data-i18n="btn-plan-ent" onClick={planCta}>Contact Success Sales</button>
          </div>
        </div>

        <div className="mt-14 sm:mt-16">
          <h3
            className="text-center text-lg sm:text-xl font-extrabold text-navy mb-6"
            data-i18n="pr-table-title"
          >
            {t('pr-table-title')}
          </h3>

          <div className="nx-pricing-compare overflow-x-auto rounded-[24px] border border-slate-200/80 shadow-sm bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th
                    scope="col"
                    className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-extrabold text-slate-500 uppercase tracking-wide"
                    data-i18n="pr-cmp-feature"
                  >
                    {t('pr-cmp-feature')}
                  </th>
                  {PLAN_COLUMN_KEYS.map((key) => (
                    <th
                      key={key}
                      scope="col"
                      className={`px-3 sm:px-4 py-4 text-xs sm:text-sm font-extrabold text-navy text-center ${
                        key === 'pr-cmp-col-pro' ? 'bg-purple/5 text-purple' : ''
                      }`}
                      data-i18n={key}
                    >
                      {t(key)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PRICING_COMPARISON_ROWS.map((row) => (
                  <tr key={row.labelKey} className="border-b border-slate-100 last:border-b-0">
                    <th
                      scope="row"
                      className="px-4 sm:px-6 py-3.5 text-xs sm:text-sm font-bold text-slate-700"
                      data-i18n={row.labelKey}
                    >
                      {t(row.labelKey)}
                    </th>
                    {row.cells.map((cell, index) => (
                      <td
                        key={`${row.labelKey}-${index}`}
                        className={`px-3 sm:px-4 py-3.5 text-center ${
                          index === 2 ? 'bg-purple/[0.03]' : ''
                        }`}
                      >
                        <ComparisonCell cell={cell} t={t} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  )
}
