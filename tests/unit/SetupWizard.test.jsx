import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SetupWizard from '../../src/components/SetupWizard';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

describe('SetupWizard Component Unit Tests', () => {
  const mockSsoPrefill = {
    name: 'VLINK Classic Salon',
    industry: 'Nail Salon',
    address: '124 Lygon St, Carlton, VIC 3053',
    phone: '+61 3 9988 7722',
    website: 'https://vlinkclassicsalon.com.au',
    logo: null,
    paymentAccounts: {
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: 'VLP-5523-VC'
    },
    email: 'sso_with_kyb@gmail.com',
    reviewLinks: {
      googleReview: 'https://google.com',
      yelpReview: 'https://yelp.com',
      facebookReview: '',
      feedbackEmail: 'sso_with_kyb@gmail.com'
    }
  };

  it('renders Step 1 with editable fields when no SSO prefill is provided', () => {
    render(
      <LanguageProvider>
        <SetupWizard onComplete={vi.fn()} onBackToLogin={vi.fn()} />
      </LanguageProvider>
    );

    const nameInput = screen.getByPlaceholderText(/e.g., Golden Glow Nails|Ví dụ: Golden Glow Nails/i);
    expect(nameInput).not.toBeDisabled();

    const addressInput = screen.getByPlaceholderText(/Enter full address|Nhập địa chỉ chính xác/i);
    expect(addressInput).not.toBeDisabled();

    const phoneInput = screen.getByPlaceholderText(/\+1 \(555\) 789-2026/);
    expect(phoneInput).not.toBeDisabled();
  });

  it('disables verified business profile fields when SSO prefill is provided', () => {
    render(
      <LanguageProvider>
        <SetupWizard 
          onComplete={vi.fn()} 
          onBackToLogin={vi.fn()} 
          initialBusinessInfo={mockSsoPrefill} 
        />
      </LanguageProvider>
    );

    // Store Name input should be disabled
    const nameInput = screen.getByDisplayValue('VLINK Classic Salon');
    expect(nameInput).toBeDisabled();

    // Store Address input should be disabled
    const addressInput = screen.getByDisplayValue('124 Lygon St, Carlton, VIC 3053');
    expect(addressInput).toBeDisabled();

    // Store Phone input should be disabled
    const phoneInput = screen.getByDisplayValue('+61 3 9988 7722');
    expect(phoneInput).toBeDisabled();

    // Store Website input should be disabled
    const websiteInput = screen.getByDisplayValue('https://vlinkclassicsalon.com.au');
    expect(websiteInput).toBeDisabled();

    // VLINKPAY ID input should be disabled
    const vlinkpayInput = screen.getByDisplayValue('VLP-5523-VC');
    expect(vlinkpayInput).toBeDisabled();

    // Other Zelle/Venmo wallets should be editable (not disabled)
    const zelleInput = screen.getByPlaceholderText(/Enter Zelle email\/phone|Nhập tài khoản Zelle/i);
    expect(zelleInput).not.toBeDisabled();

    // Review links should be editable (not disabled)
    const googleInput = screen.getByDisplayValue('https://google.com');
    expect(googleInput).not.toBeDisabled();
  });

  it('allows step navigation and does not block/trigger onKybRequired when hasKyb is false', () => {
    const onKybRequiredMock = vi.fn();
    render(
      <LanguageProvider>
        <SetupWizard 
          onComplete={vi.fn()} 
          onBackToLogin={vi.fn()} 
          hasKyb={false}
          onKybRequired={onKybRequiredMock}
        />
      </LanguageProvider>
    );

    // Prefill demo data first so step 1 validation passes
    const prefillBtn = screen.getByRole('button', { name: /Prefill Demo Data/i });
    fireEvent.click(prefillBtn);

    const nextBtn = screen.getByRole('button', { name: /Next|Tiếp theo/i });
    fireEvent.click(nextBtn);

    expect(onKybRequiredMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Add New Staff Member|Thêm Nhân Viên Mới/i)).toBeInTheDocument();
  });
});
