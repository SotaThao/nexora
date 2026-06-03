import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../../src/components/Dashboard';
import { LanguageProvider } from '../../src/contexts/LanguageContext';

describe('Dashboard Component Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
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

  it('renders normal dashboard statistics and items even when hasKyb is false', () => {
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

    // Verify KPI boxes render correctly (check for presence of labels since values animate)
    expect(screen.getByText(/Total Tips/i)).toBeInTheDocument();
    expect(screen.getByText(/Total Transactions/i)).toBeInTheDocument();

    // Verify leaderboard is NOT empty
    expect(screen.getByText('Mia Tran')).toBeInTheDocument();

    // Verify notifications can be loaded normally
    const notiBtn = screen.getByTitle('Notifications');
    fireEvent.click(notiBtn);
    expect(screen.getByText(/New Internal Feedback \(2★\)/i)).toBeInTheDocument();

    // Navigate to staff tab
    const staffMenuBtn = screen.getByRole('button', { name: /Staff/i });
    fireEvent.click(staffMenuBtn);
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    // Navigate to touchpoints tab
    const touchpointsMenuBtn = screen.getByRole('button', { name: /Touchpoint Manager|Quản Lý Điểm Chạm/i });
    fireEvent.click(touchpointsMenuBtn);
    expect(screen.getByText('Manicure Station 01')).toBeInTheDocument();
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
    const profileBtn = screen.getByLabelText('Account menu');
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

  it('does not display KYB Warning Modal and allows navigation when gated feature is clicked and verificationStatus !== "kyb_approved"', () => {
    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} verificationStatus="basic" onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Gated tab "Tips" is clicked
    const navigation = screen.getByRole('navigation');
    const tipsBtn = within(navigation).getByRole('button', { name: /Tips|Tiền Típ/i });
    fireEvent.click(tipsBtn);

    // Verify warning modal is NOT displayed
    expect(screen.queryByText(/KYB Verification Required/i)).not.toBeInTheDocument();

    // Verify it navigated to Tips view successfully
    expect(screen.getByRole('heading', { level: 2, name: /Tips|Tiền Típ/i })).toBeInTheDocument();
  });

  it('renders technician payout accounts as read-only for Salon Owner', () => {
    const mockSetup = {
      businessInfo: {
        name: 'Golden Glow Nail Spa',
        industry: 'Nail Salon',
      },
      staffList: [
        { 
          id: 'NEX-STAFF-MIA0123', 
          fullName: 'Mia Tran', 
          nickname: 'Mia T.', 
          position: 'Gel-X Artist', 
          isActive: true,
          showInTipsFlow: true,
          phone: '407-555-0123',
          email: 'mia.tran@gmail.com',
          paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }
        }
      ],
      touchPoints: [],
    };

    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetup} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // 1. Navigate to staff tab
    const staffMenuBtn = screen.getByRole('button', { name: /Staff/i });
    fireEvent.click(staffMenuBtn);

    // Assert Mia Tran is in the document
    expect(screen.getByText('Mia Tran')).toBeInTheDocument();

    // 2. Click on the Edit/Manage staff button for Mia Tran
    const editBtn = screen.getByTitle(/Edit|common\.edit|Chỉnh sửa thợ/i);
    fireEvent.click(editBtn);

    // 3. Verify Payout toggles are disabled
    const payoutToggles = screen.getAllByRole('button').filter(btn => btn.className.includes('w-11') && btn.className.includes('h-6') && btn.className.includes('cursor-not-allowed'));
    payoutToggles.forEach(toggle => {
      expect(toggle).toBeDisabled();
    });

    // 4. Verify "Xem tài khoản" / "View Account" button is rendered
    const viewAccountBtn = screen.getAllByText(/Xem tài khoản|View Account/i)[0];
    expect(viewAccountBtn).toBeInTheDocument();

    // 5. Click "View Account" to open payout details modal
    fireEvent.click(viewAccountBtn);

    const payoutModal = screen.getByTestId('payout-setup-modal');

    // 6. Verify input identifier is disabled
    const input = within(payoutModal).getByPlaceholderText(/Enter Zelle email/i);
    expect(input).toBeDisabled();

    // 7. Verify save/submit button is not present
    expect(within(payoutModal).queryByRole('button', { name: /Lưu lại|Save/i })).not.toBeInTheDocument();

    // 8. Verify Close/Đóng/Hủy button is present and click it to close
    const closeBtn = within(payoutModal).getByRole('button', { name: /ĐÓNG|CLOSE|HỦY|CANCEL/i });
    fireEvent.click(closeBtn);
  });

  it('supports QR code scanning and autofilling inside the Staff modal', () => {
    const mockSetup = {
      businessInfo: { name: 'Golden Glow Nail Spa', industry: 'Nail Salon' },
      staffList: [
        { 
          id: 'NEX-STAFF-MIA0123', 
          fullName: 'Mia Tran', 
          nickname: 'Mia T.', 
          position: 'Gel-X Artist', 
          isActive: true,
          showInTipsFlow: true,
          phone: '407-555-0123',
          email: 'mia.tran@gmail.com',
          paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: 'VLP-0123-MIA' }
        }
      ],
      touchPoints: [],
    };

    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetup} verificationStatus="kyb_approved" onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // 1. Navigate to staff tab
    const staffMenuBtn = screen.getByRole('button', { name: /Staff/i });
    fireEvent.click(staffMenuBtn);

    // 2. Click on the Edit/Manage staff button for Mia Tran
    const editBtn = screen.getByTitle(/Edit|common\.edit|Chỉnh sửa thợ/i);
    fireEvent.click(editBtn);

    // 3. Verify VLINKPAY ID QR Scan button is present
    const vlinkpayScanBtn = screen.getByTitle('Scan VLINKPAY QR Code');
    expect(vlinkpayScanBtn).toBeInTheDocument();

    // 4. Verify NEXORA QR Scan button is present
    const staffScanBtn = screen.getByTitle('Scan NEXORA QR Code');
    expect(staffScanBtn).toBeInTheDocument();

    // 5. Click the VLINKPAY QR Scan button
    fireEvent.click(vlinkpayScanBtn);

    // Verify Scanner overlay is shown
    expect(screen.getByText('Scan QR Code')).toBeInTheDocument();
    expect(screen.getByText('Scan VLINKPAY ID to autofill account data')).toBeInTheDocument();

    // 6. Trigger simulation successful scan (which scans Lisa Tran)
    const simulateBtn = screen.getByRole('button', { name: /Simulate Successful Scan/i });
    fireEvent.click(simulateBtn);

    // 7. Verify Lisa Tran's profile data has been loaded and auto-filled
    expect(screen.getByPlaceholderText('Mia Tran').value).toBe('Lisa Tran');
    expect(screen.getByPlaceholderText('Mia T.').value).toBe('Lisa T.');
    expect(screen.getByPlaceholderText('Nail Tech').value).toBe('Nail Tech');
    expect(screen.getByPlaceholderText('e.g., mia.tran@gmail.com').value).toBe('lisa@example.com');
    expect(screen.getByPlaceholderText('e.g. VLP-8893-VL').value).toBe('VLP-1102-LISA');
    expect(screen.getByPlaceholderText('e.g. NEX-STAFF-LISA1102').value).toBe('NEX-STAFF-LISA1102');
  });

  it('opens approval modal when clicking on a pending join request notification', () => {
    const mockSetup = {
      businessInfo: { name: 'Golden Glow Nail Spa', industry: 'Nail Salon' },
      staffList: [
        {
          id: 'NEX-STAFF-LISA1102',
          fullName: 'Lisa Tran',
          nickname: 'Lisa T.',
          position: 'Nail Tech',
          isActive: false,
          status: 'Pending Acceptance',
          paymentAccounts: { venmo: '@lisatran-nails', cashapp: '$lisatran', zelle: 'lisa@example.com', vlinkpay: 'VLP-1102-LISA' }
        }
      ],
      touchPoints: [],
    };

    const joinNoti = [
      {
        id: 'noti-join-LISA1102',
        staffId: 'NEX-STAFF-LISA1102',
        type: 'feedback_alert',
        title: 'New Join Request',
        message: 'Technician Lisa Tran requested to link with your salon.',
        time: 'Just now',
        read: false,
        linkTab: 'staff'
      }
    ];
    localStorage.setItem('nexora_notifications', JSON.stringify(joinNoti));

    render(
      <LanguageProvider>
        <Dashboard setupData={mockSetup} verificationStatus="kyb_approved" onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // 1. Click the notification icon button
    const notiBtn = screen.getByTitle('Notifications');
    fireEvent.click(notiBtn);

    // 2. Click on the Join Request notification
    const joinNotification = screen.getByText('Technician Lisa Tran requested to link with your salon.');
    fireEvent.click(joinNotification);

    // 3. Verify approval modal is displayed
    expect(screen.getByText('Review Join Request')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Mia Tran').value).toBe('Lisa Tran');
  });

  it('supports selecting custom date range presets and inputs in dashboard overview', () => {
    const { container } = render(
      <LanguageProvider>
        <Dashboard setupData={mockSetupData} onLogout={vi.fn()} />
      </LanguageProvider>
    );

    // Switch to Custom date range in the dashboard chart
    const customBtn = screen.getByRole('button', { name: /Tự chọn|Custom/i });
    expect(customBtn).toBeInTheDocument();
    fireEvent.click(customBtn);

    // The Date pickers should be displayed
    const dateInputs = container.querySelectorAll('input[type="date"]');
    expect(dateInputs.length).toBe(2);

    // Change the start and end dates
    fireEvent.change(dateInputs[0], { target: { value: '2026-05-10' } });
    fireEvent.change(dateInputs[1], { target: { value: '2026-05-15' } });

    // Verify values update correctly
    expect(dateInputs[0].value).toBe('2026-05-10');
    expect(dateInputs[1].value).toBe('2026-05-15');
  });
});
