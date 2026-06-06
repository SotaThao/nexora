import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import RegisterWizard from '../../src/components/RegisterWizard';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

describe('RegisterWizard Component Unit Tests', () => {
  it('renders step 1 form successfully', () => {
    render(
      <LanguageProvider>
        <RegisterWizard ssoEmail="" onBackToLogin={vi.fn()} onRegisterSuccess={vi.fn()} />
      </LanguageProvider>
    );

    // Go past Step 0 (default role is Business Owner, click Next)
    const nextBtnStep0 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep0);

    // Using querySelector or exact match for labels
    expect(screen.getByText(/Create New Account/i)).toBeInTheDocument();
    expect(screen.getByText((content, el) => el.tagName.toLowerCase() === 'label' && el.textContent.trim() === 'Email Address *')).toBeInTheDocument();
    expect(screen.getByText((content, el) => el.tagName.toLowerCase() === 'label' && el.textContent.trim() === 'Confirm Email *')).toBeInTheDocument();
    expect(screen.getByText((content, el) => el.tagName.toLowerCase() === 'label' && el.textContent.trim() === 'Password *')).toBeInTheDocument();
  });

  it('validates empty email inputs', () => {
    render(
      <LanguageProvider>
        <RegisterWizard ssoEmail="" onBackToLogin={vi.fn()} onRegisterSuccess={vi.fn()} />
      </LanguageProvider>
    );

    // Go past Step 0
    const nextBtnStep0 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep0);

    // Step 1 Next button triggers validation
    const nextBtnStep1 = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(nextBtnStep1);

    // Should show validation errors
    expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
  });

  it('validates mismatched email inputs', () => {
    render(
      <LanguageProvider>
        <RegisterWizard ssoEmail="" onBackToLogin={vi.fn()} onRegisterSuccess={vi.fn()} />
      </LanguageProvider>
    );

    // Go past Step 0
    const nextBtnStep0 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep0);

    const emailInputs = screen.getAllByRole('textbox');
    // First is Email, second is Confirm Email
    fireEvent.change(emailInputs[0], { target: { value: 'test@example.com' } });
    fireEvent.change(emailInputs[1], { target: { value: 'mismatch@example.com' } });

    const passwordInput = screen.getByPlaceholderText(/Enter secure password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const nextBtnStep1 = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(nextBtnStep1);

    // Should show validation errors for mismatched emails
    expect(screen.getByText(/Emails do not match/i)).toBeInTheDocument();
  });

  it('pre-fills and disables email when SSO email is provided, and allows completing registration', () => {
    const onBackToLoginMock = vi.fn();
    const onRegisterSuccessMock = vi.fn();
    render(
      <LanguageProvider>
        <RegisterWizard ssoEmail="sso@vlinkpay.com" onBackToLogin={onBackToLoginMock} onRegisterSuccess={onRegisterSuccessMock} />
      </LanguageProvider>
    );

    // Go past Step 0
    const nextBtnStep0 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep0);

    const emailInput = screen.getByPlaceholderText(/partner@yourstore.com/i);
    expect(emailInput).toBeDisabled();
    expect(emailInput).toHaveValue('sso@vlinkpay.com');

    const confirmEmailInput = screen.getByPlaceholderText(/Re-enter email\.\.\./i);
    fireEvent.change(confirmEmailInput, { target: { value: 'sso@vlinkpay.com' } });

    const passwordInput = screen.getByPlaceholderText(/Enter secure password\.\.\./i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const nextBtnStep1 = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(nextBtnStep1);

    // Now we are on OTP Activation step!
    expect(screen.getByText(/Activate Account/i)).toBeInTheDocument();
    
    // Fill OTP
    const otpInput = screen.getByPlaceholderText(/e.g. 1234/i);
    fireEvent.change(otpInput, { target: { value: '1234' } });

    // Click Verify & Activate
    const verifyBtn = screen.getByRole('button', { name: /Verify & Activate/i });
    fireEvent.click(verifyBtn);

    // Verify callback was called
    expect(onRegisterSuccessMock).toHaveBeenCalled();
  });

  it('registers a new personal/technician account successfully through all steps', () => {
    const onBackToLoginMock = vi.fn();
    render(
      <LanguageProvider>
        <RegisterWizard
          ssoEmail=""
          onBackToLogin={onBackToLoginMock}
          onRegisterSuccess={vi.fn()}
        />
      </LanguageProvider>
    );

    // 1. Select Personal Account role
    const personalOption = screen.getByRole('button', { name: /Personal Account/i });
    fireEvent.click(personalOption);

    // Click Next to go to Step 1 Credentials
    const nextBtnStep0 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep0);

    expect(screen.getByText(/Create New Account/i)).toBeInTheDocument();

    // 2. Fill Credentials
    const emailInputs = screen.getAllByRole('textbox');
    // First is Email, second is Confirm Email
    fireEvent.change(emailInputs[0], { target: { value: 'personal@vlinkpay.com' } });
    fireEvent.change(emailInputs[1], { target: { value: 'personal@vlinkpay.com' } });

    const passwordInput = screen.getByPlaceholderText(/Enter secure password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    const nextBtnStep1 = screen.getByRole('button', { name: /Register/i });
    fireEvent.click(nextBtnStep1);

    // 3. Inline OTP verification should show
    expect(screen.getByText(/Activate Account/i)).toBeInTheDocument();
    const otpInput = screen.getByPlaceholderText(/e.g. 1234/i);
    fireEvent.change(otpInput, { target: { value: '1234' } });

    const verifyBtn = screen.getByRole('button', { name: /Verify & Activate/i });
    fireEvent.click(verifyBtn);

    // 4. Should move to Step 2: Profile Setup
    expect(screen.getByText(/Personal Profile Setup/i)).toBeInTheDocument();
    
    // Fill Full Name
    const fullNameInput = screen.getByPlaceholderText(/e.g. Lisa Marie Tran/i);
    fireEvent.change(fullNameInput, { target: { value: 'Anna Nguyen' } });

    // Fill Display Nickname
    const nicknameInput = screen.getByPlaceholderText(/e.g. Lisa T./i);
    fireEvent.change(nicknameInput, { target: { value: 'Anna N.' } });

    // Fill Phone
    const phoneInput = screen.getByPlaceholderText(/e.g. 408-555-1234/i);
    fireEvent.change(phoneInput, { target: { value: '713-555-1234' } });

    // Fill Position
    const positionInput = screen.getByPlaceholderText(/e.g. Acrylic Specialist/i);
    fireEvent.change(positionInput, { target: { value: 'Nail Technician' } });

    // Go to Payout Setup (Step 3)
    const profileNextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(profileNextBtn);

    // 5. Should move to Step 3: Payout Configuration
    expect(screen.getByText(/Payout Configuration/i)).toBeInTheDocument();

    // Click Save & Activate to complete registration
    const saveActivateBtn = screen.getByRole('button', { name: /Save & Activate/i });
    fireEvent.click(saveActivateBtn);

    // 6. Should move to Step 4: Success
    expect(screen.getByText(/Personal Account Registered!/i)).toBeInTheDocument();
    expect(screen.getByText(/NEX-STAFF-/i)).toBeInTheDocument();
  });
});
