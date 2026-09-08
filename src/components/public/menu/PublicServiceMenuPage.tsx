import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { usePublicServices } from '../../../data/hooks/usePublicServices'
import { buildOneQrPath, ONEQR_ROUTE } from '../../../constants/oneQr'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import './public-service-menu.css'

const K = 'oneqr.menu'
const normalizeSearch = (text: string) => text.toLocaleLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2,
}).format(price)

export default function PublicServiceMenuPage() {
  const { businessSlug = '' } = useParams()
  const { t, currentLanguage } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 800px)')
  const panelIdPrefix = useId()
  const { data, isPending, isError, refetch } = usePublicServices(businessSlug)
  const [search, setSearch] = useState('')
  const [selectedCategory, setCategory] = useState<string | null>(null)
  const category = isDesktop ? selectedCategory : null
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  useEffect(() => { setSearch(''); setCategory(null) }, [businessSlug])
  const categories = useMemo(() => (data?.categories ?? []).map((group, index) => ({
    ...group,
    key: group.categoryId ?? `uncategorized-${index}`,
    categoryName: group.categoryId === null || !group.categoryName ? t(`${K}.other_category`) : group.categoryName,
  })), [data, t])
  const query = normalizeSearch(search.trim())
  useEffect(() => { setExpandedCategories({}) }, [businessSlug, query, category])
  const visible = useMemo(() => categories
    .filter(group => category === null || group.key === category)
    .map(group => ({ ...group, services: group.services.filter(service =>
      !query || normalizeSearch(`${group.categoryName} ${service.name} ${service.description ?? ''}`).includes(query),
    ) }))
    .filter(group => group.services.length > 0), [categories, category, query])
  const serviceCount = new Set(categories.flatMap(group => group.services.map(service => service.id))).size
  const backPath = `${buildOneQrPath(businessSlug)}?${ONEQR_ROUTE.asQuery}=${ONEQR_ROUTE.asCustomerValue}`
  const bookingPath = `/booking/${encodeURIComponent(businessSlug)}`
  const showBookingLink = Boolean(businessSlug && data && !isPending && !isError && serviceCount > 0)
  const resetFilters = () => { setSearch(''); setCategory(null) }

  return (
    <div className="public-service-menu" lang={currentLanguage}>
      <header className="menu-header">
        <div className="menu-header-inner">
          <Link to={backPath} className="menu-back" aria-label={t(`${K}.back`)}>
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Link>
          <div className="min-w-0 flex-1">
            {data?.businessName ? <p className="menu-business">{data.businessName}</p> : null}
            <h1>{t(`${K}.title`)}</h1>
          </div>
          <LanguageSwitcher className="shrink-0 [&>button]:h-11 [&>button]:min-w-11" />
        </div>
      </header>

      <main className="menu-content">
        {isPending ? (
          <div className="menu-state" role="status">
            <Loader2 className="mx-auto mb-3 h-6 w-6 animate-spin text-nexoraBrand" aria-hidden />
            <p>{t(`${K}.loading`)}</p>
          </div>
        ) : isError || !data ? (
          <div className="menu-state" role="alert">
            <h2>{t(`${K}.error_title`)}</h2>
            <p>{t(`${K}.error_hint`)}</p>
            <button type="button" className="menu-button" onClick={() => refetch()}>{t(`${K}.retry`)}</button>
          </div>
        ) : serviceCount === 0 ? (
          <div className="menu-state">
            <h2>{t(`${K}.empty_title`)}</h2>
            <p>{t(`${K}.empty_hint`)}</p>
          </div>
        ) : (
          <>
            <div className="menu-controls">
              <div className="menu-search">
                <Search className="h-4 w-4 shrink-0" aria-hidden />
                <input
                  type="search"
                  value={search}
                  onChange={event => setSearch(event.target.value)}
                  aria-label={t(`${K}.search_label`)}
                  placeholder={t(`${K}.search_placeholder`)}
                />
                {search ? <button type="button" onClick={() => setSearch('')} aria-label={t(`${K}.clear_search`)}>
                  <X className="h-4 w-4" aria-hidden />
                </button> : null}
              </div>
              {isDesktop && <div className="menu-filters" role="group" aria-label={t(`${K}.categories`)}>
                <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)}>
                  {t(`${K}.all`)}
                </button>
                {categories.filter(group => group.services.length > 0).map(group => (
                  <button key={group.key} type="button" aria-pressed={category === group.key} onClick={() => setCategory(group.key)}>
                    {group.categoryName || t(`${K}.other_category`)}
                  </button>
                ))}
              </div>}
            </div>
            {visible.length ? (
              <div className="menu-grid">
                {visible.map(group => {
                  const expanded = expandedCategories[group.key] ?? Boolean(query || category !== null)
                  const panelId = `${panelIdPrefix}-${encodeURIComponent(group.key)}`
                  return (
                    <section className={`menu-category${expanded ? '' : ' is-collapsed'}`} key={group.key}>
                      <div className="menu-category-heading is-collapsible">
                        <h2>
                          <button
                            type="button"
                            className="menu-category-toggle"
                            aria-label={group.categoryName}
                            aria-expanded={expanded}
                            aria-controls={panelId}
                            onClick={() => setExpandedCategories(previous => ({ ...previous, [group.key]: !expanded }))}
                          >
                            <span className="menu-category-title">
                              <span className="menu-eyebrow" aria-hidden>{data.businessName}</span>
                              <span className="menu-category-name">{group.categoryName}</span>
                            </span>
                            <ChevronDown className="menu-category-chevron" aria-hidden />
                          </button>
                        </h2>
                      </div>
                      <div id={panelId} hidden={!expanded}>
                        {group.services.map(service => (
                          <article className="menu-service" key={service.id}>
                            <div className="menu-service-line">
                              <h3>{service.name}</h3>
                              <span className="menu-price">{service.price != null ? formatPrice(service.price) : t(`${K}.ask_price`)}</span>
                            </div>
                            {service.description ? <p className="menu-description">{service.description}</p> : null}
                            {service.durationMinutes > 0 ? (
                              <span className="menu-duration">{t(`${K}.duration`, { count: service.durationMinutes })}</span>
                            ) : null}
                          </article>
                        ))}
                      </div>
                    </section>
                  )
                })}
              </div>
            ) : (
              <div className="menu-state">
                <h2>{t(`${K}.no_results`)}</h2>
                <p>{t(`${K}.no_results_hint`)}</p>
                <button type="button" className="menu-button" onClick={resetFilters}>{t(`${K}.reset`)}</button>
              </div>
            )}
          </>
        )}

        <div className={`menu-bottom${showBookingLink ? ' menu-booking' : ''}`}>
          <div>
            {showBookingLink ? (
              <>
                <p className="menu-eyebrow">{t(`${K}.booking_eyebrow`)}</p>
                <h2>{t(`${K}.booking_title_lead`)}{' '}<em>{t(`${K}.booking_title_accent`)}</em></h2>
              </>
            ) : <h2>{t(`${K}.footer_title`)}</h2>}
            <p>{t(showBookingLink ? `${K}.booking_hint` : `${K}.footer_hint`)}</p>
          </div>
          {showBookingLink ? (
            <Link to={bookingPath} className="menu-button">
              {t(`${K}.book_appointment`)}
              <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
            </Link>
          ) : (
            <Link to={backPath} className="menu-button">{t(`${K}.back`)}<ArrowLeft className="h-4 w-4" aria-hidden /></Link>
          )}
        </div>
      </main>
      <footer className="menu-brand" lang={currentLanguage}>
        {t('oneqr.landing.powered_by')}{' '}
        <a href="https://nexoratouch.com" target="_blank" rel="noopener noreferrer">
          {t('oneqr.landing.brand_name')}<ArrowUpRight className="h-3 w-3" aria-hidden />
        </a>
      </footer>
    </div>
  )
}
