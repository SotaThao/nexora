import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  ClipboardList,
  Download,
  Edit2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Plus,
  Pointer,
  QrCode,
  Scissors,
  Search,
  Settings,
  ShieldAlert,
  Sparkles,
  Star,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  Wallet,
  X
} from 'lucide-react'
import StaffDetailView from './StaffDetailView'
import { useTranslation } from '../contexts/LanguageContext'

const INITIAL_STAFF = [
  {
    id: '1',
    fullName: 'Mia Tran',
    nickname: 'Mia T.',
    position: 'Gel-X Artist',
    isActive: true,
    paymentAccounts: { venmo: '@mia-nails', cashapp: '$miaglow', zelle: 'mia.tran@gmail.com', vlinkpay: '' }
  },
  {
    id: '2',
    fullName: 'Vivian Le',
    nickname: 'Vivian L.',
    position: 'Acrylic Specialist',
    isActive: true,
    paymentAccounts: { venmo: '', cashapp: '$vivianle', zelle: '407-555-0199', vlinkpay: 'VLP-8893-VL' }
  },
  {
    id: '3',
    fullName: 'Ashley Park',
    nickname: 'Ashley P.',
    position: 'Pedicure Lead',
    isActive: true,
    paymentAccounts: { venmo: '@ashley-pedi', cashapp: '', zelle: 'ashley@glownails.com', vlinkpay: '' }
  },
  {
    id: '4',
    fullName: 'Hanna Nguyen',
    nickname: 'Hanna Ng.',
    position: 'Nail Art Designer',
    isActive: false,
    paymentAccounts: { venmo: '@hanna-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-HN' }
  }
]

const INITIAL_TRANSACTIONS = [
  { id: 'TX-2042', dateTime: '2026-05-25 14:32', amount: 28, staffName: 'Mia T.', staffId: '1', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2041', dateTime: '2026-05-25 13:10', amount: 35, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Front Desk', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2040', dateTime: '2026-05-25 11:05', amount: 22, staffName: 'Ashley P.', staffId: '3', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2039', dateTime: '2026-05-24 17:45', amount: 30, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Manicure Station 01', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2038', dateTime: '2026-05-24 15:20', amount: 18, staffName: 'Mia T.', staffId: '1', touchpoint: 'Receipt QR', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2037', dateTime: '2026-05-23 10:15', amount: 24, staffName: 'Ashley P.', staffId: '3', touchpoint: 'VIP Pedicure Room', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2036', dateTime: '2026-05-24 13:20', amount: 25, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Nail Art Station 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2035', dateTime: '2026-05-24 14:05', amount: 24, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Acrylic Station 01', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2034', dateTime: '2026-05-24 11:15', amount: 45, staffName: 'Mia T.', staffId: '1', touchpoint: 'Manicure Station 03', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2033', dateTime: '2026-05-24 09:30', amount: 30, staffName: 'Ashley P.', staffId: '3', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2032', dateTime: '2026-05-23 17:10', amount: 15, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Nail Art Station 02', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2031', dateTime: '2026-05-23 15:50', amount: 40, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Front Desk', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2030', dateTime: '2026-05-23 16:40', amount: 32, staffName: 'Mia T.', staffId: '1', touchpoint: 'Receipt QR', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2029', dateTime: '2026-05-23 14:25', amount: 18, staffName: 'Ashley P.', staffId: '3', touchpoint: 'VIP Pedicure Room', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2028', dateTime: '2026-05-23 11:05', amount: 30, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2027', dateTime: '2026-05-23 10:30', amount: 28, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Acrylic Station 01', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2026', dateTime: '2026-05-22 13:10', amount: 25, staffName: 'Mia T.', staffId: '1', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2025', dateTime: '2026-05-22 11:50', amount: 35, staffName: 'Ashley P.', staffId: '3', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2024', dateTime: '2026-05-22 16:30', amount: 22, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Nail Art Station 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2023', dateTime: '2026-05-22 15:15', amount: 32, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2022', dateTime: '2026-05-22 09:45', amount: 38, staffName: 'Mia T.', staffId: '1', touchpoint: 'Receipt QR', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2021', dateTime: '2026-05-21 17:10', amount: 28, staffName: 'Ashley P.', staffId: '3', touchpoint: 'VIP Pedicure Room', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2020', dateTime: '2026-05-21 15:45', amount: 18, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Front Desk', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2019', dateTime: '2026-05-21 16:00', amount: 15, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Acrylic Station 01', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2018', dateTime: '2026-05-21 14:20', amount: 50, staffName: 'Mia T.', staffId: '1', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2017', dateTime: '2026-05-21 10:05', amount: 20, staffName: 'Ashley P.', staffId: '3', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2016', dateTime: '2026-05-20 12:20', amount: 35, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Nail Art Station 02', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2015', dateTime: '2026-05-20 14:10', amount: 42, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Front Desk', paymentMethod: 'VLINKPAY', status: 'Success' },
  { id: 'TX-2014', dateTime: '2026-05-20 11:30', amount: 22, staffName: 'Mia T.', staffId: '1', touchpoint: 'Receipt QR', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2012', dateTime: '2026-05-19 14:50', amount: 26, staffName: 'Hanna Ng.', staffId: '4', touchpoint: 'Front Desk', paymentMethod: 'Zelle', status: 'Success' }
]

const INITIAL_REVIEWS = [
  { id: 'R-1', rating: 5, comment: 'Mia shaped my Gel-X set perfectly and the chrome finish looks premium.', staffName: 'Mia T.', staffId: '1', category: 'Good (Google)', date: '2026-05-25' },
  { id: 'R-2', rating: 5, comment: 'Vivian was fast, clean, and helped me pick a wedding color.', staffName: 'Vivian L.', staffId: '2', category: 'Good (Yelp)', date: '2026-05-25' },
  { id: 'R-3', rating: 2, comment: 'Great polish, but I waited 20 minutes after my appointment time.', staffName: 'Ashley P.', staffId: '3', category: 'Internal Feedback', date: '2026-05-24' },
  { id: 'R-4', rating: 4, comment: 'Pedicure was relaxing and the salon was very clean.', staffName: 'Ashley P.', staffId: '3', category: 'Good (Google)', date: '2026-05-23' },
  { id: 'R-5', rating: 1, comment: 'My color chipped after one day. I need someone to contact me.', staffName: 'Vivian L.', staffId: '2', category: 'Internal Feedback', date: '2026-05-22' },
  { id: 'R-6', rating: 5, comment: 'Incredible attention to detail! Best Gel-X artist in the city.', staffName: 'Mia T.', staffId: '1', category: 'Good (Yelp)', date: '2026-05-24' },
  { id: 'R-7', rating: 5, comment: 'Vivian does the most natural looking acrylic sets!', staffName: 'Vivian L.', staffId: '2', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-8', rating: 5, comment: 'Ashley gives the absolute best foot massages during pedicures!', staffName: 'Ashley P.', staffId: '3', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-9', rating: 5, comment: 'Sofia is a master of nail art. She drew exactly what I showed her!', staffName: 'Hanna Ng.', staffId: '4', category: 'Good (Google)', date: '2026-05-24' },
  { id: 'R-10', rating: 4, comment: 'Love the shape, Mia is very sweet. Will definitely come back.', staffName: 'Mia T.', staffId: '1', category: 'Good (Google)', date: '2026-05-22' },
  { id: 'R-11', rating: 4, comment: 'Fast service and very friendly staff. Nice atmosphere.', staffName: 'Vivian L.', staffId: '2', category: 'Good (Google)', date: '2026-05-21' },
  { id: 'R-12', rating: 3, comment: 'The nail art was beautiful, but the top coat was uneven.', staffName: 'Hanna Ng.', staffId: '4', category: 'Internal Feedback', date: '2026-05-21' },
  { id: 'R-13', rating: 5, comment: 'Stunning designs and very professional service.', staffName: 'Hanna Ng.', staffId: '4', category: 'Good (Yelp)', date: '2026-05-20' }
]

const INITIAL_TOUCHPOINTS = [
  { id: 'tp-main', name: 'Lobby Welcome QR', type: 'Business Main' },
  { id: 'tp-front', name: 'Front Desk Checkout', type: 'Front Desk' },
  { id: 'tp-mani-1', name: 'Manicure Station 01', type: 'Table QR' },
  { id: 'tp-pedi-2', name: 'Pedicure Chair 02', type: 'Table QR' },
  { id: 'tp-receipt', name: 'Receipt Bottom QR', type: 'Receipt QR' }
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
  { id: 'devices', label: 'QR / NFC Devices', icon: QrCode, image: '/assets/menu/qr-nfc.png' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, image: '/assets/menu/star.png' },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: HelpCircle }
]

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

function DashboardHeader({ searchQuery, setSearchQuery, onAddTouchpoint, onSettings }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-3 border-b border-nexoraBorder bg-nexoraSurface px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3 sm:hidden">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-nexoraBrand text-sm font-black text-white">N</div>
        <span className="truncate text-sm font-extrabold">NEXORA TOUCH</span>
      </div>
      <div className="relative hidden w-full max-w-[385px] sm:block">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
        <input
          className="nexora-search-input"
          placeholder={t('dashboard.header.search_placeholder')}
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
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

        <IconButton label="Notifications" className="hidden sm:inline-flex">
          <Bell className="h-5 w-5" />
        </IconButton>
        <IconButton label="Settings" onClick={onSettings} className="hidden sm:inline-flex">
          <Settings className="h-5 w-5" />
        </IconButton>
        <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-nexoraBrand text-sm font-bold text-white shadow-nexora-soft sm:flex">
          A
        </div>
        <button onClick={onAddTouchpoint} className="nexora-primary-button">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t('dashboard.header.add_tp')}</span>
        </button>
      </div>
    </header>
  )
}

function DashboardSidebar({ activeMenu, setActiveMenu, businessName, onLogout }) {
  const { currentLanguage, setLanguage, t } = useTranslation()
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-nexoraSidebar px-5 py-7 text-white lg:flex">
      <div className="flex items-center gap-3 px-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-nexoraBrand text-xl font-black text-white shadow-nexora-soft">N</div>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold leading-none tracking-normal">{t('dashboard.sidebar.console_title')}</div>
          <div className="mt-1 text-sm font-semibold text-white/65">{t('dashboard.sidebar.console_subtitle')}</div>
        </div>
      </div>

      <nav className="mt-9 flex-1 space-y-2">
        {MENU_ITEMS.map((item) => {
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
            settings: t('dashboard.menu.settings'),
            support: t('dashboard.menu.support')
          }[id] || label

          return (
            <button
              key={id}
              onClick={() => setActiveMenu(id)}
              className={`flex h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold transition ${
                isActive
                  ? 'bg-white/10 text-white shadow-[inset_3px_0_0_rgba(255,255,255,0.7)]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <MenuIcon item={item} active={isActive} />
              <span className="truncate">{localizedLabel}</span>
            </button>
          )
        })}
      </nav>

      <div className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-extrabold">
              {businessName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold">{businessName}</div>
              <div className="text-xs text-white/55">{t('dashboard.sidebar.plan_info')}</div>
            </div>
          </div>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-white/65 transition hover:text-white">
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

function KpiCard({ label, value, delta, tone = 'brand', iconSrc, active = false, onClick }) {
  const animatedValue = useCountUp(value)
  const toneClass = {
    brand: 'bg-nexoraBrandSoft text-nexoraBrand',
    teal: 'bg-emerald-50 text-nexoraTeal',
    warning: 'bg-amber-50 text-nexoraWarning',
    danger: 'bg-red-50 text-nexoraDanger'
  }[tone]

  return (
    <button
      type="button"
      onClick={onClick}
      className={`nexora-card dashboard-kpi-card min-h-[132px] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-premium sm:min-h-[144px] sm:p-6 ${active ? 'ring-2 ring-nexoraBrand ring-offset-2' : ''}`}
    >
      <div className="flex items-start justify-between">
        {iconSrc ? (
          <img src={iconSrc} alt="" className="dashboard-kpi-icon h-10 w-10 object-contain" aria-hidden="true" />
        ) : (
          <span className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
            <span className="h-3.5 w-3.5 rounded-full bg-current" />
          </span>
        )}
        <span className="dashboard-delta text-sm font-semibold text-nexoraSuccess">+{delta}</span>
      </div>
      <div className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-nexoraMuted">{label}</div>
      <div className="dashboard-kpi-value mt-3 text-2xl font-black leading-none text-nexoraText sm:text-3xl">{animatedValue}</div>
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
  const maxValue = Math.max(...series.map((item) => item.value))
  const max = Math.ceil(maxValue / 1000) * 1000
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

function TipsOverTimePanel({ range, setRange }) {
  const { t } = useTranslation()
  const chartRef = useRef(null)
  const [reveal, setReveal] = useState(0)
  const [hoverIndex, setHoverIndex] = useState(null)
  const series = TIP_SERIES_BY_RANGE[range] || TIP_SERIES_BY_RANGE['7 Days']
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
        <div className="flex h-[265px] flex-col justify-between text-right text-sm text-nexoraSubtle">
          {yTicks.map((tick) => (
            <span key={tick}>{formatCurrency(tick).replace('.00', '')}</span>
          ))}
        </div>
        <div
          ref={chartRef}
          className="dashboard-scrub-chart relative h-[260px] min-w-0 cursor-crosshair touch-pan-y select-none sm:h-[300px]"
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          <svg className="h-[265px] w-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
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
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1="0"
                x2={width}
                y1={height - (tick / max) * height}
                y2={height - (tick / max) * height}
                className="stroke-slate-300 dark:stroke-slate-700"
                strokeWidth="1"
                strokeOpacity={0.07}
              />
            ))}
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
              {/* Regular data points that pop up as the line sweeps over them */}
              {transitionedPoints.map((point, index) => {
                const pointProgress = point.x / width;
                const isRevealed = reveal >= pointProgress;
                return (
                  <circle
                    key={`${point.label}-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r="5"
                    className="fill-white stroke-nexoraBrand cursor-pointer transition-transform duration-300"
                    strokeWidth="2.5"
                    style={{
                      transform: isRevealed ? 'scale(1)' : 'scale(0)',
                      transformOrigin: `${point.x}px ${point.y}px`,
                      transition: 'transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                )
              })}
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
                {/* Animated outer glow ring */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="13"
                  className="dashboard-pulse-ring fill-nexoraBrand/20 stroke-none pointer-events-none"
                  style={{
                    transformOrigin: `${activePoint.x}px ${activePoint.y}px`,
                    transition: 'cx 150ms cubic-bezier(0.16, 1, 0.3, 1), cy 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
                {/* Main active dot (solid blue circle with white outline) */}
                <circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r="8"
                  className="fill-nexoraBrand stroke-white pointer-events-none"
                  strokeWidth="3"
                  style={{
                    transition: 'cx 150ms cubic-bezier(0.16, 1, 0.3, 1), cy 150ms cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                />
              </>
            )}
          </svg>
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

function StaffLeaderboardPanel({ selectedStaff, setSelectedStaff }) {
  const { t } = useTranslation()
  const rows = STAFF_PERFORMANCE.slice(0, 4)
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
          <span>4-5★ to Google/Yelp</span>
          <ArrowRight className="h-5 w-5" />
        </div>
        <div className="flex h-14 items-center justify-between rounded-lg bg-nexoraBrand px-5 text-base font-medium text-white">
          <span>1-3★ private recovery</span>
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

function Overview({ metrics, activeKpi, setActiveKpi, chartRange, setChartRange, selectedStaff, setSelectedStaff, onOpenTouchpoints, onOpenReviews }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label={t('dashboard.kpi.total_tips')} value={formatCurrency(metrics.totalTips)} delta="18.6%" tone="brand" iconSrc="/assets/menu/tips.png" active={activeKpi === 'tips'} onClick={() => setActiveKpi('tips')} />
        <KpiCard label={t('dashboard.kpi.scans')} value={metrics.scans.toLocaleString()} delta="12.3%" tone="teal" iconSrc="/assets/menu/qr-nfc.png" active={activeKpi === 'scans'} onClick={() => setActiveKpi('scans')} />
        <KpiCard label={t('dashboard.kpi.reviews')} value={metrics.totalReviews.toString()} delta="9.7%" tone="warning" iconSrc="/assets/menu/review.png" active={activeKpi === 'reviews'} onClick={() => setActiveKpi('reviews')} />
        <KpiCard label={t('dashboard.kpi.avg_rating')} value={metrics.averageRating} delta="0.15" tone="danger" iconSrc="/assets/menu/star.png" active={activeKpi === 'rating'} onClick={() => setActiveKpi('rating')} />
        <KpiCard label={t('dashboard.kpi.scans_conversion')} value={`${metrics.conversion}%`} delta="2.1%" tone="brand" iconSrc="/assets/menu/conversion.png" active={activeKpi === 'conversion'} onClick={() => setActiveKpi('conversion')} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <TipsOverTimePanel range={chartRange} setRange={setChartRange} />
        <StaffLeaderboardPanel selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TopTouchPointsPanel onOpen={onOpenTouchpoints} />
        <ReviewRoutingPanel onOpen={onOpenReviews} />
        <LiveActivityPanel />
      </div>
    </div>
  )
}

function StaffView({ staff, onAdd, onEdit, onDelete, onQr, onToggle, onViewDetail }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('setup.staff_directory_title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('setup.desc_step_2')}</p>
        </div>
        <button onClick={onAdd} className="inline-flex h-9 items-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white">
          <Plus className="h-4 w-4" />
          {t('setup.add_staff_btn')}
        </button>
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white">
        <div className="hidden grid-cols-[2fr_1.1fr_1.6fr_1fr_118px] gap-3 border-b border-nexoraRule px-5 py-3 text-[10px] font-extrabold uppercase text-nexoraMuted lg:grid">
          <span>{t('setup.staff_fullname')} / {t('setup.staff_position')}</span>
          <span>{t('setup.staff_displayname')}</span>
          <span>{t('setup.add_staff_title') || 'Linked Wallets'}</span>
          <span>{t('dashboard.activity_log.col_status')}</span>
          <span className="text-right">{t('dashboard.top_touchpoints.manage')}</span>
        </div>
        {staff.map((member) => {
          const wallets = walletLabels(member.paymentAccounts)
          return (
            <div key={member.id} className="grid grid-cols-1 gap-3 border-b border-nexoraRule px-5 py-4 text-sm last:border-0 lg:grid-cols-[2fr_1.1fr_1.6fr_1fr_118px] lg:items-center">
              <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onViewDetail(member.id)}>
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-10 w-10 rounded-full border border-nexoraBorder object-cover group-hover:opacity-85 transition" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-sm font-extrabold text-rose-600 group-hover:bg-rose-100 transition">
                    {member.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-extrabold text-nexoraText group-hover:text-nexoraBrand transition">{member.fullName}</div>
                  <div className="text-xs text-nexoraMuted">{member.position}</div>
                </div>
              </div>
              <span className="font-semibold text-nexoraText">{member.nickname}</span>
              <div className="flex flex-wrap gap-1.5">
                {wallets.map((wallet) => (
                  <span key={wallet} className="rounded-md bg-nexoraCanvas px-2 py-1 text-[10px] font-bold text-nexoraBrand">{wallet}</span>
                ))}
              </div>
              <button onClick={() => onToggle(member.id)} className={`w-fit rounded-full px-3 py-1 text-[10px] font-extrabold ${member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {member.isActive ? t('common.active') : t('common.inactive')}
              </button>
              <div className="flex justify-end gap-1.5">
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
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TouchpointsView({ touchpoints, newTouchpoint, setNewTouchpoint, onAdd, onDelete, onQr }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.touchpoints')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('setup.qr_touchpoints_desc')}</p>
      </div>
      <Panel className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            value={newTouchpoint.name}
            onChange={(event) => setNewTouchpoint({ ...newTouchpoint, name: event.target.value })}
            placeholder={t('dashboard.modals.tp_name_label')}
            className="h-10 rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand"
          />
          <select
            value={newTouchpoint.type}
            onChange={(event) => setNewTouchpoint({ ...newTouchpoint, type: event.target.value })}
            className="h-10 rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand"
          >
            <option value="Table QR">Table QR</option>
            <option value="Front Desk">Front Desk</option>
            <option value="Receipt QR">Receipt QR</option>
            <option value="Business Main">Business Main</option>
            <option value="Staff QR">Staff QR</option>
          </select>
          <button onClick={onAdd} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white">
            <Plus className="h-4 w-4" />
            {t('setup.add_tp_btn')}
          </button>
        </div>
      </Panel>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {touchpoints.map((point) => (
          <Panel key={point.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-md bg-nexoraCanvas px-2 py-1 text-[10px] font-bold uppercase text-nexoraBrand">{point.type}</span>
                <h3 className="mt-3 font-extrabold text-nexoraText">{point.name}</h3>
                <p className="mt-1 text-[11px] text-nexoraMuted">nexora.vlinkpay.com/touch/{point.id}</p>
              </div>
              <IconButton label={t('common.delete')} onClick={() => onDelete(point.id)} className="hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
            <button onClick={() => onQr(point)} className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-nexoraBrand">
              <QrCode className="h-4 w-4" />
              {t('dashboard.modals.download_print_qr')}
            </button>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function ReviewsView({ reviews, staff, filter, setFilter }) {
  const { t } = useTranslation()
  const filtered = filter === 'all' ? reviews : reviews.filter((review) => review.staffId === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.reviews')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('setup.review_routing_policy')}</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-9 rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-semibold text-nexoraText outline-none">
          <option value="all">{t('staff_detail.tab_all')}</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>{member.nickname}</option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {filtered.map((review) => (
          <Panel key={review.id} className="p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-nexoraText">{review.rating}.0★</span>
                  <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${review.rating >= 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{review.category}</span>
                </div>
                <p className="mt-2 text-sm text-nexoraText">"{review.comment}"</p>
                <p className="mt-2 text-xs text-nexoraMuted">{review.staffName} - {review.date}</p>
              </div>
              <span className="text-xs font-bold text-nexoraBrand">{review.rating >= 4 ? t('customer.google_review_btn') : t('customer.submit_internal_btn')}</span>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function ReportsView({ transactions }) {
  const { t } = useTranslation()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.transactions')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('dashboard.activity_log.title')}</p>
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
            {transactions.map((tx) => (
              <tr key={tx.id} className="border-t border-nexoraRule">
                <td className="px-4 py-3 font-bold text-nexoraText">{tx.id}</td>
                <td className="px-4 py-3 text-nexoraMuted">{tx.dateTime}</td>
                <td className="px-4 py-3 font-extrabold text-nexoraText">{formatCurrency(tx.amount)}</td>
                <td className="px-4 py-3">{tx.staffName}</td>
                <td className="px-4 py-3">{tx.touchpoint}</td>
                <td className="px-4 py-3">{tx.paymentMethod}</td>
                <td className="px-4 py-3 text-emerald-600">{tx.status}</td>
              </tr>
            ))}
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

function StaffModal({ open, editing, form, errors, setForm, onClose, onSave }) {
  const { t } = useTranslation()
  if (!open) return null

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setForm({ ...form, avatar: reader.result })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-lg font-extrabold text-nexoraText">{editing ? t('common.edit') : t('setup.add_staff_title')}</h2>
          <IconButton label="Close modal" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-5 space-y-4">
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
          <div>
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('setup.add_staff_title')}</label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.venmo} onChange={(event) => setForm({ ...form, venmo: event.target.value })} placeholder="Venmo @handle" />
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.cashapp} onChange={(event) => setForm({ ...form, cashapp: event.target.value })} placeholder="Cash App $cashtag" />
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.zelle} onChange={(event) => setForm({ ...form, zelle: event.target.value })} placeholder="Zelle phone/email" />
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.vlinkpay} onChange={(event) => setForm({ ...form, vlinkpay: event.target.value })} placeholder="VLINKPAY ID" />
            </div>
            {errors.payment && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />{errors.payment}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          <button onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted">{t('common.cancel')}</button>
          <button onClick={onSave} className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white">{t('common.save')}</button>
        </div>
      </div>
    </div>
  )
}

function QrModal({ target, businessName, onClose }) {
  const { t } = useTranslation()
  if (!target) return null

  // Build the live customer portal URL for this touchpoint/staff QR
  const qrUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=${encodeURIComponent(target.slug)}&biz=${encodeURIComponent(businessName)}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl animate-scaleUp">
        <div className="flex justify-end">
          <IconButton label="Close QR preview" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <h2 className="mt-1 text-lg font-extrabold text-nexoraText">{target.name}</h2>
        <p className="text-xs text-nexoraMuted">{target.subtitle}</p>
        {!target.isActive && (
          <div className="mt-3 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-[10px] font-bold text-amber-700">
            <ShieldAlert className="h-3.5 w-3.5" />
            This personal QR is blocked while the staff member is inactive.
          </div>
        )}
        <div className="mx-auto mt-5 flex aspect-[2/3] w-44 flex-col items-center justify-between rounded-2xl bg-nexoraText p-4 text-white shadow-xl">
          <div className="h-1 w-14 rounded-full bg-rose-300" />
          <div>
            <div className="text-[10px] font-extrabold uppercase text-rose-200">{businessName}</div>
            <div className="mt-1 text-[8px] font-bold uppercase text-slate-300">Scan to tip and review</div>
          </div>
          
          {/* Real Scan-Ready QR Code */}
          <div className="h-28 w-28 rounded-lg bg-white p-2 flex items-center justify-center shadow-inner">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrUrl)}`}
              alt="Scan QR code to tip and review"
              className="h-full w-full object-contain"
            />
          </div>

          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300">
            <Scissors className="h-3 w-3 text-rose-200" />
            Secure redirect by VLINKPAY
          </div>
        </div>
        
        <p className="mt-4 rounded-lg bg-nexoraCanvas px-3 py-2 text-[10px] font-mono text-nexoraMuted select-all">
          nexora.vlinkpay.com/touch/{target.slug}
        </p>

        {/* Browser simulator trigger */}
        <div className="mt-3.5">
          <a
            href={qrUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[10.5px] font-black text-nexoraBrand hover:underline tracking-wide bg-nexoraBrandSoft px-3 py-1.5 rounded-lg transition"
          >
            <span>{t('dashboard.modals.customer_view_test') || 'Mô phỏng quét QR (Mở trang khách) ›'}</span>
          </a>
        </div>

        <button 
          onClick={() => window.print()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white hover:bg-opacity-90 transition"
        >
          <Download className="h-4 w-4" />
          {t('dashboard.modals.download_print_qr') || 'Print / Download Design'}
        </button>
      </div>
    </div>
  )
}

export default function Dashboard({ setupData, onLogout }) {
  const [activeMenu, setActiveMenu] = useState('overview')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [transactions] = useState(INITIAL_TRANSACTIONS)
  const [reviews] = useState(INITIAL_REVIEWS)
  const [touchpoints, setTouchpoints] = useState(INITIAL_TOUCHPOINTS)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [qrTarget, setQrTarget] = useState(null)
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
    venmo: '',
    cashapp: '',
    zelle: '',
    vlinkpay: ''
  })

  const businessName = setupData?.businessInfo?.name || 'Golden Glow Nail Spa'

  useEffect(() => {
    if (setupData?.staffList?.length) {
      setStaff(setupData.staffList.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        nickname: member.nickname,
        position: member.position,
        avatar: member.avatar || '',
        isActive: true,
        paymentAccounts: {
          venmo: member.paymentAccounts?.venmo || '',
          cashapp: member.paymentAccounts?.cashapp || '',
          zelle: member.paymentAccounts?.zelle || '',
          vlinkpay: member.paymentAccounts?.vlinkpay || ''
        }
      })))
    }
    if (setupData?.touchPoints?.length) {
      setTouchpoints(setupData.touchPoints)
    }
  }, [setupData])

  const metrics = useMemo(() => ({
    totalTips: 2742.68,
    scans: 4892,
    totalReviews: 312,
    averageRating: '4.68',
    conversion: '21.74'
  }), [])

  const resetStaffForm = () => {
    setStaffForm({ fullName: '', nickname: '', position: 'Nail Tech', avatar: '', venmo: '', cashapp: '', zelle: '', vlinkpay: '' })
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
      venmo: member.paymentAccounts.venmo,
      cashapp: member.paymentAccounts.cashapp,
      zelle: member.paymentAccounts.zelle,
      vlinkpay: member.paymentAccounts.vlinkpay
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
    if (!staffForm.venmo.trim() && !staffForm.cashapp.trim() && !staffForm.zelle.trim() && !staffForm.vlinkpay.trim()) {
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
      paymentAccounts: {
        venmo: staffForm.venmo.trim(),
        cashapp: staffForm.cashapp.trim(),
        zelle: staffForm.zelle.trim(),
        vlinkpay: staffForm.vlinkpay.trim()
      }
    }

    if (editingStaffId) {
      setStaff((current) => current.map((member) => member.id === editingStaffId ? { ...member, ...payload } : member))
    } else {
      const newMember = { id: Date.now().toString(), isActive: true, ...payload }
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

  const addTouchpoint = () => {
    if (!newTouchpoint.name.trim()) return
    setTouchpoints((current) => [...current, {
      id: `tp-${Date.now()}`,
      name: newTouchpoint.name.trim(),
      type: newTouchpoint.type
    }])
    setNewTouchpoint({ ...newTouchpoint, name: '' })
  }

  const previewQr = (target) => {
    setQrTarget({
      name: target.name || `Personal QR - ${target.nickname}`,
      subtitle: target.position || target.type || 'Staff QR',
      slug: target.nickname ? `staff/${slugify(target.nickname)}` : `tp/${slugify(target.name)}`,
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
        />
      )
    }
    if (activeMenu === 'staff') return <StaffView staff={staff} onAdd={openAddStaff} onEdit={openEditStaff} onDelete={deleteStaff} onQr={previewQr} onToggle={toggleStaff} onViewDetail={setViewingStaffDetailId} />
    if (activeMenu === 'touchpoints') {
      return (
        <TouchpointsView
          touchpoints={touchpoints}
          newTouchpoint={newTouchpoint}
          setNewTouchpoint={setNewTouchpoint}
          onAdd={addTouchpoint}
          onDelete={(id) => setTouchpoints((current) => current.filter((point) => point.id !== id))}
          onQr={previewQr}
        />
      )
    }
    if (activeMenu === 'reviews') return <ReviewsView reviews={reviews} staff={staff} filter={reviewFilterStaff} setFilter={setReviewFilterStaff} />
    if (activeMenu === 'reports') return <ReportsView transactions={transactions} />
    return <ComingSoon activeMenu={activeMenu} onBack={() => setActiveMenu('overview')} />
  }

  return (
    <div className="min-h-screen bg-nexoraCanvas font-sans text-nexoraText">
      <DashboardSidebar activeMenu={activeMenu} setActiveMenu={handleNavigateMenu} businessName={businessName} onLogout={onLogout} />

      <div className="lg:pl-72">
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTouchpoint={() => setActiveMenu('touchpoints')}
          onSettings={() => setActiveMenu('settings')}
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
          {searchQuery && (
            <div className="mb-5 rounded-xl border border-nexoraBorder bg-white px-4 py-3 text-sm font-semibold text-nexoraMuted shadow-nexora-soft">
              Filtering dashboard for <span className="font-extrabold text-nexoraText">"{searchQuery}"</span>
            </div>
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
            <div className="mb-7 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-nexoraBrand text-lg font-black text-white">N</div>
                <div>
                  <div className="text-xl font-extrabold leading-none">Nexora</div>
                  <div className="mt-1 text-xs text-white/60">Admin Console</div>
                </div>
              </div>
              <IconButton label="Close menu" onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:bg-white/10">
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto">
              {MENU_ITEMS.map((item) => {
                const { id, label } = item
                const isActive = activeMenu === id
                return (
                  <button
                    key={id}
                    onClick={() => navigateMenu(id)}
                    className={`flex min-h-12 w-full items-center gap-3 rounded-lg px-4 text-left text-sm font-bold transition ${
                      isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <MenuIcon item={item} active={isActive} />
                    {label}
                  </button>
                )
              })}
            </nav>

            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <div className="truncate text-sm font-extrabold">{businessName}</div>
                <div className="mt-1 text-xs text-white/55">Owner - Pro Plan</div>
              </div>
              <button 
                onClick={onLogout} 
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" 
                title="Sign out"
              >
                <LogOut className="h-4.5 w-4.5" />
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
        onClose={closeStaffModal}
        onSave={saveStaff}
      />
      <QrModal target={qrTarget} businessName={businessName} onClose={() => setQrTarget(null)} />
    </div>
  )
}
