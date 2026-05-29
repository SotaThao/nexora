import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../../src/components/Dashboard';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

describe('Dashboard Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });
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

    // Verify key performance indicator labels render
    expect(screen.getByText(/Total Tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Transactions/i)).toBeInTheDocument();
    expect(screen.getByText(/Average Tip/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Reviews/i)).toBeInTheDocument();

    // Verify bottom review KPI labels render
    expect(screen.getByText(/Google Reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Yelp Reviews/i)).toBeInTheDocument();
    expect(screen.getByText(/Response Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Returning Customers/i)).toBeInTheDocument();
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

  it('renders TouchpointsView with QR image, active toggle, scans, and revenue', () => {
    const mockSetup = {
      businessInfo: {
        name: 'Golden Glow Nail Spa',
        industry: 'Nail Salon',
      },
      staffList: [],
      touchPoints: [
        { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR', isActive: true, scans: 1102 }
      ],
    };

    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetup} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Navigate to touchpoints tab
    const touchpointsMenuBtn = screen.getByRole('button', { name: /Touchpoint Manager|Quản Lý Điểm Chạm/i });
    fireEvent.click(touchpointsMenuBtn);

    // Verify touchpoint card details
    expect(screen.getByText('Manicure Station 01')).toBeInTheDocument();
    expect(screen.getAllByText('Table QR').length).toBeGreaterThan(0);
    expect(screen.getAllByText('1102').length).toBeGreaterThan(0); // scans or KPI total scans
    expect(screen.getAllByText(/Active/i).length).toBeGreaterThan(0); // active status or active KPI card
  });

  it('verifies the Touchpoint Manager KPIs, linked device label, and Link Device action', () => {
    const mockSetup = {
      businessInfo: {
        name: 'Golden Glow Nail Spa',
        industry: 'Nail Salon',
      },
      staffList: [],
      touchPoints: [
        { id: 'tp-front', name: 'Front Desk', type: 'Front Desk', deviceId: 'NFC-001', isActive: true, scans: 100 },
        { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR', isActive: true, scans: 50 }
      ],
    };

    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetup} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Navigate to touchpoints tab
    const touchpointsMenuBtn = screen.getByRole('button', { name: /Touchpoint Manager|Quản Lý Điểm Chạm/i });
    fireEvent.click(touchpointsMenuBtn);

    // 1. Verify KPIs
    const totalTouchpointsHeader = screen.getByText('Total Touchpoints');
    expect(totalTouchpointsHeader.closest('div').textContent).toContain('2');

    const activeNfcHeader = screen.getByText('Active NFC Stands');
    expect(activeNfcHeader.closest('div').textContent).toContain('1');

    const totalScansHeader = screen.getByText('Total Scans');
    expect(totalScansHeader.closest('div').textContent).toContain('150');

    expect(screen.getByText('Device Issues')).toBeInTheDocument();

    // 2. Verify Linked Device Labels
    expect(screen.getByText('NFC-001')).toBeInTheDocument();
    expect(screen.getByText(/Only Paper QR/i)).toBeInTheDocument();

    // 3. Verify Link Device Action
    const linkButtons = screen.getAllByRole('button', { name: /Link Device|Edit Link/i });
    const manicureLinkBtn = linkButtons.find(btn => btn.textContent.includes('Link Device'));
    expect(manicureLinkBtn).toBeInTheDocument();
    
    fireEvent.click(manicureLinkBtn);

    // Enter a new device ID: NFC-102
    const input = screen.getByPlaceholderText('Device ID (e.g. NFC-105)');
    fireEvent.change(input, { target: { value: 'NFC-102' } });

    // Click confirm (Check icon button)
    const confirmBtn = screen.getByTitle('Confirm');
    fireEvent.click(confirmBtn);

    // Verify it calls the state callback and displays the new device ID
    expect(screen.getByText('NFC-102')).toBeInTheDocument();
    expect(activeNfcHeader.closest('div').textContent).toContain('2'); // active NFC stands KPI count is updated
  });

  it('renders zeroed/empty dashboard when hasKyb is false', () => {
    const mockSetup = {
      businessInfo: {
        name: 'Golden Glow Nail Spa',
        industry: 'Nail Salon',
      },
      staffList: [
        { id: '1', fullName: 'John Doe', nickname: 'John', position: 'Nail Tech', isActive: true }
      ],
      touchPoints: [
        { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR', isActive: true, scans: 1102 }
      ],
    };

    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetup} hasKyb={false} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Verify KPIs display $0.00 or 0
    expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);

    // Verify leaderboard is empty
    expect(screen.queryByText('Mia Tran')).not.toBeInTheDocument();

    // Verify notifications count is 0
    const notiBtn = screen.getByTitle('Notifications');
    fireEvent.click(notiBtn);
    expect(screen.queryByText(/New Internal Feedback/i)).not.toBeInTheDocument();

    // Navigate to staff tab
    const staffMenuBtn = screen.getByRole('button', { name: /Staff/i });
    fireEvent.click(staffMenuBtn);
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

    // Navigate to touchpoints tab
    const touchpointsMenuBtn = screen.getByRole('button', { name: /Touchpoint Manager|Quản Lý Điểm Chạm/i });
    fireEvent.click(touchpointsMenuBtn);
    expect(screen.queryByText('Manicure Station 01')).not.toBeInTheDocument();
  });

  it('toggles header profile dropdown and navigates to settings tabs', () => {
    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Header settings button should not be present (removed)
    expect(screen.queryByTitle('Settings')).not.toBeInTheDocument();

    // Click profile menu button in header
    const profileBtn = screen.getByLabelText('Profile menu');
    fireEvent.click(profileBtn);

    // Dropdown should be open and display owner info and links
    const dropdown = document.getElementById('header-profile-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown.textContent).toContain('Elena Rostova');
    expect(dropdown.textContent).toContain('owner@goldenglownails.com');

    // Find and click Business Setting specifically inside header dropdown
    const bizSettingLink = within(dropdown).getByRole('button', { name: /Business Setting/i });
    fireEvent.click(bizSettingLink);

    // Verify it navigates to settings view and renders Settings configuration header
    expect(screen.getByText('Settings Configuration')).toBeInTheDocument();
  });

  it('sidebar profile card displays owner credentials and toggles settings submenus, plus plan card details', () => {
    const { rerender } = render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} hasKyb={true} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Sidebar settings button should not be visible by default (starts collapsed)
    expect(screen.queryByRole('button', { name: /Business Setting/i })).not.toBeInTheDocument();

    // Verify owner details in sidebar profile card
    expect(screen.getByText('Golden Glow Nail Spa')).toBeInTheDocument();

    // Verify plan details are rendered when hasKyb is true
    expect(screen.getByText('CURRENT PLAN')).toBeInTheDocument();
    expect(screen.getByText('Pro Plan')).toBeInTheDocument();
    expect(screen.getByText('Renews on Jun 20, 2024')).toBeInTheDocument();

    // Verify clicking Manage Plan redirects to ComingSoon with Subscriptions text
    const managePlanBtn = screen.getByRole('button', { name: /Manage Plan/i });
    fireEvent.click(managePlanBtn);
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText(/Manage NFC stand orders, renewal plans/i)).toBeInTheDocument();

    // Click back button to return to dashboard overview
    const backBtn = screen.getByRole('button', { name: /Back to Directory/i });
    fireEvent.click(backBtn);
    expect(screen.queryByText('Subscriptions')).not.toBeInTheDocument();

    // Toggle expansion by clicking the profile card clickable area
    const profileCardClickable = screen.getByText('Golden Glow Nail Spa').closest('.cursor-pointer');
    fireEvent.click(profileCardClickable);

    // Submenu links should now be visible
    expect(screen.getByRole('button', { name: /Business Setting/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Business Verification/i })).toBeInTheDocument();

    // Re-render with hasKyb = false to verify "No current plan" displays
    rerender(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} hasKyb={false} onLogout={vi.fn()} />
      </LanguageProvider>
    );
    expect(screen.queryByText('Pro Plan')).not.toBeInTheDocument();
    expect(screen.queryByText('Renews on Jun 20, 2024')).not.toBeInTheDocument();
    // It should render no plan text
    expect(screen.getByText(/No Plan yet/i)).toBeInTheDocument();
  });

  it('displays KYB Warning Modal when gated feature is clicked and verificationStatus !== "kyb_approved"', () => {
    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} verificationStatus="basic" onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Gated tab "Tips" is clicked
    const navigation = screen.getByRole('navigation');
    const tipsBtn = within(navigation).getByRole('button', { name: /Tips|Tiền Típ/i });
    fireEvent.click(tipsBtn);

    // Verify warning modal is displayed
    expect(screen.getByText(/KYB Verification Required/i)).toBeInTheDocument();

    // Verify clicking Cancel closes the modal
    const cancelBtn = screen.getByRole('button', { name: /Cancel|Hủy bỏ/i });
    fireEvent.click(cancelBtn);
    expect(screen.queryByText(/KYB Verification Required/i)).not.toBeInTheDocument();

    // Click tips again and verify we can click Verify Now
    fireEvent.click(tipsBtn);
    const verifyNowBtn = screen.getByRole('button', { name: /Verify Now|Xác thực ngay/i });
    fireEvent.click(verifyNowBtn);

    // Verification modal closes and navigates to settings -> kyb tab
    expect(screen.queryByText(/KYB Verification Required/i)).not.toBeInTheDocument();
    expect(screen.getByText('Settings Configuration')).toBeInTheDocument();
  });
});
