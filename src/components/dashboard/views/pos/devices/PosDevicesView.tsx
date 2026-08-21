// PosDevicesView — POS > Check-In Devices. Pair a tablet by showing a rotating QR, then manage
// every tablet already paired: rename, replace its Access PIN, or cut its access.
//
// Reaching this screen requires the manage_checkin_devices permission, enforced server-side. The
// menu entry is hidden for anyone without it, but the API is the real gate.
import { useMemo, useState } from 'react'
import { Loader2, Pencil, ShieldOff } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import {
  usePosDevices,
  useRevokePosDevice,
  useUpdatePosDevice,
} from '../../../../../data/hooks/usePosDevices'
import type { PosDeviceStatusFilter } from '../../../../../data/repositories/posDevices'
import type { PosDeviceListItemApiDto } from '../../../../../types/repositories'
import { SkeletonList } from '../../../../ui/skeleton'
import PosDevicePairingQrPanel from './PosDevicePairingQrPanel'
import EditPosDeviceModal from './EditPosDeviceModal'
import { formatPosDateTime } from '../posDateTime'

const K = 'components.dashboard.views.pos.devices.PosDevicesView'

const STATUS_FILTERS: PosDeviceStatusFilter[] = ['All', 'Active', 'Revoked', 'Expired']

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-nexoraBrand/10 text-nexoraBrand',
  Revoked: 'bg-red-50 text-nexoraDanger',
  Expired: 'bg-nexoraCanvas text-nexoraMuted',
}

// The full UA string is unreadable in a table cell; the leading product token is what actually
// tells two tablets apart.
function shortenUserAgent(userAgent?: string | null): string {
  if (!userAgent) return '—'
  const firstToken = userAgent.split(' ')[0]
  return firstToken.length > 28 ? `${firstToken.slice(0, 28)}…` : firstToken
}

export default function PosDevicesView({ businessId }: { businessId: string }) {
  const { t, currentLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  const [statusFilter, setStatusFilter] = useState<PosDeviceStatusFilter>('All')
  const [editing, setEditing] = useState<PosDeviceListItemApiDto | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)

  const { data: devices = [], isLoading } = usePosDevices(businessId, statusFilter)
  const updateDevice = useUpdatePosDevice(businessId)
  const revokeDevice = useRevokePosDevice(businessId)

  const activeCount = useMemo(() => devices.filter((d) => d.status === 'Active').length, [devices])

  const handleSave = async (payload: { name?: string; pin?: string }) => {
    if (!editing) return
    try {
      await updateDevice.mutateAsync({ deviceId: editing.id, ...payload })
      showToast(t(`${K}.savedSuccess`), 'success')
      setEditing(null)
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleRevoke = async (device: PosDeviceListItemApiDto) => {
    // Names the device in the prompt on purpose — "are you sure?" on a list of near-identical
    // iPads is how the wrong one gets cut off.
    const confirmed = await showConfirm(
      t(`${K}.revokeConfirm`, { name: device.name }),
      t(`${K}.revokeConfirmTitle`),
    )
    if (!confirmed) return
    setRevokingId(device.id)
    try {
      await revokeDevice.mutateAsync(device.id)
      showToast(t(`${K}.revokedSuccess`), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    } finally {
      setRevokingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1 px-0.5">
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">
          {t('dashboard.menu.pos_devices')}
        </h1>
        <p className="text-sm font-medium text-nexoraMuted">{t(`${K}.description`)}</p>
      </section>

      <PosDevicePairingQrPanel businessId={businessId} />

      <section className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-nexoraText">
            {t(`${K}.listTitle`, { count: activeCount })}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  statusFilter === filter
                    ? 'bg-nexoraBrand text-white'
                    : 'bg-nexoraCanvas text-nexoraMuted hover:bg-nexoraBorder/40'
                }`}
              >
                {t(`${K}.filter${filter}`)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <SkeletonList count={3} lines={1} />
        ) : devices.length === 0 ? (
          <p className="py-6 text-center text-xs text-nexoraMuted">{t(`${K}.empty`)}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-nexoraBorder uppercase tracking-wide text-nexoraMuted">
                  <th className="py-2 pr-3 text-xs font-black">{t(`${K}.colName`)}</th>
                  <th className="py-2 pr-3 text-xs font-black">{t(`${K}.colStatus`)}</th>
                  <th className="py-2 pr-3 text-xs font-black">{t(`${K}.colPairedBy`)}</th>
                  <th className="py-2 pr-3 text-xs font-black">{t(`${K}.colPairedAt`)}</th>
                  <th className="py-2 pr-3 text-xs font-black">{t(`${K}.colLastSeen`)}</th>
                  <th className="py-2 pr-3 text-xs font-black">{t(`${K}.colDevice`)}</th>
                  <th className="py-2 text-right text-xs font-black">{t(`${K}.colActions`)}</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => {
                  const isActive = device.status === 'Active'
                  return (
                    <tr
                      key={device.id}
                      className={`border-b border-nexoraBorder/60 last:border-0 ${
                        isActive ? '' : 'opacity-60'
                      }`}
                    >
                      <td className="py-2.5 pr-3 text-sm font-bold text-nexoraText">{device.name}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                            STATUS_STYLES[device.status] ?? STATUS_STYLES.Expired
                          }`}
                        >
                          {t(`${K}.status${device.status}`)}
                        </span>
                        {device.signedOutOnDevice && (
                          <span className="ml-1.5 text-[10px] text-nexoraMuted">
                            {t(`${K}.signedOutOnDevice`)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-nexoraMuted">
                        {device.pairedByName ?? '—'}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-nexoraMuted">
                        {formatPosDateTime(device.pairedAt, currentLanguage)}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-nexoraMuted">
                        {formatPosDateTime(device.lastSeenAt, currentLanguage)}
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-nexoraMuted">
                        {shortenUserAgent(device.userAgent)}
                      </td>
                      <td className="py-2.5 text-right">
                        {/* Revoked and Expired are terminal — nothing left to act on, and the row
                            stays only as history of who authorised what. */}
                        {isActive ? (
                          <div className="inline-flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditing(device)}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-nexoraBorder px-2.5 text-[11px] font-bold text-nexoraMuted hover:bg-nexoraCanvas"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {t(`${K}.edit`)}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevoke(device)}
                              disabled={revokingId === device.id}
                              className="inline-flex h-9 items-center gap-1 rounded-lg border border-nexoraDanger/40 px-2.5 text-[11px] font-bold text-nexoraDanger hover:bg-red-50 disabled:opacity-50"
                            >
                              {revokingId === device.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <ShieldOff className="h-3.5 w-3.5" />
                              )}
                              {t(`${K}.revoke`)}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-nexoraMuted">
                            {formatPosDateTime(device.revokedAt ?? device.expiredAt, currentLanguage)}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <EditPosDeviceModal
        open={editing !== null}
        currentName={editing?.name ?? ''}
        onClose={() => setEditing(null)}
        onSubmit={handleSave}
        isSubmitting={updateDevice.isPending}
      />
    </div>
  )
}
