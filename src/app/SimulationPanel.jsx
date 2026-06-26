import React from 'react'
import { Activity, ChevronRight } from 'lucide-react'

export default function SimulationPanel({
  currentLanguage,
  simStatus,
  setSimStatus,
  pendingAccounts,
  onTriggerSimulation,
  onToggleAccountVerification,
  onDeleteSimulatedAccount,
  onAutoLogin,
}) {
  return (
    <div className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-8 border border-nexoraBorder shadow-premium flex flex-col justify-between relative overflow-hidden">
      <div className="space-y-4">
        <div className="border-b border-nexoraBorder pb-3">
          <h3 className="text-sm font-extrabold text-nexoraText flex items-center gap-2">
            <Activity className="w-4 h-4 text-nexoraBrand" />
            {currentLanguage === 'vi' ? 'TRÌNH GIẢ LẬP KỊCH BẢN' : 'SIMULATION FLOW CONTROLLER'}
          </h3>
          <p className="text-[10px] text-nexoraSubtle mt-1">
            {currentLanguage === 'vi'
              ? 'Chọn kịch bản để kiểm tra phân luồng Onboarding và đăng ký (Flow 1 & 2):'
              : 'Trigger simulation cases to test the onboarding and register branches (Flow 1 & 2):'
            }
          </p>
        </div>

        <div className="space-y-2.5">
          {/* Scenario 0: Customer Tips Demo */}
          <button
            onClick={() => window.location.href = '/tip-flow.html'}
            className="w-full text-left p-3 rounded-xl border-2 border-nexoraBrand bg-nexoraBrandSoft/10 hover:bg-nexoraBrandSoft/30 transition flex items-start gap-3 group"
          >
            <span className="h-6 w-6 rounded-lg bg-nexoraBrand text-white flex items-center justify-center font-bold text-xs shrink-0">✨</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-nexoraBrand flex items-center gap-1.5">
                {currentLanguage === 'vi' ? 'Trải nghiệm Flow Tip Dành Cho Khách Hàng' : 'Customer Tips Flow Experience'}
                <ChevronRight className="w-3 h-3 text-nexoraBrand group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[9px] text-slate-600 mt-0.5 font-medium">
                {currentLanguage === 'vi'
                  ? 'Mở giao diện khách hàng (End-user) quét mã QR, chia Tip và đánh giá dịch vụ.'
                  : 'Open the end-user interface for scanning QR codes, splitting tips, and reviewing service.'
                }
              </p>
            </div>
          </button>

          {/* Scenario 1: SSO with KYB */}
          <button
            onClick={() => onTriggerSimulation('sso_with_kyb')}
            className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
          >
            <span className="h-6 w-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-xs text-indigo-600 shrink-0">1</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                {currentLanguage === 'vi' ? 'Đã có KYB (SSO)' : 'Already has KYB (SSO)'}
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {currentLanguage === 'vi'
                  ? 'Đăng nhập SSO -> Tự điền Step 1 và vào flow setup thợ & QR/NFC như cũ.'
                  : 'SSO Login -> Auto-fills Step 1 and enters the staff & QR/NFC setup flow (as before).'
                }
              </p>
            </div>
          </button>

          {/* Scenario 2: SSO without KYB */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl border border-nexoraBorder bg-slate-50">
            <div className="flex items-start gap-3">
              <span className="h-6 w-6 rounded-lg bg-pink-50 border border-pink-100 flex items-center justify-center font-bold text-xs text-pink-600 shrink-0">2</span>
              <div className="min-w-0 flex-grow">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>{currentLanguage === 'vi' ? 'Chưa có KYB (SSO)' : 'No KYB yet (SSO)'}</span>
                  <button
                    onClick={() => onTriggerSimulation('sso_no_kyb', simStatus)}
                    className="px-2 py-0.5 bg-nexoraBrand text-white rounded text-[9px] font-bold uppercase hover:bg-opacity-95"
                  >
                    {currentLanguage === 'vi' ? 'Đăng nhập' : 'Login'}
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {currentLanguage === 'vi'
                    ? 'Chọn trạng thái để bắt đầu luồng tương ứng:'
                    : 'Select verification status to initiate the flow:'}
                </p>

                <select
                  value={simStatus}
                  onChange={(e) => setSimStatus(e.target.value)}
                  className="mt-2 w-full bg-white border border-nexoraBorder rounded px-2 py-1 text-xs text-slate-700 outline-none focus:border-nexoraBrand"
                >
                  <option value="basic">basic (unverified)</option>
                  <option value="lite_pending">lite_pending</option>
                  <option value="verified_lite">verified_lite</option>
                  <option value="kyb_required">kyb_required</option>
                  <option value="kyb_pending">kyb_pending</option>
                  <option value="kyb_approved">kyb_approved (verified)</option>
                  <option value="suspended">suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Scenario 3: New Register */}
          <button
            onClick={() => onTriggerSimulation('new_register')}
            className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
          >
            <span className="h-6 w-6 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center font-bold text-xs text-emerald-600 shrink-0">3</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                {currentLanguage === 'vi' ? 'Chưa có tài khoản (Đăng ký mới)' : 'No Account (New Register)'}
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {currentLanguage === 'vi'
                  ? 'Đăng ký mới -> Hiển thị Step 1 đăng ký mới, đăng nhập trực tiếp sau khi hoàn tất dưới dạng chưa KYB.'
                  : 'New Register -> Shows Step 1, logs in directly after completion as a no-KYB account.'
                }
              </p>
            </div>
          </button>

          {/* Scenario 4: Staff Portal Setup */}
          <button
            onClick={() => onTriggerSimulation('staff_portal')}
            className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
          >
            <span className="h-6 w-6 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center font-bold text-xs text-amber-600 shrink-0">4</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                {currentLanguage === 'vi' ? 'Giả lập Staff Setup Portal' : 'Simulate Staff Setup Portal'}
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {currentLanguage === 'vi'
                  ? 'Mở trực tiếp luồng đăng ký & cài đặt ví cho nhân viên Lisa Tran.'
                  : 'Directly opens the registration & wallet setup flow for technician Lisa Tran.'
                }
              </p>
            </div>
          </button>

          {/* Scenario 5: Staff Personal Dashboard */}
          <button
            onClick={() => onTriggerSimulation('staff_dashboard')}
            className="w-full text-left p-3 rounded-xl border border-nexoraBorder hover:border-nexoraBrand bg-slate-50 hover:bg-nexoraBrandSoft/10 transition flex items-start gap-3 group"
          >
            <span className="h-6 w-6 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center font-bold text-xs text-sky-600 shrink-0">5</span>
            <div className="min-w-0">
              <div className="text-xs font-bold text-slate-800 group-hover:text-nexoraBrand flex items-center gap-1.5">
                {currentLanguage === 'vi' ? 'Đăng nhập Staff (Dashboard cá nhân)' : 'Staff Login (Personal Dashboard)'}
                <ChevronRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[9px] text-slate-500 mt-0.5">
                {currentLanguage === 'vi'
                  ? 'Mở dashboard cá nhân của nhân viên (cờ !personal) để tự quản lý tips, ví, QR, hồ sơ.'
                  : 'Open the staff personal dashboard (!personal flag) to self-manage tips, payouts, QR, profile.'
                }
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Real Registered Database Simulation inside UI */}
      <div className="pt-4 border-t border-slate-100 mt-4 space-y-2 flex-grow flex flex-col justify-end">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
          {currentLanguage === 'vi' ? 'CƠ SỞ DỮ LIỆU TÀI KHOẢN GIẢ LẬP' : 'SIMULATED ACCOUNTS DATABASE'}
        </h4>

        {pendingAccounts.length === 0 ? (
          <div className="p-3 border border-dashed border-slate-200 rounded-xl text-center text-[10px] text-slate-400">
            {currentLanguage === 'vi' ? 'Chưa có tài khoản đăng ký tùy chỉnh' : 'No custom registered accounts yet'}
          </div>
        ) : (
          <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
            {pendingAccounts.map((acc, index) => (
              <div key={index} className="p-2 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between gap-2 text-[10px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="font-mono font-bold truncate text-slate-700 max-w-[110px]" title={acc.email}>{acc.email}</div>
                    <span className={`px-1 py-0.2 rounded text-[7px] font-extrabold uppercase shrink-0
                      ${acc.role === 'personal' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}
                    >
                      {acc.role || 'business'}
                    </span>
                  </div>
                  <div className="text-[9px] flex flex-wrap items-center gap-1 mt-0.5">
                    <span className="font-semibold">{currentLanguage === 'vi' ? 'Mật khẩu:' : 'Pass:'} {acc.password}</span>
                    <span>•</span>
                    <span className="font-bold text-indigo-600">
                      {acc.role === 'personal' ? 'active' : (acc.verificationStatus || (acc.isVerified ? 'kyb_approved' : 'basic'))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onAutoLogin(acc.email, acc.password)}
                    className="px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all bg-nexoraBrand text-white hover:bg-nexoraBrandDark"
                    title="Auto Login"
                  >
                    LOGIN
                  </button>
                  {acc.role !== 'personal' && (
                    <button
                      onClick={() => onToggleAccountVerification(acc.email)}
                      className="px-1.5 py-0.5 rounded text-[8px] font-extrabold transition-all border bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      title="Cycle verification status"
                    >
                      CYCLE
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteSimulatedAccount(acc.email)}
                    className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded border border-red-200"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
