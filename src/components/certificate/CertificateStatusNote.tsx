// CertificateStatusNote — one line stating that a certificate is no longer good, and since when.
//
// Not a verdict the page adds: `status` is a field of the certificate. The canvas carries the
// stamp, but only this line carries the date, and only this line is readable as text.
import { Ban, Clock } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { CertificateStatus } from '../../constants/certificate'
import { formatDatePart, parseApiUtcDateTime } from '../../utils/localDate'
import { formatCertificateDate } from './certificateCanvas'
import type { CertificateVerificationApiDto } from '../../types/repositories'

const K = 'certifications'

export default function CertificateStatusNote({
  certificate,
}: {
  certificate: CertificateVerificationApiDto
}) {
  const { t, currentLanguage } = useTranslation()

  if (certificate.status === CertificateStatus.Revoked) {
    const revokedOn = parseApiUtcDateTime(certificate.revokedAt)
    return (
      <div className="flex items-center gap-2 rounded-xl border border-nexoraDanger/40 bg-nexoraDanger/10 px-4 py-3 text-nexoraDanger">
        <Ban className="h-4 w-4 shrink-0" />
        <p className="text-xs font-bold">
          {revokedOn
            ? t(`${K}.revokedOn`, {
                // An instant, so it reads in the viewer's own zone — unlike the certificate's
                // printed dates, which are pinned to UTC.
                date: formatDatePart(revokedOn, currentLanguage.toLowerCase().startsWith('vi')),
              })
            : t(`${K}.revoked`)}
        </p>
      </div>
    )
  }

  if (certificate.status === CertificateStatus.Expired) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-nexoraWarning/40 bg-nexoraWarning/10 px-4 py-3 text-nexoraWarning">
        <Clock className="h-4 w-4 shrink-0" />
        <p className="text-xs font-bold">
          {t(`${K}.expiredOn`, { date: formatCertificateDate(certificate.expiryDate) })}
        </p>
      </div>
    )
  }

  return null
}
