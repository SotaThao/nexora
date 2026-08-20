// Shown when the server refuses the tablet's token — revoked from the dashboard, signed out on
// the device, or expired after long inactivity.
//
// Deliberately a dead end with no retry button: every one of those causes is permanent until
// somebody re-pairs the tablet, and a retry would just fail again while suggesting otherwise.
import { ShieldOff } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'

const K = 'components.posDevice.PosDeviceRevokedPage'

export default function PosDeviceRevokedPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-nexoraCanvas p-6">
      <div className="w-full max-w-md rounded-xl border border-nexoraBorder bg-nexoraSurface p-6 text-center">
        <ShieldOff className="mx-auto h-10 w-10 text-nexoraDanger" />
        <h1 className="mt-3 text-2xl font-bold leading-tight text-nexoraText">{t(`${K}.title`)}</h1>
        <p className="mt-2 text-sm font-medium text-nexoraMuted">{t(`${K}.body`)}</p>
      </div>
    </div>
  )
}
