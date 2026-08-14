import PayoutSetupModal from '../../payout/PayoutSetupModal'

export default function PayoutEditModal(props: any) {
  const {
    editingMethod,
    setEditingMethod,
    editValue,
    setEditValue,
    editQrCode,
    setEditQrCode,
    editAccountName,
    setEditAccountName,
    savePayoutAccount,
    setModalError,
    allowQrOnly = false,
  } = props
  if (!editingMethod) return null

  return (
    <PayoutSetupModal
      open={Boolean(editingMethod)}
      walletKey={editingMethod}
      initialValue={editValue || ''}
      initialQrCode={editQrCode || ''}
      initialAccountName={editAccountName || ''}
      onClose={() => {
        setModalError?.('')
        setEditingMethod(null)
      }}
      onSubmit={(value, qrCode, accountName) => {
        setModalError?.('')
        setEditValue?.(value)
        setEditQrCode?.(qrCode)
        setEditAccountName?.(accountName)
        savePayoutAccount?.({ value, qrCode, accountName })
      }}
      allowQrOnly={allowQrOnly}
    />
  )
}
