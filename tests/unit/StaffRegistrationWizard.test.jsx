import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import StaffRegistrationWizard from '../../src/components/StaffRegistrationWizard'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

describe('StaffRegistrationWizard Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    
    // Set up a mock merchant configuration in localStorage/sessionStorage to simulate linking
    const mockSetup = {
      businessInfo: { name: 'Golden Glow Nail Spa' },
      staffList: [],
      touchPoints: []
    }
    localStorage.setItem('nexora_merchant_setup', JSON.stringify(mockSetup))
    sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(mockSetup))
  })

  const mockInvite = {
    id: '',
    name: 'Lisa Tran',
    email: 'lisa@example.com',
    phone: '408-555-2345',
    role: 'Nail Technician',
    biz: 'Golden Glow Nail Spa'
  }

  it('navigates through the entire 5-step registration process successfully', () => {
    const handleReturn = vi.fn()
    
    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={mockInvite} onReturnToMerchant={handleReturn} />
      </LanguageProvider>
    )

    // Step 0: Welcome Invite page
    expect(screen.getAllByText('Golden Glow Nail Spa').length).toBeGreaterThan(0)
    expect(screen.getByText('Lisa Tran')).toBeInTheDocument()
    
    const acceptBtn = screen.getByRole('button', { name: /Accept Invite/i })
    fireEvent.click(acceptBtn)

    // Step 1: Register Account
    expect(screen.getByText(/Register Account/i)).toBeInTheDocument()
    
    // Verify Referral Link is prefilled and disabled/read-only
    const referralInput = screen.getByPlaceholderText('e.g. nexora-salon-link')
    expect(referralInput).toBeDisabled()
    expect(referralInput).toHaveValue('Golden Glow Nail Spa')

    // Fill password (Email & Confirm Email are prefilled)
    const passwordInput = screen.getByPlaceholderText('••••••••')
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit registration to transition to OTP stage
    const continueBtn = screen.getByRole('button', { name: /Continue|Next/i })
    fireEvent.click(continueBtn)
    
    // Step 1 - Stage B: Verify OTP
    expect(screen.getByText(/Activate Account/i)).toBeInTheDocument()
    
    // Try typing wrong OTP
    const otpInput = screen.getByPlaceholderText('e.g. 1234')
    fireEvent.change(otpInput, { target: { value: '9999' } })
    
    const verifyBtn = screen.getByRole('button', { name: /Verify & Activate/i })
    fireEvent.click(verifyBtn)
    expect(screen.getByText(/Invalid code/i)).toBeInTheDocument()
    
    // Use Simulator Helper auto fill
    const autofillBtn = screen.getByRole('button', { name: /Auto-fill/i })
    fireEvent.click(autofillBtn)
    fireEvent.click(verifyBtn)

    // Step 2: Profile Setup
    expect(screen.getByText(/Personal Profile/i)).toBeInTheDocument()
    
    // Profile name pre-filled
    const nameInput = screen.getByPlaceholderText('Lisa Marie Tran')
    expect(nameInput.value).toBe('Lisa Tran')

    // Click next
    const nextToPaymentsBtn = screen.getByRole('button', { name: /Next/i })
    fireEvent.click(nextToPaymentsBtn)

    // Step 3: Payments Setup
    expect(screen.getByText(/Payout Configurations/i)).toBeInTheDocument()
    
    // Auto fill payment mock handles
    const autofillPaymentsBtn = screen.getByRole('button', { name: /Auto-Fill Mock Handles/i })
    fireEvent.click(autofillPaymentsBtn)

    // Verify that the filled mock handles are displayed in the list
    expect(screen.getAllByText('lisa@example.com')[0]).toBeInTheDocument()
    expect(screen.getByText('$lisanails')).toBeInTheDocument()
    expect(screen.getByText('@lisa-nails')).toBeInTheDocument()

    // Test editing a method using the modal popup
    const editVenmoBtn = screen.getByRole('button', { name: /Edit Venmo Payout Account/i })
    fireEvent.click(editVenmoBtn)
    
    const venmoInput = screen.getByPlaceholderText(/@username-venmo/i)
    fireEvent.change(venmoInput, { target: { value: '@new-lisa-nails' } })
    fireEvent.click(screen.getByRole('button', { name: /^Save$/i }))

    expect(screen.getByText('@new-lisa-nails')).toBeInTheDocument()

    const activateBtn = screen.getByRole('button', { name: /Save & Activate/i })
    fireEvent.click(activateBtn)

    // Step 5: Success & Redirection
    expect(screen.getByText(/Join Request Submitted!/i)).toBeInTheDocument()
    
    // Check linked salons list displays the business
    expect(screen.getByText('Linked Businesses')).toBeInTheDocument()

    // Click return to merchant dashboard
    const returnBtn = screen.getByRole('button', { name: /Return to Merchant Dashboard/i })
    fireEvent.click(returnBtn)

    expect(handleReturn).toHaveBeenCalledOnce()

    // Verify localStorage has been updated with the new pending thợ
    const savedSetup = JSON.parse(localStorage.getItem('nexora_merchant_setup'))
    expect(savedSetup.staffList.length).toBeGreaterThan(0)
    const activeStaff = savedSetup.staffList.find(s => s.fullName === 'Lisa Tran')
    expect(activeStaff).toBeDefined()
    expect(activeStaff.status).toBe('Pending Acceptance')
    expect(activeStaff.isActive).toBe(false)
    expect(activeStaff.paymentAccounts.zelle).toBe('lisa@example.com')
  })

  it('links an existing VLINKPAY profile successfully (Option A)', () => {
    const handleReturn = vi.fn()
    const generalInvite = { biz: 'Golden Glow Nail Spa' } // No name -> isSelfServe

    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={generalInvite} onReturnToMerchant={handleReturn} />
      </LanguageProvider>
    )

    // Option selection page should show
    expect(screen.getByText('I already have a Profile')).toBeInTheDocument()

    // Click "I already have a Profile"
    fireEvent.click(screen.getByText('I already have a Profile'))

    // Lookup input should display
    expect(screen.getByPlaceholderText('e.g. NEX-STAFF-LISA1102')).toBeInTheDocument()

    // Type recognized Staff ID
    const input = screen.getByPlaceholderText('e.g. NEX-STAFF-LISA1102')
    fireEvent.change(input, { target: { value: 'NEX-STAFF-LISA1102' } })

    // Click verify
    fireEvent.click(screen.getByRole('button', { name: /Verify/i }))

    // Preview details of Lisa Tran should be shown
    expect(screen.getAllByText('Lisa Tran').length).toBeGreaterThan(0)
    expect(screen.getByText(/Nail Tech • \(408\) 555-2345/i)).toBeInTheDocument()

    // Click Accept & Link
    const acceptBtn = screen.getByRole('button', { name: /Accept & Link with Salon/i })
    fireEvent.click(acceptBtn)

    // Success step should display
    expect(screen.getByText('Join Request Submitted!')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()

    // Verify localStorage has been updated with status Pending Acceptance
    const savedSetup = JSON.parse(localStorage.getItem('nexora_merchant_setup'))
    expect(savedSetup.staffList.length).toBeGreaterThan(0)
    const linkedStaff = savedSetup.staffList.find(s => s.id === 'NEX-STAFF-LISA1102')
    expect(linkedStaff).toBeDefined()
    expect(linkedStaff.status).toBe('Pending Acceptance')
    expect(linkedStaff.isActive).toBe(false)
    expect(linkedStaff.flowType).toBe('Link Existing Staff ID')
  })

  it('registers a new self-serve profile as pending acceptance successfully (Option B)', () => {
    const handleReturn = vi.fn()
    const generalInvite = { biz: 'Golden Glow Nail Spa' }

    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={generalInvite} onReturnToMerchant={handleReturn} />
      </LanguageProvider>
    )

    // Click "I am a new Technician"
    fireEvent.click(screen.getByText('I am a new Technician'))

    // Step 1: Register Account
    expect(screen.getByText(/Register Account/i)).toBeInTheDocument()
    
    // Fill register details
    const emailInputs = screen.getAllByPlaceholderText('e.g. name@example.com')
    fireEvent.change(emailInputs[0], { target: { value: 'new.staff@example.com' } })
    fireEvent.change(emailInputs[1], { target: { value: 'new.staff@example.com' } })
    
    const passwordInputReg = screen.getByPlaceholderText('••••••••')
    fireEvent.change(passwordInputReg, { target: { value: 'password123' } })
    
    // Submit registration to transition to OTP stage
    fireEvent.click(screen.getByRole('button', { name: /Continue|Next/i }))
    
    // Step 1 - Stage B: Verify OTP
    expect(screen.getByText(/Activate Account/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Auto-fill/i }))
    fireEvent.click(screen.getByRole('button', { name: /Verify & Activate/i }))

    // Step 2: Profile Setup
    expect(screen.getByText(/Personal Profile/i)).toBeInTheDocument()
    
    // Fill out inputs (Phone/Email are enabled in self-serve!)
    const nameInput = screen.getByPlaceholderText('Lisa Marie Tran')
    fireEvent.change(nameInput, { target: { value: 'New Staff Member' } })

    const phoneInput = screen.getByPlaceholderText('e.g. 408-555-1234')
    fireEvent.change(phoneInput, { target: { value: '408-111-2222' } })

    const emailInput = screen.getByPlaceholderText('e.g. name@example.com')
    fireEvent.change(emailInput, { target: { value: 'new.staff@example.com' } })

    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 3: Payments
    expect(screen.getByText(/Payout Configurations/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Save & Activate/i }))

    // Step 5: Success
    expect(screen.getByText('Join Request Submitted!')).toBeInTheDocument()
    expect(screen.getByText('PENDING')).toBeInTheDocument()

    // Verify localStorage has been updated with status Pending Acceptance
    const savedSetup = JSON.parse(localStorage.getItem('nexora_merchant_setup'))
    const registeredStaff = savedSetup.staffList.find(s => s.fullName === 'New Staff Member')
    expect(registeredStaff).toBeDefined()
    expect(registeredStaff.status).toBe('Pending Acceptance')
    expect(registeredStaff.isActive).toBe(false)
  })

  it('allows editing Referral Link field when inviteData or biz is not provided', () => {
    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={null} onReturnToMerchant={vi.fn()} />
      </LanguageProvider>
    )

    // Select "I am a new Technician"
    fireEvent.click(screen.getByText('I am a new Technician'))

    // Step 1: Register Account
    const referralInput = screen.getByPlaceholderText('e.g. nexora-salon-link')
    expect(referralInput).toBeEnabled()
    expect(referralInput).toHaveValue('')

    // Can edit referral link
    fireEvent.change(referralInput, { target: { value: 'custom-salon-referral' } })
    expect(referralInput).toHaveValue('custom-salon-referral')
  })

  it('updates temporary merchant-assigned ID "1" to a valid Staff Code format and re-maps touchpoints', () => {
    // 1. Setup mock setup in localStorage with a temporary ID '1' and a matching touchpoint
    const mockSetup = {
      businessInfo: { name: 'Golden Glow Nail Spa' },
      staffList: [
        {
          id: '1',
          fullName: 'Lisa Tran',
          nickname: 'Lisa T.',
          position: 'Nail Technician',
          email: 'lisa@example.com',
          phone: '408-555-2345',
          status: 'Pending Setup',
          isActive: false
        }
      ],
      touchPoints: [
        {
          id: 'tp-staff-1',
          name: 'Personal QR - Lisa T.',
          type: 'Staff QR',
          staffId: '1',
          staffName: 'Lisa T.'
        }
      ]
    }
    localStorage.setItem('nexora_merchant_setup', JSON.stringify(mockSetup))
    sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(mockSetup))

    const testInvite = {
      id: '1',
      name: 'Lisa Tran',
      email: 'lisa@example.com',
      phone: '408-555-2345',
      role: 'Nail Technician',
      biz: 'Golden Glow Nail Spa'
    }

    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={testInvite} onReturnToMerchant={vi.fn()} />
      </LanguageProvider>
    )

    // Step 0: Welcome
    fireEvent.click(screen.getByRole('button', { name: /Accept Invite/i }))

    // Step 1: Register (fill password)
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue|Next/i }))

    // Step 1 - Stage B: OTP
    fireEvent.click(screen.getByRole('button', { name: /Auto-fill/i }))
    fireEvent.click(screen.getByRole('button', { name: /Verify & Activate/i }))

    // Step 2: Profile
    fireEvent.click(screen.getByRole('button', { name: /Next/i }))

    // Step 3: Payments
    fireEvent.click(screen.getByRole('button', { name: /Save & Activate/i }))

    // Step 5: Success
    expect(screen.getByText('Join Request Submitted!')).toBeInTheDocument()
    
    // Verify that the Personal Payout ID shown is a valid Staff Code and not '1'
    const successTitle = screen.getByText('Personal Payout ID')
    expect(successTitle).toBeInTheDocument()
    const codeElement = successTitle.nextElementSibling
    expect(codeElement.textContent).toContain('NEX-STAFF-')
    expect(codeElement.textContent).not.toBe('1')

    const newGeneratedId = codeElement.textContent.trim()

    // Verify localStorage has been updated correctly
    const savedSetup = JSON.parse(localStorage.getItem('nexora_merchant_setup'))
    
    // The staff member with ID '1' should no longer exist
    expect(savedSetup.staffList.find(s => s.id === '1')).toBeUndefined()
    
    // Instead, they should have the new generated ID
    const updatedStaff = savedSetup.staffList.find(s => s.id === newGeneratedId)
    expect(updatedStaff).toBeDefined()
    expect(updatedStaff.fullName).toBe('Lisa Tran')
    expect(updatedStaff.status).toBe('Pending Acceptance')

    // The touchpoint should be updated to point to the new ID
    const updatedTp = savedSetup.touchPoints.find(tp => tp.staffId === newGeneratedId)
    expect(updatedTp).toBeDefined()
    expect(updatedTp.id).toBe(`tp-staff-${newGeneratedId}`)
  })

  it('supports QR code scanning and autofilling for NEXORA STAFF ID and VLINKPAY ID inputs', () => {
    const handleReturn = vi.fn()
    const generalInvite = { biz: 'Golden Glow Nail Spa' } // self-serve selection

    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={generalInvite} onReturnToMerchant={handleReturn} />
      </LanguageProvider>
    )

    // --- Part 1: Option A (Link profile via QR scan) ---
    fireEvent.click(screen.getByText('I already have a Profile'))

    // Trigger Scan QR modal for NEXORA STAFF ID
    const staffScanBtn = screen.getByTitle('Scan QR Code')
    fireEvent.click(staffScanBtn)

    // Verify Scanner overlay is shown
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument()
    expect(screen.getByText('Scan NEXORA STAFF ID to link your profile')).toBeInTheDocument()

    // Trigger Simulation Scan
    const simulateBtn = screen.getByRole('button', { name: /Simulate Successful Scan/i })
    fireEvent.click(simulateBtn)

    // Check that ID is filled and Lisa's profile is loaded
    expect(screen.getByPlaceholderText('e.g. NEX-STAFF-LISA1102').value).toBe('NEX-STAFF-LISA1102')
    expect(screen.getAllByText('Lisa Tran').length).toBeGreaterThan(0)
    expect(screen.getByText(/Nail Tech • \(408\) 555-2345/i)).toBeInTheDocument()

    // Go back and test Option B
    fireEvent.click(screen.getByRole('button', { name: /Back/i }))

    // --- Part 2: Option B (Register & Autofill via VLINKPAY QR Scan) ---
    fireEvent.click(screen.getByText('I am a new Technician'))

    // Fill registration credentials
    const emailInputs = screen.getAllByPlaceholderText('e.g. name@example.com')
    fireEvent.change(emailInputs[0], { target: { value: 'new.staff@example.com' } })
    fireEvent.change(emailInputs[1], { target: { value: 'new.staff@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /Continue|Next/i }))

    // Verify OTP
    fireEvent.click(screen.getByRole('button', { name: /Auto-fill/i }))
    fireEvent.click(screen.getByRole('button', { name: /Verify & Activate/i }))

    // Now in Step 2: Profile Setup
    expect(screen.getByText(/Personal Profile/i)).toBeInTheDocument()

    // Trigger Scan QR modal for VLINKPAY ID
    const vlinkpayScanBtn = screen.getByTitle('Scan VLINKPAY QR Code')
    fireEvent.click(vlinkpayScanBtn)

    // Verify VLINKPAY ID scan helper description
    expect(screen.getByText('Scan VLINKPAY ID to autofill profile data')).toBeInTheDocument()

    // Trigger simulation successful scan
    const simulateBtnVlp = screen.getByRole('button', { name: /Simulate Successful Scan/i })
    fireEvent.click(simulateBtnVlp)

    // Verify all profile fields are automatically populated with Lisa's profile details
    expect(screen.getByPlaceholderText('e.g. VLP-8893-VL').value).toBe('VLP-1102-LISA')
    expect(screen.getByPlaceholderText('Lisa Marie Tran').value).toBe('Lisa Tran')
    expect(screen.getByPlaceholderText('Lisa T.').value).toBe('Lisa T.')
    expect(screen.getByPlaceholderText('e.g. name@example.com').value).toBe('lisa@example.com')
    expect(screen.getByPlaceholderText('e.g. 408-555-1234').value).toBe('(408) 555-2345')
    expect(screen.getByPlaceholderText('e.g. Acrylic Specialist').value).toBe('Nail Tech')
  })
})

