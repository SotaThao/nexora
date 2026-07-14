import { useRef, useState } from 'react'
import { Copy, Edit2, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useCancelMerchantPayout,
  useDeleteMerchantPayout,
  useUpdateMerchantPayout,
} from '../../../data/hooks/useMerchantPayouts'
import { MAX_PAYOUT_EVIDENCE_URLS, PayoutStatus } from '../../../data/payoutConstants'
import { imagesRepository } from '../../../data/repositories/images'
import type { PayoutRecord } from '../../../types/domain'
import { getApiErrorCode } from '../../../types/domain'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import Tooltip from '../../ui/Tooltip'
import {
  formatPayoutPeriodRange,
  getPayoutStatusDescI18nKey,
  getPayoutTypeI18nKeys,
  isPayoutEditable,
  staffInitials,
} from '../../../utils/payoutDisplay'
import PayoutMethodBadge from './PayoutMethodBadge'
import PayoutStatusBadge from './PayoutStatusBadge'

const MAX_EVIDENCE_FILES = 3
const EVIDENCE_IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.bmp', '.svg'])

function isEvidenceImageFile(file: File): boolean {
  if (file.type?.startsWith('image/')) return true
  const name = file.name?.toLowerCase() ?? ''
  const dot = name.lastIndexOf('.')
  if (dot < 0) return false
  return EVIDENCE_IMAGE_EXTENSIONS.has(name.slice(dot))
}

export default function PayoutDetailModal({
  payout,
  isLoading,
  onClose,
  onEdit,
}: {
  payout: PayoutRecord | null
  isLoading?: boolean
  onClose: () => void
  onEdit: (payout: PayoutRecord) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const deleteMutation = useDeleteMerchantPayout()
  const cancelMutation = useCancelMerchantPayout()
  const updateMutation = useUpdateMerchantPayout()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false)

  const canManage = payout ? isPayoutEditable(payout.status) : false
  const isCompleted = payout?.status === PayoutStatus.Confirmed
  const maxEvidenceCount = Math.min(MAX_EVIDENCE_FILES, MAX_PAYOUT_EVIDENCE_URLS)
  const currentEvidenceCount = payout?.evidenceUrls?.length ?? 0
  const canUploadEvidence = Boolean(isCompleted && currentEvidenceCount < maxEvidenceCount)
  const isBusy = deleteMutation.isPending || cancelMutation.isPending || isUploadingEvidence || updateMutation.isPending

  if (!payout && !isLoading) return null

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      showToast(t('common.copied'), 'success')
    } catch {
      showToast(t('errors.unknown_error'), 'error')
    }
  }

  const handleDelete = async () => {
    if (!payout || !canManage) return
    const payoutId = payout.id
    const ok = await showConfirm(
      t('dashboard.tips.payouts_manager.delete_confirm'),
      t('dashboard.tips.payouts_manager.delete_confirm_title'),
    )
    if (!ok) return
    onClose()
    try {
      await deleteMutation.mutateAsync(payoutId)
      showToast(t('dashboard.tips.payouts_manager.delete_success'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const handleCancel = async () => {
    if (!payout || !canManage) return
    const ok = await showConfirm(
      t('dashboard.tips.payouts_manager.cancel_confirm'),
      t('dashboard.tips.payouts_manager.cancel_confirm_title'),
    )
    if (!ok) return
    try {
      await cancelMutation.mutateAsync(payout.id)
      showToast(t('dashboard.tips.payouts_manager.cancel_success'), 'success')
      onClose()
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    }
  }

  const openEvidencePicker = () => {
    if (!canUploadEvidence || isBusy) return
    fileInputRef.current?.click()
  }

  const handleEvidenceFiles = async (files: FileList | File[]) => {
    if (!payout || !canUploadEvidence) return

    const picked = Array.from(files)
    if (!picked.length) return

    const validFiles = picked.filter(isEvidenceImageFile)
    if (!validFiles.length) {
      showToast(t('dashboard.tips.payouts_manager.evidence_image_only'), 'error')
      return
    }
    if (validFiles.length < picked.length) {
      showToast(t('dashboard.tips.payouts_manager.evidence_image_only'), 'error')
    }

    const remaining = maxEvidenceCount - currentEvidenceCount
    if (remaining <= 0) {
      showToast(t('dashboard.tips.payouts_manager.evidence_max', { max: maxEvidenceCount }), 'error')
      return
    }

    const uploads = validFiles.slice(0, remaining)
    setIsUploadingEvidence(true)
    try {
      const uploadedUrls: string[] = []
      for (const file of uploads) {
        uploadedUrls.push(await imagesRepository.uploadAndGetUrl(file))
      }
      const evidenceUrls = [...(payout.evidenceUrls ?? []), ...uploadedUrls]
      await updateMutation.mutateAsync({
        payoutId: payout.id,
        payload: {
          payoutMethodType: payout.payoutMethodType,
          payoutTypes: payout.payoutTypes,
          periodStart: payout.periodStart,
          periodEnd: payout.periodEnd,
          evidenceUrls,
          notes: payout.notes ?? null,
        },
      })
      showToast(t('dashboard.tips.payouts_manager.evidence_upload_success'), 'success')
    } catch (err) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')
    } finally {
      setIsUploadingEvidence(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-nexoraBorder bg-white shadow-2xl sm:rounded-2xl">
        <div className="flex items-start justify-between border-b border-nexoraBorder px-5 py-4">
          <div>
            <h3 className="text-base font-black text-inkBlue">{t('dashboard.tips.payouts_manager.detail_title')}</h3>
            <p className="mt-1 text-xs text-mutedGrey">{t('dashboard.tips.payouts_manager.detail_sub')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-nexoraBorder p-2 text-mutedGrey hover:bg-slate-50">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-nexoraBrand" />
          </div>
        ) : payout ? (
          <div className="space-y-5 px-5 py-4">
            <div className="rounded-xl bg-gradient-to-br from-nexoraBrand/10 to-violet-100 px-4 py-6 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-mutedGrey">
                {t('dashboard.tips.payouts_manager.field_amount')}
              </p>
              <p className="mt-1 text-3xl font-black text-inkBlue">{formatCurrency(payout.amount)}</p>
              <div className="mt-3 flex flex-col items-center gap-1.5">
                <PayoutStatusBadge status={payout.status} />
                <p className="max-w-xs text-center text-[11px] text-mutedGrey">
                  {t(getPayoutStatusDescI18nKey(payout.status))}
                </p>
              </div>
            </div>

            <dl className="grid grid-cols-[120px_1fr] gap-x-4 gap-y-3 text-sm">
              <dt className="inline-flex items-center gap-1 font-semibold text-mutedGrey">
                {t('dashboard.tips.payouts_manager.col_code')}
                <Tooltip
                  content={t('dashboard.tips.payouts_manager.col_code_tooltip')}
                  ariaLabel={t('dashboard.tips.payouts_manager.col_code_tooltip')}
                  align="start"
                  placement="bottom"
                />
              </dt>
              <dd className="flex items-center gap-1.5">
                <span className="font-mono text-sm font-bold text-nexoraBrand">{payout.payoutCode}</span>
                {payout.payoutCode ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(payout.payoutCode)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-nexoraBorder text-mutedGrey transition hover:bg-slate-50 hover:text-nexoraBrand"
                    aria-label={t('dashboard.tips.payouts_manager.copy_payout_code')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </dd>

              <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.col_date')}</dt>
              <dd className="font-semibold text-inkBlue">
                {formatTransactionDateTime(payout.createdAt, currentLanguage)}
              </dd>

              <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.field_method')}</dt>
              <dd><PayoutMethodBadge method={payout.payoutMethodType} /></dd>

              <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.col_staff')}</dt>
              <dd className="flex items-center gap-2 font-semibold text-inkBlue">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-nexoraBrand text-[10px] font-black text-white">
                  {staffInitials(payout.staffDisplayName)}
                </span>
                {payout.staffDisplayName}
              </dd>

              <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.staff_code')}</dt>
              <dd><span className="rounded-md border border-nexoraBorder bg-slate-50 px-2 py-0.5 text-xs font-bold">{payout.staffCode}</span></dd>

              <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.col_types')}</dt>
              <dd className="flex flex-wrap gap-1">
                {getPayoutTypeI18nKeys(payout.payoutTypes).map((key) => (
                  <span key={key} className="rounded-md border border-nexoraBorder bg-slate-50 px-2 py-0.5 text-[10px] font-bold">
                    {t(key)}
                  </span>
                ))}
              </dd>

              <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.col_period')}</dt>
              <dd className="font-semibold text-inkBlue">
                {formatPayoutPeriodRange(payout.periodStart, payout.periodEnd, currentLanguage)}
              </dd>

              {payout.notes ? (
                <>
                  <dt className="font-semibold text-mutedGrey">{t('dashboard.tips.payouts_manager.field_notes')}</dt>
                  <dd className="italic text-mutedGrey">{payout.notes}</dd>
                </>
              ) : null}
            </dl>

            {payout.evidenceUrls.length > 0 || canUploadEvidence ? (
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wide text-mutedGrey">
                  {t('dashboard.tips.payouts_manager.evidence_title')}
                  {payout.evidenceUrls.length > 0
                    ? ` (${payout.evidenceCount || payout.evidenceUrls.length})`
                    : ''}
                </p>
                {payout.evidenceUrls.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {payout.evidenceUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block overflow-hidden rounded-lg border border-nexoraBorder"
                      >
                        <img src={url} alt="" className="h-20 w-28 object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-mutedGrey">
                    {t('dashboard.tips.payouts_manager.evidence_none')}
                  </p>
                )}
              </div>
            ) : null}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={!canUploadEvidence || isBusy}
              onChange={(e) => {
                if (e.target.files) void handleEvidenceFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>
        ) : null}

        {payout && canManage ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-nexoraBorder px-5 py-4">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleDelete}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('common.delete')}
            </button>
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isBusy}
                onClick={handleCancel}
                className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-bold disabled:opacity-60"
              >
                {t('dashboard.tips.payouts_manager.action_cancel')}
              </button>
              <button
                type="button"
                disabled={isBusy}
                onClick={() => onEdit(payout)}
                className="inline-flex items-center gap-1 rounded-lg bg-nexoraBrand px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                <Edit2 className="h-3.5 w-3.5" />
                {t('common.edit')}
              </button>
            </div>
          </div>
        ) : null}

        {payout && canUploadEvidence ? (
          <div className="border-t border-nexoraBorder px-5 py-4">
            <button
              type="button"
              disabled={isBusy}
              onClick={openEvidencePicker}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t('dashboard.tips.payouts_manager.action_upload_evidence')}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
