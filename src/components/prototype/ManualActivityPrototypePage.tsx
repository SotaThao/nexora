import React, { useState } from 'react'
import {
  DollarSign,
  Calendar,
  CreditCard,
  QrCode,
  Smartphone,
  Monitor,
  CheckCircle2,
  Sparkles,
  Plus,
  User,
} from 'lucide-react'
import ManualActivityModal from '../dashboard/modals/ManualActivityModal'
import { useNotification } from '../../contexts/NotificationContext'

interface ActivityItem {
  id: string
  amount: number
  paymentMethod: string
  dateTime: string
  staffName?: string
  note?: string
  isManual: boolean
  type: 'payment' | 'tip'
}

const INITIAL_ACTIVITIES: ActivityItem[] = [
  {
    id: 'tx-101',
    amount: 85.0,
    paymentMethod: 'Zelle',
    dateTime: '2026-08-26 14:30',
    staffName: 'GodLai',
    note: 'Manicure & Pedicure combo direct transfer',
    isManual: true,
    type: 'payment',
  },
  {
    id: 'tx-102',
    amount: 15.0,
    paymentMethod: 'Venmo',
    dateTime: '2026-08-26 14:35',
    staffName: 'GodLai',
    note: 'Tip given for nail art design',
    isManual: true,
    type: 'tip',
  },
  {
    id: 'tx-103',
    amount: 120.0,
    paymentMethod: 'Cash App',
    dateTime: '2026-08-26 12:15',
    staffName: 'Lisa Nguyen',
    note: 'Full set acrylic nails',
    isManual: true,
    type: 'payment',
  },
]

export default function ManualActivityPrototypePage() {
  const { showToast } = useNotification()
  const [activeTab, setActiveTab] = useState<'mobile_overview' | 'desktop_overview' | 'tips_tab' | 'payment_tab'>('mobile_overview')
  const [modalMode, setModalMode] = useState<'payment' | 'tip' | null>(null)
  const [isNavQuickAddOpen, setIsNavQuickAddOpen] = useState(false)
  const [activities, setActivities] = useState<ActivityItem[]>(INITIAL_ACTIVITIES)

  const staffList = [
    { id: 'staff-1', nickname: 'GodLai', fullName: 'GodLai Master Tech' },
    { id: 'staff-2', nickname: 'Lisa Nguyen', fullName: 'Lisa Nguyen' },
    { id: 'staff-3', nickname: 'Sarah Tran', fullName: 'Sarah Tran' },
  ]

  const handleSaveActivity = (data: {
    amount: number
    paymentMethod: string
    dateTime: string
    staffName?: string
    note?: string
    isManual: boolean
  }) => {
    const newActivity: ActivityItem = {
      id: `tx-${Date.now().toString().slice(-4)}`,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      dateTime: data.dateTime,
      staffName: data.staffName || (modalMode === 'tip' ? 'GodLai' : '—'),
      note: data.note,
      isManual: true,
      type: modalMode === 'tip' ? 'tip' : 'payment',
    }

    setActivities((prev) => [newActivity, ...prev])
    showToast(
      modalMode === 'tip'
        ? `Đã ghi nhận tiền tip $${data.amount.toFixed(2)} cho ${newActivity.staffName}!`
        : `Đã ghi nhận thanh toán $${data.amount.toFixed(2)} thành công!`,
      'success'
    )
    setModalMode(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans pb-16">
      {/* Top Banner for PO / Stakeholders */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-indigo-500/20 px-4 py-3 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 text-white font-black shadow-lg shadow-indigo-500/30">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Nexora Touch — US-109 Prototype Showcase
                </h1>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
                  Ready for PO Review
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Giao diện ghi nhận thanh toán & tip thủ công (Mobile & Desktop)
              </p>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalMode('payment')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95 transition shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Test Add Payment</span>
            </button>

            <button
              type="button"
              onClick={() => setModalMode('tip')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 active:scale-95 transition shadow-sm cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Test Add Tips</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs for 4 Key Views */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex overflow-x-auto gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800 w-fit max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('mobile_overview')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mobile_overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Smartphone className="h-4 w-4" />
            <span>1. Mobile Overview (2 QR + Bottom Nav +)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('desktop_overview')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'desktop_overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Monitor className="h-4 w-4" />
            <span>2. Desktop Overview (Calendar Row)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tips_tab')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'tips_tab'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>3. Tips Tab (Add Tips Button)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('payment_tab')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'payment_tab'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            <span>4. Payment Activity Tab (Add Payment Button)</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {/* VIEW 1: Mobile Dashboard Overview */}
        {activeTab === 'mobile_overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Mobile Device Frame */}
            <div className="lg:col-span-6 flex justify-center">
              <div className="w-[375px] h-[780px] bg-slate-50 text-slate-900 rounded-[40px] shadow-2xl border-[8px] border-slate-800 overflow-hidden flex flex-col relative">
                {/* Mobile Header Bar */}
                <div className="bg-white px-5 pt-3 pb-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                      N
                    </div>
                    <span className="font-extrabold text-sm text-slate-800">NailTech Spa</span>
                  </div>
                  <span className="rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0.5 border border-emerald-200">
                    Live
                  </span>
                </div>

                {/* Mobile Scrollable Screen Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
                  {/* First View: 2 Smart QR Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Pay Shop QR */}
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/90 to-white p-3 shadow-sm flex flex-col items-center text-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white mb-1.5 shadow-sm">
                        <QrCode className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-slate-800">Pay Salon</span>
                      <span className="text-[10px] text-slate-500">Shop Direct QR</span>
                    </div>

                    {/* Tip Staff QR */}
                    <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/90 to-white p-3 shadow-sm flex flex-col items-center text-center">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 text-white mb-1.5 shadow-sm">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-slate-800">Tip Tech</span>
                      <span className="text-[10px] text-slate-500">Staff Gratuity QR</span>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Direct Payments
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-1 block">$629.33</span>
                      <span className="text-[10px] text-slate-500">10 transactions</span>
                    </div>

                    <div className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Total Tips
                      </span>
                      <span className="text-lg font-black text-indigo-600 mt-1 block">$345.00</span>
                      <span className="text-[10px] text-slate-500">23 tips collected</span>
                    </div>
                  </div>

                  {/* Recent Activity List */}
                  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800">Recent Activity</span>
                      <span className="text-[10px] font-bold text-indigo-600">Live feed</span>
                    </div>

                    <div className="space-y-2">
                      {activities.slice(0, 3).map((act) => (
                        <div
                          key={act.id}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase ${
                                act.type === 'payment'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-indigo-100 text-indigo-800'
                              }`}
                            >
                              {act.type}
                            </span>
                            <span className="font-bold text-slate-700">{act.paymentMethod}</span>
                          </div>
                          <span className="font-black text-slate-900">${act.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Navbar with Center '+' Button */}
                <div className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around z-30">
                  <div className="flex flex-col items-center text-[10px] font-bold text-indigo-600">
                    <Smartphone className="h-4 w-4" />
                    <span>Home</span>
                  </div>

                  <div className="flex flex-col items-center text-[10px] font-bold text-slate-400">
                    <User className="h-4 w-4" />
                    <span>Staff</span>
                  </div>

                  {/* Elevated Center '+' Button */}
                  <div className="relative -top-3">
                    <button
                      type="button"
                      data-testid="prototype-mobile-add-btn"
                      onClick={() => setIsNavQuickAddOpen(!isNavQuickAddOpen)}
                      className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl transition-all cursor-pointer ${
                        isNavQuickAddOpen
                          ? 'bg-slate-900 rotate-45 ring-4 ring-indigo-300'
                          : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                      }`}
                    >
                      <Plus className="h-6 w-6" />
                    </button>

                    {/* 1-Row 2-Col Text-Only Popup */}
                    {isNavQuickAddOpen && (
                      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-[260px] rounded-2xl bg-white border border-slate-200 p-2 shadow-2xl z-40 animate-fadeIn">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsNavQuickAddOpen(false)
                              setModalMode('payment')
                            }}
                            className="flex h-11 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/90 text-center text-xs font-black text-emerald-800 active:scale-95 transition hover:bg-emerald-100 shadow-sm cursor-pointer"
                          >
                            Add Payment
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsNavQuickAddOpen(false)
                              setModalMode('tip')
                            }}
                            className="flex h-11 items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50/90 text-center text-xs font-black text-indigo-800 active:scale-95 transition hover:bg-indigo-100 shadow-sm cursor-pointer"
                          >
                            Add Tips
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-[10px] font-bold text-slate-400">
                    <DollarSign className="h-4 w-4" />
                    <span>Tips</span>
                  </div>

                  <div className="flex flex-col items-center text-[10px] font-bold text-slate-400">
                    <QrCode className="h-4 w-4" />
                    <span>QR</span>
                  </div>
                </div>
              </div>
            </div>

            {/* PO Documentation & Design Highlights */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-3xl bg-slate-950 p-6 border border-slate-800">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Điểm nổi bật trên Mobile Overview</span>
                </div>
                <ul className="space-y-3 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>First View hiển thị 2 QR Code:</strong> 1 QR thanh toán trực tiếp của tiệm (`Pay Salon`) và 1 QR tip cho nhân viên (`Tip Tech`).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Nút `+` ở thanh Bottom Navigation:</strong> Bấm mở popover 1 hàng 2 cột gồm <strong>Add Payment</strong> và <strong>Add Tips</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Chuẩn Text-only:</strong> Không icon thừa, tối giản, trực quan.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Desktop Dashboard Overview */}
        {activeTab === 'desktop_overview' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">DASHBOARD OVERVIEW</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Welcome back, NailTech Salon Owner</p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      data-testid="desktop-add-payment-btn"
                      onClick={() => setModalMode('payment')}
                      className="flex h-9 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 text-xs font-extrabold text-emerald-800 hover:bg-emerald-100 active:scale-95 transition shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Add Payment
                    </button>

                    <button
                      type="button"
                      data-testid="desktop-add-tip-btn"
                      onClick={() => setModalMode('tip')}
                      className="flex h-9 items-center justify-center rounded-xl border border-indigo-300 bg-indigo-50 px-3.5 text-xs font-extrabold text-indigo-800 hover:bg-indigo-100 active:scale-95 transition shadow-sm cursor-pointer whitespace-nowrap"
                    >
                      Add Tips
                    </button>
                  </div>

                  <div className="flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span>Aug 01, 2026 - Aug 26, 2026</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">$4,850.00</span>
                  <span className="text-xs text-emerald-600 font-bold mt-1 block">↑ 14.2% vs last month</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Direct QR Payments</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">$1,629.33</span>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">34 transactions</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff Tips Collected</span>
                  <span className="text-2xl font-black text-indigo-600 block mt-1">$890.00</span>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">Avg. $12.50 / tech</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Staff</span>
                  <span className="text-2xl font-black text-slate-900 block mt-1">6 Techs</span>
                  <span className="text-xs text-slate-500 font-medium mt-1 block">100% QR active</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: Tips Tab Screen */}
        {activeTab === 'tips_tab' && (
          <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Transactions</h2>
                <p className="mt-0.5 text-xs text-slate-500">Recent Tip Transactions</p>
              </div>

              <button
                type="button"
                data-testid="prototype-tips-add-btn"
                onClick={() => setModalMode('tip')}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-xs font-black text-white hover:bg-indigo-700 active:scale-95 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                Add Tips
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.filter((a) => a.type === 'tip').map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-500">{a.id}</td>
                      <td className="py-3 px-4">{a.dateTime}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{a.staffName}</td>
                      <td className="py-3 px-4">{a.paymentMethod}</td>
                      <td className="py-3 px-4 font-black text-indigo-600">${a.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                          Manual
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW 4: Payment Activity Tab Screen */}
        {activeTab === 'payment_tab' && (
          <div className="rounded-3xl bg-white text-slate-900 p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Payment Activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">Direct & manual payment activity log</p>
              </div>

              <button
                type="button"
                data-testid="prototype-payment-add-btn"
                onClick={() => setModalMode('payment')}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 active:scale-95 transition shadow-sm cursor-pointer whitespace-nowrap"
              >
                Add Payment
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activities.filter((a) => a.type === 'payment').map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono text-slate-500">{a.id}</td>
                      <td className="py-3 px-4">{a.dateTime}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{a.paymentMethod}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">${a.amount.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          Confirmed
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
                          Manual
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Reusable Modal Form */}
      {modalMode && (
        <ManualActivityModal
          open={Boolean(modalMode)}
          mode={modalMode}
          staffList={staffList}
          onClose={() => setModalMode(null)}
          onSave={handleSaveActivity}
        />
      )}
    </div>
  )
}
