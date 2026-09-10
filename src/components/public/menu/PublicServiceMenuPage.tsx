import { useEffect, useId, useMemo, useState } from 'react'
import { ArrowLeft, ArrowUpRight, ChevronDown, Loader2, Search, X } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { usePublicServices } from '../../../data/hooks/usePublicServices'
import { usePublicOneQrBookingLink } from '../../../data/hooks/usePublicOneQr'
import { buildOneQrPath, ONEQR_ROUTE } from '../../../constants/oneQr'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import type { PublicServiceItem } from '../../../types/publicServices'
import LanguageSwitcher from '../../ui/LanguageSwitcher'
import './public-service-menu.css'

const K = 'oneqr.menu'
const normalizeSearch = (text: string) => text.toLocaleLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
const formatPrice = (price: number) => new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD',
  minimumFractionDigits: Number.isInteger(price) ? 0 : 2, maximumFractionDigits: 2,
}).format(price)

function ServiceImage({ src, name }: { src: string; name: string }) {
  const [failed, setFailed] = useState(false)
  if (failed) return null
  return <img className="menu-service-image" src={src} alt={name} width={64} height={64}
    loading="lazy" decoding="async" onError={() => setFailed(true)} />
}

function groupServicesByTag(services: PublicServiceItem[]) {
  const tagged = new Map<string, { tag: string | null; services: PublicServiceItem[] }>()
  const untagged: PublicServiceItem[] = []
  for (const service of services) {
    if (!service.tags?.length) {
      untagged.push(service)
      continue
    }
    for (const tag of service.tags) {
      const key = tag.toLowerCase()
      if (!tagged.has(key)) tagged.set(key, { tag, services: [] })
      const group = tagged.get(key)!
      if (!group.services.some(item => item.id === service.id)) group.services.push(service)
    }
  }
  return [...tagged.values(), ...(untagged.length ? [{ tag: null, services: untagged }] : [])]
}

function MenuService({ service, grouped }: { service: PublicServiceItem; grouped: boolean }) {
  const { t } = useTranslation()
  const Heading = grouped ? 'h4' : 'h3'
  return (
    <article className={`menu-service${service.description?.trim() ? ' has-description' : ''}`}>
      {service.imageUrl ? <ServiceImage key={service.imageUrl} src={service.imageUrl} name={service.name} /> : null}
      <div className="menu-service-content">
        <div className="menu-service-line">
          <Heading>{service.name}</Heading>
          <span className="menu-price-leader" aria-hidden />
          <span className="menu-price">{service.price != null ? formatPrice(service.price) : t(`${K}.ask_price`)}</span>
        </div>
        {service.description?.trim() ? <p className="menu-description">{service.description}</p> : null}
        {service.durationMinutes > 0 ? (
          <span className="menu-duration">{t(`${K}.duration`, { count: service.durationMinutes })}</span>
        ) : null}
      </div>
    </article>
  )
}

export default function PublicServiceMenuPage() {
  const { businessSlug = '' } = useParams()
  const { t, currentLanguage } = useTranslation()
  const isDesktop = useMediaQuery('(min-width: 800px)')
  const panelIdPrefix = useId()
  const { data, isPending, isError, refetch } = usePublicServices(businessSlug)
  const { data: bookingUrl } = usePublicOneQrBookingLink(businessSlug)
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
      !query || normalizeSearch(`${group.categoryName} ${service.name} ${service.description ?? ''} ${(service.tags ?? []).join(' ')}`).includes(query),
    ) }))
    .filter(group => group.services.length > 0), [categories, category, query])
  const serviceCount = new Set(categories.flatMap(group => group.services.map(service => service.id))).size
  const backPath = `${buildOneQrPath(businessSlug)}?${ONEQR_ROUTE.asQuery}=${ONEQR_ROUTE.asCustomerValue}`
  const showBookingLink = Boolean(bookingUrl && data && !isPending && !isError && serviceCount > 0)
  const showFooterBooking = showBookingLink
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
              {showBookingLink && isDesktop ? (
                <a href={bookingUrl!} className="menu-button menu-search-booking" target="_blank" rel="noopener noreferrer">
                  {t(`${K}.book_appointment`)}
                  <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
                </a>
              ) : null}
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
                  const expanded = expandedCategories[group.key] ?? true
                  const tagGroups = groupServicesByTag(group.services)
                  const hasTags = tagGroups.some(item => item.tag !== null)
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
                              <span className="menu-category-name">{group.categoryName}</span>
                            </span>
                            <ChevronDown className="menu-category-chevron" aria-hidden />
                          </button>
                        </h2>
                      </div>
                      <div id={panelId} hidden={!expanded}>
                        {tagGroups.map(tagGroup => {
                          const title = tagGroup.tag ?? (hasTags ? t(`${K}.other_category`) : undefined)
                          return (
                            <section className="menu-tag-group" key={tagGroup.tag === null ? 'untagged' : `tag:${tagGroup.tag}`} aria-label={title}>
                              {title ? <h3 className="menu-tag-title">{title}</h3> : null}
                              <div className="menu-services">
                                {tagGroup.services.map(service => (
                                  <MenuService key={service.id} service={service} grouped={hasTags} />
                                ))}
                              </div>
                            </section>
                          )
                        })}
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

        <div className={`menu-bottom${showFooterBooking ? ' menu-booking' : ''}`}>
          <div>
            {showFooterBooking ? (
              <>
                <p className="menu-eyebrow">{t(`${K}.booking_eyebrow`)}</p>
                <h2>{t(`${K}.booking_title_lead`)} <em>{t(`${K}.booking_title_accent`)}</em></h2>
              </>
            ) : <h2>{t(`${K}.footer_title`)}</h2>}
          </div>
          <div className="menu-footer-action">
            <p>{t(showFooterBooking ? `${K}.booking_hint` : `${K}.footer_hint`)}</p>
            {showFooterBooking ? (
              <a href={bookingUrl!} className="menu-button" target="_blank" rel="noopener noreferrer">
                {t(`${K}.book_appointment`)}
                <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden />
              </a>
            ) : null}
          </div>
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
