// MyCertificationsView — "My Certifications" from the account menu.
//
// Shared by the merchant dashboard and the staff dashboard: both are accounts with a UserProfile,
// and a certificate is issued to `RecipientUserProfileId` — a person — so either can hold one.
//
// Reached from the avatar dropdown rather than a sidebar on purpose: the three sidebar modules
// (POS, Tips, TaxIQ) are all scoped to a salon, and a certificate is not. Someone with two salons
// would otherwise see the same certificate twice, or lose it when they leave one.
//
// The list endpoint this reads is not deployed yet (see myCertificates.ts), so a member with no
// certificates and a member whose backend has not shipped both land on the same empty state. That
// is deliberate: neither is an error, and neither is worth an error screen.
import { useMemo, useState } from 'react'
import { Award } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useMyCertificates } from '../../data/hooks/useMyCertificates'
import { SkeletonList } from '../ui/skeleton'
import CertificateCanvasPreview from './CertificateCanvasPreview'
import CertificateStatusNote from './CertificateStatusNote'

const K = 'certifications'

export default function MyCertificationsView() {
  const { t } = useTranslation()
  const { data, isLoading } = useMyCertificates()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const certificates = useMemo(() => data ?? [], [data])
  const selected =
    certificates.find((row) => row.certificateId === selectedId) ?? certificates[0] ?? null

  return (
    <div className="space-y-5">
      <header className="space-y-1">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.title`)}</h1>
        <p className="text-xs text-nexoraMuted">{t(`${K}.subtitle`)}</p>
      </header>

      {isLoading ? (
        <SkeletonList count={2} />
      ) : certificates.length === 0 ? (
        <div className="nexora-card space-y-2 p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-nexoraSurfaceMuted text-nexoraMuted">
            <Award className="h-6 w-6" />
          </span>
          <h2 className="text-base font-black text-nexoraText">{t(`${K}.emptyTitle`)}</h2>
          <p className="mx-auto max-w-md text-xs text-nexoraMuted">{t(`${K}.emptyBody`)}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Only worth a picker when there is something to pick between. */}
          {certificates.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {certificates.map((row) => {
                const isActive = row.certificateId === selected?.certificateId
                return (
                  <button
                    key={row.certificateId}
                    type="button"
                    onClick={() => setSelectedId(row.certificateId)}
                    aria-pressed={isActive}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                      isActive
                        ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                        : 'border-nexoraBorder bg-nexoraSurface text-nexoraText hover:bg-nexoraSurfaceMuted'
                    }`}
                  >
                    <span className="block">{row.programName || row.programCode}</span>
                    <span className="block font-normal text-nexoraMuted">{row.certificateId}</span>
                  </button>
                )
              })}
            </div>
          ) : null}

          {selected ? (
            <div className="space-y-3">
              <CertificateStatusNote certificate={selected} />
              <CertificateCanvasPreview certificate={selected} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
