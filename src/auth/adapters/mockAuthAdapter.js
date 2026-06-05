/**
 * mockAuthAdapter — ports the credential-validation + mock SSO logic from
 * src/app/mockSso.js and src/App.jsx verbatim in behavior.
 *
 * login(credentials) validates against pendingAccounts (via repository) and
 * returns a session object WITHOUT password/token:
 *   { id, email, accountType ('personal'|'business'), flag ('!personal'|'!business'),
 *     displayName, role, staffId, verificationStatus, ssoPrefillData }
 *
 * The mock SSO demo profiles are reproduced here so this is the ONLY place that
 * needs to know about them (components must not import mockSso directly).
 */

import pendingAccountsRepository from '../../data/repositories/pendingAccounts'

// --- Demo SSO test profiles (from src/app/mockSso.js) -------------------

export const MOCK_SSO_KYB_PROFILE = {
  name: 'VLINK Nail Spa',
  industry: 'Nail Salon',
  address: '789 Broadway, New York, NY 10003',
  phone: '+1 (212) 555-0199',
  website: 'https://vlinknailstudio.com',
  logo: null,
  paymentAccounts: {
    venmo: '@vlinknail',
    cashapp: '$vlinknail',
    zelle: 'pay@vlinknailstudio.com',
    vlinkpay: 'VLP-7721-VN'
  },
  email: 'sso_with_kyb@gmail.com'
}

export const MOCK_SSO_NO_KYB_EMAIL = 'sso_no_kyb@gmail.com'

// -------------------------------------------------------------------------

function buildNoKybPrefill(matched, targetEmail, activeStatus) {
  const isAlreadyVerified = activeStatus === 'kyb_approved'
  return {
    name: isAlreadyVerified ? matched.kybDetails.legalName : 'Golden Glow Nails',
    industry: isAlreadyVerified ? (matched.kybDetails.businessType === 'LLC' ? 'Nail Salon' : 'Khác') : 'Nail Salon',
    address: isAlreadyVerified ? 'VLINKPAY Merchant Registered Location' : '123 Beauty Lane, San Jose, CA 95112',
    phone: isAlreadyVerified ? '+1 (555) VLP-KYB1' : '+1 (408) 555-0123',
    website: 'https://goldenglownails.com',
    logo: null,
    paymentAccounts: {
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: isAlreadyVerified && matched.kybDetails.bankAccount ? `VLP-${matched.kybDetails.bankAccount.slice(-4)}` : ''
    },
    email: targetEmail,
    reviewLinks: {
      googleReview: isAlreadyVerified ? 'https://google.com' : '',
      yelpReview: isAlreadyVerified ? 'https://yelp.com' : '',
      facebookReview: '',
      feedbackEmail: targetEmail
    }
  }
}

function buildRegisteredPrefill(matchedAccount) {
  const activeStatus = matchedAccount.verificationStatus || (matchedAccount.isVerified ? 'kyb_approved' : 'basic')
  const isAlreadyVerified = activeStatus === 'kyb_approved'
  return {
    name: isAlreadyVerified ? matchedAccount.kybDetails.legalName : '',
    industry: isAlreadyVerified ? (matchedAccount.kybDetails.businessType === 'LLC' ? 'Nail Salon' : 'Khác') : '',
    address: isAlreadyVerified ? 'VLINKPAY Merchant Registered Location' : '',
    phone: isAlreadyVerified ? '+1 (555) VLP-KYB1' : '',
    website: '',
    logo: null,
    paymentAccounts: {
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: isAlreadyVerified && matchedAccount.kybDetails.bankAccount ? `VLP-${matchedAccount.kybDetails.bankAccount.slice(-4)}` : ''
    },
    email: matchedAccount.email,
    reviewLinks: {
      googleReview: isAlreadyVerified ? 'https://google.com' : '',
      yelpReview: isAlreadyVerified ? 'https://yelp.com' : '',
      facebookReview: '',
      feedbackEmail: matchedAccount.email
    }
  }
}

// In-memory session (mimics today's React state in App.jsx)
let _session = null

export const mockAuthAdapter = {
  /**
   * Validate credentials and return a session.
   * Mirrors handleLoginSubmit() in App.jsx exactly.
   *
   * @param {{ email: string, password: string, ssoType?: 'sso_with_kyb'|'sso_no_kyb'|null, simulatedStatus?: string|null }} credentials
   * @returns {Promise<object>} session
   */
  async login(credentials) {
    const { ssoType = null, simulatedStatus = null } = credentials
    const allAccounts = await pendingAccountsRepository.list()

    const targetEmail = ssoType
      ? (ssoType === 'sso_with_kyb' ? 'sso_with_kyb@gmail.com' : 'sso_no_kyb@gmail.com')
      : (credentials.email || '').trim().toLowerCase()
    const targetPassword = ssoType ? '••••••••' : credentials.password

    if (!targetEmail || !targetPassword) {
      throw new Error('missing_credentials')
    }

    // SCENARIO 1: SSO WITH KYB
    if (targetEmail === 'sso_with_kyb@gmail.com') {
      _session = {
        id: 'sso_with_kyb',
        email: targetEmail,
        accountType: 'business',
        flag: '!business',
        displayName: MOCK_SSO_KYB_PROFILE.name,
        role: 'owner',
        staffId: null,
        verificationStatus: 'kyb_approved',
        ssoPrefillData: MOCK_SSO_KYB_PROFILE,
        clearMerchantSetup: true,
      }
      return _session
    }

    // SCENARIO 2: SSO WITHOUT KYB
    if (targetEmail === 'sso_no_kyb@gmail.com') {
      const matched = allAccounts.find(acc => acc.email === targetEmail)
      const activeStatus = simulatedStatus || matched?.verificationStatus || (matched?.isVerified ? 'kyb_approved' : 'basic')
      const ssoPrefillData = matched ? buildNoKybPrefill(matched, targetEmail, activeStatus) : {
        name: 'Golden Glow Nails',
        industry: 'Nail Salon',
        address: '123 Beauty Lane, San Jose, CA 95112',
        phone: '+1 (408) 555-0123',
        website: 'https://goldenglownails.com',
        logo: null,
        paymentAccounts: { venmo: '', cashapp: '', zelle: '', vlinkpay: '' },
        email: targetEmail,
        reviewLinks: { googleReview: '', yelpReview: '', facebookReview: '', feedbackEmail: targetEmail }
      }

      _session = {
        id: 'sso_no_kyb',
        email: targetEmail,
        accountType: 'business',
        flag: '!business',
        displayName: ssoPrefillData.name || 'Golden Glow Nails',
        role: 'owner',
        staffId: null,
        verificationStatus: activeStatus,
        ssoPrefillData,
        clearMerchantSetup: true,
        clearProfileSettings: true,
        routeToDashboard: true,
      }
      return _session
    }

    // SCENARIO 3: CHECK MANUALLY REGISTERED ACCOUNTS
    const matchedAccount = allAccounts.find(acc => acc.email === targetEmail)
    if (matchedAccount) {
      if (matchedAccount.password !== targetPassword) {
        throw new Error('incorrect_password')
      }

      const role = matchedAccount.role || 'owner'

      if (role === 'personal' || role === 'staff') {
        const staffId = matchedAccount.staffId || 'NEX-STAFF-MIA0123'
        _session = {
          id: matchedAccount.email,
          email: matchedAccount.email,
          accountType: 'personal',
          flag: '!personal',
          displayName: matchedAccount.fullName || matchedAccount.email,
          role,
          staffId,
          verificationStatus: null,
          ssoPrefillData: null,
        }
        return _session
      }

      const activeStatus = matchedAccount.verificationStatus || (matchedAccount.isVerified ? 'kyb_approved' : 'basic')
      const ssoPrefillData = matchedAccount.kybDetails ? buildRegisteredPrefill(matchedAccount) : {
        email: matchedAccount.email,
        name: '',
        industry: '',
        address: '',
        phone: '',
        website: '',
        logo: null,
        paymentAccounts: { venmo: '', cashapp: '', zelle: '', vlinkpay: '' },
        reviewLinks: { googleReview: '', yelpReview: '', facebookReview: '', feedbackEmail: matchedAccount.email }
      }

      _session = {
        id: matchedAccount.email,
        email: matchedAccount.email,
        accountType: 'business',
        flag: '!business',
        displayName: matchedAccount.fullName || matchedAccount.email,
        role: 'owner',
        staffId: null,
        verificationStatus: activeStatus,
        ssoPrefillData,
      }
      return _session
    }

    // FALLBACK: simple demo login (any valid email + 6+ char password)
    if (targetEmail.includes('@') && targetPassword.length >= 6) {
      // Check staffList in merchant setup for email match
      let matchedStaff = null
      try {
        const raw = localStorage.getItem('nexora_merchant_setup')
        if (raw) {
          const parsedSetup = JSON.parse(raw)
          matchedStaff = parsedSetup.staffList?.find(s => s.email?.trim().toLowerCase() === targetEmail)
        }
      } catch (_) {}

      if (matchedStaff) {
        _session = {
          id: targetEmail,
          email: targetEmail,
          accountType: 'business',
          flag: '!business',
          displayName: matchedStaff.fullName || targetEmail,
          role: 'staff',
          staffId: matchedStaff.id,
          verificationStatus: null,
          ssoPrefillData: null,
        }
        return _session
      }

      _session = {
        id: targetEmail,
        email: targetEmail,
        accountType: 'business',
        flag: '!business',
        displayName: targetEmail,
        role: 'owner',
        staffId: null,
        verificationStatus: null,
        ssoPrefillData: null,
      }
      return _session
    }

    throw new Error('invalid_credentials')
  },

  async logout() {
    _session = null
  },

  async getSession() {
    return _session
  },
}

export default mockAuthAdapter
