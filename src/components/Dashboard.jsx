import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  Download,
  Edit2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Plus,
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
  Users,
  Wallet,
  X
} from 'lucide-react'

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
    fullName: 'Sofia Martinez',
    nickname: 'Sofia M.',
    position: 'Nail Art Designer',
    isActive: false,
    paymentAccounts: { venmo: '@sofia-art', cashapp: '', zelle: '', vlinkpay: 'VLP-1148-SM' }
  }
]

const INITIAL_TRANSACTIONS = [
  { id: 'TX-2042', dateTime: '2026-05-25 14:32', amount: 28, staffName: 'Mia T.', staffId: '1', touchpoint: 'Manicure Station 03', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2041', dateTime: '2026-05-25 13:10', amount: 35, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Front Desk', paymentMethod: 'VLinkPay', status: 'Success' },
  { id: 'TX-2040', dateTime: '2026-05-25 11:05', amount: 22, staffName: 'Ashley P.', staffId: '3', touchpoint: 'Pedicure Chair 02', paymentMethod: 'Cash App', status: 'Success' },
  { id: 'TX-2039', dateTime: '2026-05-24 17:45', amount: 30, staffName: 'Vivian L.', staffId: '2', touchpoint: 'Manicure Station 01', paymentMethod: 'Zelle', status: 'Success' },
  { id: 'TX-2038', dateTime: '2026-05-24 15:20', amount: 18, staffName: 'Mia T.', staffId: '1', touchpoint: 'Receipt QR', paymentMethod: 'Venmo', status: 'Success' },
  { id: 'TX-2037', dateTime: '2026-05-23 10:15', amount: 24, staffName: 'Ashley P.', staffId: '3', touchpoint: 'VIP Pedicure Room', paymentMethod: 'VLinkPay', status: 'Success' }
]

const INITIAL_REVIEWS = [
  { id: 'R-1', rating: 5, comment: 'Mia shaped my Gel-X set perfectly and the chrome finish looks premium.', staffName: 'Mia T.', staffId: '1', category: 'Good (Google)', date: '2026-05-25' },
  { id: 'R-2', rating: 5, comment: 'Vivian was fast, clean, and helped me pick a wedding color.', staffName: 'Vivian L.', staffId: '2', category: 'Good (Yelp)', date: '2026-05-25' },
  { id: 'R-3', rating: 2, comment: 'Great polish, but I waited 20 minutes after my appointment time.', staffName: 'Ashley P.', staffId: '3', category: 'Internal Feedback', date: '2026-05-24' },
  { id: 'R-4', rating: 4, comment: 'Pedicure was relaxing and the salon was very clean.', staffName: 'Ashley P.', staffId: '3', category: 'Good (Google)', date: '2026-05-23' },
  { id: 'R-5', rating: 1, comment: 'My color chipped after one day. I need someone to contact me.', staffName: 'Vivian L.', staffId: '2', category: 'Internal Feedback', date: '2026-05-22' }
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
  { name: 'Sofia Martinez', nickname: 'Sofia M.', tips: 318.25, rating: 4.61, reviews: 28, pct: 52, specialty: 'Nail Art' },
  { name: 'Hannah Kim', nickname: 'Hannah K.', tips: 276.58, rating: 4.57, reviews: 24, pct: 45, specialty: 'Dip Powder' }
]

const TOP_TOUCHPOINTS = [
  { name: 'Manicure Station 01', type: 'QR', scans: 1102, conversion: 24.6 },
  { name: 'Front Desk Checkout', type: 'QR', scans: 842, conversion: 18.7 },
  { name: 'Pedicure Chair 02', type: 'QR', scans: 636, conversion: 16.8 },
  { name: 'Receipt Bottom QR', type: 'QR', scans: 436, conversion: 15.1 }
]

const MENU_ITEMS = [
  { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'tips', label: 'Tips', icon: Wallet },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'reports', label: 'Transactions', icon: ClipboardList },
  { id: 'touchpoints', label: 'Touch Points', icon: QrCode },
  { id: 'devices', label: 'QR / NFC Devices', icon: QrCode },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
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
    .map(([key]) => ({ venmo: 'Venmo', cashapp: 'Cash App', zelle: 'Zelle', vlinkpay: 'VLinkPay' }[key]))
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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

function DashboardHeader() {
  return (
    <header className="sticky top-0 z-20 hidden h-20 items-center justify-between border-b border-nexoraBorder bg-nexoraSurface px-8 lg:flex">
      <div className="relative w-full max-w-[480px]">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
        <input
          className="nexora-search-input"
          placeholder="Search tech, station, review..."
        />
      </div>

      <div className="flex items-center gap-5">
        <IconButton label="Notifications">
          <Bell className="h-5 w-5" />
        </IconButton>
        <IconButton label="Settings">
          <Settings className="h-5 w-5" />
        </IconButton>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nexoraBrand text-sm font-bold text-white shadow-nexora-soft">
          A
        </div>
        <button className="nexora-primary-button">
          Add New Touch Point
        </button>
      </div>
    </header>
  )
}

function PageTitle() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-normal text-nexoraText sm:text-4xl">Salon Command Center</h1>
      <p className="mt-3 text-base font-medium text-nexoraMuted sm:text-lg">
        Live tip flow, QR/NFC scans, review routing, and nail tech performance.
      </p>
    </div>
  )
}

function KpiCard({ label, value, delta, tone = 'brand' }) {
  const toneClass = {
    brand: 'bg-nexoraBrandSoft text-nexoraBrand',
    teal: 'bg-emerald-50 text-nexoraTeal',
    warning: 'bg-amber-50 text-nexoraWarning',
    danger: 'bg-red-50 text-nexoraDanger'
  }[tone]

  return (
    <Panel className="min-h-[166px] p-6">
      <div className="flex items-start justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${toneClass}`}>
          <span className="h-3.5 w-3.5 rounded-full bg-current" />
        </span>
        <span className="text-sm font-semibold text-nexoraSuccess">+{delta}</span>
      </div>
      <div className="mt-7 text-xs font-semibold uppercase tracking-[0.18em] text-nexoraMuted">{label}</div>
      <div className="mt-3 text-4xl font-semibold leading-none text-nexoraText">{value}</div>
    </Panel>
  )
}

const TIP_SERIES = [
  { label: 'Mon', value: 1200 },
  { label: 'Tue', value: 1900 },
  { label: 'Wed', value: 3000 },
  { label: 'Thu', value: 2500 },
  { label: 'Fri', value: 3800 },
  { label: 'Sat', value: 4200 },
  { label: 'Sun', value: 3500 }
]

function buildChartPoints(series) {
  const width = 680
  const height = 265
  const max = 4500
  return series.map((item, index) => ({
    ...item,
    x: (index / (series.length - 1)) * width,
    y: height - (item.value / max) * height
  }))
}

function TipsOverTimePanel() {
  const chartPoints = buildChartPoints(TIP_SERIES)
  const linePoints = chartPoints.map((point) => `${point.x},${point.y}`).join(' ')
  const areaPoints = `0,265 ${linePoints} 680,265`
  const yTicks = [4500, 4000, 3500, 3000, 2500, 2000, 1500, 1000, 500, 0]

  return (
    <Panel className="p-7">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-nexoraText">Tips Over Time</h2>
        <span className="text-sm font-semibold text-nexoraMuted">May 19 - May 25</span>
      </div>
      <div className="mt-8 grid grid-cols-[56px_1fr] gap-3">
        <div className="flex h-[265px] flex-col justify-between text-right text-sm text-nexoraSubtle">
          {yTicks.map((tick) => (
            <span key={tick}>${tick}</span>
          ))}
        </div>
        <div className="relative h-[300px] min-w-0">
          <svg className="h-[265px] w-full overflow-visible" viewBox="0 0 680 265" preserveAspectRatio="none" aria-hidden="true">
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1="0"
                x2="680"
                y1={265 - (tick / 4500) * 265}
                y2={265 - (tick / 4500) * 265}
                className="stroke-nexoraBorder"
                strokeWidth="1"
              />
            ))}
            <polygon points={areaPoints} className="fill-nexoraBrand opacity-10" />
            <polyline points={linePoints} fill="none" className="stroke-nexoraBrand" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {chartPoints.map((point) => (
              <circle key={point.label} cx={point.x} cy={point.y} r="5.5" className="fill-nexoraSurface stroke-nexoraBrand" strokeWidth="3" />
            ))}
          </svg>
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-sm font-medium text-nexoraSubtle">
            {TIP_SERIES.map((point) => (
              <span key={point.label}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

function StaffLeaderboardPanel() {
  const rows = STAFF_PERFORMANCE.slice(0, 4)
  const avatarClasses = ['bg-nexoraBrand text-white', 'bg-indigo-500 text-white', 'bg-nexoraLavender text-white', 'bg-indigo-200 text-white']

  return (
    <Panel className="p-7">
      <h2 className="text-2xl font-bold text-nexoraText">Nail Tech Leaderboard</h2>
      <div className="mt-7 space-y-7">
        {rows.map((member, index) => (
          <div key={member.name} className="grid grid-cols-[48px_minmax(0,1fr)_88px_72px] items-center gap-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${avatarClasses[index]}`}>
              {member.name.split(' ').map((part) => part[0]).join('')}
            </span>
            <span className="truncate text-lg font-semibold text-nexoraText">{index === 2 ? 'Ashley P...' : index === 3 ? 'Hanna Ng...' : member.name}</span>
            <span className="text-lg font-bold text-nexoraText">{formatCurrency(member.tips)}</span>
            <span className="flex items-center gap-1 text-sm font-bold text-nexoraWarning">
              <Star className="h-4 w-4 fill-current" />
              {member.rating}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function TopTouchPointsPanel() {
  return (
    <Panel className="p-7">
      <h2 className="text-2xl font-bold text-nexoraText">Top Touch Points</h2>
      <div className="mt-8 space-y-0">
        {TOP_TOUCHPOINTS.slice(0, 3).map((point) => (
          <div key={point.name} className="grid grid-cols-[minmax(0,1fr)_74px_82px] items-center gap-3 border-b border-nexoraRule py-4 text-base last:border-0">
            <span className="font-medium leading-snug text-nexoraText">{point.name}</span>
            <span className="text-nexoraMuted">{point.scans.toLocaleString()} scans</span>
            <span className="font-medium text-nexoraSuccess">{point.conversion}% conv</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function ReviewRoutingPanel() {
  return (
    <Panel className="p-7">
      <h2 className="text-2xl font-bold text-nexoraText">Review Routing</h2>
      <div className="mt-8 space-y-4">
        <div className="flex h-14 items-center justify-between rounded-lg bg-nexoraBrandSoft px-5 text-base font-medium text-blue-700">
          <span>4-5* to Google/Yelp</span>
          <ArrowRight className="h-5 w-5" />
        </div>
        <div className="flex h-14 items-center justify-between rounded-lg bg-nexoraBrand px-5 text-base font-medium text-white">
          <span>1-3* private recovery</span>
          <ShieldAlert className="h-5 w-5" />
        </div>
        <p className="pt-2 text-sm font-medium leading-6 text-nexoraMuted">
          Protects public rating while still capturing service issues.
        </p>
      </div>
    </Panel>
  )
}

function LiveActivityPanel() {
  const activities = [
    { label: 'Station 03 scanned', time: '2:45 PM', tone: 'bg-nexoraBrand' },
    { label: 'VIP NFC tapped', time: '2:31 PM', tone: 'bg-nexoraWarning' },
    { label: '5* review routed', time: '2:28 PM', tone: 'bg-nexoraBrand' }
  ]

  return (
    <Panel className="p-7">
      <h2 className="text-2xl font-bold text-nexoraText">Live Activity</h2>
      <div className="mt-8 space-y-6">
        {activities.map((activity) => (
          <div key={activity.label} className="grid grid-cols-[14px_minmax(0,1fr)_64px] items-center gap-3 text-base">
            <span className={`h-2.5 w-2.5 rounded-full ${activity.tone}`} />
            <span className="font-medium text-nexoraText">{activity.label}</span>
            <span className="text-right text-sm font-semibold text-nexoraMuted">{activity.time}</span>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Overview({ metrics }) {
  return (
    <div className="space-y-8">
      <PageTitle />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Total Tips" value={formatCurrency(metrics.totalTips)} delta="18.6%" tone="brand" />
        <KpiCard label="QR/NFC Scans" value={metrics.scans.toLocaleString()} delta="12.3%" tone="teal" />
        <KpiCard label="Reviews" value={metrics.totalReviews.toString()} delta="9.7%" tone="warning" />
        <KpiCard label="Avg Rating" value={metrics.averageRating} delta="0.15" tone="danger" />
        <KpiCard label="Conversion" value={`${metrics.conversion}%`} delta="2.1%" tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)]">
        <TipsOverTimePanel />
        <StaffLeaderboardPanel />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TopTouchPointsPanel />
        <ReviewRoutingPanel />
        <LiveActivityPanel />
      </div>
    </div>
  )
}

function StaffView({ staff, onAdd, onEdit, onDelete, onQr, onToggle }) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">Staff Directory</h2>
          <p className="mt-1 text-xs text-nexoraMuted">Active staff appears in the customer tip flow; inactive personal QR is blocked.</p>
        </div>
        <button onClick={onAdd} className="inline-flex h-9 items-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white">
          <Plus className="h-4 w-4" />
          Add Staff
        </button>
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white">
        <div className="grid grid-cols-[2fr_1.1fr_1.6fr_1fr_118px] gap-3 border-b border-nexoraRule px-5 py-3 text-[10px] font-extrabold uppercase text-nexoraMuted">
          <span>Name / Position</span>
          <span>Public Nickname</span>
          <span>Linked Wallets</span>
          <span>Status</span>
          <span className="text-right">Actions</span>
        </div>
        {staff.map((member) => {
          const wallets = walletLabels(member.paymentAccounts)
          return (
            <div key={member.id} className="grid grid-cols-1 gap-3 border-b border-nexoraRule px-5 py-4 text-sm last:border-0 lg:grid-cols-[2fr_1.1fr_1.6fr_1fr_118px] lg:items-center">
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-sm font-extrabold text-rose-600">
                    {member.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-extrabold text-nexoraText">{member.fullName}</div>
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
                {member.isActive ? 'Active' : 'Inactive'}
              </button>
              <div className="flex justify-end gap-1.5">
                <IconButton label="Preview QR" onClick={() => onQr(member)}>
                  <QrCode className="h-4 w-4" />
                </IconButton>
                <IconButton label="Edit staff" onClick={() => onEdit(member)}>
                  <Edit2 className="h-4 w-4" />
                </IconButton>
                <IconButton label="Delete staff" onClick={() => onDelete(member.id)} className="hover:text-rose-600">
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
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">Touch Points</h2>
        <p className="mt-1 text-xs text-nexoraMuted">Manage salon QR/NFC placements for stations, front desk, receipts, and staff QR.</p>
      </div>
      <Panel className="p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            value={newTouchpoint.name}
            onChange={(event) => setNewTouchpoint({ ...newTouchpoint, name: event.target.value })}
            placeholder="Pedicure Chair 04"
            className="h-10 rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand"
          />
          <select
            value={newTouchpoint.type}
            onChange={(event) => setNewTouchpoint({ ...newTouchpoint, type: event.target.value })}
            className="h-10 rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand"
          >
            <option>Table QR</option>
            <option>Front Desk</option>
            <option>Receipt QR</option>
            <option>Business Main</option>
            <option>Staff QR</option>
          </select>
          <button onClick={onAdd} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white">
            <Plus className="h-4 w-4" />
            Add
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
              <IconButton label="Delete touch point" onClick={() => onDelete(point.id)} className="hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
            <button onClick={() => onQr(point)} className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold text-nexoraBrand">
              <QrCode className="h-4 w-4" />
              View QR design
            </button>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function ReviewsView({ reviews, staff, filter, setFilter }) {
  const filtered = filter === 'all' ? reviews : reviews.filter((review) => review.staffId === filter)

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">Review Routing Logs</h2>
          <p className="mt-1 text-xs text-nexoraMuted">4-5 star reviews route to Google/Yelp; 1-3 star feedback stays private.</p>
        </div>
        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-9 rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-semibold text-nexoraText outline-none">
          <option value="all">All staff</option>
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
                  <span className="text-sm font-extrabold text-nexoraText">{review.rating}.0*</span>
                  <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${review.rating >= 4 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{review.category}</span>
                </div>
                <p className="mt-2 text-sm text-nexoraText">{review.comment}</p>
                <p className="mt-2 text-xs text-nexoraMuted">{review.staffName} - {review.date}</p>
              </div>
              <span className="text-xs font-bold text-nexoraBrand">{review.rating >= 4 ? 'Public route' : 'Private recovery'}</span>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  )
}

function ReportsView({ transactions }) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">Tip Reports</h2>
        <p className="mt-1 text-xs text-nexoraMuted">Transaction ledger for direct wallet routing and payroll reconciliation.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[780px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Touch Point</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Status</th>
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
          Back to overview
        </button>
      </div>
    </div>
  )
}

function StaffModal({ open, editing, form, errors, setForm, onClose, onSave }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-lg font-extrabold text-nexoraText">{editing ? 'Edit staff member' : 'Add staff member'}</h2>
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
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Full name *</label>
            <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Mia Tran" />
            {errors.fullName && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.fullName}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Public nickname *</label>
              <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.nickname} onChange={(event) => setForm({ ...form, nickname: event.target.value })} placeholder="Mia T." />
              {errors.nickname && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.nickname}</p>}
            </div>
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Position</label>
              <input className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder px-3 text-sm outline-none focus:border-nexoraBrand" value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} placeholder="Nail Tech" />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">Direct payment wallets</label>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.venmo} onChange={(event) => setForm({ ...form, venmo: event.target.value })} placeholder="Venmo @handle" />
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.cashapp} onChange={(event) => setForm({ ...form, cashapp: event.target.value })} placeholder="Cash App $cashtag" />
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.zelle} onChange={(event) => setForm({ ...form, zelle: event.target.value })} placeholder="Zelle phone/email" />
              <input className="h-9 rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand" value={form.vlinkpay} onChange={(event) => setForm({ ...form, vlinkpay: event.target.value })} placeholder="VLinkPay ID" />
            </div>
            {errors.payment && <p className="mt-2 flex items-center gap-1 text-xs font-bold text-rose-600"><AlertTriangle className="h-3.5 w-3.5" />{errors.payment}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          <button onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted">Cancel</button>
          <button onClick={onSave} className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white">Save</button>
        </div>
      </div>
    </div>
  )
}

function QrModal({ target, businessName, onClose }) {
  if (!target) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 text-center shadow-2xl">
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
          <div className="grid h-24 w-24 grid-cols-5 gap-1 rounded-lg bg-white p-2">
            {Array.from({ length: 25 }).map((_, index) => (
              <span key={index} className={`rounded-sm ${[0, 1, 5, 6, 4, 9, 20, 21, 24, 12, 14, 17].includes(index) ? 'bg-nexoraText' : 'bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-300">
            <Scissors className="h-3 w-3 text-rose-200" />
            Secure redirect by VLinkPay
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-nexoraCanvas px-3 py-2 text-[10px] font-mono text-nexoraMuted">
          nexora.vlinkpay.com/touch/{target.slug}
        </p>
        <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white">
          <Download className="h-4 w-4" />
          Download print design
        </button>
      </div>
    </div>
  )
}

export default function Dashboard({ setupData }) {
  const [activeMenu, setActiveMenu] = useState('overview')
  const [staff, setStaff] = useState(INITIAL_STAFF)
  const [transactions] = useState(INITIAL_TRANSACTIONS)
  const [reviews] = useState(INITIAL_REVIEWS)
  const [touchpoints, setTouchpoints] = useState(INITIAL_TOUCHPOINTS)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [qrTarget, setQrTarget] = useState(null)
  const [reviewFilterStaff, setReviewFilterStaff] = useState('all')
  const [newTouchpoint, setNewTouchpoint] = useState({ name: '', type: 'Table QR' })
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

  const renderContent = () => {
    if (activeMenu === 'overview') return <Overview metrics={metrics} />
    if (activeMenu === 'staff') return <StaffView staff={staff} onAdd={openAddStaff} onEdit={openEditStaff} onDelete={deleteStaff} onQr={previewQr} onToggle={toggleStaff} />
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-80 flex-col bg-nexoraSidebar py-9 lg:flex">
        {/* Logo and Header */}
        <div className="px-8 pb-11">
          <div className="flex items-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-nexoraBrand text-xl font-black text-white">N</div>
            <div className="ml-4">
              <div className="text-3xl font-extrabold leading-none tracking-normal text-white">Nexora</div>
              <div className="mt-2 text-base font-medium tracking-wide text-white/65">Admin Console</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-3 px-5">
          {MENU_ITEMS.map(({ id, label, icon: Icon }) => {
            const isActive = activeMenu === id
            return (
              <button
                key={id}
                onClick={() => setActiveMenu(id)}
                className={`flex h-[60px] w-full items-center gap-4 rounded-lg px-6 text-left text-xl font-medium transition duration-200 ${
                  isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? 'text-white' : 'text-white/70'}`} />
                {label}
              </button>
            )
          })}
        </nav>

        {/* Bottom Area */}
        <div className="mt-auto space-y-5 px-5">
          {/* Profile Card */}
          <div className="nexora-sidebar-panel flex items-center gap-3 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-nexoraSidebar text-base font-extrabold text-white ring-1 ring-white/10">
              {businessName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-base font-bold text-white">{businessName}</div>
              <div className="text-sm text-white/60">Owner</div>
            </div>
          </div>

          {/* Current Plan Card */}
          <div className="nexora-sidebar-panel space-y-4 p-5">
            <div>
              <div className="text-xs font-bold tracking-widest text-white/60">CURRENT PLAN</div>
              <div className="mt-2 text-base font-extrabold text-white">Pro Plan</div>
              <div className="mt-1 text-sm text-white/60">Renews on Jun 20, 2024</div>
            </div>
            <button className="flex h-10 w-full items-center justify-center rounded-lg border border-white/20 text-sm font-bold text-nexoraWarning transition-colors hover:bg-white/5">
              Manage Plan
            </button>
          </div>

          {/* Sign Out Button */}
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white/70 transition-colors hover:text-white">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-80">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-nexoraBorder bg-nexoraSurface px-4 py-3 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nexoraBrand text-base font-extrabold text-white">N</div>
            <span className="text-sm font-extrabold">NEXORA TOUCH</span>
          </div>
          <select value={activeMenu} onChange={(event) => setActiveMenu(event.target.value)} className="rounded-lg border border-nexoraBorder px-2 py-1 text-xs font-bold">
            {MENU_ITEMS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </div>
        <DashboardHeader />

        <main className="min-h-screen p-4 sm:p-6 lg:p-8">
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
