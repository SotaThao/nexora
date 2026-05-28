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

    // Verify header of customer flow
    expect(screen.getByText(/Secure Gate/i)).toBeInTheDocument();

    // Select a staff member first
    const staffBtn = screen.getByText('Mia Tran');
    expect(staffBtn).toBeInTheDocument();
    fireEvent.click(staffBtn);

    // Find the Proceed to Payment button
    const payBtn = screen.getByRole('button', { name: /Proceed to Payment/i });
    expect(payBtn).toBeInTheDocument();

    // Click Proceed to Payment
    fireEvent.click(payBtn);

    // Verify we are now on the payment gateway selection step
    expect(screen.getByText(/Select Payment Gateway/i)).toBeInTheDocument();
  });
});
