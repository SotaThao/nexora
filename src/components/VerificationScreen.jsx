import React, { useState } from 'react'
import { ShieldAlert, RefreshCw, LogOut, CheckCircle } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import httpClient from '../lib/httpClient'

export default function VerificationScreen({ onLogout, onVerifySuccess }) {
  const { session, refreshSession, logout } = useAuth()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [error, setError] = useState('')

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setError('')
    try {
      const newSession = await refreshSession()
      if (newSession && newSession.verificationStatus === 'kyb_approved') {
        if (onVerifySuccess) {
          onVerifySuccess(newSession)
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to refresh verification status.')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSimulateApproval = async () => {
    setIsSimulating(true)
    setError('')
    try {
      // Post to the simulation endpoint to auto-approve the merchant KYB status
      await httpClient.post('/api/v1/authentication/simulate-kyb-approval', {
        email: session?.email
      }, { anonymous: true })

      // Refresh session state to fetch updated profile status
      const newSession = await refreshSession()
      if (newSession && newSession.verificationStatus === 'kyb_approved') {
        if (onVerifySuccess) {
          onVerifySuccess(newSession)
        }
      }
    } catch (err) {
      setError(err.message || 'Simulation failed.')
    } finally {
      setIsSimulating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      if (onLogout) {
        onLogout()
      }
    } catch (err) {
      setError('Logout failed')
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas text-nexoraText font-sans p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 h-56 w-56 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(66,72,216,0.04)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-96 sm:w-96"></div>
      <div className="absolute bottom-1/4 right-1/4 h-64 w-64 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(43,89,255,0.02)] via-transparent to-transparent blur-3xl pointer-events-none sm:h-[450px] sm:w-[450px]"></div>

      <div className="max-w-md w-full bg-white rounded-2xl border border-nexoraBorder shadow-premium p-6 relative overflow-hidden text-center space-y-6">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[rgba(70,72,216,0.03)] via-transparent to-transparent rounded-full pointer-events-none"></div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 mx-auto shrink-0 shadow-sm border border-amber-100">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-nexoraText">Account Verification Status</h2>
          <p className="text-xs text-nexoraSubtle">
            Your account is registered but requires KYB verification to access the dashboard.
          </p>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-nexoraBorder text-left space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-nexoraSubtle">Registered Email:</span>
            <span className="font-semibold text-slate-700">{session?.email}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-nexoraSubtle">Verification Status:</span>
            <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 uppercase text-[9px] tracking-wider">
              {session?.verificationStatus || 'Pending'}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 text-center font-medium">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isSimulating}
            className="w-full min-h-11 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 shadow-[0_4px_12px_rgba(43,89,255,0.25)] transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>

          <button
            onClick={handleSimulateApproval}
            disabled={isRefreshing || isSimulating}
            className="w-full min-h-11 py-2.5 border border-dashed border-nexoraBrand/40 hover:bg-nexoraBrandSoft/20 disabled:opacity-50 text-nexoraBrand font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            Verify Account Instantly (Simulate Auto-Approve)
          </button>

          <button
            onClick={handleLogout}
            className="w-full min-h-11 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle hover:text-nexoraText font-semibold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
