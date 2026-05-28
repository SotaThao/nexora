import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../../src/components/Dashboard';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

describe('Dashboard Component Unit Tests', () => {
  const mockSetupData = {
    businessInfo: {
      name: 'Golden Glow Nail Spa',
      industry: 'Nail Salon',
    },
    staffList: [],
    touchPoints: [],
  };

  it('renders the dashboard screen successfully', () => {
    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Verify the admin sidebar and header displays
    expect(screen.getAllByText(/Golden Glow Nail Spa/i).length).toBeGreaterThan(0);
  });

  it('renders the KPI metric boxes', () => {
    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Verify key performance indicator labels render (such as Tips Collected, Scans, Reviews, etc.)
    expect(screen.getByText(/Tips Collected/i)).toBeInTheDocument();
    expect(screen.getByText(/QR\/NFC Scans/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Star Rating/i)).toBeInTheDocument();
  });

  it('toggles notifications dropdown and displays read/unread notifications', () => {
    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Click the notification icon button
    const notiBtn = screen.getByTitle('Notifications');
    fireEvent.click(notiBtn);

    // Verify notifications dropdown is visible
    expect(screen.getByText(/New Internal Feedback \(2★\)/i)).toBeInTheDocument();
    expect(screen.getByText(/New Internal Feedback \(1★\)/i)).toBeInTheDocument();
    expect(screen.getByText(/New Tip Received/i)).toBeInTheDocument();

    // Verify unread styling (font-extrabold) is applied to the unread notification title
    const unreadNotification = screen.getByText(/New Internal Feedback \(2★\)/i);
    expect(unreadNotification.className).toContain('font-extrabold');

    // Verify read styling (font-bold) is applied to the read notification title
    const readNotification = screen.getByText(/New Internal Feedback \(1★\)/i);
    expect(readNotification.className).toContain('font-bold');
    expect(readNotification.className).not.toContain('font-extrabold');
  });
});
