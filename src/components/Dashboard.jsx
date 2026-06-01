import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  BarChart3,
  Bell,
  Camera,
  ClipboardList,
  Download,
  Edit2,
  ExternalLink,
  Filter,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Moon,
  Plus,
  Pointer,
  QrCode,
  RotateCcw,
  Scissors,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  Wallet,
  Eye,
  EyeOff,
  X,
  ChevronUp,
  ChevronDown,
  Check,
  Link,
  Copy,
  Building,
  Send,
  Maximize2
} from 'lucide-react'
import StaffDetailView from './StaffDetailView'
import { useTranslation } from '../contexts/LanguageContext'
import { storage } from '../utils/storage'

const localStorage = storage
const sessionStorage = storage
import CustomSelect from './CustomSelect'
import CountryCodeSelect, { parsePhone } from './CountryCodeSelect'
import SettingsView from './SettingsView'
import TipsView from './TipsView'
import TouchpointsView from './TouchpointsView'
import DevicesView from './DevicesView'
import AnalyticsView from './AnalyticsView'
import SupportView from './SupportView'

// Helper to render text with styled star rating symbols (★) in luxuryGold and 4px space
function renderTextWithGoldStars(text) {
  if (!text) return null
  const parts = text.split('★')
  return parts.map((part, index) => {
    if (index === parts.length - 1) {
      return part
    }
    return (
      <span key={index}>
        {part}
        <span className="text-luxuryGold ml-flox-4 inline-block font-normal">★</span>
      </span>
    )
  })
}

const WalletLogos = {
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-[#008CFF]" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#00D632]" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32 1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#7414CA]" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#475569]" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain" />
  )
}

const DEFAULT_PAYOUT_CONFIGS = {
  zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
  bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
  paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
  venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
  cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
  applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
}

const getPayoutConfigsFromMember = (member) => {
  const configs = {
    zelle: { enabled: false, value: '', qrCode: '', accountName: '' },
    bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
    paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
    venmo: { enabled: false, value: '', qrCode: '', accountName: '' },
    cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
    applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
  }
  const accounts = member.paymentAccounts || {}
  const memberConfigs = member.payoutConfigs || {}
  
  if (accounts.zelle || memberConfigs.zelle?.value) {
    configs.zelle = {
      enabled: memberConfigs.zelle ? memberConfigs.zelle.enabled : true,
      value: accounts.zelle || memberConfigs.zelle?.value || '',
      qrCode: memberConfigs.zelle?.qrCode || '',
      accountName: memberConfigs.zelle?.accountName || member.fullName || ''
    }
  }
  if (accounts.bankwire || memberConfigs.bankwire?.value) {
    configs.bankwire = {
      enabled: memberConfigs.bankwire ? memberConfigs.bankwire.enabled : true,
      value: accounts.bankwire || memberConfigs.bankwire?.value || '',
      qrCode: memberConfigs.bankwire?.qrCode || '',
      accountName: memberConfigs.bankwire?.accountName || member.fullName || ''
    }
  }
  if (accounts.paypal || memberConfigs.paypal?.value) {
    configs.paypal = {
      enabled: memberConfigs.paypal ? memberConfigs.paypal.enabled : true,
      value: accounts.paypal || memberConfigs.paypal?.value || '',
      qrCode: memberConfigs.paypal?.qrCode || '',
      accountName: memberConfigs.paypal?.accountName || member.fullName || ''
    }
  }
  if (accounts.venmo || memberConfigs.venmo?.value) {
    configs.venmo = {
      enabled: memberConfigs.venmo ? memberConfigs.venmo.enabled : true,
      value: accounts.venmo || memberConfigs.venmo?.value || '',
      qrCode: memberConfigs.venmo?.qrCode || '',
      accountName: memberConfigs.venmo?.accountName || member.fullName || ''
    }
  }
  if (accounts.cashapp || memberConfigs.cashapp?.value) {
    configs.cashapp = {
      enabled: memberConfigs.cashapp ? memberConfigs.cashapp.enabled : true,
      value: accounts.cashapp || memberConfigs.cashapp?.value || '',
      qrCode: memberConfigs.cashapp?.qrCode || '',
      accountName: memberConfigs.cashapp?.accountName || member.fullName || ''
    }
  }
  if (accounts.applecash || memberConfigs.applecash?.value) {
    configs.applecash = {
      enabled: memberConfigs.applecash ? memberConfigs.applecash.enabled : true,
      value: accounts.applecash || memberConfigs.applecash?.value || '',
      qrCode: memberConfigs.applecash?.qrCode || '',
      accountName: memberConfigs.applecash?.accountName || member.fullName || ''
    }
  }
  
  return configs
}
const MOCK_NEXORA_STAFF_PROFILES = {
  'NEX-STAFF-ANNA0921': {
    fullName: 'Anna Nguyen',
    nickname: 'Anna N.',
    phone: '(713) 555-1234',
    email: 'anna@example.com',
    position: 'Nail Technician',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-0921-ANNA',
    payoutConfigs: {
      zelle: { enabled: true, value: '(713) 555-1234', qrCode: '', accountName: 'Anna Nguyen' },
      cashapp: { enabled: true, value: '$annanais', qrCode: '', accountName: 'Anna Nguyen' },
      venmo: { enabled: true, value: '@annanais', qrCode: '', accountName: 'Anna Nguyen' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  },
  'NEX-STAFF-LISA1102': {
    fullName: 'Lisa Tran',
    nickname: 'Lisa T.',
    phone: '(408) 555-2345',
    email: 'lisa@example.com',
    position: 'Nail Tech',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-1102-LISA',
    payoutConfigs: {
      venmo: { enabled: true, value: '@lisatran-nails', qrCode: '', accountName: 'Lisa Tran' },
      cashapp: { enabled: true, value: '$lisatran', qrCode: '', accountName: 'Lisa Tran' },
      zelle: { enabled: true, value: 'lisa@example.com', qrCode: '', accountName: 'Lisa Tran' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  },
  'NEX-STAFF-HN1148': {
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    phone: '(407) 555-4567',
    email: 'hanna@example.com',
    position: 'Nail Art Designer',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    vlinkpayId: 'VLP-1148-HN',
    payoutConfigs: {
      venmo: { enabled: true, value: '@hanna-art', qrCode: '', accountName: 'Hanna Nguyen' },
      zelle: { enabled: true, value: 'hanna@example.com', qrCode: '', accountName: 'Hanna Nguyen' },
      cashapp: { enabled: false, value: '', qrCode: '', accountName: '' },
      bankwire: { enabled: false, value: '', qrCode: '', accountName: '' },
      paypal: { enabled: false, value: '', qrCode: '', accountName: '' },
      applecash: { enabled: false, value: '', qrCode: '', accountName: '' }
    }
  }
}

const INITIAL_STAFF = [
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
  },
  {
    id: 'NEX-STAFF-VL8893',
    fullName: 'Vivian Le',
    nickname: 'Vivian L.',
    position: 'Acrylic Specialist',
    isActive: true,
    showInTipsFlow: true,
    phone: '407-555-0199',
    email: 'vivian.le@gmail.com',
    paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' }
  },
  {
    id: 'NEX-STAFF-ASH0155',
    fullName: 'Ashley Park',
    nickname: 'Ashley P.',
    position: 'Pedicure Lead',
    isActive: true,
    showInTipsFlow: true,
    phone: '407-555-0155',
    email: 'ashley@glownails.com',
    paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: 'VLP-0155-ASH' }
  },
  {
    id: 'NEX-STAFF-HN1148',
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    position: 'Nail Art Designer',
    isActive: false,
    showInTipsFlow: true,
    phone: '407-555-0144',
    email: 'hanna.art@gmail.com',
    paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' }
  }
]

const INITIAL_TRANSACTIONS = [
  { id: 'TX-2042', dateTime: '2026-05-25 14:32', amount: 28, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2041', dateTime: '2026-05-25 13:10', amount: 35, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2040', dateTime: '2026-05-25 11:05', amount: 22, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2039', dateTime: '2026-05-24 17:45', amount: 30, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Manicure Station 01', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2038', dateTime: '2026-05-24 15:20', amount: 18, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2037', dateTime: '2026-05-23 10:15', amount: 24, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'VIP Pedicure Room', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2036', dateTime: '2026-05-24 13:20', amount: 25, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2035', dateTime: '2026-05-24 14:05', amount: 24, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Acrylic Station 01', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2034', dateTime: '2026-05-24 11:15', amount: 45, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2033', dateTime: '2026-05-24 09:30', amount: 30, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2032', dateTime: '2026-05-23 17:10', amount: 15, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2031', dateTime: '2026-05-23 15:50', amount: 40, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2030', dateTime: '2026-05-23 16:40', amount: 32, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2029', dateTime: '2026-05-23 14:25', amount: 18, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'VIP Pedicure Room', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2028', dateTime: '2026-05-23 11:05', amount: 30, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2027', dateTime: '2026-05-23 10:30', amount: 28, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Acrylic Station 01', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2026', dateTime: '2026-05-22 13:10', amount: 25, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2025', dateTime: '2026-05-22 11:50', amount: 35, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2024', dateTime: '2026-05-22 16:30', amount: 22, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2023', dateTime: '2026-05-22 15:15', amount: 32, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2022', dateTime: '2026-05-22 09:45', amount: 38, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2021', dateTime: '2026-05-21 17:10', amount: 28, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'VIP Pedicure Room', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2020', dateTime: '2026-05-21 15:45', amount: 18, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Front Desk', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2019', dateTime: '2026-05-21 16:00', amount: 15, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Acrylic Station 01', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2018', dateTime: '2026-05-21 14:20', amount: 50, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2017', dateTime: '2026-05-21 10:05', amount: 20, staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2016', dateTime: '2026-05-20 12:20', amount: 35, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Nail Art Station 02', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2015', dateTime: '2026-05-20 14:10', amount: 42, staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', touchpoint: 'Front Desk', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2014', dateTime: '2026-05-20 11:30', amount: 22, staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', touchpoint: 'Receipt QR', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2012', dateTime: '2026-05-19 14:50', amount: 26, staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' }
]

const INITIAL_REVIEWS = [
  { id: 'R-1', rating: 5, comment: 'Mia shaped my Gel-X set perfectly and the chrome finish looks premium.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-25' },
  { id: 'R-2', rating: 5, comment: 'Vivian was fast, clean, and helped me pick a wedding color.', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Yelp)', date: '2026-05-25' },
  { id: 'R-3', rating: 2, comment: 'Great polish, but I waited 20 minutes after my appointment time.', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Internal Feedback', date: '2026-05-24' },
  { id: 'R-4', rating: 4, comment: 'Pedicure was relaxing and the salon was very clean.', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Good (Google)', date: '2026-05-23' },
  { id: 'R-5', rating: 1, comment: 'My color chipped after one day. I need someone to contact me.', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Internal Feedback', date: '2026-05-22' },
  { id: 'R-6', rating: 5, comment: 'Incredible attention to detail! Best Gel-X artist in the city.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Yelp)', date: '2026-05-24' },
  { id: 'R-7', rating: 5, comment: 'Vivian does the most natural looking acrylic sets!', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-8', rating: 5, comment: 'Ashley gives the absolute best foot massages during pedicures!', staffName: 'Ashley P.', staffId: 'NEX-STAFF-ASH0155', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-9', rating: 5, comment: 'Sofia is a master of nail art. She drew exactly what I showed her!', staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-10', rating: 4, comment: 'Love the shape, Mia is very sweet. Will definitely come back.', staffName: 'Mia T.', staffId: 'NEX-STAFF-MIA0123', category: 'Good (Google)', date: '2026-05-22' },
  { id: 'R-11', rating: 4, comment: 'Fast service and very friendly staff. Nice atmosphere.', staffName: 'Vivian L.', staffId: 'NEX-STAFF-VL8893', category: 'Good (Google)', date: '2026-05-21' },
  { id: 'R-12', rating: 3, comment: 'The nail art was beautiful, but the top coat was uneven.', staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', category: 'Internal Feedback', date: '2026-05-21' },
  { id: 'R-13', rating: 5, comment: 'Stunning designs and very professional service.', staffName: 'Hanna Ng.', staffId: 'NEX-STAFF-HN1148', category: 'Good (Yelp)', date: '2026-05-20' }
]

const INITIAL_TOUCHPOINTS = [
  { id: 'tp-main', name: 'Lobby Welcome QR', type: 'Business Main', isActive: true, scans: 245 },
  { id: 'tp-front', name: 'Front Desk', type: 'Front Desk', deviceId: 'NFC-001', isActive: true, scans: 842 },
  { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR', isActive: true, scans: 1102 },
  { id: 'tp-mani-3', name: 'Manicure Station 03', type: 'Table QR', isActive: true, scans: 748 },
  { id: 'tp-pedi-2', name: 'Pedicure Chair 02', type: 'Table QR', isActive: true, scans: 636 },
  { id: 'tp-receipt', name: 'Receipt QR', type: 'Receipt QR', isActive: true, scans: 436 },
  { id: 'tp-vip', name: 'VIP Pedicure Room', type: 'Business Main', deviceId: 'NFC-VIP', isActive: true, scans: 312 },
  { id: 'tp-nail-2', name: 'Nail Art Station 02', type: 'Table QR', isActive: true, scans: 195 },
  { id: 'tp-acrylic-1', name: 'Acrylic Station 01', type: 'Table QR', isActive: true, scans: 280 }
]

const INITIAL_DEVICES = [
  { id: '1', deviceId: 'NFC-001', type: 'NFC Stand', location: 'Front Desk', isActive: true, lastScan: 'Today', scans: 142 },
  { id: '2', deviceId: 'QR-Table-01', type: 'QR Card', location: 'Table 01', isActive: true, lastScan: 'Today', scans: 95 },
  { id: '3', deviceId: 'NFC-002', type: 'NFC Stand', location: 'Table 02', isActive: true, lastScan: 'Yesterday', scans: 88 },
  { id: '4', deviceId: 'QR-Table-03', type: 'QR Card', location: 'Table 03', isActive: false, lastScan: 'N/A', scans: 0 },
  { id: '5', deviceId: 'NFC-Sticker-01', type: 'NFC Sticker', location: 'Mirror 01', isActive: true, lastScan: 'Today', scans: 210 }
]

const STAFF_PERFORMANCE = [
  { name: 'Mia Tran', nickname: 'Mia T.', tips: 612.3, rating: 4.86, reviews: 58, pct: 100, specialty: 'Gel-X' },
  { name: 'Vivian Le', nickname: 'Vivian L.', tips: 487.45, rating: 4.72, reviews: 47, pct: 80, specialty: 'Acrylic' },
  { name: 'Ashley Park', nickname: 'Ashley P.', tips: 402.1, rating: 4.69, reviews: 39, pct: 66, specialty: 'Pedicure' },
  { name: 'Hanna Nguyen', nickname: 'Hanna Ng.', tips: 318.25, rating: 4.61, reviews: 28, pct: 52, specialty: 'Nail Art' },
  { name: 'Hannah Kim', nickname: 'Hannah K.', tips: 276.58, rating: 4.57, reviews: 24, pct: 45, specialty: 'Dip Powder' }
]

const TOP_TOUCHPOINTS = [
  { name: 'Manicure Station 01', type: 'QR', scans: 1102, conversion: 24.6 },
  { name: 'Front Desk Checkout', type: 'QR', scans: 842, conversion: 18.7 },
  { name: 'Pedicure Chair 02', type: 'QR', scans: 636, conversion: 16.8 },
  { name: 'Receipt Bottom QR', type: 'QR', scans: 436, conversion: 15.1 }
]

const MENU_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard, image: '/assets/menu/conversion.png' },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'tips', label: 'Tips', icon: Wallet, image: '/assets/menu/tips.png' },
  { id: 'reviews', label: 'Reviews', icon: Star, image: '/assets/menu/review.png' },
  { id: 'reports', label: 'Transactions', icon: ClipboardList },
  { id: 'touchpoints', label: 'Touch Points', icon: Pointer },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, image: '/assets/menu/star.png' },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: HelpCircle }
]

const visibleMenuItems = MENU_ITEMS

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

function walletLabels(accounts) {
  return Object.entries(accounts)
    .filter(([, value]) => value)
    .map(([key]) => ({ venmo: 'Venmo', cashapp: 'Cash App', zelle: 'Zelle', vlinkpay: 'VLINKPAY' }[key]))
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseMetricValue(value) {
  const text = String(value)
  const number = Number(text.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(number) ? number : 0
}

function formatAnimatedValue(template, value) {
  const text = String(template)
  if (text.includes('$')) return formatCurrency(value)
  if (text.includes('%')) return `${value.toFixed(2)}%`
  if (text.includes('.')) return value.toFixed(2).replace(/\.00$/, '')
  return Math.round(value).toLocaleString()
}

function useCountUp(target, duration = 900) {
  const numericTarget = useMemo(() => parseMetricValue(target), [target])
  const [value, setValue] = useState(0)

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setValue(numericTarget)
      return undefined
    }

    let frameId
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(numericTarget * eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [duration, numericTarget])

  return formatAnimatedValue(target, value)
}

function Panel({ children, className = '' }) {
  return (
    <section className={`nexora-card ${className}`}>
      {children}
    </section>
  )
}

function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`nexora-icon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

function MenuIcon({ item, active = false }) {
  const Icon = item.icon
  return <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-white/60'}`} />
}

function DashboardHeader({ 
  searchQuery, 
  setSearchQuery, 
  onAddTouchpoint, 
  profile,
  businessName,
  onNavigateSettingsTab,
  onLogout,
  notifications,
  setNotifications,
  isNotiDropdownOpen,
  setIsNotiDropdownOpen,
  onNavigateMenu,
  staff,
  transactions,
  reviews,
  touchpoints,
  onViewStaffDetail
}) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const dropdownRef = useRef(null)
  const searchRef = useRef(null)
  const headerDropdownRef = useRef(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotiDropdownOpen(false)
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false)
      }
      if (headerDropdownRef.current && !headerDropdownRef.current.contains(event.target)) {
        setIsHeaderDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [setIsNotiDropdownOpen, setIsSearchFocused, setIsHeaderDropdownOpen])

  const unreadCount = notifications ? notifications.filter((n) => !n.read).length : 0

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem('nexora_notifications', JSON.stringify(updated))
  }

  const handleNotificationClick = (item) => {
    const updated = notifications.map((n) => n.id === item.id ? { ...n, read: true } : n)
    setNotifications(updated)
    localStorage.setItem('nexora_notifications', JSON.stringify(updated))
    setIsNotiDropdownOpen(false)
    if (item.linkTab) {
      onNavigateMenu(item.linkTab)
    }
  }

  // Calculate search suggestions
  const suggestions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    if (!query) return null

    const matchedStaff = (staff || []).filter(s => 
      s.fullName.toLowerCase().includes(query) ||
      s.nickname.toLowerCase().includes(query) ||
      s.position.toLowerCase().includes(query)
    ).slice(0, 3)

    const matchedTxs = (transactions || []).filter(tx => 
      tx.id.toLowerCase().includes(query) ||
      tx.staffName.toLowerCase().includes(query) ||
      tx.touchpoint.toLowerCase().includes(query) ||
      String(tx.amount).includes(query)
    ).slice(0, 3)

    const matchedReviews = (reviews || []).filter(r => 
      r.comment.toLowerCase().includes(query) ||
      r.staffName.toLowerCase().includes(query) ||
      String(r.rating).includes(query)
    ).slice(0, 3)

    const matchedTps = (touchpoints || []).filter(tp => 
      tp.name.toLowerCase().includes(query) ||
      tp.type.toLowerCase().includes(query)
    ).slice(0, 3)

    const totalCount = matchedStaff.length + matchedTxs.length + matchedReviews.length + matchedTps.length

    return {
      staff: matchedStaff,
      transactions: matchedTxs,
      reviews: matchedReviews,
      touchpoints: matchedTps,
      totalCount
    }
  }, [searchQuery, staff, transactions, reviews, touchpoints])

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-nexoraBorder bg-nexoraSurface px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3 sm:hidden">
        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-9 w-9 shrink-0 object-contain" />
        <span className="truncate text-sm font-extrabold">NEXORA TOUCH</span>
      </div>

      {/* Search Input with Suggestions Dropdown */}
      <div className="relative hidden w-full max-w-[385px] sm:block" ref={searchRef}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
        <input
          className="nexora-search-input"
          placeholder={t('dashboard.header.search_placeholder')}
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value)
            setIsSearchFocused(true)
          }}
          onFocus={() => setIsSearchFocused(true)}
        />

        {isSearchFocused && searchQuery.trim() !== '' && (
          <div className="absolute left-0 right-0 mt-2 max-h-[380px] overflow-y-auto rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 py-2 divide-y divide-nexoraBorder animate-fadeIn">
            
            {/* Staff Group */}
            {suggestions?.staff?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Staff / Kỹ thuật viên
                </div>
                {suggestions.staff.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      onViewStaffDetail(member.id)
                      onNavigateMenu('staff')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                      <span className="font-bold text-nexoraText">{member.fullName}</span>
                      <span className="text-[10px] text-nexoraMuted">({member.position})</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">Xem Chi Tiết ›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Transactions Group */}
            {suggestions?.transactions?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Transactions / Giao dịch
                </div>
                {suggestions.transactions.map(tx => (
                  <button
                    key={tx.id}
                    type="button"
                    onClick={() => {
                      onNavigateMenu('reports')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <ClipboardList className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                      <span className="font-bold text-nexoraText">{tx.id}</span>
                      <span className="text-[10px] text-nexoraMuted">({tx.staffName} - ${tx.amount})</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">Xem GD ›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Reviews Group */}
            {suggestions?.reviews?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Reviews / Đánh giá
                </div>
                {suggestions.reviews.map(rev => (
                  <button
                    key={rev.id}
                    type="button"
                    onClick={() => {
                      onNavigateMenu('reviews')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 shrink-0" />
                      <span className="font-bold text-nexoraText">{rev.rating}★</span>
                      <span className="text-[10px] text-nexoraMuted truncate">"{rev.comment}"</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider shrink-0 ml-2">Xem ›</span>
                  </button>
                ))}
              </div>
            )}

            {/* Touchpoints Group */}
            {suggestions?.touchpoints?.length > 0 && (
              <div className="py-2">
                <div className="px-4 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">
                  Touchpoints / Điểm chạm
                </div>
                {suggestions.touchpoints.map(tp => (
                  <button
                    key={tp.id}
                    type="button"
                    onClick={() => {
                      onNavigateMenu('touchpoints')
                      setIsSearchFocused(false)
                      setSearchQuery('')
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-nexoraCanvas flex items-center justify-between text-xs transition"
                  >
                    <div className="flex items-center gap-2">
                      <Pointer className="h-3.5 w-3.5 text-nexoraBrand shrink-0" />
                      <span className="font-bold text-nexoraText">{tp.name}</span>
                      <span className="text-[10px] text-nexoraMuted">({tp.type})</span>
                    </div>
                    <span className="text-[10px] font-bold text-nexoraBrand uppercase tracking-wider">Xem ›</span>
                  </button>
                ))}
              </div>
            )}

            {suggestions?.totalCount === 0 && (
              <div className="py-6 text-center text-xs text-nexoraSubtle">
                Không tìm thấy kết quả nào trùng khớp.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-4">
        {/* Language Switcher */}
        <div className="flex items-center gap-1 bg-nexoraSurfaceMuted border border-nexoraBorder px-2.5 py-1 rounded-lg">
          <button 
            type="button"
            onClick={() => setLanguage('vi')}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${currentLanguage === 'vi' ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-nexoraText'}`}
          >
            VI
          </button>
          <span className="text-nexoraBorder text-[10px]">|</span>
          <button 
            type="button"
            onClick={() => setLanguage('en')}
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded transition ${currentLanguage === 'en' ? 'bg-nexoraBrand text-white' : 'text-nexoraMuted hover:text-nexoraText'}`}
          >
            EN
          </button>
        </div>

        {/* Notifications Icon and Dropdown */}
        <div className="relative hidden sm:inline-flex" ref={dropdownRef}>
          <IconButton 
            label="Notifications" 
            onClick={() => setIsNotiDropdownOpen(!isNotiDropdownOpen)} 
            className="relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[9px] font-black text-white bg-red-500 ring-2 ring-white shadow-sm">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </IconButton>

          {isNotiDropdownOpen && (
            <div className="absolute right-0 mt-12 w-80 max-h-[460px] flex flex-col rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 animate-fadeIn overflow-hidden">
              <div className="flex items-center justify-between border-b border-nexoraBorder px-4 py-3 bg-nexoraSurfaceMuted">
                <span className="text-xs font-black uppercase text-nexoraText tracking-wider">
                  {t('dashboard.notifications.title') || 'Thông báo'} ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="text-[10px] font-bold text-nexoraBrand hover:underline"
                  >
                    {t('dashboard.notifications.mark_all_read') || 'Đọc tất cả'}
                  </button>
                )}
              </div>
              <div className="flex-grow overflow-y-auto max-h-[380px] divide-y divide-nexoraBorder">
                {notifications && notifications.length > 0 ? (
                  notifications.map((item) => {
                    const IconComponent = {
                      tip_success: Wallet,
                      feedback_alert: AlertTriangle,
                      review_good: Star
                    }[item.type] || Bell

                    const iconColor = {
                      tip_success: 'bg-emerald-500 text-white',
                      feedback_alert: 'bg-amber-500 text-white',
                      review_good: 'bg-luxuryGold text-white'
                    }[item.type] || 'bg-nexoraBrand text-white'

                    const isUnread = !item.read
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleNotificationClick(item)}
                        className={`w-full text-left p-3.5 hover:bg-nexoraCanvas transition-colors flex gap-3 items-start border-b border-nexoraBorder/50 last:border-0 relative ${
                          isUnread ? 'bg-nexoraBrandSoft/40' : 'bg-white'
                        }`}
                      >
                        <span className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${iconColor} ${
                          !isUnread ? 'opacity-60' : ''
                        }`}>
                          <IconComponent className="h-4 w-4" />
                        </span>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`text-xs truncate ${
                              isUnread ? 'font-extrabold text-nexoraText' : 'font-bold text-nexoraMuted'
                            }`}>
                              {item.title}
                            </span>
                            <span className="text-[10px] text-nexoraSubtle shrink-0 font-medium">{item.time}</span>
                          </div>
                          <p className={`text-[11px] leading-normal mt-1 break-words ${
                            isUnread ? 'font-semibold text-nexoraText' : 'font-medium text-nexoraMuted'
                          }`}>
                            {item.message}
                          </p>
                        </div>
                      </button>
                    )
                  })
                ) : (
                  <div className="py-12 text-center text-nexoraSubtle flex flex-col items-center justify-center">
                    <Bell className="h-8 w-8 text-nexoraBorder mb-2" />
                    <p className="text-xs font-semibold">{t('dashboard.notifications.empty') || 'Không có thông báo mới.'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative hidden sm:inline-flex" ref={headerDropdownRef}>
          <button
            type="button"
            onClick={() => setIsHeaderDropdownOpen(!isHeaderDropdownOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder overflow-hidden shadow-nexora-soft transition hover:opacity-90 focus:outline-none"
            aria-label="Profile menu"
            title="Profile menu"
            id="header-profile-menu-btn"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-nexoraBrand text-sm font-bold text-white">
                {profile.fullName ? profile.fullName.charAt(0) : 'A'}
              </div>
            )}
          </button>

          {isHeaderDropdownOpen && (
            <div 
              className="absolute right-0 mt-12 w-64 rounded-xl border border-nexoraBorder bg-white shadow-2xl z-50 py-2 divide-y divide-nexoraRule animate-fadeIn"
              id="header-profile-dropdown"
            >
              <div className="px-4 py-2.5">
                <div className="text-xs font-black text-nexoraText truncate">{profile.fullName || businessName}</div>
                <div className="text-[10px] text-nexoraMuted truncate mt-0.5">{profile.email}</div>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateSettingsTab('profile')
                    setIsHeaderDropdownOpen(false)
                  }}
                  className="flex w-full items-center px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition text-left"
                >
                  {t('dashboard.menu.business_setting') || 'Business Setting'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigateSettingsTab('kyb')
                    setIsHeaderDropdownOpen(false)
                  }}
                  className="flex w-full items-center px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition text-left"
                >
                  {t('dashboard.menu.kyb') || 'Business Verification'}
                </button>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsHeaderDropdownOpen(false)
                    onLogout()
                  }}
                  className="flex w-full items-center px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition text-left"
                >
                  <LogOut className="h-3.5 w-3.5 mr-2 shrink-0" />
                  {t('dashboard.sidebar.sign_out') || 'Sign out'}
                </button>
              </div>
            </div>
          )}
        </div>
        <button onClick={onAddTouchpoint} className="nexora-primary-button">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('dashboard.header.add_tp')}</span>
        </button>
      </div>
    </header>
  )
}

function DashboardSidebar({ 
  activeMenu, 
  setActiveMenu, 
  businessName, 
  profile, 
  settingsTab, 
  setSettingsTab, 
  isProfileExpanded, 
  setIsProfileExpanded, 
  hasKyb = true, 
  verificationStatus = 'kyb_approved',
  onBlockedFeatureClick,
  onLogout,
  tipsTab = 'overview',
  setTipsTab,
  touchpointsTab = 'stations',
  setTouchpointsTab
}) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  const [isTipsExpanded, setIsTipsExpanded] = useState(activeMenu === 'tips')
  const [isTouchpointsExpanded, setIsTouchpointsExpanded] = useState(activeMenu === 'touchpoints')

  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsExpanded(true)
      setIsTouchpointsExpanded(false)
    } else if (activeMenu === 'touchpoints') {
      setIsTouchpointsExpanded(true)
      setIsTipsExpanded(false)
    }
  }, [activeMenu])

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
      {/* Logo block */}
      <div className="flex items-center gap-3 px-2">
        <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-12 w-12 shrink-0 object-contain shadow-nexora-soft" />
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none tracking-normal">{t('dashboard.sidebar.console_title')}</div>
          <div className="mt-1 text-sm font-semibold text-white/65">{t('dashboard.sidebar.console_subtitle')}</div>
        </div>
      </div>

      {/* Expandable Profile Card */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
          <div className="flex items-center gap-3 min-w-0">
            {profile.avatar ? (
              <img src={profile.avatar} alt="" className="h-10 w-10 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-extrabold">
                {profile.fullName ? profile.fullName.charAt(0) : businessName.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <div className="truncate text-xs font-black text-white/50 uppercase tracking-wider">{businessName}</div>
              <div className="flex items-center gap-1 min-w-0 mt-0.5">
                <div className="truncate text-sm font-bold text-white">{profile.fullName || businessName}</div>
              </div>
              <div className="text-[10px] text-white/40 truncate mt-0.5">{profile.email}</div>
            </div>
          </div>
          <div className="text-white/70 hover:text-white transition ml-2">
            {isProfileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        {/* Submenu links */}
        {isProfileExpanded && (
          <div className="mt-3.5 pt-3 border-t border-white/5 space-y-1 animate-fadeIn">
            <button
              onClick={() => {
                setActiveMenu('settings')
                setSettingsTab('profile')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === 'settings' && settingsTab === 'profile'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.business_setting') || 'Business Setting'}</span>
            </button>
            <button
              onClick={() => {
                setActiveMenu('settings')
                setSettingsTab('kyb')
              }}
              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                activeMenu === 'settings' && settingsTab === 'kyb'
                  ? 'text-brandCyan font-extrabold'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'kyb' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
              <span>{t('dashboard.menu.kyb') || 'Business Verification'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Card 2: Current Plan & Manage Plan */}
      <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/45">
          {t('dashboard.sidebar.current_plan_header') || 'CURRENT PLAN'}
        </div>
        {hasKyb ? (
          <>
            <div className="mt-1 text-sm font-black text-white">
              {t('dashboard.sidebar.plan_name') || 'Pro Plan'}
            </div>
            <div className="mt-1 text-xs text-white/55">
              {t('dashboard.sidebar.renews_text') || 'Renews on Jun 20, 2024'}
            </div>
          </>
        ) : (
          <div className="mt-1 text-xs font-semibold text-rose-400">
            {t('dashboard.sidebar.no_plan') || 'No current plan'}
          </div>
        )}
        <button 
          type="button"
          onClick={() => setActiveMenu('subscriptions')}
          className="mt-3.5 w-full rounded-lg border border-white/15 py-1.5 text-center text-xs font-bold text-luxuryGold hover:bg-white/5 hover:border-white/25 transition-all"
        >
          {t('dashboard.sidebar.manage_plan') || 'Manage Plan'}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {visibleMenuItems.map((item) => {
          const { id, label } = item
          const isActive = activeMenu === id
          const localizedLabel = {
            overview: t('dashboard.menu.dashboard'),
            staff: t('dashboard.menu.staff'),
            tips: t('dashboard.menu.tips'),
            reviews: t('dashboard.menu.reviews'),
            reports: t('dashboard.menu.transactions'),
            touchpoints: t('dashboard.menu.touchpoints'),
            devices: t('dashboard.menu.qr_nfc'),
            analytics: t('dashboard.menu.analytics'),
            support: t('dashboard.menu.support')
          }[id] || label

          return (
            <React.Fragment key={id}>
              <button
                onClick={() => {
                  if (verificationStatus !== 'kyb_approved' && (id === 'tips' || id === 'devices')) {
                    if (onBlockedFeatureClick) onBlockedFeatureClick()
                  } else {
                    setActiveMenu(id)
                    if (id === 'tips') {
                      setIsTipsExpanded(!isTipsExpanded)
                    }
                    if (id === 'touchpoints') {
                      setIsTouchpointsExpanded(!isTouchpointsExpanded)
                    }
                  }
                }}
                className={`flex h-12 w-full items-center justify-between rounded-lg px-4 text-left text-sm font-bold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] text-white shadow-lg shadow-[#2B59FF]/20'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <MenuIcon item={item} active={isActive} />
                  <span className="truncate">{localizedLabel}</span>
                </div>
                {(id === 'tips' || id === 'touchpoints') && (
                  <div className="text-white/50 shrink-0">
                    {id === 'tips' 
                      ? (isTipsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                      : (isTouchpointsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                    }
                  </div>
                )}
              </button>

              {id === 'tips' && isTipsExpanded && (
                <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3 animate-fadeIn">
                  {[
                    { id: 'overview', label: t('dashboard.tips.tabs.overview') || 'Overview' },
                    { id: 'savings', label: t('dashboard.tips.tabs.savings') || 'Direct Savings' },
                    { id: 'transactions', label: t('dashboard.tips.tabs.transactions') || 'Tip Transactions' },
                    { id: 'payouts', label: t('dashboard.tips.tabs.payouts') || 'Staff Payouts' }
                  ].map(sub => {
                    const isSubActive = activeMenu === 'tips' && tipsTab === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveMenu('tips')
                          setTipsTab(sub.id)
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                          isSubActive
                            ? 'text-brandCyan font-extrabold'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span>{sub.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}

              {id === 'touchpoints' && isTouchpointsExpanded && (
                <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3 animate-fadeIn">
                  {[
                    { id: 'stations', label: t('dashboard.touchpoints.tabs.stations') || 'QR Stations' },
                    { id: 'devices', label: t('dashboard.touchpoints.tabs.devices') || 'Hardware Devices' }
                  ].map(sub => {
                    const isSubActive = activeMenu === 'touchpoints' && touchpointsTab === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          setActiveMenu('touchpoints')
                          setTouchpointsTab(sub.id)
                        }}
                        className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                          isSubActive
                            ? 'text-brandCyan font-extrabold'
                            : 'text-white/60 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                        <span>{sub.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </nav>

      {/* Bottom Sign Out */}
      <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white w-full">
          <LogOut className="h-4 w-4" />
          {t('dashboard.sidebar.sign_out')}
        </button>
      </div>
    </aside>
  )
}

function PageTitle() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-2xl font-extrabold tracking-normal text-nexoraText sm:text-3xl">{t('dashboard.title')}</h1>
      <p className="mt-2 text-sm font-medium text-nexoraMuted sm:text-base">
        {t('dashboard.subtitle')}
      </p>
    </div>
  )
}

function KpiCard({ label, value, delta, active = false, onClick }) {
  const animatedValue = useCountUp(value)
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      className={`nexora-card p-5 text-left transition hover:-translate-y-0.5 hover:shadow-premium flex flex-col justify-between min-h-[140px] focus:outline-none ${
        active 
          ? 'border-nexoraBrand ring-1 ring-nexoraBrand bg-nexoraSurface' 
          : 'border-nexoraBorder bg-nexoraSurface'
      }`}
    >
      <div>
        <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
          {label}
        </div>
        <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
          {animatedValue}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
        <span>▲ {delta}</span>
        <span className="text-nexoraSubtle/80 font-semibold uppercase tracking-wider text-[10px]">
          {t('dashboard.kpi.vs_last_week') || 'vs last week'}
        </span>
      </div>
    </button>
  )
}

const TIP_SERIES_BY_RANGE = {
  '7 Days': [
    { label: 'Mon', value: 1200 },
    { label: 'Tue', value: 1900 },
    { label: 'Wed', value: 3000 },
    { label: 'Thu', value: 2500 },
    { label: 'Fri', value: 3800 },
    { label: 'Sat', value: 4200 },
    { label: 'Sun', value: 3500 }
  ],
  '30 Days': [
    { label: 'Week 1', value: 8200 },
    { label: 'Week 2', value: 10450 },
    { label: 'Week 3', value: 9800 },
    { label: 'Week 4', value: 12650 },
    { label: 'Today', value: 14200 }
  ],
  '90 Days': [
    { label: 'Jan', value: 24600 },
    { label: 'Feb', value: 28100 },
    { label: 'Mar', value: 26300 },
    { label: 'Apr', value: 31800 },
    { label: 'May', value: 35400 }
  ],
  '180 Days': [
    { label: 'Dec', value: 42600 },
    { label: 'Jan', value: 48100 },
    { label: 'Feb', value: 53600 },
    { label: 'Mar', value: 51200 },
    { label: 'Apr', value: 60400 },
    { label: 'May', value: 68800 }
  ],
  '365 Days': [
    { label: 'Q2 2025', value: 84000 },
    { label: 'Q3 2025', value: 97500 },
    { label: 'Q4 2025', value: 112800 },
    { label: 'Q1 2026', value: 128400 },
    { label: 'Q2 2026', value: 147600 }
  ]
}

function buildChartPoints(series) {
  const width = 680
  const height = 265
  if (!series || series.length === 0) {
    return { points: [], max: 0, width, height }
  }
  const maxValue = Math.max(...series.map((item) => item.value))
  const max = maxValue === 0 ? 1000 : Math.ceil(maxValue / 1000) * 1000
  const points = series.map((item, index) => ({
    ...item,
    x: series.length === 1 ? width / 2 : (index / (series.length - 1)) * width,
      y: height - (item.value / max) * height
  }))
  return { points, max, width, height }
}

function getBezierPath(points) {
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`
  
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const cp1x = p0.x + (p1.x - p0.x) / 3
    const cp1y = p0.y
    const cp2x = p0.x + 2 * (p1.x - p0.x) / 3
    const cp2y = p1.y
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
  }
  return d
}

function useTransitionedPoints(targetPoints, range, duration = 650) {
  const [currentPoints, setCurrentPoints] = useState(targetPoints)
  const currentPointsRef = useRef(currentPoints)

  useEffect(() => {
    currentPointsRef.current = currentPoints
  }, [currentPoints])

  useEffect(() => {
    const prevPoints = currentPointsRef.current
    
    let equal = prevPoints.length === targetPoints.length
    if (equal) {
      for (let i = 0; i < targetPoints.length; i++) {
        if (prevPoints[i].x !== targetPoints[i].x || prevPoints[i].y !== targetPoints[i].y || prevPoints[i].value !== targetPoints[i].value) {
          equal = false
          break
        }
      }
    }
    if (equal) return

    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setCurrentPoints(targetPoints)
      return undefined
    }

    const interpolatePoint = (points, t) => {
      if (points.length === 0) return { x: 0, y: 0, value: 0, label: '' }
      if (points.length === 1) return points[0]
      const index = t * (points.length - 1)
      const low = Math.floor(index)
      const high = Math.min(points.length - 1, Math.ceil(index))
      if (low === high) return points[low]
      const ratio = index - low
      const p1 = points[low]
      const p2 = points[high]
      return {
        x: p1.x + (p2.x - p1.x) * ratio,
        y: p1.y + (p2.y - p1.y) * ratio,
        value: p1.value + (p2.value - p1.value) * ratio,
        label: ratio > 0.5 ? p2.label : p1.label
      }
    }

    const startPoints = targetPoints.map((_, i) => {
      const t = targetPoints.length > 1 ? i / (targetPoints.length - 1) : 0.5
      return interpolatePoint(prevPoints, t)
    })

    let frameId
    const startTime = performance.now()

    const tick = (now) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      const nextPoints = targetPoints.map((target, i) => {
        const start = startPoints[i]
        return {
          ...target,
          x: start.x + (target.x - start.x) * eased,
          y: start.y + (target.y - start.y) * eased,
          value: start.value + (target.value - start.value) * eased
        }
      })

      setCurrentPoints(nextPoints)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [targetPoints, range, duration])

  return currentPoints
}

function TipsOverTimePanel({ range, setRange, hasKyb = true }) {
  const { t } = useTranslation()
  const chartRef = useRef(null)
  const [reveal, setReveal] = useState(0)
  const [hoverIndex, setHoverIndex] = useState(null)
  const series = hasKyb ? (TIP_SERIES_BY_RANGE[range] || TIP_SERIES_BY_RANGE['7 Days']) : []
  const { points: chartPoints, max, width, height } = useMemo(() => buildChartPoints(series), [series])
  
  // Two different morphing speeds: 600ms for sharp line, 900ms for elastic neon trail
  const transitionedPoints = useTransitionedPoints(chartPoints, range, 600)
  const trailPoints = useTransitionedPoints(chartPoints, range, 900)
  
  const linePath = getBezierPath(transitionedPoints)
  const trailPath = getBezierPath(trailPoints)
  const areaPath = transitionedPoints.length > 0
    ? `${linePath} L ${transitionedPoints[transitionedPoints.length - 1].x} ${height} L ${transitionedPoints[0].x} ${height} Z`
    : ''

  const yTicks = [max, Math.round(max * 0.75), Math.round(max * 0.5), Math.round(max * 0.25), 0]
  const revealX = width * reveal
  const showTooltip = hoverIndex !== null
  const activePoint = hoverIndex !== null 
    ? transitionedPoints[hoverIndex] 
    : transitionedPoints[transitionedPoints.length - 1] || { x: 0, y: 0, value: 0, label: '' }

  useEffect(() => {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      setReveal(1)
      return undefined
    }

    let frameId
    const start = performance.now()
    setReveal(0.02)
    const tick = (now) => {
      const progress = Math.min((now - start) / 920, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setReveal(eased)
      if (progress < 1) frameId = requestAnimationFrame(tick)
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [range])

  const handlePointerMove = (event) => {
    if (transitionedPoints.length === 0) return
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = (event.clientX - rect.left) / rect.width
    const bounded = Math.min(1, Math.max(0, next))
    const index = Math.round(bounded * (transitionedPoints.length - 1))
    setHoverIndex(index)
  }

  const handlePointerLeave = () => {
    setHoverIndex(null)
  }

  const rangeLabel = (item) => {
    return {
      '7 Days': t('dashboard.chart.7_days'),
      '30 Days': t('dashboard.chart.30_days'),
      '90 Days': t('dashboard.chart.90_days'),
      '180 Days': t('dashboard.chart.180_days'),
      '365 Days': t('dashboard.chart.365_days')
    }[item] || item
  }

  return (
    <Panel className="p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.chart.tips_over_time')}</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {Object.keys(TIP_SERIES_BY_RANGE).map((item) => (
            <button
              key={item}
              onClick={() => setRange(item)}
              className={`min-h-8 rounded-lg px-3 text-xs font-bold transition ${range === item ? 'bg-nexoraBrand text-white' : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:text-nexoraText'}`}
            >
              {rangeLabel(item)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-8 grid grid-cols-[42px_1fr] gap-2 sm:grid-cols-[56px_1fr] sm:gap-3">
        <div className="flex h-[235px] sm:h-[270px] flex-col justify-between text-right text-sm text-nexoraSubtle">
          {yTicks.map((tick, index) => (
            <span key={`${tick}-${index}`}>{formatCurrency(tick).replace('.00', '')}</span>
          ))}
        </div>
        <div
          ref={chartRef}
          className="dashboard-scrub-chart relative h-[260px] min-w-0 cursor-crosshair touch-pan-y select-none sm:h-[300px]"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <div className="relative h-[235px] w-full sm:h-[270px]">
            <svg className="h-full w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
              <defs>
                <linearGradient id="tips-chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4648D8" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4648D8" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="tips-chart-line-grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#4648D8" />
                  <stop offset="50%" stopColor="#6C5CE7" />
                  <stop offset="100%" stopColor="#32D7FF" />
                </linearGradient>
                <filter id="tips-chart-glow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#4648D8" floodOpacity="0.22" />
                </filter>
                <filter id="tips-chart-neon-blur" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
                <clipPath id={`tips-chart-reveal-${range.replace(/\s+/g, '-')}`}>
                  <rect x="0" y="-10" width={revealX} height={height + 20} />
                </clipPath>
              </defs>
              {yTicks.map((tick, index) => {
                const yVal = max === 0 ? height : height - (tick / max) * height
                return (
                  <line
                    key={`${tick}-${index}`}
                    x1="0"
                    x2={width}
                    y1={yVal}
                    y2={yVal}
                    className="stroke-slate-300 dark:stroke-slate-700"
                    strokeWidth="1"
                    strokeOpacity={0.07}
                  />
                )
              })}
              <g clipPath={`url(#tips-chart-reveal-${range.replace(/\s+/g, '-')})`}>
                <path d={areaPath} fill="url(#tips-chart-area-grad)" className="dashboard-chart-area" />
                {/* Secondary delayed neon trail */}
                {trailPath && (
                  <path
                    d={trailPath}
                    fill="none"
                    stroke="url(#tips-chart-line-grad)"
                    strokeWidth="8"
                    opacity="0.25"
                    filter="url(#tips-chart-neon-blur)"
                    className="pointer-events-none"
                  />
                )}
                {/* Main Line path with dashoffset draw animation */}
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="url(#tips-chart-line-grad)" 
                  strokeWidth="4" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  filter="url(#tips-chart-glow)" 
                  style={{
                    strokeDasharray: 850,
                    strokeDashoffset: 850 * (1 - reveal),
                  }}
                />
              </g>
              {showTooltip && (
                <>
                  {/* Vertical solid guide line from reference image */}
                  <line
                    x1={activePoint.x}
                    x2={activePoint.x}
                    y1="0"
                    y2={height}
                    className="stroke-slate-200 dark:stroke-slate-700"
                    strokeWidth="1.5"
                    style={{
                      transition: 'x1 150ms cubic-bezier(0.16, 1, 0.3, 1), x2 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                </>
              )}
            </svg>

            {/* Regular data points that pop up as the line sweeps over them (rendered as HTML to prevent distortion) */}
            {transitionedPoints.map((point, index) => {
              const pointProgress = point.x / width;
              const isRevealed = reveal >= pointProgress;
              return (
                <div
                  key={`${point.label}-${index}`}
                  className="pointer-events-none absolute h-2.5 w-2.5 rounded-full border-[2.5px] border-nexoraBrand bg-white shadow-sm transition-transform duration-300"
                  style={{
                    left: `calc(${(point.x / width) * 100}% - 5px)`,
                    top: `calc(${(point.y / height) * 100}% - 5px)`,
                    transform: isRevealed ? 'scale(1)' : 'scale(0)',
                    transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: 8
                  }}
                />
              )
            })}

            {/* Active tooltip dots (rendered as HTML to prevent distortion) */}
            {showTooltip && (
              <div
                className="pointer-events-none absolute flex items-center justify-center"
                style={{
                  width: '32px',
                  height: '32px',
                  left: `calc(${(activePoint.x / width) * 100}% - 16px)`,
                  top: `calc(${(activePoint.y / height) * 100}% - 16px)`,
                  transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1), top 150ms cubic-bezier(0.16, 1, 0.3, 1)',
                  zIndex: 9
                }}
              >
                {/* Animated outer glow ring */}
                <div className="absolute h-6.5 w-6.5 rounded-full bg-nexoraBrand/20" />
                {/* Main active dot (solid blue circle with white outline) */}
                <div className="h-4 w-4 rounded-full border-[3px] border-white bg-nexoraBrand shadow-md" />
              </div>
            )}

            {/* Custom Dark Tooltip Pill from reference image */}
            <div
              className="pointer-events-none absolute rounded-lg bg-slate-900 px-4 py-2.5 shadow-2xl text-center"
              style={{
                width: '124px',
                left: `clamp(0px, calc(${(activePoint.x / width) * 100}% - 62px), calc(100% - 124px))`,
                top: `clamp(4px, calc(${(activePoint.y / height) * 100}% - 65px), calc(100% - 70px))`,
                opacity: showTooltip ? 1 : 0,
                transform: showTooltip ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.95)',
                transition: 'left 150ms cubic-bezier(0.16, 1, 0.3, 1), top 150ms cubic-bezier(0.16, 1, 0.3, 1), opacity 150ms ease, transform 150ms ease',
                zIndex: 10
              }}
            >
              <div className="text-xs font-bold text-white">{t('dashboard.chart.tooltip_tips')} : {formatCurrency(activePoint.value).replace('.00', '')}</div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-sm font-medium text-nexoraSubtle">
            {series.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function StaffLeaderboardPanel({ selectedStaff, setSelectedStaff, hasKyb = true }) {
  const { t } = useTranslation()
  const rows = hasKyb ? STAFF_PERFORMANCE.slice(0, 4) : []
  const avatarClasses = ['bg-nexoraBrand text-white', 'bg-indigo-500 text-white', 'bg-nexoraLavender text-white', 'bg-indigo-200 text-white']

  return (
    <Panel className="p-7">
      <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.leaderboard.title')}</h2>
      <div className="mt-7 space-y-7">
        {rows.map((member, index) => (
          <button
            key={member.name}
            onClick={() => setSelectedStaff(member.nickname)}
            className={`dashboard-list-row grid w-full grid-cols-[40px_minmax(0,1fr)] items-center gap-3 rounded-lg p-2 text-left transition hover:bg-nexoraSurfaceMuted sm:grid-cols-[48px_minmax(0,1fr)_88px_72px] sm:gap-4 ${selectedStaff === member.nickname ? 'bg-nexoraBrandSoft' : ''}`}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${avatarClasses[index]}`}>
              {member.name.split(' ').map((part) => part[0]).join('')}
            </span>
            <span className="truncate text-lg font-semibold text-nexoraText">{index === 2 ? 'Ashley P...' : index === 3 ? 'Hanna Ng...' : member.name}</span>
            <span className="hidden text-lg font-bold text-nexoraText sm:block">{formatCurrency(member.tips)}</span>
            <span className="flex items-center gap-1 text-sm font-bold text-nexoraWarning">
              <Star className="h-4 w-4 fill-current" />
              {member.rating}
            </span>
          </button>
        ))}
      </div>
    </Panel>
  )
}

function TopTouchPointsPanel({ onOpen }) {
  const { t } = useTranslation()
  return (
    <Panel className="p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.top_touchpoints.title')}</h2>
        <button onClick={onOpen} className="text-xs font-extrabold text-nexoraBrand">{t('dashboard.top_touchpoints.manage')}</button>
      </div>
      <div className="mt-8 space-y-0">
        {TOP_TOUCHPOINTS.slice(0, 3).map((point) => (
          <button key={point.name} onClick={onOpen} className="dashboard-list-row grid w-full grid-cols-[minmax(0,1fr)_74px] items-center gap-3 border-b border-nexoraRule py-4 text-left text-sm transition hover:bg-nexoraSurfaceMuted last:border-0 sm:grid-cols-[minmax(0,1fr)_74px_82px] sm:text-base">
            <span className="font-medium leading-snug text-nexoraText">{point.name}</span>
            <span className="text-nexoraMuted">{t('dashboard.top_touchpoints.scans', { count: point.scans })}</span>
            <span className="hidden font-medium text-nexoraSuccess sm:block">{t('dashboard.top_touchpoints.conversion', { pct: point.conversion })}</span>
          </button>
        ))}
      </div>
    </Panel>
  )
}

function ReviewRoutingPanel({ onOpen }) {
  const { t } = useTranslation()
  return (
    <Panel className="p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.menu.reviews')}</h2>
        <button onClick={onOpen} className="text-xs font-extrabold text-nexoraBrand">{t('dashboard.top_touchpoints.manage')}</button>
      </div>
      <div className="mt-8 space-y-4">
        <div className="flex h-14 items-center justify-between rounded-lg bg-nexoraBrandSoft px-5 text-base font-medium text-blue-700">
          <span>4-5<span className="text-luxuryGold ml-flox-4 inline-block font-normal">★</span> to Google/Yelp</span>
          <ArrowRight className="h-5 w-5" />
        </div>
        <div className="flex h-14 items-center justify-between rounded-lg bg-nexoraBrand px-5 text-base font-medium text-white">
          <span>1-3<span className="text-luxuryGold ml-flox-4 inline-block font-normal">★</span> private recovery</span>
          <ShieldAlert className="h-5 w-5" />
        </div>
        <p className="pt-2 text-sm font-medium leading-6 text-nexoraMuted">
          {t('dashboard.settings_panel.routing_policy')}
        </p>
      </div>
    </Panel>
  )
}

function LiveActivityPanel() {
  const { t } = useTranslation()
  const activities = [
    { label: t('dashboard.activity.station_scanned', { station: '03' }), time: '2:45 PM', tone: 'bg-nexoraBrand' },
    { label: t('dashboard.activity.vip_nfc_tapped'), time: '2:31 PM', tone: 'bg-nexoraWarning' },
    { label: t('dashboard.activity.five_star_routed'), time: '2:28 PM', tone: 'bg-nexoraBrand' }
  ]

  return (
    <Panel className="p-7">
      <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">{t('dashboard.menu.analytics')}</h2>
      <div className="mt-8 space-y-6">
        {activities.map((activity) => (
          <div key={activity.label} className="dashboard-list-row grid grid-cols-[14px_minmax(0,1fr)_64px] items-center gap-3 text-base">
            <span className={`dashboard-pulse-dot h-2.5 w-2.5 rounded-full ${activity.tone}`} />
            <span className="font-medium text-nexoraText">{activity.label}</span>
            <span className="text-right text-sm font-semibold text-nexoraMuted">{activity.time}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function renderStars(rating) {
  const stars = []
  for (let i = 1; i <= 5; i++) {
    const fillPercentage = Math.max(0, Math.min(1, rating - i + 1))
    stars.push(
      <div key={i} className="relative inline-block h-4 w-4 text-gray-200">
        <Star className="absolute top-0 left-0 h-4 w-4 text-amber-400 opacity-30" />
        {fillPercentage > 0 && (
          <div 
            className="absolute top-0 left-0 overflow-hidden h-4 text-amber-400" 
            style={{ width: `${fillPercentage * 100}%` }}
          >
            <Star className="h-4 w-4 fill-current text-amber-400" />
          </div>
        )}
      </div>
    )
  }
  return <div className="flex gap-0.5">{stars}</div>
}

function Overview({ 
  metrics, 
  activeKpi, 
  setActiveKpi, 
  chartRange, 
  setChartRange, 
  selectedStaff, 
  setSelectedStaff, 
  onOpenTouchpoints, 
  onOpenReviews, 
  businessName, 
  previewQr, 
  hasKyb = true 
}) {
  const { currentLanguage, t } = useTranslation()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const dateRangeOptions = [
    { value: '7 Days', label: currentLanguage === 'vi' ? '20 thg 5 - 26 thg 5, 2024' : 'May 20 - May 26, 2024' },
    { value: '30 Days', label: currentLanguage === 'vi' ? '27 thg 4 - 26 thg 5, 2024' : 'Apr 27 - May 26, 2024' },
    { value: '90 Days', label: currentLanguage === 'vi' ? '27 thg 2 - 26 thg 5, 2024' : 'Feb 27 - May 26, 2024' },
    { value: '180 Days', label: currentLanguage === 'vi' ? '28 thg 11, 2023 - 26 thg 5, 2024' : 'Nov 28, 2023 - May 26, 2024' },
    { value: '365 Days', label: currentLanguage === 'vi' ? '27 thg 5, 2023 - 26 thg 5, 2024' : 'May 27, 2023 - May 26, 2024' }
  ]

  const selectedOption = dateRangeOptions.find((opt) => opt.value === chartRange) || dateRangeOptions[0]

  return (
    <div className="space-y-8">
      {/* Header Overview Row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" ref={dropdownRef}>
        <h1 className="text-xl font-extrabold tracking-tight text-nexoraText uppercase">
          {t('dashboard.overview_title') || 'Dashboard Overview'}
        </h1>
        <div className="relative">
          <button 
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="inline-flex h-10 items-center justify-between gap-3 rounded-lg border border-nexoraBorder bg-white px-4 py-2 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-nexoraMuted" />
              <span>{selectedOption.label}</span>
            </div>
            <span className="text-nexoraMuted">▼</span>
          </button>
          
          {isDropdownOpen && (
            <div className="absolute right-0 mt-1 z-30 w-64 rounded-lg border border-nexoraBorder bg-white py-1 shadow-lg">
              {dateRangeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setChartRange(opt.value)
                    setIsDropdownOpen(false)
                  }}
                  className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-bold transition hover:bg-nexoraSurfaceMuted ${
                    chartRange === opt.value ? 'text-nexoraBrand bg-nexoraCanvas' : 'text-nexoraText'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[10px] text-nexoraMuted uppercase tracking-wider">{opt.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard 
          label={t('dashboard.kpi.total_tips')} 
          value={formatCurrency(metrics.totalTips)} 
          delta="18.5%" 
          active={activeKpi === 'tips'} 
          onClick={() => setActiveKpi('tips')} 
        />
        <KpiCard 
          label={t('dashboard.kpi.total_transactions')} 
          value={metrics.totalTransactions.toString()} 
          delta="16.7%" 
          active={activeKpi === 'transactions'} 
          onClick={() => setActiveKpi('transactions')} 
        />
        <KpiCard 
          label={t('dashboard.kpi.avg_tip')} 
          value={formatCurrency(metrics.averageTip)} 
          delta="9.3%" 
          active={activeKpi === 'avg_tip'} 
          onClick={() => setActiveKpi('avg_tip')} 
        />
        <KpiCard 
          label={t('dashboard.kpi.total_reviews')} 
          value={metrics.totalReviews.toString()} 
          delta="20.4%" 
          active={activeKpi === 'reviews'} 
          onClick={() => setActiveKpi('reviews')} 
        />
      </div>

      {/* Panels Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <TipsOverTimePanel range={chartRange} setRange={setChartRange} hasKyb={hasKyb} />
        <StaffLeaderboardPanel selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} hasKyb={hasKyb} />
      </div>

      {/* Master Gateways Panel */}
      <Panel className="p-7">
        <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider">
          {t('dashboard.master_gateway.title') || 'Master QR & NFC Gateways'}
        </h2>
        <p className="mt-1 text-xs text-nexoraMuted">
          {t('dashboard.master_gateway.subtitle') || 'Quick access welcome points for direct customer engagement.'}
        </p>
        
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Master QR section */}
          <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5 flex flex-col md:flex-row justify-between gap-5">
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
                    <QrCode className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-nexoraText">
                      {t('dashboard.master_gateway.qr_title') || 'Master Store QR'}
                    </h3>
                    <p className="text-[10px] text-nexoraMuted">
                      {t('dashboard.master_gateway.qr_desc') || 'Lobby entrance / general pool tips'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-normal text-nexoraMuted">
                  {t('dashboard.master_gateway.qr_body') || 'Place this QR code at the reception desk. Customers scan to choose their technician and submit reviews.'}
                </p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <button 
                  type="button"
                  onClick={() => previewQr({ name: 'Master Welcome QR', subtitle: 'Store Main Portal', slug: 'general', isActive: true })}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_open') || 'Open QR'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(
                      `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`
                    )}`
                    const link = document.createElement('a')
                    link.href = qrUrl
                    link.download = 'master-qr.png'
                    link.target = '_blank'
                    link.click()
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_download') || 'Download QR'}
                </button>
              </div>
            </div>
            
            {/* Visual QR mockup thumbnail */}
            <div 
              onClick={() => previewQr({ name: 'Master Welcome QR', subtitle: 'Store Main Portal', slug: 'general', isActive: true })}
              className="flex-shrink-0 mx-auto md:mx-0 w-28 h-28 rounded-lg bg-white border border-nexoraBorder/80 p-2 flex items-center justify-center shadow-sm relative overflow-hidden cursor-pointer hover:border-nexoraBrand transition select-none group"
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`
                )}`}
                alt="Master QR Code Preview"
                className="h-full w-full object-contain group-hover:scale-105 transition duration-200"
              />
              <div className="absolute inset-0 bg-nexoraBrand/80 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-1 text-white select-none">
                <QrCode className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
              </div>
            </div>
          </div>
          
          {/* Master NFC section */}
          <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-5 flex flex-col md:flex-row justify-between gap-5">
            <div className="flex-grow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-nexoraText">
                      {t('dashboard.master_gateway.nfc_title') || 'Master NFC Tag'}
                    </h3>
                    <p className="text-[10px] text-nexoraMuted">
                      {t('dashboard.master_gateway.nfc_desc') || 'Contactless desk pucks / smart signs'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs leading-normal text-nexoraMuted">
                  {t('dashboard.master_gateway.nfc_body') || 'Write the customer portal link to physical NFC tags. Customers tap their smartphones to pay tips and write reviews instantly.'}
                </p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-2">
                <button 
                  type="button"
                  onClick={() => {
                    const nfcUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`
                    navigator.clipboard.writeText(nfcUrl)
                    alert('Copied NFC redirect link to clipboard!')
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-white border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted transition cursor-pointer"
                >
                  <Pointer className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_copy_link') || 'Copy Link'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const slugify = (str) => str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                    const configData = {
                      version: "1.0",
                      platform: "nexora-touch",
                      businessName: businessName,
                      gatewayUrl: `${window.location.origin}${window.location.pathname}?flow=customer&tech=general&biz=${encodeURIComponent(businessName)}`,
                      nfcTagId: "master-nfc-general"
                    }
                    const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = `${slugify(businessName)}-nfc-config.json`
                    link.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark transition cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  {t('dashboard.master_gateway.btn_download_config') || 'Download Config'}
                </button>
              </div>
            </div>
            
            {/* Visual NFC puck mockup */}
            <div className="flex-shrink-0 mx-auto md:mx-0 w-28 h-28 rounded-lg bg-white border border-nexoraBorder/80 p-3 flex flex-col items-center justify-center shadow-sm relative overflow-hidden select-none">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400/10 to-amber-500/20 border border-dashed border-amber-500/40 flex items-center justify-center animate-pulse">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
                  <Sparkles className="h-[18px] w-[18px]" />
                </span>
              </div>
              <div className="text-[9px] font-black uppercase text-amber-600 tracking-widest mt-2 animate-pulse">
                NFC Active
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Review KPI Cards (Bottom Grid) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Google Reviews */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.google_reviews')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.googleRating}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {renderStars(metrics.googleRating)}
            <div className="text-xs text-nexoraMuted mt-0.5">
              {t('dashboard.review_kpi.reviews_count', { count: metrics.googleReviews })}
            </div>
          </div>
        </Panel>

        {/* Yelp Reviews */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.yelp_reviews')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.yelpRating}
            </div>
          </div>
          <div className="mt-4 space-y-1">
            {renderStars(metrics.yelpRating)}
            <div className="text-xs text-nexoraMuted mt-0.5">
              {t('dashboard.review_kpi.reviews_count', { count: metrics.yelpReviews })}
            </div>
          </div>
        </Panel>

        {/* Response Rate */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.response_rate')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.responseRate}%
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span>{t('dashboard.review_kpi.great') || 'Great!'}</span>
          </div>
        </Panel>

        {/* Returning Customers */}
        <Panel className="p-5 flex flex-col justify-between min-h-[140px] hover:shadow-premium transition">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.review_kpi.returning_customers')}
            </div>
            <div className="mt-2 text-2xl font-black text-nexoraText tracking-tight">
              {metrics.returningCustomers}%
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span>▲ {metrics.returningCustomersDelta}%</span>
            <span className="text-nexoraMuted font-semibold">
              {t('dashboard.kpi.vs_last_week') || 'vs last week'}
            </span>
          </div>
        </Panel>
      </div>
    </div>
  )
}

function StaffView({ 
  staff, 
  onAdd, 
  onEdit, 
  onDelete, 
  onQr, 
  onToggle, 
  onToggleTipsFlow, 
  onViewDetail,
  onLinkStaff,
  onInviteStaff,
  businessName,
  onAcceptJoin,
  onDeclineJoin
}) {
  const { t, currentLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState('link') // 'link' | 'invite'
  const [largeJoinQrOpen, setLargeJoinQrOpen] = useState(false)
  
  // Option A (Link) states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('Nail Technician')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')

  // Option B (Invite) states
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteRole, setInviteRole] = useState('Nail Technician')
  const [inviteMethod, setInviteMethod] = useState('SMS')

  // Calculate Metrics
  const totalLinked = staff.filter(s => s.status !== 'Pending Setup' && s.status !== 'Pending Acceptance').length
  const pendingCount = staff.filter(s => s.status === 'Pending Setup' || s.status === 'Pending Acceptance').length
  const paymentCompleteCount = staff.filter(s => {
    return Object.values(s.paymentAccounts || {}).some(val => val && val.trim() !== '')
  }).length
  const paymentCompletePct = staff.length ? Math.round((paymentCompleteCount / staff.length) * 100) : 100

  // Option A Search
  const handleSearch = () => {
    setSearchError('')
    setSearchResult(null)
    const query = searchQuery.trim().toLowerCase()
    if (!query) return

    // Search inside simulated global registry
    const match = Object.values(MOCK_NEXORA_STAFF_PROFILES).find(profile => {
      const globalId = Object.keys(MOCK_NEXORA_STAFF_PROFILES).find(key => MOCK_NEXORA_STAFF_PROFILES[key] === profile)
      return (
        globalId?.toLowerCase() === query ||
        profile.fullName.toLowerCase().includes(query) ||
        profile.email.toLowerCase() === query ||
        profile.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))
      )
    })

    if (match) {
      const matchedId = Object.keys(MOCK_NEXORA_STAFF_PROFILES).find(key => MOCK_NEXORA_STAFF_PROFILES[key] === match)
      setSearchResult({ ...match, id: matchedId })
    } else {
      setSearchError(currentLanguage === 'vi' ? 'Không tìm thấy hồ sơ nhân viên phù hợp.' : 'No staff profile found matching that criteria.')
    }
  }

  // Option A Link Request
  const handleLinkRequest = () => {
    if (!searchResult) return
    onLinkStaff(searchResult, selectedRole)
    setSearchResult(null)
    setSearchQuery('')
  }

  // Option B Submit Invite
  const handleInviteSubmit = (e) => {
    e.preventDefault()
    if (!inviteName.trim() || !inviteContact.trim()) {
      alert(currentLanguage === 'vi' ? 'Vui lòng điền đầy đủ Tên và phương thức liên hệ.' : 'Please enter both name and contact info.')
      return
    }
    onInviteStaff(inviteName, inviteContact, inviteRole, inviteMethod)
    setInviteName('')
    setInviteContact('')
  }

  // Resend invite toast simulator
  const handleResendInvite = (member) => {
    alert(currentLanguage === 'vi' 
      ? `Đã gửi lại link thiết lập thành công tới ${member.fullName}!` 
      : `Setup link successfully resent to ${member.fullName}!`
    )
  }

  // Helper to extract wallet labels
  const getWalletBadges = (member) => {
    const list = []
    if (member.paymentAccounts?.zelle) list.push('Zelle')
    if (member.paymentAccounts?.cashapp) list.push('Cash App')
    if (member.paymentAccounts?.venmo) list.push('Venmo')
    if (member.paymentAccounts?.vlinkpay) list.push('VLINKPAY')
    if (member.paymentAccounts?.paypal) list.push('PayPal')
    return list
  }

  return (
    <div className="space-y-6">
      {/* 1. Statistics KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI Card 1: Total Staff Linked */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.total_linked') || 'Total Staff Linked'}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-nexoraText">{totalLinked}</h3>
            <span className="text-xs font-bold text-emerald-600">
              {staff.filter(s => s.isActive).length} active today
            </span>
          </div>
        </div>

        {/* KPI Card 2: Pending Invites */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.pending_invites') || 'Pending Invites'}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-nexoraText">{pendingCount}</h3>
            <span className="text-xs font-bold text-amber-600">
              {staff.filter(s => s.status === 'Pending Setup').length} opened invite
            </span>
          </div>
        </div>

        {/* KPI Card 3: Payout Wallet Configured Complete */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.setup_complete') || 'Payment Setup Complete'}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-nexoraText">{paymentCompletePct}%</h3>
            <span className="text-xs font-bold text-indigo-600">
              {paymentCompleteCount} / {staff.length} staff
            </span>
          </div>
        </div>

        {/* KPI Card 4: Staff Self Setup Option */}
        <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm">
          <small className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
            {t('staff_invite.self_setup') || 'Staff Self-Setup'}
          </small>
          <div className="mt-2 flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-emerald-600">Enabled</h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {t('staff_invite.recommended') || 'Recommended'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Salon Join Link & QR Code Card */}
      <div className="rounded-xl border border-nexoraBorder bg-white p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-5">
        
        {/* Left Side: QR Code */}
        <div className="flex items-center gap-4 border-slate-100 border-none md:border-r pr-0 md:pr-5 shrink-0 self-stretch md:self-auto justify-center">
          <div 
            onClick={() => setLargeJoinQrOpen(true)}
            className="h-20 w-20 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shadow-inner bg-white cursor-zoom-in transition hover:scale-105 duration-200 group relative"
            title={currentLanguage === 'vi' ? 'Click để phóng to' : 'Click to enlarge'}
          >
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`)}`}
              alt="Scan to Join" 
              className="h-full w-full object-contain"
            />
            {/* Magnifier icon overlay on hover */}
            <div className="absolute inset-0 bg-nexoraBrand/80 rounded-xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white select-none">
              <QrCode className="h-5 w-5" />
              <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
            </div>
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-[10px] font-black uppercase text-slate-700 block">
              {currentLanguage === 'vi' ? 'MÃ QR GIA NHẬP' : 'JOIN QR CODE'}
            </span>
            <span className="text-[9px] text-slate-400 block mt-0.5">
              {currentLanguage === 'vi' ? 'Quét để đăng ký nhanh' : 'Scan to join instantly'}
            </span>
          </div>
        </div>

        {/* Right Side: Text & Referral URL inputs */}
        <div className="space-y-3 flex-grow min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Link className="h-4 w-4" />
            </span>
            <div>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                {currentLanguage === 'vi' ? 'LIÊN KẾT GIA NHẬP CHO THỢ (REFERRAL LINK)' : 'TECHNICIAN JOIN LINK & REFERRAL'}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5 leading-normal">
                {currentLanguage === 'vi' 
                  ? 'Chia sẻ liên kết này hoặc cho thợ quét mã QR để tự đăng ký/liên kết tài khoản vào tiệm.' 
                  : 'Share this referral link or let technicians scan the QR code to self-register or link to your salon.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 max-w-xl">
            <input 
              type="text" 
              readOnly 
              value={`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`}
              className="h-9 flex-grow bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs text-slate-500 font-mono focus:outline-none"
            />
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`
                navigator.clipboard.writeText(url)
                alert(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!')
              }}
              className="h-9 px-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* 3. Upgraded Staff Invite & Link Status Table */}
      <div className="rounded-xl border border-nexoraBorder bg-white overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-nexoraRule bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
            {t('staff_invite.invite_status_table') || 'Staff Invite & Link Status'}
          </h3>
          <button 
            onClick={onAdd}
            className="px-4 py-2 bg-nexoraBrand text-white hover:bg-opacity-95 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('setup.add_staff_title') || 'Add New Staff'}</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold uppercase text-nexoraMuted border-b border-nexoraRule">
                <th className="px-5 py-3">{t('setup.col_staff') || 'Staff'}</th>
                <th className="px-5 py-3">{t('staff_invite.col_flow') || 'Flow'}</th>
                <th className="px-5 py-3">{t('setup.linked_wallets') || 'Payment Setup'}</th>
                <th className="px-5 py-3">{t('dashboard.activity_log.col_status') || 'Status'}</th>
                <th className="px-5 py-3 text-right">{t('dashboard.top_touchpoints.manage') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((member) => {
                const wallets = getWalletBadges(member)
                const isPendingSetup = member.status === 'Pending Setup'
                const isPendingAcceptance = member.status === 'Pending Acceptance'
                const isPending = isPendingSetup || isPendingAcceptance

                return (
                  <tr key={member.id} className="border-b border-nexoraRule last:border-0 hover:bg-slate-50/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewDetail(member.id)}>
                        {member.avatar ? (
                          <img src={member.avatar} alt="" className="h-10 w-10 rounded-full border border-nexoraBorder object-cover group-hover:opacity-85 transition" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-sm font-extrabold text-indigo-600 group-hover:bg-indigo-100 transition">
                            {member.nickname.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-extrabold text-nexoraText group-hover:text-nexoraBrand transition">{member.fullName}</div>
                          <div className="text-xs text-nexoraMuted">{member.position}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs text-slate-500 font-semibold">
                        {member.flowType || (currentLanguage === 'vi' ? 'Khởi tạo trực tiếp' : 'Direct Addition')}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {isPendingSetup ? (
                        <span className="text-[10px] text-slate-400 font-bold italic">{currentLanguage === 'vi' ? 'Chưa cấu hình' : 'Pending'}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <span key={wallet} className="rounded px-2 py-0.5 text-[10px] font-bold bg-nexoraCanvas text-nexoraBrand border border-nexoraBrand/10">{wallet}</span>
                            ))
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold italic">{currentLanguage === 'vi' ? 'Không có ví' : 'No wallets'}</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {isPendingSetup && (
                        <span className="inline-flex rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-amber-100">
                          {currentLanguage === 'vi' ? 'Chờ setup' : 'Pending Setup'}
                        </span>
                      )}
                      {isPendingAcceptance && (
                        <span className="inline-flex rounded-full bg-indigo-50 text-indigo-700 px-2.5 py-0.5 text-[10px] font-extrabold uppercase border border-indigo-100">
                          {currentLanguage === 'vi' ? 'Chờ chấp nhận' : 'Pending Acceptance'}
                        </span>
                      )}
                      {!isPending && (
                        <button 
                          onClick={() => onToggle(member.id)} 
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase border transition ${
                            member.isActive 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                              : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100'
                          }`}
                        >
                          {member.isActive ? t('common.active') : t('common.inactive')}
                        </button>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {isPendingSetup && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleResendInvite(member)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-nexoraBorder bg-white text-nexoraText rounded hover:bg-slate-50 transition"
                          >
                            {t('staff_invite.action_resend') || 'Resend Invite'}
                          </button>
                          <IconButton label={t('common.delete')} onClick={() => onDelete(member.id)} className="hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}

                      {isPendingAcceptance && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => onAcceptJoin && onAcceptJoin(member.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-emerald-200 bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100 transition"
                          >
                            {currentLanguage === 'vi' ? 'Chấp nhận' : 'Accept'}
                          </button>
                          <button 
                            onClick={() => onDeclineJoin && onDeclineJoin(member.id)}
                            className="px-2.5 py-1 text-[10px] font-extrabold border border-rose-200 bg-rose-50 text-rose-700 rounded hover:bg-rose-100 transition"
                          >
                            {currentLanguage === 'vi' ? 'Từ chối' : 'Decline'}
                          </button>
                        </div>
                      )}

                      {!isPending && (
                        <div className="flex justify-end gap-1.5">
                          <IconButton label={t('common.tips_flow')} onClick={() => onToggleTipsFlow(member.id)} className={member.showInTipsFlow !== false ? "text-blue-600 hover:text-blue-700" : "text-slate-400 hover:text-slate-500"}>
                            {member.showInTipsFlow !== false ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                          </IconButton>
                          <IconButton label={t('staff_detail.joined_gateway')} onClick={() => onViewDetail(member.id)} className="hover:text-nexoraBrand">
                            <User className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('staff_detail.personal_qr')} onClick={() => onQr(member)}>
                            <QrCode className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('common.edit')} onClick={() => onEdit(member)}>
                            <Edit2 className="h-4 w-4" />
                          </IconButton>
                          <IconButton label={t('common.delete')} onClick={() => onDelete(member.id)} className="hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </IconButton>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Large Join QR Modal */}
      {largeJoinQrOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-zoom-out"
          onClick={() => setLargeJoinQrOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                {currentLanguage === 'vi' ? 'MÃ QR GIA NHẬP' : 'JOIN QR CODE'}
              </h3>
              <button 
                onClick={() => setLargeJoinQrOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="h-64 w-64 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center shadow-inner bg-white mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`)}`}
                alt="Scan to Join" 
                className="h-full w-full object-contain"
              />
            </div>
            
            <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-xs mb-4">
              {currentLanguage === 'vi' 
                ? 'Cho thợ quét mã này bằng camera điện thoại để tự đăng ký hoặc liên kết tài khoản vào tiệm.' 
                : 'Have technicians scan this QR code with their mobile camera to self-register or link accounts.'}
            </p>
            
            <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                {`${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`}
              </span>
              <button
                onClick={() => {
                  const url = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`
                  navigator.clipboard.writeText(url)
                  alert(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!')
                }}
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0"
              >
                <Copy className="h-3 w-3" />
                <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ReviewsView({ reviews, staff, filter, setFilter, setupData }) {
  const { t } = useTranslation()
  const [sourceFilter, setSourceFilter] = useState('all')

  const reviewLinks = useMemo(() => {
    const defaultLinks = {
      googleReview: 'https://g.page/r/cGoldenGlowNails/review',
      yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
      feedbackEmail: 'manager@goldenglownails.com'
    }
    return setupData?.reviewLinks || defaultLinks
  }, [setupData])

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      // 1. Staff Filter
      const matchesStaff = filter === 'all' || review.staffId === filter

      // 2. Source / Rating Filter
      let matchesSource = true
      if (sourceFilter === 'google') {
        matchesSource = review.category?.toLowerCase().includes('google')
      } else if (sourceFilter === 'yelp') {
        matchesSource = review.category?.toLowerCase().includes('yelp')
      } else if (sourceFilter === 'low_stars') {
        matchesSource = review.rating <= 3
      }

      return matchesStaff && matchesSource
    })
  }, [reviews, filter, sourceFilter])

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="pb-4 border-b border-nexoraBorder">
        <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.reviews')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{renderTextWithGoldStars(t('setup.review_routing_policy'))}</p>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-xl border border-nexoraBorder/60 shadow-sm">
        {/* Source & Rating Filters (Left) */}
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: t('staff_detail.tab_all') || 'All' },
            { id: 'google', label: t('dashboard.review_kpi.google_reviews') || 'Google' },
            { id: 'yelp', label: t('dashboard.review_kpi.yelp_reviews') || 'Yelp' },
            { id: 'low_stars', label: t('dashboard.review_kpi.low_stars_filter') || '3★ or below' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSourceFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer select-none ${
                sourceFilter === tab.id
                  ? 'bg-nexoraBrand text-white shadow-sm'
                  : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Technician Dropdown Filter (Right) */}
        <div className="w-full sm:w-48 shrink-0">
          <CustomSelect
            size="sm"
            className="font-semibold"
            buttonClass="h-9 px-3 text-xs"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            options={[
              { value: 'all', label: t('staff_detail.tab_all') },
              ...staff.map((member) => ({ value: member.id, label: member.nickname }))
            ]}
          />
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Panel className="p-8 text-center text-nexoraMuted font-medium text-xs">
            {t('staff_detail.no_reviews_matching') || 'No reviews matching the filter criteria.'}
          </Panel>
        ) : (
          filtered.map((review) => {
            const isGoogle = review.category?.toLowerCase().includes('google')
            const isYelp = review.category?.toLowerCase().includes('yelp')
            const isInternal = !isGoogle && !isYelp

            return (
              <Panel key={review.id} className="p-4 hover:shadow-premium transition-shadow duration-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Star rating rendering */}
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating ? 'fill-current' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-nexoraWarning">{review.rating}.0★</span>
                    </div>
                    <p className="text-sm text-nexoraText">"{review.comment}"</p>
                    <p className="text-xs text-nexoraMuted">{review.staffName} - {review.date}</p>
                  </div>

                  {/* Redirecting Logo Badges / Internal tag */}
                  <div className="self-end sm:self-start shrink-0">
                    {isGoogle && (
                      <a
                        href={reviewLinks.googleReview}
                        target="_blank"
                        rel="noreferrer"
                        title={t('common.view_on_google') || 'View on Google'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1.5 hover:bg-slate-50 transition shadow-sm hover:scale-[1.03] duration-150 cursor-pointer"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span className="text-[10px] font-black uppercase text-nexoraText tracking-wider">{t('dashboard.review_kpi.google_reviews') || 'Google'}</span>
                        <ExternalLink className="h-3 w-3 text-nexoraMuted" />
                      </a>
                    )}
                    {isYelp && (
                      <a
                        href={reviewLinks.yelpReview}
                        target="_blank"
                        rel="noreferrer"
                        title={t('common.view_on_yelp') || 'View on Yelp'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1.5 hover:bg-slate-50 transition shadow-sm hover:scale-[1.03] duration-150 cursor-pointer"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#D32323]" xmlns="http://www.w3.org/2000/svg">
                          <path d="m7.6885 15.1415-3.6715.8483c-.3769.0871-.755.183-1.1452.155-.2611-.0188-.5122-.0414-.7606-.213a1.179 1.179 0 0 1-.331-.3594c-.3486-.5519-.3656-1.3661-.3697-2.0004a6.2874 6.2874 0 0 1 .3314-2.0642 1.857 1.857 0 0 1 .1073-.2474 2.3426 2.3426 0 0 1 .1255-.2165 2.4572 2.4572 0 0 1 .1563-.1975 1.1736 1.1736 0 0 1 .399-.2831 1.082 1.082 0 0 1 .4592-.0837c.2355.0016.5139.052.91.1734.0555.0191.1237.0382.1856.0572.3277.1013.7048.2404 1.1499.3987.6863.2404 1.3663.487 2.0463.7397l1.2117.4423c.2217.0807.4363.18.6412.297.174.0984.3273.2298.4512.387a1.217 1.217 0 0 1 .192.4309 1.2205 1.2205 0 0 1-.872 1.4522c-.0468.0151-.0852.0239-.1085.0293l-1.105.2553-.0031-.001zM18.8208 7.565a1.8506 1.8506 0 0 0-.2042-.1754 2.4082 2.4082 0 0 0-.2077-.1394 2.3607 2.3607 0 0 0-.2269-.109 1.1705 1.1705 0 0 0-.482-.0796 1.0862 1.0862 0 0 0-.4498.1263c-.2107.1048-.4388.2732-.742.5551-.042.0417-.0947.0886-.142.133-.2502.2351-.5286.5252-.8599.863a114.6363 114.6363 0 0 0-1.5166 1.5629l-.8962.9293a4.1897 4.1897 0 0 0-.4466.5483 1.541 1.541 0 0 0-.2364.5459 1.2199 1.2199 0 0 0 .0107.4518l.0046.02a1.218 1.218 0 0 0 1.4184.923 1.162 1.162 0 0 0 .1105-.0213l4.7781-1.104c.3766-.087.7587-.1667 1.097-.3631.2269-.1316.4428-.262.5909-.5252a1.1793 1.1793 0 0 0 .1405-.4683c.0733-.6512-.2668-1.3908-.5403-1.963a6.2792 6.2792 0 0 0-1.2001-1.7103zM8.9703.0754a8.6724 8.6724 0 0 0-.83.1564c-.2754.066-.548.1383-.8146.2236-.868.2844-2.0884.8063-2.295 1.8065-.1165.5655.1595 1.1439.3737 1.66.2595.6254.614 1.1889.9373 1.7777.8543 1.5545 1.7245 3.0993 2.5922 4.6457.259.4617.5416 1.0464 1.043 1.2856a1.058 1.058 0 0 0 .1013.0383c.2248.0851.4699.1016.7041.0471a4.3015 4.3015 0 0 0 .0418-.0097 1.2136 1.2136 0 0 0 .5658-.3397 1.1033 1.1033 0 0 0 .079-.0822c.3463-.435.3454-1.0833.3764-1.6134.1042-1.771.2139-3.5423.3009-5.3142.0332-.6712.1055-1.3333.0655-2.0096-.0328-.5579-.0368-1.1984-.3891-1.6563-.6218-.8073-1.9476-.741-2.8523-.6158zm2.084 15.9505a1.1053 1.1053 0 0 0-1.2306-.4145 1.1398 1.1398 0 0 0-.1526.0633 1.4806 1.4806 0 0 0-.2171.1354c-.1992.1475-.3668.3392-.5196.5315-.0386.049-.074.1143-.12.1562l-.7686 1.0573a113.9168 113.9168 0 0 0-1.2913 1.789c-.278.3895-.5184.7184-.7083 1.0094-.036.0547-.0734.116-.1075.1647-.2277.3522-.3566.6092-.4228.8381a1.0945 1.0945 0 0 0-.046.4721c.0211.1655.0768.3246.1635.467.046.0715.0957.1406.1487.207a2.334 2.334 0 0 0 .1754.1825 1.843 1.843 0 0 0 .2108.1732c.5304.369 1.1112.6342 1.722.8391a6.0958 6.0958 0 0 0 1.5716.3004c.091.0046.1821.0025.2728-.006a2.3878 2.3878 0 0 0 .2506-.0351 2.3862 2.3862 0 0 0 .2447-.071 1.1927 1.1927 0 0 0 .4175-.2658c.1127-.113.1994-.249.2541-.3989.0889-.2214.1473-.5026.1857-.92.0034-.0593.0118-.1305.0177-.1958.0304-.3463.0443-.7531.0666-1.2315.0375-.7357.067-1.4681.0903-2.2026 0 0 .0495-1.3053.0494-1.306.0113-.3008.002-.6342-.0814-.9336a1.396 1.396 0 0 0-.1756-.4054zm8.6754 2.0439c-.1605-.176-.3878-.3514-.7462-.5682-.0518-.0288-.1124-.0674-.1684-.1009-.2985-.1795-.658-.3684-1.078-.5965a120.7615 120.7615 0 0 0-1.9427-1.042l-1.1515-.6107c-.0597-.0175-.1203-.0607-.1766-.0878-.2212-.1058-.4558-.2045-.6992-.2498a1.4915 1.4915 0 0 0-.2545-.0265 1.1527 1.1527 0 0 0-.1648.01 1.1077 1.1077 0 0 0-.9227.9133 1.4186 1.4186 0 0 0 .0159.439c.0563.3065.1932.6096.3346.875l.615 1.1526c.3422.65.6884 1.2963 1.0435 1.9406.229.4202.4196.7799.5982 1.078.0338.056.0721.1163.1011.1682.2173.3584.392.584.569.7458.1146.1107.252.195.4026.247.1583.0525.326.071.4919.0546a2.368 2.368 0 0 0 .251-.0435c.0817-.022.1622-.048.241-.0784a1.863 1.863 0 0 0 .2475-.1143 6.1018 6.1018 0 0 0 1.2818-.9597c.4596-.4522.8659-.9454 1.182-1.51.044-.08.0819-.163.1138-.2483a2.49 2.49 0 0 0 .0773-.2411c.0186-.083.033-.1669.0429-.2513a1.188 1.188 0 0 0-.0565-.491 1.0933 1.0933 0 0 0-.248-.4041z"/>
                        </svg>
                        <span className="text-[10px] font-black uppercase text-nexoraText tracking-wider">{t('dashboard.review_kpi.yelp_reviews') || 'Yelp'}</span>
                        <ExternalLink className="h-3 w-3 text-nexoraMuted" />
                      </a>
                    )}
                    {isInternal && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-2.5 py-1.5 text-[10px] font-extrabold uppercase select-none">
                        <Lock className="h-3 w-3" />
                        {t('staff_detail.private_recovery') || 'Internal Feedback'}
                      </span>
                    )}
                  </div>
                </div>
              </Panel>
            )
          })
        )}
      </div>
    </div>
  )
}

function ReportsView({ transactions, staff = [], touchpoints = [] }) {
  const { t } = useTranslation()

  // Filter States
  const [dateRangePreset, setDateRangePreset] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [selectedStaff, setSelectedStaff] = useState('all')
  const [selectedTouchpoint, setSelectedTouchpoint] = useState('all')
  const [selectedPayment, setSelectedPayment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  const resetFilters = () => {
    setDateRangePreset('all')
    setStartDate('')
    setEndDate('')
    setMinAmount('')
    setMaxAmount('')
    setSelectedStaff('all')
    setSelectedTouchpoint('all')
    setSelectedPayment('all')
    setSelectedStatus('all')
  }

  // Filter logic
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      // 1. Date filter
      if (dateRangePreset !== 'all') {
        const txDateStr = tx.dateTime.split(' ')[0]
        
        if (dateRangePreset === 'today') {
          const todayStr = new Date().toISOString().split('T')[0]
          if (txDateStr !== todayStr) return false
        } else if (dateRangePreset === 'yesterday') {
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]
          if (txDateStr !== yesterdayStr) return false
        } else if (dateRangePreset === '7days') {
          const limit = new Date()
          limit.setDate(limit.getDate() - 7)
          const limitStr = limit.toISOString().split('T')[0]
          if (txDateStr < limitStr) return false
        } else if (dateRangePreset === '30days') {
          const limit = new Date()
          limit.setDate(limit.getDate() - 30)
          const limitStr = limit.toISOString().split('T')[0]
          if (txDateStr < limitStr) return false
        } else if (dateRangePreset === 'custom') {
          if (startDate && txDateStr < startDate) return false
          if (endDate && txDateStr > endDate) return false
        }
      }

      // 2. Amount filter
      if (minAmount && tx.amount < parseFloat(minAmount)) return false
      if (maxAmount && tx.amount > parseFloat(maxAmount)) return false

      // 3. Staff filter
      if (selectedStaff !== 'all' && tx.staffName !== selectedStaff) return false

      // 4. Touchpoint filter
      if (selectedTouchpoint !== 'all' && tx.touchpoint !== selectedTouchpoint) return false

      // 5. Payment method filter
      if (selectedPayment !== 'all' && tx.paymentMethod.toLowerCase() !== selectedPayment.toLowerCase()) return false

      // 6. Status filter
      if (selectedStatus !== 'all' && tx.status.toLowerCase() !== selectedStatus.toLowerCase()) return false

      return true
    })
  }, [transactions, dateRangePreset, startDate, endDate, minAmount, maxAmount, selectedStaff, selectedTouchpoint, selectedPayment, selectedStatus])

  // Options memoization
  const staffOptions = useMemo(() => {
    return [
      { value: 'all', label: t('dashboard.activity_log.all_staff') || 'All Staff' },
      ...(staff || []).map(member => ({ value: member.nickname, label: member.nickname }))
    ]
  }, [staff, t])

  const touchpointOptions = useMemo(() => {
    const uniqueFromTx = Array.from(new Set(transactions.map(tx => tx.touchpoint)))
    const uniquePoints = Array.from(new Set([
      ...(touchpoints || []).map(tp => tp.name),
      ...uniqueFromTx
    ])).filter(Boolean)

    return [
      { value: 'all', label: t('dashboard.activity_log.all_touchpoints') || 'All Touch Points' },
      ...uniquePoints.map(name => ({ value: name, label: name }))
    ]
  }, [touchpoints, transactions, t])

  const paymentOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_payments') || 'All Payment Methods' },
    { value: 'Venmo', label: 'Venmo' },
    { value: 'Cash App', label: 'Cash App' },
    { value: 'Zelle', label: 'Zelle' },
    { value: 'VLINKPAY', label: 'VLINKPAY' }
  ]

  const statusOptions = [
    { value: 'all', label: t('dashboard.activity_log.all_statuses') || 'All Statuses' },
    { value: 'Success', label: 'Success' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Failed', label: 'Failed' }
  ]

  const datePresetOptions = [
    { value: 'all', label: t('dashboard.activity_log.preset_all') || 'All Time' },
    { value: 'today', label: t('dashboard.activity_log.preset_today') || 'Today' },
    { value: 'yesterday', label: t('dashboard.activity_log.preset_yesterday') || 'Yesterday' },
    { value: '7days', label: t('dashboard.activity_log.preset_7days') || 'Last 7 Days' },
    { value: '30days', label: t('dashboard.activity_log.preset_30days') || 'Last 30 Days' },
    { value: 'custom', label: t('dashboard.activity_log.preset_custom') || 'Custom Range' }
  ]

  const statusColorClass = (status) => {
    if (status?.toLowerCase() === 'success') return 'text-emerald-600 font-semibold'
    if (status?.toLowerCase() === 'failed') return 'text-rose-600 font-semibold'
    return 'text-amber-600 font-semibold'
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.transactions')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('dashboard.activity_log.title')}</p>
        </div>
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-nexoraBrand" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-nexoraText">
              {t('dashboard.activity_log.filter_title') || 'Filters'}
            </h3>
          </div>
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 text-xs font-bold text-nexoraMuted hover:text-nexoraBrand transition-colors cursor-pointer select-none"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {t('dashboard.activity_log.filter_reset') || 'Reset'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {/* Date Preset */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('dashboard.activity_log.filter_date') || 'Date'}
            </label>
            <CustomSelect
              size="sm"
              value={dateRangePreset}
              onChange={(e) => setDateRangePreset(e.target.value)}
              options={datePresetOptions}
            />
          </div>

          {/* Amount range */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('dashboard.activity_log.filter_amount') || 'Amount'}
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative w-full">
                <span className="absolute left-2 top-[8.5px] text-[10px] font-bold text-nexoraSubtle">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="h-9 w-full rounded-lg border border-nexoraBorder pl-5 pr-1 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
                />
              </div>
              <span className="text-nexoraSubtle text-xs">-</span>
              <div className="relative w-full">
                <span className="absolute left-2 top-[8.5px] text-[10px] font-bold text-nexoraSubtle">$</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="h-9 w-full rounded-lg border border-nexoraBorder pl-5 pr-1 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Staff */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('dashboard.activity_log.filter_staff') || 'Staff'}
            </label>
            <CustomSelect
              size="sm"
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              options={staffOptions}
            />
          </div>

          {/* Touch Point */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('dashboard.activity_log.filter_tp') || 'Touch Point'}
            </label>
            <CustomSelect
              size="sm"
              value={selectedTouchpoint}
              onChange={(e) => setSelectedTouchpoint(e.target.value)}
              options={touchpointOptions}
            />
          </div>

          {/* Payment Method */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('dashboard.activity_log.filter_payment') || 'Payment method'}
            </label>
            <CustomSelect
              size="sm"
              value={selectedPayment}
              onChange={(e) => setSelectedPayment(e.target.value)}
              options={paymentOptions}
            />
          </div>

          {/* Status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('dashboard.activity_log.filter_status') || 'Status'}
            </label>
            <CustomSelect
              size="sm"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={statusOptions}
            />
          </div>
        </div>

        {/* Custom date range selection */}
        {dateRangePreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-dashed border-nexoraRule transition-all">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                {t('dashboard.activity_log.start_date') || 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 rounded-lg border border-nexoraBorder px-2.5 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                {t('dashboard.activity_log.end_date') || 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 rounded-lg border border-nexoraBorder px-2.5 text-xs outline-none focus:border-nexoraBrand focus:ring-1 focus:ring-nexoraBrand/20 text-nexoraText bg-white transition-all"
              />
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_id')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_time')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_amount')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_staff')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_tp')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_payment')}</th>
              <th className="px-4 py-3">{t('dashboard.activity_log.col_status')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center text-nexoraMuted font-medium">
                  {t('dashboard.activity_log.empty_activity') || 'No transactions matched the criteria.'}
                </td>
              </tr>
            ) : (
              filtered.map((tx) => (
                <tr key={tx.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{tx.id}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{tx.dateTime}</td>
                  <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(tx.amount)}</td>
                  <td className="px-4 py-3">{tx.staffName}</td>
                  <td className="px-4 py-3">{tx.touchpoint}</td>
                  <td className="px-4 py-3">{tx.paymentMethod}</td>
                  <td className={`px-4 py-3 ${statusColorClass(tx.status)}`}>{tx.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComingSoon({ activeMenu, onBack }) {
  const { t } = useTranslation()
  const copy = {
    analytics: ['Advanced Analytics', 'Device conversion, return customer cohorts, and AI review summaries are planned for phase 3.'],
    subscriptions: ['Subscriptions', 'Manage NFC stand orders, renewal plans, and hardware add-ons from this workspace soon.'],
    settings: ['Settings', 'Shop preferences, webhook keys, and review destinations will be configured here.']
  }[activeMenu] || ['Feature In Progress', 'This module is being prepared for the Nexora Touch merchant dashboard.']

  return (
    <div className="flex min-h-[520px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-nexoraBorder bg-white text-nexoraBrand">
          <Sparkles className="h-9 w-9" />
        </div>
        <h2 className="mt-5 text-xl font-extrabold text-nexoraText">{copy[0]}</h2>
        <p className="mt-2 text-sm text-nexoraMuted">{copy[1]}</p>
        <button onClick={onBack} className="mt-5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white">
          {t('staff_detail.back_to_directory')}
        </button>
      </div>
    </div>
  )
}

function StaffModal({ 
  open, 
  editing, 
  form, 
  errors, 
  setForm, 
  verificationStatus = 'kyb_approved',
  onBlockedFeatureClick,
  onClose, 
  onSave,
  onOpenInviteShare
}) {
  const { t, currentLanguage } = useTranslation()
  const [payoutSetupOpen, setPayoutSetupOpen] = useState(false)
  const [payoutSetupWallet, setPayoutSetupWallet] = useState('venmo')
  const [tempPayoutValues, setTempPayoutValues] = useState({ value: '', qrCode: '', accountName: '' })

  if (!open) return null

  const phoneParsed = parsePhone(form?.phone || '')

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm({ ...form, avatar: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const handleToggleWallet = (walletKey) => {
    if (verificationStatus !== 'kyb_approved') {
      if (onBlockedFeatureClick) onBlockedFeatureClick()
      return
    }
    const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }
    
    if (config.enabled) {
      setForm({
        ...form,
        payoutConfigs: {
          ...configs,
          [walletKey]: { ...config, enabled: false }
        }
      })
    } else {
      if (config.value?.trim()) {
        setForm({
          ...form,
          payoutConfigs: {
            ...configs,
            [walletKey]: { ...config, enabled: true }
          }
        })
      } else {
        openPayoutSetup(walletKey)
      }
    }
  }

  const openPayoutSetup = (walletKey) => {
    if (verificationStatus !== 'kyb_approved') {
      if (onBlockedFeatureClick) onBlockedFeatureClick()
      return
    }
    const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const config = configs[walletKey] || { enabled: false, value: '', qrCode: '' }
    setTempPayoutValues({
      value: config.value || '',
      qrCode: config.qrCode || '',
      accountName: config.accountName || form.fullName || ''
    })
    setPayoutSetupWallet(walletKey)
    setPayoutSetupOpen(true)
  }

  const handlePayoutSubmit = (value, qrCode, accountName) => {
    const configs = form.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    setForm({
      ...form,
      payoutConfigs: {
        ...configs,
        [payoutSetupWallet]: {
          enabled: true,
          value: value.trim(),
          qrCode: qrCode,
          accountName: accountName.trim()
        }
      }
    })
    setPayoutSetupOpen(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg md:max-w-3xl lg:max-w-4xl rounded-xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-lg font-extrabold text-nexoraText">{editing ? t('common.edit') : t('setup.add_staff_title')}</h2>
          <IconButton label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Left Column: Basic Info */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Avatar</label>
              <div className="mt-2 flex items-center gap-4">
                {form.avatar ? (
                  <img src={form.avatar} alt="" className="h-16 w-16 rounded-full object-cover ring-1 ring-nexoraBorder" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-nexoraCanvas text-lg font-extrabold text-nexoraBrand ring-1 ring-nexoraBorder">
                    {(form.nickname || form.fullName || 'N').charAt(0)}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas">
                    <Upload className="h-4 w-4 text-nexoraBrand" />
                    Upload photo
                    <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                  </label>
                  {form.avatar && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, avatar: '' })}
                      className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraMuted transition hover:bg-nexoraCanvas"
                    >
                      {t('common.delete')}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_fullname')}</label>
              <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Mia Tran" />
              {errors.fullName && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.fullName}</p>}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_displayname')}</label>
                <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="Mia T." />
                {errors.nickname && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.nickname}</p>}
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_position')}</label>
                <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} placeholder="Nail Tech" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_phone') || 'Phone Number'}</label>
                <div className="mt-1 flex rounded-lg shadow-sm">
                  <CountryCodeSelect
                    value={phoneParsed.countryCode}
                    onChange={(newCode) => {
                      setForm({ ...form, phone: `${newCode} ${phoneParsed.nationalNumber}`.trim() })
                    }}
                  />
                  <input
                    className="h-10 w-full rounded-r-lg border border-l-0 border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand bg-white min-w-0"
                    value={phoneParsed.nationalNumber}
                    onChange={(event) => setForm({ ...form, phone: `${phoneParsed.countryCode} ${event.target.value}`.trim() })}
                    placeholder={t('setup.staff_phone_placeholder') || 'e.g., 407-555-0123'}
                  />
                </div>
                {errors.phone && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.phone}</p>}
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.staff_email') || 'Email Address'}</label>
                <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={t('setup.staff_email_placeholder') || 'e.g., mia.tran@gmail.com'} />
                {errors.email && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.email}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3.5 mt-2">
              <div>
                <label className="text-xs font-extrabold text-nexoraText block">{t('setup.show_in_tips_flow') || 'Show in Tips Flow'}</label>
                <p className="text-[10px] text-nexoraMuted leading-relaxed mt-0.5">{t('setup.show_in_tips_flow_desc') || 'If disabled, this staff member won\'t appear in the general QR code staff list.'}</p>
              </div>
              <button
                type="button"
                onClick={() => setForm({ ...form, showInTipsFlow: !form.showInTipsFlow })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.showInTipsFlow ? 'bg-nexoraBrand' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.showInTipsFlow ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Column: Payout Configurations */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.payout_methods') || 'Payout Methods'}</label>
              <div className="mt-2 space-y-4">
                <div className="divide-y divide-slate-100 rounded-xl border border-nexoraBorder bg-white px-4">
                  {[
                    { name: 'Zelle', key: 'zelle' },
                    { name: 'Bank Wire', key: 'bankwire' },
                    { name: 'PayPal', key: 'paypal' },
                    { name: 'Venmo', key: 'venmo' },
                    { name: 'Cash App', key: 'cashapp' },
                    { name: 'Apple Cash', key: 'applecash' }
                  ].map((wallet) => {
                    const config = (form.payoutConfigs && form.payoutConfigs[wallet.key]) || { enabled: false, value: '', qrCode: '' }
                    
                    return (
                      <div key={wallet.key} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => handleToggleWallet(wallet.key)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              config.enabled ? 'bg-amber-600' : 'bg-slate-200'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                config.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 shrink-0">
                              {WalletLogos[wallet.key]}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{wallet.name}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openPayoutSetup(wallet.key)}
                          className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition"
                        >
                          <Edit2 className="h-3 w-3 stroke-[2.5]" />
                          <span>{t('setup.payout_account') || 'Payout account'}</span>
                        </button>
                      </div>
                    )
                  })}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-nexoraMuted mb-1 block">VLINKPAY ID</label>
                    <div className="relative">
                      <span className="absolute left-3 top-[9px] flex items-center justify-center pointer-events-none">
                        <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain" />
                      </span>
                      <input 
                        className="h-9 w-full rounded-lg border border-nexoraBorder pl-9 pr-3 text-xs outline-none focus:border-nexoraBrand font-semibold font-mono" 
                        value={form.vlinkpay || ''} 
                        onChange={(event) => setForm({ ...form, vlinkpay: event.target.value })}
                        placeholder="e.g. VLP-8893-VL"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-extrabold uppercase text-nexoraMuted mb-1 block">NEXORA Staff ID</label>
                    <div className="relative">
                      <span className="absolute left-3 top-[9px] flex items-center justify-center pointer-events-none">
                        <User className="h-4.5 w-4.5 text-[#4648D8]" />
                      </span>
                      <input 
                        className="h-9 w-full rounded-lg border border-nexoraBorder pl-9 pr-3 text-xs outline-none focus:border-nexoraBrand font-semibold font-mono" 
                        value={form.nexoraStaffId || ''} 
                        onClick={(e) => {
                          if (verificationStatus !== 'kyb_approved') {
                            e.preventDefault()
                            e.target.blur()
                            if (onBlockedFeatureClick) onBlockedFeatureClick()
                          }
                        }}
                        onChange={(event) => {
                          if (verificationStatus !== 'kyb_approved') {
                            if (onBlockedFeatureClick) onBlockedFeatureClick()
                            return
                          }
                          const val = event.target.value
                          setForm((prev) => {
                            const updated = { ...prev, nexoraStaffId: val }
                            const kycProfile = MOCK_NEXORA_STAFF_PROFILES[val.trim()]
                            if (kycProfile) {
                              alert(currentLanguage === 'vi' 
                                ? 'Đã xác thực tài khoản NEXORA! Tự động nhập thông tin thợ.' 
                                : 'NEXORA Staff Profile Verified! Auto-filled profile details.')
                              return {
                                ...updated,
                                fullName: kycProfile.fullName,
                                nickname: kycProfile.nickname,
                                phone: kycProfile.phone,
                                email: kycProfile.email,
                                position: kycProfile.position,
                                avatar: kycProfile.avatar,
                                vlinkpay: kycProfile.vlinkpayId || '',
                                payoutConfigs: {
                                  ...updated.payoutConfigs,
                                  ...kycProfile.payoutConfigs
                                }
                              }
                            }
                            return updated
                          })
                        }} 
                        placeholder="e.g. NEX-STAFF-LISA1102" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => onOpenInviteShare && onOpenInviteShare(form)}
                    className="underline text-xs text-amber-600 hover:text-amber-700 font-bold mt-1 cursor-pointer select-none inline-block text-left"
                  >
                    {currentLanguage === 'vi' ? 'Chia sẻ liên kết & QR mời thợ' : 'Share Invite Link & QR'}
                  </button>
                </div>
              </div>
              {errors.payment && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />{errors.payment}</p>}
            </div>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          <button onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted">{t('common.cancel')}</button>
          <button onClick={onSave} className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white">{t('common.save')}</button>
        </div>
      </div>

      <PayoutSetupModal
        open={payoutSetupOpen}
        walletKey={payoutSetupWallet}
        staffName={form.fullName}
        initialValue={tempPayoutValues.value}
        initialQrCode={tempPayoutValues.qrCode}
        onClose={() => setPayoutSetupOpen(false)}
        onSubmit={handlePayoutSubmit}
      />
    </div>
  )
}

function QrModal({ target, businessName, onClose }) {
  const { t } = useTranslation()
  if (!target) return null

  // Build the live customer portal URL for this touchpoint/staff QR
  const qrUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=${encodeURIComponent(target.slug)}&biz=${encodeURIComponent(businessName)}`

  const isStaff = target.slug?.startsWith('staff/')
  const displayName = isStaff ? target.name.replace('Personal QR - ', '') : ''
  const displayRole = isStaff ? target.subtitle : ''

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center qr-modal-backdrop">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl animate-scaleUp qr-modal-container">
        <div className="flex justify-end no-print">
          <IconButton label="Close QR preview" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-nexoraText qr-print-title">{target.name}</h2>
        <p className="text-xs text-nexoraMuted qr-print-subtitle">{target.subtitle}</p>
        {!target.isActive && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700 no-print">
            <ShieldAlert className="h-3.5 w-3.5" />
            This personal QR is blocked while the staff member is inactive.
          </div>
        )}
        <div className="mx-auto mt-5 flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraCanvas border border-nexoraBorder/80 p-4 text-nexoraText shadow-md qr-print-card">
          {/* Nexora Branding Header inside Card */}
          <div className="flex items-center gap-1 justify-center qr-print-brand-header">
            <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-3.5 w-3.5 object-contain qr-print-brand-logo" />
            <span className="text-[8px] font-black tracking-wider text-slate-800 qr-print-brand-text">NEXORA</span>
          </div>

          <div className="w-full text-center">
            <div className="text-[10px] font-extrabold uppercase text-nexoraBrand tracking-wide qr-print-biz-name mx-auto">
              {isStaff ? displayName : (target.name || 'Master QR')}
            </div>
            <div className="text-[7.5px] font-bold text-nexoraMuted qr-print-staff-info mx-auto">
              {businessName} {isStaff && displayRole ? `• ${displayRole}` : ''}
            </div>
          </div>
          
          {/* Real Scan-Ready QR Code */}
          <div className="h-28 w-28 rounded-lg bg-white border border-nexoraBorder/60 p-2 flex items-center justify-center shadow-inner qr-print-qr-wrapper">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
              alt="Scan QR code to tip and review"
              className="h-full w-full object-contain qr-print-qr-image"
            />
          </div>

          <div className="text-[8px] font-extrabold uppercase text-nexoraMuted tracking-wider qr-print-scan-text leading-tight mx-auto">
            {t('customer.scan_to_tip_review') || 'Scan to Tip & Review'}
          </div>

          <div className="flex items-center gap-1 text-[7.5px] font-bold text-nexoraSubtle qr-print-footer">
            <ShieldCheck className="h-2.5 w-2.5 text-nexoraBrand shrink-0" />
            <span>Secure redirect by VLINKPAY</span>
          </div>
        </div>
        
        <p className="mt-4 rounded-lg bg-nexoraCanvas px-3 py-2 text-[10px] font-mono text-nexoraMuted select-all qr-print-url">
          nexora.vlinkpay.com/touch/{target.slug}
        </p>

        {/* Browser simulator trigger */}
        <div className="mt-3.5 no-print">
          <a
            href={qrUrl}
            target="_blank"
            rel="opener"
            className="inline-flex items-center gap-1 text-[10.5px] font-black text-nexoraBrand hover:underline tracking-wide bg-nexoraBrandSoft px-3 py-1.5 rounded-lg transition"
          >
            <span>{t('dashboard.modals.customer_view_test') || 'Mô phỏng quét QR (Mở trang khách) ›'}</span>
          </a>
        </div>

        <button 
          onClick={() => window.print()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white hover:bg-opacity-90 transition no-print"
        >
          <Download className="h-4 w-4" />
          {t('dashboard.modals.download_print_qr') || 'Print / Download Design'}
        </button>
      </div>
    </div>
  )
}

function InviteShareModal({ open, businessName, defaultName, defaultContact, onClose, onSendInvite }) {
  const { t, currentLanguage } = useTranslation()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [role, setRole] = useState('Nail Technician')
  const [inviteMethod, setInviteMethod] = useState('SMS') // 'SMS' | 'Email'
  const [errors, setErrors] = useState({})
  const [largeQrOpen, setLargeQrOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setName(defaultName || '')
      setContact(defaultContact || '')
      setErrors({})
      if (defaultContact && defaultContact.includes('@')) {
        setInviteMethod('Email')
      } else {
        setInviteMethod('SMS')
      }
    }
  }, [open, defaultName, defaultContact])

  if (!open) return null

  const joinLink = `${window.location.origin}${window.location.pathname}?flow=staff-invite&biz=${encodeURIComponent(businessName)}`

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = {}
    if (!name.trim()) nextErrors.name = 'Technician name is required.'
    if (!contact.trim()) nextErrors.contact = 'Contact information (email or phone) is required.'
    
    if (inviteMethod === 'Email' && contact.trim() && !/\S+@\S+\.\S+/.test(contact.trim())) {
      nextErrors.contact = 'Invalid email format.'
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSendInvite(name, contact, role)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all relative">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider font-sans">
            {currentLanguage === 'vi' ? 'Chia sẻ liên kết & QR mời thợ' : 'Share Invitation Link & QR'}
          </h2>
          <IconButton label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="mt-4 space-y-5">
          {/* QR Code Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider font-sans">
              {currentLanguage === 'vi' ? 'QUÉT QR ĐỂ GIA NHẬP' : 'SCAN QR TO JOIN'}
            </span>
            <div 
              onClick={() => setLargeQrOpen(true)}
              className="h-32 w-32 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shadow-inner bg-white cursor-zoom-in transition hover:scale-105 duration-200 group relative"
              title={currentLanguage === 'vi' ? 'Click để phóng to' : 'Click to enlarge'}
            >
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(joinLink)}`} 
                alt="Join QR" 
                className="h-full w-full object-contain"
              />
              {/* Magnifier icon overlay on hover */}
              <div className="absolute inset-0 bg-nexoraBrand/80 rounded-xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white select-none">
                <QrCode className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">PREVIEW</span>
              </div>
            </div>
            
            <div className="w-full space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase font-sans">
                {currentLanguage === 'vi' ? 'LIÊN KẾT GIA NHẬP' : 'JOIN LINK'}
              </span>
              <div className="flex gap-1.5">
                <input 
                  type="text" 
                  readOnly 
                  value={joinLink} 
                  className="h-8 flex-grow bg-white border border-slate-200 rounded px-2.5 text-[10px] text-slate-500 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(joinLink)
                    alert(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!')
                  }}
                  className="h-8 px-3 bg-slate-800 text-white rounded text-[10px] font-black uppercase hover:bg-slate-700 transition font-sans"
                >
                  {currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white pr-3 text-[9px] text-slate-400 font-black uppercase tracking-wider font-sans">
              {currentLanguage === 'vi' ? 'HOẶC GỬI TRỰC TIẾP' : 'OR SEND DIRECTLY'}
            </span>
          </div>

          {/* Send Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {currentLanguage === 'vi' ? 'Tên thợ' : 'Technician Name'}
              </label>
              <input 
                type="text" 
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" 
                placeholder="e.g. Mia Tran" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required
              />
              {errors.name && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setInviteMethod('SMS')
                  setErrors({})
                }}
                className={`h-9 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 font-sans ${
                  inviteMethod === 'SMS' 
                    ? 'border-amber-500 bg-amber-50 text-amber-700' 
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                SMS
              </button>
              <button
                type="button"
                onClick={() => {
                  setInviteMethod('Email')
                  setErrors({})
                }}
                className={`h-9 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 font-sans ${
                  inviteMethod === 'Email' 
                    ? 'border-amber-500 bg-amber-50 text-amber-700' 
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Email
              </button>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {inviteMethod === 'SMS' ? (currentLanguage === 'vi' ? 'Số điện thoại' : 'Phone Number') : 'Email Address'}
              </label>
              <input 
                type="text" 
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand font-mono" 
                placeholder={inviteMethod === 'SMS' ? 'e.g. 407-555-0123' : 'e.g. mia.tran@gmail.com'} 
                value={contact} 
                onChange={(e) => setContact(e.target.value)} 
                required
              />
              {errors.contact && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.contact}</p>}
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {currentLanguage === 'vi' ? 'Vai trò / Chức danh' : 'Role / Position'}
              </label>
              <input 
                type="text" 
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" 
                placeholder="e.g. Nail Tech" 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-1.5 font-sans"
            >
              <Send className="h-4 w-4" />
              {currentLanguage === 'vi' ? 'Gửi liên kết mời thợ' : 'Send Invite Link'}
            </button>
          </form>
        </div>
      </div>

      {/* Large Join QR Modal inside InviteShareModal */}
      {largeQrOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setLargeQrOpen(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider font-sans">
                {currentLanguage === 'vi' ? 'MÃ QR GIA NHẬP' : 'JOIN QR CODE'}
              </h3>
              <button 
                type="button"
                onClick={() => setLargeQrOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="h-64 w-64 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center shadow-inner bg-white mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(joinLink)}`}
                alt="Scan to Join" 
                className="h-full w-full object-contain"
              />
            </div>
            
            <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-xs mb-4 font-sans">
              {currentLanguage === 'vi' 
                ? 'Cho thợ quét mã này bằng camera điện thoại để tự đăng ký hoặc liên kết tài khoản vào tiệm.' 
                : 'Have technicians scan this QR code with their mobile camera to self-register or link accounts.'}
            </p>
            
            <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                {joinLink}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(joinLink)
                  alert(currentLanguage === 'vi' ? 'Đã sao chép liên kết gia nhập!' : 'Join link copied to clipboard!')
                }}
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0 font-sans"
              >
                <Copy className="h-3 w-3" />
                <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Dashboard({ 
  setupData, 
  verificationStatus = 'kyb_approved',
  hasKyb = verificationStatus === 'kyb_approved', 
  userEmail = '', 
  onKybRequired, 
  onKybSuccess, 
  initialMenu = 'overview', 
  initialSettingsTab = 'profile', 
  onLogout 
}) {
  const { currentLanguage, t } = useTranslation()
  const [showKybWarningModal, setShowKybWarningModal] = useState(false)
  const [activeMenu, setActiveMenu] = useState(initialMenu)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [tipsTab, setTipsTab] = useState('overview')
  const [processingFee, setProcessingFee] = useState(3.0)
  const [isTipsMobileExpanded, setIsTipsMobileExpanded] = useState(initialMenu === 'tips')
  const [touchpointsTab, setTouchpointsTab] = useState('stations')
  const [isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded] = useState(initialMenu === 'touchpoints')

  useEffect(() => {
    if (activeMenu === 'tips') {
      setIsTipsMobileExpanded(true)
      setIsTouchpointsMobileExpanded(false)
    } else if (activeMenu === 'touchpoints') {
      setIsTouchpointsMobileExpanded(true)
      setIsTipsMobileExpanded(false)
    }
  }, [activeMenu])
  const lastProcessedSetupData = useRef(null)
  const ignoreNextSync = useRef(false)

  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('nexora_merchant_setup')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.staffList?.length) {
          return parsed.staffList.map((member) => ({
            id: member.id,
            fullName: member.fullName,
            nickname: member.nickname,
            position: member.position,
            avatar: member.avatar || '',
            phone: member.phone || '',
            email: member.email || '',
            bio: member.bio || '',
            status: member.status || 'Active',
            flowType: member.flowType || '',
            isActive: member.isActive !== undefined ? member.isActive : true,
            showInTipsFlow: member.showInTipsFlow !== undefined ? member.showInTipsFlow : true,
            paymentAccounts: {
              venmo: member.paymentAccounts?.venmo || '',
              cashapp: member.paymentAccounts?.cashapp || '',
              zelle: member.paymentAccounts?.zelle || '',
              vlinkpay: member.paymentAccounts?.vlinkpay || '',
              paypal: member.paymentAccounts?.paypal || '',
              bankwire: member.paymentAccounts?.bankwire || '',
              applecash: member.paymentAccounts?.applecash || ''
            },
            payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
          }))
        }
      } catch (e) {}
    }
    if (setupData?.staffList?.length) {
      return setupData.staffList.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        nickname: member.nickname,
        position: member.position,
        avatar: member.avatar || '',
        phone: member.phone || '',
        email: member.email || '',
        bio: member.bio || '',
        status: member.status || 'Active',
        flowType: member.flowType || '',
        isActive: member.isActive !== undefined ? member.isActive : true,
        showInTipsFlow: member.showInTipsFlow !== undefined ? member.showInTipsFlow : true,
        paymentAccounts: {
          venmo: member.paymentAccounts?.venmo || '',
          cashapp: member.paymentAccounts?.cashapp || '',
          zelle: member.paymentAccounts?.zelle || '',
          vlinkpay: member.paymentAccounts?.vlinkpay || '',
          paypal: member.paymentAccounts?.paypal || '',
          bankwire: member.paymentAccounts?.bankwire || '',
          applecash: member.paymentAccounts?.applecash || ''
        },
        payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
      }))
    }
    return INITIAL_STAFF.map(member => ({
      ...member,
      payoutConfigs: getPayoutConfigsFromMember(member)
    }))
  })

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_profile_settings')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    // Fallback if not saved yet
    const setupDataStr = localStorage.getItem('nexora_merchant_setup')
    let parsedSetup = null
    if (setupDataStr) {
      try {
        parsedSetup = JSON.parse(setupDataStr)
      } catch (err) {}
    }
    const storeInfo = setupData?.businessInfo || parsedSetup?.businessInfo
    const reviewInfo = setupData?.reviewLinks || parsedSetup?.reviewLinks
    return {
      fullName: storeInfo?.ownerName || (hasKyb ? 'Elena Rostova' : ''),
      email: storeInfo?.businessEmail || userEmail || (hasKyb ? 'owner@goldenglownails.com' : ''),
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
      businessName: storeInfo?.name || (hasKyb ? 'Golden Glow Nail Spa & Salon' : ''),
      businessPhone: storeInfo?.phone || '',
      businessWebsite: storeInfo?.website || '',
      street: storeInfo?.address || '',
      googleReview: reviewInfo?.googleReview || '',
      yelpReview: reviewInfo?.yelpReview || '',
      paymentAccounts: storeInfo?.paymentAccounts || {
        zelle: '',
        bankwire: '',
        paypal: '',
        venmo: '',
        cashapp: '',
        applecash: '',
        vlinkpay: ''
      }
    }
  })

  const [settingsTab, setSettingsTab] = useState(initialSettingsTab)
  const [isProfileExpanded, setIsProfileExpanded] = useState(false)

  useEffect(() => {
    if (initialMenu) {
      setActiveMenu(initialMenu)
    }
  }, [initialMenu])

  useEffect(() => {
    if (initialSettingsTab) {
      setSettingsTab(initialSettingsTab)
    }
  }, [initialSettingsTab])

  const [transactions, setTransactions] = useState(() => {
    if (!hasKyb) return []
    try {
      const saved = localStorage.getItem('nexora_transactions')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    localStorage.setItem('nexora_transactions', JSON.stringify(INITIAL_TRANSACTIONS))
    return INITIAL_TRANSACTIONS
  })

  const [reviews, setReviews] = useState(() => {
    if (!hasKyb) return []
    try {
      const saved = localStorage.getItem('nexora_reviews')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    localStorage.setItem('nexora_reviews', JSON.stringify(INITIAL_REVIEWS))
    return INITIAL_REVIEWS
  })

  const [notifications, setNotifications] = useState(() => {
    if (!hasKyb) return []
    try {
      const saved = localStorage.getItem('nexora_notifications')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      console.error(e)
    }
    const initial = [
      { id: '1', type: 'feedback_alert', title: 'New Internal Feedback (2★)', message: 'Customer left feedback for Ashley P. at Pedicure Chair 02: "Great polish, but I waited 20 minutes after my appointment time."', time: '10 mins ago', read: false, linkTab: 'reviews' },
      { id: '2', type: 'tip_success', title: 'New Tip Received ($28.00)', message: 'Mia Tran received $28.00 tip via Venmo at Manicure Station 03.', time: '25 mins ago', read: true, linkTab: 'reports' },
      { id: '3', type: 'feedback_alert', title: 'New Internal Feedback (1★)', message: 'Customer left feedback for Vivian L. at Front Desk: "My color chipped after one day. I need someone to contact me."', time: '1 day ago', read: true, linkTab: 'reviews' }
    ]
    localStorage.setItem('nexora_notifications', JSON.stringify(initial))
    return initial
  })

  const [isNotiDropdownOpen, setIsNotiDropdownOpen] = useState(false)
  const [touchpoints, setTouchpoints] = useState(() => {
    const saved = localStorage.getItem('nexora_merchant_setup')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.touchPoints?.length) {
          return parsed.touchPoints
        }
      } catch (e) {}
    }
    if (setupData?.touchPoints?.length) {
      return setupData.touchPoints
    }
    return INITIAL_TOUCHPOINTS
  })
  const [devices, setDevices] = useState(INITIAL_DEVICES)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [qrTarget, setQrTarget] = useState(null)
  const [isInviteShareOpen, setIsInviteShareOpen] = useState(false)
  const [inviteShareDefaultName, setInviteShareDefaultName] = useState('')
  const [inviteShareDefaultContact, setInviteShareDefaultContact] = useState('')
  const [reviewFilterStaff, setReviewFilterStaff] = useState('all')
  const [newTouchpoint, setNewTouchpoint] = useState({ name: '', type: 'Table QR' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKpi, setActiveKpi] = useState('tips')
  const [chartRange, setChartRange] = useState('7 Days')
  const [selectedLeaderboardStaff, setSelectedLeaderboardStaff] = useState(STAFF_PERFORMANCE[0].nickname)
  const [viewingStaffDetailId, setViewingStaffDetailId] = useState(null)
  const [errors, setErrors] = useState({})
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    nickname: '',
    position: 'Nail Tech',
    avatar: '',
    phone: '',
    email: '',
    venmo: '',
    cashapp: '',
    zelle: '',
    vlinkpay: '',
    showInTipsFlow: true,
    payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
  })

  const businessName = profile?.businessName || setupData?.businessInfo?.name || 'Golden Glow Nail Spa'

  // Initialize sessionStorage with initial profile and setupData on mount
  useEffect(() => {
    if (profile) {
      const sessionProfile = sessionStorage.getItem('nexora_profile_settings')
      if (!sessionProfile) {
        sessionStorage.setItem('nexora_profile_settings', JSON.stringify(profile))
      }
    }
  }, [profile])

  useEffect(() => {
    if (setupData) {
      const sessionSetup = sessionStorage.getItem('nexora_merchant_setup')
      if (!sessionSetup) {
        sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(setupData))
      }
    }
  }, [setupData])

  useEffect(() => {
    if (setupData) {
      lastProcessedSetupData.current = setupData
      ignoreNextSync.current = true
    }
    if (setupData?.staffList?.length) {
      setStaff(setupData.staffList.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        nickname: member.nickname,
        position: member.position,
        avatar: member.avatar || '',
        phone: member.phone || '',
        email: member.email || '',
        bio: member.bio || '',
        status: member.status || 'Active',
        flowType: member.flowType || '',
        isActive: member.isActive !== undefined ? member.isActive : true,
        showInTipsFlow: member.showInTipsFlow !== undefined ? member.showInTipsFlow : true,
        paymentAccounts: {
          venmo: member.paymentAccounts?.venmo || '',
          cashapp: member.paymentAccounts?.cashapp || '',
          zelle: member.paymentAccounts?.zelle || '',
          vlinkpay: member.paymentAccounts?.vlinkpay || '',
          paypal: member.paymentAccounts?.paypal || '',
          bankwire: member.paymentAccounts?.bankwire || '',
          applecash: member.paymentAccounts?.applecash || ''
        },
        payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
      })))
    }
    if (setupData?.touchPoints?.length) {
      setTouchpoints(setupData.touchPoints)
    }
  }, [setupData])

  // Sync edits in dashboard to storage so simulator/customer flow gets the updates
  useEffect(() => {
    if (ignoreNextSync.current) {
      ignoreNextSync.current = false
      return
    }

    // If setupData changed but we haven't processed it in Hook 1 yet,
    // skip syncing to avoid overwriting the storage with stale local states.
    if (setupData && lastProcessedSetupData.current !== setupData) {
      return
    }

    // Also, if local staff list is empty but setupData has staff, don't overwrite storage with empty staff list!
    if (setupData?.staffList?.length && !staff.length) {
      return
    }

    const saved = localStorage.getItem('nexora_merchant_setup') || sessionStorage.getItem('nexora_merchant_setup')
    let parsed = null
    if (saved) {
      try {
        parsed = JSON.parse(saved)
      } catch (e) {}
    }
    if (!parsed && setupData) {
      parsed = { ...setupData }
    }
    if (parsed) {
      parsed.staffList = staff
      parsed.touchPoints = touchpoints
      localStorage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
      sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
    }
  }, [staff, touchpoints, setupData])

  // Listen for storage events (e.g. from customer flow tipping or settings edits)
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (!e || !e.key) {
          const val = localStorage.getItem('nexora_profile_settings') || sessionStorage.getItem('nexora_profile_settings')
          if (val) setProfile(JSON.parse(val))
          
          const txs = localStorage.getItem('nexora_transactions')
          if (txs) setTransactions(JSON.parse(txs))

          const revs = localStorage.getItem('nexora_reviews')
          if (revs) setReviews(JSON.parse(revs))

          const notis = localStorage.getItem('nexora_notifications')
          if (notis) setNotifications(JSON.parse(notis))
          return
        }

        if (e.key === 'nexora_transactions' && e.newValue) {
          setTransactions(JSON.parse(e.newValue))
        } else if (e.key === 'nexora_reviews' && e.newValue) {
          setReviews(JSON.parse(e.newValue))
        } else if (e.key === 'nexora_notifications' && e.newValue) {
          setNotifications(JSON.parse(e.newValue))
        } else if (e.key === 'nexora_profile_settings') {
          const val = e.newValue || localStorage.getItem('nexora_profile_settings') || sessionStorage.getItem('nexora_profile_settings')
          if (val) {
            setProfile(JSON.parse(val))
          }
        }
      } catch (err) {
        console.error('Error parsing synced storage key', e?.key, err)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle profile reset or load when hasKyb changes
  useEffect(() => {
    const saved = localStorage.getItem('nexora_profile_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (!hasKyb) {
          parsed.fullName = ''
          parsed.email = userEmail || ''
          parsed.businessName = ''
          parsed.paymentAccounts = {
            zelle: '',
            bankwire: '',
            paypal: '',
            venmo: '',
            cashapp: '',
            applecash: '',
            vlinkpay: ''
          }
        }
        setProfile(parsed)
      } catch (err) {}
    } else {
      const setupDataStr = localStorage.getItem('nexora_merchant_setup')
      let parsedSetup = null
      if (setupDataStr) {
        try {
          parsedSetup = JSON.parse(setupDataStr)
        } catch (err) {}
      }
      const storeInfo = setupData?.businessInfo || parsedSetup?.businessInfo
      const reviewInfo = setupData?.reviewLinks || parsedSetup?.reviewLinks
      setProfile({
        fullName: storeInfo?.ownerName || (hasKyb ? 'Elena Rostova' : ''),
        email: storeInfo?.businessEmail || userEmail || (hasKyb ? 'owner@goldenglownails.com' : ''),
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
        businessName: storeInfo?.name || (hasKyb ? 'Golden Glow Nail Spa & Salon' : ''),
        businessPhone: storeInfo?.phone || '',
        businessWebsite: storeInfo?.website || '',
        street: storeInfo?.address || '',
        googleReview: reviewInfo?.googleReview || '',
        yelpReview: reviewInfo?.yelpReview || '',
        paymentAccounts: storeInfo?.paymentAccounts || {
          zelle: '',
          bankwire: '',
          paypal: '',
          venmo: '',
          cashapp: '',
          applecash: '',
          vlinkpay: ''
        }
      })
    }
  }, [hasKyb, userEmail, setupData])

  // Filter lists based on searchQuery
  const filteredStaff = useMemo(() => {
    if (!hasKyb) return []
    if (!searchQuery) return staff
    const query = searchQuery.toLowerCase().trim()
    return staff.filter(member => 
      member.fullName.toLowerCase().includes(query) ||
      member.nickname.toLowerCase().includes(query) ||
      member.position.toLowerCase().includes(query)
    )
  }, [staff, searchQuery, hasKyb])

  const filteredTouchpoints = useMemo(() => {
    if (!hasKyb) return []
    if (!searchQuery) return touchpoints
    const query = searchQuery.toLowerCase().trim()
    return touchpoints.filter(point => 
      point.name.toLowerCase().includes(query) ||
      point.type.toLowerCase().includes(query) ||
      (point.staffName && point.staffName.toLowerCase().includes(query))
    )
  }, [touchpoints, searchQuery, hasKyb])

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews
    const query = searchQuery.toLowerCase().trim()
    return reviews.filter(rev => 
      rev.comment.toLowerCase().includes(query) ||
      rev.staffName.toLowerCase().includes(query) ||
      rev.category.toLowerCase().includes(query) ||
      String(rev.rating).includes(query)
    )
  }, [reviews, searchQuery])

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions
    const query = searchQuery.toLowerCase().trim()
    return transactions.filter(tx => 
      tx.id.toLowerCase().includes(query) ||
      tx.staffName.toLowerCase().includes(query) ||
      tx.touchpoint.toLowerCase().includes(query) ||
      tx.paymentMethod.toLowerCase().includes(query) ||
      tx.status.toLowerCase().includes(query) ||
      String(tx.amount).includes(query)
    )
  }, [transactions, searchQuery])

  const metrics = useMemo(() => {
    if (!hasKyb) {
      return {
        totalTips: 0.00,
        totalTransactions: 0,
        averageTip: 0.00,
        totalReviews: 0,
        googleRating: 0.0,
        googleReviews: 0,
        yelpRating: 0.0,
        yelpReviews: 0,
        responseRate: 0,
        returningCustomers: 0,
        returningCustomersDelta: 0
      }
    }
    return {
      totalTips: 4785.00,
      totalTransactions: 312,
      averageTip: 15.34,
      totalReviews: 128,
      googleRating: 4.8,
      googleReviews: 96,
      yelpRating: 4.5,
      yelpReviews: 32,
      responseRate: 68,
      returningCustomers: 68,
      returningCustomersDelta: 12
    }
  }, [hasKyb])

  const resetStaffForm = () => {
    setStaffForm({
      fullName: '',
      nickname: '',
      position: 'Nail Tech',
      avatar: '',
      phone: '',
      email: '',
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: '',
      nexoraStaffId: '',
      showInTipsFlow: true,
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
    })
    setEditingStaffId(null)
    setErrors({})
  }

  const openAddStaff = () => {
    resetStaffForm()
    setIsStaffModalOpen(true)
  }

  const openEditStaff = (member) => {
    setEditingStaffId(member.id)
    setStaffForm({
      fullName: member.fullName,
      nickname: member.nickname,
      position: member.position,
      avatar: member.avatar || '',
      phone: member.phone || '',
      email: member.email || '',
      venmo: member.paymentAccounts?.venmo || '',
      cashapp: member.paymentAccounts?.cashapp || '',
      zelle: member.paymentAccounts?.zelle || '',
      vlinkpay: member.paymentAccounts?.vlinkpay || '',
      nexoraStaffId: member.id || '',
      showInTipsFlow: member.showInTipsFlow !== false,
      payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
    })
    setErrors({})
    setIsStaffModalOpen(true)
  }

  const closeStaffModal = () => {
    setIsStaffModalOpen(false)
    resetStaffForm()
  }

  const saveStaff = () => {
    const nextErrors = {}
    if (!staffForm.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!staffForm.nickname.trim()) nextErrors.nickname = 'Public nickname is required.'
    if (staffForm.email?.trim() && !/\S+@\S+\.\S+/.test(staffForm.email.trim())) {
      nextErrors.email = t('setup.errors.staff_email_invalid') || 'Invalid email address format.'
    }
    
    const configs = staffForm.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const hasAnyActive = Object.values(configs).some(c => c.enabled && c.value.trim() !== '')
    if (!hasAnyActive && !staffForm.vlinkpay.trim()) {
      nextErrors.payment = 'Add at least one direct payment wallet.'
    }
    
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const payload = {
      fullName: staffForm.fullName.trim(),
      nickname: staffForm.nickname.trim(),
      position: staffForm.position.trim() || 'Nail Tech',
      avatar: staffForm.avatar || '',
      phone: staffForm.phone.trim(),
      email: staffForm.email.trim(),
      showInTipsFlow: staffForm.showInTipsFlow !== false,
      paymentAccounts: {
        venmo: configs.venmo?.enabled ? configs.venmo.value.trim() : '',
        cashapp: configs.cashapp?.enabled ? configs.cashapp.value.trim() : '',
        zelle: configs.zelle?.enabled ? configs.zelle.value.trim() : '',
        vlinkpay: staffForm.vlinkpay.trim(),
        paypal: configs.paypal?.enabled ? configs.paypal.value.trim() : '',
        bankwire: configs.bankwire?.enabled ? configs.bankwire.value.trim() : '',
        applecash: configs.applecash?.enabled ? configs.applecash.value.trim() : ''
      },
      payoutConfigs: configs
    }

    if (editingStaffId) {
      setStaff((current) => current.map((member) => member.id === editingStaffId ? { ...member, ...payload } : member))
    } else {
      const finalStaffId = staffForm.nexoraStaffId.trim() || `NEX-STAFF-${staffForm.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`
      const newMember = { id: finalStaffId, isActive: true, showInTipsFlow: true, status: 'Active', flowType: 'Direct Addition', ...payload }
      setStaff((current) => [...current, newMember])
      setTouchpoints((current) => [...current, {
        id: `tp-staff-${newMember.id}`,
        name: `Personal QR - ${newMember.nickname}`,
        type: 'Staff QR',
        staffId: newMember.id,
        staffName: newMember.nickname
      }])
    }
    closeStaffModal()
  }

  const sendSetupLinkFromModal = (formDetails) => {
    const nextErrors = {}
    if (!formDetails.fullName.trim()) nextErrors.fullName = 'Full name is required to invite.'
    if (!formDetails.email.trim() && !formDetails.phone.trim()) {
      nextErrors.email = 'Phone or email is required to send invite link.'
    }
    
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`
    const newMember = {
      id: tempId,
      fullName: formDetails.fullName.trim(),
      nickname: formDetails.nickname.trim() || formDetails.fullName.trim().split(' ')[0] + '.',
      position: formDetails.position.trim() || 'Nail Tech',
      avatar: formDetails.avatar || '',
      phone: formDetails.phone.trim(),
      email: formDetails.email.trim(),
      isActive: false,
      status: 'Pending Setup',
      flowType: 'Invite New Staff',
      paymentAccounts: {},
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
    }

    setStaff((current) => [...current, newMember])
    setTouchpoints((current) => [...current, {
      id: `tp-staff-${newMember.id}`,
      name: `Personal QR - ${newMember.nickname}`,
      type: 'Staff QR',
      staffId: newMember.id,
      staffName: newMember.nickname
    }])

    closeStaffModal()

    // Dispatch simulation event
    const inviteEvt = new CustomEvent('showSimulationInvite', {
      detail: {
        id: tempId,
        name: newMember.fullName,
        email: newMember.email,
        phone: newMember.phone,
        role: newMember.position,
        biz: businessName
      }
    })
    window.dispatchEvent(inviteEvt)
  }

  const handleLinkStaff = (globalMember, role) => {
    if (staff.some(s => s.id === globalMember.id)) {
      alert('This technician is already linked to your salon.');
      return;
    }

    const newMember = {
      id: globalMember.id,
      fullName: globalMember.fullName,
      nickname: globalMember.nickname,
      position: role,
      avatar: globalMember.avatar || '',
      phone: globalMember.phone || '',
      email: globalMember.email || '',
      isActive: false,
      status: 'Pending Acceptance',
      flowType: 'Link Existing Staff ID',
      paymentAccounts: globalMember.paymentAccounts || {},
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
    }

    setStaff((current) => [...current, newMember])
    setTouchpoints((current) => [...current, {
      id: `tp-staff-${newMember.id}`,
      name: `Personal QR - ${newMember.nickname}`,
      type: 'Staff QR',
      staffId: newMember.id,
      staffName: newMember.nickname
    }])

    // Trigger simulation alert
    const event = new CustomEvent('showSimulationInvite', {
      detail: {
        id: globalMember.id,
        name: globalMember.fullName,
        email: globalMember.email,
        phone: globalMember.phone,
        role: role,
        biz: businessName,
        isLinkOnly: true
      }
    })
    window.dispatchEvent(event)
  }

  const handleInviteStaff = (name, contact, role, method) => {
    const isEmail = contact.includes('@');
    const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`
    
    const newMember = {
      id: tempId,
      fullName: name.trim(),
      nickname: name.trim().split(' ')[0] + '.',
      position: role,
      avatar: '',
      phone: isEmail ? '' : contact.trim(),
      email: isEmail ? contact.trim() : '',
      isActive: false,
      status: 'Pending Setup',
      flowType: 'Invite New Staff',
      paymentAccounts: {},
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
    }

    setStaff((current) => [...current, newMember])
    setTouchpoints((current) => [...current, {
      id: `tp-staff-${newMember.id}`,
      name: `Personal QR - ${newMember.nickname}`,
      type: 'Staff QR',
      staffId: newMember.id,
      staffName: newMember.nickname
    }])

    // Trigger simulation setup
    const event = new CustomEvent('showSimulationInvite', {
      detail: {
        id: tempId,
        name: newMember.fullName,
        email: newMember.email,
        phone: newMember.phone,
        role: role,
        biz: businessName
      }
    })
    window.dispatchEvent(event)
  }

  const handleAcceptJoinRequest = (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    setStaff((current) => current.map((m) => {
      if (m.id === staffId) {
        return {
          ...m,
          status: 'Active',
          isActive: true
        }
      }
      return m
    }))

    setTouchpoints((current) => {
      const hasTp = current.some(tp => tp.staffId === staffId)
      if (!hasTp) {
        return [...current, {
          id: `tp-staff-${staffId}`,
          name: `Personal QR - ${member.nickname}`,
          type: 'Staff QR',
          staffId: staffId,
          staffName: member.nickname
        }]
      }
      return current
    })

    alert(currentLanguage === 'vi' 
      ? `Đã chấp nhận và lưu thông tin thợ ${member.fullName} vào tiệm!` 
      : `Accepted and saved technician ${member.fullName} to salon!`)
  }

  const handleDeclineJoinRequest = (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    if (confirm(currentLanguage === 'vi' 
      ? `Bạn có chắc chắn muốn từ chối yêu cầu tham gia của thợ ${member.fullName}?` 
      : `Are you sure you want to decline join request from ${member.fullName}?`)) {
      setStaff((current) => current.filter((m) => m.id !== staffId))
      setTouchpoints((current) => current.filter((tp) => tp.staffId !== staffId))
    }
  }

  const deleteStaff = (id) => {
    if (!confirm('Delete this staff member from Nexora Touch?')) return
    setStaff((current) => current.filter((member) => member.id !== id))
    setTouchpoints((current) => current.filter((point) => !(point.type === 'Staff QR' && point.staffId === id)))
    if (viewingStaffDetailId === id) {
      setViewingStaffDetailId(null)
    }
  }

  const toggleStaff = (id) => {
    setStaff((current) => current.map((member) => member.id === id ? { ...member, isActive: !member.isActive } : member))
  }

  const toggleStaffTipsFlow = (id) => {
    setStaff((current) => current.map((member) => member.id === id ? { ...member, showInTipsFlow: member.showInTipsFlow === false ? true : false } : member))
  }

  const addTouchpoint = (name, type, deviceId) => {
    const finalName = typeof name === 'string' ? name.trim() : (newTouchpoint.name || '').trim()
    const finalType = typeof type === 'string' ? type : (newTouchpoint.type || 'Table QR')
    const finalDeviceId = typeof deviceId === 'string' ? deviceId.trim() : ''

    if (!finalName) return
    setTouchpoints((current) => [...current, {
      id: `tp-${Date.now()}`,
      name: finalName,
      type: finalType,
      deviceId: finalDeviceId || undefined,
      isActive: true,
      scans: 0
    }])
    setNewTouchpoint({ name: '', type: 'Table QR' })
  }

  const linkDevice = (id, deviceId) => {
    setTouchpoints((current) =>
      current.map((point) =>
        point.id === id ? { ...point, deviceId: deviceId.trim() || undefined } : point
      )
    )
  }

  const toggleTouchpointStatus = (id) => {
    setTouchpoints((current) => current.map((point) => point.id === id ? { ...point, isActive: point.isActive === false ? true : false } : point))
  }

  const handleAddDevice = (newDevice) => {
    setDevices((current) => [
      ...current,
      {
        id: 'dev-' + Date.now(),
        deviceId: newDevice.deviceId,
        type: newDevice.type,
        location: newDevice.location,
        isActive: true,
        lastScan: 'N/A',
        scans: 0
      }
    ])
  }

  const handleDeleteDevice = (id) => {
    setDevices((current) => current.filter((dev) => dev.id !== id))
  }

  const handleToggleDeviceStatus = (id) => {
    setDevices((current) =>
      current.map((dev) =>
        dev.id === id ? { ...dev, isActive: !dev.isActive } : dev
      )
    )
  }

  const previewQr = (target) => {
    setQrTarget({
      name: target.name || `Personal QR - ${target.nickname}`,
      subtitle: target.position || target.type || 'Staff QR',
      slug: target.nickname ? `staff/${slugify(target.nickname)}` : `tp/${target.id}`,
      isActive: target.isActive !== undefined ? target.isActive : true
    })
  }

  const handleNavigateMenu = (menuId) => {
    setActiveMenu(menuId)
    setViewingStaffDetailId(null)
  }

  const navigateMenu = (menuId) => {
    setActiveMenu(menuId)
    setViewingStaffDetailId(null)
    setIsMobileMenuOpen(false)
  }

  const handleSelectLeaderboardStaff = (nickname) => {
    setSelectedLeaderboardStaff(nickname)
    const member = staff.find((s) => s.nickname === nickname || s.fullName.toLowerCase().includes(nickname.toLowerCase().split(' ')[0]))
    if (member) {
      setViewingStaffDetailId(member.id)
    }
  }

  const renderContent = () => {
    if (viewingStaffDetailId) {
      const activeDetailStaff = staff.find((member) => member.id === viewingStaffDetailId)
      if (activeDetailStaff) {
        return (
          <StaffDetailView
            staffMember={activeDetailStaff}
            onBack={() => setViewingStaffDetailId(null)}
            transactions={transactions}
            reviews={reviews}
            onEdit={openEditStaff}
            onQr={previewQr}
            onDelete={deleteStaff}
          />
        )
      }
    }
    if (activeMenu === 'overview') {
      return (
        <Overview
          metrics={metrics}
          activeKpi={activeKpi}
          setActiveKpi={setActiveKpi}
          chartRange={chartRange}
          setChartRange={setChartRange}
          selectedStaff={selectedLeaderboardStaff}
          setSelectedStaff={handleSelectLeaderboardStaff}
          onOpenTouchpoints={() => setActiveMenu('touchpoints')}
          onOpenReviews={() => setActiveMenu('reviews')}
          businessName={businessName}
          previewQr={previewQr}
          hasKyb={hasKyb}
        />
      )
    }
    if (activeMenu === 'staff') return (
      <StaffView 
        staff={filteredStaff} 
        onAdd={openAddStaff} 
        onEdit={openEditStaff} 
        onDelete={deleteStaff} 
        onQr={previewQr} 
        onToggle={toggleStaff} 
        onToggleTipsFlow={toggleStaffTipsFlow} 
        onViewDetail={setViewingStaffDetailId} 
        onLinkStaff={handleLinkStaff}
        onInviteStaff={handleInviteStaff}
        businessName={businessName}
        onAcceptJoin={handleAcceptJoinRequest}
        onDeclineJoin={handleDeclineJoinRequest}
      />
    )
    if (activeMenu === 'touchpoints') {
      return (
        <TouchpointsView
          touchpoints={filteredTouchpoints}
          newTouchpoint={newTouchpoint}
          setNewTouchpoint={setNewTouchpoint}
          onAdd={addTouchpoint}
          onDelete={(id) => setTouchpoints((current) => current.filter((point) => point.id !== id))}
          onQr={previewQr}
          onToggleStatus={toggleTouchpointStatus}
          onLinkDevice={linkDevice}
          transactions={transactions}
          businessName={businessName}
          devices={devices}
          onAddDevice={handleAddDevice}
          onDeleteDevice={handleDeleteDevice}
          onToggleDeviceStatus={handleToggleDeviceStatus}
          activeSubTab={touchpointsTab}
          onTabChange={setTouchpointsTab}
        />
      )
    }
    if (activeMenu === 'reviews') return (
      <ReviewsView
        reviews={filteredReviews}
        staff={staff}
        filter={reviewFilterStaff}
        setFilter={setReviewFilterStaff}
        setupData={setupData}
      />
    )
    if (activeMenu === 'tips') return (
      <TipsView 
        transactions={transactions} 
        staff={staff} 
        activeTab={tipsTab} 
        onTabChange={setTipsTab}
        processingFee={processingFee}
        setProcessingFee={setProcessingFee}
      />
    )
    if (activeMenu === 'reports') return <ReportsView transactions={filteredTransactions} staff={staff} touchpoints={touchpoints} />
    if (activeMenu === 'settings') {
      return (
        <SettingsView
          setupData={setupData}
          hasKyb={hasKyb}
          verificationStatus={verificationStatus}
          onBlockedFeatureClick={() => setShowKybWarningModal(true)}
          userEmail={userEmail}
          onKybRequired={onKybRequired}
          initialTab={settingsTab}
          onTabChange={setSettingsTab}
          onKybSuccess={onKybSuccess}
        />
      )
    }
    if (activeMenu === 'analytics') {
      return (
        <AnalyticsView
          transactions={transactions}
          staff={staff}
          touchpoints={touchpoints}
          processingFee={processingFee}
        />
      )
    }
    if (activeMenu === 'support') {
      return (
        <SupportView />
      )
    }
    return <ComingSoon activeMenu={activeMenu} onBack={() => setActiveMenu('overview')} />
  }

  return (
    <div className="min-h-screen bg-nexoraCanvas font-sans text-nexoraText">
      <DashboardSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={handleNavigateMenu} 
        businessName={businessName} 
        profile={profile}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        hasKyb={hasKyb}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onLogout={onLogout} 
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        touchpointsTab={touchpointsTab}
        setTouchpointsTab={setTouchpointsTab}
      />

      <div className="lg:pl-72">
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTouchpoint={() => setActiveMenu('touchpoints')}
          profile={profile}
          businessName={businessName}
          onNavigateSettingsTab={(tab) => {
            setActiveMenu('settings')
            setSettingsTab(tab)
          }}
          onLogout={onLogout}
          notifications={notifications}
          setNotifications={setNotifications}
          isNotiDropdownOpen={isNotiDropdownOpen}
          setIsNotiDropdownOpen={setIsNotiDropdownOpen}
          onNavigateMenu={handleNavigateMenu}
          staff={staff}
          transactions={transactions}
          reviews={reviews}
          touchpoints={touchpoints}
          onViewStaffDetail={setViewingStaffDetailId}
        />

        <div className="sticky top-16 z-10 flex items-center justify-between border-b border-nexoraBorder bg-white px-4 py-3 lg:hidden">
          <span className="text-sm font-extrabold">NEXORA TOUCH</span>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText shadow-nexora-soft"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <main className="min-h-screen p-4 sm:p-6 lg:p-7">
          {activeMenu !== 'overview' && !viewingStaffDetailId && (
            <button
              onClick={() => handleNavigateMenu('overview')}
              className="mb-5 inline-flex h-9 items-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-extrabold text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            >
              Back to Dashboard
            </button>
          )}
          {renderContent()}
        </main>
      </div>

      <button
        onClick={() => document.documentElement.classList.toggle('dark')}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraSurface text-nexoraMuted shadow-lg"
        title="Toggle theme hook"
        aria-label="Toggle theme hook"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </button>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-nexoraText/60"
            aria-label="Close navigation menu"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <aside className="relative flex h-full w-[min(84vw,320px)] flex-col bg-nexoraSidebar px-5 py-6 text-white shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/assets/nexora-logo.png" alt="Nexora Logo" className="h-10 w-10 object-contain" />
                <div>
                  <div className="text-xl font-extrabold leading-none">{t('dashboard.sidebar.console_title')}</div>
                  <div className="mt-1 text-xs text-white/60">{t('dashboard.sidebar.console_subtitle')}</div>
                </div>
              </div>
              <IconButton label="Close menu" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            {/* Expandable Profile Card for Mobile */}
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 shrink-0">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsProfileExpanded(!isProfileExpanded)}>
                <div className="flex items-center gap-3 min-w-0">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="" className="h-9 w-9 rounded-full border border-white/10 object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-extrabold">
                      {profile.fullName ? profile.fullName.charAt(0) : businessName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-white/50 uppercase tracking-wider">{businessName}</div>
                    <div className="flex items-center gap-1 min-w-0 mt-0.5">
                      <div className="truncate text-xs font-bold text-white">{profile.fullName || businessName}</div>
                    </div>
                    <div className="text-[10px] text-white/40 truncate mt-0.5">{profile.email}</div>
                  </div>
                </div>
                <div className="text-white/70 hover:text-white transition ml-2">
                  {isProfileExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </div>
              </div>

              {/* Submenu links */}
              {isProfileExpanded && (
                <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1 animate-fadeIn">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu('settings')
                      setSettingsTab('profile')
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold transition ${
                      activeMenu === 'settings' && settingsTab === 'profile'
                        ? 'text-brandCyan font-extrabold'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'profile' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                    <span>{t('dashboard.menu.business_setting') || 'Business Setting'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMenu('settings')
                      setSettingsTab('kyb')
                      setIsMobileMenuOpen(false)
                    }}
                    className={`flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-xs font-bold transition ${
                      activeMenu === 'settings' && settingsTab === 'kyb'
                        ? 'text-brandCyan font-extrabold'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className={`h-1.5 w-1.5 rounded-full ${activeMenu === 'settings' && settingsTab === 'kyb' ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                    <span>{t('dashboard.menu.kyb') || 'Business Verification'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Card 2: Current Plan & Manage Plan (Mobile) */}
            <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-3.5 shrink-0">
              <div className="text-[9px] font-extrabold uppercase tracking-wider text-white/45">
                {t('dashboard.sidebar.current_plan_header') || 'CURRENT PLAN'}
              </div>
              {hasKyb ? (
                <>
                  <div className="mt-0.5 text-xs font-black text-white">
                    {t('dashboard.sidebar.plan_name') || 'Pro Plan'}
                  </div>
                  <div className="mt-0.5 text-[10px] text-white/55">
                    {t('dashboard.sidebar.renews_text') || 'Renews on Jun 20, 2024'}
                  </div>
                </>
              ) : (
                <div className="mt-0.5 text-[10px] font-semibold text-rose-400">
                  {t('dashboard.sidebar.no_plan') || 'No current plan'}
                </div>
              )}
              <button 
                type="button"
                onClick={() => navigateMenu('subscriptions')}
                className="mt-2.5 w-full rounded-lg border border-white/15 py-1 text-center text-[10.5px] font-bold text-luxuryGold hover:bg-white/5 hover:border-white/25 transition-all"
              >
                {t('dashboard.sidebar.manage_plan') || 'Manage Plan'}
              </button>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
              {MENU_ITEMS.filter((item) => item.id !== 'settings').map((item) => {
                const { id, label } = item
                const isActive = activeMenu === id
                const localizedLabel = {
                  overview: t('dashboard.menu.dashboard'),
                  staff: t('dashboard.menu.staff'),
                  tips: t('dashboard.menu.tips'),
                  reviews: t('dashboard.menu.reviews'),
                  reports: t('dashboard.menu.transactions'),
                  touchpoints: t('dashboard.menu.touchpoints'),
                  devices: t('dashboard.menu.qr_nfc'),
                  analytics: t('dashboard.menu.analytics'),
                  support: t('dashboard.menu.support')
                }[id] || label

                return (
                  <React.Fragment key={id}>
                    <button
                      onClick={() => {
                        if (verificationStatus !== 'kyb_approved' && (id === 'tips' || id === 'devices')) {
                          setShowKybWarningModal(true)
                        } else {
                          setActiveMenu(id)
                          if (id === 'tips') {
                            setIsTipsMobileExpanded(!isTipsMobileExpanded)
                          } else if (id === 'touchpoints') {
                            setIsTouchpointsMobileExpanded(!isTouchpointsMobileExpanded)
                          } else {
                            setIsMobileMenuOpen(false)
                            setViewingStaffDetailId(null)
                          }
                        }
                      }}
                      className={`flex min-h-11 w-full items-center justify-between rounded-lg px-4 text-left text-sm font-bold transition ${
                        isActive
                          ? 'bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] text-white shadow-lg shadow-[#2B59FF]/20'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <MenuIcon item={item} active={isActive} />
                        <span>{localizedLabel}</span>
                      </div>
                      {(id === 'tips' || id === 'touchpoints') && (
                        <div className="text-white/50 shrink-0">
                          {id === 'tips' 
                            ? (isTipsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                            : (isTouchpointsMobileExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)
                          }
                        </div>
                      )}
                    </button>

                    {id === 'tips' && isTipsMobileExpanded && (
                      <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3 animate-fadeIn">
                        {[
                          { id: 'overview', label: t('dashboard.tips.tabs.overview') || 'Overview' },
                          { id: 'savings', label: t('dashboard.tips.tabs.savings') || 'Direct Savings' },
                          { id: 'transactions', label: t('dashboard.tips.tabs.transactions') || 'Tip Transactions' },
                          { id: 'payouts', label: t('dashboard.tips.tabs.payouts') || 'Staff Payouts' }
                        ].map(sub => {
                          const isSubActive = activeMenu === 'tips' && tipsTab === sub.id
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setActiveMenu('tips')
                                setTipsTab(sub.id)
                                setViewingStaffDetailId(null)
                                setIsMobileMenuOpen(false)
                              }}
                              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                                isSubActive
                                  ? 'text-brandCyan font-extrabold'
                                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                              <span>{sub.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {id === 'touchpoints' && isTouchpointsMobileExpanded && (
                      <div className="ml-9 mt-1 space-y-1 border-l border-white/10 pl-3 animate-fadeIn">
                        {[
                          { id: 'stations', label: t('dashboard.touchpoints.tabs.stations') || 'QR Stations' },
                          { id: 'devices', label: t('dashboard.touchpoints.tabs.devices') || 'Hardware Devices' }
                        ].map(sub => {
                          const isSubActive = activeMenu === 'touchpoints' && touchpointsTab === sub.id
                          return (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => {
                                setActiveMenu('touchpoints')
                                setTouchpointsTab(sub.id)
                                setViewingStaffDetailId(null)
                                setIsMobileMenuOpen(false)
                              }}
                              className={`flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-xs font-bold transition ${
                                isSubActive
                                  ? 'text-brandCyan font-extrabold'
                                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                              }`}
                            >
                              <div className={`h-1.5 w-1.5 rounded-full ${isSubActive ? 'bg-brandCyan shadow-sm' : 'bg-white/30'}`} />
                              <span>{sub.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </nav>

            <div className="mt-auto pt-4 border-t border-white/10 shrink-0">
              <button 
                onClick={onLogout} 
                className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-white/65 transition hover:text-white w-full" 
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('dashboard.sidebar.sign_out')}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <StaffModal
        open={isStaffModalOpen}
        editing={Boolean(editingStaffId)}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onClose={closeStaffModal}
        onSave={saveStaff}
        onOpenInviteShare={(formDetails) => {
          setInviteShareDefaultName(formDetails.fullName || '')
          setInviteShareDefaultContact(formDetails.email || formDetails.phone || '')
          setIsInviteShareOpen(true)
        }}
      />
      <QrModal target={qrTarget} businessName={businessName} onClose={() => setQrTarget(null)} />

      <InviteShareModal
        open={isInviteShareOpen}
        businessName={businessName}
        defaultName={inviteShareDefaultName}
        defaultContact={inviteShareDefaultContact}
        onClose={() => setIsInviteShareOpen(false)}
        onSendInvite={(name, contact, role) => {
          const isEmail = contact.includes('@')
          const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`
          
          const newMember = {
            id: tempId,
            fullName: name.trim() || 'New Technician',
            nickname: name.trim() ? name.trim().split(' ')[0] + '.' : 'Tech.',
            position: role || 'Nail Technician',
            avatar: '',
            phone: isEmail ? '' : contact.trim(),
            email: isEmail ? contact.trim() : '',
            isActive: false,
            status: 'Pending Setup',
            flowType: 'Invite New Staff',
            paymentAccounts: {},
            payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
          }

          setStaff((current) => [...current, newMember])
          setTouchpoints((current) => [...current, {
            id: `tp-staff-${newMember.id}`,
            name: `Personal QR - ${newMember.nickname}`,
            type: 'Staff QR',
            staffId: newMember.id,
            staffName: newMember.nickname
          }])

          const event = new CustomEvent('showSimulationInvite', {
            detail: {
              id: tempId,
              name: newMember.fullName,
              email: newMember.email,
              phone: newMember.phone,
              role: role || 'Nail Technician',
              biz: businessName
            }
          })
          window.dispatchEvent(event)
          setIsInviteShareOpen(false)
          closeStaffModal()
        }}
      />

      {/* KYB Verification Warning Modal for gated features */}
      {showKybWarningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-nexoraBorder max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexoraWarning/10 text-nexoraWarning mx-auto shrink-0 shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-nexoraText uppercase tracking-wider">
                {currentLanguage === 'vi' ? 'Yêu cầu xác thực KYB' : 'KYB Verification Required'}
              </h3>
              <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
                {currentLanguage === 'vi'
                  ? 'Tính năng này yêu cầu hồ sơ doanh nghiệp đã được xác thực KYB bởi VLINKPAY. Nhấp vào nút bên dưới để chuyển hướng đến trang Cài đặt > KYB để gửi thông tin doanh nghiệp của bạn.'
                  : 'This feature requires your business profile to be KYB verified by VLINKPAY. Click below to navigate to Settings > KYB tab and submit your compliance information.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowKybWarningModal(false)}
                className="px-5 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                {currentLanguage === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowKybWarningModal(false)
                  setActiveMenu('settings')
                  setSettingsTab('kyb')
                  setIsMobileMenuOpen(false)
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse"
              >
                {currentLanguage === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PayoutSetupModal({ open, walletKey, staffName, initialValue, initialQrCode, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue || '')
  const [qrCode, setQrCode] = useState(initialQrCode || '')
  const [accountName, setAccountName] = useState(staffName || '')
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(initialValue || '')
    setQrCode(initialQrCode || '')
    setAccountName(staffName || '')
    setError('')
  }, [open, walletKey, initialValue, initialQrCode, staffName])

  if (!open) return null

  const walletNames = {
    zelle: 'Zelle',
    bankwire: 'Bank Wire',
    paypal: 'PayPal',
    venmo: 'Venmo',
    cashapp: 'Cash App',
    applecash: 'Apple Cash'
  }

  const walletFields = {
    zelle: 'email/phone',
    bankwire: 'details',
    paypal: 'email',
    venmo: '@username',
    cashapp: '$cashtag',
    applecash: 'phone number'
  }

  const walletPlaceholders = {
    zelle: 'Enter Zelle email/phone...',
    bankwire: 'Account & Routing numbers',
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: 'Enter phone number...'
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setQrCode(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleTakePhoto = () => {
    setIsCapturing(true)
    setTimeout(() => {
      const mockQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        value || 'nexora-mock-payout'
      )}`
      setQrCode(mockQr)
      setIsCapturing(false)
    }, 800)
  }

  const handleClearQr = () => {
    setQrCode('')
  }

  const handleSubmit = () => {
    if (!value.trim()) {
      setError(t('setup.errors.field_required') || 'This field is required.')
      return
    }
    onSubmit(value, qrCode, accountName)
  }

  const brandStyles = {
    venmo: { text: 'venmo', color: 'text-[#008CFF]', fontClass: 'font-black italic text-lg tracking-tight' },
    cashapp: { text: 'cash app', color: 'text-[#00D632]', fontClass: 'font-extrabold text-lg tracking-tighter' },
    zelle: { text: 'zelle', color: 'text-[#7414CA]', fontClass: 'font-black text-lg' },
    paypal: { text: 'PayPal', color: 'text-[#003087]', fontClass: 'font-black italic text-lg' },
    applecash: { text: 'Apple Cash', color: 'text-black', fontClass: 'font-black text-lg tracking-tight' },
    bankwire: { text: 'Bank Wire', color: 'text-[#475569]', fontClass: 'font-bold uppercase text-xs tracking-widest' }
  }[walletKey] || { text: walletKey, color: 'text-slate-800', fontClass: 'font-bold' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-extrabold text-slate-800">
            {t('setup.setup_wallet_title', { wallet: walletNames[walletKey] }) || `Set up ${walletNames[walletKey]} account`}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('setup.payout_input_label', { wallet: walletNames[walletKey], field: walletFields[walletKey] }) || `Your ${walletNames[walletKey]} ${walletFields[walletKey]} *`}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              placeholder={walletPlaceholders[walletKey]}
              className={`mt-1.5 h-10 w-full rounded-lg border px-3 text-sm font-semibold outline-none focus:ring-1 focus:ring-nexoraBrand transition-all ${
                error ? 'border-rose-500 focus:border-rose-500' : 'border-slate-200 focus:border-nexoraBrand'
              }`}
            />
            {error && <p className="mt-1 text-[10px] font-bold text-rose-500">{error}</p>}
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
              {t('setup.qr_code_optional') || 'QR Code (optional)'}
            </label>

            {isCapturing ? (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <span className="mt-2 text-xs font-semibold text-slate-500">{t('setup.taking_photo') || 'Taking photo...'}</span>
              </div>
            ) : qrCode ? (
              <div className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleClearQr}
                  className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-800">{accountName}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{value}</div>
                </div>
                <div className="my-3 flex h-28 w-28 items-center justify-center border border-slate-100 bg-white p-1 rounded-lg">
                  <img src={qrCode} alt="Payout QR Code" className="h-full w-full object-contain" />
                </div>
                <div className={`${brandStyles.color} ${brandStyles.fontClass}`}>
                  {brandStyles.text}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                >
                  <Camera className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.take_photo') || 'Take photo'}</span>
                </button>
                <label
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.choose_file') || 'Choose file'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </label>
              </div>
            )}
            {!qrCode && (
              <p className="mt-2 text-[10px] text-slate-400 leading-normal">
                {t('setup.uploader_hint') || 'You can either take a photo or upload from your device. Accepted formats: JPG, PNG, JPEG. Max size: 5MB per file.'}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10.5px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {t('setup.payout_warning') || 'Please enter the correct receiving account information. This will be used to receive payments.'}
            </span>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
          >
            {t('setup.close') || 'Close'}
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white hover:opacity-90 shadow-sm transition"
          >
            {t('setup.submit') || 'Submit'}
          </button>
        </div>
      </div>
    </div>
  )
}

