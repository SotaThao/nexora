import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import SettingsView from '../../src/components/SettingsView'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

describe('SettingsView Component Unit Tests', () => {
  it('renders settings navigation header and tabs correctly', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    // Header title check
    expect(screen.getByText(/Settings Configuration/i)).toBeInTheDocument()

    // Tab buttons check
    expect(screen.getByRole('button', { name: /Profile/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^KYB$/i })).toBeInTheDocument()
  })

  it('renders Profile card details by default', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    // Owner card checks (Username appears multiple times, so use getAllByText)
    expect(screen.getAllByText(/Username/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/goldenglow_owner/i)).toBeInTheDocument()
    expect(screen.getByText(/owner@goldenglownails.com/i)).toBeInTheDocument()
    expect(screen.getAllByText(/VLP-8893-GG/i).length).toBeGreaterThan(0)

    // Basic Information checks
    expect(screen.getByText(/Basic Information/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Elena Rostova/i).length).toBeGreaterThan(0)
  })

  it('renders Payout Methods card and supports inline editing via custom popup modal', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    // Payout methods checks
    expect(screen.getByText(/Payout Methods/i)).toBeInTheDocument()
    expect(screen.getByText(/@goldenglow-spa/i)).toBeInTheDocument()
    expect(screen.getByText(/\$goldenglownails/i)).toBeInTheDocument()

    // Edit Venmo flow
    const editBtn = screen.getByRole('button', { name: /Edit Venmo Payout Account/i })
    fireEvent.click(editBtn)

    const venmoInput = screen.getByPlaceholderText(/Enter Venmo @username\.\.\./i)
    expect(venmoInput).toBeInTheDocument()
    fireEvent.change(venmoInput, { target: { value: '@new-venmo' } })

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    // Check updated value
    expect(screen.getByText(/@new-venmo/i)).toBeInTheDocument()
  })

  it('switches to KYB tab and displays verified status when hasKyb is true', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    const kybTab = screen.getByRole('button', { name: /^KYB$/i })
    fireEvent.click(kybTab)

    expect(screen.getAllByText(/BUSINESS PROFILE VERIFIED/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/Registered Company Dossier/i)).toBeInTheDocument()
    expect(screen.getByText(/Chase Bank, N.A./i)).toBeInTheDocument()
  })

  it('switches to KYB tab and displays VLINKPAY compliance portal when hasKyb is false', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={false} />
      </LanguageProvider>
    )

    const kybTab = screen.getByRole('button', { name: /^KYB$/i })
    fireEvent.click(kybTab)

    expect(screen.getByText(/VLINKPAY PORTAL/i)).toBeInTheDocument()
    expect(screen.getByText(/Merchant Underwriting & Compliance/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Submit KYB/i })).toBeInTheDocument()
  })

  it('enters editing state for basic info and can edit full name', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={false} />
      </LanguageProvider>
    )

    const editBtn = screen.getByRole('button', { name: /Edit Basic Information/i })
    fireEvent.click(editBtn)

    // Verify input fields are rendered
    const input = screen.getByDisplayValue('Elena Rostova')
    expect(input).toBeInTheDocument()

    fireEvent.change(input, { target: { value: 'Elena R.' } })
    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    // Name should be updated (appears in multiple elements, so use getAllByText)
    expect(screen.getAllByText('Elena R.').length).toBeGreaterThan(0)
  })

  it('renders Review Links card and supports editing links', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    // Check defaults are visible
    expect(screen.getByText(/Review Links/i)).toBeInTheDocument()
    expect(screen.getByText(/https:\/\/g\.page\/r\/cGoldenGlowNails\/review/i)).toBeInTheDocument()

    // Edit flow
    const editBtn = screen.getByRole('button', { name: /Edit Review Links/i })
    fireEvent.click(editBtn)

    const googleInput = screen.getByDisplayValue('https://g.page/r/cGoldenGlowNails/review')
    expect(googleInput).toBeInTheDocument()
    fireEvent.change(googleInput, { target: { value: 'https://google.com/new-review-link' } })

    const yelpInput = screen.getByDisplayValue('https://www.yelp.com/biz/golden-glow-nails-palm-beach')
    expect(yelpInput).toBeInTheDocument()
    fireEvent.change(yelpInput, { target: { value: 'https://yelp.com/new-yelp-link' } })

    const saveBtn = screen.getByRole('button', { name: /Save/i })
    fireEvent.click(saveBtn)

    // Check updated values are displayed
    expect(screen.getByText('https://google.com/new-review-link')).toBeInTheDocument()
    expect(screen.getByText('https://yelp.com/new-yelp-link')).toBeInTheDocument()
  })

  it('hides edit buttons for basic info, address details, and business info when hasKyb is true, but keeps review links and payout edit buttons', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    // Hidden edit buttons
    expect(screen.queryByRole('button', { name: /Edit Basic Information/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit Address Details/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Edit Business Information/i })).not.toBeInTheDocument()

    // Shown edit buttons
    expect(screen.getByRole('button', { name: /Edit Review Links/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Edit Venmo Payout Account/i })).toBeInTheDocument()
  })

  it('renders correct status card for kyb_required, kyb_pending, and suspended', () => {
    // 1. Test kyb_required
    const { rerender } = render(
      <LanguageProvider>
        <SettingsView verificationStatus="kyb_required" initialTab="kyb" />
      </LanguageProvider>
    )
    expect(screen.getAllByText(/BUSINESS VERIFICATION REQUIRED/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/You must verify your business to enable card processing/i)).toBeInTheDocument()

    // 2. Test kyb_pending
    rerender(
      <LanguageProvider>
        <SettingsView verificationStatus="kyb_pending" initialTab="kyb" />
      </LanguageProvider>
    )
    expect(screen.getAllByText(/BUSINESS VERIFICATION PENDING/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/VLINKPAY Compliance is reviewing your details/i)).toBeInTheDocument()

    // 3. Test suspended
    rerender(
      <LanguageProvider>
        <SettingsView verificationStatus="suspended" initialTab="kyb" />
      </LanguageProvider>
    )
    expect(screen.getAllByText(/ACCOUNT SUSPENDED/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Please contact support/i)).toBeInTheDocument()
  })

  it('renders legal disclosures section on the KYB tab', () => {
    render(
      <LanguageProvider>
        <SettingsView verificationStatus="basic" initialTab="kyb" />
      </LanguageProvider>
    )

    // Legal disclosures check
    expect(screen.getByText(/Legal Disclosures & Terms/i)).toBeInTheDocument()
    expect(screen.getByText(/IRS Income Reporting/i)).toBeInTheDocument()
    expect(screen.getByText(/Savings Disclaimer/i)).toBeInTheDocument()
  })

  it('supports uploading a QR code and shows the redesigned payout edit modal features', () => {
    render(
      <LanguageProvider>
        <SettingsView hasKyb={true} />
      </LanguageProvider>
    )

    // Edit Venmo flow
    const editBtn = screen.getByRole('button', { name: /Edit Venmo Payout Account/i })
    fireEvent.click(editBtn)

    // Verify warning alert is present
    expect(screen.getByText(/Please enter the correct receiving account information/i)).toBeInTheDocument()

    // Verify TAKE PHOTO and CHOOSE FILE options are visible
    expect(screen.getByRole('button', { name: /TAKE PHOTO/i })).toBeInTheDocument()
    expect(screen.getByText(/CHOOSE FILE/i)).toBeInTheDocument()
  })
})
