import React from 'react'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import SupportView from '../../src/components/SupportView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

describe('SupportView Component Unit Tests', () => {
  it('renders SupportView header and subtitle', () => {
    render(
      <LanguageProvider>
        <SupportView />
      </LanguageProvider>
    )

    expect(screen.getByRole('heading', { level: 2, name: /Support/i })).toBeInTheDocument()
    expect(
      screen.getByText(/Get assistance with your QR\/NFC terminals or account configuration\./i)
    ).toBeInTheDocument()
  })



  it('toggles FAQ accordion answers on click', () => {
    render(
      <LanguageProvider>
        <SupportView />
      </LanguageProvider>
    )

    const q1Text = 'How to generate QR codes?'
    const a1Text = 'Go to the Touchpoint Manager tab, click "+ Add New Touch Point", enter the station name, and assign a staff member if needed. The QR code is generated instantly and can be printed or simulated.'

    // Check FAQ questions are rendered
    expect(screen.getByText(q1Text)).toBeInTheDocument()
    expect(screen.getByText('How direct tips work?')).toBeInTheDocument()
    expect(screen.getByText('How to set up VLINKPAY Wallet?')).toBeInTheDocument()
    expect(screen.getByText('How to order NFC stands?')).toBeInTheDocument()

    // Answer should not be visible initially
    expect(screen.queryByText(a1Text)).not.toBeInTheDocument()

    // Click to open
    const q1Button = screen.getByRole('button', { name: new RegExp(q1Text.replace('?', '\\?'), 'i') })
    fireEvent.click(q1Button)
    expect(screen.getByText(a1Text)).toBeInTheDocument()

    // Click to close
    fireEvent.click(q1Button)
    expect(screen.queryByText(a1Text)).not.toBeInTheDocument()
  })

  it('validates support form submission, showing errors and success states', () => {
    render(
      <LanguageProvider>
        <SupportView />
      </LanguageProvider>
    )

    const submitBtn = screen.getByRole('button', { name: /Submit Ticket/i })
    const subjectInput = screen.getByPlaceholderText(/e\.g\., NFC Terminal not responding/i)
    const descInput = screen.getByPlaceholderText(/Provide details about the issue you are experiencing\./i)

    // 1. Submit empty form
    fireEvent.click(submitBtn)
    expect(screen.getByText(/Please fill in all fields\./i)).toBeInTheDocument()
    expect(screen.queryByText(/Ticket submitted successfully/i)).not.toBeInTheDocument()

    // 2. Submit with only subject filled
    fireEvent.change(subjectInput, { target: { value: 'NFC device issue' } })
    fireEvent.click(submitBtn)
    expect(screen.getByText(/Please fill in all fields\./i)).toBeInTheDocument()

    // 3. Fill description and submit successfully
    fireEvent.change(descInput, { target: { value: 'The physical NFC stand on table 3 is not directing users correctly.' } })
    fireEvent.click(submitBtn)

    // Error message should disappear, success message should appear
    expect(screen.queryByText(/Please fill in all fields\./i)).not.toBeInTheDocument()
    expect(screen.getByText(/Ticket submitted successfully! Our team will contact you shortly\./i)).toBeInTheDocument()

    // Form inputs should be reset/cleared
    expect(subjectInput.value).toBe('')
    expect(descInput.value).toBe('')
  })
})
