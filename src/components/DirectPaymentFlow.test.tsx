import React from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CreateDirectPaymentResult, PublicDirectPaymentPage } from '../types/domain'
import DirectPaymentFlow from './DirectPaymentFlow'

const { loggerErrorMock, repositoryMocks, showToastMock } = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
  repositoryMocks: {
    confirmPayment: vi.fn(),
    createPayment: vi.fn(),
    getPaymentPage: vi.fn(),
  },
  showToastMock: vi.fn(),
}))

vi.mock('../data/repositories/publicDirectPayment', () => ({
  default: repositoryMocks,
}))

vi.mock('../contexts/NotificationContext', () => ({
  NotificationProvider: ({ children }) => children,
  useNotification: () => ({ showToast: showToastMock }),
}))

vi.mock('../utils/logger', () => ({
  logger: { error: loggerErrorMock },
}))

vi.mock('./customer-flow/steps/WalletDetails', () => ({
  default: ({ activeTipAmount }) => (
    <div data-testid="wallet-details">{activeTipAmount}</div>
  ),
}))

const paymentPage = {
  businessId: 'business-1',
  businessName: 'NailTech',
  logoUrl: null,
  paymentUrl: 'https://example.test/pay/business-1',
  paymentMethods: [
    {
      id: 'zelle-method',
      type: 'Zelle',
      uiKey: 'zelle',
      accountInfo: 'zelle@example.test',
      accountName: 'NailTech',
      imageUrl: 'https://example.test/zelle.png',
    },
    {
      id: 'cashapp-method',
      type: 'CashApp',
      uiKey: 'cashapp',
      accountInfo: '$nailtech',
      accountName: 'NailTech',
      imageUrl: 'https://example.test/cashapp.png',
    },
  ],
} satisfies PublicDirectPaymentPage

const createPaymentResult = {
  paymentId: 'payment-1',
  amount: 24.75,
  type: 0,
  paymentMethod: paymentPage.paymentMethods[0],
} satisfies CreateDirectPaymentResult

function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, reject, resolve }
}

function renderFlow() {
  return render(
    <MemoryRouter initialEntries={['/pay/business-1']}>
      <Routes>
        <Route path="/pay/:businessId" element={<DirectPaymentFlow />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function enterAmountAndSelectZelle() {
  const amountInput = await screen.findByRole('textbox')
  fireEvent.change(amountInput, { target: { value: '25' } })
  const zelleButton = screen.getByRole('button', { name: /Zelle/i })
  const cashAppButton = screen.getByRole('button', { name: /Cash App/i })
  fireEvent.click(zelleButton)
  await waitFor(() => {
    expect(repositoryMocks.createPayment).toHaveBeenCalledWith('business-1', {
      amount: 25,
      businessPaymentMethodId: 'zelle-method',
    })
  })
  return { amountInput, cashAppButton, zelleButton }
}

describe('DirectPaymentFlow wallet creation', () => {
  beforeEach(() => {
    localStorage.clear()
    loggerErrorMock.mockReset()
    showToastMock.mockReset()
    repositoryMocks.confirmPayment.mockReset()
    repositoryMocks.createPayment.mockReset()
    repositoryMocks.getPaymentPage.mockReset()
    repositoryMocks.getPaymentPage.mockResolvedValue(paymentPage)
  })

  it('keeps the review visible, spins only the selected wallet, and disables every wallet while creating', async () => {
    const pendingCreate = createDeferred<CreateDirectPaymentResult>()
    repositoryMocks.createPayment.mockReturnValue(pendingCreate.promise)
    renderFlow()

    const { amountInput, cashAppButton, zelleButton } = await enterAmountAndSelectZelle()

    await waitFor(() => {
      expect(amountInput).toBeDisabled()
      expect(zelleButton).toBeDisabled()
      expect(cashAppButton).toBeDisabled()
      expect(zelleButton.querySelector('.h-4.w-4.animate-spin')).toBeInTheDocument()
    })
    expect(cashAppButton.querySelector('.animate-spin')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.queryByText(/Processing payment connection/i)).not.toBeInTheDocument()
  })

  it('submits create payment only once when the selected wallet is double-clicked', async () => {
    const pendingCreate = createDeferred<CreateDirectPaymentResult>()
    repositoryMocks.createPayment.mockReturnValue(pendingCreate.promise)
    renderFlow()

    const amountInput = await screen.findByRole('textbox')
    fireEvent.change(amountInput, { target: { value: '25' } })
    const zelleButton = screen.getByRole('button', { name: /Zelle/i })
    fireEvent.click(zelleButton)
    fireEvent.click(zelleButton)

    await waitFor(() => expect(repositoryMocks.createPayment).toHaveBeenCalledTimes(1))
  })

  it('locks the amount input and passes the server-confirmed amount to wallet details', async () => {
    const pendingCreate = createDeferred<CreateDirectPaymentResult>()
    repositoryMocks.createPayment.mockReturnValue(pendingCreate.promise)
    renderFlow()

    const { amountInput } = await enterAmountAndSelectZelle()
    await waitFor(() => expect(amountInput).toBeDisabled())
    fireEvent.change(amountInput, { target: { value: '2500' } })

    await act(async () => {
      pendingCreate.resolve(createPaymentResult)
      await pendingCreate.promise
    })

    expect(await screen.findByTestId('wallet-details')).toHaveTextContent('24.75')
  })

  it('falls back to the entered amount when the server response omits amount (normalized to 0)', async () => {
    repositoryMocks.createPayment.mockResolvedValue({
      ...createPaymentResult,
      amount: 0,
    })
    renderFlow()

    await enterAmountAndSelectZelle()

    expect(await screen.findByTestId('wallet-details')).toHaveTextContent('25')
  })

  it('moves to wallet details after the create-payment API succeeds', async () => {
    repositoryMocks.createPayment.mockResolvedValue(createPaymentResult)
    renderFlow()

    await enterAmountAndSelectZelle()

    expect(await screen.findByTestId('wallet-details')).toBeInTheDocument()
  })

  it('stays on review, restores wallet buttons, and preserves the API error toast after failure', async () => {
    const pendingCreate = createDeferred<CreateDirectPaymentResult>()
    repositoryMocks.createPayment.mockReturnValue(pendingCreate.promise)
    renderFlow()

    const { cashAppButton, zelleButton } = await enterAmountAndSelectZelle()
    await waitFor(() => expect(zelleButton).toBeDisabled())

    const createError = Object.assign(new Error('create failed'), {
      errorCode: 'PAYMENT_INVALID_PAYMENT_METHOD',
      status: 400,
    })
    await act(async () => {
      pendingCreate.reject(createError)
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(zelleButton).toBeEnabled()
      expect(cashAppButton).toBeEnabled()
      expect(zelleButton.querySelector('.animate-spin')).not.toBeInTheDocument()
      expect(showToastMock).toHaveBeenCalledWith(
        'The selected payment method is not available. Please choose another method.',
        'error',
      )
    })
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    expect(screen.queryByTestId('wallet-details')).not.toBeInTheDocument()
  })
})
