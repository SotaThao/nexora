import { Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import type { StaffBusinessLink } from '../../../types/domain'
import {
  formatSalonLocation,
  formatSalonTimeline,
  getSalonAvatarClass,
  getSalonDisplayStatus,
  getSalonInitials,
  sortSalonBusinesses,
} from '../utils/staffSalonDisplay'
import { resolveStaffBusinessLinkStatusLabel } from '../../../utils/staffBusinessLinkStatus'

function SalonCard({
  business,
  index,
  currentLanguage,
  t,
  onOpen,
}: {
  business: StaffBusinessLink
  index: number
  currentLanguage: string
  t: (key: string, params?: Record<string, unknown>) => string
  onOpen: () => void
}) {
  const statusLabel = resolveStaffBusinessLinkStatusLabel(business)
  const status = getSalonDisplayStatus(business, t)
  const timeline = formatSalonTimeline(business, statusLabel, t, currentLanguage)
  const location = formatSalonLocation(business)
  const initials = business.logoUrl ? null : getSalonInitials(business.businessName)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full gap-3 rounded-2xl border border-nexoraBorder/80 bg-white p-4 text-left shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md active:scale-[0.99]"
    >
      {business.logoUrl ? (
        <img
          src={business.logoUrl}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-full text-xs font-extrabold ${getSalonAvatarClass(index)}`}
        >
          {initials}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-sm font-extrabold uppercase tracking-wide text-nexoraText">
            {business.businessName}
          </h3>
          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${status.className}`}>
            {status.label}
          </span>
        </div>
        <p className="truncate text-xs font-medium text-nexoraMuted">{location}</p>
        {timeline ? (
          <p className="pt-0.5 text-right text-[11px] font-semibold text-nexoraMuted">{timeline}</p>
        ) : null}
      </div>
    </button>
  )
}

export default function StaffMySalons() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const { data: businesses = [], isPending, isFetching } = useStaffBusinesses()
  const salons = sortSalonBusinesses(businesses)
  const isLoading = isPending || isFetching

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('staff_salons.title')}</h2>
        <p className="mt-1 text-xs leading-relaxed text-nexoraMuted">{t('staff_salons.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
        </div>
      ) : salons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-nexoraBorder bg-white px-4 py-12 text-center">
          <p className="text-sm font-semibold text-nexoraText">{t('staff_salons.empty_title')}</p>
          <p className="mt-1 text-xs text-nexoraMuted">{t('staff_dashboard.qr.no_linked_businesses')}</p>
          <button
            type="button"
            onClick={() => navigate('/staff/qr?tab=tipping')}
            className="mt-4 inline-flex h-9 items-center justify-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white"
          >
            {t('staff_salons.link_salon_cta')}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {salons.map((business, index) => (
            <SalonCard
              key={business.businessId}
              business={business}
              index={index}
              currentLanguage={currentLanguage}
              t={t}
              onOpen={() => navigate('/staff/qr?tab=tipping')}
            />
          ))}
        </div>
      )}
    </div>
  )
}
