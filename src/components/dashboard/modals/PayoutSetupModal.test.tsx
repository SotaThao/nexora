import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import PayoutSetupModal from './PayoutSetupModal'

vi.mock('../../../contexts/LanguageContext', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    currentLanguage: 'en',
  }),
  renderLabel: (label: string) => label,
}))

describe('PayoutSetupModal', () => {
  it('renders save action when open and respects isSaving', () => {
    render(
      <PayoutSetupModal
        open
        walletKey="venmo"
        staffName="Staff User"
        initialValue=""
        initialQrCode=""
        onClose={vi.fn()}
        onSubmit={vi.fn()}
        isSaving
      />,
    )

    const saveButton = screen.getByRole('button', {
      name: 'components.dashboard.modals.PayoutSetupModal.save',
    })

    expect(saveButton).toBeDisabled()
  })
})
