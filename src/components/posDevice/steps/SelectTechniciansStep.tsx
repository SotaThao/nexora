// Step 4 — who does each service.
//
// Every line starts on First Available and stays there unless the customer taps to change it. The
// null that carries is not a gap to be filled in silently: a customer picking "anyone" cannot know
// who is mid-service or whose turn it is, so a person on the floor decides.
import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import KioskTechnicianDrawer, { initialsOf } from './KioskTechnicianDrawer'
import type { SelfCheckInServiceApiDto } from '../../../types/repositories'

const K = 'components.posDevice.SelfCheckInFlow'

export interface TechnicianChoice {
  posStaffProfileId: string | null
  displayName: string | null
}

export default function SelectTechniciansStep({
  services,
  choices,
  isSubmitting,
  errorMessage,
  onChoose,
  onBack,
  onSubmit,
}: {
  services: SelfCheckInServiceApiDto[]
  choices: Record<string, TechnicianChoice>
  isSubmitting: boolean
  errorMessage: string | null
  onChoose: (serviceId: string, choice: TechnicianChoice) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const [openServiceId, setOpenServiceId] = useState<string | null>(null)
  const openService = services.find((s) => s.id === openServiceId)

  return (
    <div className="mx-auto w-full max-w-md space-y-4 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6">
      <div className="text-center">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.techniciansTitle`)}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t(`${K}.techniciansSubtitle`)}</p>
      </div>

      <div className="space-y-2">
        {services.map((service) => {
          const choice = choices[service.id]
          const staffName = choice?.displayName ?? null
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => setOpenServiceId(service.id)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-nexoraBorder p-3 text-left hover:border-nexoraBrand"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-nexoraText">{service.name}</span>
                <span className="block truncate text-xs text-nexoraMuted">
                  {staffName ?? t(`${K}.firstAvailable`)}
                </span>
              </span>
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-xs font-bold text-nexoraText">
                {staffName ? initialsOf(staffName) : '⚡'}
              </span>
            </button>
          )
        })}
      </div>

      {errorMessage ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-nexoraDanger">{errorMessage}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-14 flex-1 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
        >
          {t(`${K}.back`)}
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="flex h-14 flex-[2] items-center justify-center gap-2 rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {t(`${K}.submit`)}
        </button>
      </div>

      {openService ? (
        <KioskTechnicianDrawer
          serviceId={openService.id}
          serviceName={openService.name}
          selectedStaffId={choices[openService.id]?.posStaffProfileId ?? null}
          onSelect={(posStaffProfileId, displayName) =>
            onChoose(openService.id, { posStaffProfileId, displayName })
          }
          onClose={() => setOpenServiceId(null)}
        />
      ) : null}
    </div>
  )
}
