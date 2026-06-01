import React, { useState } from 'react'
import {
  Plus,
  Trash2,
  QrCode,
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  Check,
  X,
  Smartphone,
  Layers,
  Activity,
  AlertOctagon
} from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import CustomSelect from './CustomSelect'
import DevicesView from './DevicesView'

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

export default function TouchpointsView({
  touchpoints = [],
  onAdd,
  onDelete,
  onQr,
  onToggleStatus,
  onLinkDevice,
  transactions = [],
  businessName = '',
  devices = [],
  onAddDevice,
  onDeleteDevice,
  onToggleDeviceStatus,
  activeSubTab: propActiveSubTab,
  onTabChange
}) {
  const { t } = useTranslation()
  const [localActiveSubTab, setLocalActiveSubTab] = useState('stations') // 'stations' or 'devices'
  const activeSubTab = propActiveSubTab !== undefined ? propActiveSubTab : localActiveSubTab
  const setActiveSubTab = onTabChange !== undefined ? onTabChange : setLocalActiveSubTab
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  
  // Local state for the Add Touchpoint form
  const [name, setName] = useState('')
  const [type, setType] = useState('Table QR')
  const [deviceId, setDeviceId] = useState('')

  // Local state for Linking Devices
  const [linkingPointId, setLinkingPointId] = useState(null)
  const [linkInputVal, setLinkInputVal] = useState('')

  const handleAdd = () => {
    if (!name.trim()) return
    if (onAdd) {
      onAdd(name.trim(), type, deviceId.trim())
    }
    setName('')
    setDeviceId('')
  }

  const handleStartLink = (point) => {
    setLinkingPointId(point.id)
    setLinkInputVal(point.deviceId || '')
  }

  const handleSaveLink = (pointId) => {
    if (onLinkDevice) {
      onLinkDevice(pointId, linkInputVal.trim())
    }
    setLinkingPointId(null)
    setLinkInputVal('')
  }

  // Calculate dynamic Hardware KPIs
  const totalTouchpoints = touchpoints.length

  const activeNfcStands = touchpoints.filter(
    (point) =>
      point.deviceId &&
      point.deviceId.trim().toUpperCase().startsWith('NFC') &&
      point.isActive !== false
  ).length

  const totalScans = touchpoints.reduce((sum, point) => sum + (point.scans || 0), 0)

  const deviceIssues = touchpoints.filter(
    (point) => point.deviceId && point.isActive === false
  ).length || 1

  return (
    <div className="space-y-6">
      {/* Tab Header & Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-nexoraBorder pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">
            {t('dashboard.menu.touchpoints')}
          </h2>
          <p className="mt-1 text-xs text-nexoraMuted">
            {t('setup.qr_touchpoints_desc')}
          </p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-1 bg-nexoraSurfaceMuted dark:bg-luxuryCoal p-1 rounded-xl border border-nexoraBorder dark:border-luxuryGold/10">
          {[
            { id: 'stations', label: t('dashboard.touchpoints.tabs.stations') || 'Điểm Chạm QR' },
            { id: 'devices', label: t('dashboard.touchpoints.tabs.devices') || 'Thiết Bị Vật Lý' }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`h-9 rounded-lg px-4 text-xs font-bold transition-all min-w-[44px] ${
                activeSubTab === tab.id
                  ? 'bg-white dark:bg-luxuryBlack text-luxuryGold shadow-sm font-black'
                  : 'text-nexoraMuted hover:text-nexoraText dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeSubTab === 'stations' && (
        <>
          {/* Hardware KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Total Touchpoints */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-nexoraBrand relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.total_touchpoints') || 'Total Touchpoints'}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{totalTouchpoints}</p>
              </div>
              <div className="p-2.5 bg-nexoraBrandSoft dark:bg-nexoraBrand/10 text-nexoraBrand rounded-flox-buttons">
                <Layers className="h-5 w-5" />
              </div>
            </Panel>

            {/* KPI 2: Active physical NFC Stands */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-luxuryGold relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.active_nfc') || 'Active NFC Stands'}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{activeNfcStands}</p>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-luxuryGold/10 text-luxuryGold rounded-flox-buttons">
                <Smartphone className="h-5 w-5" />
              </div>
            </Panel>

            {/* KPI 3: Total Scans */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-emerald-500 relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.total_scans') || 'Total Scans'}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{totalScans}</p>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500 rounded-flox-buttons">
                <Activity className="h-5 w-5" />
              </div>
            </Panel>

            {/* KPI 4: Device Issues */}
            <Panel className="p-4 flex items-center justify-between border-l-4 border-l-red-500 relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.touchpoint_stats.device_issues') || 'Device Issues'}
                </p>
                <p className="text-2xl font-black text-nexoraText font-mono tracking-tight">{deviceIssues}</p>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-500/10 text-red-500 rounded-flox-buttons">
                <AlertOctagon className="h-5 w-5" />
              </div>
            </Panel>
          </div>

          {/* Add Touchpoint Form Panel */}
          <Panel className="p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1fr_180px_auto] items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.modals.tp_name_label') || 'Touch Point Name'}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('dashboard.modals.tp_name_placeholder') || 'e.g. Manicure Chair 05'}
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand dark:focus:border-luxuryGold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.modals.device_id_label') || 'Hardware Serial / Device ID (Optional)'}
                </label>
                <input
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="e.g. NFC-105, QR-Table-01"
                  className="h-11 w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-3 text-base text-nexoraText outline-none focus:border-nexoraBrand dark:focus:border-luxuryGold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
                  {t('dashboard.modals.tp_type_label') || 'Station Type'}
                </label>
                <CustomSelect
                  buttonClass="h-11 text-sm focus:border-nexoraBrand dark:focus:border-luxuryGold"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  options={[
                    { value: 'Table QR', label: 'Table QR' },
                    { value: 'Front Desk', label: 'Front Desk' },
                    { value: 'Receipt QR', label: 'Receipt QR' },
                    { value: 'Business Main', label: 'Business Main' },
                    { value: 'Staff QR', label: 'Staff QR' }
                  ]}
                />
              </div>

              <button
                onClick={handleAdd}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand dark:bg-luxuryGold hover:bg-nexoraBrandDark dark:hover:bg-luxuryGoldLight text-white dark:text-luxuryBlack px-5 text-sm font-bold transition-all w-full lg:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span>{t('setup.add_tp_btn')}</span>
              </button>
            </div>
          </Panel>

          {/* Touchpoint Cards Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {touchpoints.map((point) => {
              const isPointActive = point.isActive !== false
              const qrUrl = `${window.location.origin}${window.location.pathname}?tech=tp/${point.id}&biz=${encodeURIComponent(businessName)}`
              
              // Calculate dynamic revenue
              const revenue = transactions
                .filter((tx) => tx.status === 'Success' && (tx.touchpoint === point.name || tx.touchpoint === point.id))
                .reduce((sum, tx) => sum + (tx.amount || 0), 0)

              return (
                <Panel key={point.id} className="p-3.5 flex gap-4 hover:shadow-premium transition-all duration-300 group border border-nexoraBorder relative overflow-hidden min-h-[160px]">
                  {/* Subtle top decoration strip */}
                  <div className={`absolute top-0 left-0 right-0 h-1 transition-colors ${isPointActive ? 'bg-gradient-to-r from-nexoraBrand to-floxElectricViolet' : 'bg-nexoraBorder'}`} />
                  
                  {/* Left Column: QR Code Box */}
                  <div 
                    onClick={() => isPointActive && onQr && onQr(point)}
                    className="relative w-[115px] h-[115px] rounded-xl bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-sm cursor-pointer hover:border-nexoraBrand transition-all hover:scale-[1.03] active:scale-95 group/qr select-none overflow-hidden shrink-0 self-center"
                    title={t('dashboard.modals.download_print_qr')}
                  >
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
                      alt="Scan QR"
                      className={`h-full w-full object-contain transition-opacity duration-200 ${isPointActive ? 'opacity-100' : 'opacity-30 filter grayscale'}`}
                    />
                    {!isPointActive && (
                      <div className="absolute inset-0 bg-luxuryBlack/60 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider p-1 text-center">
                        <ShieldAlert className="h-4 w-4 text-luxuryAmber mb-0.5 animate-pulse" />
                        <span>Disabled</span>
                      </div>
                    )}
                    {isPointActive && (
                      <div className="absolute inset-0 bg-nexoraBrand/80 opacity-0 group-hover/qr:opacity-100 flex flex-col items-center justify-center text-white text-[9px] font-black uppercase tracking-wider transition-opacity p-1 text-center gap-1 select-none">
                        <QrCode className="h-5 w-5" />
                        <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Details */}
                  <div className="flex-grow flex flex-col justify-between min-w-0 py-0.5">
                    {/* Top Section: Title & Delete Button */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-nexoraText leading-snug truncate" title={point.name}>
                          {point.name}
                        </h3>
                        <IconButton 
                          label={t('common.delete')} 
                          onClick={() => setDeleteConfirmId(point.id)} 
                          className="text-nexoraDanger hover:opacity-85 hover:bg-nexoraDanger/10 p-1 rounded transition shrink-0 h-9 w-9"
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                      <p className="text-[9.5px] font-mono text-nexoraSubtle select-all truncate">
                        nexora.vlinkpay.com/touch/{point.id}
                      </p>
                    </div>
     
                    {/* Middle Section: Active / Inactive Toggle */}
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => onToggleStatus && onToggleStatus(point.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isPointActive ? 'bg-nexoraBrand' : 'bg-nexoraBorder'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isPointActive ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isPointActive ? 'text-nexoraSuccess' : 'text-nexoraSubtle'}`}>
                        {isPointActive ? t('dashboard.touchpoint_stats.active') || 'Active' : t('dashboard.touchpoint_stats.inactive') || 'Inactive'}
                      </span>
                    </div>

                    {/* Linked Hardware Display & Link Device Action */}
                    <div className="mt-2 pt-2 border-t border-nexoraRule dark:border-white/5 space-y-1">
                      {linkingPointId === point.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={linkInputVal}
                            onChange={(e) => setLinkInputVal(e.target.value)}
                            placeholder="Device ID (e.g. NFC-105)"
                            className="h-9 flex-grow rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-2 text-base text-nexoraText outline-none focus:border-nexoraBrand"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveLink(point.id)}
                            className="h-9 w-9 flex items-center justify-center rounded-flox-buttons bg-nexoraSuccess text-white hover:bg-nexoraSuccess/90 active:scale-95 shrink-0"
                            title="Confirm"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setLinkingPointId(null)}
                            className="h-9 w-9 flex items-center justify-center rounded-flox-buttons bg-nexoraRule dark:bg-white/10 text-nexoraMuted dark:text-nexoraSubtle hover:bg-nexoraBorder dark:hover:bg-white/20 active:scale-95 shrink-0"
                            title="Cancel"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-1 min-h-[44px]">
                          <div className="text-[10px] font-bold text-nexoraMuted truncate">
                            <span>HW: </span>
                            {point.deviceId ? (
                              <span className="px-1.5 py-0.5 rounded-flox-badges bg-luxuryGold/15 text-luxuryGold font-mono text-[9.5px]">
                                {point.deviceId}
                              </span>
                            ) : (
                              <span className="text-nexoraSubtle italic text-[9.5px]">
                                Only Paper QR / Chỉ dùng QR in giấy
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleStartLink(point)}
                            className="h-11 px-2.5 text-[10px] font-black uppercase tracking-wider text-nexoraBrand dark:text-luxuryGold hover:underline focus:outline-none flex items-center justify-center shrink-0"
                          >
                            {point.deviceId ? 'Edit Link' : 'Link Device'}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Section: Compact Metrics */}
                    <div className="mt-2 pt-2 border-t border-nexoraRule dark:border-white/5 flex items-center justify-between text-[11px] font-bold text-nexoraMuted">
                      <div>
                        {t('dashboard.touchpoint_stats.scans') || 'Scans'}: <span className="font-black text-nexoraText">{point.scans || 0}</span>
                      </div>
                      <div>
                        {t('dashboard.touchpoint_stats.revenue') || 'Revenue'}: <span className="font-black text-nexoraSuccess">${revenue.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </Panel>
              )
            })}
          </div>

          {/* Custom Delete Confirmation Modal */}
          {deleteConfirmId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
                <h3 className="text-base font-extrabold text-nexoraText">
                  {t('dashboard.touchpoint_stats.delete_confirm_title') || 'Confirm Delete'}
                </h3>
                <p className="mt-2.5 text-xs text-nexoraMuted leading-normal">
                  {t('dashboard.touchpoint_stats.delete_confirm') || 'Are you sure you want to delete this touch point? This action cannot be undone.'}
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
                      if (onDelete) {
                        onDelete(deleteConfirmId)
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
        </>
      )}

      {activeSubTab === 'devices' && (
        <DevicesView
          devices={devices}
          onAddDevice={onAddDevice}
          onDeleteDevice={onDeleteDevice}
          onToggleDeviceStatus={onToggleDeviceStatus}
        />
      )}
    </div>
  )
}
