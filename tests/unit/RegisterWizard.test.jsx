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
    expect(screen.getByText(/Email Address \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Confirm Email \*/i)).toBeInTheDocument();
    expect(screen.getByText(/Password \*/i)).toBeInTheDocument();
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
    const nextBtnStep1 = screen.getByRole('button', { name: /Next/i });
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

    const nextBtnStep1 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep1);

    // Should show validation errors for mismatched emails
    expect(screen.getByText(/Emails do not match/i)).toBeInTheDocument();
  });

  it('pre-fills and disables email when SSO email is provided, and allows completing registration', () => {
    const onBackToLoginMock = vi.fn();
    render(
      <LanguageProvider>
        <RegisterWizard ssoEmail="sso@vlinkpay.com" onBackToLogin={onBackToLoginMock} onRegisterSuccess={vi.fn()} />
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

    const nextBtnStep1 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep1);

    // Should go to Step 2 (Registration Success)
    expect(screen.getByText(/Account Registered Successfully/i)).toBeInTheDocument();
  });

  it('registers a new personal/technician account successfully', () => {
    render(
      <LanguageProvider>
        <RegisterWizard ssoEmail="" onBackToLogin={vi.fn()} onRegisterSuccess={vi.fn()} />
      </LanguageProvider>
    );

    // Select Personal Account role (using "Staff Member" to uniquely match the second card)
    const personalOption = screen.getByRole('button', { name: /Staff Member/i });
    fireEvent.click(personalOption);

    // Go to Step 1
    const nextBtnStep0 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep0);

    // Check that Full Name field is rendered
    expect(screen.getByText(/Full Name \*/i)).toBeInTheDocument();

    // Fill the inputs (using the correct "Mia Tran" placeholder defined in en.json)
    const fullNameInput = screen.getByPlaceholderText(/e\.g\., Mia Tran/i);
    fireEvent.change(fullNameInput, { target: { value: 'Lisa Tran' } });

    const emailInputs = screen.getAllByRole('textbox');
    // First is Full Name, second is Email, third is Confirm Email
    fireEvent.change(emailInputs[1], { target: { value: 'lisa.tran@example.com' } });
    fireEvent.change(emailInputs[2], { target: { value: 'lisa.tran@example.com' } });

    const passwordInput = screen.getByPlaceholderText(/Enter secure password/i);
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Click next to complete registration
    const nextBtnStep1 = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtnStep1);

    // Should go to Step 2 (Registration Success for Staff, check using the correct translation key in en.json)
    expect(screen.getByText(/Staff Account Registered!/i)).toBeInTheDocument();
    expect(screen.getByText(/NEX-STAFF-/)).toBeInTheDocument();
  });
});
