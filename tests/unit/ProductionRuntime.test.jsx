import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import LoginScreen from '../../src/app/LoginScreen'
import StaffRegistrationWizard from '../../src/components/StaffRegistrationWizard'
import { LanguageProvider } from '../../src/contexts/LanguageContext'

const baseProps = {
  email: '',
  setEmail: vi.fn(),
  password: '',
  setPassword: vi.fn(),
  loginError: '',
  isLoading: false,
  currentLanguage: 'en',
  setLanguage: vi.fn(),
  t: (key) => ({
    'login.gateway_sub': 'Secure merchant access',
    'login.sso_integration_title': 'Secure SSO.',
    'login.sso_integration_desc': 'Use your account to continue.',
    'login.email_label': 'Email',
    'login.email_placeholder': 'owner@example.com',
    'login.password_label': 'Password',
    'login.password_placeholder': 'Password',
    'login.login_btn': 'Login',
    'login.or_try_demo': 'Or try demo',
    'login.register_btn': 'Register New Store',
    'login.enter_dashboard_btn': 'Enter Dashboard',
    'login.sso_security_footer': 'Secure OAuth',
  }[key] || key),
  simStatus: 'basic',
  setSimStatus: vi.fn(),
  pendingAccounts: [{ email: 'owner@example.com', password: 'secret123', role: 'business' }],
  onLoginSubmit: vi.fn(),
  onTriggerSimulation: vi.fn(),
  onToggleAccountVerification: vi.fn(),
  onDeleteSimulatedAccount: vi.fn(),
  onQuickDemoLogin: vi.fn(),
  onAutoLogin: vi.fn(),
  setStaffInviteData: vi.fn(),
  setView: vi.fn(),
  setLoggedInStaffId: vi.fn(),
}

describe('production runtime demo tooling gate', () => {
  it('hides simulation and quick-demo controls by default', () => {
    render(<LoginScreen {...baseProps} />)

    expect(screen.queryByText('SIMULATION FLOW CONTROLLER')).not.toBeInTheDocument()
    expect(screen.queryByText('Enter Dashboard')).not.toBeInTheDocument()
    expect(screen.queryByText(/secret123/)).not.toBeInTheDocument()
    expect(screen.getByText('Register New Store')).toBeInTheDocument()
  })

  it('shows simulation controls only when demo tools are explicitly enabled', () => {
    render(<LoginScreen {...baseProps} isDemoToolsEnabled />)

    expect(screen.getByText('SIMULATION FLOW CONTROLLER')).toBeInTheDocument()
    expect(screen.getByText('Enter Dashboard')).toBeInTheDocument()
    expect(screen.getByText(/secret123/)).toBeInTheDocument()
  })

  it('hides staff-registration helper controls by default', () => {
    render(
      <LanguageProvider>
        <StaffRegistrationWizard inviteData={{ biz: 'Golden Glow Nail Spa' }} onReturnToMerchant={vi.fn()} />
      </LanguageProvider>
    )

    fireEvent.click(screen.getByText('I already have an Account'))

    expect(screen.queryByText('Demo Account Tip:')).not.toBeInTheDocument()
    expect(screen.queryByText(/Auto-fill/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Auto-Fill Mock Handles/)).not.toBeInTheDocument()
  })
})
