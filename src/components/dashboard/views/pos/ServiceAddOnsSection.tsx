// ServiceAddOnsSection — the add-on list of ONE service, inside the Edit Service modal.
//
// Add-ons are owned per service, never shared: two services that both offer paraffin hold two
// independent rows with independent prices. "Copy from another service" is a one-time duplication
// so a ~90-item menu is not typed out by hand — editing either copy afterwards leaves the other
// untouched.
//
// Unlike the service fields around it, every action here persists immediately rather than waiting
// for the modal's Save: each add-on has its own endpoint, and batching them into the service form
// would mean holding a second draft state that can silently diverge from the server.
import { useState, type KeyboardEvent } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorMessage } from '../../../../data/errorCodes'
import {
  useCopyServiceAddOns,
  useCreateServiceAddOn,
  useDeleteServiceAddOn,
  useServiceAddOnCopySources,
  useServiceAddOns,
  useUpdateServiceAddOn,
} from '../../../../data/hooks/usePosServices'
import type { ServiceAddOnApiDto } from '../../../../types/repositories'
import { TOAST_SNACK_DURATION_MS } from '../../../../constants/toast'

const K = 'components.dashboard.views.pos.PosServicesView'

export default function ServiceAddOnsSection({ serviceId }: { serviceId: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const { data: addOns = [], isLoading } = useServiceAddOns(serviceId)
  const { data: copySources = [] } = useServiceAddOnCopySources(serviceId)
  const createAddOn = useCreateServiceAddOn()
  const updateAddOn = useUpdateServiceAddOn()
  const deleteAddOn = useDeleteServiceAddOn()
  const copyAddOns = useCopyServiceAddOns()

  const [nameDraft, setNameDraft] = useState('')
  const [priceDraft, setPriceDraft] = useState('')
  const [copySourceId, setCopySourceId] = useState('')
  // One row at a time: a name change can be rejected as a duplicate, so the row has to stay open
  // to show the error against the value the owner typed.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNameDraft, setEditNameDraft] = useState('')
  const [editPriceDraft, setEditPriceDraft] = useState('')

  // httpClient rejects with a plain ApiError object, never an Error instance — stringifying it
  // directly renders "[object Object]" instead of the rule that was actually broken.
  const reportError = (err: unknown) => {
    showToast(getErrorMessage(err, t, 'ERROR'), 'error')
  }

  // Price may be 0 — a comped extra still records the work the technician performed — so the guard
  // is on the field being filled in, not on it being above zero.
  const parsedPrice = Number(priceDraft)
  const canAdd = nameDraft.trim().length > 0 && priceDraft.trim().length > 0 && parsedPrice >= 0

  const handleAdd = () => {
    if (!canAdd || createAddOn.isPending) return
    createAddOn.mutate(
      { serviceId, input: { name: nameDraft.trim(), price: parsedPrice } },
      {
        onSuccess: () => {
          setNameDraft('')
          setPriceDraft('')
        },
        onError: reportError,
      },
    )
  }

  const handleToggleActive = (addOn: ServiceAddOnApiDto) => {
    updateAddOn.mutate(
      {
        serviceId,
        addOnId: addOn.id,
        input: {
          name: addOn.name,
          price: addOn.price,
          displayOrder: addOn.displayOrder,
          isActive: !addOn.isActive,
        },
      },
      { onError: reportError },
    )
  }

  const handleDelete = (addOn: ServiceAddOnApiDto) => {
    deleteAddOn.mutate({ serviceId, addOnId: addOn.id }, { onError: reportError })
  }

  const handleStartEdit = (addOn: ServiceAddOnApiDto) => {
    setEditingId(addOn.id)
    setEditNameDraft(addOn.name)
    setEditPriceDraft(String(addOn.price))
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditNameDraft('')
    setEditPriceDraft('')
  }

  // Same zero-is-legitimate rule as adding: the guard is on the field being filled in.
  const editParsedPrice = Number(editPriceDraft)
  const canSaveEdit =
    editNameDraft.trim().length > 0 && editPriceDraft.trim().length > 0 && editParsedPrice >= 0

  // A new price applies to future sales only — a sold add-on snapshots its price on the order line,
  // so renaming or repricing never rewrites history and stays allowed after the first sale.
  const handleSaveEdit = (addOn: ServiceAddOnApiDto) => {
    if (!canSaveEdit || updateAddOn.isPending) return
    updateAddOn.mutate(
      {
        serviceId,
        addOnId: addOn.id,
        input: {
          name: editNameDraft.trim(),
          price: editParsedPrice,
          displayOrder: addOn.displayOrder,
          isActive: addOn.isActive,
        },
      },
      { onSuccess: handleCancelEdit, onError: reportError },
    )
  }

  const handleCopy = () => {
    if (!copySourceId || copyAddOns.isPending) return
    // Read before the mutation clears the selection — the "nothing copied" message names the source.
    const sourceName = copySources.find((source) => source.id === copySourceId)?.name ?? ''
    copyAddOns.mutate(
      { serviceId, sourceServiceId: copySourceId },
      {
        onSuccess: (copiedCount) => {
          setCopySourceId('')
          // The picker only offers services that own add-ons, so nothing copied means every name
          // was already here. "0 copied" reads like a failure the owner has to go diagnose.
          if (copiedCount === 0) {
            showToast(t(`${K}.addOnCopyAllDuplicates`, { name: sourceName }), 'info', TOAST_SNACK_DURATION_MS)
            return
          }
          showToast(t(`${K}.addOnCopyResult`, { count: copiedCount }), 'success', TOAST_SNACK_DURATION_MS)
        },
        onError: reportError,
      },
    )
  }

  // Every field here sits inside the parent service <form>, so an unhandled Enter triggers that
  // form's implicit submission — the service saves, the modal closes and the add-on being typed is
  // lost. Enter must run this section's own action instead.
  const submitOnEnter = (action: () => void) => (e: KeyboardEvent) => {
    if (e.key !== 'Enter') return
    e.preventDefault()
    action()
  }

  return (
    <div className="space-y-2 rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3">
      <div>
        <p className="text-xs font-bold text-nexoraText">{t(`${K}.addOnsSectionTitle`)}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-nexoraMuted">{t(`${K}.addOnsSectionHint`)}</p>
      </div>

      {isLoading ? (
        <p className="py-3 text-center text-[11px] text-nexoraMuted">{t('common.loading')}</p>
      ) : addOns.length === 0 ? (
        <p className="py-3 text-center text-[11px] text-nexoraMuted">{t(`${K}.addOnsEmpty`)}</p>
      ) : (
        <ul className="space-y-1.5">
          {addOns.map((addOn) => (
            <li
              key={addOn.id}
              data-testid={`service-add-on-${addOn.id}`}
              className="flex items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 py-2"
            >
              {editingId === addOn.id ? (
                <>
                  <input
                    type="text"
                    autoFocus
                    value={editNameDraft}
                    onChange={(e) => setEditNameDraft(e.target.value)}
                    onKeyDown={submitOnEnter(() => handleSaveEdit(addOn))}
                    maxLength={200}
                    placeholder={t(`${K}.addOnNamePlaceholder`)}
                    data-testid={`edit-add-on-name-${addOn.id}`}
                    className="h-8 min-w-0 flex-1 rounded-lg border border-nexoraBorder bg-white px-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    value={editPriceDraft}
                    onChange={(e) => setEditPriceDraft(e.target.value)}
                    onKeyDown={submitOnEnter(() => handleSaveEdit(addOn))}
                    placeholder={t(`${K}.addOnPricePlaceholder`)}
                    data-testid={`edit-add-on-price-${addOn.id}`}
                    className="h-8 w-20 shrink-0 rounded-lg border border-nexoraBorder bg-white px-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                  />
                  <button
                    type="button"
                    disabled={!canSaveEdit || updateAddOn.isPending}
                    onClick={() => handleSaveEdit(addOn)}
                    data-testid={`save-add-on-${addOn.id}`}
                    className="shrink-0 rounded-lg bg-nexoraBrand px-2.5 py-1 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                  >
                    {updateAddOn.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      t(`${K}.save`)
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="shrink-0 rounded-lg px-2 py-1 text-[10px] font-bold text-nexoraMuted hover:bg-slate-50"
                  >
                    {t(`${K}.cancel`)}
                  </button>
                </>
              ) : (
                <>
                  <span
                    className={`min-w-0 flex-1 truncate text-xs font-bold ${
                      addOn.isActive ? 'text-nexoraText' : 'text-nexoraMuted line-through'
                    }`}
                  >
                    {addOn.name}
                  </span>
                  <span className="shrink-0 text-xs font-bold text-nexoraText">${addOn.price.toFixed(2)}</span>
                  <label className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-nexoraMuted">
                    <input
                      type="checkbox"
                      checked={addOn.isActive}
                      onChange={() => handleToggleActive(addOn)}
                      className="h-3.5 w-3.5 rounded border-nexoraBorder"
                    />
                    {t(`${K}.activeLabel`)}
                  </label>
                  {/* Renaming/repricing stays open even after a sale — the order line kept its own
                      snapshot of the name and price it was sold at. */}
                  <button
                    type="button"
                    aria-label={t(`${K}.addOnEditLabel`)}
                    title={t(`${K}.addOnEditLabel`)}
                    onClick={() => handleStartEdit(addOn)}
                    data-testid={`edit-add-on-${addOn.id}`}
                    className="shrink-0 rounded p-1 text-nexoraMuted hover:bg-slate-100 hover:text-nexoraBrand"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  {/* A sold add-on can only be deactivated — order history resolves its name here. */}
                  <button
                    type="button"
                    disabled={!addOn.canDelete}
                    title={addOn.canDelete ? undefined : t(`${K}.addOnDeleteBlocked`)}
                    onClick={() => handleDelete(addOn)}
                    className="shrink-0 rounded p-1 text-rose-500 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_auto]">
        <input
          type="text"
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          onKeyDown={submitOnEnter(handleAdd)}
          maxLength={200}
          placeholder={t(`${K}.addOnNamePlaceholder`)}
          className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          value={priceDraft}
          onChange={(e) => setPriceDraft(e.target.value)}
          onKeyDown={submitOnEnter(handleAdd)}
          placeholder={t(`${K}.addOnPricePlaceholder`)}
          className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd || createAddOn.isPending}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-[10px] font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
        >
          {createAddOn.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          {t(`${K}.addOnAddButton`)}
        </button>
      </div>

      {copySources.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <select
            value={copySourceId}
            onChange={(e) => setCopySourceId(e.target.value)}
            onKeyDown={submitOnEnter(handleCopy)}
            className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          >
            <option value="">{t(`${K}.addOnCopyPlaceholder`)}</option>
            {copySources.map((source) => (
              <option key={source.id} value={source.id}>
                {t(`${K}.addOnCopyOptionLabel`, { name: source.name, count: source.addOnCount })}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!copySourceId || copyAddOns.isPending}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-4 text-[10px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
          >
            {copyAddOns.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {t(`${K}.addOnCopyButton`)}
          </button>
        </div>
      ) : null}
    </div>
  )
}
