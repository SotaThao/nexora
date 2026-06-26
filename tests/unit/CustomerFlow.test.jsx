import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CustomerFlow from '../../src/components/CustomerFlow';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

describe('CustomerFlow Component Unit Tests', () => {
  it('renders customer flow form and proceeds to payment selection', async () => {
    render(
      <LanguageProvider>
        <CustomerFlow />
      </LanguageProvider>
    );

    // Select a staff member first
    const staffBtn = screen.getByText('Mia Tran');
    expect(staffBtn).toBeInTheDocument();
    fireEvent.click(staffBtn);

    // Click Next to advance from select_staff to tip_amount
    const nextBtn1 = screen.getByRole('button', { name: /Next/i });
    expect(nextBtn1).toBeInTheDocument();
    fireEvent.click(nextBtn1);

    // Verify we are now on the Tip & Pay screen
    // It should have the "CHOOSE PAYMENT METHOD" button disabled/enabled
    const choosePaymentBtn = screen.getByText(/CHOOSE PAYMENT METHOD/i);
    expect(choosePaymentBtn).toBeInTheDocument();

    // Select a payment method (Zelle)
    const zelleBtn = screen.getByText('Zelle');
    expect(zelleBtn).toBeInTheDocument();
    fireEvent.click(zelleBtn);

    // Verify the submit button text updated
    expect(screen.getByText(/I SENT TIP VIA ZELLE/i)).toBeInTheDocument();
  });

  it('blocks the flow and shows warning when the scanned touchpoint is inactive', () => {
    // Setup localStorage mock data
    const mockSetup = {
      businessInfo: { name: 'Golden Glow Nail Spa', industry: 'Nail Salon' },
      staffList: [],
      touchPoints: [
        { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR', isActive: false }
      ]
    };
    localStorage.setItem('nexora_merchant_setup', JSON.stringify(mockSetup));

    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = {
      ...originalLocation,
      search: '?tech=tp/tp-mani-1&biz=Golden%20Glow%20Nail%20Spa',
      origin: 'http://localhost:3000',
      pathname: '/'
    };

    render(
      <LanguageProvider>
        <CustomerFlow />
      </LanguageProvider>
    );

    // Verify warning is displayed
    expect(screen.getByText(/Station Inactive/i)).toBeInTheDocument();
    expect(screen.getByText(/This QR touchpoint is currently disabled by the owner./i)).toBeInTheDocument();

    // Clean up
    localStorage.removeItem('nexora_merchant_setup');
    window.location = originalLocation;
  });
});
