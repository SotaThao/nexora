import React, { useState, useEffect } from 'react'
import {
  Plus,
  Trash2,
  Download,
  Check,
  X,
  Tablet,
  QrCode,
  AlertTriangle,
  FileSpreadsheet,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'

function Panel({ children, className = '' }) {
  return (
    <section className={`bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 rounded-flox-cards shadow-premium ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-flox-buttons h-11 w-11 text-nexoraSubtle hover:text-nexoraText dark:hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-nexoraBrand/50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

export default function DevicesView({
  devices = [],
  onAddDevice,
  onDeleteDevice,
  onToggleDeviceStatus,
  highlightedDeviceId
}) {
  const { t } = useTranslation()

  // State for Add Device Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newDeviceId, setNewDeviceId] = useState('')
  const [newType, setNewType] = useState('NFC Stand')
  const [newLocation, setNewLocation] = useState('')
  const [validationError, setValidationError] = useState('')

  // State for Delete Confirm Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  // State for Export Toast
  const [showExportToast, setShowExportToast] = useState(false)

  // Scroll to highlighted device card when selected
  useEffect(() => {
    if (highlightedDeviceId) {
      const element = document.getElementById(`device-card-${highlightedDeviceId}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [highlightedDeviceId])

  // Handle Add Device Submit
  const handleAddSubmit = (e) => {
    e.preventDefault()
    if (!newDeviceId.trim()) {
      setValidationError('Device ID is required')
      return
    }
    if (!newLocation.trim()) {
      setValidationError('Location is required')
      return
    }

    if (onAddDevice) {
      onAddDevice({
        deviceId: newDeviceId.trim(),
        type: newType,
        location: newLocation.trim()
      })
    }

    // Reset and Close
    setNewDeviceId('')
    setNewType('NFC Stand')
    setNewLocation('')
    setValidationError('')
    setIsAddModalOpen(false)
  }

  // Handle Export Click
  const handleExport = () => {
    setShowExportToast(true)
    setTimeout(() => {
      setShowExportToast(false)
    }, 2500)
  }

  // Calculate Hardware KPIs
  const qrDevicesCount = devices.filter((d) => d.type.toUpperCase().includes('QR')).length
  const nfcDevicesCount = devices.filter((d) => d.type.toUpperCase().includes('NFC')).length
  const activeNfcCount = devices.filter((d) => d.type.toUpperCase().includes('NFC') && d.isActive).length
  const deviceIssuesCount = devices.filter((d) => !d.isActive).length

  return (
    <div className="space-y-6 relative">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.qr_nfc') || 'QR / NFC Devices'}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">
            {t('dashboard.devices.subtitle') || 'Manage physical salon stands, tabletop codes, and smart taps.'}
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-flox-buttons border border-nexoraBorder bg-white dark:bg-luxuryCoal px-4 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition-all"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>{t('common.export') || 'Export'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-11 min-w-[44px] items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand dark:bg-luxuryGold hover:bg-nexoraBrandDark dark:hover:bg-luxuryGoldLight text-white dark:text-luxuryBlack px-4 text-xs font-bold transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{t('dashboard.devices.add_btn') || 'Add New Device'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: QR Devices */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-nexoraBrand relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.devices.kpi.qr_devices') || 'QR Devices'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{qrDevicesCount}</p>
          </div>
          <div className="p-2.5 bg-nexoraBrandSoft dark:bg-nexoraBrand/10 text-nexoraBrand rounded-flox-buttons">
            <QrCode className="h-5 w-5" />
          </div>
        </Panel>

        {/* KPI 2: NFC Devices */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-luxuryGold relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.devices.kpi.nfc_devices') || 'NFC Devices'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{nfcDevicesCount}</p>
          </div>
          <div className="p-2.5 bg-amber-50 dark:bg-luxuryGold/10 text-luxuryGold rounded-flox-buttons">
            <Tablet className="h-5 w-5" />
          </div>
        </Panel>

        {/* KPI 3: Active NFC */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500 relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.devices.kpi.active_nfc') || 'Active NFC'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{activeNfcCount}</p>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-flox-buttons">
            <Check className="h-5 w-5" />
          </div>
        </Panel>

        {/* KPI 4: Device Issues */}
        <Panel className="p-4 flex items-center justify-between border-l-4 border-l-nexoraDanger relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.devices.kpi.device_issues') || 'Device Issues'}
            </p>
            <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{deviceIssuesCount}</p>
          </div>
          <div className="p-2.5 bg-rose-50 dark:bg-nexoraDanger/10 text-nexoraDanger rounded-flox-buttons">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </Panel>
      </div>

      {/* Devices Responsive Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((device) => {
          const isActive = device.isActive !== false
          const isHighlighted = device.deviceId === highlightedDeviceId
          return (
            <Panel
              key={device.id}
              id={`device-card-${device.deviceId}`}
              className={`p-4 flex flex-col justify-between hover:shadow-premium transition-all duration-500 border relative overflow-hidden min-h-[170px] ${
                isHighlighted
                  ? 'border-luxuryGold ring-2 ring-luxuryGold bg-luxuryGold/5 dark:bg-luxuryGold/5 scale-[1.03] animate-highlight shadow-premium'
                  : 'border-nexoraBorder dark:border-luxuryGold/18'
              }`}
            >
              {/* Active Color Strip */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 transition-colors ${
                  isHighlighted 
                    ? 'bg-luxuryGold'
                    : isActive 
                      ? 'bg-gradient-to-r from-nexoraBrand to-floxElectricViolet' 
                      : 'bg-nexoraBorder'
                }`}
              />

              {/* Card Top Section: ID & Delete */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-sm text-nexoraText flex items-center gap-1.5">
                    <span className="font-mono bg-nexoraSurfaceMuted px-2 py-0.5 rounded border border-nexoraBorder text-xs text-nexoraText">
                      {device.deviceId}
                    </span>
                  </h3>
                  <p className="text-[11px] text-nexoraSubtle mt-1.5">
                    {t('dashboard.devices.location') || 'Location'}: <span className="font-bold text-nexoraText">{device.location}</span>
                  </p>
                </div>
                <IconButton
                  label={t('common.delete') || 'Delete'}
                  onClick={() => setDeleteConfirmId(device.id)}
                  className="text-nexoraDanger hover:opacity-85 hover:bg-nexoraDanger/10 h-9 w-9 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </IconButton>
              </div>

              {/* Card Middle: Type and Status Toggle */}
              <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-nexoraRule">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-flox-badges bg-luxuryGold/15 text-luxuryGold">
                  {device.type}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleDeviceStatus && onToggleDeviceStatus(device.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-nexoraBrand' : 'bg-nexoraBorder'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isActive ? 'text-nexoraSuccess' : 'text-nexoraSubtle'}`}>
                    {isActive ? t('common.active') || 'Active' : t('common.inactive') || 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Card Bottom: Scans & Last Scan Info */}
              <div className="flex items-center justify-between gap-4 mt-3 pt-3 border-t border-nexoraRule text-[11px] text-nexoraMuted">
                <div>
                  {t('dashboard.devices.scans') || 'Scans'}: <span className="font-black text-nexoraText">{device.scans || 0}</span>
                </div>
                <div>
                  {t('dashboard.devices.last_scan') || 'Last Scan'}: <span className="font-black text-nexoraText">{device.lastScan || 'N/A'}</span>
                </div>
              </div>
            </Panel>
          )
        })}
      </div>

      {/* Mock Add Device Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp space-y-4"
          >
            <div className="flex items-center justify-between border-b border-nexoraRule pb-3">
              <h3 className="text-base font-extrabold text-nexoraText">
                {t('dashboard.devices.add_modal_title') || 'Register QR / NFC Hardware'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setValidationError('')
                }}
                className="text-nexoraSubtle hover:text-nexoraText p-1.5 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-nexoraDanger/10 border border-nexoraDanger/20 text-nexoraDanger text-xs font-semibold rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Device ID Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.devices.id_label') || 'Device ID / Serial (Required)'}
                </label>
                <input
                  type="text"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  placeholder="e.g. NFC-003, QR-Table-04"
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand"
                />
              </div>

              {/* Device Type Select */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.devices.type_label') || 'Device Hardware Type'}
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand"
                >
                  <option value="NFC Stand">NFC Stand</option>
                  <option value="QR Card">QR Card</option>
                  <option value="NFC Sticker">NFC Sticker</option>
                </select>
              </div>

              {/* Location Input */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.devices.location_label') || 'Location Placement (Required)'}
                </label>
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Table 04, Mirror 05, Front Counter"
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 border-t border-nexoraRule pt-4 mt-5">
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false)
                  setValidationError('')
                }}
                className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition min-h-[44px]"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                className="rounded-lg bg-nexoraBrand dark:bg-luxuryGold text-white dark:text-luxuryBlack px-4 py-2 text-xs font-bold hover:opacity-90 transition min-h-[44px]"
              >
                {t('common.confirm') || 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-base font-extrabold text-nexoraText">
              {t('dashboard.touchpoint_stats.delete_confirm_title') || 'Confirm Delete'}
            </h3>
            <p className="mt-2.5 text-xs text-nexoraMuted leading-normal">
              {t('dashboard.devices.delete_confirm') || 'Are you sure you want to unregister this device? This will unlink it from active scans.'}
            </p>
            <div className="mt-5 flex justify-end gap-2 border-t border-nexoraRule pt-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted hover:bg-nexoraSurfaceMuted transition min-h-[44px]"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={() => {
                  if (onDeleteDevice) {
                    onDeleteDevice(deleteConfirmId)
                  }
                  setDeleteConfirmId(null)
                }}
                className="rounded-lg bg-nexoraDanger px-4 py-2 text-xs font-bold text-white hover:bg-nexoraDanger/90 transition min-h-[44px]"
              >
                {t('common.delete') || 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Success Toast Notification */}
      {showExportToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-nexoraSidebar text-white px-5 py-3 shadow-premium animate-slideIn">
          <Check className="h-4 w-4 text-nexoraSuccess" />
          <span className="text-xs font-bold">
            {t('dashboard.devices.export_success') || 'Device directory successfully exported to spreadsheet!'}
          </span>
        </div>
      )}
    </div>
  )
}
